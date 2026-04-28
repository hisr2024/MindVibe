# Sakha Voice Native ProGuard rules — consumed by the host app at link time.
#
# Mirrors the keep rules already declared in apps/sakha-mobile/app.config.ts
# under expo-build-properties.android.extraProguardRules (which fires first
# during prebuild). Keeping them here too makes the .aar self-contained:
# anyone consuming this module gets the rules without depending on the
# host app's expo-build-properties block.

# Sakha voice package — RN bridge module + manager + SSE/TTS pipeline.
# Keep both classes and interfaces; the bridge is invoked reflectively.
-keep class com.mindvibe.kiaan.voice.sakha.** { *; }
-keep interface com.mindvibe.kiaan.voice.sakha.** { *; }

# React Native module annotations + ReactPackage subclass discovery.
-keep @com.facebook.react.module.annotations.ReactModule class * { *; }
-keep class * implements com.facebook.react.bridge.ReactPackage { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }

# OkHttp 4.12 — SakhaSseClient + SakhaTtsPlayer rely on these. R8 can
# otherwise strip platform helpers used reflectively.
-dontwarn okhttp3.internal.platform.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

# Kotlin coroutines — reflective DebugProbes paths cause harmless warnings
# under R8 in release builds.
-dontwarn kotlinx.coroutines.debug.**
-dontwarn kotlinx.coroutines.flow.**
