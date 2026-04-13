# Android / Google Play Store Launch Guide — Kiaanverse

> Complete baby-step guide to launch Kiaanverse on the Google Play Store.
> Last updated: 2026-04-13

---

## Your Setup at a Glance

| Item | Value |
|:-----|:------|
| Framework | Expo/React Native (SDK 51) |
| Package name | `com.kiaanverse.app` |
| Build tool | EAS Build (configured in `eas.json`) |
| Store listing | Drafted in `store-listings/google-play/` |
| CI/CD | GitHub Actions (`mobile-production-release.yml`) |

---

## PHASE 0: Prerequisites

### 0.1 — Things You Need Ready

- [ ] A **Google account** (personal Gmail works)
- [ ] A **credit/debit card** to pay the $25 one-time developer fee
- [ ] A **valid phone number** for verification
- [ ] A **government-issued ID** (for identity verification — required since 2023)
- [ ] A **D-U-N-S number** if registering as an Organization (not needed for Individual)
- [ ] Your **privacy policy** hosted at a public URL (`https://kiaanverse.com/privacy`)
- [ ] A **support email** address (`support@kiaanverse.com`)

### 0.2 — Install Required Tools

```bash
# 1. Verify Node.js v20+
node --version

# 2. Install EAS CLI globally
npm install -g eas-cli

# 3. Verify EAS CLI
eas --version

# 4. Log in to Expo account
eas login
```

### 0.3 — Create an Expo Account (if needed)

1. Go to https://expo.dev/signup
2. Create account, verify email
3. Run `eas login` in terminal

---

## PHASE 1: Google Play Console Account

### 1.1 — Create Developer Account

1. Go to https://play.google.com/console
2. Click **"Get started"**
3. Sign in with Google account

### 1.2 — Choose Account Type

- **Individual**: For solo developers — simpler setup
- **Organization**: For companies — requires D-U-N-S number

### 1.3 — Pay Registration Fee

- One-time **$25** fee
- Enter card details, complete payment

### 1.4 — Complete Identity Verification

1. Upload **government-issued photo ID**
2. Provide **legal name** (must match ID)
3. Provide **physical address**
4. Verify **phone number** via SMS
5. **Wait 2–7 business days** for approval email

### 1.5 — Complete Developer Profile

1. Play Console → Settings → Developer account → Developer page
2. Fill in:
   - Developer name: `Kiaanverse`
   - Contact email: `support@kiaanverse.com`
   - Website: `https://kiaanverse.com`

---

## PHASE 2: Create App in Play Console

### 2.1 — Create the App

1. Click **"Create app"** (top right)
2. Fill in:
   - App name: `Kiaanverse — Divine Companion`
   - Default language: `English (United States)`
   - App or game: **App**
   - Free or paid: **Free**
3. Accept declarations, click **"Create app"**

---

## PHASE 3: App Content (Policy Sections)

### 3.1 — App Access

- Policy → App content → App access
- Select: **"All functionality is available without special access"**
- (Or "Restricted" + provide test credentials if login required)

### 3.2 — Ads Declaration

- Select: **"No, my app does not contain ads"**

### 3.3 — Content Rating

1. Policy → App content → Content rating → Start questionnaire
2. Category: **"Utility, Productivity, Communication, or Other"**
3. Answer questions honestly (likely all "No" for violence/sexual/language)
4. Submit — expect **Everyone** or **Everyone 10+** rating

### 3.4 — Target Audience

- Select: **13 and above**
- Do NOT select under-13 unless COPPA compliant

### 3.5 — News Apps

- Select: **"My app is not a news app"**

### 3.6 — Data Safety

This is the most detailed section. Disclose all data collection:

| Data Type | Collected? | Shared? | Purpose |
|:----------|:-----------|:--------|:--------|
| Email address | Yes | No | Account/authentication |
| Name | Yes | No | User profile |
| App interactions | Yes | No | Analytics |
| Mood data | Yes | No | Core functionality |
| Journal entries | Yes | No | Core functionality |

Additional answers:
- Encrypted in transit: **Yes**
- Encrypted at rest: **Yes**
- Users can request deletion: **Yes**

---

## PHASE 4: Store Listing

### 4.1 — Text Content

Go to Grow → Store presence → Main store listing.

**App name** (30 chars):
```
Kiaanverse — Divine Companion
```

**Short description** (80 chars):
```
Your sacred AI guide through Bhagavad Gita wisdom & spiritual growth
```

**Full description**: Copy from `store-listings/google-play/store-listing.md`

### 4.2 — Graphics

| Asset | Size | Format |
|:------|:-----|:-------|
| App icon | 512×512 px | PNG (32-bit with alpha) |
| Feature graphic | 1024×500 px | PNG or JPEG |
| Phone screenshots | 1080×1920+ px | PNG or JPEG, 4–8 images |
| Tablet 7" screenshots | 1200×1920 px | Optional |
| Tablet 10" screenshots | 1920×1200 px | Optional |

**Recommended screenshots** (in order):
1. Sakha AI chat conversation
2. Bhagavad Gita verse browser
3. Mood tracking / Divine Mood Ring
4. Sadhana daily practice
5. Spiritual journeys
6. Encrypted journal
7. Karma footprint
8. Language selection (17 languages)

### 4.3 — Contact Details

- Email: `support@kiaanverse.com`
- Website: `https://kiaanverse.com`

---

## PHASE 5: Build Production AAB

### 5.1 — Configure EAS Project

```bash
cd kiaanverse-mobile/apps/mobile
eas init
# Follow prompts to create/select project
```

### 5.2 — Configure Android Credentials

```bash
# EAS manages keystore automatically (recommended)
# During first build, say YES to "Generate new Android Keystore"

# CRITICAL: Download backup of keystore
eas credentials --platform android
# Select "Download Keystore" — SAVE THIS SECURELY
```

### 5.3 — Set Environment Variables

```bash
# In kiaanverse-mobile/apps/mobile/.env
API_BASE_URL=https://your-production-api.com
SENTRY_DSN=your-sentry-dsn
EAS_PROJECT_ID=your-project-id
```

### 5.4 — Build

```bash
eas build --platform android --profile production
```

Build takes 10–30 minutes. Download the `.aab` file when complete.

---

## PHASE 6: Internal Testing (Do This First!)

### 6.1 — Create Internal Test

1. Release → Testing → Internal testing
2. Click **"Create new release"**
3. Upload `.aab` file
4. Add release notes
5. Click **"Start rollout to Internal testing"**

### 6.2 — Add Testers

1. Testers tab → Create email list → Add tester emails (up to 100)
2. Copy opt-in link → send to testers

### 6.3 — Test Everything

- [ ] App opens without crash
- [ ] Sakha AI chat works
- [ ] Gita verses load
- [ ] Mood tracking works
- [ ] Journal saves + encrypts
- [ ] Push notifications arrive
- [ ] Biometric login works
- [ ] All languages work
- [ ] Offline mode works
- [ ] Audio/voice features work

---

## PHASE 7: Closed Beta (Optional, Recommended)

1. Release → Testing → Closed testing → Create track
2. Upload tested AAB
3. Add up to 2,000 testers
4. Collect feedback for 1–2 weeks

---

## PHASE 8: Production Release

### 8.1 — Pre-Launch Checklist

- [ ] All App Content sections have green checkmarks
- [ ] Store listing complete (icon, graphic, screenshots, text)
- [ ] Content rating submitted
- [ ] Data safety completed
- [ ] Privacy policy URL is live
- [ ] App tested via internal/closed testing
- [ ] No critical crashes

### 8.2 — Pricing & Countries

1. Monetize → App pricing → **Free**
2. Release → Production → Countries/regions → Add countries

### 8.3 — Create Production Release

1. Release → Production → **"Create new release"**
2. Upload final `.aab`
3. Add release notes
4. Choose staged rollout: **Start at 20%**
5. Click **"Start rollout to Production"**

### 8.4 — Google Review

- First review: **1–14 days** (new accounts take longer)
- Check email for approval or rejection notice

### 8.5 — Common Rejection Reasons

| Reason | Fix |
|:-------|:----|
| Privacy policy broken | Ensure URL loads correctly |
| Data safety incomplete | Fill every field |
| Misleading description | Match description to actual features |
| Broken functionality | Fix crashes, rebuild, resubmit |
| IP issues | Remove trademarked content |

---

## PHASE 9: Post-Launch

### 9.1 — Monitor

- Quality → Android Vitals → Crashes & ANRs (check daily for 2 weeks)
- Fix critical crashes → rebuild → push update

### 9.2 — Increase Rollout

- No major issues after 2–3 days at 20% → increase to 50%
- No issues at 50% → increase to 100%

### 9.3 — Reviews

- Check Ratings and reviews → Reviews
- Reply to negative reviews compassionately
- Note feature requests

### 9.4 — Alerts

- Settings → Notifications → Enable alerts for removals, crashes, 1-star reviews

---

## PHASE 10: Automate Future Releases

### 10.1 — Google Play Service Account

1. Google Cloud Console → create project
2. Enable **"Google Play Android Developer API"**
3. Create service account → download JSON key
4. Play Console → Settings → API access → link project + grant permissions

### 10.2 — EAS Submit

```bash
eas secret:create --name PLAY_STORE_JSON \
  --value "$(cat service-account.json)" --scope project
```

### 10.3 — One-Command Release

```bash
eas build --platform android --profile production --auto-submit
```

### 10.4 — Tag-Based CI/CD

```bash
git tag v1.0.0
git push origin v1.0.0
# GitHub Actions builds and submits automatically
```

---

## Timeline Estimate

| Phase | What | Time |
|:------|:-----|:-----|
| 0 | Prerequisites | 1 hour |
| 1 | Play Console account | 1 hour + 2–7 days verification |
| 2 | Create app | 10 minutes |
| 3 | App content forms | 1–2 hours |
| 4 | Store listing + assets | 2–4 hours |
| 5 | Build AAB | 30 minutes |
| 6 | Internal testing | 3–7 days |
| 7 | Beta testing | 1–2 weeks (optional) |
| 8 | Production submit | 30 min + 1–7 days review |
| 9 | Post-launch | Ongoing |

**Realistic total: ~2–4 weeks from start to live**

---

## Assets Already Prepared

| Asset | Location |
|:------|:---------|
| Store listing text | `store-listings/google-play/store-listing.md` |
| Asset specifications | `store-listings/assets-specification.md` |
| EAS build config | `kiaanverse-mobile/apps/mobile/eas.json` |
| App config | `kiaanverse-mobile/apps/mobile/app.config.ts` |
| CI/CD pipeline | `.github/workflows/mobile-production-release.yml` |

## Assets Still Needed

- [ ] App icon — 512×512 PNG
- [ ] Feature graphic — 1024×500 PNG/JPEG
- [ ] 4–8 phone screenshots — 1080×1920+ px
- [ ] Live privacy policy at `https://kiaanverse.com/privacy`
