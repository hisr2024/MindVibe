#!/usr/bin/env python3
"""
Convert Bhagavad Gita verses from Gita-API format to MindVibe format.
This script processes all 700 verses and creates a complete verses.json file.
"""

import json
import os
import re
from typing import Dict, List, Any

# Chapter info - total 700 verses
CHAPTER_INFO = {
    1: {"name": "Arjuna Vishada Yoga", "verses": 47, "main_theme": "moral_dilemma"},
    2: {"name": "Sankhya Yoga", "verses": 72, "main_theme": "knowledge_wisdom"},
    3: {"name": "Karma Yoga", "verses": 43, "main_theme": "action_without_attachment"},
    4: {"name": "Jnana Karma Sanyasa Yoga", "verses": 42, "main_theme": "knowledge_wisdom"},
    5: {"name": "Karma Sanyasa Yoga", "verses": 29, "main_theme": "inner_peace"},
    6: {"name": "Dhyana Yoga", "verses": 47, "main_theme": "mastering_the_mind"},
    7: {"name": "Jnana Vijnana Yoga", "verses": 30, "main_theme": "self_knowledge"},
    8: {"name": "Aksara Brahma Yoga", "verses": 28, "main_theme": "consciousness_exploration"},
    9: {"name": "Raja Vidya Raja Guhya Yoga", "verses": 34, "main_theme": "inner_wisdom"},
    10: {"name": "Vibhuti Yoga", "verses": 42, "main_theme": "self_awareness"},
    11: {"name": "Visvarupa Darsana Yoga", "verses": 55, "main_theme": "consciousness_exploration"},
    12: {"name": "Bhakti Yoga", "verses": 20, "main_theme": "inner_peace"},
    13: {"name": "Ksetra Ksetrajna Vibhaga Yoga", "verses": 35, "main_theme": "self_knowledge"},
    14: {"name": "Gunatraya Vibhaga Yoga", "verses": 27, "main_theme": "self_awareness"},
    15: {"name": "Purusottama Yoga", "verses": 20, "main_theme": "inner_wisdom"},
    16: {"name": "Daivasura Sampad Vibhaga Yoga", "verses": 24, "main_theme": "emotional_regulation"},
    17: {"name": "Sraddhatraya Vibhaga Yoga", "verses": 28, "main_theme": "self_discipline"},
    18: {"name": "Moksa Sanyasa Yoga", "verses": 78, "main_theme": "knowledge_wisdom"},
}

# Theme mappings with mental health applications
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

# Specific verse theme mappings for important verses (overrides)
SPECIFIC_VERSE_THEMES = {
    (2, 14): "impermanence",
    (2, 47): "action_without_attachment",
    (2, 56): "equanimity_in_adversity",
    (2, 62): "control_of_mind",
    (2, 70): "inner_peace",
    (3, 43): "self_knowledge",
    (5, 21): "inner_joy",
    (6, 5): "self_empowerment",
    (6, 35): "mastering_the_mind",
    (6, 36): "practice_and_persistence",
}


def sanitize_english(text: str) -> str:
    """Sanitize religious references to make wisdom universal."""
    if not text:
        return text
    
    replacements = {
        r'\bKrishna\b': 'the teacher',
        r'\bArjuna\b': 'the student',
        r'\bthe Lord\b': 'the wise one',
        r'\bLord\b': 'the wise one',
        r'\bGod\b': 'the divine',
        r'\bthe Supreme\b': 'the highest truth',
        r'\bBhagavan\b': 'the teacher',
        r'\bShree Krishna\b': 'the teacher',
        r'\bMadhusudana\b': 'the teacher',
        r'\bKeshava\b': 'the teacher',
        r'\bJanardana\b': 'the teacher',
        r'\bVarshneya\b': 'the seeker',
        r'\bAcyuta\b': 'the teacher',
        r'\bHrishikesha\b': 'the teacher',
        r'\bGovinda\b': 'the teacher',
        r'\bO mighty-armed\b': 'O seeker',
        r'\bO son of Kunti\b': 'O seeker',
        r'\bO Bharata\b': 'O student',
        r'\bO Partha\b': 'O seeker',
        r'\bO Kaunteya\b': 'O seeker',
        r'\bSanjaya said\b': 'The narrator said',
    }
    
    result = text
    for pattern, replacement in replacements.items():
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    
    return result


def get_theme_for_verse(chapter: int, verse_num: int) -> str:
    """Determine the theme for a specific verse."""
    # Check for specific verse theme overrides
    if (chapter, verse_num) in SPECIFIC_VERSE_THEMES:
        return SPECIFIC_VERSE_THEMES[(chapter, verse_num)]
    
    # Chapter 2 has different themes based on verse ranges
    if chapter == 2:
        if 1 <= verse_num <= 10:
            return "overcoming_grief"
        elif 11 <= verse_num <= 38:
            return "knowledge_wisdom"
        elif 39 <= verse_num <= 53:
            return "action_without_attachment"
        elif 54 <= verse_num <= 72:
            return "equanimity_in_adversity"
    
    # Chapter 6 has different themes
    if chapter == 6:
        if verse_num <= 32:
            return "mastering_the_mind"
        else:
            return "practice_and_persistence"
    
    # Chapter 18 has different sections
    if chapter == 18:
        if verse_num <= 40:
            return "action_without_attachment"
        else:
            return "knowledge_wisdom"
    
    # Default to chapter's main theme
    return CHAPTER_INFO[chapter]["main_theme"]


def extract_translations(verse_data: Dict) -> tuple:
    """Extract English and Hindi translations from API data."""
    english = ""
    hindi = ""
    
    translations = verse_data.get("translations", [])
    
    # Find the best English and Hindi translations
    for trans in translations:
        lang = trans.get("language", "").lower()
        desc = trans.get("description", "").strip()
        
        if lang == "english" and not english:
            # Prefer shorter, clearer translations
            if len(desc) < 500:
                english = desc
        elif lang == "hindi" and not hindi:
            hindi = desc
    
    # If no suitable translation found, use first available
    if not english:
        for trans in translations:
            if trans.get("language", "").lower() == "english":
                english = trans.get("description", "").strip()
                break
    
    if not hindi:
        for trans in translations:
            if trans.get("language", "").lower() == "hindi":
                hindi = trans.get("description", "").strip()
                break
    
    return english, hindi


def create_context_from_commentaries(verse_data: Dict, chapter: int, verse_num: int, theme: str) -> str:
    """Create a concise context from available commentaries."""
    commentaries = verse_data.get("commentaries", [])
    
    # Look for English commentaries
    for comm in commentaries:
        if comm.get("language", "").lower() == "english":
            desc = comm.get("description", "").strip()
            if len(desc) < 500 and len(desc) > 50:
                return sanitize_english(desc[:500])
    
    # Default context if no suitable commentary
    return f"This verse from Chapter {chapter} teaches about {theme.replace('_', ' ')} and provides guidance for mental well-being."


def convert_verse(api_verse: Dict) -> Dict[str, Any]:
    """Convert a single verse from API format to MindVibe format."""
    chapter = api_verse.get("chapter_number", 0)
    verse_num = api_verse.get("verse_number", 0)
    
    # Get theme and applications
    theme = get_theme_for_verse(chapter, verse_num)
    applications = THEME_APPLICATIONS.get(theme, ["self_awareness", "mindfulness"])
    
    # Extract Sanskrit text (remove extra whitespace and newlines)
    sanskrit = api_verse.get("text", "").strip()
    sanskrit = re.sub(r'\s+', ' ', sanskrit)
    
    # Extract translations
    english, hindi = extract_translations(api_verse)
    
    # Sanitize English text
    english_sanitized = sanitize_english(english)
    
    # Create context
    context = create_context_from_commentaries(api_verse, chapter, verse_num, theme)
    
    return {
        "verse_id": f"{chapter}.{verse_num}",
        "chapter": chapter,
        "verse_number": verse_num,
        "theme": theme,
        "english": english_sanitized,
        "hindi": hindi,
        "sanskrit": sanskrit,
        "context": context,
        "mental_health_applications": applications
    }


def load_gita_api_verses(gita_api_path: str) -> List[Dict[str, Any]]:
    """Load all verses from Gita-API repository."""
    all_verses = []
    
    for chapter in range(1, 19):
        verses_file = os.path.join(gita_api_path, "src", "gita", str(chapter), "verses.json")
        
        if not os.path.exists(verses_file):
            print(f"Warning: Chapter {chapter} file not found at {verses_file}")
            continue
        
        with open(verses_file, 'r', encoding='utf-8') as f:
            chapter_verses = json.load(f)
        
        print(f"Processing Chapter {chapter}: {len(chapter_verses)} verses")
        
        for verse_data in chapter_verses:
            converted_verse = convert_verse(verse_data)
            if converted_verse.get("english") and converted_verse.get("sanskrit"):
                all_verses.append(converted_verse)
            else:
                print(f"  Warning: Verse {converted_verse['verse_id']} missing translations")
    
    return all_verses


def main():
    """Main function to convert all verses."""
    print("Converting Bhagavad Gita verses to MindVibe format")
    print("=" * 60)
    
    # Path to Gita-API repository
    gita_api_path = "/tmp/Gita-API"
    
    if not os.path.exists(gita_api_path):
        print(f"Error: Gita-API repository not found at {gita_api_path}")
        print("Please clone it first: git clone https://github.com/shubhankartrivedi/Gita-API.git /tmp/Gita-API")
        return
    
    # Load and convert all verses
    all_verses = load_gita_api_verses(gita_api_path)
    
    print("\n" + "=" * 60)
    print(f"Total verses converted: {len(all_verses)}/700")
    
    # Path to save verses
    output_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'data',
        'wisdom',
        'verses.json'
    )
    
    # Create backup of existing file
    if os.path.exists(output_path):
        backup_path = output_path.replace('.json', '_backup_10verses.json')
        with open(output_path, 'r', encoding='utf-8') as f:
            backup_data = f.read()
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(backup_data)
        print(f"Backup created: {backup_path}")
    
    # Save new data
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_verses, f, ensure_ascii=False, indent=2)
    
    print(f"Verses saved to: {output_path}")
    
    # Print statistics
    themes = {}
    for verse in all_verses:
        theme = verse['theme']
        themes[theme] = themes.get(theme, 0) + 1
    
    print("\nTheme distribution:")
    for theme, count in sorted(themes.items(), key=lambda x: x[1], reverse=True):
        print(f"  {theme}: {count} verses")
    
    # Verify completeness
    print("\nVerifying completeness:")
    for chapter in range(1, 19):
        expected = CHAPTER_INFO[chapter]["verses"]
        actual = len([v for v in all_verses if v["chapter"] == chapter])
        status = "✓" if actual == expected else "✗"
        print(f"  Chapter {chapter}: {actual}/{expected} verses {status}")


if __name__ == "__main__":
    main()
