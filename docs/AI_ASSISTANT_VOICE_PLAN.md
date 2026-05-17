# MindVibe AI Assistant & Voice Integration Plan

## Confirmed Stack & Architecture Assessment

### Current Stack (Confirmed)
- **Frontend**: Next.js 16 + React 18 + TypeScript 5.9
- **Styling**: Tailwind CSS 3 + Framer Motion
- **State Management**: Zustand 5 (already in deps)
- **Voice (STT)**: Web Speech API via `SpeechRecognitionService` (`utils/speech/recognition.ts`)
- **Voice (TTS)**: Multiple providers (ElevenLabs, Sarvam, Bhashini) via backend services
- **Routing**: Next.js App Router (file-based routes under `app/`)
- **Testing**: Vitest + Testing Library + Playwright
- **Backend**: Python FastAPI with KIAAN Wisdom Engine
- **UI Components**: Radix UI primitives + custom components

### Existing Assets (What We Build On)
| Asset | Location | Status |
|-------|----------|--------|
| `useVoiceInput` hook | `hooks/useVoiceInput.ts` | Working - STT with permission handling |
| `VoiceInputButton` | `components/voice/VoiceInputButton.tsx` | Working - mic button with permission UI |
| `SpeechRecognitionService` | `utils/speech/recognition.ts` | Working - multi-alternative, confidence-based |
| `ecosystemNavigator` | `utils/voice/ecosystemNavigator.ts` | Working - 16 tools mapped with triggers |
| `detectToolSuggestion()` | `utils/voice/ecosystemNavigator.ts` | Working - keyword + emotion + topic routing |
| Karma Reset types | `types/karma-reset.types.ts` | Complete - 10 karmic paths, 7-phase model |
| `karma_reset_service.py` | `backend/services/karma_reset_service.py` | Exists - backend service |
| Companion page | `app/companion/page.tsx` | Working - orb-based voice UI |
| KIAAN ecosystem types | `types/kiaan-ecosystem.types.ts` | Complete - tool config, metadata types |
| Voice enhancements | `components/voice/enhancements/` | Working - binaural, spatial, breathing |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MindVibe Frontend                           │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              UniversalVoiceInput (NEW)                        │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐   │  │
│  │  │ Mic Btn  │  │ Permission   │  │ Transcription        │   │  │
│  │  │ (exists) │  │ Manager      │  │ Display              │   │  │
│  │  │          │  │ (consent +   │  │ (interim + final)    │   │  │
│  │  │          │  │  fallback)   │  │                      │   │  │
│  │  └────┬─────┘  └──────┬───────┘  └──────────┬───────────┘   │  │
│  │       │               │                      │               │  │
│  │       └───────────────┴──────────────────────┘               │  │
│  │                        │                                      │  │
│  │                 useVoiceInput (exists)                        │  │
│  │                        │                                      │  │
│  └────────────────────────┼──────────────────────────────────────┘  │
│                           │                                         │
│  ┌────────────────────────▼──────────────────────────────────────┐  │
│  │              KiaanVoiceController (NEW)                       │  │
│  │                                                               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │  │
│  │  │ Intent       │  │ Route        │  │ Action             │  │  │
│  │  │ Classifier   │  │ Resolver     │  │ Executor           │  │  │
│  │  │              │  │              │  │                    │  │  │
│  │  │ NL query →   │  │ intent →     │  │ route/fetch/reset  │  │  │
│  │  │ intent obj   │  │ route + ctx  │  │                    │  │  │
│  │  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘  │  │
│  │         │                 │                    │              │  │
│  │         └─────────────────┴────────────────────┘              │  │
│  │                           │                                   │  │
│  │              ecosystemNavigator (exists, enhanced)            │  │
│  └───────────────────────────┼───────────────────────────────────┘  │
│                              │                                      │
│  ┌───────────────────────────▼───────────────────────────────────┐  │
│  │                    Module Pages                                │  │
│  │                                                               │  │
│  │  ViYoga  Ardha  KIAAN Chat  Rel.Compass  Karma Reset         │  │
│  │  /tools/ /tools/ /kiaan/    /tools/      /tools/              │  │
│  │  viyog   ardha   chat       rel-compass  karma-reset          │  │
│  │                                                               │  │
│  │  Each page receives voice transcript via props/context        │  │
│  │  Each page can invoke KarmaResetService for "reset" actions   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              KarmaResetService (NEW)                          │  │
│  │                                                               │  │
│  │  captureContext() → generateGuidance() → propagateResult()   │  │
│  │                                                               │  │
│  │  Inputs: user query, emotional state, history                │  │
│  │  Output: KarmaResetResult with self-reinforcing guidance     │  │
│  │  Invocable from any module via service import                │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                              │
│                                                                     │
│  /api/karma-reset    → karma_reset_service.py (exists)             │
│  /api/kiaan/chat     → kiaan_core.py (exists)                      │
│  /api/ardha          → ardha_reframing_engine.py (exists)          │
│  /api/rel-compass    → relationship_compass_engine.py (exists)     │
│  /api/voice/tts      → tts_service.py (exists)                     │
│                                                                     │
│  NEW: /api/kiaan/route  → intent classification + routing          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### UserIntent (new type)
```typescript
// types/voice-controller.types.ts

export type IntentAction =
  | 'navigate'      // Go to a page/tool
  | 'query'         // Ask KIAAN a question
  | 'karma_reset'   // Invoke karma reset with context
  | 'fetch_data'    // Retrieve information
  | 'control'       // Start/stop/pause an action

export interface UserIntent {
  action: IntentAction
  targetTool: string | null        // e.g. 'ardha', 'relationship-compass'
  query: string                     // original user text
  extractedContext: {
    emotion: string | null
    topic: string | null
    entities: string[]              // names, specific references
  }
  confidence: number               // 0-1
}

export interface VoiceControllerResult {
  intent: UserIntent
  route: string | null              // resolved route path
  response: string | null           // text response if applicable
  karmaResetResult: KarmaResetResult | null
  suggestedFollowUp: string | null
}
```

### KarmaResetResult (new type, extends existing)
```typescript
// types/karma-reset.types.ts (addition)

export interface KarmaResetContext {
  sourceModule: string              // which tool invoked the reset
  userQuery: string                 // what the user said/typed
  emotionalState: string | null     // detected emotion
  conversationHistory: string[]     // recent messages for context
  timestamp: number
}

export interface KarmaResetResult {
  context: KarmaResetContext
  guidance: KiaanResetResponse      // existing type - 4-part response
  karmic_path: KarmicPathKey        // selected path
  selfReinforcingMessage: string    // echoes the user's own context back
  gitaVerse: GitaVerse              // relevant verse
  nextAction: {
    label: string
    route: string
  } | null
}
```

---

## API Contracts

### 1. Voice Controller API (Frontend Service)

```typescript
// lib/voice-controller.ts

interface VoiceControllerAPI {
  /** Classify user intent from natural language */
  classifyIntent(transcript: string, emotion?: string): UserIntent

  /** Resolve intent to a route + context */
  resolveRoute(intent: UserIntent): { route: string; params: Record<string, string> }

  /** Execute the intent (navigate, fetch, reset) */
  executeIntent(intent: UserIntent): Promise<VoiceControllerResult>
}
```

### 2. Karma Reset Service API (Frontend Service)

```typescript
// services/karma-reset-client.ts

interface KarmaResetClientAPI {
  /** Capture context from the current module */
  captureContext(
    sourceModule: string,
    userQuery: string,
    emotionalState?: string,
    history?: string[]
  ): KarmaResetContext

  /** Generate guidance with self-reinforcing response */
  generateGuidance(context: KarmaResetContext): Promise<KarmaResetResult>

  /** Get available karmic paths */
  getKarmicPaths(): KarmicPathConfig[]
}
```

### 3. Backend Route API (NEW endpoint)

```
POST /api/kiaan/route
Body: { query: string, emotion?: string, current_page?: string }
Response: {
  intent: UserIntent,
  suggested_route: string | null,
  response_text: string | null,
  karma_reset_available: boolean
}
```

---

## Component Blueprint

### 1. UniversalVoiceInput Component

```
┌──────────────────────────────────────────────────┐
│  UniversalVoiceInput                             │
│                                                  │
│  Props:                                          │
│    - onTranscript: (text: string) => void        │
│    - onIntentDetected: (intent: UserIntent)      │
│    - language: string                            │
│    - module: string (for context)                │
│    - showTranscription: boolean                  │
│    - fallbackToText: boolean (default: true)     │
│                                                  │
│  Renders:                                        │
│    [Mic Button] [Text Input Fallback]            │
│    [Live Transcription Bar]                      │
│    [Permission Consent Dialog]                   │
│                                                  │
│  Accessibility:                                  │
│    - role="search" on container                  │
│    - aria-label on mic button (dynamic)          │
│    - aria-live="polite" on transcription         │
│    - Keyboard: Enter to toggle mic, Tab to text  │
│    - Focus management on permission dialog       │
│    - Sufficient color contrast (4.5:1 minimum)   │
│                                                  │
│  Wraps: useVoiceInput (existing hook)            │
│  New: text fallback input + intent detection     │
└──────────────────────────────────────────────────┘
```

### 2. KiaanVoiceNav (Navigation FAB)

```
┌──────────────────────────────────────────────────┐
│  KiaanVoiceNav (Floating Action Button)          │
│                                                  │
│  - Persistent across pages (in layout)           │
│  - Tap to speak a command                        │
│  - "Take me to Ardha" → navigates               │
│  - "I feel guilty" → suggests Karma Reset        │
│  - "What is BG 2.47?" → fetches verse            │
│  - Shows mini response bubble                    │
│  - Collapses to small orb when idle              │
│                                                  │
│  Uses: KiaanVoiceController + ecosystemNavigator │
└──────────────────────────────────────────────────┘
```

---

## MVP Scope & Prioritization

### MVP (Weeks 1-2): Core Voice + Navigation

**Week 1: UniversalVoiceInput + Voice Controller**

| Day | Task | Files |
|-----|------|-------|
| 1-2 | Create `UniversalVoiceInput` component wrapping existing `VoiceInputButton` with text fallback, consent rationale, and accessibility | `components/voice/UniversalVoiceInput.tsx` |
| 2-3 | Create `VoiceControllerService` with intent classification using existing `detectToolSuggestion()` + new NL patterns | `lib/voice-controller.ts`, `types/voice-controller.types.ts` |
| 3-4 | Integrate `UniversalVoiceInput` into ViYoga, Ardha, KIAAN Chat, Relationship Compass pages | `app/tools/*/page.tsx` modifications |
| 4-5 | Unit tests for voice controller intent classification + component tests for UniversalVoiceInput | `tests/unit/voice-controller.test.ts`, `tests/frontend/UniversalVoiceInput.test.tsx` |

**Week 2: KIAAN Voice Companion + Karma Reset Service**

| Day | Task | Files |
|-----|------|-------|
| 1-2 | Create `KiaanVoiceNav` FAB component with route resolution | `components/voice/KiaanVoiceNav.tsx` |
| 2-3 | Create `KarmaResetClientService` with context capture + self-reinforcing response generation | `services/karma-reset-client.ts`, `types/karma-reset.types.ts` additions |
| 3-4 | Add `/api/kiaan/route` backend endpoint for server-side intent classification | `backend/routes/kiaan_route.py` |
| 4-5 | Integration tests: voice → intent → navigation flow, karma reset with context propagation | `tests/integration/voice-navigation.test.ts`, `tests/integration/karma-reset-context.test.ts` |

### Post-MVP (Weeks 3-4): Polish + Advanced

**Week 3: Cross-Module Data Flow + History**

| Task | Details |
|------|---------|
| Context persistence | Store user intent history in Zustand store for cross-module context |
| Karma Reset history | Tie reset guidance to user state/history for personalized responses |
| Voice command grammar | Expand NL patterns for "show me my progress", "read verse 2.47" |
| E2E tests | Playwright tests for full voice → navigate → action flows |

**Week 4: Optimization + Accessibility Audit**

| Task | Details |
|------|---------|
| Performance | Lazy-load voice components, measure bundle impact |
| Accessibility audit | Screen reader testing, keyboard-only flow verification |
| Mobile optimization | Touch targets, responsive voice UI, PWA voice support |
| Error resilience | Offline fallback for voice (cached responses), network retry |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Mic button functional | 100% on Chrome, Edge, Safari | Manual + E2E test |
| Voice → Navigation accuracy | >85% for top 10 commands | Integration test suite |
| Intent classification accuracy | >80% for mapped tools | Unit test with 50+ sample queries |
| Karma Reset context fidelity | Response reflects user's original query | Integration test assertion |
| Accessibility (WCAG 2.1 AA) | Pass axe-core audit | Automated + manual audit |
| Component render time | <16ms (60fps) | Vitest performance benchmark |
| Text fallback availability | 100% when mic unavailable | Feature detection test |
| Cross-module voice support | 5 modules with UniversalVoiceInput | Integration verification |

---

## Testing Plan

### Unit Tests
- `VoiceControllerService.classifyIntent()` — 50+ sample queries mapped to expected intents
- `KarmaResetClientService.captureContext()` — context assembly from various modules
- `KarmaResetClientService.generateGuidance()` — self-reinforcing response contains user context
- `UniversalVoiceInput` — renders mic button, shows text fallback, handles permission states

### Integration Tests
- Voice transcript → intent classification → route resolution → navigation
- Karma Reset invoked from Ardha → context propagated → guidance reflects Ardha context
- Karma Reset invoked from Relationship Compass → different context → different guidance
- `ecosystemNavigator.detectToolSuggestion()` → `VoiceController.resolveRoute()` pipeline

### E2E Tests (Playwright)
- User clicks mic → grants permission → speaks → sees transcription → navigates to correct page
- User types in text fallback → same intent classification → same navigation
- Mic permission denied → text fallback shown → user types → works correctly
- KiaanVoiceNav FAB → speak "karma reset" → Karma Reset page opens with context

### Accessibility Tests
- Keyboard-only: Tab to mic button → Enter to start → Enter to stop → Tab to text fallback
- Screen reader: announces "Start voice input", "Listening...", "Stopped recording"
- Focus trap in permission consent dialog
- Contrast ratio verification on all voice UI elements

---

## Security & Privacy

1. **Voice data**: Processed locally via Web Speech API — audio never sent to MindVibe servers
2. **Transcripts**: Only final text transmitted to backend, never raw audio
3. **Emotional state**: Classified client-side, stored only with explicit consent
4. **Karma Reset context**: User query content encrypted at rest in backend (existing encryption)
5. **Permission model**: Explicit consent cue before first mic activation; rationale shown
6. **No PII in logs**: Voice transcripts excluded from analytics/logging
7. **Session isolation**: Voice context scoped to session, cleared on logout

---

## Error Handling & Fallback Strategy

| Failure | Fallback |
|---------|----------|
| Mic not supported (Firefox private) | Text input shown automatically |
| Mic permission denied | Permission guidance popup + text fallback |
| No speech detected | "I didn't catch that" + retry prompt |
| Network error during TTS | Text-only response, retry button |
| Intent classification low confidence | "I'm not sure what you mean" + show tool menu |
| Backend `/api/kiaan/route` down | Client-side `detectToolSuggestion()` only |
| Karma Reset API failure | Cached verse + generic guidance |

---

## Files to Create (MVP)

```
NEW FILES:
  types/voice-controller.types.ts          — UserIntent, VoiceControllerResult
  lib/voice-controller.ts                  — VoiceControllerService
  components/voice/UniversalVoiceInput.tsx  — Universal mic + text input
  components/voice/KiaanVoiceNav.tsx        — Navigation FAB
  services/karma-reset-client.ts           — Client-side karma reset service
  backend/routes/kiaan_route.py            — /api/kiaan/route endpoint
  tests/unit/voice-controller.test.ts      — Intent classification tests
  tests/frontend/UniversalVoiceInput.test.tsx — Component tests

MODIFIED FILES:
  types/karma-reset.types.ts               — Add KarmaResetContext, KarmaResetResult
  app/layout.tsx                           — Add KiaanVoiceNav FAB
  app/tools/ardha/page.tsx                 — Integrate UniversalVoiceInput
  app/tools/relationship-compass/page.tsx  — Integrate UniversalVoiceInput (redirect → actual page)
  app/tools/viyog/page.tsx                 — Integrate UniversalVoiceInput
  app/kiaan/chat/page.tsx                  — Integrate UniversalVoiceInput
```
