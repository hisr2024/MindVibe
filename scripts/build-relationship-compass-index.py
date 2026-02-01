#!/usr/bin/env python3
"""Build sqlite vector index for Relationship Compass Gita RAG."""
from __future__ import annotations

import json
import os
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import tiktoken
from openai import OpenAI

DATA_ROOT = Path("data")
GITA_SOURCE = DATA_ROOT / "gita" / "gita_verses_complete.json"
INDEX_DIR = DATA_ROOT / "relationship_compass"
INDEX_PATH = INDEX_DIR / "gita_index.sqlite"

EMBEDDING_MODEL = os.getenv("RELATIONSHIP_COMPASS_EMBEDDING_MODEL", "text-embedding-3-small")
CHUNK_MIN_TOKENS = 300
CHUNK_MAX_TOKENS = 800
CHUNK_OVERLAP_TOKENS = 80


@dataclass
class VerseEntry:
    chapter: int
    verse: int
    text: str
    commentary: str
    tags: list[str]
    language: str
    entry_type: str
    token_count: int


@dataclass
class Chunk:
    chunk_id: str
    chapter: str
    verse: str
    source_file: str
    tags: list[str]
    language: str
    chunk_type: str
    text: str
    commentary: str
    embedding: list[float]


def load_gita_entries(encoding: tiktoken.Encoding) -> list[VerseEntry]:
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
        token_count = len(encoding.encode(text))

        entries.append(
            VerseEntry(
                chapter=chapter,
                verse=verse,
                text=text,
                commentary=commentary,
                tags=tags,
                language="multi",
                entry_type="verse",
                token_count=token_count,
            )
        )

    return entries


def build_chunks(entries: list[VerseEntry], encoding: tiktoken.Encoding, source_file: str) -> list[Chunk]:
    chunks: list[Chunk] = []
    start = 0
    chunk_index = 1

    while start < len(entries):
        total_tokens = 0
        end = start

        while end < len(entries) and total_tokens + entries[end].token_count <= CHUNK_MAX_TOKENS:
            total_tokens += entries[end].token_count
            end += 1

        if total_tokens < CHUNK_MIN_TOKENS and end < len(entries):
            total_tokens += entries[end].token_count
            end += 1

        if end == start:
            end = start + 1

        window = entries[start:end]
        chapter_refs = [f"{entry.chapter}" for entry in window]
        verse_refs = [f"{entry.chapter}:{entry.verse}" for entry in window]
        tags = sorted({tag for entry in window for tag in entry.tags})
        text = "\n\n".join(entry.text for entry in window)
        commentary = "\n".join(filter(None, (entry.commentary for entry in window)))

        chunks.append(
            Chunk(
                chunk_id=f"rc_chunk_{chunk_index}",
                chapter=", ".join(sorted(set(chapter_refs))),
                verse=", ".join(verse_refs),
                source_file=source_file,
                tags=tags,
                language="multi",
                chunk_type="verse",
                text=text,
                commentary=commentary,
                embedding=[],
            )
        )
        chunk_index += 1

        overlap_tokens = 0
        overlap_entries = 0
        for idx in range(end - 1, start - 1, -1):
            overlap_tokens += entries[idx].token_count
            overlap_entries += 1
            if overlap_tokens >= CHUNK_OVERLAP_TOKENS:
                break

        start = max(start + 1, end - overlap_entries)

    return chunks


def embed_chunks(chunks: list[Chunk]) -> list[list[float]]:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is required to build embeddings.")

    client = OpenAI(api_key=api_key)
    embeddings: list[list[float]] = []
    batch_size = 20

    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=[chunk.text for chunk in batch],
        )
        batch_embeddings = [item.embedding for item in response.data]
        embeddings.extend(batch_embeddings)
        print(f"Embedded {min(i + batch_size, len(chunks))}/{len(chunks)}")

    return embeddings


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
            embedding TEXT
        );
        DELETE FROM gita_chunks;
        DELETE FROM metadata;
        """
    )
    conn.commit()


def save_chunks(conn: sqlite3.Connection, chunks: list[Chunk]) -> None:
    conn.execute("INSERT INTO metadata (key, value) VALUES (?, ?)", ("model", EMBEDDING_MODEL))
    conn.execute("INSERT INTO metadata (key, value) VALUES (?, ?)", ("created_at", __import__("datetime").datetime.utcnow().isoformat()))

    for chunk in chunks:
        conn.execute(
            """
            INSERT INTO gita_chunks (
                chunk_id, chapter, verse, source_file, tags, language, chunk_type, text, commentary, embedding
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                chunk.chunk_id,
                chunk.chapter,
                chunk.verse,
                chunk.source_file,
                json.dumps(chunk.tags),
                chunk.language,
                chunk.chunk_type,
                chunk.text,
                chunk.commentary,
                json.dumps(chunk.embedding),
            ),
        )
    conn.commit()


def main() -> None:
    encoding = tiktoken.get_encoding("cl100k_base")
    entries = load_gita_entries(encoding)
    if not entries:
        raise RuntimeError("No Gita entries loaded.")

    chunks = build_chunks(entries, encoding, str(GITA_SOURCE))
    if not chunks:
        raise RuntimeError("No chunks created.")

    embeddings = embed_chunks(chunks)
    for chunk, embedding in zip(chunks, embeddings):
        chunk.embedding = embedding

    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(INDEX_PATH)
    try:
        init_db(conn)
        save_chunks(conn, chunks)
    finally:
        conn.close()

    print(f"Saved Relationship Compass index to {INDEX_PATH}")


if __name__ == "__main__":
    main()
