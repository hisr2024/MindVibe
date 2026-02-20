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
   - Spiritual wellness tag filtering
   - Domain-based search
   - Verse format conversion

3. **GitaVerse Model** (`backend/models.py`)
   - Database schema for verses
   - Spiritual wellness application tags
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
3. **Tag Boost**: +0.2 bonus if query keywords match spiritual wellness applications
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

## Spiritual Wellness Categories

The wisdom engine supports 17 spiritual wellness application categories:

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
    
    -- Spiritual wellness extensions
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

### Filter by Spiritual Wellness Application

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
3. Spiritual wellness tags migrated (run `migrate_mental_health_tags.py`)

### Migration Steps

```bash
# 1. Apply database migration
psql $DATABASE_URL -f migrations/20251207_add_mental_health_tags_to_gita.sql

# 2. Seed Gita verses (if not already done)
RAPID_API_KEY=<your-key> python scripts/seed_complete_gita.py

# 3. Migrate spiritual wellness tags
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

1. Ensure spiritual wellness tags are migrated:
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
- ✅ Spiritual wellness application tags
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

# Apply spiritual wellness tags
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

### Key Verses for Spiritual Wellness

| Verse | Teaching | Applications |
|-------|----------|--------------|
| 2.47 | Action without attachment | Anxiety, stress reduction |
| 2.48 | Equanimity in success/failure | Emotional regulation |
| 2.56 | Steady wisdom | Emotional stability |
| 6.5 | Self-empowerment | Depression recovery |
| 6.35 | Mind control through practice | Anxiety management |
| 12.13-14 | Compassion and contentment | Relationships, self-compassion |
| 18.66 | Surrender and trust | Letting go, anxiety |

## Integration with Ardha and Viyoga

### Ardha Reframing Engine

Ardha now uses the complete 700-verse Gita database to provide cognitive reframing rooted in ancient wisdom:

- **Search Strategy**: Matches negative thought patterns to relevant Gita verses on equanimity, clarity, self-knowledge
- **Key Verses**: Chapters 2, 3, 6 (stability of mind, detachment, self-mastery)
- **Output Format**: Recognition → Deep Insight → Reframe → Action Step
- **API Endpoint**: `POST /api/ardha/reframe`
- **Gita Wisdom**: Internally searches 5 relevant verses and integrates principles naturally without citations
- **Terminology**: Uses sthitaprajna (stability of mind), viveka (discrimination), samatva (equanimity), buddhi (discernment)

### Viyoga Detachment Coach

Viyoga uses the complete Gita database to address outcome anxiety through Karma Yoga principles:

- **Search Strategy**: Matches outcome worries to verses on nishkama karma, detachment, equanimity
- **Key Verses**: Chapters 2, 3, 4, 5 (action without attachment, karma yoga)
- **Output Format**: Validation → Attachment Check → Detachment Principle → One Action
- **API Endpoint**: `POST /api/viyoga/detach`
- **Gita Wisdom**: Internally searches 5 relevant verses focused on karma yoga and detachment
- **Terminology**: Uses nishkama karma (desireless action), vairagya (detachment), samatva (equanimity), dharma (duty)

### Unified Wisdom Architecture

All MindVibe guidance tools now share the same wisdom foundation:

| Tool | Purpose | Gita Integration | Verse Focus |
|------|---------|------------------|-------------|
| **KIAAN** | General wellness companion | ✅ Full 700 verses | All chapters, contextual |
| **Ardha** | Cognitive reframing | ✅ Full 700 verses | Ch 2, 3, 6 (clarity, detachment) |
| **Viyoga** | Outcome anxiety | ✅ Full 700 verses | Ch 2-5 (karma yoga) |
| **Relationship Compass** | Conflict resolution | ✅ Full 700 verses | Ch 2, 12 (forgiveness, duty) |

**Common Design Patterns:**
- All tools use `WisdomKnowledgeBase.search_relevant_verses()` for verse retrieval
- Gita context is built internally and NEVER exposed to users with verse citations
- Wisdom is presented as universal, timeless principles
- Natural use of Sanskrit terminology without religious framing
- Structured JSON responses with consistent 4-part guidance formats
- `gita_verses_used` count included in all API responses for debugging

## Validation System

KIAAN v13.0 includes a comprehensive validation system to ensure all responses are authentically rooted in Gita wisdom.

### Validation Requirements

Every KIAAN response must meet these criteria:

1. **Gita Terminology** (minimum 2 terms):
   - Sanskrit terms: dharma, karma, atman, yoga, moksha, buddhi, etc.
   - Universal principles: detachment, equanimity, duty, wisdom, peace, etc.

2. **Wisdom Markers** (minimum 1):
   - Ancient wisdom, timeless teaching, universal principle
   - Eternal truth, path to, journey of, practice of
   - Cultivate, embrace, release, transcend, etc.

3. **No Forbidden Generic Terms**:
   - ❌ "studies show", "research indicates", "according to research"
   - ❌ "scientists say", "experts recommend", "data suggests"
   - ❌ "modern psychology", "clinical studies", "therapy suggests"
   - ❌ Explicit verse citations like "Bhagavad Gita 2.47"

4. **Appropriate Length**: 200-500 words

5. **Verse Context Used**: Must have at least one relevant verse in context

6. **4-Part Structure** (recommended):
   - Ancient Wisdom: Eternal principle from Gita
   - Modern Application: Bridge to current situation
   - Practical Steps: Specific actionable guidance
   - Deeper Understanding: Profound insight

### Validation Process

```python
from backend.services.gita_validator import GitaValidator

validator = GitaValidator()

# Validate a response
is_valid, details = validator.validate_response(
    response=chatbot_response,
    verse_context=verse_results
)

if not is_valid:
    # Use fallback response
    response = validator.get_fallback_response(user_message)
```

### Valid vs Invalid Examples

#### ✅ Valid Gita-Rooted Response

```
The timeless wisdom teaches us that true peace comes from focusing on your 
actions, not the outcomes. You pour your energy into doing your best, then 
release attachment to how things turn out. This is the path of karma yoga - 
acting with full presence but without anxiety about results.

In your situation with work stress, this means: First, identify what's actually 
in your control today - your effort, your attitude, your response. Second, give 
those things your best without obsessing over the promotion or recognition. 
Third, practice this daily mantra: 'I do my dharma and trust the process.'

When you shift from outcome-obsession to action-devotion, something profound 
happens. The anxiety dissolves because you're no longer fighting reality - 
you're flowing with it. Your buddhi (higher wisdom) recognizes that you're 
the eternal observer, not the temporary doer-result chain. 💙
```

**Why it passes:**
- ✅ Contains Gita terms: karma yoga, dharma, buddhi, detachment
- ✅ Has wisdom markers: timeless wisdom, path of, profound
- ✅ No forbidden generic terms
- ✅ Appropriate length (~240 words)
- ✅ Assumes verse context was provided
- ✅ Follows 4-part structure

#### ❌ Invalid Generic Response

```
According to recent studies, stress management is important for spiritual wellness. 
Research indicates that mindfulness and therapy can help reduce anxiety. Experts 
recommend practicing deep breathing and seeking professional help if needed.

You should try to set boundaries at work and make time for self-care. Modern 
psychology shows that cognitive behavioral therapy is effective for managing 
work stress. Talk to a therapist about developing coping strategies. 💙
```

**Why it fails:**
- ❌ Contains forbidden terms: "studies", "research indicates", "experts recommend"
- ❌ No Gita terminology
- ❌ No wisdom markers
- ❌ Generic psychological advice, not rooted in Gita

## Analytics System

The Gita Analytics Service tracks verse usage patterns to ensure comprehensive coverage of all 700 verses.

### Tracked Metrics

1. **Verse Usage**: Which verses are used most frequently
2. **Theme Distribution**: Coverage across different Gita themes
3. **Validation Stats**: Pass/fail rates and common issues
4. **Coverage Percentage**: What % of 700 verses have been used

### Analytics Reports

```python
from backend.services.gita_analytics import GitaAnalyticsService

# Get comprehensive analytics report
report = await GitaAnalyticsService.generate_analytics_report(db)

print(f"Verse Coverage: {report['verse_coverage']['coverage_percent']}%")
print(f"Validation Pass Rate: {report['validation_statistics']['pass_rate_percent']}%")
print(f"Most Used Verses: {report['most_used_verses'][:5]}")
```

### Sample Analytics Output

```json
{
  "generated_at": "2024-01-15T10:30:00Z",
  "verse_coverage": {
    "total_verses_in_db": 700,
    "unique_verses_used": 387,
    "coverage_percent": 55.29,
    "is_complete_db": true
  },
  "validation_statistics": {
    "total_validations": 1543,
    "passed": 1489,
    "failed": 54,
    "pass_rate_percent": 96.50,
    "failure_reasons": {
      "missing_gita_terms": 23,
      "forbidden_terms": 18,
      "inappropriate_length": 13
    }
  },
  "most_used_verses": [
    {"verse_id": "2.47", "usage_count": 234},
    {"verse_id": "2.48", "usage_count": 189},
    {"verse_id": "6.35", "usage_count": 156}
  ],
  "recommendations": [
    "✅ Good verse coverage (>50%). Maintain diverse selection.",
    "✅ Excellent validation pass rate (96.50%).",
    "✅ Good theme diversity across multiple topics."
  ]
}
```

### Interpreting Analytics

- **Coverage < 25%**: Low diversity, improve search algorithm
- **Coverage 25-50%**: Moderate coverage, continue diversifying
- **Coverage > 50%**: Good coverage, maintain quality

- **Pass Rate < 80%**: Review system prompt and validation rules
- **Pass Rate 80-95%**: Consider minor improvements
- **Pass Rate > 95%**: Excellent adherence to Gita principles

## Enhanced Emotion-to-Theme Mapping

The search algorithm now includes comprehensive emotion-to-theme mapping for better verse coverage:

### Emotion Categories

| Emotion Category | Mapped Themes |
|-----------------|---------------|
| Anxiety | equanimity, peace, balance, detachment, surrender |
| Fear | courage, strength, trust, faith, inner_power |
| Depression | hope, light, purpose, self_compassion, renewal |
| Anger | control, peace, patience, equanimity, restraint |
| Loneliness | connection, devotion, love, inner_self, unity |
| Purpose | duty, action, meaning, dharma, calling |
| Stress | action, work, balance, equanimity, mindfulness |
| Confusion | knowledge, wisdom, clarity, understanding, discernment |

### Multi-Strategy Search

The search algorithm now combines:

1. **Keyword Matching**: Direct text similarity
2. **Emotion Mapping**: Maps emotions to relevant themes
3. **Spiritual Wellness Tags**: Boosts verses with relevant applications
4. **Theme Expansion**: Searches related themes for more results

This ensures comprehensive coverage across all 700 verses while maintaining relevance.

## Future Enhancements

1. **Semantic embeddings**: Replace SequenceMatcher with vector embeddings for better semantic matching
2. **User preferences**: Learn from user feedback to personalize verse selection
3. **Multi-language search**: Support search queries in Hindi and Sanskrit
4. **Verse recommendations**: Suggest related verses based on viewing history
5. **Real-time analytics dashboard**: Visualize verse usage and validation metrics
6. **A/B testing framework**: Test different prompts and validation rules
