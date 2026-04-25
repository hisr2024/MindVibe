# Kiaanverse Android — Building the Play Store AAB

This document describes how to produce a signed **Android App Bundle (`.aab`)**
for the षड्रिपु *Shadripu* Journeys app at `mobile/android`.

The app is a 1:1 adaptation of `kiaanverse.com` mobile — four tabs
(**Today · Journeys · Battleground · Wisdom**) plus a full Journey detail
flow — written in Kotlin + Jetpack Compose. It ships with two data paths:

* **Catalog mode (offline)** — hard-coded canonical content in
  `journey/data/JourneyContent.kt`. The AAB renders fully without a
  backend, which is what Play Store reviewers see.
* **Live mode (authenticated)** — `journey/data/JourneyEngineRepository.kt`
  calls `/api/journey-engine/*` on `https://api.kiaanverse.com`. The
  release `API_BASE_URL` (set in `app/build.gradle.kts`) routes the AAB
  to production by default. AI-grounded Sakha responses are toggled
  server-side — the AAB itself ships no LLM keys (see §11).

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

## 2. Gradle wrapper

The Gradle wrapper artifacts are committed in-tree at:

* `mobile/android/gradlew` (POSIX) and `mobile/android/gradlew.bat` (Windows)
* `mobile/android/gradle/wrapper/gradle-wrapper.jar` (43 KB)
* `mobile/android/gradle/wrapper/gradle-wrapper.properties` (pinned to 8.5)

You do NOT need a system Gradle install — the wrapper downloads Gradle
8.5 on first invocation. If for some reason the artifacts are missing
(e.g. fresh clone with LFS issues), regenerate them:

```bash
cd mobile/android
gradle wrapper --gradle-version 8.5 --distribution-type bin
chmod +x gradlew
```

Opening the project in Android Studio also auto-generates them.

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

The Retrofit-backed `JourneyEngineRepository` is already wired — the
`JourneyDetailLive` host falls back to the offline catalog when a journey
id isn't recognised, so the same AAB serves both reviewer flow and live
authenticated users.

---

## 11. Turning on the AI Sakha response (server-side, no AAB rebuild)

When a user taps "Complete Today's Step" on Android, the AAB POSTs to
`/api/journey-engine/journeys/{id}/steps/{day}/complete` and renders
`response.ai_response` in the Sakha card.

The body of `ai_response` is produced by one of two paths on the server:

1. **Deterministic templated** (default) — composed from the canonical
   enemy verse in `_ENEMY_SACRED`. Always works, no LLM cost.
2. **Wisdom-grounded LLM** — generated by
   `backend/services/journey_engine/sakha_wisdom_generator.py`, drawing
   exclusively from the 701-verse `GitaWisdomCore` and the dynamic
   `ModernExamplesDB`. The OpenAI key never touches the device.

Switch live AAB users from path 1 → path 2 by setting an env var on the
backend (no AAB rebuild required):

```bash
ENABLE_AI_SAKHA_RESPONSE=1
# Optional tunables (defaults shown):
AI_SAKHA_MAX_TOKENS=320
AI_SAKHA_TEMPERATURE=0.4
AI_SAKHA_TIMEOUT_SECS=8
AI_SAKHA_MAX_BODY_CHARS=650
```

Every failure mode (timeout, JSON parse, oversize body, refusal,
unconfigured provider) silently falls back to the deterministic body, so
flipping the flag is safe to do directly in production. The Android
contract `(ai_response: String, mastery_delta: Int)` is identical either
way.

To verify a flipped flag is reaching real users:

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  -X POST https://api.kiaanverse.com/api/journey-engine/journeys/$JID/steps/$DAY/complete \
  -H "Content-Type: application/json" -d '{}' | jq .ai_response
```

A grounded paragraph quoting a BG verse confirms the AI path is live.

---

## 12. ProGuard / R8 notes (release builds)

Release builds run R8 with `isMinifyEnabled = true`. The rules in
`app/proguard-rules.pro` keep:

* `com.mindvibe.app.journey.data.**` — Retrofit DTOs use Gson reflection
  on Kotlin properties. Without this rule, R8 renames `journeyId` → `a`
  and the live API path would 500-equivalent (Gson silently nulls every
  field). This is the most common AAB-only crash mode for Retrofit apps.
* `@dagger.hilt.android.lifecycle.HiltViewModel`-annotated classes —
  Hilt's component code looks them up by name at runtime.

If you bump Hilt, Retrofit, or Gson, re-test a release build (not just
debug) before uploading the AAB.
