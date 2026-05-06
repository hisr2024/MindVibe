# KiaanAudioPlayer ProGuard rules — consumed by the host app at link time.
#
# Mirrors the keep rules already declared in app.config.ts under
# expo-build-properties.android.extraProguardRules (which fires first
# during prebuild). Keeping them here too makes the AAR self-contained:
# anyone consuming this module gets the rules without depending on the
# host app's expo-build-properties block.

# KiaanAudioPlayer + SakhaForegroundService JNI bridges
-keep class com.kiaanverse.sakha.audio.** { *; }
-keep interface com.kiaanverse.sakha.audio.** { *; }

# Sakha / Kiaan Voice ReactPackages — registered by name from
# MainApplication.kt via the withKiaanSakhaVoicePackages plugin.
# Without these keeps, R8 strips the constructors and crashes with
# `ClassNotFoundException: com.mindvibe.kiaan.voice.KiaanVoicePackage`
# (or SakhaVoicePackage) the moment the host app tries to instantiate
# them at startup.
-keep class com.mindvibe.kiaan.voice.** { *; }
-keep interface com.mindvibe.kiaan.voice.** { *; }

# AndroidX Media3 / ExoPlayer — loaded reflectively from JNI
-keep class androidx.media3.** { *; }
-keep interface androidx.media3.** { *; }
-dontwarn androidx.media3.**

# OkHttp 4 + Okio — SakhaSseClient streams the voice-companion
# conversation. OkHttp/Okio ship their own consumer-rules.pro, but
# the host app's R8 step doesn't always pick them up reliably — keep
# defensively here so this AAR is self-sufficient when consumed.
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

# TensorFlow Lite — Interpreter, NnApiDelegate, GpuDelegate. JNI
# delegates depend on @Keep-annotated entry points; without these
# rules R8 can strip the symbols the .so libraries dlsym() at runtime,
# producing UnsatisfiedLinkError on first inference.
-keep class org.tensorflow.lite.** { *; }
-keep interface org.tensorflow.lite.** { *; }
-dontwarn org.tensorflow.lite.**

# kotlinx.coroutines — heavy use in SakhaVoiceManager / KiaanVoiceManager
# state machines. Keeping volatile fields preserves the
# DebugProbesImpl agent and the Continuation/Job machinery R8 sometimes
# trims overzealously.
-keep class kotlinx.coroutines.** { volatile <fields>; }
-dontwarn kotlinx.coroutines.**

# React Native module annotations
-keep @com.facebook.react.module.annotations.ReactModule class * { *; }
-keep class * implements com.facebook.react.bridge.ReactPackage { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }

# Visualizer (RMS metering) — Android platform class, no rules needed,
# but keep our subclass-style usages.
-keep class android.media.audiofx.Visualizer { *; }
