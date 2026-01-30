#!/usr/bin/env python3
"""
Fetch Complete Bhagavad Gita Verses

This script fetches all 700 verses of the Bhagavad Gita from the open-source
gita/gita repository and formats them for MindVibe.

Source: https://github.com/gita/gita

Data includes:
- Sanskrit text (Devanagari)
- IAST transliteration
- English translations (multiple authors)
- Hindi translations

Usage:
    python scripts/fetch_complete_gita_verses.py
"""

import json
import os
import sys
import urllib.request
import ssl
from pathlib import Path
from typing import Any

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# GitHub raw content URLs for gita/gita repository
VERSE_URL = "https://raw.githubusercontent.com/gita/gita/main/data/verse.json"
TRANSLATION_URL = "https://raw.githubusercontent.com/gita/gita/main/data/translation.json"
CHAPTERS_URL = "https://raw.githubusercontent.com/gita/gita/main/data/chapters.json"

# Chapter names and themes
CHAPTER_INFO = {
    1: {"name": "Arjuna Vishada Yoga", "theme": "emotional_crisis_moral_conflict"},
    2: {"name": "Sankhya Yoga", "theme": "wisdom_self_realization"},
    3: {"name": "Karma Yoga", "theme": "selfless_action"},
    4: {"name": "Jnana Yoga", "theme": "knowledge_wisdom"},
    5: {"name": "Karma Sannyasa Yoga", "theme": "renunciation_action"},
    6: {"name": "Dhyana Yoga", "theme": "meditation_self_control"},
    7: {"name": "Jnana Vijnana Yoga", "theme": "knowledge_realization"},
    8: {"name": "Aksara Brahma Yoga", "theme": "imperishable_brahman"},
    9: {"name": "Raja Vidya Yoga", "theme": "royal_knowledge"},
    10: {"name": "Vibhuti Yoga", "theme": "divine_glories"},
    11: {"name": "Viswarupa Darshana Yoga", "theme": "universal_form"},
    12: {"name": "Bhakti Yoga", "theme": "devotion_love"},
    13: {"name": "Kshetra Kshetrajna Yoga", "theme": "field_knower"},
    14: {"name": "Gunatraya Vibhaga Yoga", "theme": "three_gunas"},
    15: {"name": "Purusottama Yoga", "theme": "supreme_person"},
    16: {"name": "Daivasura Sampad Yoga", "theme": "divine_demonic_natures"},
    17: {"name": "Shraddhatraya Vibhaga Yoga", "theme": "three_fold_faith"},
    18: {"name": "Moksha Sannyasa Yoga", "theme": "liberation_renunciation"},
}

# Mental health application mappings by theme
MENTAL_HEALTH_APPLICATIONS = {
    "emotional_crisis_moral_conflict": ["emotional_regulation", "anxiety_management", "conflict_resolution", "self_awareness"],
    "wisdom_self_realization": ["self_discovery", "mindfulness", "inner_peace", "identity_clarity"],
    "selfless_action": ["purpose", "motivation", "stress_reduction", "attachment_release"],
    "knowledge_wisdom": ["cognitive_clarity", "learning", "wisdom", "discernment"],
    "renunciation_action": ["balance", "letting_go", "detachment", "inner_freedom"],
    "meditation_self_control": ["meditation", "focus", "self_discipline", "mental_clarity"],
    "knowledge_realization": ["spiritual_growth", "understanding", "insight", "awareness"],
    "imperishable_brahman": ["transcendence", "eternal_perspective", "peace", "acceptance"],
    "royal_knowledge": ["devotion", "surrender", "trust", "divine_connection"],
    "divine_glories": ["gratitude", "wonder", "appreciation", "awe"],
    "universal_form": ["perspective", "humility", "interconnection", "cosmic_awareness"],
    "devotion_love": ["love", "devotion", "emotional_connection", "selfless_love"],
    "field_knower": ["self_knowledge", "body_awareness", "consciousness", "discernment"],
    "three_gunas": ["emotional_balance", "personality_awareness", "transformation", "quality_awareness"],
    "supreme_person": ["aspiration", "higher_purpose", "spiritual_connection", "ultimate_goal"],
    "divine_demonic_natures": ["character_development", "virtue", "self_improvement", "moral_clarity"],
    "three_fold_faith": ["faith", "belief_systems", "intention", "sincerity"],
    "liberation_renunciation": ["freedom", "liberation", "culmination", "integration"],
}


def fetch_json(url: str) -> Any:
    """Fetch JSON data from URL."""
    print(f"  Fetching: {url}")

    # Create SSL context that doesn't verify certificates (for some corporate networks)
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(url, context=ctx, timeout=30) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"  Warning: Could not fetch {url}: {e}")
        return None


def load_existing_verses() -> list[dict]:
    """Load existing verses from the JSON file."""
    json_path = PROJECT_ROOT / 'data' / 'gita' / 'gita_verses_complete.json'
    if json_path.exists():
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []


def save_verses(verses: list[dict]) -> None:
    """Save verses to the JSON file."""
    json_path = PROJECT_ROOT / 'data' / 'gita' / 'gita_verses_complete.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(verses, f, ensure_ascii=False, indent=2)


def get_hindi_translation(translations: dict, verse_id: str) -> str:
    """Extract Hindi translation from translations data."""
    # Common Hindi translator IDs in the dataset
    hindi_author_ids = [16, 17, 18]  # Swami Ramsukhdas, Swami Tejomayananda, etc.

    verse_translations = translations.get(verse_id, [])
    if isinstance(verse_translations, list):
        for trans in verse_translations:
            if trans.get('author_id') in hindi_author_ids:
                return trans.get('description', '')
    return ""


def get_english_translation(translations: dict, verse_id: str) -> str:
    """Extract English translation from translations data."""
    # Common English translator IDs in the dataset
    english_author_ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]

    verse_translations = translations.get(verse_id, [])
    if isinstance(verse_translations, list):
        for trans in verse_translations:
            if trans.get('author_id') in english_author_ids:
                return trans.get('description', '')
    return ""


def process_verses(verse_data: list, translation_data: Any) -> list[dict]:
    """Process verse and translation data into MindVibe format."""
    verses = []

    # Create translation lookup by verse_id (the unique ID in the dataset)
    translations_by_verse_id = {}
    if isinstance(translation_data, list):
        for trans in translation_data:
            verse_id = trans.get('verse_id')
            if verse_id is not None:
                if verse_id not in translations_by_verse_id:
                    translations_by_verse_id[verse_id] = []
                translations_by_verse_id[verse_id].append(trans)

    # Also create a lookup by (chapter, verse_number) from the verse data
    verse_id_lookup = {}  # (chapter, verse_num) -> verse_id

    for verse in verse_data:
        chapter = verse.get('chapter_number', verse.get('chapter_id', 0))
        verse_num = verse.get('verse_number', 0)
        verse_id = verse.get('id')  # The unique verse ID

        if verse_id is not None:
            verse_id_lookup[(chapter, verse_num)] = verse_id

    for verse in verse_data:
        chapter = verse.get('chapter_number', verse.get('chapter_id', 0))
        verse_num = verse.get('verse_number', 0)
        verse_id = verse.get('id')

        # Get chapter info
        chapter_info = CHAPTER_INFO.get(chapter, {"name": f"Chapter {chapter}", "theme": "wisdom"})
        theme = chapter_info["theme"]

        # Get translations using the verse_id
        verse_translations = translations_by_verse_id.get(verse_id, [])

        english = ""
        hindi = ""

        # Sort translations by language and author preference
        for trans in verse_translations:
            lang = trans.get('lang', trans.get('language', '')).lower()
            description = trans.get('description', '')

            if not description:
                continue

            # English translations
            if lang == 'english' and not english:
                english = description
            # Hindi translations
            elif lang == 'hindi' and not hindi:
                hindi = description

        # Fallback using language_id if lang field not present
        if not english or not hindi:
            for trans in verse_translations:
                language_id = trans.get('language_id', 0)
                description = trans.get('description', '')

                if not description:
                    continue

                # language_id 1 = English, 2 = Hindi (common convention)
                if language_id == 1 and not english:
                    english = description
                elif language_id == 2 and not hindi:
                    hindi = description

        # Fallback English if not found
        if not english:
            english = f"Bhagavad Gita Chapter {chapter}, Verse {verse_num} from {chapter_info['name']}."

        # Fallback Hindi if not found
        if not hindi:
            hindi = f"भगवद्गीता अध्याय {chapter}, श्लोक {verse_num} - {chapter_info['name']} से।"

        processed_verse = {
            "chapter": chapter,
            "verse": verse_num,
            "sanskrit": verse.get('text', f"॥ {chapter}.{verse_num} ॥"),
            "transliteration": verse.get('transliteration', f"Verse {chapter}.{verse_num}"),
            "english": english,
            "hindi": hindi,
            "word_meanings": verse.get('word_meanings', {}),
            "chapter_name": chapter_info["name"],
            "theme": theme,
            "principle": f"Core teaching from Chapter {chapter} - {chapter_info['name']}",
            "mental_health_applications": MENTAL_HEALTH_APPLICATIONS.get(theme, ["mindfulness", "self_awareness"]),
        }

        verses.append(processed_verse)

    return verses


def main():
    """Main function to fetch and process all Gita verses."""
    print("=" * 60)
    print("Complete Bhagavad Gita Verses Fetcher")
    print("Source: github.com/gita/gita")
    print("=" * 60)

    # Fetch data from GitHub
    print("\nFetching verse data from GitHub...")
    verse_data = fetch_json(VERSE_URL)

    print("\nFetching translation data from GitHub...")
    translation_data = fetch_json(TRANSLATION_URL)

    if not verse_data:
        print("ERROR: Could not fetch verse data. Please check your internet connection.")
        return 1

    print(f"\nLoaded {len(verse_data)} verses from source")

    # Process verses
    print("\nProcessing verses into MindVibe format...")
    processed_verses = process_verses(verse_data, translation_data or {})

    # Sort by chapter and verse
    processed_verses.sort(key=lambda v: (v['chapter'], v['verse']))

    print(f"Processed {len(processed_verses)} verses")

    # Load existing verses to preserve any custom data
    print("\nLoading existing verses...")
    existing_verses = load_existing_verses()

    # Create lookup for existing verses
    existing_lookup = {(v['chapter'], v['verse']): v for v in existing_verses}

    # Merge: use processed verses but preserve custom fields from existing
    print("\nMerging with existing data...")
    final_verses = []
    for pv in processed_verses:
        key = (pv['chapter'], pv['verse'])
        if key in existing_lookup:
            ev = existing_lookup[key]
            # Preserve custom mental_health_applications if they were manually set
            if ev.get('mental_health_applications'):
                # Merge, keeping unique values
                combined = list(set(ev['mental_health_applications'] + pv['mental_health_applications']))
                pv['mental_health_applications'] = combined
        final_verses.append(pv)

    # Save
    print(f"\nSaving {len(final_verses)} verses...")
    save_verses(final_verses)

    # Statistics
    placeholder_count = sum(
        1 for v in final_verses
        if v['sanskrit'].startswith('॥') and v['sanskrit'].endswith('॥') and len(v['sanskrit']) < 20
    )
    authentic_count = len(final_verses) - placeholder_count

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total verses: {len(final_verses)}")
    print(f"Verses with authentic Sanskrit: {authentic_count}")
    print(f"Verses with placeholder content: {placeholder_count}")
    print(f"Coverage: {authentic_count / len(final_verses) * 100:.1f}%")

    # Show sample verse
    if final_verses:
        sample = final_verses[0]
        print("\nSample verse (1.1):")
        print(f"  Sanskrit: {sample['sanskrit'][:50]}...")
        print(f"  English: {sample['english'][:80]}...")

    return 0


if __name__ == '__main__':
    sys.exit(main())
