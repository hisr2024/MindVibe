# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Kotlin
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.**

# Retrofit
-keepattributes Signature
-keepattributes Exceptions
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# OkHttp
-dontwarn okhttp3.**
-keep class okhttp3.** { *; }

# Gson
-keep class com.google.gson.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Data models
-keep class com.mindvibe.app.data.** { *; }
-keep class com.mindvibe.app.domain.model.** { *; }
-keep class com.mindvibe.app.journey.model.** { *; }
# Wire DTOs + Retrofit interface + repository for the live Journey
# engine. R8 can otherwise rename camelCase Kotlin properties whose
# JSON name is implicit (no @SerializedName), breaking Gson on the AAB
# release build while debug works fine.
-keep class com.mindvibe.app.journey.data.** { *; }
-keepclassmembers class com.mindvibe.app.journey.data.** { *; }

# Room
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *
-dontwarn androidx.room.paging.**

# Compose
-keep class androidx.compose.** { *; }
-dontwarn androidx.compose.**

# Hilt
-keep class dagger.hilt.** { *; }
-keep class javax.inject.** { *; }
# HiltViewModel is an annotation, not a base class — `extends` would
# never match. The right form is `@<annotation> class *`. Hilt's
# generated component code relies on these names being preserved.
-keep @dagger.hilt.android.lifecycle.HiltViewModel class * { *; }
-keep @dagger.hilt.InstallIn class * { *; }
-keep @dagger.Module class * { *; }
-keepclasseswithmembernames class * {
    @dagger.* <fields>;
}
-keep @javax.inject.Inject class * { *; }
-keepclassmembers class * {
    @javax.inject.Inject <init>(...);
}

# Keep line numbers for stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
