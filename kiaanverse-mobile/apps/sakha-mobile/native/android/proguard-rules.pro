# KiaanAudioPlayer ProGuard rules — consumed by the host app at link time.
#
# Mirrors the keep rules already declared in app.config.ts under
# expo-build-properties.android.extraProguardRules (which fires first
# during prebuild). Keeping them here too makes the AAR self-contained:
# anyone consuming this module gets the rules without depending on the
# host app's expo-build-properties block.

# KiaanAudioPlayer JNI bridge
-keep class com.kiaanverse.sakha.audio.** { *; }
-keep interface com.kiaanverse.sakha.audio.** { *; }

# AndroidX Media3 / ExoPlayer — loaded reflectively from JNI
-keep class androidx.media3.** { *; }
-keep interface androidx.media3.** { *; }
-dontwarn androidx.media3.**

# React Native module annotations
-keep @com.facebook.react.module.annotations.ReactModule class * { *; }
-keep class * implements com.facebook.react.bridge.ReactPackage { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }

# Visualizer (RMS metering) — Android platform class, no rules needed,
# but keep our subclass-style usages.
-keep class android.media.audiofx.Visualizer { *; }
