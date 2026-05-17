# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# @generated begin expo-build-properties - expo prebuild (DO NOT MODIFY)
# react-native-track-player audio pipeline (keep — see app.config.ts)
-keep class com.doublesymmetry.** { *; }
-keep interface com.doublesymmetry.** { *; }
-keep class com.guichaguri.trackplayer.** { *; }
-keep interface com.guichaguri.trackplayer.** { *; }
-keep class com.doublesymmetry.kotlinaudio.** { *; }
-keep interface com.doublesymmetry.kotlinaudio.** { *; }
-keep class androidx.media.** { *; }
-keep class androidx.media3.** { *; }
-keep interface androidx.media3.** { *; }
-keep class com.google.android.exoplayer2.** { *; }
-keep interface com.google.android.exoplayer2.** { *; }
-dontwarn com.google.android.exoplayer2.**
-dontwarn androidx.media3.**
-keep class * extends androidx.media.session.MediaButtonReceiver { *; }

# Sakha Voice Companion — Kotlin TurboModule + foreground service.
# Loaded by JS class name through Fabric autolinking, so R8 strips
# them otherwise; the WSS audio.chunk stream then NoClassDefFoundErrors
# on the first appendChunk Promise call.
-keep class com.kiaanverse.sakha.** { *; }
-keep interface com.kiaanverse.sakha.** { *; }
-dontwarn com.kiaanverse.sakha.**

# Sakha / Kiaan Voice ReactPackages — registered by fully-qualified
# class name from MainApplication.kt by the
# withKiaanSakhaVoicePackages plugin. Without these keeps, R8
# strips the constructors and the host app crashes at startup
# trying to instantiate KiaanVoicePackage / SakhaVoicePackage.
-keep class com.mindvibe.kiaan.voice.** { *; }
-keep interface com.mindvibe.kiaan.voice.** { *; }
-dontwarn com.mindvibe.kiaan.voice.**

# OkHttp 4 + Okio — used by SakhaSseClient for the streaming
# voice-companion conversation. OkHttp 4.x ships its own
# consumer-rules.pro inside the AAR, but we double up here as
# defense-in-depth: if R8 ever skips consumer rules (rare AGP
# bug), the SSE client crashes at first connection. The
# Platform reflection lookups (Android vs JVM SecurityProvider)
# and the protocol-negotiation ServiceLoader path are the
# specific surfaces that lose service implementations under
# aggressive shrinking.
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-keep class okio.** { *; }
-keep interface okio.** { *; }
-keepnames class okhttp3.internal.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

# TensorFlow Lite — used by KiaanWakeWordDetector (NPU/GPU/CPU
# delegate routing) once that path is wired in. NnApiDelegate +
# GpuDelegate use JNI to load native delegates; R8 must not
# strip the @Keep-annotated entry points the JNI looks up.
# TFLite ships consumer rules but they only cover the JNI
# entries — coroutine wrappers around the Interpreter need
# our broader keep rule to survive.
-keep class org.tensorflow.lite.** { *; }
-keep interface org.tensorflow.lite.** { *; }
-dontwarn org.tensorflow.lite.**

# kotlinx.coroutines — heavy use across both voice managers
# (SakhaVoiceManager / KiaanVoiceManager). The Continuation
# class metadata feeds debug stacktraces; without keeping the
# debug agent classes, release builds crash with a
# ClassNotFoundException on the first suspending call inside
# a try/catch. -dontwarn covers the MainDispatcherFactory
# ServiceLoader entry that the Android dispatcher provides.
-keep class kotlinx.coroutines.** { volatile <fields>; }
-dontwarn kotlinx.coroutines.**

# react-native-svg (Sambandh Dharma (Relationship Compass) radar + compass-rose). R8
# strips the Fabric/JSI ViewManager classes because they are loaded
# reflectively from JS — the JS bridge instantiates a native view
# whose class is gone, and the resulting NoClassDefFoundError on
# the UI thread aborts the app.
-keep class com.horcrux.svg.** { *; }
-keep interface com.horcrux.svg.** { *; }
-dontwarn com.horcrux.svg.**

# react-native-reanimated (worklet runtime + animated props).
# Reanimated registers C++ JSI bindings on a background thread;
# stripping its Java entry points crashes the worklet runtime
# the first time a useSharedValue / useAnimatedProps fires.
-keep class com.swmansion.reanimated.** { *; }
-keep interface com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-dontwarn com.swmansion.reanimated.**

# react-native-gesture-handler — wired through Reanimated, same
# reflective lookup pattern.
-keep class com.swmansion.gesturehandler.** { *; }
-keep interface com.swmansion.gesturehandler.** { *; }

# lottie-react-native — used by arrival + sacred animations,
# loaded by JS class name from JSON specs.
-keep class com.airbnb.android.react.lottie.** { *; }
-keep class com.airbnb.lottie.** { *; }
-dontwarn com.airbnb.lottie.**

# Hermes Intl ICU bridge — keeps `new Intl.DateTimeFormat(...)`
# from throwing NoClassDefFoundError on stripped builds. Even
# though we replaced our Intl calls with manual formatters in
# 1.3.1, third-party libs (date-fns/intl, RN core) may still
# touch these symbols.
-keep class com.facebook.hermes.intl.** { *; }
-dontwarn com.facebook.hermes.intl.**

# React Native core — keep ReactPackage / ReactModule / view
# manager metadata so autolinked native modules survive R8.
-keep @com.facebook.react.module.annotations.ReactModule class * { *; }
-keep @com.facebook.react.module.annotations.ReactModuleList class * { *; }
-keep class * implements com.facebook.react.bridge.ReactPackage { *; }
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }
# @generated end expo-build-properties

# === react-native-track-player + audio pipeline (added by with-track-player-android.js) ===
-keep class com.doublesymmetry.** { *; }
-keep interface com.doublesymmetry.** { *; }
-keep class com.guichaguri.trackplayer.** { *; }
-keep interface com.guichaguri.trackplayer.** { *; }
-keep class androidx.media.** { *; }
-keep class androidx.media3.** { *; }
-keep interface androidx.media3.** { *; }
-keep class com.google.android.exoplayer2.** { *; }
-keep interface com.google.android.exoplayer2.** { *; }
-dontwarn com.google.android.exoplayer2.**
-dontwarn androidx.media3.**
# kotlin-audio (RNTP's playback engine) loads ExoPlayer extensions reflectively
-keep class com.doublesymmetry.kotlinaudio.** { *; }
-keep interface com.doublesymmetry.kotlinaudio.** { *; }
# Media session callbacks — Android binds these via name
-keep class * extends android.support.v4.media.session.MediaSessionCompat$Callback { *; }
-keep class * extends androidx.media.session.MediaButtonReceiver { *; }
# === end react-native-track-player ===

# === Sambandh Dharma (Relationship Compass) + Sacred animations (added by with-track-player-android.js) ===
# react-native-svg — radar chart + compass-rose chambers crash with
# NoClassDefFoundError when these ViewManager classes are stripped.
-keep class com.horcrux.svg.** { *; }
-keep interface com.horcrux.svg.** { *; }
-dontwarn com.horcrux.svg.**
# react-native-reanimated — worklet runtime + animated props.
-keep class com.swmansion.reanimated.** { *; }
-keep interface com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-dontwarn com.swmansion.reanimated.**
# react-native-gesture-handler — wired through Reanimated.
-keep class com.swmansion.gesturehandler.** { *; }
-keep interface com.swmansion.gesturehandler.** { *; }
# lottie-react-native — JSON-driven sacred animations.
-keep class com.airbnb.android.react.lottie.** { *; }
-keep class com.airbnb.lottie.** { *; }
-dontwarn com.airbnb.lottie.**
# Hermes Intl ICU bridge.
-keep class com.facebook.hermes.intl.** { *; }
-dontwarn com.facebook.hermes.intl.**
# React Native core ViewManagers / ReactPackages — autolinked, reflective.
-keep @com.facebook.react.module.annotations.ReactModule class * { *; }
-keep @com.facebook.react.module.annotations.ReactModuleList class * { *; }
-keep class * implements com.facebook.react.bridge.ReactPackage { *; }
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }
# === end Sambandh Dharma (Relationship Compass) + Sacred animations ===
