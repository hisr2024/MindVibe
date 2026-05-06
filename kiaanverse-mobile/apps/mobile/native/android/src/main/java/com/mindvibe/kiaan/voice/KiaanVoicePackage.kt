/**
 * KIAAN Voice — React Native Package (Phase 1 scaffold).
 *
 * Registered at runtime by `withKiaanSakhaVoicePackages` (PR #1700),
 * which patches MainApplication.kt to call `add(KiaanVoicePackage())`
 * inside `PackageList(this).packages.apply { ... }`. This file lives
 * in the in-tree gradle subproject `:kiaan-voice-native`
 * (apps/mobile/native/android/), which the same plugin links into :app.
 *
 * Phase 1 deliberately registers an empty NativeModule list. The Kotlin
 * sources already in this package
 *
 *   - KiaanVoiceManager.kt           (state machine + lifecycle singleton)
 *   - KiaanComputeTrinity.kt         (NPU/GPU/CPU task router)
 *   - KiaanWakeWordDetector.kt       (TFLite NNAPI wake-word)
 *   - KiaanEngineOrchestrator.kt     (Friend/Guidance/Navigation engines)
 *
 * are managers/services consumed by SakhaVoiceManager, not RN bridge
 * modules. The bridge module (KiaanVoiceModule extending
 * ReactContextBaseJavaModule) lands in a later feature step alongside
 * the KIAAN voice screen — when there's a concrete JS-facing surface
 * to expose. Until then, this package's only job is to give R8 + the
 * RN bridge a real ReactPackage class to instantiate so the AAR
 * containing the manager/service singletons stays on the compile
 * classpath of :app.
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
