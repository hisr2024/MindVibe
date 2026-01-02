# Mobile Deployment Guide

Comprehensive guide for deploying MindVibe Android and iOS applications to production.

## 📱 Android Deployment

### Google Play Store Deployment

#### Prerequisites
1. **Google Play Console Account**
   - Sign up at [play.google.com/console](https://play.google.com/console)
   - Pay one-time registration fee ($25)
   - Complete account verification

2. **Signing Key**
   - Generate release keystore
   - Store securely (backup required)

#### Step 1: Generate Signing Key

```bash
keytool -genkey -v \
  -keystore mindvibe-release.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias mindvibe
```

**Important**: Store the keystore file and passwords securely. If lost, you cannot update your app.

#### Step 2: Configure Signing in Gradle

Add to `app/build.gradle.kts`:
```kotlin
android {
    signingConfigs {
        create("release") {
            storeFile = file(System.getenv("KEYSTORE_PATH") ?: "mindvibe-release.jks")
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = System.getenv("KEY_ALIAS")
            keyPassword = System.getenv("KEY_PASSWORD")
        }
    }
    
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

#### Step 3: Build Release AAB

Android App Bundle (AAB) is required for Play Store:
```bash
./gradlew bundleRelease
```

Output: `app/build/outputs/bundle/release/app-release.aab`

#### Step 4: Create App in Play Console

1. Go to Google Play Console
2. Click "Create app"
3. Fill in app details:
   - App name: MindVibe
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
   - Category: Health & Fitness
4. Accept declarations
5. Click "Create app"

#### Step 5: Set Up Store Listing

**Main Store Listing**:
- App name: MindVibe
- Short description (80 chars):
  > AI-powered mental health companion with multi-language support
- Full description (4000 chars):
  > Include full app description, features, and benefits
- App icon: 512x512 PNG
- Feature graphic: 1024x500 PNG
- Screenshots: Minimum 2 per device type

**Categorization**:
- Application type: Applications
- Category: Health & Fitness
- Tags: mental health, wellness, meditation

#### Step 6: Content Rating

1. Navigate to Content rating
2. Fill out questionnaire
3. Submit for rating
4. Receive rating certificate

#### Step 7: Pricing & Distribution

1. Countries: Select target countries
2. Pricing: Free
3. Contains ads: No
4. In-app purchases: No (or Yes if applicable)

#### Step 8: App Content

- Privacy policy URL
- App access (not restricted)
- Ads: No ads
- Target audience and content

#### Step 9: Upload AAB

1. Navigate to Release → Production
2. Click "Create new release"
3. Upload AAB file
4. Set version name and release notes
5. Review and roll out

#### Step 10: Review Process

- Google review typically takes 1-7 days
- Fix any issues if rejected
- Once approved, app goes live

### Internal Testing

Before production release, test internally:

1. Navigate to Release → Testing → Internal testing
2. Create internal testing release
3. Upload AAB
4. Add internal testers (email addresses)
5. Share test link with team

### Beta Testing (Open/Closed)

For wider testing:

1. Navigate to Release → Testing → Closed testing or Open testing
2. Create testing track
3. Upload AAB
4. For closed testing, add tester emails or create list
5. Share opt-in URL

### Staged Rollout

Reduce risk with staged rollout:

1. During production release, select "Staged rollout"
2. Start with small percentage (e.g., 5%)
3. Monitor crashes and ratings
4. Gradually increase percentage
5. Complete rollout to 100%

## 🍎 iOS Deployment

### App Store Deployment

#### Prerequisites
1. **Apple Developer Account**
   - Enroll at [developer.apple.com](https://developer.apple.com/)
   - Cost: $99/year (individual) or $299/year (organization)
   - Complete verification (may take days)

2. **Certificates & Profiles**
   - Distribution certificate
   - App Store provisioning profile

#### Step 1: Register App ID

1. Go to Apple Developer Portal
2. Certificates, Identifiers & Profiles
3. Identifiers → Click "+"
4. Select "App IDs" → Continue
5. Enter:
   - Description: MindVibe
   - Bundle ID: com.mindvibe.app
6. Enable capabilities:
   - Push Notifications
   - Sign in with Apple (if used)
   - HealthKit (if used)
7. Register

#### Step 2: Create Distribution Certificate

1. On your Mac, open Keychain Access
2. Certificate Assistant → Request Certificate from Certificate Authority
3. Save to disk
4. In Developer Portal:
   - Certificates → Click "+"
   - Select "App Store and Ad Hoc"
   - Upload CSR
   - Download certificate
5. Double-click to install in Keychain

#### Step 3: Create Provisioning Profile

1. In Developer Portal:
   - Profiles → Click "+"
   - Select "App Store"
   - Select App ID (com.mindvibe.app)
   - Select distribution certificate
   - Download profile
2. Double-click to install

#### Step 4: Configure Xcode Project

1. Open project in Xcode
2. Select project → Target → Signing & Capabilities
3. Uncheck "Automatically manage signing"
4. Select provisioning profile
5. Verify bundle identifier matches

#### Step 5: Set Version and Build Number

```swift
// In project settings
Version: 1.0.0
Build: 1
```

Increment build number for each submission.

#### Step 6: Archive Build

1. Select "Any iOS Device (arm64)" as destination
2. Product → Archive
3. Wait for archive to complete
4. Organizer window opens automatically

#### Step 7: Create App in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com/)
2. My Apps → Click "+"
3. Fill in:
   - Name: MindVibe
   - Primary Language: English (U.S.)
   - Bundle ID: com.mindvibe.app
   - SKU: mindvibe-001
4. Create

#### Step 8: Fill App Information

**App Information**:
- Name: MindVibe
- Subtitle: AI Mental Health Companion
- Category: Health & Fitness
- Secondary Category: Lifestyle

**Pricing & Availability**:
- Price: Free
- Availability: All countries

**App Privacy**:
- Create privacy policy
- Answer privacy questionnaire
- Add privacy URL

#### Step 9: Prepare Metadata

**Version Information**:
- What's New: Release notes for this version
- Promotional Text: Optional promotional text

**Screenshots** (required for each device size):
- 6.7" Display (iPhone 15 Pro Max):
  - 1290 x 2796 pixels
  - Minimum 2, maximum 10
- 6.5" Display
- 5.5" Display
- 12.9" iPad Pro (3rd gen)
- 12.9" iPad Pro (2nd gen)

**App Preview Videos** (optional):
- Up to 3 per device size
- MP4 or MOV format
- 15-30 seconds

**Description**:
- App description (4000 chars max)
- Keywords (100 chars, comma-separated)
- Support URL
- Marketing URL (optional)

#### Step 10: Upload Build

From Xcode Organizer:
1. Select archive
2. Click "Distribute App"
3. Select "App Store Connect"
4. Upload
5. Wait for processing (10-30 minutes)

Or use Transporter app:
1. Export IPA from Xcode
2. Open Transporter
3. Drag and drop IPA
4. Deliver

#### Step 11: Submit for Review

1. In App Store Connect, select uploaded build
2. Fill remaining info:
   - Age rating
   - Copyright
   - Contact information
3. Add app review information:
   - Contact info
   - Demo account (if login required)
   - Notes for reviewer
4. Click "Submit for Review"

#### Step 12: App Review

- Initial review: 1-3 days typically
- If rejected, address issues and resubmit
- If approved, can manually release or auto-release

### TestFlight Distribution

For beta testing before production:

#### Internal Testing (Up to 100 testers)
1. Upload build to App Store Connect
2. Navigate to TestFlight tab
3. Internal Testing → Add internal testers
4. Testers receive email invitation
5. Install TestFlight app and accept

#### External Testing (Up to 10,000 testers)
1. Create external group
2. Add testers or create public link
3. Submit for Beta App Review (required)
4. Once approved, distribute to external testers

## 🔄 Continuous Deployment

### GitHub Actions for Android

`.github/workflows/android-deploy.yml`:
```yaml
name: Android Deploy

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up JDK
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        
    - name: Decode Keystore
      run: |
        echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > mindvibe-release.jks
        
    - name: Build Release AAB
      env:
        KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
        KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
        KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
      run: |
        cd mobile/android
        ./gradlew bundleRelease
        
    - name: Upload to Play Store
      uses: r0adkll/upload-google-play@v1
      with:
        serviceAccountJsonPlainText: ${{ secrets.PLAY_STORE_JSON }}
        packageName: com.mindvibe.app
        releaseFiles: mobile/android/app/build/outputs/bundle/release/app-release.aab
        track: internal
```

### GitHub Actions for iOS

`.github/workflows/ios-deploy.yml`:
```yaml
name: iOS Deploy

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Install Apple Certificate
      env:
        CERTIFICATE_BASE64: ${{ secrets.CERTIFICATE_BASE64 }}
        P12_PASSWORD: ${{ secrets.P12_PASSWORD }}
      run: |
        # Import certificate
        echo $CERTIFICATE_BASE64 | base64 --decode > certificate.p12
        security create-keychain -p "" build.keychain
        security import certificate.p12 -k build.keychain -P $P12_PASSWORD
        
    - name: Build Archive
      run: |
        cd mobile/ios
        xcodebuild archive \
          -scheme MindVibe \
          -archivePath build/MindVibe.xcarchive
          
    - name: Export IPA
      run: |
        xcodebuild -exportArchive \
          -archivePath build/MindVibe.xcarchive \
          -exportPath build \
          -exportOptionsPlist ExportOptions.plist
          
    - name: Upload to TestFlight
      env:
        APP_STORE_CONNECT_API_KEY: ${{ secrets.APP_STORE_CONNECT_API_KEY }}
      run: |
        xcrun altool --upload-app \
          --type ios \
          --file build/MindVibe.ipa \
          --apiKey $APP_STORE_CONNECT_API_KEY
```

## 📊 Post-Deployment Monitoring

### Android (Firebase/Play Console)
- Crash reports: Play Console → Quality
- ANRs: Application Not Responding rates
- User reviews and ratings
- Install statistics

### iOS (App Store Connect)
- Crashes: Xcode Organizer → Crashes
- Energy usage reports
- App Analytics
- User reviews and ratings

## 🔐 Security Checklist

Before releasing:
- [ ] Remove all debug logs
- [ ] Enable ProGuard/R8 (Android)
- [ ] Enable code obfuscation
- [ ] Verify no API keys in code
- [ ] Test certificate pinning
- [ ] Enable App Transport Security (iOS)
- [ ] Test biometric authentication
- [ ] Verify encrypted storage
- [ ] Test crash reporting
- [ ] Review permissions requested

---

**Ready for Production! 🚀**
