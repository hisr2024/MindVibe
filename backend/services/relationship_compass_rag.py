"""Gita-only retrieval and validation for Relationship Compass."""
from __future__ import annotations

import json
import logging
import os
import re
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
from openai import OpenAI

logger = logging.getLogger(__name__)

INDEX_PATH = Path("data") / "relationship_compass" / "gita_index.sqlite"
EMBEDDING_MODEL = os.getenv("RELATIONSHIP_COMPASS_EMBEDDING_MODEL", "text-embedding-3-small")
CHAT_MODEL = os.getenv("RELATIONSHIP_COMPASS_GITA_MODEL", "gpt-4o-mini")

RELATIONSHIP_TAGS = [
    "anger",
    "forgiveness",
    "compassion",
    "truth",
    "speech",
    "self-control",
    "ego",
    "equanimity",
    "attachment",
    "duty",
    "fear",
    "jealousy",
    "resentment",
    "non-harm",
    "steadiness",
    "patience",
]

HEADINGS_SUFFICIENT = [
    "Sacred Acknowledgement",
    "Inner Conflict Mirror",
    "Gita Teachings Used",
    "Dharma Options",
    "Sacred Speech",
    "Detachment Anchor",
    "One Next Step",
    "One Gentle Question",
]

HEADINGS_INSUFFICIENT = [
    "Sacred Acknowledgement",
    "What I Need From the Gita Repository",
    "One Gentle Question",
    "Citations",
]

CITATION_PATTERN = re.compile(r"\b(\d{1,2}:\d{1,2})\b")


@dataclass(frozen=True)
class GitaChunk:
    chunk_id: str
    chapter: str
    verse: str
    source_file: str
    tags: list[str]
    language: str
    chunk_type: str
    text: str
    commentary: str
    embedding: np.ndarray


@dataclass
class RetrievalResult:
    chunks: list[GitaChunk]
    confidence: float
    strategy: str


class RelationshipCompassIndex:
    def __init__(self, chunks: list[GitaChunk], model: str) -> None:
        self.chunks = chunks
        self.model = model

    @classmethod
    def load(cls) -> "RelationshipCompassIndex | None":
        if not INDEX_PATH.exists():
            logger.warning("Relationship Compass index missing at %s", INDEX_PATH)
            return None

        try:
            conn = sqlite3.connect(INDEX_PATH)
        except sqlite3.Error as exc:
            logger.error("Failed to open Relationship Compass index: %s", exc)
            return None

        try:
            meta = dict(conn.execute("SELECT key, value FROM metadata").fetchall())
            model = meta.get("model", EMBEDDING_MODEL)
            rows = conn.execute(
                """
                SELECT chunk_id, chapter, verse, source_file, tags, language, chunk_type, text, commentary, embedding
                FROM gita_chunks
                """
            ).fetchall()
        finally:
            conn.close()

        chunks: list[GitaChunk] = []
        for row in rows:
            tags = json.loads(row[4]) if row[4] else []
            embedding = np.array(json.loads(row[9]), dtype=np.float32)
            chunks.append(
                GitaChunk(
                    chunk_id=row[0],
                    chapter=row[1] or "",
                    verse=row[2] or "",
                    source_file=row[3] or "",
                    tags=tags,
                    language=row[5] or "multi",
                    chunk_type=row[6] or "verse",
                    text=row[7] or "",
                    commentary=row[8] or "",
                    embedding=embedding,
                )
            )

        return cls(chunks=chunks, model=model)


_cached_index: RelationshipCompassIndex | None = None


def get_index() -> RelationshipCompassIndex | None:
    global _cached_index
    if _cached_index is None:
        _cached_index = RelationshipCompassIndex.load()
    return _cached_index


def embed_query(query: str, model: str) -> np.ndarray | None:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    client = OpenAI(api_key=api_key)
    response = client.embeddings.create(model=model, input=query)
    return np.array(response.data[0].embedding, dtype=np.float32)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    if a.size == 0 or b.size == 0:
        return 0.0
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def retrieve_chunks(query: str, relationship_type: str, k: int = 18) -> RetrievalResult:
    index = get_index()
    if not index:
        return RetrievalResult(chunks=[], confidence=0.0, strategy="missing-index")

    expanded_query = f"{query} relationship {relationship_type} " + " ".join(RELATIONSHIP_TAGS)
    embedding = embed_query(expanded_query, index.model)
    if embedding is None:
        return RetrievalResult(chunks=[], confidence=0.0, strategy="missing-embeddings")

    scored: list[tuple[GitaChunk, float]] = []
    for chunk in index.chunks:
        score = cosine_similarity(embedding, chunk.embedding)
        scored.append((chunk, score))

    scored.sort(key=lambda item: item[1], reverse=True)
    top = scored[:k]
    confidence = top[0][1] if top else 0.0

    return RetrievalResult(chunks=[item[0] for item in top], confidence=confidence, strategy="embeddings")


def expand_and_retrieve(query: str, relationship_type: str, base_result: RetrievalResult) -> RetrievalResult:
    if base_result.confidence >= 0.2 and len(base_result.chunks) >= 8:
        return base_result

    broadened_query = (
        f"{query} relationship {relationship_type} "
        "dharma compassion duty equanimity non-harm steadiness patience "
        "theme application guidance"
    )
    expanded = retrieve_chunks(broadened_query, relationship_type, k=30)
    if expanded.chunks:
        return expanded

    return base_result


def merge_chunks(primary: RetrievalResult, limit: int = 20) -> list[GitaChunk]:
    seen = set()
    merged: list[GitaChunk] = []
    for chunk in primary.chunks:
        if chunk.chunk_id in seen:
            continue
        seen.add(chunk.chunk_id)
        merged.append(chunk)
        if len(merged) >= limit:
            break
    return merged


def build_context_block(chunks: Iterable[GitaChunk]) -> str:
    lines = ["[GITA_CORE_WISDOM_CONTEXT]"]
    for chunk in chunks:
        lines.append(f"- Chapter: {chunk.chapter or 'Unknown'}")
        lines.append(f"  Verse: {chunk.verse or 'Unknown'}")
        lines.append(f"  Source: {chunk.source_file}")
        lines.append(f"  Text: {chunk.text}")
        lines.append(f"  Commentary: {chunk.commentary or 'None'}")
        lines.append(f"  Tags: {', '.join(chunk.tags) if chunk.tags else 'None'}")
    lines.append("[/GITA_CORE_WISDOM_CONTEXT]")
    return "\n".join(lines)


def extract_sections(text: str, headings: list[str]) -> dict[str, str]:
    section_map: dict[str, str] = {}
    current_heading: str | None = None
    buffer: list[str] = []

    def flush() -> None:
        if current_heading is None:
            return
        section_map[current_heading] = "\n".join(buffer).strip()
        buffer.clear()

    for line in text.splitlines():
        normalized = line.strip().lstrip("#").strip()
        if normalized in headings:
            flush()
            current_heading = normalized
            continue
        if current_heading:
            buffer.append(line)

    flush()
    return section_map


def count_dharma_options(section: str) -> int:
    lines = [line.strip() for line in section.splitlines() if line.strip()]
    count = 0
    for line in lines:
        if re.match(r"^(?:\d+\.|- |• )", line):
            count += 1
    return count


def collect_citations(text: str) -> list[str]:
    return CITATION_PATTERN.findall(text)


def citations_within_allowed(citations: list[str], allowed: set[str]) -> bool:
    return all(citation in allowed for citation in citations)


def validate_response(text: str, allowed_citations: set[str]) -> tuple[bool, list[str]]:
    errors: list[str] = []

    for heading in HEADINGS_SUFFICIENT:
        if heading not in text:
            errors.append(f"Missing heading: {heading}")

    positions = [text.find(heading) for heading in HEADINGS_SUFFICIENT]
    if any(pos == -1 for pos in positions) or positions != sorted(positions):
        errors.append("Headings are missing or out of order")

    sections = extract_sections(text, HEADINGS_SUFFICIENT)
    citations = collect_citations(text)
    if len(citations) < 2:
        errors.append("At least 2 verse citations required")

    for section_name in ["Gita Teachings Used", "Dharma Options", "Detachment Anchor", "One Next Step"]:
        section_text = sections.get(section_name, "")
        if not collect_citations(section_text):
            errors.append(f"Missing citation in {section_name}")

    dharma_options = count_dharma_options(sections.get("Dharma Options", ""))
    if dharma_options != 3:
        errors.append("Dharma Options must include exactly 3 options")

    speech_section = sections.get("Sacred Speech", "")
    if speech_section:
        if "not present" not in speech_section.lower() and not collect_citations(speech_section):
            errors.append("Sacred Speech section lacks citation or explicit absence note")

    if allowed_citations and not citations_within_allowed(citations, allowed_citations):
        errors.append("Response cites verses not present in retrieved context")

    return (len(errors) == 0, errors)


def build_insufficient_response() -> str:
    return "\n".join(
        [
            "Sacred Acknowledgement",
            "I hear the weight of what you shared. Your feelings matter, and I will stay with them carefully.",
            "",
            "What I Need From the Gita Repository",
            "I do not yet have enough Bhagavad Gita verse context retrieved to offer guidance grounded only in those verses.",
            "",
            "One Gentle Question",
            "What specific moment or exchange would you like me to anchor in the Gita verses first?",
            "",
            "Citations",
            "(none)",
        ]
    )


def build_allowed_citations(chunks: Iterable[GitaChunk]) -> set[str]:
    allowed: set[str] = set()
    for chunk in chunks:
        for ref in (chunk.verse or "").split(","):
            ref = ref.strip()
            if ref:
                allowed.add(ref)
    return allowed


def build_citation_list(chunks: Iterable[GitaChunk]) -> list[dict[str, str]]:
    citations: list[dict[str, str]] = []
    for chunk in chunks:
        citations.append(
            {
                "chapter": chunk.chapter,
                "verse": chunk.verse,
                "source": chunk.source_file,
                "chunk_id": chunk.chunk_id,
            }
        )
    return citations


def call_openai(messages: list[dict[str, str]]) -> str | None:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    client = OpenAI(api_key=api_key)
    try:
        response = client.chat.completions.create(
            model=CHAT_MODEL,
            messages=messages,
            temperature=0.2,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Relationship Compass OpenAI error: %s", exc)
        return None

    content = response.choices[0].message.content if response.choices else None
    return content or None
