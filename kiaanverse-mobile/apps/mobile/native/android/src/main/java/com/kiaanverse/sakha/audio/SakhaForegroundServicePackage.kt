/**
 * SakhaForegroundServicePackage — registers
 * SakhaForegroundServiceModule with the React Native bridge.
 *
 * Without this ReactPackage being added to MainApplication.kt's
 * `packages` list, the module class is on the classpath but never
 * registered — so `NativeModules.SakhaForegroundService` is undefined
 * at runtime even though the Service itself exists in the manifest.
 *
 * The withKiaanSakhaVoicePackages plugin injects this package in the
 * same MainApplication.kt block as KiaanVoicePackage and
 * SakhaVoicePackage.
 */

package com.kiaanverse.sakha.audio

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class SakhaForegroundServicePackage : ReactPackage {
    override fun createNativeModules(
        reactContext: ReactApplicationContext,
    ): List<NativeModule> = listOf(SakhaForegroundServiceModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): List<ViewManager<*, *>> = emptyList()
}
