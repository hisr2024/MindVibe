# Wisdom Verse Scripts

This directory contains scripts for managing the Bhagavad Gita wisdom verses dataset.

## Scripts

### convert_gita_verses.py

Converts all 700+ verses from the Gita-API format to the MindVibe format.

**Usage:**
```bash
# First, clone the Gita-API repository to /tmp
git clone https://github.com/shubhankartrivedi/Gita-API.git /tmp/Gita-API

# Then run the conversion script
python scripts/convert_gita_verses.py
```

**Features:**
- Converts all 18 chapters (701 verses total)
- Extracts Sanskrit text, English translations, and Hindi translations
- Applies sanitization to remove religious references from English text
- Maps each verse to appropriate themes and mental health applications
- Creates backup of existing verses file
- Validates completeness of all chapters

### collect_gita_verses.py

Alternative script that fetches verses directly from the Bhagavad Gita API (requires internet access).

**Note:** This script requires external API access which may be blocked in some environments. Use `convert_gita_verses.py` instead if you have the Gita-API repository locally.

### generate_complete_verses.py

Generates a template structure for all 700 verses while preserving existing verse data.

**Usage:**
```bash
python scripts/generate_complete_verses.py
```

This creates a template file that can be manually populated with authentic translations.

## Data Structure

Each verse in the final `data/wisdom/verses.json` file has the following structure:

```json
{
  "verse_id": "2.47",
  "chapter": 2,
  "verse_number": 47,
  "theme": "action_without_attachment",
  "english": "Your right is only to work...",
  "hindi": "कर्तव्य-कर्म करनेमें ही तेरा अधिकार है...",
  "sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन...",
  "context": "This verse from Chapter 2 teaches about...",
  "mental_health_applications": [
    "anxiety_management",
    "stress_reduction",
    "letting_go",
    "present_moment_focus"
  ]
}
```

## Theme Categories

Verses are categorized into the following themes:

- **action_without_attachment**: Performing duties without attachment to outcomes
- **equanimity_in_adversity**: Maintaining emotional balance in difficult situations
- **control_of_mind**: Managing thoughts and mental patterns
- **self_empowerment**: Taking responsibility for one's mental state
- **mastering_the_mind**: Developing mental discipline and focus
- **practice_and_persistence**: Consistent effort in self-improvement
- **impermanence**: Understanding the temporary nature of experiences
- **inner_peace**: Cultivating contentment and tranquility
- **self_knowledge**: Developing self-awareness and understanding
- **inner_joy**: Finding happiness from within
- **moral_dilemma**: Making ethical decisions
- **overcoming_grief**: Processing loss and emotional pain
- **knowledge_wisdom**: Cognitive reframing and perspective-taking
- **consciousness_exploration**: Meditation and mindfulness practice
- **inner_wisdom**: Trusting inner guidance and intuition
- **self_awareness**: Self-reflection and personal insight
- **emotional_regulation**: Managing emotions effectively
- **self_discipline**: Building habits and self-control

## Sanitization

All English translations are sanitized to remove religious references and present wisdom universally:

- "Krishna" → "the teacher"
- "Arjuna" → "the student"
- "Lord" → "the wise one"
- "God" → "the divine"
- "The Supreme" → "the highest truth"

And many more replacements to ensure universal applicability.

## Sources

The verses are compiled from authentic sources including:
- Bhagavad Gita API (bhagavadgitaapi.in)
- Gita-API GitHub repository
- Translations by renowned scholars:
  - Swami Adidevananda
  - Swami Gambirananda
  - Swami Sivananda
  - Swami Ramsukhdas
  - Swami Tejomayananda

All sources provide public domain or openly licensed content.
