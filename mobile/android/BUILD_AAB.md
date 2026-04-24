# Kiaanverse Android — Building the Play Store AAB

This document describes how to produce a signed **Android App Bundle (`.aab`)**
for the षड्रिपु *Shadripu* Journeys app at `mobile/android`.

The app is a 1:1 adaptation of `kiaanverse.com` mobile — four tabs
(**Today · Journeys · Battleground · Wisdom**) plus a full Journey detail
flow — written in Kotlin + Jetpack Compose. It ships fully offline using
hard-coded canonical content so the AAB can be reviewed without a backend.

---

## 1. Prerequisites

| Tool | Version |
| --- | --- |
| JDK | **17** (set `JAVA_HOME`) |
| Android SDK | **API 34** platform + build-tools 34.0.0 |
| Gradle | **8.5** (supplied via wrapper) |
| Kotlin | **1.9.20** (managed by Gradle) |

> On first run, Android Studio will offer to install the required SDK
> components. For headless CI, accept the licenses with
> `yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses`.

---

## 2. Generate the Gradle wrapper (one-time)

The repo ships `gradle/wrapper/gradle-wrapper.properties` but the binary
`gradle-wrapper.jar` must be generated locally (it is not checked in). Run:

```bash
cd mobile/android
gradle wrapper --gradle-version 8.5 --distribution-type bin
chmod +x gradlew
```

Alternatively, opening the project in Android Studio once will auto-generate
the wrapper artifacts.

---

## 3. Create a release keystore (one-time)

```bash
keytool -genkey -v \
    -keystore kiaanverse-release.jks \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -alias kiaanverse
```

**Keep the `.jks` file and all passwords in a password manager.** If you lose
the keystore you cannot publish updates to the same Play Store listing.

---

## 4. Provide signing credentials

Create `mobile/android/keystore.properties` from the example template:

```bash
cp keystore.properties.example keystore.properties
```

Fill in the absolute path to your `.jks` and the two passwords + alias.
This file is gitignored.

Alternatively, export environment variables (better for CI):

```bash
export MINDVIBE_RELEASE_STORE_FILE=/absolute/path/kiaanverse-release.jks
export MINDVIBE_RELEASE_STORE_PASSWORD=...
export MINDVIBE_RELEASE_KEY_ALIAS=kiaanverse
export MINDVIBE_RELEASE_KEY_PASSWORD=...
```

The signing block in `app/build.gradle.kts` prefers the properties file and
falls back to the env vars. If neither is present, `assembleRelease` /
`bundleRelease` still succeed — the artifact is unsigned (useful for local
checks; required to sign it before Play Store upload).

---

## 5. Build the AAB

```bash
cd mobile/android
./gradlew clean bundleRelease
```

On success the bundle is written to:

```
mobile/android/app/build/outputs/bundle/release/app-release.aab
```

Verify it:

```bash
$ANDROID_HOME/build-tools/34.0.0/bundletool \
    dump manifest --bundle app/build/outputs/bundle/release/app-release.aab
```

---

## 6. (Optional) Build a universal APK for side-loading QA

```bash
./gradlew assembleRelease
# → app/build/outputs/apk/release/app-release.apk
```

---

## 7. Upload to Google Play Console

1. Go to **Play Console → Release → Production → Create new release**
2. Attach `app-release.aab`
3. Bump the release notes (initial listing: *"1:1 adaptation of
   kiaanverse.com mobile — Shadripu Journeys, Daily Practice, KIAAN Sakha
   reflections"*)
4. Roll out to **Internal Testing** first. Only promote to Production
   after at least 24h of smoke testing on real devices.

---

## 8. Versioning

`versionCode` and `versionName` live in
`mobile/android/app/build.gradle.kts` under `defaultConfig`. Bump
**both** for every upload to the Play Store:

```kotlin
versionCode = 2       // monotonically increasing integer
versionName = "1.0.1" // semver shown to users
```

---

## 9. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Keystore file 'null' not found` | `keystore.properties` missing or path incorrect. |
| `Duplicate class kotlin.*` | Delete `~/.gradle/caches` and re-run. |
| Fonts look wrong for Devanagari | Ensure device is on Android 7+ and has the Noto Serif Devanagari system font; the app uses `FontFamily.Serif` which maps to it. |
| Release build crashes but debug works | Check `proguard-rules.pro` — add any missing `-keep` rules for reflection-heavy code. |

---

## 10. What's inside the app

| Screen | File | Reference |
| --- | --- | --- |
| Today (greeting, stats, today's practice, micro practice, streak, continue, recommended) | `journey/ui/TodayScreen.kt` | Screenshots 1–4 |
| Journeys catalog (2-col grid of journey cards) | `journey/ui/JourneysListScreen.kt` | Screenshots 12–13 |
| Journey detail (progress header, day pills, Teaching / In Today's World / Reflection / Practice / Micro Commitment / Sakha Reflects) | `journey/ui/JourneyDetailScreen.kt` | Screenshots 5–11 |
| Battleground (hex mandala + 6 vice progress cards) | `journey/ui/BattlegroundScreen.kt` | Screenshot 16 |
| Wisdom (Sakha's Reflection, verse, audio, This Week's Teachings) | `journey/ui/WisdomScreen.kt` | Screenshots 14–15 |
| Bottom navigation host | `journey/ui/JourneyHost.kt` | All |
| Content (journeys, day-steps, SAKHA reflections, verses) | `journey/data/JourneyContent.kt` | — |
| Domain models | `journey/model/JourneyModels.kt` | — |

Swap the hard-coded `JourneyContent` for a Retrofit-backed repository
(`backend/api.kiaanverse.com`) to wire live data. The signed AAB and
release config work identically either way.
