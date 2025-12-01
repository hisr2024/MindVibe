"""Importer script for Bhagavad Gita corpus into the database.

This script performs an idempotent upsert of verse data from JSON files
into the gita_verses table.

Usage:
    DATABASE_URL="postgresql://..." python scripts/import_gita_corpus.py
"""

import json
import os
from pathlib import Path
from typing import Any

import psycopg2
from psycopg2.extras import execute_batch

DATA_DIR = Path("data/gita/corpus")


def load_chapter_file(path: Path) -> list[dict[str, Any]]:
    """Load and parse a chapter JSON file."""
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def validate_verse_shape(v: dict[str, Any]) -> tuple[bool, list[str]]:
    """Validate that a verse has all required fields."""
    errors: list[str] = []
    req = ["chapter", "verse", "sanskrit", "translations"]
    for k in req:
        if k not in v:
            errors.append(f"Missing required field: {k}")
    if not isinstance(v.get("translations"), dict) or "en" not in v["translations"]:
        errors.append("translations.en required")
    return (len(errors) == 0), errors


def normalize(v: dict[str, Any]) -> dict[str, Any]:
    """Normalize verse data by setting default values for optional fields."""
    v.setdefault("themes", [])
    v.setdefault("principles", [])
    v.setdefault("sources", [])
    v.setdefault("tags", [])
    v.setdefault("transliteration", "")
    v.setdefault("word_by_word", [])
    return v


def ensure_unique_constraint(conn: psycopg2.extensions.connection) -> None:
    """Ensure the unique constraint on (chapter, verse) exists.

    This is a one-time setup that should ideally be in a migration,
    but is included here for robustness during imports.
    """
    ensure_unique_constraint_sql = """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'uq_gita_verses_chapter_verse'
        ) THEN
            ALTER TABLE gita_verses
            ADD CONSTRAINT uq_gita_verses_chapter_verse UNIQUE (chapter, verse);
        END IF;
    END $$;
    """
    with conn.cursor() as cur:
        cur.execute(ensure_unique_constraint_sql)
    conn.commit()


def upsert_verses(
    conn: psycopg2.extensions.connection, verses: list[dict[str, Any]]
) -> None:
    """Upsert verses into the gita_verses table.

    Note: Requires ensure_unique_constraint() to be called first.
    """
    sql = """
    INSERT INTO gita_verses
      (chapter, verse, sanskrit, transliteration, hindi, english,
       word_meanings, principle, theme, source_id)
    VALUES
      (%s, %s, %s, %s, %s, %s, %s, %s, %s, NULL)
    ON CONFLICT (chapter, verse) DO UPDATE SET
      sanskrit = EXCLUDED.sanskrit,
      transliteration = EXCLUDED.transliteration,
      hindi = EXCLUDED.hindi,
      english = EXCLUDED.english,
      word_meanings = EXCLUDED.word_meanings,
      principle = EXCLUDED.principle,
      theme = EXCLUDED.theme,
      updated_at = CURRENT_TIMESTAMP;
    """
    params = []
    for v in verses:
        params.append(
            (
                v["chapter"],
                v["verse"],
                v.get("sanskrit", ""),
                v.get("transliteration", ""),
                v.get("translations", {}).get("hi", ""),
                v.get("translations", {}).get("en", ""),
                json.dumps(v.get("word_by_word", []), ensure_ascii=False),
                ", ".join(v.get("principles", [])),
                ", ".join(v.get("themes", [])),
            )
        )
    with conn.cursor() as cur:
        execute_batch(cur, sql, params, page_size=500)
    conn.commit()


def main() -> None:
    """Main entry point for the importer."""
    chapter_files = sorted(DATA_DIR.glob("*.json"))
    if not chapter_files:
        raise SystemExit(f"No chapter files found in {DATA_DIR}")

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URL environment variable is required")

    conn = psycopg2.connect(database_url)
    try:
        # Ensure unique constraint for ON CONFLICT to work
        ensure_unique_constraint(conn)

        total, invalid = 0, 0
        for f in chapter_files:
            verses = load_chapter_file(f)
            valid_batch: list[dict[str, Any]] = []
            for v in verses:
                total += 1
                v = normalize(v)
                ok, errs = validate_verse_shape(v)
                if not ok:
                    invalid += 1
                    print(
                        f"[INVALID] {v.get('chapter')}.{v.get('verse')} in {f.name}: {errs}"
                    )
                else:
                    valid_batch.append(v)
            if valid_batch:
                upsert_verses(conn, valid_batch)

        print(f"Processed: {total}, invalid: {invalid}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
