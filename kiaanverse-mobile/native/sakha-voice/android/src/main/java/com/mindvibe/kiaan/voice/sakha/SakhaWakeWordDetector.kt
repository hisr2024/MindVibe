/**
 * SakhaWakeWordDetector — always-on Android SpeechRecognizer loop
 * that listens for "Hey Sakha" / "हे सखा" / etc.
 *
 * Self-contained — does not yet hook into [SakhaVoiceManager]. Step 26
 * will instantiate this from the manager and wire the [onDetected]
 * callback to [SakhaVoiceManager.activate]. Step 24 just lands the
 * detector itself.
 *
 * Why Android SpeechRecognizer (and not Picovoice Porcupine):
 * - Works on every device with Google services, no API key needed.
 * - The host app already speaks this API for the turn STT path
 *   (SakhaVoiceManager.startListening), so users are familiar with the
 *   permission prompt and the on-device offline mode.
 * - Picovoice Porcupine ships with the [withPicovoice] plugin and the
 *   [PICOVOICE_ACCESS_KEY] secret already wired — but custom keyword
 *   models cost real money and require Picovoice console approval.
 *   Once that's available, swapping the engine is a drop-in via a
 *   shared interface; for Phase 2B we ship the SpeechRecognizer path.
 *
 * Flow:
 *   start() → main-thread coroutine creates a SpeechRecognizer, registers
 *   our listener, calls startListening() with EXTRA_PREFER_OFFLINE + partial
 *   results enabled. Each onPartialResults / onResults runs the transcript
 *   through [WakeWordMatcher.match]. On match (and beyond the cooldown),
 *   [onDetected] fires once. After every utterance / error, we auto-restart
 *   the recognizer with a small backoff so the loop is genuinely "always
 *   on" until [stop] is called.
 *
 * Lifecycle:
 *   - SakhaVoiceManager pauses the wake detector when the app starts a
 *     conversational turn (the turn STT and the wake STT can't share the
 *     mic on the same recognizer instance).
 *   - SakhaVoiceManager resumes it on return to IDLE.
 *
 * Threading: SpeechRecognizer must be touched on the main thread.
 * All listener callbacks fire on the main thread already, and we
 * post startCycle / scheduleRestart through a main-Looper handler.
 *
 * Privacy: this class does not store the raw transcript anywhere.
 * The match call returns the normalized phrase, which is what the
 * caller logs — never the surrounding user words.
 */

package com.mindvibe.kiaan.voice.sakha

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import androidx.core.content.ContextCompat
import java.util.Locale

class SakhaWakeWordDetector(
    private val context: Context,
    @Volatile private var phrases: List<String>,
    private val cooldownMs: Long = DEFAULT_COOLDOWN_MS,
    private val locale: Locale = Locale.US,
    private val onDetected: (phrase: String) -> Unit,
    private val onError: (Throwable) -> Unit = {},
    private val debugMode: Boolean = false,
) {

    companion object {
        private const val TAG = "SakhaWakeWord"
        const val DEFAULT_COOLDOWN_MS = 1500L
        // Backoff classes keep the loop responsive in the common case
        // (no-match / speech-timeout fire constantly when the room is
        // quiet) while not hammering the recognizer service when the
        // mic is contended.
        private const val BACKOFF_QUICK_MS = 250L
        private const val BACKOFF_BUSY_MS = 500L
        private const val BACKOFF_AUDIO_MS = 1000L
        private const val BACKOFF_MAX_MS = 4000L
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private var recognizer: SpeechRecognizer? = null

    @Volatile
    private var running: Boolean = false

    @Volatile
    private var lastFiredAt: Long = 0L

    // ------------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------------

    fun isRunning(): Boolean = running

    /** Begin listening. Idempotent — second call is a no-op. */
    fun start() {
        if (running) return
        if (!hasRecordPermission()) {
            onError(SecurityException("RECORD_AUDIO not granted"))
            return
        }
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            onError(IllegalStateException("SpeechRecognizer not available on this device"))
            return
        }
        running = true
        startCycle()
    }

    /** Stop listening + release the recognizer. Idempotent. */
    fun stop() {
        if (!running) return
        running = false
        mainHandler.post {
            try { recognizer?.cancel() } catch (_: Exception) {}
            try { recognizer?.destroy() } catch (_: Exception) {}
            recognizer = null
        }
    }

    /**
     * Replace the wake phrases at runtime — useful when the user
     * switches Sakha's interaction language (English ↔ Hindi). Does
     * not restart the loop.
     */
    fun updatePhrases(new: List<String>) {
        phrases = new
    }

    // ------------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------------

    private fun hasRecordPermission(): Boolean = ContextCompat.checkSelfPermission(
        context, Manifest.permission.RECORD_AUDIO
    ) == PackageManager.PERMISSION_GRANTED

    private fun startCycle() {
        mainHandler.post {
            if (!running) return@post
            try {
                recognizer?.destroy()
                val r = SpeechRecognizer.createSpeechRecognizer(context)
                r.setRecognitionListener(listener)
                recognizer = r
                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale.toLanguageTag())
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                }
                r.startListening(intent)
            } catch (t: Throwable) {
                if (debugMode) Log.w(TAG, "startListening failed: ${t.message}")
                scheduleRestart(BACKOFF_AUDIO_MS)
            }
        }
    }

    private fun scheduleRestart(delayMs: Long) {
        if (!running) return
        val capped = delayMs.coerceAtMost(BACKOFF_MAX_MS)
        mainHandler.postDelayed({ if (running) startCycle() }, capped)
    }

    private fun handleTranscript(text: String) {
        if (text.isBlank()) return
        val phrase = WakeWordMatcher.match(text, phrases) ?: return
        val now = System.currentTimeMillis()
        if (now - lastFiredAt < cooldownMs) return
        lastFiredAt = now
        try {
            onDetected(phrase)
        } catch (t: Throwable) {
            if (debugMode) Log.w(TAG, "onDetected callback threw: ${t.message}")
        }
    }

    private val listener = object : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) {}
        override fun onBeginningOfSpeech() {}
        override fun onRmsChanged(rmsdB: Float) {}
        override fun onBufferReceived(buffer: ByteArray?) {}
        override fun onEndOfSpeech() {}
        override fun onEvent(eventType: Int, params: Bundle?) {}

        override fun onPartialResults(partialResults: Bundle?) {
            val matches = partialResults
                ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            val text = matches?.firstOrNull() ?: return
            handleTranscript(text)
        }

        override fun onResults(results: Bundle?) {
            val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            val text = matches?.firstOrNull().orEmpty()
            handleTranscript(text)
            // Always restart so the loop keeps running for the next utterance.
            scheduleRestart(BACKOFF_QUICK_MS)
        }

        override fun onError(error: Int) {
            val backoff = when (error) {
                SpeechRecognizer.ERROR_NO_MATCH,
                SpeechRecognizer.ERROR_SPEECH_TIMEOUT,
                -> BACKOFF_QUICK_MS

                SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> BACKOFF_BUSY_MS

                SpeechRecognizer.ERROR_AUDIO,
                SpeechRecognizer.ERROR_CLIENT,
                SpeechRecognizer.ERROR_NETWORK,
                SpeechRecognizer.ERROR_NETWORK_TIMEOUT,
                -> BACKOFF_AUDIO_MS

                SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> {
                    running = false
                    onError(SecurityException("RECORD_AUDIO permission revoked"))
                    return
                }

                else -> BACKOFF_AUDIO_MS
            }
            if (debugMode) Log.d(TAG, "stt error=$error backoff=${backoff}ms")
            scheduleRestart(backoff)
        }
    }
}
