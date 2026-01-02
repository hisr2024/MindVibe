# Android Setup Guide

Complete guide to setting up the MindVibe Android development environment.

## 📋 Prerequisites

### Required Software
1. **Android Studio Hedgehog (2023.1.1) or newer**
   - Download from [developer.android.com](https://developer.android.com/studio)
   - Install with default components

2. **JDK 17 or newer**
   ```bash
   # Check Java version
   java -version
   
   # Install via SDKMAN (recommended)
   sdk install java 17.0.9-zulu
   ```

3. **Android SDK**
   - API Level 24 (Android 7.0) - minimum
   - API Level 34 (Android 14) - target
   - Install via Android Studio SDK Manager

4. **Git**
   ```bash
   git --version
   ```

### Optional Tools
- **Gradle** (bundled with project)
- **Scrcpy** - for device screen mirroring
- **ADB** (Android Debug Bridge) - bundled with Android SDK

## 🚀 Initial Setup

### 1. Clone Repository
```bash
git clone https://github.com/hisr2024/MindVibe.git
cd MindVibe/mobile/android
```

### 2. Configure Environment

Create `local.properties` in the `android` directory:
```properties
sdk.dir=/path/to/Android/sdk

# API Configuration
api.base.url=http://10.0.2.2:8000
api.key=your_api_key_here
```

### 3. Open in Android Studio

1. Launch Android Studio
2. Select "Open" from welcome screen
3. Navigate to `MindVibe/mobile/android`
4. Click "OK"
5. Wait for Gradle sync to complete

### 4. Install SDK Components

Android Studio will prompt to install missing SDK components. Accept all installations.

Alternatively, use SDK Manager:
```
Tools → SDK Manager → SDK Platforms
- Android 14.0 (API 34) ✓
- Android 7.0 (API 24) ✓

Tools → SDK Manager → SDK Tools
- Android SDK Build-Tools 34.0.0 ✓
- Android Emulator ✓
- Android SDK Platform-Tools ✓
- Google Play Services ✓
```

## 📱 Device Setup

### Option 1: Android Emulator (Recommended for Development)

1. Open AVD Manager:
   ```
   Tools → Device Manager
   ```

2. Create Virtual Device:
   - Click "Create Device"
   - Select "Phone" category
   - Choose device: Pixel 5 or newer
   - Select system image: Android 14.0 (API 34)
   - Advanced Settings:
     - RAM: 2048 MB minimum
     - Internal Storage: 2048 MB
     - Graphics: Hardware - GLES 2.0
   - Click "Finish"

3. Start Emulator:
   - Select device from list
   - Click "Play" button

### Option 2: Physical Device

1. Enable Developer Options on your Android device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Return to Settings
   - Navigate to Developer Options

2. Enable USB Debugging:
   - In Developer Options
   - Toggle "USB Debugging" on

3. Connect device via USB

4. Verify connection:
   ```bash
   adb devices
   ```

5. Accept USB debugging prompt on device

## 🔧 Build Configuration

### Debug Build
```bash
./gradlew assembleDebug
```

Output: `app/build/outputs/apk/debug/app-debug.apk`

### Release Build
```bash
./gradlew assembleRelease
```

For signed release builds, configure signing in `app/build.gradle.kts`:
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
    
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

## 🧪 Running Tests

### Unit Tests
```bash
# Run all unit tests
./gradlew test

# Run with coverage
./gradlew testDebugUnitTest jacocoTestReport

# Run specific test class
./gradlew test --tests "AuthViewModelTest"

# Run specific test method
./gradlew test --tests "AuthViewModelTest.testLoginSuccess"
```

### Instrumented Tests (UI Tests)
```bash
# Run all instrumented tests
./gradlew connectedAndroidTest

# Run on specific device
./gradlew connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.device=emulator-5554

# Run specific test class
./gradlew connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.mindvibe.app.LoginScreenTest
```

## 🐛 Debugging

### Logcat
View logs in Android Studio:
```
View → Tool Windows → Logcat
```

Or via command line:
```bash
adb logcat
```

Filter by tag:
```bash
adb logcat -s MindVibe
```

### Network Debugging

1. **Using Charles Proxy**:
   - Install Charles Proxy
   - Configure proxy on device: Settings → Wi-Fi → Modify Network → Proxy
   - Set proxy to your computer's IP and port 8888

2. **Using Android Studio**:
   - View → Tool Windows → App Inspection
   - Select Network Inspector

### Layout Inspector

Debug UI hierarchy:
```
Tools → Layout Inspector
```

Or:
```
View → Tool Windows → App Inspection → Layout Inspector
```

## 🔍 Common Issues

### Issue: Gradle Sync Failed
**Solution**:
```bash
# Clean and rebuild
./gradlew clean
./gradlew build --refresh-dependencies
```

### Issue: SDK Not Found
**Solution**:
1. Check `local.properties` has correct SDK path
2. Or set `ANDROID_HOME` environment variable:
   ```bash
   export ANDROID_HOME=/path/to/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### Issue: Emulator Won't Start
**Solution**:
1. Check virtualization is enabled in BIOS
2. Update Intel HAXM or AMD hypervisor:
   ```
   SDK Manager → SDK Tools → Intel x86 Emulator Accelerator (HAXM installer)
   ```

### Issue: App Crashes on Startup
**Solution**:
1. Check Logcat for stack trace
2. Verify API endpoint is accessible:
   ```bash
   # From emulator, 10.0.2.2 maps to host's localhost
   adb shell
   curl http://10.0.2.2:8000/docs
   ```

### Issue: Cannot Connect to Backend API
**Solution**:
1. Ensure backend is running: `uvicorn backend.main:app --reload`
2. Use `10.0.2.2:8000` for emulator (not `localhost`)
3. For physical device, use computer's IP address
4. Check firewall settings

## 📚 Additional Resources

### Learning Resources
- [Android Developer Documentation](https://developer.android.com/docs)
- [Jetpack Compose Tutorial](https://developer.android.com/jetpack/compose/tutorial)
- [Kotlin Documentation](https://kotlinlang.org/docs/home.html)
- [Material Design Guidelines](https://m3.material.io/)

### Tools
- [Android Studio Tips](https://developer.android.com/studio/intro/keyboard-shortcuts)
- [Gradle User Manual](https://docs.gradle.org/current/userguide/userguide.html)
- [ADB Commands Cheat Sheet](https://developer.android.com/studio/command-line/adb)

### MindVibe Documentation
- [Mobile README](../README.md)
- [API Integration Guide](../docs/API_INTEGRATION.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Testing Guide](../docs/TESTING.md)

## 🎓 Next Steps

1. **Explore Project Structure**: Familiarize yourself with the codebase
2. **Run the App**: Build and run on emulator or device
3. **Make Changes**: Try modifying a screen or adding a feature
4. **Run Tests**: Ensure your changes don't break existing functionality
5. **Submit PR**: Follow the contribution guidelines

---

**Happy Android Development! 🤖**
