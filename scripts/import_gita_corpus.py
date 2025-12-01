import json
import os
from pathlib import Path
from typing import Any

import psycopg2
from psycopg2.extras import execute_batch

DATA_DIR = Path("data/gita/corpus")


def load_chapter_file(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def validate_verse_shape(v: dict[str, Any]) -> tuple[bool, list[str]]:
    errors = []
    req = ["chapter", "verse", "sanskrit", "translations"]
    for k in req:
        if k not in v:
            errors.append(f"Missing required field: {k}")
    if not isinstance(v.get("translations"), dict) or "en" not in v["translations"]:
        errors.append("translations.en required")
    return (len(errors) == 0), errors


def normalize(v: dict[str, Any]) -> dict[str, Any]:
    v.setdefault("themes", [])
    v.setdefault("principles", [])
    v.setdefault("sources", [])
    v.setdefault("tags", [])
    v.setdefault("transliteration", "")
    v.setdefault("word_by_word", [])
    return v


def upsert_verses(
    conn: "psycopg2.extensions.connection", verses: list[dict[str, Any]]
) -> None:
    sql = """
    INSERT INTO gita_verses
      (chapter, verse, sanskrit, transliteration, hindi, english, word_meanings, principle, theme, source_id)
    VALUES
      (%s,%s,%s,%s,%s,%s,%s,%s,%s,NULL)
    ON CONFLICT (chapter, verse) DO UPDATE SET
      sanskrit=EXCLUDED.sanskrit,
      transliteration=EXCLUDED.transliteration,
      hindi=EXCLUDED.hindi,
      english=EXCLUDED.english,
      word_meanings=EXCLUDED.word_meanings,
      principle=EXCLUDED.principle,
      theme=EXCLUDED.theme;
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


def main():
    chapter_files = sorted(DATA_DIR.glob("*.json"))
    if not chapter_files:
        raise SystemExit(f"No chapter files found in {DATA_DIR}")

    conn = psycopg2.connect(os.environ["DATABASE_URL"])

    total, invalid = 0, 0
    for f in chapter_files:
        verses = load_chapter_file(f)
        valid_batch = []
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


if __name__ == "__main__":
    main()
