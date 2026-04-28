# KIAAN Voice Native ProGuard rules — consumed by the host app at link time.
#
# Mirrors Step 5 (Sakha) for the KIAAN voice module. Self-contained .aar:
# consumers don't need to depend on the host app's expo-build-properties
# extraProguardRules block.

# KIAAN voice package — RN bridge registration + manager / orchestrator /
# wake-word singletons. The package class is invoked reflectively by
# Expo's autolinker, and the inner managers are accessed via getInstance()
# from a future KiaanVoiceModule, so keep the full surface.
-keep class com.mindvibe.kiaan.voice.** { *; }
-keep interface com.mindvibe.kiaan.voice.** { *; }

# React Native module annotations + ReactPackage subclass discovery.
-keep @com.facebook.react.module.annotations.ReactModule class * { *; }
-keep class * implements com.facebook.react.bridge.ReactPackage { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }

# TensorFlow Lite — KiaanWakeWordDetector loads .tflite models and
# uses NnApiDelegate / GpuDelegate which the runtime resolves
# reflectively. R8 otherwise strips JNI symbol tables and the
# delegate constructors fail at first inference.
-keep class org.tensorflow.lite.** { *; }
-keep interface org.tensorflow.lite.** { *; }
-dontwarn org.tensorflow.lite.**

# Kotlin coroutines — reflective DebugProbes paths cause harmless
# warnings under R8 in release builds.
-dontwarn kotlinx.coroutines.debug.**
-dontwarn kotlinx.coroutines.flow.**
