# Wisdom Journeys - AI-Powered Spiritual Transformation

## Overview

Wisdom Journeys is MindVibe's AI-powered feature for personalized spiritual growth paths based on the Bhagavad Gita's wisdom. Users embark on multi-day journeys to overcome the six inner enemies (Ṣaḍ-Ripu):

- **Kama** (काम) - Desire/Lust
- **Krodha** (क्रोध) - Anger
- **Lobha** (लोभ) - Greed
- **Moha** (मोह) - Delusion/Attachment
- **Mada** (मद) - Ego/Pride
- **Matsarya** (मात्सर्य) - Envy/Jealousy

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ /journeys    │  │ /journeys/   │  │ /journeys/[id]         │ │
│  │ (Catalog)    │  │ today        │  │ (Journey Detail)       │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬───────────┘ │
└─────────┼─────────────────┼───────────────────────┼─────────────┘
          │                 │                       │
          ▼                 ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 /api/journeys/* Routes                       ││
│  │  - GET  /catalog        - POST /start                        ││
│  │  - GET  /active         - GET  /today                        ││
│  │  - POST /{id}/today     - POST /{id}/steps/{day}/complete    ││
│  └──────────────────────────┬──────────────────────────────────┘│
│                              │                                   │
│  ┌──────────────────────────┴───────────────────────────────┐  │
│  │            Enhanced Journey Engine                        │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │  │
│  │  │ Scheduler    │ │ VersePicker  │ │ StepGenerator    │  │  │
│  │  └──────────────┘ └──────────────┘ └────────┬─────────┘  │  │
│  └─────────────────────────────────────────────┼────────────┘  │
│                                                │                │
│  ┌─────────────────────────────────────────────┼────────────┐  │
│  │              KIAAN Journey Coach            │            │  │
│  │  ┌──────────────────────────────────────────┴───────┐    │  │
│  │  │  - Strict JSON schema validation                  │    │  │
│  │  │  - Safety detection for crisis content            │    │  │
│  │  │  - Retry with fallback on invalid JSON            │    │  │
│  │  └───────────────────────────────────────────────────┘    │  │
│  └────────────────────────────┬─────────────────────────────┘  │
│                               │                                 │
│  ┌────────────────────────────┴─────────────────────────────┐  │
│  │          Multi-Provider LLM Layer                         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │  │
│  │  │ OpenAI     │  │ Sarvam AI  │  │ OpenAI-Compatible  │  │  │
│  │  │ (GPT-4o-   │  │ (sarvam-m) │  │ (Custom Base URL)  │  │  │
│  │  │  mini)     │  │            │  │                    │  │  │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Gita Corpus Adapter                          │  │
│  │  - get_verse_text(chapter, verse) -> VerseText            │  │
│  │  - search_by_tags(tags, limit, exclude) -> [VerseResult]  │  │
│  │  - get_verses_for_enemy(enemy) -> [VerseResult]           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PostgreSQL                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │ journey_       │  │ user_journeys  │  │ user_journey_   │   │
│  │ templates      │  │                │  │ step_state      │   │
│  └────────────────┘  └────────────────┘  └─────────────────┘   │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐   │
│  │ journey_       │  │ gita_verses    │  │ wisdom_verses   │   │
│  │ template_steps │  │                │  │                 │   │
│  └────────────────┘  └────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model

### Journey Templates

Admin-defined journey blueprints for each inner enemy:

```sql
journey_templates (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(128) UNIQUE,           -- e.g., "transform-anger-krodha"
    title VARCHAR(255),                  -- e.g., "Transform Anger (Krodha)"
    description TEXT,
    primary_enemy_tags JSONB,            -- ["krodha"]
    duration_days INTEGER DEFAULT 14,
    difficulty INTEGER DEFAULT 3,        -- 1-5 scale
    is_active BOOLEAN,
    is_featured BOOLEAN
)
```

### Journey Template Steps

Day-by-day skeleton with verse selectors and teaching hints:

```sql
journey_template_steps (
    id VARCHAR(64) PRIMARY KEY,
    journey_template_id FK,
    day_index INTEGER,
    step_title VARCHAR(255),
    teaching_hint TEXT,                  -- Guides AI generation
    reflection_prompt TEXT,
    practice_prompt TEXT,
    verse_selector JSONB,                -- {"tags": ["krodha"], "max_verses": 3}
    static_verse_refs JSONB,             -- [{"chapter": 2, "verse": 63}]
    safety_notes TEXT
)
```

### User Journeys

User instances with personalization:

```sql
user_journeys (
    id VARCHAR(64) PRIMARY KEY,
    user_id FK,
    journey_template_id FK,
    status ENUM('active', 'paused', 'completed', 'abandoned'),
    current_day_index INTEGER,
    personalization JSONB,               -- pace, tone, provider preference
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
)
```

### User Journey Step State

AI-generated content and user progress:

```sql
user_journey_step_state (
    id VARCHAR(64) PRIMARY KEY,
    user_journey_id FK,
    day_index INTEGER,
    verse_refs JSONB,                    -- [{"chapter": 2, "verse": 47}]
    kiaan_step_json JSONB,               -- Full KIAAN-generated step
    check_in JSONB,                      -- {"intensity": 7, "label": "..."}
    reflection_encrypted JSONB,
    provider_used VARCHAR(64),
    model_used VARCHAR(128),
    completed_at TIMESTAMPTZ
)
```

## Gita Core Wisdom Access

Verse data is stored in:

1. **Frontend**: `/data/gitaVerses.ts` - 700+ verses with themes, keywords
2. **Backend**: `gita_verses` and `wisdom_verses` tables

The `GitaCorpusAdapter` provides unified access:

```python
from backend.services.gita_corpus_adapter import gita_corpus

# Get verse text by reference
verse = await gita_corpus.get_verse_text(db, chapter=2, verse=47)
# Returns: {sanskrit, transliteration, translation, hindi, themes, keywords}

# Search by tags (expands enemy tags to related themes)
verses = await gita_corpus.search_by_tags(db, ["krodha"], limit=3)

# Get verses for specific enemy
verses = await gita_corpus.get_verses_for_enemy(db, "krodha", limit=3)
```

**Important**: LLM output contains only verse *references* (chapter/verse), never full text. Verse text is resolved at display time.

## Multi-Provider LLM Configuration

### Environment Variables

```bash
# Primary provider selection
AI_PROVIDER=auto                    # auto|openai|sarvam|oai_compat
AI_PROVIDER_FALLBACKS=openai,sarvam,oai_compat

# OpenAI
OPENAI_API_KEY=sk-...
AI_MODEL_OPENAI=gpt-4o-mini

# Sarvam AI
SARVAM_API_KEY=...
AI_MODEL_SARVAM=sarvam-m
SARVAM_BASE_URL=https://api.sarvam.ai/v1

# OpenAI-Compatible (self-hosted or other providers)
OAI_COMPAT_BASE_URL=https://your-api.com/v1
OAI_COMPAT_API_KEY=...
OAI_COMPAT_MODEL=your-model
```

### Fallback Behavior

1. **Auto mode**: Picks first configured + healthy provider
2. **On retryable failure**: Automatically falls back to next provider
3. **Provider tracking**: Each step stores `provider_used` and `model_used`

```python
from backend.services.ai.providers import get_provider_manager

manager = get_provider_manager()

# Chat with automatic fallback
response, tracking = await manager.chat_with_tracking(
    messages=[{"role": "user", "content": "..."}],
    temperature=0.7,
    max_tokens=1000,
    response_format={"type": "json_object"},
    preference="auto",
)

print(tracking["provider_used"])  # e.g., "openai"
print(tracking["model_used"])     # e.g., "gpt-4o-mini"
```

## KIAAN Step JSON Schema

KIAAN generates strict JSON matching this schema:

```json
{
  "step_title": "Day 1: Understanding Anger",
  "today_focus": "krodha",
  "verse_refs": [{"chapter": 2, "verse": 63}],
  "teaching": "200-400 word teaching weaving the verse wisdom...",
  "guided_reflection": [
    "When did anger last arise in you?",
    "What was the trigger beneath the trigger?",
    "What would peace feel like in that moment?"
  ],
  "practice": {
    "name": "The Pause Practice",
    "instructions": [
      "When you feel anger arising, pause",
      "Take 3 deep breaths",
      "Ask: What am I really feeling?"
    ],
    "duration_minutes": 5
  },
  "micro_commitment": "Today I will pause before reacting to frustration.",
  "check_in_prompt": {
    "scale": "0-10",
    "label": "How intense is your anger feeling today?"
  },
  "safety_note": "Optional note for sensitive content"
}
```

### Schema Validation

- Pydantic models validate all fields
- `verse_refs` must be subset of provided references
- `today_focus` must be valid enemy tag
- 2 retries on invalid JSON, then fallback provider

## Safety & Privacy

### Crisis Detection

User reflections are checked for self-harm indicators:

1. **Keyword check**: Quick scan for crisis terms
2. **LLM confirmation**: Reduces false positives
3. **Safety response**: Returns crisis resources instead of normal step

```python
if safety_result:
    return {
        "is_safety_response": True,
        "safety_message": "...",
        "crisis_resources": [
            "iCall (India): 9152987821",
            "AASRA: 91-22-27546669",
        ],
        "gentle_guidance": "..."
    }
```

### Reflection Storage

User reflections are stored using the existing journaling encryption system:
- Client-side AES-256-GCM encryption
- PBKDF2 key derivation (250k iterations)
- Zero-knowledge: server never sees plaintext

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/journeys/catalog` | List journey templates |
| POST | `/api/journeys/start` | Start 1-5 journeys |
| GET | `/api/journeys/active` | Get active journeys |
| GET | `/api/journeys/today` | Today's agenda (all journeys) |
| POST | `/api/journeys/{id}/today` | Get/generate today's step |
| POST | `/api/journeys/{id}/steps/{day}/complete` | Complete with check-in |
| POST | `/api/journeys/{id}/pause` | Pause journey |
| POST | `/api/journeys/{id}/resume` | Resume journey |
| POST | `/api/journeys/{id}/abandon` | Abandon journey |
| GET | `/api/journeys/{id}/history` | Journey step history |
| GET | `/api/admin/ai/providers/status` | Provider health (admin) |

## Running Migrations & Seeds

### Apply Migrations

```bash
# Migrations run automatically on startup if RUN_MIGRATIONS_ON_STARTUP=true
# Or manually:
python -c "import asyncio; from backend.core.migrations import apply_sql_migrations; asyncio.run(apply_sql_migrations())"
```

### Seed Journey Templates

```bash
python scripts/seed_journey_templates.py
```

## Running Tests

```bash
# Unit tests
pytest tests/unit/test_journeys_enhanced.py -v

# Integration tests
pytest tests/integration/test_journeys_enhanced_api.py -v

# All tests
pytest tests/ -v --ignore=tests/load
```

## Frontend Pages

| Path | Description |
|------|-------------|
| `/journeys` | Journey catalog with multi-select |
| `/journeys/today` | Today's agenda across all journeys |
| `/journeys/[id]` | Individual journey progress |

## Key Features

1. **Multi-journey support**: Users can have multiple active journeys
2. **Today's unified agenda**: Single view of all pending steps
3. **Idempotent generation**: Same day returns cached step
4. **Verse exclusion**: Avoids repeating recent verses
5. **Provider agnostic**: Works with OpenAI, Sarvam, or custom LLMs
6. **Safety-first**: Crisis detection with gentle intervention
7. **Privacy-preserving**: Encrypted reflections, verse refs only in LLM
