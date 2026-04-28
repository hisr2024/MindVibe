/**
 * KIAAN Voice — React Native Package (Phase 1 scaffold).
 *
 * Registration target for Expo's autolinker. The
 * @kiaanverse/kiaan-voice-native module's expo-module.config.json points
 * at this class so prebuild generates an entry in ExpoModulesProvider.kt.
 *
 * Phase 1 deliberately registers an empty module list. The Kotlin sources
 * already in this package
 *
 *   - KiaanVoiceManager.kt           (state machine + lifecycle singleton)
 *   - KiaanComputeTrinity.kt         (NPU/GPU/CPU task router)
 *   - KiaanWakeWordDetector.kt       (TFLite NNAPI wake-word)
 *   - KiaanEngineOrchestrator.kt     (Friend/Guidance/Navigation engines)
 *
 * are managers/services, not RN bridge modules. The bridge module
 * (KiaanVoiceModule extending ReactContextBaseJavaModule) lands in a
 * later feature step alongside the KIAAN voice screen — when there's a
 * concrete JS-facing surface to expose.
 *
 * Until then, this package's only job is to be a real Kotlin class so
 * the Expo autolinker has a registration target. Adding it now (rather
 * than leaving expo-module.config.json pointing at a phantom class)
 * means prebuild succeeds and the .aab build pipeline is green for
 * apps/mobile while feature work proceeds independently.
 */

package com.mindvibe.kiaan.voice

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class KiaanVoicePackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        emptyList()

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
