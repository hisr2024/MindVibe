# KIAAN Wisdom Engine Documentation

## Overview

KIAAN (Krishna-Inspired AI Assistant for Nurturing) is MindVibe's AI-powered wellness companion that provides contextual emotional support using wisdom from the Bhagavad Gita. This document describes the wisdom engine architecture that enables KIAAN to access and search 700+ verses for personalized guidance.

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    KIAAN Wisdom Engine                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ WisdomKB        │───▶│ GitaService     │                    │
│  │ (Search Layer)  │    │ (Data Layer)    │                    │
│  └────────┬────────┘    └────────┬────────┘                    │
│           │                      │                              │
│           ▼                      ▼                              │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ Text Sanitizer  │    │ gita_verses     │                    │
│  │ (Religious→     │    │ (700+ verses)   │                    │
│  │  Universal)     │    └─────────────────┘                    │
│  └─────────────────┘                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Components

1. **WisdomKnowledgeBase** (`backend/services/wisdom_kb.py`)
   - Primary search interface for wisdom verses
   - Text sanitization for religious terms
   - Tag-boosted relevance scoring
   - In-memory caching for performance

2. **GitaService** (`backend/services/gita_service.py`)
   - Database access layer for Gita verses
   - Mental health tag filtering
   - Domain-based search
   - Verse format conversion

3. **GitaVerse Model** (`backend/models.py`)
   - Database schema for verses
   - Mental health application tags
   - Primary/secondary domain categorization

## Search Pipeline

### Query Processing Flow

```
User Query → Preprocessing → Semantic Search → Tag Boost → Ranking → Results
     │              │              │              │           │          │
     │              │              │              │           │          │
     ▼              ▼              ▼              ▼           ▼          ▼
"anxiety    →  Keywords   →  Text        →  +0.2 if  →  Sort by  →  Top 5
 at work"      extraction    similarity     matching    score      verses
                             on english     mental
                             + context      health tag
```

### Similarity Scoring

1. **Base Score**: SequenceMatcher similarity between query and verse text
2. **Context Score**: SequenceMatcher similarity between query and verse context
3. **Tag Boost**: +0.2 bonus if query keywords match mental health applications
4. **Final Score**: max(base_score, context_score) + tag_boost

### Example Search

```python
# Search for anxiety-related wisdom
results = await wisdom_kb.search_relevant_verses_full_db(
    db=session,
    query="I'm feeling anxious about work",
    limit=5
)

# Returns verses with:
# - High text similarity to "anxious about work"
# - Tag boost for verses with "anxiety_management" application
# - Sorted by descending score
```

## Mental Health Categories

The wisdom engine supports 17 mental health application categories:

| Category | Description |
|----------|-------------|
| `anxiety_management` | Verses addressing worry, fear, uncertainty |
| `stress_reduction` | Guidance for managing pressure and tension |
| `letting_go` | Wisdom on releasing attachment and expectations |
| `present_moment_focus` | Mindfulness and staying grounded |
| `emotional_regulation` | Managing emotional responses |
| `resilience` | Building strength through adversity |
| `mindfulness` | Awareness and conscious presence |
| `equanimity` | Maintaining balance in all circumstances |
| `anger_management` | Addressing frustration and rage |
| `addiction_recovery` | Breaking patterns of dependency |
| `impulse_control` | Managing reactive behaviors |
| `cognitive_awareness` | Understanding thought patterns |
| `self_empowerment` | Building self-efficacy and confidence |
| `depression_recovery` | Support for low mood and hopelessness |
| `self_compassion` | Cultivating kindness toward self |
| `personal_growth` | Development and self-improvement |
| `meditation_support` | Guidance for contemplative practice |

## Text Sanitization

All verses are sanitized to replace religious-specific terms with universal alternatives:

| Original | Replacement |
|----------|-------------|
| Krishna | the teacher |
| Arjuna | the student |
| Lord | the wise one |
| God | inner wisdom |
| Divine | Universal |
| Soul | Essence |

### Example

**Before sanitization:**
> "Lord Krishna told Arjuna that the soul is eternal"

**After sanitization:**
> "The wise one the teacher told the student that the essence is eternal"

## Database Schema

### gita_verses Table

```sql
CREATE TABLE gita_verses (
    id SERIAL PRIMARY KEY,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    sanskrit TEXT NOT NULL,
    transliteration TEXT,
    hindi TEXT NOT NULL,
    english TEXT NOT NULL,
    word_meanings JSON,
    principle VARCHAR(256) NOT NULL,
    theme VARCHAR(256) NOT NULL,
    
    -- Mental health extensions
    mental_health_applications JSON,  -- Array of MH categories
    primary_domain VARCHAR(64),       -- Primary emotional domain
    secondary_domains JSON,           -- Array of secondary domains
    
    embedding JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_gita_verses_primary_domain ON gita_verses(primary_domain);
CREATE INDEX idx_gita_verses_theme ON gita_verses(theme);
```

## Performance Optimization

### Caching Strategy

- Verse cache loaded on first access
- ~700 verses stored in memory (~10MB)
- Cache cleared manually or on restart
- Search operates entirely in-memory after cache warm

### Search Performance

| Operation | Expected Time |
|-----------|---------------|
| Cache warm (cold) | ~200-500ms |
| Search (warm cache) | ~30-50ms |
| Single verse fetch | ~5-10ms |

### Cache Warming

Run at application startup:

```bash
python scripts/warm_verse_cache.py
```

## API Examples

### Search Relevant Verses

```python
from backend.services.wisdom_kb import WisdomKnowledgeBase

kb = WisdomKnowledgeBase()

# Search full database
results = await kb.search_relevant_verses_full_db(
    db=session,
    query="feeling overwhelmed and stressed",
    limit=5
)

for result in results:
    verse = result["verse"]
    score = result["score"]
    print(f"{verse['verse_id']}: {verse['english'][:50]}... (score: {score:.3f})")
```

### Filter by Mental Health Application

```python
from backend.services.gita_service import GitaService

# Get verses for anxiety management
verses = await GitaService.search_by_mental_health_application(
    db=session,
    application="anxiety_management",
    limit=10
)
```

### Filter by Primary Domain

```python
# Get verses for the "mindfulness" domain
verses = await GitaService.search_by_primary_domain(
    db=session,
    domain="mindfulness",
    limit=10
)
```

## Deployment

### Prerequisites

1. PostgreSQL database with gita_verses table
2. 700+ verses seeded (run `seed_complete_gita.py`)
3. Mental health tags migrated (run `migrate_mental_health_tags.py`)

### Migration Steps

```bash
# 1. Apply database migration
psql $DATABASE_URL -f migrations/20251207_add_mental_health_tags_to_gita.sql

# 2. Seed Gita verses (if not already done)
RAPID_API_KEY=<your-key> python scripts/seed_complete_gita.py

# 3. Migrate mental health tags
python scripts/migrate_mental_health_tags.py

# 4. Verify verse count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM gita_verses;"
# Expected: 700+

# 5. Warm the cache
python scripts/warm_verse_cache.py

# 6. Run tests
pytest tests/unit/test_wisdom_kb_full_database.py -v
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `RAPID_API_KEY` | Bhagavad Gita API key (for seeding) | Optional |

## Troubleshooting

### "No verses found" errors

1. Check if gita_verses table is populated:
   ```sql
   SELECT COUNT(*) FROM gita_verses;
   ```

2. If empty, run the seeding script:
   ```bash
   python scripts/seed_complete_gita.py
   ```

### Search returns same verses repeatedly

1. Ensure mental health tags are migrated:
   ```sql
   SELECT COUNT(*) FROM gita_verses WHERE mental_health_applications IS NOT NULL;
   ```

2. If few/no tagged verses, run migration:
   ```bash
   python scripts/migrate_mental_health_tags.py
   ```

### Slow search performance

1. Clear and re-warm cache:
   ```python
   kb.clear_cache()
   await kb.get_all_verses(db)
   ```

2. Check database indexes:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'gita_verses';
   ```

## Integration with Emotional Reset

The Emotional Reset Service uses WisdomKnowledgeBase to provide contextual wisdom:

```python
# In EmotionalResetService.generate_wisdom_insights()
verse_results = await self.wisdom_kb.search_relevant_verses(
    db=db,
    query=search_query,  # Built from user emotions and themes
    limit=3,
)
```

The search automatically:
1. Searches the full 700+ verse database
2. Applies tag boosting for emotion-matched verses
3. Returns sanitized text ready for display

## Complete Bhagavad Gita Database

MindVibe KIAAN now has access to **all 700 verses** of the Bhagavad Gita across 18 chapters:

- ✅ 700 authentic verses (complete coverage)
- ✅ Sanskrit (Devanagari), Hindi, English translations
- ✅ Word-by-word meanings (where available)
- ✅ Mental health application tags
- ✅ Modern context mapping
- ✅ Psychological domain classification

### Chapter Distribution

| Chapter | Name | Verses | Primary Theme |
|---------|------|--------|---------------|
| 1 | Arjuna Vishada Yoga | 47 | Emotional crisis, moral conflict |
| 2 | Sankhya Yoga | 72 | Knowledge, equanimity, self-mastery |
| 3 | Karma Yoga | 43 | Selfless action |
| 4 | Jnana Karma Sanyasa Yoga | 42 | Knowledge and wisdom |
| 5 | Karma Sanyasa Yoga | 29 | Action and renunciation |
| 6 | Dhyana Yoga | 47 | Meditation and mindfulness |
| 7 | Jnana Vijnana Yoga | 30 | Self-knowledge |
| 8 | Aksara Brahma Yoga | 28 | Attaining the supreme |
| 9 | Raja Vidya Raja Guhya Yoga | 34 | Sovereign knowledge |
| 10 | Vibhuti Yoga | 42 | Divine manifestations |
| 11 | Visvarupa Darsana Yoga | 55 | Universal form |
| 12 | Bhakti Yoga | 20 | Devotion |
| 13 | Ksetra Ksetrajna Vibhaga Yoga | 34 | Matter and spirit |
| 14 | Gunatraya Vibhaga Yoga | 27 | Three modes of nature |
| 15 | Purusottama Yoga | 20 | The supreme person |
| 16 | Daivasura Sampad Vibhaga Yoga | 24 | Divine and demonic qualities |
| 17 | Sraddhatraya Vibhaga Yoga | 28 | Three types of faith |
| 18 | Moksha Sanyasa Yoga | 78 | Liberation through renunciation |

**Total: 700 verses**

### Seeding the Database

```bash
# Seed all 700 verses from local JSON (default)
python scripts/seed_complete_gita.py

# Use chapter-wise files instead
python scripts/seed_complete_gita.py --chapters

# Apply mental health tags
python scripts/migrate_mental_health_tags.py

# Verify completeness
python scripts/verify_700_verses.py --all

# Check database stats
python -c "
import asyncio
from backend.services.wisdom_kb import WisdomKnowledgeBase
# Note: Requires database session - see full example in scripts/
"
```

### Verse Coverage by Theme

- **Action without attachment** (Karma Yoga): 120+ verses
- **Knowledge & wisdom** (Jnana Yoga): 150+ verses
- **Meditation & mindfulness** (Dhyana Yoga): 80+ verses
- **Devotion** (Bhakti Yoga): 90+ verses
- **Equanimity & balance**: 100+ verses
- **Self-mastery**: 90+ verses
- **Purpose & duty**: 70+ verses

### Key Verses for Mental Health

| Verse | Teaching | Applications |
|-------|----------|--------------|
| 2.47 | Action without attachment | Anxiety, stress reduction |
| 2.48 | Equanimity in success/failure | Emotional regulation |
| 2.56 | Steady wisdom | Emotional stability |
| 6.5 | Self-empowerment | Depression recovery |
| 6.35 | Mind control through practice | Anxiety management |
| 12.13-14 | Compassion and contentment | Relationships, self-compassion |
| 18.66 | Surrender and trust | Letting go, anxiety |

## Future Enhancements

1. **Semantic embeddings**: Replace SequenceMatcher with vector embeddings for better semantic matching
2. **User preferences**: Learn from user feedback to personalize verse selection
3. **Multi-language search**: Support search queries in Hindi and Sanskrit
4. **Verse recommendations**: Suggest related verses based on viewing history
