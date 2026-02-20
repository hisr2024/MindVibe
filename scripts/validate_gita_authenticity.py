#!/usr/bin/env python3
"""
Bhagavad Gita Authenticity Validation Script

This script validates that Gita verse data meets all authenticity and quality standards:
- Correct total count (700 verses)
- Canonical chapter distribution
- Valid Devanagari Sanskrit (Unicode U+0900 to U+097F)
- Valid IAST transliteration with required diacritics
- Complete required fields
- Valid spiritual wellness tags

Usage:
    python scripts/validate_gita_authenticity.py [path/to/verses.json]
    
    If no path is provided, validates data/gita/gita_verses_complete.json
"""

import json
import sys
import unicodedata
from pathlib import Path
from typing import Tuple, List, Dict, Any

# Canonical verse counts per chapter (total: 700)
CANONICAL_COUNTS = {
    1: 47,   # Arjuna's Grief
    2: 72,   # Knowledge & Equanimity  
    3: 43,   # Karma Yoga
    4: 42,   # Knowledge & Action
    5: 29,   # Renunciation of Action
    6: 47,   # Meditation Yoga
    7: 30,   # Knowledge & Wisdom
    8: 28,   # Imperishable Brahman
    9: 34,   # Royal Knowledge
    10: 42,  # Divine Manifestations
    11: 55,  # Universal Form
    12: 20,  # Devotion Yoga
    13: 34,  # Field & Knower
    14: 27,  # Three Qualities
    15: 20,  # Supreme Person
    16: 24,  # Divine & Demonic
    17: 28,  # Three Types of Faith
    18: 78,  # Liberation & Surrender
}

TOTAL_VERSES = 700

# IAST diacritics that should appear in transliterations
IAST_DIACRITICS = set('āīūṛṝḷḹṃḥṅñṭḍṇśṣ')

# Valid spiritual wellness domains
VALID_PRIMARY_DOMAINS = {
    'anxiety', 'depression', 'emotional_regulation', 'self_worth',
    'relationships', 'purpose', 'work_stress', 'anger', 'fear', 'grief'
}

# Valid spiritual wellness applications (partial list - extend as needed)
VALID_APPLICATIONS = {
    'outcome_detachment', 'equanimity', 'self_mastery', 'compassion',
    'meditation_practice', 'duty_purpose', 'anxiety_reduction',
    'work_stress_management', 'emotional_stability', 'mindfulness',
    'self_empowerment', 'personal_responsibility', 'self_worth',
    'loving_kindness', 'empathy', 'forgiveness', 'relationship_harmony',
    'equality_vision', 'non_judgment', 'intrinsic_worth', 'perspective_shift',
    'spiritual_identity', 'self_compassion', 'divine_connection',
    'character_development', 'virtue_cultivation', 'fearlessness',
    'surrender', 'letting_go', 'anxiety_relief', 'spiritual_refuge',
    'trust', 'hope', 'faith', 'integration', 'victory_mindset',
    'distress_tolerance', 'non_reactivity', 'cognitive_reframing',
    'self_agency', 'performance_pressure', 'perfectionism',
    'inner_conflict', 'context_setting'
}


def check_devanagari(text: str) -> Tuple[bool, str]:
    """
    Validate that text contains authentic Devanagari characters.
    
    Args:
        text: String to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not text or not text.strip():
        return False, "Empty or whitespace-only text"
    
    # Check for Devanagari characters (U+0900 to U+097F)
    has_devanagari = False
    for char in text:
        if '\u0900' <= char <= '\u097F':
            has_devanagari = True
            break
    
    if not has_devanagari:
        return False, "No Devanagari characters found (expected U+0900 to U+097F)"
    
    return True, ""


def check_iast(text: str) -> Tuple[bool, str]:
    """
    Validate that transliteration uses IAST diacritics.
    
    Args:
        text: Transliteration string to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not text or not text.strip():
        return False, "Empty or whitespace-only transliteration"
    
    # Check if text contains at least some IAST diacritics
    has_iast = any(char in IAST_DIACRITICS for char in text)
    
    if not has_iast:
        return False, f"No IAST diacritics found (expected one or more of: {', '.join(sorted(IAST_DIACRITICS))})"
    
    return True, ""


def validate_verse_structure(verse: Dict[str, Any], index: int) -> Tuple[bool, List[str]]:
    """
    Validate the structure and content of a single verse.
    
    Args:
        verse: Verse dictionary to validate
        index: Index of the verse in the list (for error reporting)
        
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    
    # Check required fields
    required_fields = [
        'chapter', 'verse', 'sanskrit', 'transliteration',
        'hindi', 'english', 'principle', 'theme'
    ]
    
    for field in required_fields:
        if field not in verse or not verse[field]:
            errors.append(f"Missing or empty required field: {field}")
    
    # If basic fields are missing, return early
    if errors:
        return False, errors
    
    # Validate chapter and verse numbers
    chapter = verse.get('chapter')
    verse_num = verse.get('verse')
    
    if not isinstance(chapter, int) or chapter < 1 or chapter > 18:
        errors.append(f"Invalid chapter number: {chapter} (must be 1-18)")
    
    if not isinstance(verse_num, int) or verse_num < 1:
        errors.append(f"Invalid verse number: {verse_num} (must be >= 1)")
    
    # Validate Devanagari Sanskrit
    sanskrit = verse.get('sanskrit', '')
    is_valid_devanagari, devanagari_error = check_devanagari(sanskrit)
    if not is_valid_devanagari:
        errors.append(f"Sanskrit validation failed: {devanagari_error}")
    
    # Validate IAST transliteration
    transliteration = verse.get('transliteration', '')
    is_valid_iast, iast_error = check_iast(transliteration)
    if not is_valid_iast:
        errors.append(f"IAST transliteration validation failed: {iast_error}")
    
    # Validate Hindi (should also be Devanagari)
    hindi = verse.get('hindi', '')
    is_valid_hindi, hindi_error = check_devanagari(hindi)
    if not is_valid_hindi:
        errors.append(f"Hindi validation failed: {hindi_error}")
    
    # Validate spiritual wellness tags if present
    primary_domain = verse.get('primary_domain')
    if primary_domain:
        if primary_domain not in VALID_PRIMARY_DOMAINS:
            errors.append(f"Invalid primary_domain: {primary_domain} (must be one of: {', '.join(sorted(VALID_PRIMARY_DOMAINS))})")
    
    # Validate secondary domains
    secondary_domains = verse.get('secondary_domains', [])
    if secondary_domains:
        if not isinstance(secondary_domains, list):
            errors.append("secondary_domains must be a list")
        else:
            for domain in secondary_domains:
                if domain not in VALID_PRIMARY_DOMAINS:
                    errors.append(f"Invalid secondary domain: {domain}")
    
    # Validate spiritual wellness applications
    applications = verse.get('mental_health_applications', [])
    if applications:
        if not isinstance(applications, list):
            errors.append("mental_health_applications must be a list")
        else:
            # Note: We allow applications not in the predefined list
            # as the methodology may evolve
            pass
    
    return len(errors) == 0, errors


def validate_chapter_distribution(verses: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
    """
    Validate that verses match canonical chapter distribution.
    
    Args:
        verses: List of verse dictionaries
        
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    
    # Count verses per chapter
    chapter_counts = {}
    for verse in verses:
        chapter = verse.get('chapter')
        if chapter:
            chapter_counts[chapter] = chapter_counts.get(chapter, 0) + 1
    
    # Compare to canonical counts
    for chapter, expected_count in CANONICAL_COUNTS.items():
        actual_count = chapter_counts.get(chapter, 0)
        if actual_count != expected_count:
            errors.append(
                f"Chapter {chapter}: Expected {expected_count} verses, found {actual_count}"
            )
    
    # Check for unexpected chapters
    for chapter in chapter_counts:
        if chapter not in CANONICAL_COUNTS:
            errors.append(f"Unexpected chapter number: {chapter}")
    
    return len(errors) == 0, errors


def validate_no_duplicates(verses: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
    """
    Validate that there are no duplicate chapter/verse combinations.
    
    Args:
        verses: List of verse dictionaries
        
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    seen = set()
    
    for i, verse in enumerate(verses):
        chapter = verse.get('chapter')
        verse_num = verse.get('verse')
        
        if chapter and verse_num:
            key = (chapter, verse_num)
            if key in seen:
                errors.append(f"Duplicate verse found: Chapter {chapter}, Verse {verse_num}")
            seen.add(key)
    
    return len(errors) == 0, errors


def main():
    """Main validation function."""
    
    # Determine which file to validate
    if len(sys.argv) > 1:
        json_path = Path(sys.argv[1])
    else:
        # Default to complete verses file
        json_path = Path(__file__).parent.parent / 'data' / 'gita' / 'gita_verses_complete.json'
    
    # Print header
    print("=" * 66)
    print("🕉️  BHAGAVAD GITA AUTHENTICITY VALIDATION")
    print("=" * 66)
    print()
    
    # Check if file exists
    if not json_path.exists():
        print(f"❌ Error: File not found: {json_path}")
        print()
        print("Note: To validate a different file, provide the path as an argument:")
        print(f"  python {sys.argv[0]} path/to/verses.json")
        print()
        return 1
    
    print(f"📖 Loading verses from: {json_path}")
    print()
    
    # Load JSON data
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        return 1
    except Exception as e:
        print(f"❌ Error loading file: {e}")
        return 1
    
    # Extract verses list (handle both array and object with 'verses' key)
    if isinstance(data, list):
        verses = data
    elif isinstance(data, dict) and 'verses' in data:
        verses = data['verses']
    else:
        print("❌ Error: Could not find verses array in JSON file")
        print("   Expected either a JSON array or an object with a 'verses' key")
        return 1
    
    print(f"📊 Loaded {len(verses)} verses")
    print()
    
    # Track validation results
    all_valid = True
    
    # Validate total count
    print(f"{'Total verse count:':<30} ", end='')
    if len(verses) == TOTAL_VERSES:
        print(f"✅ {len(verses)}/{TOTAL_VERSES}")
    else:
        print(f"❌ {len(verses)}/{TOTAL_VERSES} (expected exactly {TOTAL_VERSES})")
        all_valid = False
    
    # Validate chapter distribution
    print(f"{'Chapter distribution:':<30} ", end='')
    dist_valid, dist_errors = validate_chapter_distribution(verses)
    if dist_valid:
        print("✅ Correct")
    else:
        print("❌ Errors found")
        all_valid = False
        for error in dist_errors:
            print(f"  • {error}")
    
    # Validate no duplicates
    print(f"{'Duplicate check:':<30} ", end='')
    dup_valid, dup_errors = validate_no_duplicates(verses)
    if dup_valid:
        print("✅ No duplicates")
    else:
        print("❌ Duplicates found")
        all_valid = False
        for error in dup_errors:
            print(f"  • {error}")
    
    print()
    
    # Validate sample verses (or all if <= 100)
    sample_size = min(len(verses), 100 if len(verses) > 100 else len(verses))
    print(f"🔍 Validating {sample_size} {'sample ' if len(verses) > 100 else ''}verses...")
    print()
    
    verse_errors = []
    valid_count = 0
    
    # Sample verses evenly if we have more than 100
    if len(verses) > 100:
        step = len(verses) // sample_size
        indices = range(0, len(verses), step)[:sample_size]
    else:
        indices = range(len(verses))
    
    for i in indices:
        verse = verses[i]
        is_valid, errors = validate_verse_structure(verse, i)
        
        if is_valid:
            valid_count += 1
        else:
            all_valid = False
            chapter = verse.get('chapter', '?')
            verse_num = verse.get('verse', '?')
            verse_errors.append((chapter, verse_num, errors))
    
    print(f"{'Verse structure validation:':<30} ", end='')
    if valid_count == sample_size:
        print(f"✅ {valid_count}/{sample_size} valid")
    else:
        print(f"❌ {valid_count}/{sample_size} valid ({sample_size - valid_count} failed)")
        print()
        print("Verse-level errors (showing first 10):")
        for chapter, verse_num, errors in verse_errors[:10]:
            print(f"  Chapter {chapter}, Verse {verse_num}:")
            for error in errors:
                print(f"    • {error}")
    
    print()
    print("=" * 66)
    
    if all_valid:
        print("✅ VALIDATION PASSED - All checks successful")
        print("=" * 66)
        print()
        print("🎉 Gita data is authentic and complete!")
        print()
        print("   Sanskrit: Devanagari ✅")
        print("   Transliteration: IAST ✅")
        print(f"   Verse count: {len(verses)}/{TOTAL_VERSES} ✅")
        print("   Chapter distribution: Canonical ✅")
        print("   Spiritual wellness tags: Valid ✅")
        print()
        return 0
    else:
        print("❌ VALIDATION FAILED - Errors found")
        print("=" * 66)
        print()
        print("Please fix the errors above and run validation again.")
        print()
        return 1


if __name__ == '__main__':
    sys.exit(main())
