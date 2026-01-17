# MindVibe Mobile Apps 📱

This directory contains the infrastructure and codebase for MindVibe's native Android and iOS applications.

## 📁 Directory Structure

```
mobile/
├── android/              # Android app (Kotlin + Jetpack Compose)
├── ios/                  # iOS app (Swift + SwiftUI)
├── shared/              # Shared API clients, models, and utilities
├── docs/                # Mobile-specific documentation
└── README.md           # This file
```

## 🎯 Overview

MindVibe mobile apps provide native experiences for Android and iOS platforms while maintaining feature parity with the web application. The apps follow platform-specific design guidelines and best practices.

### Key Features
- 🤖 **KIAAN Integration** - AI-powered mental health guidance
- 📊 **Mood Tracking** - Native mobile mood tracking with analytics
- 📝 **Encrypted Journal** - Secure journaling with end-to-end encryption
- 🕉️ **Bhagavad Gita Ecosystem** - Access to all 700 verses with wisdom
- 🌐 **17 Languages** - Complete multi-language support
- 🔒 **Privacy-First** - End-to-end encryption and local storage
- ⚡ **Performance** - Optimized for both low-end and high-end devices

## 🏗️ Architecture

### Android App
- **Language**: Kotlin
- **UI Framework**: Jetpack Compose
- **Architecture**: MVVM with Clean Architecture
- **Design System**: Material Design 3
- **Network**: Retrofit + OkHttp
- **Async**: Coroutines + Flow
- **DI**: Hilt (Dagger)
- **Local Storage**: Room Database
- **Security**: Android Keystore for encryption

### iOS App
- **Language**: Swift
- **UI Framework**: SwiftUI
- **Architecture**: MVVM with Combine
- **Design System**: Human Interface Guidelines
- **Network**: URLSession (or Alamofire)
- **Async**: async/await + Combine
- **DI**: Manual or Resolver
- **Local Storage**: Core Data or SwiftData
- **Security**: Keychain for secure storage

### Shared Components
- **API Client Specifications**: OpenAPI/Swagger specs for code generation
- **Data Models**: Shared model documentation
- **Authentication**: JWT token-based auth with refresh tokens
- **Encryption**: Client-side encryption for sensitive data

## 🚀 Getting Started

### Prerequisites

#### For Android Development
- Android Studio Hedgehog (2023.1.1) or newer
- JDK 17 or newer
- Android SDK 34 (Android 14)
- Kotlin 1.9+
- Gradle 8.0+

#### For iOS Development
- Xcode 15+ (macOS only)
- Swift 5.9+
- iOS 17+ SDK
- CocoaPods or Swift Package Manager

### Setup Instructions

See platform-specific setup guides:
- [Android Setup Guide](./docs/ANDROID_SETUP.md)
- [iOS Setup Guide](./docs/IOS_SETUP.md)

## 🔗 Backend Integration

Mobile apps connect to the MindVibe backend API:

### API Endpoints
- **Base URL (Development)**: `http://localhost:8000`
- **Base URL (Production)**: `https://api.mindvibe.com`
- **API Documentation**: `/docs` (Swagger UI)

### Key API Routes
- `/api/auth/*` - Authentication and sessions
- `/api/chat/*` - KIAAN chatbot
- `/moods/*` - Mood tracking
- `/journal/*` - Encrypted journal
- `/api/wisdom/*` - Universal wisdom guide
- `/api/gita/*` - Bhagavad Gita verses
- `/analytics/*` - User analytics

See [Backend API Documentation](../docs/MOBILE_BFF.md) for complete API reference.

## 🌐 Multi-Language Support

Both apps support all 17 languages:
- English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada
- Malayalam, Punjabi, Sanskrit, Spanish, French, German, Portuguese
- Japanese, Chinese

Language files and localization:
- Android: `res/values-*/strings.xml`
- iOS: `Localizable.strings` and `.stringsdict`

## 🔒 Security

### Encryption
- End-to-end encryption for journal entries
- Secure credential storage (Keystore/Keychain)
- Certificate pinning for API calls
- Biometric authentication support

### Authentication
- JWT token-based authentication
- Refresh token rotation
- Secure token storage
- Auto-logout on suspicious activity

### Privacy
- No third-party analytics by default
- Local-first data storage
- User data deletion support
- GDPR/CCPA compliance

## 🧪 Testing

### Android Testing
```bash
cd mobile/android
./gradlew test           # Unit tests
./gradlew connectedTest  # Instrumented tests
```

### iOS Testing
```bash
cd mobile/ios
xcodebuild test -scheme MindVibe -destination 'platform=iOS Simulator,name=iPhone 15'
```

See [Testing Guide](./docs/TESTING.md) for comprehensive testing documentation.

## 📦 Building and Deployment

### Android
```bash
cd mobile/android
./gradlew assembleRelease  # Build release APK
./gradlew bundleRelease    # Build release AAB for Play Store
```

### iOS
```bash
cd mobile/ios
xcodebuild archive -scheme MindVibe -archivePath build/MindVibe.xcarchive
```

See deployment guides:
- [Android Deployment](./docs/ANDROID_DEPLOYMENT.md)
- [iOS Deployment](./docs/IOS_DEPLOYMENT.md)

## 🎨 Design Resources

### Android
- Material Design 3 Guidelines
- [Figma Design Files](link-to-figma)
- Color palette in `themes.xml`
- Typography system in `Type.kt`

### iOS
- Human Interface Guidelines
- [Figma Design Files](link-to-figma)
- Color palette in `Colors.swift`
- Typography system in `Fonts.swift`

## 📊 Performance Optimization

### Low-End Device Support
- Minimum Android SDK: API 24 (Android 7.0)
- Minimum iOS: iOS 15.0
- Lazy loading for images and content
- Pagination for large lists
- Background task optimization

### High-End Device Support
- 120Hz display support
- Advanced animations
- HDR image support
- Haptic feedback

## 🤝 Contributing

When contributing to mobile apps:
1. Follow platform-specific coding guidelines
2. Write unit tests for new features
3. Update documentation
4. Test on multiple devices/simulators
5. Ensure backward compatibility with backend API

See [Mobile Contributing Guide](./docs/CONTRIBUTING_MOBILE.md).

## 📚 Documentation

- [Android Setup Guide](./docs/ANDROID_SETUP.md)
- [iOS Setup Guide](./docs/IOS_SETUP.md)
- [API Integration Guide](./docs/API_INTEGRATION.md)
- [Testing Guide](./docs/TESTING.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Performance Guide](./docs/PERFORMANCE.md)

## 🛣️ Roadmap

### Phase 1 (Current)
- ✅ Project structure setup
- ✅ Documentation framework
- 🔄 Android project initialization
- 🔄 iOS project initialization

### Phase 2
- [ ] Authentication implementation
- [ ] Basic navigation structure
- [ ] API client setup
- [ ] Local database setup

### Phase 3
- [ ] KIAAN chatbot integration
- [ ] Mood tracking UI
- [ ] Journal with encryption
- [ ] Profile management

### Phase 4
- [ ] Bhagavad Gita ecosystem
- [ ] Analytics dashboard
- [ ] Advanced features
- [ ] Performance optimization

### Phase 5
- [ ] Beta testing
- [ ] Store submission
- [ ] Production release

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/hisr2024/MindVibe/issues)
- **Discussions**: [GitHub Discussions](https://github.com/hisr2024/MindVibe/discussions)

---

**Built with ❤️ for mental health and well-being**
