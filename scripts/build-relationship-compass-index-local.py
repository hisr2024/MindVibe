#!/usr/bin/env python3
"""Build sqlite index for Relationship Compass Gita RAG - Local version without embeddings.

This version creates a keyword-searchable index without requiring OpenAI embeddings.
It uses TF-IDF style keyword matching for retrieval.
"""
from __future__ import annotations

import json
import os
import re
import sqlite3
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

DATA_ROOT = Path("data")
GITA_SOURCE = DATA_ROOT / "gita" / "gita_verses_complete.json"
INDEX_DIR = DATA_ROOT / "relationship_compass"
INDEX_PATH = INDEX_DIR / "gita_index.sqlite"


# Relationship-relevant keywords for scoring
RELATIONSHIP_KEYWORDS = {
    "anger": 2.0, "krodha": 2.0, "forgiveness": 2.0, "kshama": 2.0,
    "compassion": 2.0, "daya": 2.0, "karuna": 2.0,
    "truth": 1.5, "satya": 1.5, "speech": 1.5,
    "self-control": 2.0, "control": 1.5, "mind": 1.5,
    "ego": 2.0, "ahamkara": 2.0,
    "equanimity": 2.0, "sama": 1.5, "equal": 1.5,
    "attachment": 2.0, "raga": 1.5, "detachment": 2.0,
    "duty": 1.5, "dharma": 2.0, "svadharma": 2.0,
    "fear": 1.5, "bhaya": 1.5, "fearless": 1.5,
    "jealousy": 1.5, "envy": 1.5,
    "resentment": 1.5, "hatred": 1.5, "dvesha": 1.5,
    "non-harm": 2.0, "ahimsa": 2.0, "nonviolence": 2.0,
    "steadiness": 1.5, "patience": 1.5, "peace": 1.5,
    "love": 2.0, "prema": 1.5, "affection": 1.5,
    "relationship": 2.0, "family": 1.5, "friend": 1.5,
    "sorrow": 1.5, "grief": 1.5, "suffering": 1.5, "dukha": 1.5,
    "liberation": 1.5, "moksha": 1.5, "freedom": 1.5,
    "wisdom": 1.5, "jnana": 1.5, "knowledge": 1.5,
    "action": 1.5, "karma": 1.5, "work": 1.5,
    "surrender": 1.5, "devotion": 1.5, "bhakti": 1.5,
    "conflict": 2.0, "battle": 1.0, "war": 1.0,
    "emotion": 1.5, "feeling": 1.5, "heart": 1.5,
    "desire": 1.5, "kama": 1.5, "craving": 1.5,
    "renunciation": 1.5, "tyaga": 1.5, "letting": 1.5,
    "self": 1.5, "atman": 2.0, "soul": 1.5,
    "meditation": 1.5, "yoga": 1.5, "discipline": 1.5,
}


@dataclass
class VerseEntry:
    chapter: int
    verse: int
    text: str
    commentary: str
    tags: list[str]
    language: str
    entry_type: str
    keywords: list[str]


def extract_keywords(text: str) -> list[str]:
    """Extract keywords from text for indexing."""
    # Lowercase and split
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    # Count frequency
    word_counts = Counter(words)
    # Filter common stop words
    stop_words = {
        'the', 'and', 'for', 'that', 'this', 'with', 'are', 'was', 'were',
        'been', 'being', 'have', 'has', 'had', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
        'from', 'into', 'upon', 'about', 'after', 'before', 'between', 'under',
        'over', 'such', 'than', 'too', 'very', 'just', 'only', 'also', 'even',
        'said', 'says', 'one', 'two', 'three', 'who', 'what', 'which', 'where',
        'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
        'most', 'other', 'some', 'any', 'not', 'nor', 'but', 'yet', 'still',
        'then', 'thus', 'here', 'there', 'their', 'them', 'they', 'these',
        'those', 'your', 'you', 'his', 'her', 'him', 'its', 'own', 'same',
    }
    keywords = [word for word, count in word_counts.items()
                if word not in stop_words and count >= 1]
    return keywords


def load_gita_entries() -> list[VerseEntry]:
    if not GITA_SOURCE.exists():
        raise FileNotFoundError(f"Missing Gita corpus at {GITA_SOURCE}")

    raw = json.loads(GITA_SOURCE.read_text(encoding="utf-8"))
    entries: list[VerseEntry] = []

    for item in raw:
        if not isinstance(item, dict):
            continue
        chapter = int(item.get("chapter") or 0)
        verse = int(item.get("verse") or 0)
        english = (item.get("english") or "").strip()
        hindi = (item.get("hindi") or "").strip()
        transliteration = (item.get("transliteration") or "").strip()
        word_meanings = (item.get("word_meanings") or "").strip()
        theme = (item.get("theme") or "").strip()
        principle = (item.get("principle") or "").strip()
        mental_tags = item.get("mental_health_applications") or []
        tags = [tag for tag in mental_tags if isinstance(tag, str) and tag.strip()]
        if theme:
            tags.append(theme)

        verse_lines = [f"Bhagavad Gita {chapter}.{verse}"]
        if english:
            verse_lines.append(f"English: {english}")
        if hindi:
            verse_lines.append(f"Hindi: {hindi}")
        if transliteration:
            verse_lines.append(f"Transliteration: {transliteration}")
        if word_meanings:
            verse_lines.append(f"Word meanings: {word_meanings}")

        commentary_parts = []
        if theme:
            commentary_parts.append(f"Theme: {theme}")
        if principle:
            commentary_parts.append(f"Principle: {principle}")
        commentary = " ".join(commentary_parts).strip()

        text = "\n".join([line for line in verse_lines if line.strip()])

        # Extract keywords from all text fields
        all_text = f"{english} {word_meanings} {theme} {principle} {' '.join(tags)}"
        keywords = extract_keywords(all_text)

        entries.append(
            VerseEntry(
                chapter=chapter,
                verse=verse,
                text=text,
                commentary=commentary,
                tags=tags,
                language="multi",
                entry_type="verse",
                keywords=keywords,
            )
        )

    return entries


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS gita_chunks (
            chunk_id TEXT PRIMARY KEY,
            chapter TEXT,
            verse TEXT,
            source_file TEXT,
            tags TEXT,
            language TEXT,
            chunk_type TEXT,
            text TEXT,
            commentary TEXT,
            embedding TEXT,
            keywords TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_gita_chunks_keywords ON gita_chunks(keywords);
        CREATE INDEX IF NOT EXISTS idx_gita_chunks_tags ON gita_chunks(tags);
        DELETE FROM gita_chunks;
        DELETE FROM metadata;
        """
    )
    conn.commit()


def save_entries(conn: sqlite3.Connection, entries: list[VerseEntry]) -> None:
    import datetime
    conn.execute("INSERT INTO metadata (key, value) VALUES (?, ?)", ("model", "keyword-local"))
    conn.execute("INSERT INTO metadata (key, value) VALUES (?, ?)", ("created_at", datetime.datetime.utcnow().isoformat()))
    conn.execute("INSERT INTO metadata (key, value) VALUES (?, ?)", ("version", "1.0"))
    conn.execute("INSERT INTO metadata (key, value) VALUES (?, ?)", ("index_type", "keyword"))

    for entry in entries:
        chunk_id = f"rc_verse_{entry.chapter}_{entry.verse}"
        conn.execute(
            """
            INSERT INTO gita_chunks (
                chunk_id, chapter, verse, source_file, tags, language, chunk_type, text, commentary, embedding, keywords
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                chunk_id,
                str(entry.chapter),
                f"{entry.chapter}:{entry.verse}",
                str(GITA_SOURCE),
                json.dumps(entry.tags),
                entry.language,
                entry.entry_type,
                entry.text,
                entry.commentary,
                json.dumps([]),  # Empty embedding for keyword-based index
                json.dumps(entry.keywords),
            ),
        )
    conn.commit()


def main() -> None:
    print("Loading Gita verses...")
    entries = load_gita_entries()
    if not entries:
        raise RuntimeError("No Gita entries loaded.")
    print(f"Loaded {len(entries)} verses")

    INDEX_DIR.mkdir(parents=True, exist_ok=True)

    if INDEX_PATH.exists():
        INDEX_PATH.unlink()

    conn = sqlite3.connect(INDEX_PATH)
    try:
        print("Initializing database...")
        init_db(conn)
        print("Saving entries...")
        save_entries(conn, entries)
    finally:
        conn.close()

    print(f"Saved Relationship Compass index to {INDEX_PATH}")
    print(f"Index contains {len(entries)} verses with keyword-based retrieval")


if __name__ == "__main__":
    main()
