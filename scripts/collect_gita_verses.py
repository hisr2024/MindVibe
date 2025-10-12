#!/usr/bin/env python3
"""
Script to collect all 700 verses of the Bhagavad Gita from authentic sources.
Sources: Bhagavad Gita API (bhagavadgitaapi.in), public domain translations
"""

import asyncio
import json
import os
import re
from typing import Dict, List, Any
import aiohttp

# Chapter structure - total 700 verses
CHAPTER_VERSE_COUNT = {
    1: 47,   # Arjuna Vishada Yoga
    2: 72,   # Sankhya Yoga
    3: 43,   # Karma Yoga
    4: 42,   # Jnana Karma Sanyasa Yoga
    5: 29,   # Karma Sanyasa Yoga
    6: 47,   # Dhyana Yoga
    7: 30,   # Jnana Vijnana Yoga
    8: 28,   # Aksara Brahma Yoga
    9: 34,   # Raja Vidya Raja Guhya Yoga
    10: 42,  # Vibhuti Yoga
    11: 55,  # Visvarupa Darsana Yoga
    12: 20,  # Bhakti Yoga
    13: 35,  # Ksetra Ksetrajna Vibhaga Yoga
    14: 27,  # Gunatraya Vibhaga Yoga
    15: 20,  # Purusottama Yoga
    16: 24,  # Daivasura Sampad Vibhaga Yoga
    17: 28,  # Sraddhatraya Vibhaga Yoga
    18: 78   # Moksa Sanyasa Yoga
}

# Theme mapping based on content analysis
VERSE_THEMES = {
    # Chapter 1 - Despair and moral dilemma
    (1, range(1, 48)): "moral_dilemma",
    
    # Chapter 2 - Core teachings
    (2, range(1, 10)): "overcoming_grief",
    (2, range(11, 39)): "knowledge_wisdom",
    (2, range(40, 54)): "equanimity_in_adversity",
    (2, range(55, 73)): "control_of_mind",
    
    # Chapter 3 - Action without attachment
    (3, range(1, 44)): "action_without_attachment",
    
    # Chapter 4 - Knowledge and renunciation
    (4, range(1, 43)): "knowledge_wisdom",
    
    # Chapter 5 - Renunciation of action
    (5, range(1, 30)): "inner_peace",
    
    # Chapter 6 - Meditation and self-control
    (6, range(1, 32)): "mastering_the_mind",
    (6, range(33, 48)): "practice_and_persistence",
    
    # Chapter 7 - Knowledge of the Absolute
    (7, range(1, 31)): "self_knowledge",
    
    # Chapter 8 - Path to the Supreme
    (8, range(1, 29)): "consciousness_exploration",
    
    # Chapter 9 - Royal knowledge
    (9, range(1, 35)): "inner_wisdom",
    
    # Chapter 10 - Divine manifestations
    (10, range(1, 43)): "self_awareness",
    
    # Chapter 11 - Universal form
    (11, range(1, 56)): "consciousness_exploration",
    
    # Chapter 12 - Path of devotion
    (12, range(1, 21)): "inner_peace",
    
    # Chapter 13 - Field and knower
    (13, range(1, 36)): "self_knowledge",
    
    # Chapter 14 - Three modes of nature
    (14, range(1, 28)): "self_awareness",
    
    # Chapter 15 - Supreme person
    (15, range(1, 21)): "inner_wisdom",
    
    # Chapter 16 - Divine and demonic qualities
    (16, range(1, 25)): "emotional_regulation",
    
    # Chapter 17 - Threefold faith
    (17, range(1, 29)): "self_discipline",
    
    # Chapter 18 - Liberation through renunciation
    (18, range(1, 40)): "action_without_attachment",
    (18, range(41, 79)): "knowledge_wisdom",
}

# Mental health applications mapping
THEME_APPLICATIONS = {
    "action_without_attachment": ["anxiety_management", "stress_reduction", "letting_go", "present_moment_focus"],
    "equanimity_in_adversity": ["emotional_regulation", "resilience", "mindfulness", "equanimity"],
    "control_of_mind": ["anger_management", "impulse_control", "cognitive_awareness", "self_control"],
    "self_empowerment": ["self_empowerment", "depression_recovery", "self_compassion", "personal_growth"],
    "mastering_the_mind": ["meditation_support", "adhd_management", "racing_thoughts", "mindfulness_practice"],
    "practice_and_persistence": ["habit_formation", "behavioral_change", "persistence", "self_discipline"],
    "impermanence": ["acceptance", "emotional_tolerance", "distress_tolerance", "impermanence_awareness"],
    "inner_peace": ["inner_peace", "contentment", "desire_management", "mental_stillness"],
    "self_knowledge": ["self_awareness", "metacognition", "inner_wisdom", "consciousness_exploration"],
    "inner_joy": ["intrinsic_happiness", "meditation", "contentment", "inner_fulfillment"],
    "moral_dilemma": ["decision_making", "ethical_awareness", "value_clarification"],
    "overcoming_grief": ["grief_processing", "emotional_healing", "loss_acceptance"],
    "knowledge_wisdom": ["cognitive_reframing", "wisdom_cultivation", "perspective_taking"],
    "consciousness_exploration": ["mindfulness_practice", "meditation_support", "spiritual_growth"],
    "inner_wisdom": ["intuition_development", "self_trust", "inner_guidance"],
    "self_awareness": ["self_reflection", "personal_insight", "consciousness_development"],
    "emotional_regulation": ["emotion_management", "impulse_control", "anger_management"],
    "self_discipline": ["habit_formation", "self_control", "behavioral_change"],
}


def get_theme_for_verse(chapter: int, verse: int) -> str:
    """Get theme for a specific verse based on chapter and verse number."""
    for (ch, verse_range), theme in VERSE_THEMES.items():
        if ch == chapter and verse in verse_range:
            return theme
    # Default theme if not found
    return "knowledge_wisdom"


def sanitize_english_text(text: str) -> str:
    """
    Sanitize religious references in English text to make it universal.
    """
    if not text:
        return text
    
    # Replace specific religious references with universal terms
    replacements = {
        r'\bKrishna\b': 'the teacher',
        r'\bArjuna\b': 'the student',
        r'\bLord\b': 'the wise one',
        r'\bGod\b': 'the divine',
        r'\bthe Supreme\b': 'the highest truth',
        r'\bBhagavan\b': 'the teacher',
        r'\bO mighty-armed\b': 'O seeker',
        r'\bO son of Kunti\b': 'O seeker',
        r'\bO Bharata\b': 'O student',
        r'\bO Partha\b': 'O seeker',
        r'\bMadhava\b': 'the teacher',
        r'\bKeshava\b': 'the teacher',
        r'\bJanardana\b': 'the teacher',
        r'\bVarshneya\b': 'the seeker',
        r'\bAcyuta\b': 'the teacher',
        r'\bHrishikesha\b': 'the teacher',
        r'\bGovinda\b': 'the teacher',
    }
    
    sanitized = text
    for pattern, replacement in replacements.items():
        sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)
    
    return sanitized


async def fetch_verse_from_api(session: aiohttp.ClientSession, chapter: int, verse: int) -> Dict[str, Any]:
    """
    Fetch verse from Bhagavad Gita API.
    This is a free, open API providing authentic translations.
    """
    url = f"https://bhagavadgitaapi.in/slok/{chapter}/{verse}/"
    
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
            if response.status == 200:
                data = await response.json()
                return data
            else:
                print(f"Error fetching {chapter}.{verse}: Status {response.status}")
                return None
    except Exception as e:
        print(f"Error fetching {chapter}.{verse}: {e}")
        return None


def extract_verse_data(api_data: Dict[str, Any], chapter: int, verse: int) -> Dict[str, Any]:
    """
    Extract and structure verse data from API response.
    """
    if not api_data:
        return None
    
    # Extract translations (API provides multiple commentaries)
    sanskrit = api_data.get('slok', '')
    
    # Try to get English translation
    english = ''
    if 'tej' in api_data and 'ht' in api_data['tej']:
        english = api_data['tej']['ht']
    elif 'siva' in api_data and 'et' in api_data['siva']:
        english = api_data['siva']['et']
    elif 'purohit' in api_data:
        english = api_data['purohit'].get('et', '')
    
    # Try to get Hindi translation
    hindi = ''
    if 'siva' in api_data and 'ht' in api_data['siva']:
        hindi = api_data['siva']['ht']
    elif 'tej' in api_data and 'ht' in api_data['tej']:
        hindi = api_data['tej']['ht']
    
    # Get theme and applications
    theme = get_theme_for_verse(chapter, verse)
    applications = THEME_APPLICATIONS.get(theme, ["self_awareness", "mindfulness"])
    
    # Create context from available commentary
    context = ""
    if 'siva' in api_data and 'ec' in api_data['siva']:
        context = api_data['siva']['ec']
    elif 'tej' in api_data and 'hc' in api_data['tej']:
        context = api_data['tej']['hc']
    
    # Sanitize English text
    english_sanitized = sanitize_english_text(english)
    context_sanitized = sanitize_english_text(context) if context else f"Verse {chapter}.{verse} teaches about {theme.replace('_', ' ')}."
    
    verse_data = {
        "verse_id": f"{chapter}.{verse}",
        "chapter": chapter,
        "verse_number": verse,
        "theme": theme,
        "english": english_sanitized,
        "hindi": hindi,
        "sanskrit": sanskrit,
        "context": context_sanitized[:500] if len(context_sanitized) > 500 else context_sanitized,  # Limit context length
        "mental_health_applications": applications
    }
    
    return verse_data


async def collect_all_verses() -> List[Dict[str, Any]]:
    """
    Collect all 700 verses from the Bhagavad Gita.
    """
    all_verses = []
    
    async with aiohttp.ClientSession() as session:
        for chapter, verse_count in CHAPTER_VERSE_COUNT.items():
            print(f"\nProcessing Chapter {chapter} ({verse_count} verses)...")
            
            for verse in range(1, verse_count + 1):
                api_data = await fetch_verse_from_api(session, chapter, verse)
                
                if api_data:
                    verse_data = extract_verse_data(api_data, chapter, verse)
                    if verse_data and verse_data.get('english') and verse_data.get('sanskrit'):
                        all_verses.append(verse_data)
                        print(f"  ✓ Verse {chapter}.{verse}")
                    else:
                        print(f"  ✗ Verse {chapter}.{verse} - incomplete data")
                else:
                    print(f"  ✗ Verse {chapter}.{verse} - fetch failed")
                
                # Small delay to avoid overwhelming the API
                await asyncio.sleep(0.1)
    
    return all_verses


async def main():
    """Main function to collect and save all verses."""
    print("Starting collection of all 700 Bhagavad Gita verses...")
    print("=" * 60)
    
    verses = await collect_all_verses()
    
    print("\n" + "=" * 60)
    print(f"Collection complete! Total verses collected: {len(verses)}/700")
    
    # Save to JSON file
    output_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'data',
        'wisdom',
        'verses.json'
    )
    
    # Create backup of existing file
    if os.path.exists(output_path):
        backup_path = output_path.replace('.json', '_backup.json')
        with open(output_path, 'r', encoding='utf-8') as f:
            backup_data = f.read()
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(backup_data)
        print(f"Backup created: {backup_path}")
    
    # Save new data
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(verses, f, ensure_ascii=False, indent=2)
    
    print(f"Verses saved to: {output_path}")
    
    # Print statistics
    print("\nStatistics:")
    themes = {}
    for verse in verses:
        theme = verse['theme']
        themes[theme] = themes.get(theme, 0) + 1
    
    print(f"  Total verses: {len(verses)}")
    print(f"  Unique themes: {len(themes)}")
    print("\nTheme distribution:")
    for theme, count in sorted(themes.items(), key=lambda x: x[1], reverse=True):
        print(f"  {theme}: {count} verses")


if __name__ == "__main__":
    asyncio.run(main())
