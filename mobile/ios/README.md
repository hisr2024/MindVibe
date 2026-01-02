# MindVibe iOS App 🍎

Native iOS application for MindVibe, built with Swift and SwiftUI following Apple's Human Interface Guidelines.

## 📋 Project Information

- **Bundle ID**: `com.mindvibe.app`
- **Min iOS**: 15.0
- **Target iOS**: 17.0
- **Language**: Swift 5.9+
- **UI Framework**: SwiftUI
- **Architecture**: MVVM + Clean Architecture

## 🏗️ Project Structure

```
ios/
├── MindVibe/
│   ├── App/
│   │   ├── MindVibeApp.swift      # App entry point
│   │   └── AppDelegate.swift      # App lifecycle
│   ├── Core/
│   │   ├── Data/                  # Data layer
│   │   │   ├── Network/           # API clients
│   │   │   ├── Local/             # Core Data/SwiftData
│   │   │   └── Repository/        # Repositories
│   │   ├── Domain/                # Business logic
│   │   │   ├── Models/            # Domain models
│   │   │   └── UseCases/          # Use cases
│   │   └── Presentation/          # UI layer
│   │       ├── Views/
│   │       │   ├── Auth/
│   │       │   ├── Dashboard/
│   │       │   ├── Chat/
│   │       │   ├── Mood/
│   │       │   ├── Journal/
│   │       │   └── Gita/
│   │       └── ViewModels/
│   ├── Common/
│   │   ├── Extensions/
│   │   ├── Utilities/
│   │   └── Constants/
│   ├── Resources/
│   │   ├── Assets.xcassets
│   │   ├── Localizable.strings    # English
│   │   ├── hi.lproj/              # Hindi
│   │   └── */                     # Other languages
│   └── Info.plist
├── MindVibeTests/                 # Unit tests
├── MindVibeUITests/               # UI tests
├── MindVibe.xcodeproj
├── Podfile                        # CocoaPods (if used)
├── Package.swift                  # Swift Package Manager
└── README.md (this file)
```

## 🛠️ Technology Stack

### Core
- **Swift**: 5.9+
- **SwiftUI**: Native declarative UI
- **Combine**: Reactive programming
- **async/await**: Modern async operations

### Architecture Components
- **SwiftUI App Protocol**: App lifecycle
- **@StateObject/@ObservedObject**: State management
- **@EnvironmentObject**: Dependency injection
- **NavigationStack**: Navigation
- **Core Data/SwiftData**: Local persistence

### Networking
- **URLSession**: Native HTTP client
- **Codable**: JSON encoding/decoding
- **Alamofire** (optional): Advanced networking
- **Kingfisher**: Image loading and caching

### Storage
- **UserDefaults**: Simple key-value storage
- **Keychain**: Secure credential storage
- **Core Data**: Structured data persistence
- **FileManager**: File-based storage
- **CryptoKit**: Encryption for journal

### Testing
- **XCTest**: Unit and UI testing
- **Quick/Nimble** (optional): BDD-style testing
- **SnapshotTesting**: UI snapshot tests

## 🚀 Getting Started

### Prerequisites
1. macOS Ventura (13.0) or newer
2. Xcode 15+ 
3. Swift 5.9+
4. CocoaPods or Swift Package Manager

### Setup
1. Open `MindVibe.xcodeproj` (or `.xcworkspace` if using CocoaPods)
2. Select a target device or simulator
3. Update `Configuration.plist` with API endpoints:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN">
   <plist version="1.0">
   <dict>
       <key>API_BASE_URL_DEV</key>
       <string>http://localhost:8000</string>
       <key>API_BASE_URL_PROD</key>
       <string>https://api.mindvibe.com</string>
   </dict>
   </plist>
   ```
4. Build and run (⌘R)

### Installation with Swift Package Manager

Add dependencies in Xcode:
1. File → Add Packages...
2. Enter package URLs
3. Select version and add

### Installation with CocoaPods

```bash
cd ios
pod install
open MindVibe.xcworkspace
```

## 📦 Dependencies

### Swift Package Manager

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.8.0"),
    .package(url: "https://github.com/onevcat/Kingfisher.git", from: "7.10.0"),
    .package(url: "https://github.com/pointfreeco/swift-snapshot-testing", from: "1.15.0")
]
```

### CocoaPods (Alternative)

```ruby
# Podfile
platform :ios, '15.0'
use_frameworks!

target 'MindVibe' do
  # Networking
  pod 'Alamofire', '~> 5.8'
  
  # Image Loading
  pod 'Kingfisher', '~> 7.10'
  
  # Testing
  pod 'Quick', '~> 7.0'
  pod 'Nimble', '~> 13.0'
end
```

## 🔑 Build Configurations

### Debug
- Development API endpoint
- Logging enabled
- Debug menu available
- No code optimization

### Release
- Production API endpoint
- Logging disabled
- Code optimization enabled
- App Store submission ready

### Configuration Files

```swift
// Config.swift
enum Config {
    enum Environment {
        case development
        case staging
        case production
    }
    
    static var current: Environment {
        #if DEBUG
        return .development
        #else
        return .production
        #endif
    }
    
    static var apiBaseURL: String {
        switch current {
        case .development:
            return "http://localhost:8000"
        case .staging:
            return "https://staging-api.mindvibe.com"
        case .production:
            return "https://api.mindvibe.com"
        }
    }
}
```

## 🎨 UI/UX Guidelines

### Human Interface Guidelines
- SF Symbols for icons
- Native navigation patterns
- Pull-to-refresh
- Context menus
- Swipe actions
- Haptic feedback

### Design System

**Colors.swift**:
```swift
extension Color {
    static let primaryLight = Color("PrimaryLight")
    static let primaryDark = Color("PrimaryDark")
    static let backgroundLight = Color("BackgroundLight")
    static let backgroundDark = Color("BackgroundDark")
}
```

**Fonts.swift**:
```swift
extension Font {
    static let headlineLarge = Font.system(size: 34, weight: .bold)
    static let headlineMedium = Font.system(size: 28, weight: .semibold)
    static let bodyLarge = Font.system(size: 17, weight: .regular)
    static let bodyMedium = Font.system(size: 15, weight: .regular)
}
```

### Dark Mode
- Automatic dark mode support
- Semantic colors from asset catalog
- Dynamic type support

### Accessibility
- VoiceOver support
- Dynamic Type
- Reduce Motion
- High Contrast
- Button shapes

## 🔒 Security Features

### Data Encryption
- Journal entries encrypted with CryptoKit (AES-GCM)
- Encryption keys stored in Keychain
- Face ID/Touch ID for app access

### Network Security
- Certificate pinning
- TLS 1.3
- App Transport Security (ATS) enforced

### Code Protection
- Code obfuscation (release builds)
- Jailbreak detection
- Reverse engineering protection

### Keychain Storage

```swift
import Security

class KeychainManager {
    static let shared = KeychainManager()
    
    func save(token: String, for key: String) throws {
        let data = token.data(using: .utf8)!
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        
        guard status == errSecSuccess else {
            throw KeychainError.saveFailed
        }
    }
    
    func retrieve(for key: String) throws -> String {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            throw KeychainError.retrieveFailed
        }
        
        return token
    }
}
```

## 🧪 Testing

### Unit Tests
```bash
xcodebuild test -scheme MindVibe -destination 'platform=iOS Simulator,name=iPhone 15'
```

### UI Tests
```bash
xcodebuild test -scheme MindVibe -destination 'platform=iOS Simulator,name=iPhone 15' -only-testing:MindVibeUITests
```

### Code Coverage
Enable in Scheme → Test → Options → Code Coverage

### Testing Best Practices

```swift
import XCTest
@testable import MindVibe

class MoodViewModelTests: XCTestCase {
    var sut: MoodViewModel!
    var mockRepository: MockMoodRepository!
    
    override func setUp() {
        super.setUp()
        mockRepository = MockMoodRepository()
        sut = MoodViewModel(repository: mockRepository)
    }
    
    override func tearDown() {
        sut = nil
        mockRepository = nil
        super.tearDown()
    }
    
    func testFetchMoods_Success() async {
        // Given
        let expectedMoods = [Mood(score: 8, tags: ["happy"])]
        mockRepository.moodsToReturn = expectedMoods
        
        // When
        await sut.fetchMoods()
        
        // Then
        XCTAssertEqual(sut.moods, expectedMoods)
        XCTAssertNil(sut.error)
    }
}
```

## 🌐 Localization

Localizable.strings for each language:

**en.lproj/Localizable.strings**:
```
"app.title" = "MindVibe";
"auth.login" = "Login";
"auth.signup" = "Sign Up";
```

**hi.lproj/Localizable.strings**:
```
"app.title" = "माइंडवाइब";
"auth.login" = "लॉगिन";
"auth.signup" = "साइन अप";
```

Usage in code:
```swift
Text(NSLocalizedString("app.title", comment: "App title"))
// Or with String extension
Text("app.title".localized)
```

## 📱 Features

### Implemented
- ✅ Project structure
- ✅ Build configuration
- ✅ Design system

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
- [ ] Widgets
- [ ] Watch app

## 🚢 Building for Release

### Archive
```bash
xcodebuild archive \
  -scheme MindVibe \
  -archivePath build/MindVibe.xcarchive \
  -configuration Release
```

### Export IPA
```bash
xcodebuild -exportArchive \
  -archivePath build/MindVibe.xcarchive \
  -exportPath build \
  -exportOptionsPlist ExportOptions.plist
```

### App Store Connect
1. Create app in App Store Connect
2. Set up metadata and screenshots
3. Upload build with Xcode or Transporter
4. Submit for review

## 📊 Performance

### App Size
- Target IPA size: < 15 MB
- With resources: < 30 MB
- Techniques: Asset catalog optimization, on-demand resources

### Launch Time
- Cold launch: < 2 seconds
- Warm launch: < 500ms
- Techniques: Lazy loading, reduce startup work

### Memory
- Baseline: < 50 MB
- With chat active: < 100 MB
- Techniques: Image caching, memory warnings handling

### Battery
- Background refresh optimization
- Network request batching
- Location updates optimization

## 🐛 Debugging

### Console Logging
```swift
#if DEBUG
print("Debug: \(message)")
#endif
```

### Network Debugging
- Charles Proxy
- Instruments Network Activity
- URLSession debugging

### UI Debugging
- View hierarchy inspector
- SwiftUI previews
- Memory graph debugger

## 🔗 Useful Links

- [Swift Documentation](https://swift.org/documentation/)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Apple Developer](https://developer.apple.com/)
- [MindVibe API Docs](../../docs/MOBILE_BFF.md)

## 📄 License

MIT License - see [LICENSE](../../LICENSE)

---

**Built with ❤️ using Swift and SwiftUI**
