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

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class SakhaVoiceModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

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
     * One-shot dictation — mirrors useDictation.ts's expectation. JS
     * already feature-detects via `typeof Native.dictateOnce ===
     * "function"` and falls back to expo-av + /api/kiaan/transcribe
     * when this rejects, so a typed error here is the right behaviour
     * until the SpeechRecognizer wrapper ships.
     */
    @ReactMethod
    fun dictateOnce(
        @Suppress("UNUSED_PARAMETER") languageTag: String?,
        promise: Promise,
    ) {
        rejectUnimplemented(promise, "dictateOnce")
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
