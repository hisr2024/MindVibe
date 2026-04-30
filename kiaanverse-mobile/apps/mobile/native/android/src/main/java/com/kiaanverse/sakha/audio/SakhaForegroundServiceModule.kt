/**
 * SakhaForegroundServiceModule — JS bridge over SakhaForegroundService.
 *
 * voice/hooks/useForegroundService.ts calls
 * `NativeModules.SakhaForegroundService.start()` / `.stop()` — the
 * matching Promise-returning methods are declared here. Without this
 * module registered, `NativeModules.SakhaForegroundService` is
 * `undefined` and the JS hook silently no-ops, which lets the OS kill
 * the voice session ~30s after the user backgrounds the app on
 * Android 14+.
 *
 * Methods delegate to the existing static helpers on
 * SakhaForegroundService.start(context) / .stop(context); all of the
 * actual notification + foreground-service lifecycle remains there so
 * we keep a single source of truth.
 */

package com.kiaanverse.sakha.audio

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SakhaForegroundServiceModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = NAME

    /**
     * Start the foreground service. The OS will throw if
     * FOREGROUND_SERVICE_MICROPHONE / FOREGROUND_SERVICE_MEDIA_PLAYBACK
     * permissions aren't declared in the manifest (handled by
     * app.config.ts) — surface that as a typed reject so the JS
     * hook can log and continue without crashing the voice canvas.
     */
    @ReactMethod
    fun start(promise: Promise) {
        try {
            SakhaForegroundService.start(reactApplicationContext)
            promise.resolve(null)
        } catch (t: Throwable) {
            promise.reject("FOREGROUND_SERVICE_START_FAILED", t.message, t)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        try {
            SakhaForegroundService.stop(reactApplicationContext)
            promise.resolve(null)
        } catch (t: Throwable) {
            promise.reject("FOREGROUND_SERVICE_STOP_FAILED", t.message, t)
        }
    }

    companion object {
        const val NAME = "SakhaForegroundService"
    }
}
