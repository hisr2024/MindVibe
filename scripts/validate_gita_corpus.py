"""Validator script for Bhagavad Gita corpus JSON files.

This script validates the structure, verse counts, and required fields
of the Gita corpus files located in data/gita/corpus/.

Usage:
    python scripts/validate_gita_corpus.py
"""

import json
import sys
from pathlib import Path

DATA_DIR = Path("data/gita/corpus")
CHAPTER_VERSE_COUNTS = {
    1: 47,
    2: 72,
    3: 43,
    4: 42,
    5: 29,
    6: 47,
    7: 30,
    8: 28,
    9: 34,
    10: 42,
    11: 55,
    12: 20,
    13: 35,
    14: 27,
    15: 20,
    16: 24,
    17: 28,
    18: 78,
}

REQUIRED_FIELDS = [
    "chapter",
    "verse",
    "sanskrit",
    "transliteration",
    "translations",
    "word_by_word",
    "themes",
    "principles",
    "sources",
    "tags",
]


def main() -> None:
    """Validate all chapter files in the corpus directory."""
    errors: list[str] = []
    for ch in range(1, 19):
        file = DATA_DIR / f"{ch:02}.json"
        if not file.exists():
            errors.append(f"Missing file for chapter {ch}: {file}")
            continue
        try:
            verses = json.loads(file.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"Invalid JSON in {file}: {exc}")
            continue

        expected = CHAPTER_VERSE_COUNTS[ch]
        if len(verses) != expected:
            errors.append(f"Chapter {ch} has {len(verses)} verses, expected {expected}")

        seen: set[str] = set()
        for v in verses:
            cid = f"{v.get('chapter')}.{v.get('verse')}"
            if cid in seen:
                errors.append(f"Duplicate verse {cid} in chapter {ch}")
            seen.add(cid)

            # Required field presence (can be empty strings/arrays, but must exist)
            for key in REQUIRED_FIELDS:
                if key not in v:
                    errors.append(f"{cid} missing '{key}'")

            # Minimal content checks
            if not v.get("sanskrit"):
                errors.append(f"{cid} missing 'sanskrit' content")
            en = v.get("translations", {}).get("en")
            if not en:
                errors.append(f"{cid} missing 'translations.en'")

    if errors:
        print("Validation failed:")
        for err in errors:
            print(" -", err)
        sys.exit(1)

    print("Corpus validation passed.")
    sys.exit(0)


if __name__ == "__main__":
    main()
