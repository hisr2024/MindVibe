#!/usr/bin/env python3
"""
Synchronize Authentic Gita Verses

This script updates the gita_verses_complete.json with authentic verse content
from the manually curated gitaVerses.ts file.

The gitaVerses.ts contains ~40 key verses with:
- Authentic Sanskrit text (Devanagari)
- Correct IAST transliteration
- Accurate English translations
- Hindi translations
- Themes and reflections

Run this script after adding new authentic verses to gitaVerses.ts to sync them
to the JSON database used by the backend.

Usage:
    python scripts/sync_authentic_gita_verses.py

Note:
    This only updates verses that have authentic content. Placeholder verses
    (those with just "॥ X.Y ॥" as Sanskrit) remain unchanged.
"""

import json
import os
import re
import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def parse_typescript_verses(ts_content: str) -> list[dict]:
    """Extract verse data from gitaVerses.ts TypeScript file."""
    verses = []

    # Find the KEY_VERSES array
    key_verses_match = re.search(
        r'export const KEY_VERSES.*?=\s*\[(.*?)\];',
        ts_content,
        re.DOTALL
    )

    if not key_verses_match:
        print("Warning: Could not find KEY_VERSES in gitaVerses.ts")
        return verses

    verses_content = key_verses_match.group(1)

    # Parse individual verse objects
    verse_pattern = re.compile(
        r'\{\s*'
        r'id:\s*(\d+),\s*'
        r'chapter:\s*(\d+),\s*'
        r'verse:\s*(\d+),\s*'
        r"sanskrit:\s*['\"]([^'\"]*)['\"],\s*"
        r"transliteration:\s*['\"]([^'\"]*)['\"],\s*"
        r"english:\s*['\"]([^'\"]*)['\"],\s*"
        r"hindi:\s*['\"]([^'\"]*)['\"],\s*"
        r'themes:\s*\[([^\]]*)\],\s*'
        r'keywords:\s*\[([^\]]*)\]'
        r'(?:,\s*reflection:\s*[\'"]([^\'"]*)[\'"]\s*)?',
        re.DOTALL
    )

    for match in verse_pattern.finditer(verses_content):
        # Parse themes array
        themes_str = match.group(8)
        themes = [
            t.strip().strip("'\"")
            for t in themes_str.split(',')
            if t.strip()
        ]

        # Parse keywords array
        keywords_str = match.group(9)
        keywords = [
            k.strip().strip("'\"")
            for k in keywords_str.split(',')
            if k.strip()
        ]

        verse = {
            'id': int(match.group(1)),
            'chapter': int(match.group(2)),
            'verse': int(match.group(3)),
            'sanskrit': match.group(4),
            'transliteration': match.group(5),
            'english': match.group(6),
            'hindi': match.group(7),
            'themes': themes,
            'keywords': keywords,
            'reflection': match.group(10) if match.group(10) else None,
        }
        verses.append(verse)

    return verses


def is_placeholder_verse(verse: dict) -> bool:
    """Check if a verse has placeholder content."""
    sanskrit = verse.get('sanskrit', '')
    # Placeholder verses have just the verse number marker like "॥ 2.1 ॥"
    return re.match(r'^॥\s*\d+\.\d+\s*॥$', sanskrit.strip()) is not None


def sync_verses(authentic_verses: list[dict], json_verses: list[dict]) -> tuple[int, int]:
    """
    Sync authentic verses into JSON verses list.

    Returns:
        Tuple of (updated_count, total_authentic)
    """
    # Create lookup by (chapter, verse)
    authentic_lookup = {
        (v['chapter'], v['verse']): v
        for v in authentic_verses
    }

    updated = 0
    for json_verse in json_verses:
        key = (json_verse['chapter'], json_verse['verse'])
        if key in authentic_lookup:
            auth = authentic_lookup[key]

            # Update with authentic content
            json_verse['sanskrit'] = auth['sanskrit']
            json_verse['transliteration'] = auth['transliteration']
            json_verse['english'] = auth['english']
            json_verse['hindi'] = auth['hindi']

            # Merge themes if authentic has them
            if auth.get('themes'):
                existing_themes = json_verse.get('mental_health_applications', [])
                json_verse['mental_health_applications'] = list(set(
                    existing_themes + auth['themes']
                ))

            updated += 1

    return updated, len(authentic_verses)


def main():
    """Main sync function."""
    print("=" * 60)
    print("Gita Verses Synchronization Script")
    print("=" * 60)

    # Paths
    authentic_json_path = PROJECT_ROOT / 'data' / 'authentic_key_verses.json'
    json_path = PROJECT_ROOT / 'data' / 'gita' / 'gita_verses_complete.json'

    # Check files exist
    if not authentic_json_path.exists():
        print(f"Error: {authentic_json_path} not found")
        return 1

    if not json_path.exists():
        print(f"Error: {json_path} not found")
        return 1

    # Load authentic verses from JSON
    print(f"\nReading authentic verses from: {authentic_json_path}")
    with open(authentic_json_path, 'r', encoding='utf-8') as f:
        authentic_verses = json.load(f)
    print(f"Found {len(authentic_verses)} authentic verses")

    # Load JSON file
    print(f"\nReading JSON database from: {json_path}")
    with open(json_path, 'r', encoding='utf-8') as f:
        json_verses = json.load(f)
    print(f"Found {len(json_verses)} total verses in JSON database")

    # Count placeholders
    placeholder_count = sum(1 for v in json_verses if is_placeholder_verse(v))
    authentic_json_count = len(json_verses) - placeholder_count
    print(f"  - {authentic_json_count} with authentic content")
    print(f"  - {placeholder_count} with placeholder content")

    # Sync
    print("\nSynchronizing...")
    updated, total_auth = sync_verses(authentic_verses, json_verses)
    print(f"Updated {updated} verses with authentic content")

    # Write back
    print(f"\nWriting updated JSON to: {json_path}")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(json_verses, f, ensure_ascii=False, indent=2)

    # Final stats
    new_placeholder_count = sum(1 for v in json_verses if is_placeholder_verse(v))
    new_authentic_count = len(json_verses) - new_placeholder_count

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total verses in database: {len(json_verses)}")
    print(f"Verses with authentic content: {new_authentic_count}")
    print(f"Verses with placeholder content: {new_placeholder_count}")
    print(f"Coverage: {new_authentic_count / len(json_verses) * 100:.1f}%")

    if new_placeholder_count > 0:
        print(f"\nNOTE: {new_placeholder_count} verses still have placeholder content.")
        print("To add more authentic verses:")
        print("  1. Add verses to data/gitaVerses.ts")
        print("  2. Run this script again")
        print("  3. Or use an external Gita API to fetch verses")

    return 0


if __name__ == '__main__':
    sys.exit(main())
