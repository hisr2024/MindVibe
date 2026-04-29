/**
 * SakhaDictation — one-shot Android SpeechRecognizer dictation helper.
 *
 * Powers the Shankha voice-input button on every tool screen (Ardha,
 * Viyoga, Relationship Compass, Karma Reset, Emotional Reset, Sakha
 * Chat). When the user taps the Shankha next to a TextInput, this
 * helper opens a SpeechRecognizer session, captures one utterance,
 * returns the best transcript, and shuts down. No persistent loop,
 * no wake-word tracking — just dictate-and-exit.
 *
 * Why this lives separate from SakhaWakeWordDetector:
 *   • SakhaWakeWordDetector runs an *always-on* loop scanning every
 *     partial transcript for "Hey Sakha". It deliberately discards
 *     non-wake-word audio.
 *   • Dictation needs the OPPOSITE — capture every word the user
 *     speaks until they stop, regardless of trigger phrase.
 * Mixing them in one class would make the listener logic conditional
 * on mode and easy to break.
 *
 * Threading: SpeechRecognizer must be touched on the main thread.
 * The dictateOnce() public API runs the SpeechRecognizer setup +
 * teardown via a Handler(Looper.getMainLooper()).post {...} so the
 * caller (typically a coroutine on Dispatchers.Default from
 * SakhaVoiceModule.dictateOnce) doesn't crash with
 * "SpeechRecognizer should be used only from the main thread".
 *
 * Privacy: transcripts are returned to the caller and never logged
 * by this class. The caller decides whether to mirror them anywhere.
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
import androidx.core.content.ContextCompat
import java.util.Locale

class SakhaDictation(private val context: Context) {
    /** Result returned to the caller via the onResult callback. */
    sealed class DictationResult {
        data class Success(val transcript: String) : DictationResult()
        data class Failure(val code: String, val message: String) : DictationResult()
    }

    /**
     * Capture one utterance and return its best transcript.
     *
     * @param languageTag BCP-47 language tag — "en-IN", "hi-IN", "en-US".
     * @param onResult invoked exactly once on the main thread when the
     *                 session completes (success or failure).
     */
    fun dictateOnce(
        languageTag: String,
        onResult: (DictationResult) -> Unit,
    ) {
        if (!hasRecordPermission()) {
            onResult(
                DictationResult.Failure(
                    "PERMISSION_DENIED",
                    "RECORD_AUDIO permission not granted",
                )
            )
            return
        }
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            onResult(
                DictationResult.Failure(
                    "NOT_AVAILABLE",
                    "SpeechRecognizer not available on this device",
                )
            )
            return
        }

        Handler(Looper.getMainLooper()).post {
            val recognizer = SpeechRecognizer.createSpeechRecognizer(context)
            val locale = parseLocale(languageTag)
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(
                    RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                    RecognizerIntent.LANGUAGE_MODEL_FREE_FORM,
                )
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale.toLanguageTag())
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
                putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, false)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            }
            // Track whether we've already delivered a result so we don't
            // double-fire onResult if both onResults() and onError() arrive
            // (some Android OEMs emit both for transient errors).
            var delivered = false
            val deliver: (DictationResult) -> Unit = { res ->
                if (!delivered) {
                    delivered = true
                    onResult(res)
                    try {
                        recognizer.destroy()
                    } catch (_: Throwable) {
                        // best-effort cleanup
                    }
                }
            }

            recognizer.setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) { /* no-op */ }
                override fun onBeginningOfSpeech() { /* no-op */ }
                override fun onRmsChanged(rmsdB: Float) { /* no-op */ }
                override fun onBufferReceived(buffer: ByteArray?) { /* no-op */ }
                override fun onEndOfSpeech() { /* no-op */ }
                override fun onPartialResults(partialResults: Bundle?) { /* no-op */ }
                override fun onEvent(eventType: Int, params: Bundle?) { /* no-op */ }

                override fun onError(error: Int) {
                    deliver(DictationResult.Failure(errorCode(error), errorMessage(error)))
                }

                override fun onResults(results: Bundle?) {
                    val transcripts = results
                        ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        .orEmpty()
                    val best = transcripts.firstOrNull().orEmpty().trim()
                    if (best.isEmpty()) {
                        deliver(
                            DictationResult.Failure(
                                "NO_MATCH", "No speech recognized",
                            )
                        )
                    } else {
                        deliver(DictationResult.Success(best))
                    }
                }
            })
            recognizer.startListening(intent)
        }
    }

    private fun hasRecordPermission(): Boolean = ContextCompat.checkSelfPermission(
        context, Manifest.permission.RECORD_AUDIO,
    ) == PackageManager.PERMISSION_GRANTED

    private fun parseLocale(tag: String): Locale {
        // BCP-47 parser — "en-IN" → Locale("en","IN")
        val parts = tag.split("-")
        return when (parts.size) {
            1 -> Locale(parts[0])
            2 -> Locale(parts[0], parts[1])
            else -> Locale.forLanguageTag(tag)
        }
    }

    private fun errorCode(code: Int): String = when (code) {
        SpeechRecognizer.ERROR_AUDIO -> "AUDIO_ERROR"
        SpeechRecognizer.ERROR_CLIENT -> "CLIENT_ERROR"
        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "PERMISSION_DENIED"
        SpeechRecognizer.ERROR_NETWORK -> "NETWORK_ERROR"
        SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "NETWORK_TIMEOUT"
        SpeechRecognizer.ERROR_NO_MATCH -> "NO_MATCH"
        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "RECOGNIZER_BUSY"
        SpeechRecognizer.ERROR_SERVER -> "SERVER_ERROR"
        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "SPEECH_TIMEOUT"
        else -> "UNKNOWN_ERROR_$code"
    }

    private fun errorMessage(code: Int): String = when (code) {
        SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
        SpeechRecognizer.ERROR_CLIENT -> "Client-side error"
        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission denied"
        SpeechRecognizer.ERROR_NETWORK -> "Network error during recognition"
        SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
        SpeechRecognizer.ERROR_NO_MATCH -> "No speech recognized"
        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy — try again"
        SpeechRecognizer.ERROR_SERVER -> "Server-side recognition error"
        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech heard before timeout"
        else -> "Unknown error: $code"
    }
}
