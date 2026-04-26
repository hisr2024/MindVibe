/**
 * Sakha TTS Player
 *
 * Sequential playback queue for the Sakha voice. Two backends:
 *  1. **Sarvam REST** (preferred for prose + verses)
 *     POST {backend}/api/voice-companion/synthesize → audio bytes (base64 in JSON
 *     or raw audio/* depending on tier). Uses MediaPlayer for playback.
 *  2. **Android system TTS** (fallback)
 *     Used when Sarvam fails *and* the language has a system voice. Never used
 *     for Sanskrit — system TTS will mangle it.
 *
 * The player is pause-aware: it consumes [PauseEvent]s from the parser and
 * either:
 *  - synthesises + plays the segment (Speak),
 *  - delays for the requested number of milliseconds (Pause), or
 *  - flushes everything and emits FILTER_FAIL handling (Filter).
 *
 * Concurrency model:
 *  - One coroutine pulls events off the inbound channel and enqueues
 *    Synthesise jobs.
 *  - One coroutine drains the synthesis queue, plays each clip back-to-back,
 *    and signals progress via [SakhaVoiceListener].
 *
 * This keeps synthesis pipelined ahead of playback (so the user hears one
 * sentence while the next is being synthesised) without ever overlapping
 * audio — Sakha's pacing depends on ordered, gapless playback.
 */

package com.mindvibe.kiaan.voice.sakha

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Base64
import android.util.Log
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.util.UUID
import java.util.concurrent.TimeUnit

class SakhaTtsPlayer(
    private val context: Context,
    private val config: SakhaVoiceConfig,
    private val listener: SakhaVoiceListener,
) {

    companion object {
        private const val TAG = "SakhaTtsPlayer"
        private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    }

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    // Channels are recreated on every [start] — Kotlin Channel.close() is
    // terminal, so a session that stops and restarts (e.g. barge-in) needs
    // fresh ones or trySend will silently no-op on the second turn.
    private var incoming: Channel<PauseEvent> = Channel(Channel.UNLIMITED)
    private var playbackQueue: Channel<PlayJob> = Channel(Channel.UNLIMITED)
    private var ingestJob: Job? = null
    private var playbackJob: Job? = null

    private var fallbackTts: TextToSpeech? = null
    private var fallbackTtsReady = false

    private var currentPlayer: MediaPlayer? = null
    private var totalSpokenMs: Long = 0L
    private var pauseCount: Int = 0
    private var stopped: Boolean = false

    /**
     * Start a new playback session. Call [enqueue] to feed events and
     * [stop] to halt and free resources.
     */
    fun start() {
        stopped = false
        totalSpokenMs = 0L
        pauseCount = 0
        ensureFallbackTts()

        ingestJob?.cancel()
        playbackJob?.cancel()

        // Fresh channels for the new session.
        try { incoming.close() } catch (_: Exception) {}
        try { playbackQueue.close() } catch (_: Exception) {}
        incoming = Channel(Channel.UNLIMITED)
        playbackQueue = Channel(Channel.UNLIMITED)

        ingestJob = scope.launch {
            for (event in incoming) {
                if (stopped) break
                handleIncoming(event)
            }
            playbackQueue.close()
        }

        playbackJob = scope.launch {
            for (job in playbackQueue) {
                if (stopped) break
                playJob(job)
            }
        }
    }

    /** Feed a parser event into the player. Non-blocking. */
    fun enqueue(event: PauseEvent) {
        if (stopped) return
        incoming.trySend(event)
    }

    /** Signal that the SSE stream is finished — drain remaining buffered events. */
    fun finish() {
        incoming.close()
    }

    /** Stop immediately and release MediaPlayer + TTS resources. */
    fun stop() {
        stopped = true
        try { incoming.close() } catch (_: Exception) {}
        try { playbackQueue.close() } catch (_: Exception) {}
        currentPlayer?.let {
            try { it.stop() } catch (_: Exception) {}
            try { it.release() } catch (_: Exception) {}
        }
        currentPlayer = null
        ingestJob?.cancel()
        playbackJob?.cancel()
    }

    /** Permanently release. Call from onDestroy. */
    fun shutdown() {
        stop()
        try { fallbackTts?.shutdown() } catch (_: Exception) {}
        fallbackTts = null
        scope.cancel()
    }

    fun statsTotalSpokenMs(): Long = totalSpokenMs
    fun statsPauseCount(): Int = pauseCount

    // ------------------------------------------------------------------------
    // Pipeline
    // ------------------------------------------------------------------------

    private suspend fun handleIncoming(event: PauseEvent) {
        when (event) {
            is PauseEvent.Speak -> {
                // Defence-in-depth: persona guard rewrites in-place.
                val safeText = if (config.enablePersonaGuard) {
                    val result = SakhaPersonaGuard.softenInline(event.text)
                    if (result.text.isBlank()) {
                        // Phrase was excised entirely; nothing left to say.
                        return
                    }
                    result.text
                } else {
                    event.text
                }
                playbackQueue.trySend(PlayJob.Synthesise(safeText, event.isSanskrit))
            }
            is PauseEvent.Pause -> {
                playbackQueue.trySend(PlayJob.Pause(event.durationMs))
            }
            is PauseEvent.Filter -> {
                playbackQueue.trySend(PlayJob.Filter)
            }
        }
    }

    private suspend fun playJob(job: PlayJob) {
        when (job) {
            is PlayJob.Synthesise -> {
                val audioFile = withTimeoutOrNull(8_000L) { synthesise(job.text, job.isSanskrit) }
                if (audioFile != null) {
                    val ms = playFile(audioFile)
                    totalSpokenMs += ms
                    listener.onSpokenSegment(job.text, job.isSanskrit)
                    runCatching { audioFile.delete() }
                } else {
                    // Fallback to system TTS where possible (never for Sanskrit).
                    if (!job.isSanskrit && fallbackTtsReady) {
                        val ms = speakWithFallback(job.text)
                        totalSpokenMs += ms
                        listener.onSpokenSegment(job.text, false)
                    } else {
                        listener.onError(SakhaVoiceError.TtsError("synthesis-failed"))
                    }
                }
            }
            is PlayJob.Pause -> {
                pauseCount++
                listener.onPause(job.durationMs)
                delay(job.durationMs)
            }
            PlayJob.Filter -> {
                stop()
                listener.onFilterFail()
            }
        }
    }

    // ------------------------------------------------------------------------
    // Sarvam REST synthesis
    // ------------------------------------------------------------------------

    private suspend fun synthesise(text: String, isSanskrit: Boolean): File? {
        val url = "${config.backendBaseUrl.trimEnd('/')}${config.voiceCompanionPathPrefix}/synthesize"
        val voiceId = if (isSanskrit) config.sanskritVoiceId else config.sakhaVoiceId
        val body = JSONObject().apply {
            put("text", text)
            put("voice_id", voiceId)
            put("language", if (isSanskrit) "sa" else config.language.wire)
            put("speed", if (isSanskrit) 0.85 else 1.0)
            put("output_format", "mp3")
        }.toString()

        val token = config.authTokenProvider.invoke()
        val builder = Request.Builder()
            .url(url)
            .post(body.toRequestBody(JSON_MEDIA_TYPE))
            .header("X-Client", "kiaanverse-android-sakha-voice")
            .header("X-Voice-Mode", "sakha")
        token?.let { builder.header("Authorization", "Bearer $it") }

        return try {
            val response = httpClient.newCall(builder.build()).execute()
            response.use { resp ->
                if (!resp.isSuccessful) {
                    if (config.debugMode) Log.w(TAG, "Synth HTTP ${resp.code}")
                    return null
                }
                val contentType = resp.header("Content-Type", "audio/mpeg") ?: "audio/mpeg"
                val bytes: ByteArray = if (contentType.startsWith("application/json")) {
                    val json = JSONObject(resp.body?.string() ?: return null)
                    val b64 = json.optString("audio_base64").ifEmpty { json.optString("audio") }
                    if (b64.isNullOrEmpty()) return null
                    Base64.decode(b64, Base64.DEFAULT)
                } else {
                    resp.body?.bytes() ?: return null
                }
                writeTempAudio(bytes, contentType)
            }
        } catch (e: Exception) {
            if (config.debugMode) Log.w(TAG, "Synth failed: ${e.message}")
            null
        }
    }

    private fun writeTempAudio(bytes: ByteArray, contentType: String): File {
        val ext = when {
            contentType.contains("mpeg") -> "mp3"
            contentType.contains("wav") -> "wav"
            contentType.contains("ogg") -> "ogg"
            else -> "mp3"
        }
        val file = File(context.cacheDir, "sakha-${UUID.randomUUID()}.$ext")
        FileOutputStream(file).use { it.write(bytes) }
        return file
    }

    private suspend fun playFile(file: File): Long {
        val done = CompletableDeferred<Long>()
        val started = System.currentTimeMillis()
        try {
            val player = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .setUsage(AudioAttributes.USAGE_ASSISTANT)
                        .build()
                )
                setDataSource(context, Uri.fromFile(file))
                setOnCompletionListener {
                    done.complete(System.currentTimeMillis() - started)
                }
                setOnErrorListener { _, what, extra ->
                    done.complete(0L)
                    if (config.debugMode) Log.w(TAG, "MediaPlayer error: $what/$extra")
                    true
                }
                prepare()
                start()
            }
            currentPlayer = player
            val ms = done.await()
            try { player.release() } catch (_: Exception) {}
            currentPlayer = null
            return ms
        } catch (e: Exception) {
            if (config.debugMode) Log.w(TAG, "Playback failed: ${e.message}")
            return 0L
        }
    }

    // ------------------------------------------------------------------------
    // System TTS fallback
    // ------------------------------------------------------------------------

    private fun ensureFallbackTts() {
        if (fallbackTts != null) return
        fallbackTts = TextToSpeech(context.applicationContext) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val res = fallbackTts?.setLanguage(config.language.sttLocale)
                fallbackTtsReady = (res != TextToSpeech.LANG_MISSING_DATA &&
                        res != TextToSpeech.LANG_NOT_SUPPORTED)
            } else {
                fallbackTtsReady = false
            }
        }
    }

    private suspend fun speakWithFallback(text: String): Long {
        val tts = fallbackTts ?: return 0L
        val started = System.currentTimeMillis()
        val done = CompletableDeferred<Unit>()
        val utteranceId = UUID.randomUUID().toString()
        tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String?) {}
            override fun onDone(id: String?) { done.complete(Unit) }
            @Deprecated("Deprecated in Java")
            override fun onError(id: String?) { done.complete(Unit) }
            override fun onError(id: String?, errorCode: Int) { done.complete(Unit) }
        })
        tts.speak(text, TextToSpeech.QUEUE_ADD, null, utteranceId)
        done.await()
        return System.currentTimeMillis() - started
    }

    // ------------------------------------------------------------------------
    // Internal job sealed
    // ------------------------------------------------------------------------

    private sealed class PlayJob {
        data class Synthesise(val text: String, val isSanskrit: Boolean) : PlayJob()
        data class Pause(val durationMs: Long) : PlayJob()
        object Filter : PlayJob()
    }
}
