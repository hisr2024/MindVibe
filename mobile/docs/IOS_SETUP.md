# iOS Setup Guide

Complete guide to setting up the MindVibe iOS development environment.

## 📋 Prerequisites

### Required Software (macOS Only)
1. **Xcode 15+ **
   - Download from Mac App Store or [developer.apple.com](https://developer.apple.com/xcode/)
   - Requires macOS Ventura (13.0) or later

2. **Command Line Tools**
   ```bash
   xcode-select --install
   ```

3. **Homebrew** (Package Manager)
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

4. **Git**
   ```bash
   git --version
   ```

### Optional Tools
- **CocoaPods** (if using pods)
  ```bash
  sudo gem install cocoapods
  ```
- **SwiftLint** (code style)
  ```bash
  brew install swiftlint
  ```
- **xcbeautify** (better build output)
  ```bash
  brew install xcbeautify
  ```

## 🚀 Initial Setup

### 1. Clone Repository
```bash
git clone https://github.com/hisr2024/MindVibe.git
cd MindVibe/mobile/ios
```

### 2. Install Dependencies

#### Option A: Swift Package Manager (Recommended)
Dependencies are managed through Xcode. They'll be resolved automatically when you open the project.

#### Option B: CocoaPods (If Used)
```bash
pod install
```

### 3. Open in Xcode

#### If using SPM:
```bash
open MindVibe.xcodeproj
```

#### If using CocoaPods:
```bash
open MindVibe.xcworkspace
```

### 4. Configure Project

1. Select the project in Project Navigator
2. Select the "MindVibe" target
3. Under "Signing & Capabilities":
   - Select your Team
   - Update Bundle Identifier if needed

## 📱 Simulator Setup

### Create iOS Simulator

Xcode includes simulators by default. To add more:

1. Open Simulator app:
   ```bash
   open -a Simulator
   ```

2. Or from Xcode:
   ```
   Window → Devices and Simulators → Simulators
   ```

3. Click "+" to add new simulator:
   - Device Type: iPhone 15
   - iOS Version: iOS 17.0
   - Name: iPhone 15

### Recommended Simulators
- iPhone 15 (Latest)
- iPhone SE (3rd generation) (Small screen)
- iPad Pro 12.9-inch (Tablet)

## 📱 Physical Device Setup

### 1. Connect Device

1. Connect iPhone/iPad via USB or WiFi
2. Trust the computer on device

### 2. Enable Developer Mode (iOS 16+)

1. On device: Settings → Privacy & Security
2. Scroll to Developer Mode
3. Enable Developer Mode
4. Restart device

### 3. Run on Device

1. Select device in Xcode toolbar
2. Press ⌘R to build and run
3. If prompted, enter device passcode

## 🔧 Build Configuration

### Development Build
```bash
# Command line
xcodebuild -scheme MindVibe -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15'

# Or press ⌘B in Xcode
```

### Release Build
```bash
xcodebuild -scheme MindVibe -configuration Release -destination 'generic/platform=iOS'
```

### Archive for App Store
```bash
xcodebuild archive \
  -scheme MindVibe \
  -archivePath build/MindVibe.xcarchive \
  -configuration Release
```

## 🧪 Running Tests

### Unit Tests
```bash
# Command line
xcodebuild test -scheme MindVibe -destination 'platform=iOS Simulator,name=iPhone 15'

# Or press ⌘U in Xcode
```

### UI Tests
```bash
xcodebuild test \
  -scheme MindVibe \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  -only-testing:MindVibeUITests
```

### Specific Test
```bash
xcodebuild test \
  -scheme MindVibe \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  -only-testing:MindVibeTests/AuthViewModelTests/testLoginSuccess
```

### Code Coverage
```bash
xcodebuild test \
  -scheme MindVibe \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  -enableCodeCoverage YES
```

View coverage report:
```
Product → Show Build Folder in Finder
Navigate to: Coverage/MindVibe.xcresult
Open with: Xcode
```

## 🐛 Debugging

### LLDB Debugger

Set breakpoints:
- Click line number in Xcode
- Or add: `lldb` command in terminal

Common LLDB commands:
```lldb
# Print value
po variableName

# Continue execution
c

# Step over
n

# Step into
s

# Step out
finish
```

### View Hierarchy Debugger

Debug UI layout:
```
Debug → View Debugging → Capture View Hierarchy
```

### Network Debugging

1. **Using Instruments**:
   ```
   Product → Profile → Network
   ```

2. **Using Charles Proxy**:
   - Install Charles Proxy
   - Configure proxy on device/simulator:
     - Settings → Wi-Fi → Configure Proxy → Manual
     - Server: Your Mac's IP
     - Port: 8888

### Console Logs

View in Xcode:
```
View → Debug Area → Show Debug Area (⇧⌘Y)
```

Or use Console.app:
```bash
open -a Console
```

## 🔍 Common Issues

### Issue: "Cannot Find 'X' in Scope"
**Solution**:
```bash
# Clean build folder
⇧⌘K (Shift + Command + K)

# Or command line
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### Issue: Swift Package Resolution Failed
**Solution**:
1. File → Packages → Reset Package Caches
2. File → Packages → Update to Latest Package Versions

### Issue: Simulator Won't Launch
**Solution**:
```bash
# Reset simulator
xcrun simctl erase all

# Kill and restart Simulator
killall Simulator
open -a Simulator
```

### Issue: Code Signing Error
**Solution**:
1. Xcode → Preferences → Accounts
2. Select Apple ID
3. Click "Download Manual Profiles"
4. Or use Automatic Signing in project settings

### Issue: Cannot Connect to Backend API
**Solution**:
1. Ensure backend is running: `uvicorn backend.main:app --reload`
2. Use `localhost:8000` for simulator
3. For physical device, use Mac's IP address:
   ```bash
   # Get Mac IP
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
4. Update API base URL in `Config.swift`

### Issue: SwiftUI Preview Not Working
**Solution**:
```bash
# Restart Xcode
# Clean build folder (⇧⌘K)
# Or
killall Xcode
rm -rf ~/Library/Developer/Xcode/DerivedData
```

## 🎨 SwiftUI Previews

### Enable Canvas
```
Editor → Canvas (⌥⌘↩)
```

### Live Preview
```swift
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
```

### Multiple Previews
```swift
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            ContentView()
                .previewDevice("iPhone 15")
            
            ContentView()
                .preferredColorScheme(.dark)
                .previewDevice("iPhone SE (3rd generation)")
            
            ContentView()
                .previewLayout(.sizeThatFits)
        }
    }
}
```

## 📚 Additional Resources

### Learning Resources
- [Swift Documentation](https://swift.org/documentation/)
- [SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Apple Developer Forums](https://developer.apple.com/forums/)

### Tools
- [SF Symbols](https://developer.apple.com/sf-symbols/) - Icon library
- [Xcode Shortcuts](https://developer.apple.com/documentation/xcode/keyboard-shortcuts)
- [Instruments](https://developer.apple.com/documentation/instruments) - Performance analysis

### MindVibe Documentation
- [Mobile README](../README.md)
- [API Integration Guide](../docs/API_INTEGRATION.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Testing Guide](../docs/TESTING.md)

## 🎓 Useful Xcode Shortcuts

| Action | Shortcut |
|--------|----------|
| Build | ⌘B |
| Run | ⌘R |
| Test | ⌘U |
| Stop | ⌘. |
| Clean Build Folder | ⇧⌘K |
| Show/Hide Navigator | ⌘0 |
| Show/Hide Debug Area | ⇧⌘Y |
| Open Quickly | ⌘⇧O |
| Find in Workspace | ⌘⇧F |
| Jump to Definition | ⌘⌃J |
| Show Canvas | ⌥⌘↩ |

## 🔐 App Store Preparation

### 1. Update Version
```swift
// In project settings
Version: 1.0.0
Build: 1
```

### 2. Configure App Icons
Add icons to `Assets.xcassets/AppIcon`

Required sizes:
- 1024x1024 (App Store)
- 180x180 (iPhone)
- 167x167 (iPad Pro)
- 152x152 (iPad)
- 120x120 (iPhone)

### 3. Add Launch Screen
Configure in `LaunchScreen.storyboard` or use SwiftUI

### 4. Privacy Descriptions
Update `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access for profile photos</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to save images</string>
```

### 5. TestFlight
1. Archive build (Product → Archive)
2. Upload to App Store Connect
3. Add testers in TestFlight
4. Distribute build

## 🎓 Next Steps

1. **Explore Project Structure**: Familiarize yourself with the codebase
2. **Run the App**: Build and run on simulator or device
3. **Use SwiftUI Previews**: Rapid UI development
4. **Make Changes**: Try modifying a view or adding a feature
5. **Run Tests**: Ensure your changes don't break existing functionality
6. **Submit PR**: Follow the contribution guidelines

---

**Happy iOS Development! 🍎**
