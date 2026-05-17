# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [voice-1.0.0] — 2026-04-27

The first release of the **Sakha Voice Companion** — Krishna's voice as
a companion. Native Android app shipped as a signed `.aab` via Expo EAS
Build, with a streaming WSS pipe to a server-side orchestrator that
guarantees Gita-grounded responses.

> **Confidential to Kiaanverse / MindVibe — see `docs/voice-companion-runbook.md`
> for the operational playbook. The Sakha spec is internal-only.**

### Added — backend (Wisdom Core voice extensions)

- `backend/services/crisis_partial_scanner.py` — sub-800ms crisis routing
  on transcript.partial frames; multi-language phrase table (EN +
  Devanagari + romanized Hindi + Marathi/Bengali/Tamil/Telugu/Punjabi);
  region-aware helpline registry (988 / Vandrevala / iCall / Samaritans).
- `StreamingGitaFilter` in `gita_wisdom_filter.py` — sentence-streaming
  variant of `GitaWisdomFilter` for voice mode; PASS / HOLD / FAIL
  verdicts route the WSS handler to either continue streaming to TTS
  or fall through the 4-tier fallback chain.
- `EngineRouter.route(voice_mode=True)` in `kiaan_engine_router.py` —
  voice-render annotations (target duration per engine, soft bias away
  from ASSISTANT when intent ambiguous).
- `WisdomEngine.generate_response(render_mode="voice")` — same wisdom,
  rendered as a 30–45s spoken arc with `<pause:short|medium|long>` SSML
  hints and ONE practical suggestion.
- `DynamicWisdomCorpus` voice telemetry — `delivery_channel` column,
  `voice_specific_outcomes` JSON column, 11 voice counters, derived
  rates that return None until first event (no misleading 0%).
- Migration `20260426_add_voice_channel_to_wisdom_effectiveness.sql`.

### Added — backend (WSS pipeline)

- `backend/services/voice/wss_frames.py` — Pydantic frame protocol for
  subprotocol `kiaan-voice-v1` v1.0.0. 5 client + 13 server frames with
  discriminated unions and `extra="forbid"`.
- `backend/services/voice/stt_router.py` — Sarvam Saarika (Indic) /
  Deepgram Nova-3 (English) routing with deterministic mock fallback.
- `backend/services/voice/tts_router.py` — Sarvam / ElevenLabs routing,
  AudioCache with safe key (verses + mood + lang + voice_id +
  persona_version, NEVER user text), 7-day TTL.
- `backend/services/voice/llm_provider.py` — gpt-4o-mini streaming with
  deterministic mock fallback.
- `backend/services/voice/orchestrator.py` — VoiceCompanionOrchestrator
  per-turn coordinator; happy / cache-hit / filter-fail / interrupt /
  crisis paths.
- `backend/routes/voice_companion_wss.py` — FastAPI WebSocket route at
  `/voice-companion/converse`. Subprotocol negotiation, persona-version
  handshake, heartbeat, telemetry recording.

### Added — backend (preflight + admin)

- `backend/routes/voice_quota.py` — `GET /api/voice/quota` and
  `GET /api/voice/persona-version` for mobile preflight.
- `backend/services/voice/quota_service.py` — tier matrix
  (free=0min/day, bhakta=30min, sadhak/siddha=unlimited), daily-minutes
  counter (Redis-ready), `record_minutes` rounds UP to whole minute.
- `backend/routes/admin/wisdom_telemetry.py` — added
  `GET /api/admin/wisdom-telemetry/voice` rollup.

### Added — backend (safety + tool contracts)

- `prompts/safety_audio_manifest.json` — 30 audio slots (3 categories ×
  10 languages: crisis_routing, quota_upgrade, silence_hum).
- `backend/services/voice/safety_audio.py` + `backend/routes/voice_safety_audio.py` —
  served at `/static/voice/safety/<file>` with placeholder-aware 503s
  for graceful mobile fallback.
- `backend/services/voice/tool_prefill_contracts.py` — 15
  `ToolVoicePrefillContract`s mirroring every EcosystemTool. PII scrub
  (name, email, phone, address, medical, financial), per-tool confidence
  thresholds, `apply_contract()` returns INPUT_TO_TOOL / NAVIGATE / DROP.

### Added — prompts

- `prompts/persona-version` — pinned at `1.0.0`.
- `prompts/sakha.voice.openai.md` (10.6KB) — voice persona system
  prompt for gpt-4o-mini, persona-version 1.0.0.
- `prompts/sakha.text.openai.md` (5KB) — text persona, preserves the
  4-Part Mandatory Response Structure.
- `prompts/sakha.regression.jsonl` — 50 fixed prompt cases (19
  GUIDANCE / 19 FRIEND / 8 VOICE_GUIDE / 4 ASSISTANT, 6 languages, 18
  moods, 8 filter-probe edge cases).
- `backend/services/prompt_loader.py` — versioned, drift-detecting
  loader with cross-version-check.
- `scripts/run_sakha_regression.py` — `--offline` (CI, free, fast) and
  `--live` (manual, pre-deploy gate) modes.

### Added — mobile (`apps/sakha-mobile/`)

- New Expo SDK 51 app in the `kiaanverse-mobile/` pnpm workspace.
- `app.config.ts` — `com.kiaanverse.sakha`, New Architecture enabled,
  R8 keep rules for KiaanAudioPlayer + AndroidX Media3 + Picovoice +
  Reanimated 3 + Lottie + SVG, all 8 required permissions.
- `eas.json` — production profile produces signed `.aab` (per spec).
- 3 Expo config plugins:
  - `withKiaanForegroundService` — mediaPlayback service entry +
    Devanagari notification strings.
  - `withKiaanAudioFocus` — audio attributes meta-data
    (USAGE_ASSISTANCE_SONIFICATION, GAIN_TRANSIENT_MAY_DUCK).
  - `withPicovoice` — ABI splits + `KIAAN_PICOVOICE_ACCESS_KEY`
    BuildConfig field.
- `lib/wss-types.ts` — TypeScript mirror of the Pydantic frame protocol
  (17 types). Validated by `validate-wss-types.mjs`.
- `lib/native/KiaanAudioPlayer.ts` — TS wrapper for the Kotlin
  TurboModule.
- `lib/tool-prefill-contracts.ts` — TypeScript mirror of the 15
  Python contracts. Validated by `validate-tool-contracts.mjs`.

### Added — mobile (Kotlin native module)

- `native/android/src/main/java/com/kiaanverse/sakha/audio/KiaanAudioPlayerModule.kt` —
  TurboModule wrapping AndroidX Media3 ExoPlayer 1.4.x. 11
  `@ReactMethod` Promise methods (`appendChunk`, `play`, `pause`,
  `fadeOut(120ms)`, `stop`, `release`, `getAudioLevel`, +
  `addListener`/`removeListeners` bridge stubs). Visualizer-driven RMS
  metering at 60Hz with 80ms moving average for the Shankha sound waves.
- `SakhaForegroundService.kt` — Android 14+ typed `mediaPlayback`
  foreground service with localized notification (Devanagari +
  English) and 30-min defensive WAKE_LOCK cap.
- `KiaanAudioPlayerPackage.kt` + `expo-module.config.json` for
  autolinking + `build.gradle` + `proguard-rules.pro`.

### Added — mobile (orchestration)

- `stores/voiceStore.ts` — Zustand store with `VoiceState` enum and 18
  actions; subscribeWithSelector middleware for fast partial subscriptions.
- 11 voice hooks under `hooks/voice/`:
  `useWebSocket`, `useVoiceSession`, `useRecorder`, `useStreamingPlayer`,
  `useVAD` (Cobra), `useBargeIn`, `useAudioFocus`, `useForegroundService`,
  `useShankhaAnimation`, `useCrisisHandler`, `useToolInvocation` (60% of
  ack audio, capped 3.5s; PII-scrubbed prefill payload).

### Added — mobile (UX)

- `lib/theme.ts` — COSMIC_VOID, DIVINE_GOLD, Shankha cream/ivory/copper.
- `components/Shankha.tsx` — cinematic stylized SVG conch with three
  RMS-driven sound-wave layers per spec.
- `components/SacredGeometry.tsx` — 12-fold mandala with slow rotation
  + RMS-synchronized opacity glow.
- 5 voice screens in `app/voice/`: VoiceCompanionScreen,
  VoiceTranscriptOverlay, CrisisOverlay (non-dismissible),
  VoiceQuotaSheet (no countdown timers), VoiceOnboarding.

### Added — testing

- 177 Python unit tests across 9 test files (Parts 2-6 + 11).
- 100 prompt-regression checks (50 cases × voice + text modes).
- 9 Detox E2E suites in `apps/sakha-mobile/e2e/` covering the spec's
  full testing matrix: startup + permissions, happy path, cache hit,
  crisis routing, quota + persona-version, barge-in + interrupt,
  INPUT_TO_TOOL navigation, BT + call handling, long session +
  filter fallback.
- Cross-validators for WSS frames + tool contracts + plugins +
  pure helpers + safety audio.

### Added — operational

- `docs/voice-companion-runbook.md` — environment vars, .aab build
  workflow, persona-version bump protocol, safety audio rotation,
  on-call playbook, telemetry endpoints, staged rollout plan.

### Security

- Cache key NEVER includes raw user text — verified by unit tests.
- PII scrub on every INPUT_TO_TOOL payload (server + client).
- Crisis incident logging is anonymized (no transcript content).
- Filter rejects responses citing other traditions (Buddha / Quran /
  Bible / hadith / sutras) or therapy-speak hedges ("as an AI",
  "consult a licensed therapist"). Verified by 50 regression cases.
- Zero-knowledge audio cache — keys are `sha256(verses + mood +
  render_mode + lang + voice_id + persona_version)`.

### Known limitations

- 30 safety audio `.opus` files are placeholders until the human-asset
  pipeline drops real renders. Mobile gracefully falls back to
  live-TTS via `wisdom_engine._render_voice`. CI gate
  `KIAAN_SAFETY_AUDIO_REQUIRED=1` prevents production .aab from
  shipping with placeholders.
- Sarvam / Deepgram / ElevenLabs streaming SDK calls are stubbed
  pending real keys. Mock providers cover the full pipeline in CI;
  enabling a real provider is a single env-var flip.
- Founder's 100-response listen (per spec) cannot be delegated and
  is not gated by code.

[voice-1.0.0]: https://github.com/hisr2024/MindVibe/compare/v0.1.0...voice-1.0.0

### Added
- SECURITY.md with comprehensive security policy
- Dependabot configuration for automated dependency updates
- GitHub issue templates (bug report, feature request, documentation)
- CODEOWNERS file for automatic code review assignments
- Enhanced CI/CD pipeline with lint, typecheck, tests, and coverage
- Pre-commit hooks configuration
- ESLint and Prettier configuration
- Privacy Policy and Terms of Service
- Medical disclaimer
- Security architecture documentation (SECURITY_ARCH.md)
- CHANGELOG.md to track version history
- OpenAPI schema export documentation

### Changed
- Updated .gitignore to exclude node_modules and build artifacts
- Enhanced .env.example with comprehensive environment variable documentation
- Removed .env from version control (kept .env.example only)

### Security
- Removed .env file from git tracking to prevent credential leaks
- Added comprehensive security documentation

## [0.1.0] - 2025-11-01

### Added
- Initial release of MindVibe
- FastAPI backend with mood tracking, journal, and wisdom guide features
- Next.js frontend with TypeScript
- JWT-based authentication
- EdDSA cryptographic signatures
- PostgreSQL database integration
- Client-side encryption for journal entries
- Basic test infrastructure with pytest (47 tests, 31% coverage)
- Docker support
- CI/CD workflows

### Features
- Mood tracking and analytics
- Encrypted journal entries
- AI-powered wisdom guide
- Content recommendations based on mood
- User authentication and authorization

[Unreleased]: https://github.com/hisr2024/MindVibe/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/hisr2024/MindVibe/releases/tag/v0.1.0
