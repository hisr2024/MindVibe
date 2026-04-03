# Android App Build & Play Store Publishing Guide

## Kiaanverse — From Code to Play Store

---

## Your Current Setup (What You Already Have)

Your project is well-structured for mobile deployment:

| Component | Status | Location |
|-----------|--------|----------|
| Expo + React Native app | Built | `kiaanverse-mobile/apps/mobile/` |
| App config (permissions, icons, deep links) | Configured | `app.config.ts` |
| EAS Build profiles (dev/preview/production) | Configured | `eas.json` |
| Play Store listing copy | Written | `store-listings/google-play/store-listing.md` |
| Android package name | Set | `com.kiaanverse.app` |
| App screens & navigation | Built | `app/` directory with tabs, auth, etc. |

**What you still need:** Google Play Console account, signing key, assets (icon/screenshots), and the actual build + submission.

---

## Phase 1: Prerequisites (One-Time Setup)

### Step 1: Google Play Developer Account

1. Go to **https://play.google.com/console**
2. Sign in with your Google account (use a dedicated business account, not personal)
3. Pay the **one-time $25 registration fee**
4. Complete the **identity verification** (takes 1-3 business days)
   - Individual: Government ID
   - Organization: D-U-N-S number required
5. Complete the **Developer profile**:
   - Developer name: `Kiaanverse`
   - Contact email: `support@kiaanverse.com`
   - Website: `https://kiaanverse.com`
   - Phone number

> **Important:** Google now requires identity verification before you can publish. Start this FIRST — it can take several days.

### Step 2: Install Required Tools

```bash
# Install EAS CLI globally (Expo Application Services)
npm install -g eas-cli

# Verify installation
eas --version

# Login to your Expo account (create one at expo.dev if needed)
eas login
```

### Step 3: Link Your Expo Project

```bash
cd kiaanverse-mobile/apps/mobile

# Initialize EAS for your project (if not already done)
eas init

# This will create/link a project on expo.dev
# Set your EAS_PROJECT_ID in your .env file
```

---

## Phase 2: Prepare App Assets

### Step 4: Create Required Assets

You need these image assets. Place them in `kiaanverse-mobile/apps/mobile/assets/`:

#### App Icons

| Asset | Size | Format | File |
|-------|------|--------|------|
| App icon | 1024x1024 px | PNG (no alpha) | `icon.png` |
| Adaptive icon foreground | 1024x1024 px | PNG (with transparency) | `adaptive-icon.png` |
| Notification icon | 96x96 px | PNG (white on transparent) | `notification-icon.png` |
| Splash screen | 1284x2778 px | PNG | `splash.png` |
| Favicon (web) | 48x48 px | PNG | `favicon.png` |

#### Adaptive Icon Guidelines
- Android uses **adaptive icons** = foreground layer + background color
- Your foreground image should have the actual logo **centered in the safe zone** (inner 66% circle)
- Background color is already set to `#050507` in your `app.config.ts`
- The system will crop it into circles, squircles, or rounded squares depending on the device

**Tools to create icons:**
- [Figma](https://figma.com) — design from scratch
- [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html) — generate from existing image
- [Expo Icon Generator](https://buildicon.netlify.app/) — designed for Expo apps

### Step 5: Create Play Store Screenshots

You need screenshots for your store listing:

| Type | Required | Size | Count |
|------|----------|------|-------|
| Phone screenshots | Yes | 1080x1920 or 1080x2340 px | 2-8 (aim for 6) |
| Tablet 7" | Recommended | 1200x1920 px | Up to 8 |
| Tablet 10" | Recommended | 1920x1200 px | Up to 8 |
| Feature graphic | Yes | 1024x500 px | 1 |

**Best approach for screenshots:**
1. Run your app on an emulator or device
2. Navigate to each key screen
3. Take screenshots
4. Add promotional text overlays using Figma/Canva

**Recommended screenshot sequence:**
1. Sakha AI conversation (hero feature)
2. Bhagavad Gita library with verse
3. Mood tracking / Divine Mood Ring
4. Spiritual Journey progress
5. Sadhana daily practice
6. Encrypted Journal

---

## Phase 3: Configure for Production

### Step 6: Create the Production Signing Key

EAS Build handles signing automatically. The key is generated and stored securely by Expo.

```bash
cd kiaanverse-mobile/apps/mobile

# Build for production (first time creates the keystore)
eas build --platform android --profile production
```

When prompted:
- **"Generate a new Android Keystore?"** → Yes
- EAS will generate and securely store your upload keystore
- **CRITICAL:** Download a backup of your keystore from expo.dev → Project → Credentials → Android → Download Keystore
- **Store this backup in a secure location (password manager, encrypted drive)**
- If you lose this key, you CANNOT update your app on the Play Store

### Step 7: Set Environment Variables

Create or update your secrets for production:

```bash
# Set production secrets via EAS
eas secret:create --name API_BASE_URL --value "https://api.kiaanverse.com" --scope project
eas secret:create --name SENTRY_DSN --value "your-sentry-dsn" --scope project
```

Or set them in `eas.json` under the production profile:

```json
"production": {
  "autoIncrement": true,
  "channel": "production",
  "env": {
    "APP_ENV": "production",
    "API_BASE_URL": "https://api.kiaanverse.com"
  }
}
```

> **Never put API keys or secrets directly in `eas.json`** — use `eas secret:create` for sensitive values.

### Step 8: Version Your App

In `kiaanverse-mobile/apps/mobile/package.json`, update:

```json
{
  "version": "1.0.0"
}
```

In `app.config.ts`, the version is already `1.0.0`. EAS auto-increments the `versionCode` (Android build number) on each production build because of `"autoIncrement": true` in `eas.json`.

---

## Phase 4: Build the APK/AAB

### Step 9: Build the Production Android App Bundle

```bash
cd kiaanverse-mobile/apps/mobile

# Production build (creates an .aab file — required by Play Store)
eas build --platform android --profile production
```

This will:
1. Upload your code to EAS Build servers
2. Install dependencies
3. Compile the native Android app
4. Sign it with your keystore
5. Produce an `.aab` (Android App Bundle) file
6. Give you a download link

**Build takes ~10-20 minutes.** You'll get a URL to download the `.aab` file.

```bash
# Check build status
eas build:list --platform android

# Download the artifact when ready
eas build:download --platform android
```

### Step 10: Test Before Submitting

Before uploading to Play Store, test thoroughly:

```bash
# Option A: Build a preview APK for internal testing
eas build --platform android --profile preview

# Option B: Use Android Emulator
# Install the .apk on emulator via:
adb install path/to/your-app.apk
```

**Test checklist:**
- [ ] App opens without crash
- [ ] Splash screen shows correctly
- [ ] Auth flow works (login/register)
- [ ] Sakha AI chat works
- [ ] Gita library loads verses
- [ ] Mood tracking works
- [ ] Journey progress saves
- [ ] Notifications arrive
- [ ] Deep links open correctly
- [ ] Biometric login works
- [ ] Offline mode works
- [ ] Back button behavior is correct on all screens

---

## Phase 5: Google Play Console Setup

### Step 11: Create the App in Play Console

1. Go to **Google Play Console** → **All apps** → **Create app**
2. Fill in:
   - **App name:** `Kiaanverse — Divine Companion`
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free (you can add in-app purchases later)
3. Check the declarations (developer policies, export laws)
4. Click **Create app**

### Step 12: Complete the Store Listing

Go to **Grow** → **Store presence** → **Main store listing**:

**Text fields** (copy from your `store-listings/google-play/store-listing.md`):
- Short description (80 chars)
- Full description (4000 chars)

**Graphics:**
- Upload your app icon (512x512 — Play Console resizes from your 1024x1024)
- Upload feature graphic (1024x500)
- Upload phone screenshots (minimum 2, recommended 6)
- Upload tablet screenshots (recommended)

### Step 13: Complete the Content Rating

Go to **Policy** → **App content** → **Content rating**:

1. Click **Start questionnaire**
2. Select **IARC** rating
3. Answer honestly:
   - Violence: No
   - Sexual content: No
   - Language: No
   - Controlled substances: No
   - User-generated content: Yes (journal, community)
   - Data sharing: Covered by privacy policy
4. You'll get rated **Everyone** or **Everyone 10+**

### Step 14: Set Up Privacy & Data Safety

Go to **Policy** → **App content** → **Data safety**:

This is mandatory. Declare what data your app collects:

| Data Type | Collected? | Shared? | Purpose |
|-----------|-----------|---------|---------|
| Name / Email | Yes | No | Account creation |
| User content (journal) | Yes | No | App functionality |
| App interactions | Yes | No | Analytics |
| Crash logs | Yes | No | App stability |
| Device identifiers | Yes | No | Authentication |

**Important declarations:**
- Data is encrypted in transit: **Yes**
- Data is encrypted at rest: **Yes** (your journal encryption)
- Users can request data deletion: **Yes**
- Link to privacy policy: `https://kiaanverse.com/privacy`

### Step 15: Set Target Audience & Ads

- **Target age group:** 13+ (not for children)
- **Contains ads:** No (unless you add ads later)
- **News app:** No
- **Government apps declaration:** Complete if applicable

### Step 16: Set Up App Categories

- **Application type:** Application
- **Category:** Health & Fitness
- **Tags:** Meditation, Mindfulness, Mental Wellness, Spiritual, Self-Improvement

---

## Phase 6: Release the App

### Step 17: Upload Your App Bundle

**Option A: Auto-submit via EAS (recommended)**

```bash
# Submit directly to Google Play from EAS
eas submit --platform android --profile production
```

When prompted:
- **"How would you like to authenticate with Google Play?"**
  → Select **"Service account key"**
  → You'll need a Google Play service account JSON key (see Step 17b below)

**Step 17b: Create a Service Account Key**

1. Go to **Google Play Console** → **Setup** → **API access**
2. Click **Link** next to Google Cloud Project (or create one)
3. Click **Create new service account**
4. Follow the link to **Google Cloud Console**
5. Create a service account:
   - Name: `eas-submit`
   - Role: **Service Account User**
6. Create a JSON key → Download it
7. Back in Play Console, grant the service account **Release manager** permission
8. Save the JSON key securely

```bash
# Now submit with the key
eas submit --platform android --profile production \
  --path /path/to/downloaded.aab
```

**Option B: Manual upload**

1. Download the `.aab` from EAS Build
2. Go to Play Console → **Release** → **Production** → **Create new release**
3. Upload the `.aab` file
4. Add release notes:
   ```
   Initial release of Kiaanverse — your divine AI companion.
   
   Features:
   • Sakha AI — spiritual conversations in 17 languages
   • Complete Bhagavad Gita library with commentary
   • Mood tracking & emotional wellness
   • Spiritual growth journeys
   • Daily Sadhana practice
   • Encrypted private journal
   • Offline mode
   ```
5. Click **Review release**

### Step 18: Use Testing Tracks (Recommended Path)

**Don't go straight to Production.** Use Google's testing tracks:

```
Internal Testing → Closed Testing → Open Testing → Production
```

**Internal Testing (up to 100 testers):**
1. Go to **Release** → **Testing** → **Internal testing**
2. Create a release, upload `.aab`
3. Add testers by email
4. Testers get a private link to install

**Closed Testing (invited groups):**
1. Go to **Release** → **Testing** → **Closed testing**
2. Create a track, add tester groups
3. Good for beta users, friends, spiritual community members

**Open Testing (anyone can join):**
1. Go to **Release** → **Testing** → **Open testing**
2. Anyone can find and join your beta
3. Requires meeting Google's testing requirements

**Promotion to Production:**
1. Once testing is solid, go to **Release** → **Production**
2. **Promote from testing track** (carries the same build)
3. Click **Review and roll out**

### Step 19: Review & Publish

1. Go to **Publishing overview**
2. Review all items — Google will show you if anything is missing
3. Fix any warnings (common ones: missing screenshots, incomplete data safety)
4. Click **Send for review**

**Review timeline:**
- First app: **3-7 business days** (can take longer)
- Updates: Usually **1-3 days**
- Rejections come with specific reasons — fix and resubmit

---

## Phase 7: Post-Launch

### Step 20: Set Up Over-The-Air Updates

Your EAS config already has channels set up. Use EAS Update for instant JS updates (no new Play Store review needed):

```bash
# Push a JS-only update to production users
eas update --channel production --message "Fix: verse display issue"
```

**OTA updates can change:**
- JavaScript code
- Images/assets bundled in JS
- Configuration

**OTA updates CANNOT change:**
- Native modules
- Permissions
- App version or package name
- Anything requiring a new native build

### Step 21: Monitor Your Release

```bash
# View crash reports — Google Play Console → Quality → Android vitals
# View ratings — Google Play Console → Quality → Ratings & reviews
# View installs — Google Play Console → Dashboard
```

**Set up crash reporting with Sentry** (already in your dependencies):
```bash
eas secret:create --name SENTRY_DSN --value "https://your-dsn@sentry.io/123" --scope project
```

### Step 22: Plan Regular Updates

**Update cadence:**
- Bug fixes: As needed (OTA via EAS Update)
- Feature releases: Every 2-4 weeks (new build → Play Store)
- Security patches: Immediately

---

## Quick Command Reference

```bash
# === DAILY DEVELOPMENT ===
cd kiaanverse-mobile/apps/mobile
pnpm start                    # Start dev server
pnpm android                  # Run on Android emulator

# === BUILDING ===
eas build -p android --profile development   # Dev build (with dev client)
eas build -p android --profile preview       # Internal testing APK
eas build -p android --profile production    # Production AAB

# === SUBMITTING ===
eas submit -p android --profile production   # Auto-submit to Play Store

# === OTA UPDATES ===
eas update --channel production --message "description"  # Push JS update

# === CREDENTIALS ===
eas credentials -p android          # View/manage signing keys
eas secret:list                     # List configured secrets

# === DIAGNOSTICS ===
eas build:list -p android           # List recent builds
eas build:view <build-id>           # View specific build details
eas diagnostics                     # Check environment setup
```

---

## Common Rejection Reasons & How to Avoid Them

| Reason | Prevention |
|--------|------------|
| **Crashes on launch** | Test on multiple devices/API levels before submitting |
| **Broken functionality** | Test every feature in the production build specifically |
| **Misleading description** | Only describe features that actually work |
| **Missing privacy policy** | Publish `https://kiaanverse.com/privacy` before submission |
| **Insufficient content** | App must provide real value, not be a wrapper for a website |
| **Login wall with no guest mode** | Consider allowing limited browsing without login |
| **Data safety form mismatch** | Accurately declare all data collection (Google checks your code) |
| **Targeting API level too low** | Expo 51 targets API 34 — you're fine |
| **Missing content rating** | Complete the IARC questionnaire |
| **Intellectual property** | Ensure you have rights to all content (Gita is public domain, but translations may not be) |

---

## Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Google Play Developer Account | $25 | One-time |
| Expo (free tier) | $0 | Monthly |
| EAS Build (free tier: 30 builds/month) | $0 | Monthly |
| EAS Build (production plan) | $99/month | If you need more builds |
| Apple Developer Account (if doing iOS too) | $99/year | Annual |

---

## Timeline Estimate

| Phase | What | Duration |
|-------|------|----------|
| 1 | Google account + identity verification | 1-5 days |
| 2 | Create assets (icon, screenshots, feature graphic) | 1-2 days |
| 3 | Configure production settings | 1-2 hours |
| 4 | Build + test | 1 day |
| 5 | Complete Play Console setup | 2-4 hours |
| 6 | Submit + Google review | 3-7 days |
| **Total** | **From start to live on Play Store** | **~2 weeks** |

---

## Your Specific Next Steps (Priority Order)

1. **Register** for Google Play Developer Console ($25) and start identity verification NOW
2. **Create** app icon assets (icon.png, adaptive-icon.png, splash.png) — put in `kiaanverse-mobile/apps/mobile/assets/`
3. **Install** EAS CLI: `npm install -g eas-cli && eas login`
4. **Build** a preview build: `eas build -p android --profile preview`
5. **Test** thoroughly on a real Android device
6. **Take** screenshots on a clean device/emulator
7. **Build** production: `eas build -p android --profile production`
8. **Set up** the app in Google Play Console
9. **Upload** to Internal Testing track first
10. **Promote** to Production after testing
