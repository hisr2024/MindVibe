# Bhagavad Gita Wisdom Database Documentation

## Overview

This document provides comprehensive documentation for the Bhagavad Gita wisdom database implementation, including data models, source attribution, translation methodology, and usage instructions.

## Table of Contents

1. [Data Model](#data-model)
2. [Source Attribution](#source-attribution)
3. [Translation Methodology](#translation-methodology)
4. [Database Schema](#database-schema)
5. [Usage Guide](#usage-guide)
6. [Adding/Updating Verses](#adding-updating-verses)

---

## Data Model

### Entity Relationship Diagram

```
┌─────────────────┐
│  GitaChapter    │
│─────────────────│
│ id (PK)         │
│ chapter_number  │◄───┐
│ sanskrit_name   │    │
│ english_name    │    │
│ verse_count     │    │
│ themes (JSON)   │    │
│ mental_health...│    │
└─────────────────┘    │
                       │
┌─────────────────┐    │
│  GitaSource     │    │
│─────────────────│    │
│ id (PK)         │◄─┐ │
│ name            │  │ │
│ description     │  │ │
│ url             │  │ │
│ credibility...  │  │ │
└─────────────────┘  │ │
                     │ │
┌─────────────────┐  │ │
│  GitaVerse      │  │ │
│─────────────────│  │ │
│ id (PK)         │  │ │
│ chapter (FK)    │──┘ │
│ verse           │    │
│ sanskrit        │    │
│ transliteration │    │
│ hindi           │    │
│ english         │    │
│ word_meanings   │    │
│ principle       │    │
│ theme           │    │
│ source_id (FK)  │────┘
│ embedding       │
└─────────────────┘
        │
        │ 1:N
        │
┌─────────────────┐
│ GitaModern...   │
│─────────────────│
│ id (PK)         │
│ verse_id (FK)   │
│ application...  │
│ description     │
│ examples (JSON) │
│ mental_health...|
└─────────────────┘

┌─────────────────┐
│  GitaKeyword    │
│─────────────────│
│ id (PK)         │
│ keyword         │
│ category        │
│ description     │
└─────────────────┘
        │
        │ M:N
        │
┌─────────────────┐
│ GitaVerse...    │
│─────────────────│
│ id (PK)         │
│ verse_id (FK)   │
│ keyword_id (FK) │
└─────────────────┘
```

### Model Descriptions

#### GitaChapter
Stores metadata for each of the 18 chapters of the Bhagavad Gita.

**Fields:**
- `chapter_number`: Unique chapter number (1-18)
- `sanskrit_name`: Original Sanskrit name (e.g., "अर्जुनविषादयोग")
- `english_name`: English translation (e.g., "The Yoga of Arjuna's Dejection")
- `verse_count`: Number of verses in the chapter
- `themes`: Array of thematic elements
- `mental_health_relevance`: Contemporary spiritual wellness applications

#### GitaSource
Tracks authentic sources for verse translations.

**Authentic Sources:**
1. **Gita Press Gorakhpur** - Founded 1923, most renowned publisher
2. **ISKCON** - A.C. Bhaktivedanta Swami Prabhupada's translation
3. **IIT Kanpur Gita Supersite** - Academic resource
4. **Swami Sivananda** - Divine Life Society translation

**Fields:**
- `name`: Source organization name
- `description`: Brief description of the source
- `url`: Official website
- `credibility_rating`: Rating (1-5, all authentic sources are rated 5)

#### GitaVerse
Core table storing individual verses with multiple translations.

**Fields:**
- `chapter`: Chapter number (1-18), references GitaChapter
- `verse`: Verse number within chapter
- `sanskrit`: Original Sanskrit text in Devanagari script
- `transliteration`: Roman transliteration (IAST or Harvard-Kyoto)
- `hindi`: Hindi translation
- `english`: English translation
- `word_meanings`: JSON object with word-by-word meanings
- `principle`: Core teaching or principle
- `theme`: Thematic categorization
- `source_id`: Reference to GitaSource
- `embedding`: Vector embedding for semantic search (optional)

#### GitaModernContext
Contemporary applications and relevance of verses.

**Fields:**
- `verse_id`: Reference to GitaVerse
- `application_area`: Modern context (e.g., "Work-Life Balance", "Stress Management")
- `description`: Detailed explanation of application
- `examples`: Array of practical examples
- `mental_health_benefits`: Array of spiritual wellness benefits

#### GitaKeyword
Keywords and themes for categorization and search.

**Categories:**
- Ethics (dharma, righteousness)
- Action (karma, work)
- Practice (yoga, meditation)
- Wisdom (knowledge, understanding)
- Bhakti (devotion)
- Spiritual Wellness (anxiety, stress, peace)

#### GitaVerseKeyword
Junction table for many-to-many relationship between verses and keywords.

---

## Source Attribution

### Translation Sources

All verses in the database are sourced from authentic, scholarly recognized sources:

1. **Gita Press Gorakhpur**
   - Established: 1923
   - Location: Gorakhpur, India
   - Credibility: Highest (5/5)
   - Specialty: Traditional Sanskrit scholarship
   - Website: https://www.gitapress.org/

2. **ISKCON (Bhagavad-gita As It Is)**
   - Author: A.C. Bhaktivedanta Swami Prabhupada
   - Credibility: Highest (5/5)
   - Specialty: Devotional perspective with detailed commentary
   - Website: https://www.iskcon.org/

3. **IIT Kanpur Gita Supersite**
   - Maintainer: Indian Institute of Technology, Kanpur
   - Credibility: Highest (5/5)
   - Specialty: Academic, multi-commentary resource
   - Website: https://www.gitasupersite.iitk.ac.in/

4. **Swami Sivananda (Divine Life Society)**
   - Author: Swami Sivananda Saraswati
   - Credibility: Highest (5/5)
   - Specialty: Practical spiritual perspective
   - Website: https://www.sivanandaonline.org/

### Verification Process

Each verse undergoes:
1. Cross-referencing with multiple sources
2. Verification of Sanskrit text accuracy
3. Review of translation consistency
4. Validation of verse numbering

---

## Translation Methodology

### Sanskrit Text
- Uses standard Devanagari script (Unicode)
- Follows traditional verse numbering
- Maintains metrical structure where applicable

### Transliteration
- IAST (International Alphabet of Sanskrit Transliteration) standard
- Preserves pronunciation guidance
- Includes diacritical marks for accuracy

### Hindi Translation
- Modern Standard Hindi (Devanagari)
- Accessible language while maintaining traditional meaning
- Cultural context preserved

### English Translation
- Contemporary English for accessibility
- Preserves philosophical depth
- Multiple translations compared for accuracy
- Word-by-word meanings provided for key terms

### Word Meanings
Structured as JSON:
```json
{
  "dharma": "righteous duty",
  "karma": "action",
  "yoga": "union, spiritual practice"
}
```

---

## Database Schema

### Table Creation Order
Due to foreign key dependencies, tables must be created in this order:

1. `gita_sources`
2. `gita_chapters`
3. `gita_keywords`
4. `gita_verses`
5. `gita_modern_contexts`
6. `gita_verse_keywords`

### Indices

**Performance Optimization:**
- `idx_gita_chapters_number` on `chapter_number`
- `idx_gita_verses_chapter` on `chapter`
- `idx_gita_verses_verse` on `verse`
- `idx_gita_verses_theme` on `theme`
- `idx_gita_verses_chapter_verse` composite index
- `idx_gita_keywords_keyword` on `keyword`
- `idx_gita_modern_contexts_application` on `application_area`

### Audit Trails
All tables include:
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update (where applicable)

---

## Usage Guide

### Installation

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set database URL:**
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/mindvibe"
```

3. **Run migrations:**
```bash
psql -d mindvibe -f migrations/20251109_add_gita_wisdom_database.sql
```

4. **Seed the database:**
```bash
python scripts/seed_gita_wisdom.py
```

### Service Layer Usage

#### Initialize Service
```python
from backend.services.gita_service import GitaService
from backend.deps import get_db

async def example(db: AsyncSession = Depends(get_db)):
    service = GitaService()
```

#### Get Verses by Chapter
```python
verses = await GitaService.get_verses_by_chapter(db, chapter_number=2)
```

#### Search by Keyword
```python
verses = await GitaService.search_verses_by_keyword(db, keyword="karma")
```

#### Search by Theme
```python
verses = await GitaService.search_verses_by_theme(db, theme="peace")
```

#### Get Modern Context
```python
verse = await GitaService.get_verse_by_reference(db, chapter=2, verse=47)
contexts = await GitaService.get_modern_context(db, verse.id)
```

#### Query with Filters
```python
verses = await GitaService.query_verses_with_filters(
    db,
    chapter=2,
    theme="knowledge",
    limit=10
)
```

#### Format for API Response
```python
verse = await GitaService.get_verse_by_reference(db, chapter=2, verse=47)
formatted = GitaService.format_verse_response(
    verse,
    language="english",
    include_sanskrit=True,
    include_transliteration=True
)
```

---

## Adding/Updating Verses

### Add New Verse

```python
from backend.services.gita_service import GitaService

async def add_new_verse(db: AsyncSession):
    verse = await GitaService.add_verse_translation(
        db,
        chapter=2,
        verse=1,
        sanskrit="धृतराष्ट्र उवाच। धर्मक्षेत्रे कुरुक्षेत्रे...",
        transliteration="dhṛtarāṣṭra uvāca dharmakṣetre kurukṣetre...",
        hindi="धृतराष्ट्र ने कहा...",
        english="Dhritarashtra said...",
        principle="Introduction to the battlefield",
        theme="Setting",
        word_meanings={"धृतराष्ट्र": "Dhritarashtra", "उवाच": "said"},
        source_id=1  # Gita Press source ID
    )
```

### Update Existing Verse

```python
async def update_verse(db: AsyncSession):
    updated_verse = await GitaService.update_verse_translation(
        db,
        verse_id=123,
        english="Updated English translation",
        theme="Updated theme"
    )
```

### Add Modern Context

```python
async def add_context(db: AsyncSession):
    context = await GitaService.add_modern_context(
        db,
        verse_id=123,
        application_area="Stress Management",
        description="This verse teaches...",
        examples=["Example 1", "Example 2"],
        mental_health_benefits=["Reduced anxiety", "Better focus"]
    )
```

### Add Keywords

```python
async def add_keywords(db: AsyncSession):
    # Add keyword to verse
    await GitaService.add_keyword_to_verse(
        db,
        verse_id=123,
        keyword="meditation",
        category="Practice"
    )
```

### Data Validation

Before adding verses, ensure:

1. **Sanskrit text** is in proper Devanagari Unicode
2. **Chapter and verse numbers** are correct (1-18 for chapters)
3. **Source attribution** is valid
4. **Translations** are verified against authentic sources
5. **Word meanings** JSON is properly formatted
6. **Themes** follow established taxonomy

### Batch Import

For importing multiple verses from JSON:

```python
import json
from pathlib import Path

async def batch_import(db: AsyncSession):
    with open("verses.json", "r") as f:
        verses_data = json.load(f)
    
    for verse_data in verses_data:
        try:
            await GitaService.add_verse_translation(
                db,
                **verse_data
            )
        except ValueError as e:
            print(f"Skipping verse {verse_data['chapter']}.{verse_data['verse']}: {e}")
```

---

## Testing

### Unit Tests
```bash
pytest tests/unit/test_gita_service.py -v
```

### Integration Tests
```bash
pytest tests/integration/test_gita_api.py -v
```

### Data Validation
```bash
python scripts/verify_gita_data.py
```

---

## Future Enhancements

1. **Complete 700 verses**: Expand from starter set to all verses
2. **Audio recordings**: Add Sanskrit pronunciation audio
3. **Commentary**: Include traditional commentaries (Shankaracharya, Ramanuja)
4. **Multi-language**: Add more language translations
5. **Semantic search**: Implement vector embeddings for better search
6. **API versioning**: Support multiple translation versions
7. **User annotations**: Allow users to add personal notes

---

## Support

For questions or issues:
- Check existing documentation
- Review test cases for examples
- Consult source materials for verification
- Open an issue on GitHub

## License

This implementation follows the project's MIT license. Source texts are in the public domain or used with appropriate permissions from copyright holders.
