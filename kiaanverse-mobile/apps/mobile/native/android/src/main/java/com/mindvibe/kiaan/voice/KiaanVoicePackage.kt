/**
 * KiaanVoicePackage — bridge registration for the Kiaan Voice Companion
 * native surface (formerly @kiaanverse/kiaan-voice-native).
 *
 * The Expo config plugin `withKiaanSakhaVoicePackages` injects:
 *
 *     import com.mindvibe.kiaan.voice.KiaanVoicePackage
 *     packages.add(KiaanVoicePackage())
 *
 * into MainApplication.kt at prebuild time. Without this class on the
 * classpath, javac fails the AAB build before R8 runs, which is the
 * concrete reason the production Play Store build was breaking.
 *
 * Today this package contributes ZERO modules at runtime — the actual
 * Kiaan Voice features (TTS playback, audio focus orchestration,
 * streaming player) are exposed through the existing
 * `KiaanAudioPlayerPackage` (com.kiaanverse.sakha.audio.*). This shell
 * is intentionally minimal: it exists only to satisfy the symbol that
 * MainApplication.kt now references, so the build compiles and the
 * Sakha companion can ship while real native features land
 * incrementally in follow-up commits.
 *
 * When a real Kiaan Voice native module is required (e.g., on-device
 * VAD, Cobra/Picovoice integration, custom DSP), add it to the list
 * returned by `createNativeModules` here. ReactPackages are additive;
 * having more than one is normal and safe.
 */

package com.mindvibe.kiaan.voice

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class KiaanVoicePackage : ReactPackage {
    override fun createNativeModules(
        reactContext: ReactApplicationContext,
    ): List<NativeModule> = emptyList()

    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): List<ViewManager<*, *>> = emptyList()
}
