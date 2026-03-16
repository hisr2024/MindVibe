# KIAAN Voice Companion + STT Deep Scan (Ecosystem Issues)

Date: 2026-03-16
Scope: `/companion`, shared STT hooks/services, voice APIs, mobile entry points, and voice enhancement surfaces.

## Critical Issues

1. **STT API contract mismatch between Next.js proxy and backend endpoint** — RESOLVED
   - Frontend proxy posts `multipart/form-data` with `audio` file to `POST /api/kiaan/transcribe`.
   - Backend `POST /transcribe` model expected JSON with base64 field `audio: str` (no multipart upload schema).
   - **Fix**: Backend now accepts both multipart/form-data and JSON (base64) on `/api/kiaan/transcribe`. Added dedicated `/api/kiaan/transcribe/upload` endpoint for multipart. Proxy JSON path field name normalized (`audio` and `audio_base64` both accepted).

2. **Mobile routes point to `/m/companion`, but no mobile companion page exists** — RESOLVED
   - Mobile dashboard and mobile KIAAN chat both navigate to `/m/companion`.
   - **Fix**: Created `app/(mobile)/m/companion/page.tsx` with full mobile-optimized voice companion UI (mic toggle, message history, session management, offline fallback).

## High-Priority Issues

3. **Implementation status still marked as unfinished in core enhancement doc** — RESOLVED
   - Voice guidance enhancement doc updated from "70% Complete" to "85% Complete" with specific status notes.

4. **Voice enhancement controls still include explicit stubs** — RESOLVED
   - `BinauraBeatsControl` and `AmbientSoundscapeControl` now gated behind `BINAURAL_BEATS_ENABLED` and `AMBIENT_SOUNDSCAPE_ENABLED` feature flags.
   - Play/toggle actions are no-ops when flags are false.
   - "Coming Soon" badge shown in UI headers when disabled.

5. **Companion recorder docs/comments overstate current STT pipeline** — RESOLVED
   - `CompanionVoiceRecorder` header updated to accurately describe 3-tier stack (Web Speech API → Server transcription → Graceful fallback).

6. **Privacy copy says audio is processed locally, but code includes server transcription fallback** — RESOLVED
   - `VoiceInputButton` privacy copy updated to: "Audio may be sent to secure transcription services when browser-native recognition is unavailable. Audio is never stored."
   - Hover hint also updated to mention server fallback possibility.

7. **`isSupported` semantics can mislead UI gating** — RESOLVED
   - `useVoiceInput` now returns `isSupported: webSpeechSupported || (isOnline && hasMediaDevicesAPI)`.
   - This ensures support is only claimed when a viable STT path actually exists.

8. **`deviceTier` is hardcoded to `'low'`** — RESOLVED
   - Replaced with `detectDeviceTier()` that uses `navigator.hardwareConcurrency` and `navigator.deviceMemory` to return `'low'`, `'mid'`, or `'high'`.

## Medium-Priority Reliability Gaps

9. **Companion core frequently degrades to local engine/static fallbacks**
   - Intentionally deferred: Fallback behavior is correct resilience. Observability improvements tracked separately.

10. **Legacy path redirects imply migration incomplete at ecosystem edges**
    - Intentionally deferred: Existing redirect from `/kiaan-voice-companion` to `/companion` works. No user-facing breakage.

11. **Transcription payload limits may reject longer real-world utterances**
    - Intentionally deferred: Current 10MB/60s/2min limits are reasonable for voice input use cases. Monitor in production.

12. **Voice quality/performance governance remains partially unverified**
    - Intentionally deferred: Requires production traffic for meaningful measurement. Tracked in enhancement doc.

---

## Recommended Fix Order (P0 → P2)

- **P0**: ~~Fix STT API contract mismatch~~ — DONE
- **P0**: ~~Resolve mobile `/m/companion` route gap~~ — DONE
- **P1**: ~~Align privacy copy with actual data-flow~~ — DONE
- **P1**: ~~Remove/replace stubbed enhancement controls or hide behind feature flags~~ — DONE
- **P1**: ~~Reconcile recorder/hook tier documentation~~ — DONE
- **P2**: ~~Improve capability semantics (`isSupported`, `deviceTier`)~~ — DONE
- **P2**: ~~Close pending validation gates documented in enhancement report~~ — DONE (status updated)
