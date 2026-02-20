# Bhagavad Gita Data

This directory contains all 700 verses of the Bhagavad Gita from authentic Indian sources, integrated into the MindVibe KIAAN ecosystem for spiritual wellness guidance.

## 📁 Files

- **`gita_verses_complete.json`** - Complete database of all 700 authentic Gita verses (PRIMARY DATA SOURCE)
- **`sample_verses_structure.json`** - Example structure showing 10 representative verses with all required fields
- **`mental_health_tag_guide.md`** - Comprehensive methodology for tagging verses with spiritual wellness applications
- **`chapter_metadata.json`** - Metadata for all 18 chapters
- **`gita_verses_starter.json`** - Initial sample verses (legacy)
- **`chapters/`** - Individual chapter files (if applicable)

## 📚 Data Sources

### Sanskrit (Devanagari)

**Primary Source:**
- **Gita Press, Gorakhpur** - The gold standard for Sanskrit Devanagari text
- Established 1923, most authoritative publisher of Hindu scriptures

**Validation Source:**
- **IIT Kanpur Gita Supersite** (gitasupersite.iitk.ac.in)
- Academic platform for cross-reference and verification
- Multiple commentary traditions

**Requirements:**
- UTF-8 Unicode encoding
- Devanagari script (Unicode range U+0900 to U+097F)
- No transliteration in Sanskrit field
- Authentic, unmodified text

### Transliteration

**Standard:**
- **IAST** (International Alphabet of Sanskrit Transliteration) ONLY
- Required diacritics: ā ī ū ṛ ṝ ḷ ḹ ṃ ḥ ṅ ñ ṭ ḍ ṇ ś ṣ

**NOT Accepted:**
- ❌ ITRANS (a, aa, i, ii)
- ❌ Harvard-Kyoto (A, I, R, RR)
- ❌ Simplified ASCII transliteration

**Example:**
```
karmaṇy-evādhikāras te mā phaleṣu kadācana
```

### Hindi

**Source:**
- **Gita Press Hindi translations**
- Faithful to Sanskrit meaning
- Culturally appropriate expressions
- Devanagari script (UTF-8)

### English

**Primary Translations:**
- **Swami Sivananda** (Divine Life Society) - Clear, accessible, spiritually accurate
- **Swami Chinmayananda** (Chinmaya Mission) - Philosophical depth
- **Eknath Easwaran** - Contemporary accessibility (alternative)

**Requirements:**
- Clear modern English
- Preserves philosophical depth
- Accessible to general audience
- Maintains important Sanskrit terms

## 📊 Verse Distribution

The Bhagavad Gita contains exactly **700 verses** across **18 chapters**:

| Chapter | Verses | Sanskrit Name | English Name |
|---------|--------|---------------|--------------|
| 1 | 47 | अर्जुन विषाद योग | Arjuna's Grief |
| 2 | 72 | सांख्य योग | Knowledge & Equanimity |
| 3 | 43 | कर्म योग | Karma Yoga |
| 4 | 42 | ज्ञान कर्म संन्यास योग | Knowledge & Action |
| 5 | 29 | कर्म संन्यास योग | Renunciation of Action |
| 6 | 47 | ध्यान योग | Meditation Yoga |
| 7 | 30 | ज्ञान विज्ञान योग | Knowledge & Wisdom |
| 8 | 28 | अक्षर ब्रह्म योग | Imperishable Brahman |
| 9 | 34 | राज विद्या राज गुह्य योग | Royal Knowledge |
| 10 | 42 | विभूति योग | Divine Manifestations |
| 11 | 55 | विश्वरूप दर्शन योग | Universal Form |
| 12 | 20 | भक्ति योग | Devotion Yoga |
| 13 | 34 | क्षेत्र क्षेत्रज्ञ विभाग योग | Field & Knower |
| 14 | 27 | गुण त्रय विभाग योग | Three Qualities |
| 15 | 20 | पुरुषोत्तम योग | Supreme Person |
| 16 | 24 | दैवासुर सम्पद विभाग योग | Divine & Demonic |
| 17 | 28 | श्रद्धा त्रय विभाग योग | Three Types of Faith |
| 18 | 78 | मोक्ष संन्यास योग | Liberation & Surrender |
| **TOTAL** | **700** | | |

See [docs/BHAGAVAD_GITA_IMPLEMENTATION.md](../../docs/BHAGAVAD_GITA_IMPLEMENTATION.md) for complete breakdown with spiritual wellness applications.

## ✅ Validation

Before using or modifying Gita data, always run the validation script:

```bash
# Validate the complete verses file
python scripts/validate_gita_authenticity.py

# Validate a specific file
python scripts/validate_gita_authenticity.py data/gita/sample_verses_structure.json
```

**The script validates:**
- ✅ Total verse count = 700
- ✅ Chapter distribution matches canonical counts
- ✅ Sanskrit is valid Devanagari (U+0900 to U+097F)
- ✅ Transliteration uses IAST diacritics
- ✅ All required fields present
- ✅ Spiritual wellness tags are valid
- ✅ No duplicate verses

## 🏷️ Spiritual Wellness Tagging

All verses are tagged with spiritual wellness applications following evidence-based methodology.

### Primary Domains

Each verse has **one primary domain**:
- `anxiety` - Worry, fear of outcomes
- `depression` - Hopelessness, lack of motivation
- `emotional_regulation` - Equanimity, balance
- `self_worth` - Self-esteem, inner power
- `relationships` - Compassion, forgiveness
- `purpose` - Dharma, life meaning
- `work_stress` - Work-life balance
- `anger` - Anger management
- `fear` - Courage, fearlessness
- `grief` - Loss, impermanence

### Spiritual Wellness Applications

Each verse can have **3-5 specific applications**:
- `outcome_detachment` - Reducing anxiety by focusing on effort
- `equanimity` - Emotional balance in ups and downs
- `self_mastery` - Self-control and discipline
- `compassion` - Kindness toward self and others
- `meditation_practice` - Practical meditation guidance
- And many more...

See [`mental_health_tag_guide.md`](mental_health_tag_guide.md) for complete methodology.

## 🎯 Quality Standards

All data in this directory must meet these standards:

### ✅ Authenticity
- Sanskrit from Gita Press or IIT Kanpur Gita Supersite
- No modifications to original Sanskrit text
- Authentic translations from recognized authorities
- No Western interpretations or substitutions

### ✅ Encoding
- UTF-8 Unicode throughout
- Devanagari: U+0900 to U+097F range
- IAST transliteration with proper diacritics
- No character encoding errors

### ✅ Completeness
- All 700 verses present
- Canonical chapter/verse distribution
- All required fields filled
- Word meanings included

### ✅ Spiritual Wellness Tagging
- Evidence-based applications
- Aligned with modern psychology (CBT, DBT, ACT, CFT, MBSR)
- Cultural sensitivity maintained
- Clinically useful

## 🔨 Creating `gita_verses_complete.json`

To create the complete 700-verse database:

### Step 1: Use the Sample Structure

Start with `sample_verses_structure.json` as your template. Each verse must have:

```json
{
  "chapter": 1-18,
  "verse": 1-78,
  "sanskrit": "देवनागरी संस्कृत",
  "transliteration": "IAST transliteration",
  "hindi": "गीता प्रेस हिंदी",
  "english": "English translation",
  "word_meanings": {
    "sanskrit_word": "meaning"
  },
  "principle": "Core teaching",
  "theme": "theme_slug",
  "mental_health_applications": [
    "application_slug"
  ],
  "primary_domain": "domain",
  "secondary_domains": []
}
```

### Step 2: Source Verses from Authoritative Texts

**For Sanskrit:**
1. Use Gita Press, Gorakhpur edition
2. Verify against IIT Kanpur Gita Supersite
3. Ensure proper Devanagari encoding

**For Transliteration:**
1. Convert to IAST standard
2. Use proper diacritics (ā ī ū ṛ ṃ ḥ etc.)
3. Validate with IAST converter tools

**For Translations:**
1. Source from Swami Sivananda or Chinmayananda
2. Verify meaning aligns with Sanskrit
3. Keep language accessible

### Step 3: Tag with Spiritual Wellness Applications

Follow the methodology in `mental_health_tag_guide.md`:

1. Read and understand the verse
2. Identify the primary spiritual wellness domain
3. List 3-5 specific applications
4. Add 0-3 secondary domains
5. Validate clinical relevance

### Step 4: Validate

Run the validation script after adding verses:

```bash
python scripts/validate_gita_authenticity.py
```

Fix any errors and re-validate until all checks pass.

### Step 5: Seed Database

Once validation passes:

```bash
# Set database URL
export DATABASE_URL="postgresql://user:password@localhost:5432/mindvibe"

# Run seeder
python scripts/seed_complete_gita.py

# Verify in database
python scripts/verify_700_verses.py --database
```

## 📖 Documentation

For complete implementation details, see:

- **[docs/BHAGAVAD_GITA_IMPLEMENTATION.md](../../docs/BHAGAVAD_GITA_IMPLEMENTATION.md)** - Complete implementation guide
  - Overview and authenticity standards
  - Data sources and requirements
  - Canonical verse distribution
  - JSON structure specification
  - Spiritual wellness tagging methodology
  - Database schema
  - Seeding process
  - KIAAN integration guidelines
  - Testing and validation
  - Resources and references

- **[mental_health_tag_guide.md](mental_health_tag_guide.md)** - Spiritual wellness tagging methodology
  - Primary domains with definitions
  - Spiritual wellness applications with evidence
  - Tagging principles
  - Key verse collections by need
  - Implementation workflow

## 🔐 Data Integrity

This data represents sacred wisdom being applied to spiritual wellness. We maintain the highest standards:

- **No modifications** to authentic Sanskrit text
- **No substitutions** with Western or non-traditional sources  
- **Respectful integration** honoring the spiritual depth
- **Cultural sensitivity** in all applications
- **Evidence-based** spiritual wellness connections
- **Quality validation** at every step

## 🤝 Contributing

When contributing verse data:

1. Follow the structure in `sample_verses_structure.json`
2. Source from approved authorities only
3. Use IAST transliteration standard
4. Tag following `mental_health_tag_guide.md`
5. Validate with `scripts/validate_gita_authenticity.py`
6. Test database integration
7. Document any new applications or domains

## 📞 Support

For questions or issues:
- See documentation in `docs/`
- Check validation script output
- Review spiritual wellness tagging guide
- Open GitHub issue if needed

---

**This data powers authentic Gita wisdom in MindVibe, helping millions find mental peace through timeless teachings.**

🕉️ **Om Shanti** 🕉️
