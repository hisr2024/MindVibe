/**
 * Sakha Voice — React Native Bridge Module
 *
 * Exposes the [SakhaVoiceManager] to JavaScript through React Native's old
 * (legacy) bridge. We chose the old bridge instead of TurboModules for two
 * reasons:
 *  1. The host app (kiaanverse-mobile) currently runs on the React Native
 *     version that ships with Expo SDK 51 — TurboModules are still gated
 *     behind the New Architecture flag, which is not enabled there.
 *  2. The bridge surface is small (a handful of imperative calls + a typed
 *     event stream), so the perf delta is negligible.
 *
 * Method surface (matches native/shared/SakhaVoiceInterface.ts):
 *   initialize(config)       – one-shot setup
 *   activate()               – begin a turn (open mic)
 *   stopListening()          – finalise transcript and request response
 *   cancelTurn()             – hard cancel (mic + request + playback)
 *   resetSession()           – forget session_id; new conversation
 *   shutdown()               – release everything; call from screen unmount
 *
 * Events (RCTDeviceEventEmitter):
 *   SakhaVoiceState                  { state, previousState }
 *   SakhaVoicePartialTranscript      { text }
 *   SakhaVoiceFinalTranscript        { text }
 *   SakhaVoiceEngineSelected         { engine, mood, intensity }
 *   SakhaVoiceText                   { delta, isFinal }
 *   SakhaVoiceSpoken                 { text, isSanskrit }
 *   SakhaVoicePause                  { durationMs }
 *   SakhaVoiceVerseCited             { reference, sanskrit }
 *   SakhaVoiceFilterFail             {}
 *   SakhaVoiceTurnComplete           { ...metrics }
 *   SakhaVoiceError                  { code, message, recoverable }
 */

package com.mindvibe.kiaan.voice.sakha

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class SakhaVoiceModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "SakhaVoice"
        private const val TAG = "SakhaVoiceModule"
    }

    override fun getName(): String = NAME

    private val manager: SakhaVoiceManager by lazy {
        SakhaVoiceManager.getInstance(reactContext.applicationContext)
    }

    /** JS-supplied bearer token. Re-read on every request. */
    @Volatile
    private var bearerToken: String? = null

    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())

    // ------------------------------------------------------------------------
    // Lifecycle
    // ------------------------------------------------------------------------

    @ReactMethod
    fun initialize(configMap: ReadableMap, promise: Promise) {
        try {
            val config = SakhaVoiceConfig(
                language = SakhaLanguage.fromWire(configMap.optString("language") ?: "en"),
                backendBaseUrl = configMap.getString("backendBaseUrl")
                    ?: throw IllegalArgumentException("backendBaseUrl is required"),
                voiceCompanionPathPrefix = configMap.optString("voiceCompanionPathPrefix") ?: "/api/voice-companion",
                sakhaVoiceId = configMap.optString("sakhaVoiceId") ?: "sarvam-aura",
                sanskritVoiceId = configMap.optString("sanskritVoiceId") ?: "sarvam-meera",
                allowBargeIn = configMap.optBoolean("allowBargeIn", true),
                silenceTimeoutMs = configMap.optDouble("silenceTimeoutMs", 1800.0).toLong(),
                maxResponseSpokenMs = configMap.optDouble("maxResponseSpokenMs", 45_000.0).toLong(),
                requestTimeoutMs = configMap.optDouble("requestTimeoutMs", 12_000.0).toLong(),
                maxRequestRetries = configMap.optInt("maxRequestRetries", 2),
                enablePersonaGuard = configMap.optBoolean("enablePersonaGuard", true),
                speakOnFilterFail = configMap.optBoolean("speakOnFilterFail", true),
                debugMode = configMap.optBoolean("debugMode", false),
                authTokenProvider = { bearerToken },
            )
            manager.initialize(config, bridgeListener)
            promise.resolve(null)
        } catch (t: Throwable) {
            promise.reject("init_failed", t.message ?: "init failed", t)
        }
    }

    @ReactMethod
    fun setAuthToken(token: String?) {
        bearerToken = token?.takeIf { it.isNotBlank() }
    }

    @ReactMethod
    fun hasRecordPermission(promise: Promise) {
        promise.resolve(manager.hasRecordPermission())
    }

    @ReactMethod
    fun activate(promise: Promise) {
        try {
            manager.activate()
            promise.resolve(null)
        } catch (t: Throwable) {
            promise.reject("activate_failed", t.message, t)
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        manager.stopListening()
        promise.resolve(null)
    }

    @ReactMethod
    fun cancelTurn(promise: Promise) {
        manager.cancelTurn()
        promise.resolve(null)
    }

    @ReactMethod
    fun resetSession(promise: Promise) {
        manager.resetSession()
        promise.resolve(null)
    }

    @ReactMethod
    fun shutdown(promise: Promise) {
        manager.shutdown()
        promise.resolve(null)
    }

    // Required by RN's NativeEventEmitter contract.
    @ReactMethod
    fun addListener(eventName: String) { /* no-op */ }

    @ReactMethod
    fun removeListeners(count: Int) { /* no-op */ }

    // ------------------------------------------------------------------------
    // Listener → JS event bridge
    // ------------------------------------------------------------------------

    private fun emit(eventName: String, payload: WritableMap) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, payload)
        } catch (t: Throwable) {
            Log.w(TAG, "emit($eventName) failed: ${t.message}")
        }
    }

    private val bridgeListener = object : SakhaVoiceListener {
        override fun onStateChanged(state: SakhaVoiceState, previousState: SakhaVoiceState) {
            emit("SakhaVoiceState", Arguments.createMap().apply {
                putString("state", state.name)
                putString("previousState", previousState.name)
            })
        }

        override fun onPartialTranscript(text: String) {
            emit("SakhaVoicePartialTranscript", Arguments.createMap().apply {
                putString("text", text)
            })
        }

        override fun onFinalTranscript(text: String) {
            emit("SakhaVoiceFinalTranscript", Arguments.createMap().apply {
                putString("text", text)
            })
        }

        override fun onEngineSelected(engine: SakhaEngine, mood: SakhaMood, intensity: Int) {
            emit("SakhaVoiceEngineSelected", Arguments.createMap().apply {
                putString("engine", engine.wire)
                putString("mood", mood.wire)
                putInt("intensity", intensity)
            })
        }

        override fun onSakhaText(textDelta: String, isFinal: Boolean) {
            emit("SakhaVoiceText", Arguments.createMap().apply {
                putString("delta", textDelta)
                putBoolean("isFinal", isFinal)
            })
        }

        override fun onSpokenSegment(text: String, isSanskrit: Boolean) {
            emit("SakhaVoiceSpoken", Arguments.createMap().apply {
                putString("text", text)
                putBoolean("isSanskrit", isSanskrit)
            })
        }

        override fun onPause(durationMs: Long) {
            emit("SakhaVoicePause", Arguments.createMap().apply {
                putDouble("durationMs", durationMs.toDouble())
            })
        }

        override fun onVerseCited(reference: String, sanskrit: String?) {
            emit("SakhaVoiceVerseCited", Arguments.createMap().apply {
                putString("reference", reference)
                sanskrit?.let { putString("sanskrit", it) }
            })
        }

        override fun onFilterFail() {
            emit("SakhaVoiceFilterFail", Arguments.createMap())
        }

        override fun onTurnComplete(metrics: SakhaTurnMetrics) {
            emit("SakhaVoiceTurnComplete", Arguments.createMap().apply {
                metrics.sessionId?.let { putString("sessionId", it) }
                putString("engine", metrics.engine.wire)
                putString("mood", metrics.mood.wire)
                putInt("moodIntensity", metrics.moodIntensity)
                putString("language", metrics.language.wire)
                putInt("transcriptChars", metrics.transcriptChars)
                putInt("responseChars", metrics.responseChars)
                putDouble("sttDurationMs", metrics.sttDurationMs.toDouble())
                putDouble("firstByteMs", metrics.firstByteMs.toDouble())
                putDouble("firstAudioMs", metrics.firstAudioMs.toDouble())
                putDouble("totalSpokenMs", metrics.totalSpokenMs.toDouble())
                putInt("pauseCount", metrics.pauseCount)
                metrics.verseCited?.let { putString("verseCited", it) }
                putBoolean("filterFail", metrics.filterFail)
                putBoolean("personaGuardTriggered", metrics.personaGuardTriggered)
                putBoolean("barged", metrics.barged)
            })
        }

        override fun onError(error: SakhaVoiceError) {
            emit("SakhaVoiceError", Arguments.createMap().apply {
                putString("code", error::class.simpleName ?: "Unknown")
                putString("message", error.message ?: "Unknown")
                putBoolean("recoverable", error.isRecoverable)
            })
        }
    }
}

/**
 * Tiny ReadableMap helpers — RN's API throws on missing keys, so we wrap with
 * sensible defaults to keep the JS-facing config tolerant.
 */
private fun ReadableMap.optString(key: String): String? =
    if (hasKey(key) && !isNull(key)) getString(key) else null

private fun ReadableMap.optBoolean(key: String, default: Boolean): Boolean =
    if (hasKey(key) && !isNull(key)) getBoolean(key) else default

private fun ReadableMap.optDouble(key: String, default: Double): Double =
    if (hasKey(key) && !isNull(key)) getDouble(key) else default

private fun ReadableMap.optInt(key: String, default: Int): Int =
    if (hasKey(key) && !isNull(key)) getInt(key) else default
