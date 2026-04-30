/**
 * SakhaVoiceModule — bridge surface for the Sakha (शङ्ख) voice companion.
 *
 * This module fronts the methods the JS side calls via
 * `NativeModules.SakhaVoice.*`. The full surface is declared in
 * apps/mobile/types/sakhaVoice.ts; today every method is a SAFE STUB
 * that:
 *
 *   • Resolves with sensible defaults for queries
 *     (`hasRecordPermission`, `initialize`, etc.) so screens render.
 *   • REJECTS with a typed error code for actions that genuinely need
 *     native work (`activate`, `readVerse`, `enableWakeWord`, …) so
 *     the JS callers fall through to their existing fallbacks
 *     (expo-av dictation, /api/voice/synthesize TTS, etc.) instead of
 *     hanging.
 *
 * Why stubs and not the real recognizer / TTS pipeline?
 *
 *   The on-device Android SpeechRecognizer + ExoPlayer + Picovoice
 *   wake-word integration is a multi-week native engineering task
 *   (audio focus state machine, VAD, barge-in, foreground service
 *   coordination). Shipping it as one mega-PR risks the entire Play
 *   Store release. Shipping the package as compilable stubs first
 *   means:
 *
 *     1. The AAB builds and uploads — javac stops failing on the
 *        plugin-injected `import com.mindvibe.kiaan.voice.sakha.*`.
 *     2. Existing JS fallbacks (expo-av tap-to-record, backend TTS)
 *        keep every voice feature working for users today.
 *     3. Real implementations land one ReactMethod at a time without
 *        a bridge re-link.
 *
 * Registration: see SakhaVoicePackage in this same package.
 */

package com.mindvibe.kiaan.voice.sakha

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class SakhaVoiceModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

    /** Single in-flight recognizer per module instance. Android's
     *  SpeechRecognizer is single-shot and main-thread-bound; we marshal
     *  every interaction onto the UI thread and refuse re-entry while
     *  one is already listening. */
    @Volatile private var activeRecognizer: SpeechRecognizer? = null
    @Volatile private var activePromise: Promise? = null

    override fun getName(): String = NAME

    /**
     * Initialize the recognizer + TTS clients. Stubbed to resolve so
     * the JS bootstrapper can mount; real implementation will set up
     * the SpeechRecognizer, audio focus listener, and TTS engine.
     */
    @ReactMethod
    fun initialize(
        @Suppress("UNUSED_PARAMETER") config: ReadableMap?,
        promise: Promise,
    ) {
        promise.resolve(null)
    }

    /**
     * Cache the auth token used for backend WSS / REST. No-op for now
     * — JS callers also send the token explicitly in headers.
     */
    @ReactMethod
    fun setAuthToken(@Suppress("UNUSED_PARAMETER") token: String?) {
        // intentionally empty — token plumbing lives on the JS side too.
    }

    /**
     * The companion uses RECORD_AUDIO. We answer false until the
     * native recognizer ships so the JS layer falls back to expo-av's
     * permission flow (which is fully wired today).
     */
    @ReactMethod
    fun hasRecordPermission(promise: Promise) {
        promise.resolve(false)
    }

    @ReactMethod
    fun activate(promise: Promise) {
        rejectUnimplemented(promise, "activate")
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        promise.resolve(null)
    }

    @ReactMethod
    fun cancelTurn(promise: Promise) {
        promise.resolve(null)
    }

    @ReactMethod
    fun resetSession(promise: Promise) {
        promise.resolve(null)
    }

    @ReactMethod
    fun shutdown(promise: Promise) {
        promise.resolve(null)
    }

    /**
     * Verse-recitation entry point used by lib/sakhaVerseLibrary.ts.
     * Until the native TTS pipeline ships, callers should swap to
     * `/api/voice/synthesize` — which is exactly what isSakhaVoiceAvailable()
     * gates them into when this module isn't present. We still expose
     * the method so the JS-side `recite()` does not throw "method
     * does not exist" — it gets a typed rejection it can interpret.
     */
    @ReactMethod
    fun readVerse(
        @Suppress("UNUSED_PARAMETER") recitation: ReadableMap?,
        promise: Promise,
    ) {
        rejectUnimplemented(promise, "readVerse")
    }

    /**
     * One-shot dictation against Android's on-device SpeechRecognizer.
     *
     * The flow:
     *   1. Confirm RECORD_AUDIO permission and SpeechRecognizer
     *      availability — reject with typed error codes when either is
     *      missing so the JS hook can fall back to the expo-av +
     *      backend transcribe path it already has wired up.
     *   2. Build a RecognizerIntent with the requested BCP-47 language
     *      tag (defaults to "en-IN") and free-form model.
     *   3. Run the SpeechRecognizer on the main thread (mandatory; the
     *      framework crashes on a worker thread).
     *   4. Resolve with `{ transcript, language }` on first result OR
     *      reject with a typed error on timeout / permission denial /
     *      no match.
     *
     * Concurrency: only one dictation may be in flight per module
     * instance; a second tap before the first resolves rejects with
     * DICTATION_BUSY so the UI never sees overlapping results.
     */
    @ReactMethod
    fun dictateOnce(
        languageTag: String?,
        promise: Promise,
    ) {
        val ctx = reactApplicationContext
        if (activeRecognizer != null || activePromise != null) {
            promise.reject(
                "DICTATION_BUSY",
                "A dictation request is already in flight; ignore duplicate tap.",
            )
            return
        }

        // Permission check up front so the recognizer doesn't throw a
        // generic ERROR_INSUFFICIENT_PERMISSIONS deep inside its
        // lifecycle that the JS error handler can't interpret.
        val hasMic = ContextCompat.checkSelfPermission(
            ctx,
            Manifest.permission.RECORD_AUDIO,
        ) == PackageManager.PERMISSION_GRANTED
        if (!hasMic) {
            promise.reject(
                "PERMISSION_DENIED",
                "RECORD_AUDIO permission is required for voice dictation.",
            )
            return
        }

        if (!SpeechRecognizer.isRecognitionAvailable(ctx)) {
            promise.reject(
                "RECOGNIZER_UNAVAILABLE",
                "On-device speech recognition is not available on this device.",
            )
            return
        }

        val lang = languageTag?.takeIf { it.isNotBlank() } ?: "en-IN"
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(
                RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM,
            )
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
            putExtra(
                RecognizerIntent.EXTRA_CALLING_PACKAGE,
                ctx.packageName,
            )
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }

        // SpeechRecognizer must be created and listened-to on the main
        // looper. Marshal to the UI thread so callers can hit this from
        // a JS callback chain without worrying about which thread
        // they're on.
        activePromise = promise
        ctx.runOnUiQueueThread {
            try {
                val recognizer = SpeechRecognizer.createSpeechRecognizer(ctx)
                activeRecognizer = recognizer
                recognizer.setRecognitionListener(
                    DictationListener(lang) { resultPromise, transcript, error ->
                        // Tear down on any terminal callback so a
                        // subsequent tap can start fresh.
                        try {
                            recognizer.destroy()
                        } catch (_: Throwable) {
                            // Best effort — destroy() throws on some OEMs.
                        }
                        activeRecognizer = null
                        activePromise = null

                        if (error != null) {
                            resultPromise.reject(error.first, error.second)
                        } else if (transcript != null) {
                            val map = Arguments.createMap()
                            map.putString("transcript", transcript)
                            map.putString("language", lang)
                            resultPromise.resolve(map)
                        } else {
                            resultPromise.reject(
                                "DICTATION_EMPTY",
                                "No speech detected. Try again.",
                            )
                        }
                    },
                )
                recognizer.startListening(intent)
            } catch (t: Throwable) {
                activeRecognizer = null
                val p = activePromise
                activePromise = null
                p?.reject("DICTATION_FAILED", t.message ?: "Dictation failed", t)
            }
        }
    }

    /**
     * RecognitionListener that funnels every terminal event into a
     * single callback. We resolve on the FIRST result (single-utterance
     * dictation) and reject on any error — caller decides how to
     * interpret the typed error code.
     */
    private inner class DictationListener(
        @Suppress("UNUSED_PARAMETER") private val language: String,
        private val onDone: (
            promise: Promise,
            transcript: String?,
            error: Pair<String, String>?,
        ) -> Unit,
    ) : RecognitionListener {

        private fun finish(transcript: String?, error: Pair<String, String>?) {
            val promise = activePromise ?: return
            onDone(promise, transcript, error)
        }

        override fun onReadyForSpeech(params: Bundle?) {}
        override fun onBeginningOfSpeech() {}
        override fun onRmsChanged(rmsdB: Float) {}
        override fun onBufferReceived(buffer: ByteArray?) {}
        override fun onEndOfSpeech() {}
        override fun onPartialResults(partialResults: Bundle?) {}
        override fun onEvent(eventType: Int, params: Bundle?) {}

        override fun onResults(results: Bundle?) {
            val list =
                results?.getStringArrayList(
                    SpeechRecognizer.RESULTS_RECOGNITION,
                )
            val first = list?.firstOrNull()?.trim().orEmpty()
            if (first.isNotEmpty()) {
                finish(first, null)
            } else {
                finish(
                    null,
                    "DICTATION_EMPTY" to "No speech detected. Try again.",
                )
            }
        }

        override fun onError(error: Int) {
            val (code, message) = errorToCodeAndMessage(error)
            finish(null, code to message)
        }
    }

    private fun errorToCodeAndMessage(error: Int): Pair<String, String> {
        return when (error) {
            SpeechRecognizer.ERROR_AUDIO ->
                "DICTATION_AUDIO" to "Audio recording error."
            SpeechRecognizer.ERROR_CLIENT ->
                "DICTATION_CLIENT" to "Speech recognizer client error."
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS ->
                "PERMISSION_DENIED" to
                    "Insufficient permissions to record audio."
            SpeechRecognizer.ERROR_NETWORK ->
                "DICTATION_NETWORK" to
                    "Network error while transcribing speech."
            SpeechRecognizer.ERROR_NETWORK_TIMEOUT ->
                "DICTATION_NETWORK_TIMEOUT" to
                    "Network timed out while transcribing speech."
            SpeechRecognizer.ERROR_NO_MATCH ->
                "DICTATION_NO_MATCH" to "No speech detected. Try again."
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY ->
                "DICTATION_BUSY" to "Speech recognizer is already busy."
            SpeechRecognizer.ERROR_SERVER ->
                "DICTATION_SERVER" to "Speech recognition server error."
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT ->
                "DICTATION_SPEECH_TIMEOUT" to
                    "I did not hear any speech. Tap and try again."
            else ->
                "DICTATION_FAILED" to "Speech recognition failed (code $error)."
        }
    }

    @ReactMethod
    fun enableWakeWord(promise: Promise) {
        rejectUnimplemented(promise, "enableWakeWord")
    }

    @ReactMethod
    fun disableWakeWord(promise: Promise) {
        // Disable is a no-op when nothing is enabled. Resolving keeps
        // the JS state machine simple.
        promise.resolve(null)
    }

    /**
     * NativeEventEmitter contract — required even when the module
     * doesn't currently emit, so JS subscriptions don't trigger
     * "new NativeEventEmitter() was called with a non-null argument
     * without the required addListener method" warnings.
     */
    @ReactMethod
    fun addListener(@Suppress("UNUSED_PARAMETER") eventName: String?) {
        // Required for RCTDeviceEventEmitter — no-op.
    }

    @ReactMethod
    fun removeListeners(@Suppress("UNUSED_PARAMETER") count: Int) {
        // Required for RCTDeviceEventEmitter — no-op.
    }

    private fun rejectUnimplemented(promise: Promise, method: String) {
        promise.reject(
            "SAKHA_VOICE_UNIMPLEMENTED",
            "SakhaVoice.$method is not yet implemented natively. " +
                "JS callers should fall back to the backend voice " +
                "endpoints (/api/kiaan/transcribe, /api/voice/synthesize).",
        )
    }

    companion object {
        const val NAME = "SakhaVoice"
    }
}
