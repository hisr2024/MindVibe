/**
 * SakhaVoicePackage — registers SakhaVoiceModule with the React Native
 * bridge so `NativeModules.SakhaVoice` resolves at runtime.
 *
 * The Expo plugin `withKiaanSakhaVoicePackages` injects:
 *
 *     import com.mindvibe.kiaan.voice.sakha.SakhaVoicePackage
 *     packages.add(SakhaVoicePackage())
 *
 * into MainApplication.kt at prebuild. Both the import and the
 * constructor reference must resolve at javac time or the AAB build
 * fails before R8 — the original cause of the production build break.
 *
 * The module returned here is intentionally a SAFE STUB (see
 * SakhaVoiceModule). Real implementation can be filled in without
 * changing this Package class or touching the plugin again.
 */

package com.mindvibe.kiaan.voice.sakha

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class SakhaVoicePackage : ReactPackage {
    override fun createNativeModules(
        reactContext: ReactApplicationContext,
    ): List<NativeModule> = listOf(SakhaVoiceModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): List<ViewManager<*, *>> = emptyList()
}
