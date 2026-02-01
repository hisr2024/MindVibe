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
    keywords: tuple[str, ...] = ()


# Keyword weights for relationship-relevant terms
KEYWORD_WEIGHTS = {
    "anger": 2.0, "krodha": 2.0, "forgiveness": 2.0, "kshama": 2.0,
    "compassion": 2.0, "daya": 2.0, "karuna": 2.0,
    "truth": 1.5, "satya": 1.5, "speech": 1.5,
    "control": 1.5, "mind": 1.5, "self": 1.5,
    "ego": 2.0, "ahamkara": 2.0,
    "equanimity": 2.0, "sama": 1.5, "equal": 1.5,
    "attachment": 2.0, "raga": 1.5, "detachment": 2.0,
    "duty": 1.5, "dharma": 2.0, "svadharma": 2.0,
    "fear": 1.5, "bhaya": 1.5, "fearless": 1.5,
    "jealousy": 1.5, "envy": 1.5,
    "resentment": 1.5, "hatred": 1.5, "dvesha": 1.5,
    "ahimsa": 2.0, "nonviolence": 2.0, "harm": 1.5,
    "steadiness": 1.5, "patience": 1.5, "peace": 1.5,
    "love": 2.0, "prema": 1.5, "affection": 1.5,
    "relationship": 2.0, "family": 1.5, "friend": 1.5,
    "sorrow": 1.5, "grief": 1.5, "suffering": 1.5, "dukha": 1.5,
    "liberation": 1.5, "moksha": 1.5, "freedom": 1.5,
    "wisdom": 1.5, "jnana": 1.5, "knowledge": 1.5,
    "action": 1.5, "karma": 1.5, "work": 1.5,
    "surrender": 1.5, "devotion": 1.5, "bhakti": 1.5,
    "conflict": 2.0, "battle": 1.0,
    "emotion": 1.5, "feeling": 1.5, "heart": 1.5,
    "desire": 1.5, "kama": 1.5, "craving": 1.5,
    "renunciation": 1.5, "tyaga": 1.5,
    "atman": 2.0, "soul": 1.5,
    "meditation": 1.5, "yoga": 1.5, "discipline": 1.5,
}


@dataclass
class RetrievalResult:
    chunks: list[GitaChunk]
    confidence: float
    strategy: str


class RelationshipCompassIndex:
    def __init__(self, chunks: list[GitaChunk], model: str, index_type: str = "embedding") -> None:
        self.chunks = chunks
        self.model = model
        self.index_type = index_type

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
            index_type = meta.get("index_type", "embedding")

            # Check if keywords column exists
            cursor = conn.execute("PRAGMA table_info(gita_chunks)")
            columns = [col[1] for col in cursor.fetchall()]
            has_keywords = "keywords" in columns

            if has_keywords:
                rows = conn.execute(
                    """
                    SELECT chunk_id, chapter, verse, source_file, tags, language, chunk_type, text, commentary, embedding, keywords
                    FROM gita_chunks
                    """
                ).fetchall()
            else:
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
            embedding_data = json.loads(row[9]) if row[9] else []
            embedding = np.array(embedding_data, dtype=np.float32) if embedding_data else np.array([], dtype=np.float32)
            keywords = tuple(json.loads(row[10])) if has_keywords and len(row) > 10 and row[10] else ()
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
                    keywords=keywords,
                )
            )

        logger.info("Loaded Relationship Compass index: %d chunks, type=%s", len(chunks), index_type)
        return cls(chunks=chunks, model=model, index_type=index_type)


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


def extract_query_keywords(query: str) -> set[str]:
    """Extract keywords from query for matching."""
    # Simple tokenization
    words = re.findall(r'\b[a-zA-Z]{3,}\b', query.lower())
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
        'feel', 'feeling', 'want', 'like', 'know', 'think', 'get', 'make',
    }
    return {word for word in words if word not in stop_words}


def score_chunk_by_keywords(chunk: GitaChunk, query_keywords: set[str]) -> float:
    """Score a chunk based on keyword matching."""
    score = 0.0

    # Match against chunk keywords
    chunk_keywords = set(chunk.keywords)
    for kw in query_keywords:
        if kw in chunk_keywords:
            weight = KEYWORD_WEIGHTS.get(kw, 1.0)
            score += weight

    # Match against tags
    chunk_tags_lower = {tag.lower().replace('_', ' ').replace('-', ' ') for tag in chunk.tags}
    for tag in chunk_tags_lower:
        for kw in query_keywords:
            if kw in tag:
                weight = KEYWORD_WEIGHTS.get(kw, 1.0)
                score += weight * 1.5

    # Match against text content (lower weight)
    text_lower = chunk.text.lower()
    for kw in query_keywords:
        if kw in text_lower:
            weight = KEYWORD_WEIGHTS.get(kw, 1.0)
            score += weight * 0.5

    return score


def retrieve_chunks_keyword(query: str, relationship_type: str, k: int = 18) -> RetrievalResult:
    """Retrieve chunks using keyword-based matching."""
    index = get_index()
    if not index:
        return RetrievalResult(chunks=[], confidence=0.0, strategy="missing-index")

    # Build expanded query keywords
    expanded_query = f"{query} relationship {relationship_type} " + " ".join(RELATIONSHIP_TAGS[:6])
    query_keywords = extract_query_keywords(expanded_query)

    if not query_keywords:
        return RetrievalResult(chunks=[], confidence=0.0, strategy="no-keywords")

    # Score all chunks
    scored: list[tuple[GitaChunk, float]] = []
    for chunk in index.chunks:
        score = score_chunk_by_keywords(chunk, query_keywords)
        if score > 0:
            scored.append((chunk, score))

    # Sort by score
    scored.sort(key=lambda item: item[1], reverse=True)
    top = scored[:k]

    # Calculate confidence (normalized)
    max_possible_score = len(query_keywords) * 2.0 * 3  # max weight * 3 match types
    confidence = (top[0][1] / max_possible_score) if top else 0.0
    confidence = min(confidence, 1.0)

    # Ensure minimum confidence for keyword matches
    if top and confidence < 0.3:
        confidence = 0.3

    return RetrievalResult(chunks=[item[0] for item in top], confidence=confidence, strategy="keywords")


def retrieve_chunks(query: str, relationship_type: str, k: int = 18) -> RetrievalResult:
    index = get_index()
    if not index:
        return RetrievalResult(chunks=[], confidence=0.0, strategy="missing-index")

    # Use keyword retrieval if index is keyword-based or if embeddings aren't available
    if index.index_type == "keyword":
        return retrieve_chunks_keyword(query, relationship_type, k)

    expanded_query = f"{query} relationship {relationship_type} " + " ".join(RELATIONSHIP_TAGS)
    embedding = embed_query(expanded_query, index.model)

    # Fall back to keyword retrieval if embedding fails
    if embedding is None:
        logger.info("Embedding unavailable, falling back to keyword retrieval")
        return retrieve_chunks_keyword(query, relationship_type, k)

    scored: list[tuple[GitaChunk, float]] = []
    for chunk in index.chunks:
        if chunk.embedding.size == 0:
            continue
        score = cosine_similarity(embedding, chunk.embedding)
        scored.append((chunk, score))

    # If no embeddings found, fall back to keyword retrieval
    if not scored:
        logger.info("No embeddings in index, falling back to keyword retrieval")
        return retrieve_chunks_keyword(query, relationship_type, k)

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


async def call_ai_provider(messages: list[dict[str, str]]) -> str | None:
    """Call AI provider with multi-provider fallback support (like KIAAN Chat)."""
    # Try multi-provider manager first
    try:
        from backend.services.ai.providers.provider_manager import get_provider_manager, AIProviderError
        provider_manager = get_provider_manager()
        if provider_manager:
            logger.info("Using ProviderManager for Relationship Compass")
            response = await provider_manager.chat(
                messages=messages,
                temperature=0.2,
                max_tokens=800,
            )
            if response and response.content:
                logger.info(f"✅ Response from {response.provider}/{response.model}")
                return response.content
    except Exception as e:
        logger.warning(f"ProviderManager failed: {e}, trying legacy client")

    # Fallback to legacy OpenAI client
    return call_openai_sync(messages)


def call_openai_sync(messages: list[dict[str, str]]) -> str | None:
    """Synchronous OpenAI call as fallback."""
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        logger.warning("OPENAI_API_KEY not set for Relationship Compass")
        return None

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=CHAT_MODEL,
            messages=messages,
            temperature=0.2,
            max_tokens=800,
            timeout=30.0,
        )
        content = response.choices[0].message.content if response.choices else None
        if content:
            logger.info("✅ Response from legacy OpenAI client")
        return content or None
    except Exception as exc:
        logger.error("Relationship Compass OpenAI error: %s", exc)
        return None


def call_openai(messages: list[dict[str, str]]) -> str | None:
    """Call OpenAI (sync wrapper for backwards compatibility)."""
    return call_openai_sync(messages)


def generate_gita_based_response(chunks: list[GitaChunk], relationship_type: str, user_message: str) -> str:
    """Generate a Gita-based response using retrieved chunks when AI is unavailable.

    This provides meaningful guidance based on the retrieved verses even when
    AI providers are not available, similar to KIAAN's fallback mechanism.
    """
    if not chunks:
        return build_insufficient_response()

    # Extract key teachings from top chunks
    teachings = []
    verse_refs = []
    for chunk in chunks[:5]:
        verse_refs.append(chunk.verse)
        # Extract English portion from text
        text = chunk.text
        if "English:" in text:
            english = text.split("English:")[1].split("\n")[0].strip()
            if english:
                teachings.append(english)

    # Build response sections based on retrieved wisdom
    sections = []

    # Sacred Acknowledgement
    sections.append("# Sacred Acknowledgement")
    sections.append("I bow to the tender heart that brought you here seeking clarity. Your willingness to reflect on this situation shows profound courage. Every awakened soul throughout time has faced moments exactly like this one. You are not alone.")
    sections.append("")

    # Inner Conflict Mirror
    sections.append("# Inner Conflict Mirror")
    sections.append("Ancient wisdom teaches: 'Yatha drishti, tatha srishti' - as you see, so you create. Let us gently explore what this situation reveals about your inner landscape. What do you truly need beneath the surface of this conflict? Understanding yourself is the first dharmic step.")
    sections.append("")

    # Gita Teachings Used
    sections.append("# Gita Teachings Used")
    if teachings:
        sections.append(f"The Bhagavad Gita offers this timeless wisdom for your situation ({', '.join(verse_refs[:3])}):")
        sections.append("")
        for i, teaching in enumerate(teachings[:3], 1):
            sections.append(f"{i}. {teaching}")
    else:
        sections.append("The Gita teaches us that true peace comes from understanding our dharma (right action) in relationships, practicing kshama (forgiveness), and maintaining sama-darshana (equal vision) towards all beings.")
    sections.append("")

    # Dharma Options
    sections.append("# Dharma Options")
    sections.append("Consider these three dharmic paths:")
    sections.append("")
    sections.append(f"1. **Practice Svadhyaya (Self-Study)** ({verse_refs[0] if verse_refs else '2:48'}): Before responding or reacting, pause to understand your own needs and fears. What wound is being touched here?")
    sections.append("")
    sections.append(f"2. **Embrace Kshama (Forgiveness)** ({verse_refs[1] if len(verse_refs) > 1 else '12:13'}): Forgiveness is not condoning harm - it is freeing yourself from the prison of resentment. This is a gift to yourself.")
    sections.append("")
    sections.append(f"3. **Apply Sama-Darshana (Equal Vision)** ({verse_refs[2] if len(verse_refs) > 2 else '6:32'}): See the divine struggling in the other person too. They act from their own conditioning, wounds, and fears.")
    sections.append("")

    # Sacred Speech
    sections.append("# Sacred Speech")
    sections.append("The Gita teaches 'satyam bruyat priyam bruyat' - speak truth that is pleasant and beneficial. When ready, try: 'When [situation], I feel [emotion], because I need [underlying need]. What I'm hoping for is [request].'")
    sections.append("")

    # Detachment Anchor
    sections.append("# Detachment Anchor")
    sections.append(f"({verse_refs[0] if verse_refs else '2:47'}): 'Karmanye vadhikaraste' - You have the right to action, not to the fruits. Your dharma is to act with integrity; the outcome is not yours to control. Release attachment to how this must resolve.")
    sections.append("")

    # One Next Step
    sections.append("# One Next Step")
    sections.append(f"Today, practice one act of witnessing ({verse_refs[1] if len(verse_refs) > 1 else '6:5'}): When emotions arise about this situation, simply notice them without judgment. Say internally: 'I see you, feeling. I am not you.'")
    sections.append("")

    # One Gentle Question
    sections.append("# One Gentle Question")
    sections.append("What would your wisest self do here - not your wounded self, not your ego, not your fear?")

    return "\n".join(sections)
