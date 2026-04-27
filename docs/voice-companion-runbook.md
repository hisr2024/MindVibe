# Sakha Voice Companion — Operational Runbook

**Persona-version:** `1.0.0` · **Schema-version:** `1.0.0` · **Subprotocol:** `kiaan-voice-v1`
**Confidential to Kiaanverse / MindVibe — do not distribute, summarize, or share outside the team.**

This is the on-call playbook for the Sakha voice WSS pipeline. Print
the .aab build commands, env vars, rotation procedures, and the
"what to do when X breaks" table. Read end-to-end before paging.

---

## 1. Architecture cheat-sheet

```
Mobile (apps/sakha-mobile)
   │ pre-flight: GET /api/voice/quota + /api/voice/persona-version
   │ pre-flight: GET /api/voice/safety/manifest
   ▼
Mobile WSS client (subprotocol kiaan-voice-v1)
   │ ws.send: start | audio.chunk | end_of_speech | interrupt | heartbeat
   │ ws.recv: transcript.partial | engine | mood | verse | text.delta
   │          audio.chunk | filter_failed | tool_invocation | suggested_next
   │          done | error | crisis | heartbeat.ack
   ▼
backend/routes/voice_companion_wss.py     ← WSS handler (Part 5)
   │
   ├─ STT: Sarvam Saarika (Indic) / Deepgram Nova-3 (English)  | mock if no key
   ├─ Crisis: backend/services/crisis_partial_scanner.py        ← Part 2
   ├─ Engine route: backend/services/kiaan_engine_router.py     ← Part 2 (voice_mode)
   ├─ Verse retrieval: backend/services/voice/retrieval_and_fallback.py
   ├─ LLM: gpt-4o-mini streaming                               | mock if no key
   ├─ StreamingGitaFilter sentence-by-sentence                 ← Part 2
   ├─ TTS: Sarvam (Indic) / ElevenLabs (English)               | mock if no key
   │   └─ AudioCache key: hash(verses + mood + render_mode +
   │                            lang + voice_id + persona_version)
   └─ DynamicWisdomCorpus.record_wisdom_delivery / outcome     ← Part 3
       (delivery_channel="voice_android", voice_specific_outcomes={…})
```

---

## 2. .aab production build (the canonical path)

```bash
# From the repo root
cd kiaanverse-mobile

# Sanity gates BEFORE building
pnpm --filter @kiaanverse/sakha-mobile run typecheck
pnpm --filter @kiaanverse/sakha-mobile run validate:wss-types
pnpm --filter @kiaanverse/sakha-mobile run validate:plugins
pnpm --filter @kiaanverse/sakha-mobile run validate:tool-contracts
KIAAN_SAFETY_AUDIO_REQUIRED=1 python3 ../../scripts/validate_safety_audio.py
python3 ../../scripts/run_sakha_regression.py --offline

# Build the .aab (production profile, autoIncremented versionCode)
pnpm --filter @kiaanverse/sakha-mobile run build:android:production

# Submit to Play Console (internal track, draft status by default)
pnpm --filter @kiaanverse/sakha-mobile run submit:android
```

**Hard-fail gates** (CI must enforce):
- `validate-wss-types`: 17 frame types match TS↔Python
- `validate-plugins`: 3 Expo plugins load + invoke
- `validate-tool-contracts`: 15 tools match (names, allowed_fields, min_confidence)
- `validate_safety_audio.py --strict`: 0 placeholder slots
- `run_sakha_regression.py --offline`: 50/50 voice + 50/50 text
- All 9 Detox E2E suites green on Pixel 7 / Android 14 release build

---

## 3. Required environment variables

### Backend (production)

| Variable | What | Required? |
|---|---|---|
| `OPENAI_API_KEY` | gpt-4o-mini streaming | yes for live LLM |
| `KIAAN_LLM_PROFILE` | "production" / "preview" | optional |
| `KIAAN_SARVAM_API_KEY` | Sarvam Saarika STT + TTS | yes for live |
| `KIAAN_DEEPGRAM_API_KEY` | Deepgram Nova-3 STT (English) | yes for live |
| `KIAAN_ELEVENLABS_API_KEY` | ElevenLabs TTS (English) | yes for live |
| `KIAAN_VOICE_MOCK_PROVIDERS` | `1` to force mock STT/TTS/LLM | dev/CI only |
| `KIAAN_VOICE_ID_EN` / `_HI` / `_MR` / … | per-language voice ID override | optional |
| `KIAAN_HELPLINE_OVERRIDES_JSON` | per-region helpline number override | optional |
| `KIAAN_SAFETY_AUDIO_REQUIRED` | `1` to fail builds on placeholder slots | CI gate |
| `KIAAN_PROMPT_LOADER_TEST` | `1` to allow `reset_cache_for_tests()` | tests only |
| `KIAAN_VOICE_QUOTA_TEST` | `1` to allow quota counter reset | tests only |

### Mobile (EAS secrets)

| Variable | Used by | Required? |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | every WSS + REST call | yes |
| `PICOVOICE_ACCESS_KEY` | Cobra VAD (`withPicovoice` plugin) | yes for real builds |
| `SENTRY_DSN` | runtime crash + perf | optional |
| `EAS_PROJECT_ID` | EAS itself | injected by `eas init` |

Configure mobile secrets via:
```bash
eas secret:create --scope project --name PICOVOICE_ACCESS_KEY --value <key>
```

---

## 4. Pre-deploy persona-version bump protocol

**The spec is explicit:** never edit prompts in production.

1. Open a PR that touches `prompts/sakha.voice.openai.md` (or `.text`).
2. **Bump** `prompts/persona-version` (e.g. `1.0.0` → `1.0.1`).
3. **Update both prompt files** to declare the new version (the
   loader's cross-version check rejects mismatches).
4. **Run regression**:
   ```bash
   python3 scripts/run_sakha_regression.py --offline --render-mode=voice
   python3 scripts/run_sakha_regression.py --offline --render-mode=text
   ```
   Both must show `50/50 passed`.
5. **Live regression** (manual, requires `OPENAI_API_KEY`):
   ```bash
   python3 scripts/run_sakha_regression.py --live --max-cases=20
   ```
   Reviewer samples 20 outputs, listens to TTS audio for at least 5,
   confirms no other-tradition citation / therapy-speak / non-canonical
   verse.
6. **Founder's listen** (per spec, cannot be delegated):
   100 responses through phone speaker + headphones + walking + silence.
7. Merge → mobile clients with old `persona-version` will see
   `PERSONA_VERSION_MISMATCH` close code 4001 → onboarding panel
   prompts app update. Force-update via EAS Update channel.

---

## 5. Safety audio rotation

The `prompts/safety_audio_manifest.json` lists 30 slots. The audio
team renders them and drops the `.opus` files at:
```
backend/static/voice/safety/<category>.<lang>.opus
```

After dropping new files:
```bash
python3 scripts/validate_safety_audio.py
# → "ready for production: YES" once all 30 slots are real
```

The backend serves them with a 24h immutable cache header. The
mobile client preflight reads `/api/voice/safety/manifest` to know
which clips are live; placeholders fall back to live-TTS.

To roll back a bad clip: replace the file in `backend/static/voice/safety/`
with the previous version + the next deploy picks it up. The
`X-Sakha-Asset-Status: real` + ETag header invalidates client caches.

---

## 6. Helpline rotation

Helplines live in `backend/services/crisis_partial_scanner.py` →
`HELPLINES` dict. **DO NOT edit numbers in production code** — they
require Vandrevala / iCall / 988 verification. Rotate via env:

```bash
export KIAAN_HELPLINE_OVERRIDES_JSON='{"IN":[{"name":"Vandrevala Foundation","number":"1860-2662-345","region":"IN"}]}'
```

After rotation, run:
```bash
python3 -c "from backend.services.crisis_partial_scanner import helplines_for_region; print(helplines_for_region('IN'))"
```

---

## 7. On-call: "what to do when X breaks"

| Symptom | First check | Fix |
|---|---|---|
| Mobile shows `PERSONA_VERSION_MISMATCH` | `cat prompts/persona-version` vs mobile build constant | Force EAS Update push, or roll persona file back |
| Crisis frame never fires for known phrase | Inspect `voice.crisis.detected` log line | Add phrase to `CRISIS_PHRASES_*` in `crisis_partial_scanner.py`, redeploy backend |
| First audio byte > 1.5s on cache miss | Admin telemetry: `/api/admin/wisdom-telemetry/voice` → `first_byte_ms_avg` | Inspect Sarvam/ElevenLabs latency; consider TTS provider failover |
| Filter rejection rate > 10% | Admin telemetry → `filter_pass_rate` | Roll persona-version back; investigate prompt drift |
| Cache hit rate < 30% on repeat moods | Admin telemetry → `cache_hit_rate` | Check `persona_version` consistency; AudioCache key dimensions |
| Battery drain >5% per 30-min session | Production Sentry trace | Check WAKE_LOCK release in `SakhaForegroundService.kt` |
| BT headset not auto-routing | `withKiaanAudioFocus` meta-data missing | Verify `routeBluetooth=true` in manifest after prebuild |
| Foreground service killed mid-session | Android 14 + `ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK` | `withKiaanForegroundService` plugin must be in `app.config.ts` plugins[] |

---

## 8. Telemetry endpoints

```
GET  /api/admin/wisdom-telemetry/overview    Wisdom v3.1 overall
GET  /api/admin/wisdom-telemetry/voice       voice rollup (Part 6d)
POST /api/admin/wisdom-telemetry/buffer/flush  drain in-memory buffer

GET  /api/voice/safety/manifest              30-slot status
GET  /api/voice/quota?user_id=&tier=         per-user quota
GET  /api/voice/persona-version              current pinned version
```

All admin endpoints require `KIAAN_ANALYTICS_VIEW` permission via
the existing RBAC chain.

---

## 9. Test suite — what runs where

| Layer | Command | When |
|---|---|---|
| Unit + integration (Python) | `pytest tests/unit/test_voice_*` | every PR |
| Prompt regression — offline | `python3 scripts/run_sakha_regression.py --offline` | every PR |
| Prompt regression — live | `python3 scripts/run_sakha_regression.py --live` | persona-version bump |
| WSS frame drift | `node apps/sakha-mobile/scripts/validate-wss-types.mjs` | every PR |
| Tool contract drift | `node apps/sakha-mobile/scripts/validate-tool-contracts.mjs` | every PR |
| Plugin smoke | `node apps/sakha-mobile/scripts/validate-plugins.mjs` | every PR |
| Pure helpers | `node apps/sakha-mobile/scripts/test-pure-helpers.mjs` | every PR |
| Safety audio | `python3 scripts/validate_safety_audio.py --strict` | pre-release |
| Detox E2E | `pnpm --filter @kiaanverse/sakha-mobile run test:e2e:android` | pre-release |
| Founder's listen (100 responses) | manual | pre-launch only |

Cumulative as of voice 1.0.0:
- **177 Python unit tests** + **100 prompt regression cases** (50 × 2 modes)
- **17 WSS frame types** matched TS↔Python
- **15 tool contracts** matched TS↔Python
- **3 Expo plugins** validated
- **9 Detox E2E suites** covering the spec's full testing matrix
- **30 safety audio slots** tracked

---

## 10. Staged rollout plan (per spec)

1. **Internal testing track** (10 testers, 7 days)
   Gate: Detox green on Pixel 7 + Pixel 5 + Redmi Note 11
2. **Closed beta** (100 users, 7 days)
   Daily review: `voice.first_audio_byte_ms` p95 < 1.5s
   Daily review: `wisdom-telemetry/effectiveness-distribution`
3. **Production staged rollout** (Play Console)
   1% → 10% → 50% → 100% over 7 days
4. **Daily-review during rollout**: voice telemetry + crisis incident log

Rollback: revert to previous `versionCode` via Play Console halt.
The persona-version stays the same so the WSS handshake doesn't
flip; only the .aab does.

---

🐚 🕉️
