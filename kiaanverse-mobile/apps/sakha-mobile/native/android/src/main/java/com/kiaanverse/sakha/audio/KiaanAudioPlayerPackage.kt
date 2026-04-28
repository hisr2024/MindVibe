/**
 * KiaanAudioPlayerPackage — registers KiaanAudioPlayerModule with the
 * React Native bridge.
 *
 * Discovered automatically by Expo autolinking via expo-module.config.json.
 * Without this class the module is invisible to JS and NativeModules
 * .KiaanAudioPlayer is undefined at runtime.
 */

package com.kiaanverse.sakha.audio

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class KiaanAudioPlayerPackage : ReactPackage {
    override fun createNativeModules(
        reactContext: ReactApplicationContext,
    ): List<NativeModule> = listOf(KiaanAudioPlayerModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): List<ViewManager<*, *>> = emptyList()
}
