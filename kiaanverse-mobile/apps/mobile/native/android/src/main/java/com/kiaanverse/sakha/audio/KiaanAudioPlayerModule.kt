/**
 * KiaanAudioPlayerModule — TurboModule wrapping AndroidX Media3 ExoPlayer.
 *
 * Owns the playback half of the Sakha voice WSS pipeline. The WSS handler
 * streams `audio.chunk` frames; the JS hook (`useStreamingPlayer` in Part 9)
 * decodes them from base64 and hands the bytes to this module via
 * appendChunk(). Each chunk lands in a ConcatenatingMediaSource so playback
 * begins as soon as the first chunk arrives — meeting the spec's
 * first-audio-byte budget (≤ 1.2s on cache miss, ≤ 500ms on cache hit).
 *
 * Architecture:
 *
 *   JS (useStreamingPlayer)
 *      │
 *      │ appendChunk(seq, base64Opus)  ← Promise<void>
 *      ▼
 *   KiaanAudioPlayerModule (this file)
 *      │
 *      │ writes Opus bytes to a per-session File (one per chunk)
 *      │ wraps File in ProgressiveMediaSource
 *      │ adds to ConcatenatingMediaSource
 *      ▼
 *   ExoPlayer (AndroidX Media3) — content-type SPEECH, usage
 *   ASSISTANCE_SONIFICATION, focus GAIN_TRANSIENT_MAY_DUCK
 *      │
 *      │ Visualizer #getWaveForm() at 60Hz
 *      ▼
 *   onAudioLevel(rms) event → Shankha sound-wave amplitude
 *
 * State events to JS:
 *   • onPlaybackStateChanged({ state: "idle" | "buffering" | "ready" | "ended" })
 *   • onAudioLevel({ rms: 0.0 .. 1.0 })   60Hz during playback
 *   • onCrossfade({ from_seq, to_seq })   30ms crossfade marker
 *
 * Audio attributes are read from the manifest meta-data the
 * `withKiaanAudioFocus` Expo plugin injected, so the player, foreground
 * service, and notification all share one source of truth.
 *
 * Threading:
 *   • All ExoPlayer calls run on the Looper main thread (ExoPlayer's
 *     contract). The module's @ReactMethod methods bridge from the RN
 *     bridge thread to main via Handler(Looper.getMainLooper()).
 *   • The Visualizer callback fires on its own thread; we marshal the
 *     RMS event back to the JS side via the bridge.
 *   • base64 decoding happens on the bridge thread (not main) so a
 *     50ms decode of a large chunk never stalls the audio pipeline.
 */

package com.kiaanverse.sakha.audio

import android.content.Context
import android.media.audiofx.Visualizer
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.ConcatenatingMediaSource
import androidx.media3.exoplayer.source.ProgressiveMediaSource
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.FileOutputStream
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.math.min
import kotlin.math.sqrt

/**
 * RMS smoothing window — 80ms moving average per spec.
 * At 60Hz capture rate, that's 5 samples. The Shankha sound-wave
 * animation in Part 10 reads .rms directly so jitter would feel like
 * the conch is breathing erratically.
 */
private const val RMS_SMOOTHING_WINDOW_SAMPLES = 5
private const val RMS_EMIT_HZ = 60
private const val RMS_EMIT_INTERVAL_MS = 1000L / RMS_EMIT_HZ
private const val FADE_OUT_DEFAULT_MS = 120L
private const val LOG_TAG = "KiaanAudioPlayer"

// Manifest meta-data keys (mirrors apps/sakha-mobile/plugins/withKiaanAudioFocus.js)
private const val META_USAGE = "com.kiaanverse.sakha.audio.usage"
private const val META_CONTENT_TYPE = "com.kiaanverse.sakha.audio.contentType"
private const val META_FOCUS_GAIN = "com.kiaanverse.sakha.audio.focusGain"
private const val META_ROUTE_BLUETOOTH = "com.kiaanverse.sakha.audio.routeBluetooth"

// Event names emitted to JS via DeviceEventEmitter
private const val EVENT_PLAYBACK_STATE = "KiaanAudioPlayer:onPlaybackStateChanged"
private const val EVENT_AUDIO_LEVEL = "KiaanAudioPlayer:onAudioLevel"
private const val EVENT_CROSSFADE = "KiaanAudioPlayer:onCrossfade"
private const val EVENT_ERROR = "KiaanAudioPlayer:onError"

@OptIn(UnstableApi::class)
@ReactModule(name = KiaanAudioPlayerModule.NAME)
class KiaanAudioPlayerModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "KiaanAudioPlayer"
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private var player: ExoPlayer? = null
    // Why ConcatenatingMediaSource and NOT ConcatenatingMediaSource2:
    // CMS2 (Media3 1.0+) is BUILDER-ONLY and IMMUTABLE post-build — it has
    // no runtime `addMediaSource(int, MediaSource)`, only `Builder.add(...)`.
    // Our streaming TTS architecture depends on appending each Opus chunk
    // as it arrives over the WSS, so we need the legacy CMS which exposes
    // `addMediaSource()` on the live instance. Build #19 failed with
    // `Unresolved reference: addMediaSource` precisely because of this
    // mismatch. CMS is `@UnstableApi` (covered by the class-level @OptIn)
    // and `@Deprecated` since Media3 1.4 with no removal-version pinned —
    // safe for the 1.x line we're using. If/when we migrate to Media3 2.0
    // (which removes CMS), the right move is `player.addMediaSource()`
    // directly, since the player has its own internal queue with the same
    // API the code expects here.
    @Suppress("DEPRECATION")
    private var concatSource: ConcatenatingMediaSource? = null
    private var visualizer: Visualizer? = null
    private val rmsBuffer = ArrayDeque<Float>()
    @Volatile
    private var lastSmoothedRms: Float = 0f
    private val rmsLoopRunning = AtomicBoolean(false)
    private val sessionId: String = UUID.randomUUID().toString()
    private val chunkDir: File by lazy {
        File(reactContext.cacheDir, "sakha-audio-$sessionId").apply {
            if (!exists()) mkdirs()
        }
    }
    private var nextSourceIndex: Int = 0

    override fun getName(): String = NAME

    // ─── Lifecycle ─────────────────────────────────────────────────────

    private fun ensurePlayer() {
        if (player != null) return
        mainHandlerSync {
            val attrs = readAudioAttributesFromManifest()
            player = ExoPlayer.Builder(reactContext)
                .setAudioAttributes(attrs, /* handleAudioFocus = */ true)
                .setHandleAudioBecomingNoisy(true)
                .setWakeMode(C.WAKE_MODE_LOCAL)
                .build()
                .also { p ->
                    p.addListener(playbackListener)
                    @Suppress("DEPRECATION")
                    concatSource = ConcatenatingMediaSource()
                    p.setMediaSource(concatSource!!)
                    p.prepare()
                    p.playWhenReady = false
                    attachVisualizer(p.audioSessionId)
                }
        }
    }

    private fun readAudioAttributesFromManifest(): AudioAttributes {
        val app = reactContext.applicationInfo
        val pm = reactContext.packageManager
        val metaData = try {
            pm.getApplicationInfo(app.packageName, android.content.pm.PackageManager.GET_META_DATA).metaData
        } catch (e: Exception) {
            null
        }
        // Defaults match the spec: speech / assistance_sonification /
        // gain_transient_may_duck. The manifest meta-data is just an
        // ops-level override.
        val usage = metaData?.getString(META_USAGE) ?: "assistance_sonification"
        val contentType = metaData?.getString(META_CONTENT_TYPE) ?: "speech"
        // Build AudioAttributes per AndroidX Media3 surface
        val builder = AudioAttributes.Builder()
        builder.setUsage(
            when (usage.lowercase()) {
                "assistance_accessibility" -> C.USAGE_ASSISTANCE_ACCESSIBILITY
                "assistance_navigation_guidance" -> C.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE
                "assistant" -> C.USAGE_ASSISTANT
                "media" -> C.USAGE_MEDIA
                "voice_communication" -> C.USAGE_VOICE_COMMUNICATION
                else -> C.USAGE_ASSISTANCE_SONIFICATION
            },
        )
        builder.setContentType(
            when (contentType.lowercase()) {
                "music" -> C.AUDIO_CONTENT_TYPE_MUSIC
                "movie" -> C.AUDIO_CONTENT_TYPE_MOVIE
                "sonification" -> C.AUDIO_CONTENT_TYPE_SONIFICATION
                else -> C.AUDIO_CONTENT_TYPE_SPEECH
            },
        )
        return builder.build()
    }

    // ─── ExoPlayer listener ────────────────────────────────────────────

    private val playbackListener = object : Player.Listener {
        override fun onPlaybackStateChanged(state: Int) {
            val name = when (state) {
                Player.STATE_IDLE -> "idle"
                Player.STATE_BUFFERING -> "buffering"
                Player.STATE_READY -> "ready"
                Player.STATE_ENDED -> "ended"
                else -> "unknown"
            }
            val map = Arguments.createMap()
            map.putString("state", name)
            sendEvent(EVENT_PLAYBACK_STATE, map)
            // Start RMS emit loop on READY; stop on ENDED/IDLE.
            when (state) {
                Player.STATE_READY -> startRmsLoop()
                Player.STATE_ENDED, Player.STATE_IDLE -> stopRmsLoop()
            }
        }

        override fun onPlayerError(error: PlaybackException) {
            Log.e(LOG_TAG, "ExoPlayer error: ${error.errorCodeName} - ${error.message}")
            val map = Arguments.createMap()
            map.putString("code", error.errorCodeName)
            map.putString("message", error.message ?: "ExoPlayer error")
            sendEvent(EVENT_ERROR, map)
        }
    }

    // ─── Visualizer (RMS metering for Shankha sound waves) ─────────────

    private fun attachVisualizer(audioSessionId: Int) {
        try {
            visualizer?.release()
            visualizer = Visualizer(audioSessionId).apply {
                captureSize = Visualizer.getCaptureSizeRange()[0]
                setDataCaptureListener(
                    object : Visualizer.OnDataCaptureListener {
                        override fun onWaveFormDataCapture(
                            v: Visualizer?,
                            waveform: ByteArray?,
                            samplingRate: Int,
                        ) {
                            if (waveform == null) return
                            val rms = computeRms(waveform)
                            pushSmoothedRms(rms)
                        }

                        override fun onFftDataCapture(
                            v: Visualizer?,
                            fft: ByteArray?,
                            samplingRate: Int,
                        ) = Unit
                    },
                    Visualizer.getMaxCaptureRate() / 2,
                    /* waveform = */ true,
                    /* fft = */ false,
                )
                enabled = true
            }
        } catch (e: Exception) {
            // Visualizer is restricted on some devices (Android 10+ requires
            // RECORD_AUDIO; some OEMs disable it altogether). We log and
            // continue without metering — Shankha animation degrades to
            // a constant slow pulse, which is what we want anyway when
            // metering is unavailable.
            Log.w(LOG_TAG, "Visualizer unavailable: ${e.message}")
            visualizer = null
        }
    }

    /** Compute RMS over a signed-byte waveform sample buffer (Visualizer
     *  delivers waveform centered on 128 — subtract 128 to get signed). */
    private fun computeRms(waveform: ByteArray): Float {
        if (waveform.isEmpty()) return 0f
        var sumSquares = 0.0
        for (b in waveform) {
            val v = (b.toInt() and 0xFF) - 128
            sumSquares += (v * v).toDouble()
        }
        val rms = sqrt(sumSquares / waveform.size) / 128.0
        return rms.toFloat().coerceIn(0f, 1f)
    }

    private fun pushSmoothedRms(raw: Float) {
        synchronized(rmsBuffer) {
            rmsBuffer.addLast(raw)
            while (rmsBuffer.size > RMS_SMOOTHING_WINDOW_SAMPLES) rmsBuffer.removeFirst()
            lastSmoothedRms = rmsBuffer.average().toFloat()
        }
    }

    private fun startRmsLoop() {
        if (!rmsLoopRunning.compareAndSet(false, true)) return
        mainHandler.postDelayed(rmsEmitter, RMS_EMIT_INTERVAL_MS)
    }

    private fun stopRmsLoop() {
        rmsLoopRunning.set(false)
        mainHandler.removeCallbacks(rmsEmitter)
    }

    private val rmsEmitter = object : Runnable {
        override fun run() {
            if (!rmsLoopRunning.get()) return
            val map = Arguments.createMap()
            map.putDouble("rms", lastSmoothedRms.toDouble())
            sendEvent(EVENT_AUDIO_LEVEL, map)
            mainHandler.postDelayed(this, RMS_EMIT_INTERVAL_MS)
        }
    }

    // ─── @ReactMethod Promise API ──────────────────────────────────────

    /**
     * Append one Opus chunk to the playback queue.
     *
     * @param seq monotonically increasing sequence number from the WSS
     * @param base64Opus base64-encoded Opus frame bytes
     * @param promise resolves once the chunk is queued (NOT once it plays)
     */
    @ReactMethod
    fun appendChunk(seq: Int, base64Opus: String, promise: Promise) {
        try {
            ensurePlayer()
            val bytes = Base64.decode(base64Opus, Base64.DEFAULT)
            val file = File(chunkDir, "chunk-%06d.opus".format(seq))
            FileOutputStream(file).use { it.write(bytes) }
            mainHandlerSync {
                val item = MediaItem.fromUri(android.net.Uri.fromFile(file))
                val src = ProgressiveMediaSource.Factory(DefaultDataSource.Factory(reactContext))
                    .createMediaSource(item)
                concatSource?.addMediaSource(nextSourceIndex, src)
                if (nextSourceIndex > 0) {
                    val crossfade = Arguments.createMap()
                    crossfade.putInt("from_seq", nextSourceIndex - 1)
                    crossfade.putInt("to_seq", seq)
                    sendEvent(EVENT_CROSSFADE, crossfade)
                }
                nextSourceIndex += 1
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("APPEND_FAILED", "Failed to append chunk #$seq: ${e.message}", e)
        }
    }

    @ReactMethod
    fun play(promise: Promise) {
        try {
            ensurePlayer()
            mainHandlerSync {
                player?.playWhenReady = true
                player?.volume = 1f
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("PLAY_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun pause(promise: Promise) {
        try {
            mainHandlerSync { player?.playWhenReady = false }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("PAUSE_FAILED", e.message, e)
        }
    }

    /**
     * Smooth fade-out used for barge-in. Default 120ms per spec —
     * audible but inaudible enough that the user feels Sakha was
     * already winding down.
     */
    @ReactMethod
    fun fadeOut(durationMs: Double, promise: Promise) {
        val targetMs = if (durationMs <= 0) FADE_OUT_DEFAULT_MS else durationMs.toLong()
        try {
            ensurePlayer()
            mainHandler.post {
                val p = player ?: return@post
                val startVol = p.volume
                val startTime = android.os.SystemClock.uptimeMillis()
                val tick = object : Runnable {
                    override fun run() {
                        val elapsed = android.os.SystemClock.uptimeMillis() - startTime
                        val t = min(elapsed.toFloat() / targetMs, 1f)
                        p.volume = startVol * (1f - t)
                        if (t < 1f) {
                            mainHandler.postDelayed(this, 16) // ~60Hz
                        } else {
                            p.playWhenReady = false
                            promise.resolve(null)
                        }
                    }
                }
                mainHandler.post(tick)
            }
        } catch (e: Exception) {
            promise.reject("FADE_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        try {
            mainHandlerSync {
                player?.stop()
                player?.clearMediaItems()
                @Suppress("DEPRECATION")
                concatSource = ConcatenatingMediaSource()
                player?.setMediaSource(concatSource!!)
                player?.prepare()
                nextSourceIndex = 0
            }
            stopRmsLoop()
            cleanupChunkDir()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("STOP_FAILED", e.message, e)
        }
    }

    /** Snapshot the latest smoothed RMS (used for the Shankha animation
     *  worklet bridge in Part 9 — `useShankhaAnimation`). */
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getAudioLevel(): Double = lastSmoothedRms.toDouble()

    @ReactMethod
    fun release(promise: Promise) {
        try {
            stopRmsLoop()
            mainHandlerSync {
                visualizer?.release()
                visualizer = null
                player?.release()
                player = null
                concatSource = null
                nextSourceIndex = 0
            }
            cleanupChunkDir()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("RELEASE_FAILED", e.message, e)
        }
    }

    // RN bridge requires addListener/removeListeners stubs for event
    // subscriptions to attach without warnings.
    @ReactMethod
    fun addListener(eventName: String) = Unit

    @ReactMethod
    fun removeListeners(count: Int) = Unit

    // ─── Helpers ───────────────────────────────────────────────────────

    private fun sendEvent(name: String, payload: WritableMap) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(name, payload)
        } catch (e: Exception) {
            Log.w(LOG_TAG, "sendEvent($name) failed: ${e.message}")
        }
    }

    /**
     * Run a block on the Looper main thread, waiting briefly for it to
     * complete. ExoPlayer methods MUST run on its own thread (the looper
     * passed to the builder, which defaults to main). The RN bridge
     * thread can't call ExoPlayer methods directly without crashing.
     */
    private fun mainHandlerSync(block: () -> Unit) {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            block()
            return
        }
        val latch = java.util.concurrent.CountDownLatch(1)
        var capturedException: Throwable? = null
        mainHandler.post {
            try {
                block()
            } catch (e: Throwable) {
                capturedException = e
            } finally {
                latch.countDown()
            }
        }
        latch.await(2, java.util.concurrent.TimeUnit.SECONDS)
        capturedException?.let { throw it }
    }

    private fun cleanupChunkDir() {
        try {
            chunkDir.listFiles()?.forEach { it.delete() }
        } catch (e: Exception) {
            Log.w(LOG_TAG, "cleanupChunkDir failed: ${e.message}")
        }
    }
}
