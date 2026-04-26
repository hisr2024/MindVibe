/**
 * Sakha Voice — React Native Package
 *
 * Registers [SakhaVoiceModule] with the React Native runtime so JS code can
 * import it via `NativeModules.SakhaVoice`. Add this package to your
 * MainApplication.kt:
 *
 *   override fun getPackages(): List<ReactPackage> = PackageList(this).packages.apply {
 *       add(SakhaVoicePackage())
 *   }
 *
 * The Expo config plugin in this branch wires the registration automatically
 * during prebuild (see plugins/with-sakha-voice.ts).
 */

package com.mindvibe.kiaan.voice.sakha

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class SakhaVoicePackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(SakhaVoiceModule(reactContext))

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
