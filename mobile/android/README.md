# MindVibe Android App 🤖

Native Android application for MindVibe, built with Kotlin and Jetpack Compose following Material Design 3 guidelines.

## 📋 Project Information

- **Package Name**: `com.mindvibe.app`
- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 34 (Android 14)
- **Language**: Kotlin 1.9+
- **UI Framework**: Jetpack Compose
- **Architecture**: MVVM + Clean Architecture

## 🏗️ Project Structure

```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/mindvibe/app/
│   │   │   │   ├── data/          # Data layer
│   │   │   │   │   ├── api/       # API clients
│   │   │   │   │   ├── local/     # Room database
│   │   │   │   │   └── repository/ # Repositories
│   │   │   │   ├── domain/        # Business logic
│   │   │   │   │   ├── model/     # Domain models
│   │   │   │   │   └── usecase/   # Use cases
│   │   │   │   ├── presentation/  # UI layer
│   │   │   │   │   ├── ui/
│   │   │   │   │   │   ├── auth/
│   │   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   ├── chat/
│   │   │   │   │   │   ├── mood/
│   │   │   │   │   │   ├── journal/
│   │   │   │   │   │   └── gita/
│   │   │   │   │   └── viewmodel/
│   │   │   │   ├── di/            # Dependency injection
│   │   │   │   ├── navigation/    # Navigation
│   │   │   │   └── utils/         # Utilities
│   │   │   ├── res/               # Resources
│   │   │   │   ├── values/        # Strings, colors, themes
│   │   │   │   ├── values-hi/     # Hindi strings
│   │   │   │   └── values-*/      # Other languages
│   │   │   └── AndroidManifest.xml
│   │   └── test/                  # Unit tests
│   │   └── androidTest/           # Instrumented tests
│   └── build.gradle.kts
├── gradle/
├── build.gradle.kts
├── settings.gradle.kts
└── README.md (this file)
```

## 🛠️ Technology Stack

### Core
- **Kotlin**: 1.9+
- **Jetpack Compose**: Latest stable
- **Material Design 3**: Material You theming

### Architecture Components
- **ViewModel**: Lifecycle-aware UI data
- **LiveData/StateFlow**: Observable data streams
- **Room**: Local database
- **WorkManager**: Background tasks
- **Paging 3**: Efficient data loading

### Networking
- **Retrofit**: REST API client
- **OkHttp**: HTTP client with interceptors
- **Gson/Moshi**: JSON serialization
- **Coil**: Image loading

### Async & Reactive
- **Coroutines**: Asynchronous programming
- **Flow**: Reactive data streams
- **StateFlow**: State management

### Dependency Injection
- **Hilt**: Dependency injection framework

### Security
- **Android Keystore**: Secure credential storage
- **EncryptedSharedPreferences**: Encrypted preferences
- **SQLCipher**: Encrypted database (for journal)

### Testing
- **JUnit 5**: Unit testing
- **MockK**: Mocking framework
- **Turbine**: Flow testing
- **Espresso**: UI testing
- **Compose Testing**: Compose UI testing

## 🚀 Getting Started

### Prerequisites
1. Android Studio Hedgehog (2023.1.1) or newer
2. JDK 17 or newer
3. Android SDK 34
4. Gradle 8.0+

### Setup
1. Open the `android` directory in Android Studio
2. Sync Gradle files
3. Create `local.properties` file:
   ```properties
   sdk.dir=/path/to/Android/sdk
   api.base.url=http://10.0.2.2:8000
   ```
4. Build and run the app

### Configuration

Create `app/src/main/res/values/api_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Development -->
    <string name="api_base_url_dev">http://10.0.2.2:8000</string>
    
    <!-- Production -->
    <string name="api_base_url_prod">https://api.mindvibe.com</string>
</resources>
```

## 🔑 Build Variants

### Debug
- Development API endpoint
- Logging enabled
- Debug tools included
- No code obfuscation

### Release
- Production API endpoint
- Logging disabled
- ProGuard/R8 enabled
- Code signing required

## 📦 Dependencies

Key dependencies (see `build.gradle.kts` for versions):

```kotlin
dependencies {
    // Compose
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    
    // Architecture
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose")
    implementation("androidx.lifecycle:lifecycle-runtime-compose")
    
    // Navigation
    implementation("androidx.navigation:navigation-compose")
    
    // Networking
    implementation("com.squareup.retrofit2:retrofit")
    implementation("com.squareup.retrofit2:converter-gson")
    implementation("com.squareup.okhttp3:okhttp")
    implementation("com.squareup.okhttp3:logging-interceptor")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android")
    
    // Dependency Injection
    implementation("com.google.dagger:hilt-android")
    kapt("com.google.dagger:hilt-compiler")
    
    // Room
    implementation("androidx.room:room-runtime")
    implementation("androidx.room:room-ktx")
    kapt("androidx.room:room-compiler")
    
    // Security
    implementation("androidx.security:security-crypto")
    
    // Image Loading
    implementation("io.coil-kt:coil-compose")
    
    // Testing
    testImplementation("junit:junit")
    testImplementation("io.mockk:mockk")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
}
```

## 🎨 UI/UX Guidelines

### Material Design 3
- Dynamic color support (Material You)
- Adaptive layouts for tablets and foldables
- Dark theme support
- Edge-to-edge display
- Predictive back gestures

### Theming
Colors defined in `ui/theme/Color.kt`:
```kotlin
val PrimaryLight = Color(0xFF6750A4)
val PrimaryDark = Color(0xFFD0BCFF)
// ... more colors
```

Typography in `ui/theme/Type.kt`:
```kotlin
val Typography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontSize = 57.sp,
        lineHeight = 64.sp
    ),
    // ... more styles
)
```

## 🔒 Security Features

### Data Encryption
- Journal entries encrypted with AES-256
- Encryption keys stored in Android Keystore
- Biometric authentication for app access

### Network Security
- Certificate pinning for API calls
- TLS 1.3 enforcement
- Cleartext traffic disabled in production

### Code Protection
- ProGuard/R8 obfuscation
- Root detection
- Tamper detection
- Debug checks

## 🧪 Testing

### Unit Tests
```bash
./gradlew test
```

### Instrumented Tests
```bash
./gradlew connectedAndroidTest
```

### UI Tests
```bash
./gradlew connectedDebugAndroidTest
```

### Code Coverage
```bash
./gradlew jacocoTestReport
```

## 🌐 Localization

Supported languages in `res/values-*/`:
- `values` - English (default)
- `values-hi` - Hindi
- `values-ta` - Tamil
- `values-te` - Telugu
- `values-bn` - Bengali
- `values-mr` - Marathi
- `values-gu` - Gujarati
- `values-kn` - Kannada
- `values-ml` - Malayalam
- `values-pa` - Punjabi
- `values-sa` - Sanskrit
- `values-es` - Spanish
- `values-fr` - French
- `values-de` - German
- `values-pt` - Portuguese
- `values-ja` - Japanese
- `values-zh` - Chinese

## 📱 Features

### Implemented
- ✅ Project structure
- ✅ Build configuration
- ✅ Theming system

### In Development
- 🔄 Authentication
- 🔄 Navigation
- 🔄 API client

### Planned
- [ ] KIAAN chat interface
- [ ] Mood tracking
- [ ] Journal with encryption
- [ ] Bhagavad Gita reader
- [ ] Analytics dashboard
- [ ] Offline support
- [ ] Push notifications

## 🚢 Building Release APK/AAB

### Generate Release APK
```bash
./gradlew assembleRelease
```

### Generate Release AAB (for Play Store)
```bash
./gradlew bundleRelease
```

### Signing Configuration
Add to `app/build.gradle.kts`:
```kotlin
android {
    signingConfigs {
        create("release") {
            storeFile = file("path/to/keystore.jks")
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = System.getenv("KEY_ALIAS")
            keyPassword = System.getenv("KEY_PASSWORD")
        }
    }
}
```

## 📊 Performance

### App Size
- Target APK size: < 10 MB
- With resources: < 20 MB
- Techniques: ProGuard, resource shrinking, native lib optimization

### Startup Time
- Cold start: < 2 seconds
- Warm start: < 500ms
- Techniques: Lazy initialization, StartUp library

### Memory
- Baseline: < 50 MB
- With chat active: < 100 MB
- Techniques: Bitmap pooling, leak detection

## 🐛 Debugging

### Enable Logging
```kotlin
if (BuildConfig.DEBUG) {
    Timber.plant(Timber.DebugTree())
}
```

### Network Inspection
- Use OkHttp Logging Interceptor
- Charles Proxy for detailed inspection
- Android Studio Network Profiler

### UI Debugging
- Layout Inspector
- Compose Preview
- Screenshot testing

## 🔗 Useful Links

- [Kotlin Documentation](https://kotlinlang.org/docs/home.html)
- [Jetpack Compose](https://developer.android.com/jetpack/compose)
- [Material Design 3](https://m3.material.io/)
- [Android Developers](https://developer.android.com/)
- [MindVibe API Docs](../../docs/MOBILE_BFF.md)

## 📄 License

MIT License - see [LICENSE](../../LICENSE)

---

**Built with ❤️ using Kotlin and Jetpack Compose**
