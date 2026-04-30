# Sakha Voice — Native Android

Native Android (Kotlin) implementation of **Sakha Voice mode** for the
MindVibe / Kiaanverse mobile app. Sakha (सखा) is the Bhagavad-Gita-grounded
voice persona defined in [`sakha.voice.openai.md`](../../../../sakha.voice.openai.md).

This is **distinct** from the generic `KiaanVoiceManager` that ships in the
parent `voice/` directory — that manager is a multi-purpose STT/TTS shell;
Sakha is the persona-specific orchestrator that:

- speaks pause-aware prose with explicit `<pause:short|medium|long>` markers
- routes Sanskrit verse segments to a slower, reverent voice
- defends the persona against "AI tells" (`SakhaPersonaGuard`)
- handles the `FILTER_FAIL: no_retrieval` server contract honestly
- streams over SSE via OkHttp so the user hears the first sentence in
  ~700ms instead of waiting for the full response

---

## File layout

| File | Purpose |
| --- | --- |
| `SakhaTypes.kt`         | Enums, config, listener, errors. The vocabulary of the system. |
| `SakhaPauseParser.kt`   | Streaming parser. Turns model text into `Speak` / `Pause` / `Filter` events. |
| `SakhaPersonaGuard.kt`  | Defence-in-depth filter for AI-tell phrases. |
| `SakhaSseClient.kt`     | OkHttp-based SSE client to `/api/voice-companion/message`. |
| `SakhaTtsPlayer.kt`     | Sequential MediaPlayer queue with pause honouring + Sanskrit voice routing. |
| `SakhaVoiceManager.kt`  | The orchestrator. State machine, mic, SSE, parser, player. |
| `SakhaVoiceModule.kt`   | React Native bridge (legacy bridge, not TurboModules). |
| `SakhaVoicePackage.kt`  | RN package registration. Add to `MainApplication`. |
| `test/`                 | JVM unit tests for the parser and guard. |

---

## Wiring into the app

1. **MainApplication** — register the package:

   ```kotlin
   override fun getPackages(): List<ReactPackage> =
       PackageList(this).packages.apply {
           add(SakhaVoicePackage())
       }
   ```

2. **AndroidManifest** — already has `RECORD_AUDIO` via the Expo config in
   this branch (`apps/mobile/app.config.ts`). No further changes needed.

3. **Gradle** — add OkHttp if not already on the classpath:

   ```gradle
   implementation 'com.squareup.okhttp3:okhttp:4.12.0'
   ```

   (React Native already ships an OkHttp version, so this is usually free.)

4. **JS** — use the React hook:

   ```ts
   import { useSakhaVoice } from '@/hooks/useSakhaVoice';
   import { API_CONFIG, getCurrentAccessToken } from '@kiaanverse/api';

   const sakha = useSakhaVoice({
       backendBaseUrl: API_CONFIG.baseURL,
       getAccessToken: () => getCurrentAccessToken(),
   });
   ```

   Or navigate the user to `app/voice.tsx` — a complete drop-in screen.

---

## State machine

```
   IDLE
     │ activate()
     ▼
  LISTENING ──silence/stop──► TRANSCRIBING ──► REQUESTING
                                                   │
                                                   ▼
                                          SPEAKING ⇄ PAUSING
                                                   │
                                                   ▼
                                                 IDLE
```

Barge-in: if `allowBargeIn = true` (the default) and the user taps the mic
while Sakha is speaking, the manager cancels playback, marks the turn as
`barged`, and starts a fresh `LISTENING` cycle.

---

## Backend contract

Sakha Voice expects these endpoints under `${backendBaseUrl}${voiceCompanionPathPrefix}`:

| Method | Path | Used for |
| --- | --- | --- |
| POST | `/message` (SSE) | Streaming model output |
| POST | `/synthesize`     | Per-segment TTS audio |

See `backend/routes/kiaan_voice_companion.py` for the canonical FastAPI
implementation.

---

## Persona guarantees the client enforces

The client never trusts the model fully. Even if the system prompt slips,
these invariants hold *on device*:

1. **Pause markers are never spoken.** The parser strips them before audio.
2. **Banned phrases are rewritten or excised.** See `SakhaPersonaGuard`.
3. **`FILTER_FAIL: no_retrieval` aborts speakable output**, even mid-stream,
   and the manager speaks a soft template instead.
4. **Sanskrit verses are routed to a separate voice** with slower prosody.
   Never spoken by the system fallback TTS, which would mangle pronunciation.
5. **The mic is closed when `state` leaves `LISTENING`.** No silent capture.

---

## Tests

```bash
# Unit tests (JVM, no emulator needed)
./gradlew :sakha-voice:testDebugUnitTest

# Or run via Android Studio: right-click test/ → Run Tests
```

The `test/` folder contains coverage for the two parts that are hardest to
re-test by hand: the streaming parser and the persona guard regexes.
