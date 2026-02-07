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

# Wisdom-infused, modern, friendly headings (includes Gita wisdom in accessible way)
HEADINGS_SECULAR = [
    "I Hear You",
    "What Might Be Happening",
    "The Other Side",
    "What You Could Try",
    "A Way to Say It",
    "Gita Wisdom",
    "One Small Step",
]

HEADINGS_SECULAR_INSUFFICIENT = [
    "I Hear You",
    "Let Me Understand Better",
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


def build_context_block(chunks: Iterable[GitaChunk], dynamic_wisdom: list[dict] | None = None) -> str:
    """Build rich context block with static verses and dynamic learned wisdom.

    Includes Sanskrit text, verse metadata, themes, principles, and any
    dynamic wisdom from validated learned sources for stricter Gita adherence.
    """
    lines = ["[GITA_CORE_WISDOM_CONTEXT]"]
    lines.append("Source: Bhagavad Gita 701-verse repository (static) + validated learned wisdom (dynamic)")
    lines.append("")

    lines.append("--- STATIC GITA VERSES (from 701-verse repository) ---")
    for chunk in chunks:
        ref = f"BG {chunk.chapter}:{chunk.verse}" if chunk.chapter and chunk.verse else "Unknown"
        lines.append(f"- Reference: {ref}")
        lines.append(f"  Source: {chunk.source_file}")

        # Extract Sanskrit if present in text
        text = chunk.text
        if "Sanskrit:" in text:
            sanskrit_part = text.split("Sanskrit:")[1].split("\n")[0].strip()
            lines.append(f"  Sanskrit: {sanskrit_part[:200]}")
        if "Transliteration:" in text:
            translit_part = text.split("Transliteration:")[1].split("\n")[0].strip()
            lines.append(f"  Transliteration: {translit_part[:200]}")
        if "English:" in text:
            english_part = text.split("English:")[1].split("\n")[0].strip().strip('"')
            lines.append(f"  Translation: {english_part}")
        elif text:
            lines.append(f"  Text: {text[:300]}")

        # Extract theme and principle from commentary
        commentary = chunk.commentary or ""
        if "Theme:" in commentary:
            theme = commentary.split("Theme:")[1].split("Principle:")[0].strip()
            lines.append(f"  Theme: {theme.replace('_', ' ').title()}")
        if "Principle:" in commentary:
            principle = commentary.split("Principle:")[-1].strip()
            lines.append(f"  Gita Principle: {principle}")
        if "Mental Health:" in commentary:
            mh = commentary.split("Mental Health:")[1].split("\n")[0].strip()
            lines.append(f"  Mental Health Application: {mh}")

        if chunk.tags:
            lines.append(f"  Tags: {', '.join(chunk.tags)}")
        if chunk.keywords:
            lines.append(f"  Keywords: {', '.join(chunk.keywords[:8])}")
        lines.append("")

    # Include dynamic learned wisdom if available
    if dynamic_wisdom:
        lines.append("")
        lines.append("--- DYNAMIC LEARNED WISDOM (validated from verified sources) ---")
        for dw in dynamic_wisdom:
            lines.append(f"- Source: {dw.get('source_name', 'Unknown')}")
            if dw.get('verse_refs'):
                refs = [f"BG {r[0]}.{r[1]}" for r in dw['verse_refs'] if len(r) >= 2]
                lines.append(f"  Related Verses: {', '.join(refs)}")
            lines.append(f"  Wisdom: {dw.get('content', '')[:300]}")
            if dw.get('themes'):
                lines.append(f"  Themes: {', '.join(dw['themes'][:5])}")
            if dw.get('shad_ripu_tags'):
                lines.append(f"  Shad Ripu: {', '.join(dw['shad_ripu_tags'])}")
            lines.append("")

    lines.append("[/GITA_CORE_WISDOM_CONTEXT]")
    return "\n".join(lines)


def extract_sections(text: str, headings: list[str]) -> dict[str, str]:
    """Extract sections from response text with flexible heading matching.

    Handles multiple heading formats:
    - # Heading
    - ## Heading
    - **Heading**
    - Heading:
    - Heading
    """
    section_map: dict[str, str] = {}
    current_heading: str | None = None
    buffer: list[str] = []

    # Create lowercase lookup for flexible matching
    headings_lower = {h.lower(): h for h in headings}

    def normalize_heading(line: str) -> str | None:
        """Try to match a line to one of our headings."""
        # Remove markdown formatting
        cleaned = line.strip()
        cleaned = cleaned.lstrip("#").strip()  # Remove # or ##
        cleaned = cleaned.strip("*").strip()   # Remove ** bold markers
        cleaned = cleaned.rstrip(":").strip()  # Remove trailing colon

        # Check if it matches any heading (case-insensitive)
        cleaned_lower = cleaned.lower()
        if cleaned_lower in headings_lower:
            return headings_lower[cleaned_lower]
        return None

    def flush() -> None:
        if current_heading is None:
            return
        section_map[current_heading] = "\n".join(buffer).strip()
        buffer.clear()

    for line in text.splitlines():
        matched_heading = normalize_heading(line)
        if matched_heading:
            flush()
            current_heading = matched_heading
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
    """Validate response for strict Gita adherence.

    Ensures every guidance section has proper verse citations and
    uses Gita terminology rather than generic psychology.
    """
    errors: list[str] = []

    for heading in HEADINGS_SUFFICIENT:
        if heading not in text:
            errors.append(f"Missing heading: {heading}")

    positions = [text.find(heading) for heading in HEADINGS_SUFFICIENT]
    if any(pos == -1 for pos in positions) or positions != sorted(positions):
        errors.append("Headings are missing or out of order")

    sections = extract_sections(text, HEADINGS_SUFFICIENT)
    citations = collect_citations(text)

    # Stricter citation requirements: minimum 3 unique verse citations
    if len(set(citations)) < 3:
        errors.append("At least 3 unique verse citations required for strict Gita adherence")

    # Every guidance section MUST have at least one citation
    citation_required_sections = [
        "Sacred Acknowledgement",
        "Inner Conflict Mirror",
        "Gita Teachings Used",
        "Dharma Options",
        "Detachment Anchor",
        "One Next Step",
    ]
    for section_name in citation_required_sections:
        section_text = sections.get(section_name, "")
        if not collect_citations(section_text):
            errors.append(f"Missing verse citation in {section_name} (strict Gita adherence)")

    # Gita Teachings Used must have 3-5 verses
    teachings_citations = collect_citations(sections.get("Gita Teachings Used", ""))
    if len(set(teachings_citations)) < 3:
        errors.append("Gita Teachings Used must cite at least 3 unique verses")

    dharma_options = count_dharma_options(sections.get("Dharma Options", ""))
    if dharma_options != 3:
        errors.append("Dharma Options must include exactly 3 options")

    # Each Dharma Option must have its own citation
    dharma_text = sections.get("Dharma Options", "")
    dharma_citations = collect_citations(dharma_text)
    if len(dharma_citations) < 3:
        errors.append("Each Dharma Option must cite at least one verse")

    speech_section = sections.get("Sacred Speech", "")
    if speech_section:
        if "not present" not in speech_section.lower() and not collect_citations(speech_section):
            errors.append("Sacred Speech section lacks citation or explicit absence note")

    if allowed_citations and not citations_within_allowed(citations, allowed_citations):
        errors.append("Response cites verses not present in retrieved context")

    # Check for Gita terminology usage (must use Sanskrit terms)
    text_lower = text.lower()
    gita_terms_present = any(term in text_lower for term in [
        "dharma", "karma", "yoga", "krodha", "raga", "dvesha", "moha",
        "kshama", "ahimsa", "satya", "vairagya", "sthitaprajna",
        "svadharma", "sama-darshana", "atma", "sakshi", "buddhi",
    ])
    if not gita_terms_present:
        errors.append("Response lacks Gita Sanskrit terminology (strict adherence requires Sanskrit terms)")

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


def extract_verse_wisdom(chunk: GitaChunk) -> dict[str, str]:
    """Extract structured wisdom from a Gita chunk."""
    result = {
        "verse_ref": chunk.verse,
        "english": "",
        "theme": "",
        "principle": "",
        "tags": chunk.tags,
    }

    text = chunk.text
    # Extract English teaching
    if "English:" in text:
        english = text.split("English:")[1].split("\n")[0].strip()
        # Clean up quote marks
        english = english.strip('"').strip()
        result["english"] = english

    # Extract theme and principle from commentary
    commentary = chunk.commentary or ""
    if "Theme:" in commentary:
        theme = commentary.split("Theme:")[1].split("Principle:")[0].strip()
        result["theme"] = theme.replace("_", " ").title()
    if "Principle:" in commentary:
        principle = commentary.split("Principle:")[-1].strip()
        result["principle"] = principle

    return result


def generate_gita_based_response(chunks: list[GitaChunk], relationship_type: str, user_message: str) -> str:
    """Generate a strictly Gita-grounded response from retrieved verse wisdom.

    Every section traces to specific Gita verses, uses Sanskrit terminology
    with translations, and follows the Shad Ripu diagnostic framework.
    No generic psychology - only Gita wisdom from the 701-verse repository.
    """
    if not chunks:
        return build_insufficient_response()

    # Extract rich wisdom from top chunks
    wisdom_items = [extract_verse_wisdom(chunk) for chunk in chunks[:10]]
    teachings = [w for w in wisdom_items if w["english"]]
    verse_refs = [w["verse_ref"] for w in wisdom_items if w["verse_ref"]]

    # Collect themes and tags for Gita psychology diagnosis
    all_tags = set()
    for w in wisdom_items:
        all_tags.update(tag.lower().replace("_", " ") for tag in w["tags"])

    # Determine active Shad Ripu from tags
    shad_ripu_map = {
        "krodha": ["anger", "krodha", "rage", "wrath"],
        "kama": ["desire", "kama", "attachment", "lust", "craving"],
        "lobha": ["greed", "lobha", "possessive", "hoarding"],
        "moha": ["delusion", "moha", "confusion", "ignorance"],
        "mada": ["pride", "mada", "ego", "arrogance"],
        "matsarya": ["jealousy", "matsarya", "envy"],
    }
    active_ripu = "moha"  # Default
    for ripu, indicators in shad_ripu_map.items():
        if any(ind in all_tags for ind in indicators):
            active_ripu = ripu
            break

    # Determine relationship-specific Gita context
    relationship_contexts = {
        "romantic": ("partner", "Nishkama Prema (desireless love)", "BG 12.13-14"),
        "family": ("family member", "Kula-dharma (family righteousness)", "BG 1.40-43"),
        "friendship": ("friend", "Maitri (unconditional friendship)", "BG 6.9"),
        "workplace": ("colleague", "Karma Yoga (selfless action)", "BG 2.47"),
        "self": ("yourself", "Atma-jnana (self-knowledge)", "BG 6.5-6"),
        "other": ("this person", "Sama-darshana (equal vision)", "BG 6.32"),
    }
    rel_context, rel_principle, rel_verse = relationship_contexts.get(
        relationship_type, ("this person", "Sama-darshana (equal vision)", "BG 6.32")
    )

    sections = []

    # Sacred Acknowledgement - grounded in Gita understanding of Dukha
    sections.append("# Sacred Acknowledgement")
    ack_teaching = teachings[0]["english"] if teachings else ""
    ack_ref = verse_refs[0] if verse_refs else "2:14"
    if active_ripu == "krodha":
        sections.append(f"I honor what you carry. The Gita ({ack_ref}) teaches: '{ack_teaching[:150]}...' Krodha (anger) is one of the three gates to self-destruction (BG 16.21), yet its presence here reveals how deeply you care. The Gita does not condemn the emotion - it illuminates the path through it. Your Svadhyaya (self-inquiry) begins now.")
    elif active_ripu == "kama":
        sections.append(f"I witness the Dukha (suffering) born of Raga (attachment). The Gita ({ack_ref}) speaks directly: '{ack_teaching[:150]}...' When our Kama (desires) for how others should behave remain unfulfilled, pain follows inevitably (BG 2.62). Your awareness of this pattern is the beginning of Viveka (discrimination).")
    elif active_ripu == "moha":
        sections.append(f"I see the Moha (confusion) clouding your Buddhi (discrimination). The Gita ({ack_ref}) teaches: '{ack_teaching[:150]}...' As Arjuna stood paralyzed by confusion (BG 1.28-46), so too does this situation overwhelm your clarity. But Krishna's wisdom illuminated Arjuna's path, and it will illuminate yours.")
    else:
        sections.append(f"I bow to the Atman (eternal self) within you that seeks clarity. The Gita ({ack_ref}) teaches: '{ack_teaching[:150]}...' The very act of seeking understanding rather than reacting from Ahamkara (ego) is dharmic. Every Sthitaprajna (person of steady wisdom) has faced such moments (BG 2.55-56).")
    sections.append("")

    # Inner Conflict Mirror - Shad Ripu and Raga-Dvesha diagnosis
    sections.append("# Inner Conflict Mirror")
    mirror_ref = verse_refs[1] if len(verse_refs) > 1 else "2:62-63"
    mirror_teaching = teachings[1]["english"][:200] if len(teachings) > 1 else "From dwelling on sense objects, attachment arises; from attachment, desire; from desire, anger"
    sections.append(f"Through the lens of Svadhyaya (self-study), the Gita ({mirror_ref}) reveals: '{mirror_teaching}...'")
    sections.append("")
    sections.append(f"The active Shad Ripu (inner enemy) in this situation is **{active_ripu.title()}** ({_get_shad_ripu_meaning(active_ripu)}). The Raga-Dvesha (attachment-aversion) dynamic with {rel_context} is: you are attached (Raga) to how you want them to be, and averse (Dvesha) to how they actually are. This gap between expectation and reality is the root of Dukha (suffering) as the Gita teaches.")
    sections.append("")

    # Gita Teachings Used - comprehensive verse integration with Sanskrit principles
    sections.append("# Gita Teachings Used")
    sections.append(f"These verses from the Bhagavad Gita illuminate the path through {active_ripu.title()}:")
    sections.append("")
    for i, wisdom in enumerate(teachings[:5], 1):
        if wisdom["english"]:
            principle_note = f" - {wisdom['principle']}" if wisdom["principle"] else ""
            theme_note = f" [{wisdom['theme']}]" if wisdom["theme"] else ""
            sections.append(f"{i}. ({wisdom['verse_ref']}){principle_note}{theme_note}: \"{wisdom['english'][:200]}\"")
            sections.append("")
    sections.append("")

    # Dharma Options - each grounded in a specific Yoga path with verse citation
    sections.append("# Dharma Options")
    sections.append(f"Drawing from the Gita's wisdom on {active_ripu.title()}, three dharmic paths emerge:")
    sections.append("")

    opt1_ref = verse_refs[0] if verse_refs else "2:47"
    opt1_teaching = teachings[0]["english"][:100] if teachings else "You have the right to action alone, never to its fruits"
    sections.append(f"1. **Nishkama Karma (Desireless Action) Path** ({opt1_ref}): '{opt1_teaching}...' Applied through {rel_principle}: Focus on YOUR Svadharma (right action) toward {rel_context}, releasing Phala-sakti (attachment to outcome). The Gita teaches your Adhikara (right) is to action alone, never to results.")
    sections.append("")

    opt2_ref = verse_refs[1] if len(verse_refs) > 1 else "12:13-14"
    opt2_teaching = teachings[1]["english"][:100] if len(teachings) > 1 else "One who is free from malice toward all beings, friendly and compassionate"
    sections.append(f"2. **Kshama (Forgiveness/Forbearance) Path** ({opt2_ref}): '{opt2_teaching}...' Kshama is listed among Daivi Sampat (divine qualities) in BG 16.1-3. Applied here: Kshama liberates YOU from Dvesha (aversion). It is not condoning Adharma - it is choosing Abhaya (fearlessness) over Krodha's prison.")
    sections.append("")

    opt3_ref = verse_refs[2] if len(verse_refs) > 2 else "6:32"
    opt3_teaching = teachings[2]["english"][:100] if len(teachings) > 2 else "One who sees equality everywhere, seeing their own self in all beings"
    sections.append(f"3. **Sama-Darshana (Equal Vision) Path** ({opt3_ref}): '{opt3_teaching}...' The highest Yoga is seeing the same Atman in {rel_context} as in yourself (BG 6.29). They act from their own Gunas and Prakriti (conditioning) - not to hurt you, but because they too are bound by Karma and Samskaras (BG 3.27-28).")
    sections.append("")

    # Sacred Speech - Vak-tapas with specific verse
    sections.append("# Sacred Speech")
    speech_ref = verse_refs[3] if len(verse_refs) > 3 else "17:15"
    sections.append(f"The Gita's Vak-tapas (austerity of speech) teaching ({speech_ref}): 'Speech that is Satya (truthful), Priya (pleasant), Hitam (beneficial), and Anudvega-karam (non-agitating).' This is the fourfold test for every word spoken in relationship conflict.")
    sections.append("")
    sections.append(f"When speaking with {rel_context}, practice Arjavam (straightforwardness, BG 13.7) combined with Ahimsa (non-harm, BG 16.2). Express truth without weaponizing it. Before speaking, ask through the Vak-tapas lens: Is it Satya? Is it Priya? Is it Hitam?")
    sections.append("")

    # Detachment Anchor - Vairagya with specific verse
    sections.append("# Detachment Anchor")
    anchor_ref = verse_refs[0] if verse_refs else "2:47"
    anchor_teaching = teachings[0]["english"] if teachings else "You have the right to action alone, never to the fruits"
    sections.append(f"({anchor_ref}): '{anchor_teaching[:150]}...'")
    sections.append("")
    sections.append(f"Vairagya (dispassion) does not mean indifference - it means freedom from Phala-sakti (attachment to fruits). Your Svadharma is to act with Shraddha (faith) and integrity toward {rel_context}; the Phala (result) unfolds according to the larger order of Karma. Nishkama Karma (desireless action) is your liberation (BG 2.47).")
    sections.append("")

    # One Next Step - specific Gita practice with Sanskrit name
    sections.append("# One Next Step")
    step_ref = verse_refs[1] if len(verse_refs) > 1 else "6:19"
    sections.append(f"Today, practice **Sakshi Bhava** (witness consciousness, {step_ref}): When the Vrittis (mental fluctuations) about {rel_context} arise, practice Drashta (the seer). Observe: 'I witness Krodha/Bhaya/Shoka arising. I am not this emotion - I am the Sakshi (witness) who observes it.' This is the Gita's foundation for Samatvam (equanimity, BG 2.48).")
    sections.append("")

    # One Gentle Question - through Svadhyaya lens
    sections.append("# One Gentle Question")
    sections.append(f"If Atma-tripti (self-contentment, BG 2.55) were fully established in you - needing nothing from {rel_context} for your Purnatva (inner completeness) - how would your Svadharma (right action) in this situation change?")

    return "\n".join(sections)


def _get_shad_ripu_meaning(ripu: str) -> str:
    """Return the meaning of a Shad Ripu term."""
    meanings = {
        "kama": "desire/lust - the root craving that binds",
        "krodha": "anger/wrath - destroyer of discrimination",
        "lobha": "greed/possessiveness - the insatiable hunger",
        "moha": "delusion/confusion - the fog over Buddhi",
        "mada": "pride/arrogance - the blindness of ego",
        "matsarya": "envy/jealousy - the poison of comparison",
    }
    return meanings.get(ripu, "inner enemy of the mind")


def build_secular_insufficient_response() -> str:
    """Build a secular response when more context is needed."""
    return "\n".join([
        "# I Hear You",
        "I can tell this is weighing on you, and I want to help you navigate this.",
        "",
        "# Let Me Understand Better",
        "Could you share a bit more about what's happening? For example:",
        "- What specific situation or conversation triggered these feelings?",
        "- How long has this been going on?",
        "- What outcome are you hoping for?",
        "",
        "The more context you share, the more helpful my suggestions can be.",
    ])


def generate_secular_response(chunks: list[GitaChunk], relationship_type: str, user_message: str) -> str:
    """Generate a modern, friendly response where ALL advice derives from Gita principles.

    Every suggestion is rooted in a specific Gita teaching, but presented in
    everyday, accessible language. The Gita Wisdom section explicitly cites
    the guiding verses.
    """
    if not chunks:
        return build_secular_insufficient_response()

    # Extract wisdom to derive ALL advice from Gita principles
    wisdom_items = [extract_verse_wisdom(chunk) for chunk in chunks[:10]]
    teachings = [w for w in wisdom_items if w["english"]]
    all_tags = set()
    for w in wisdom_items:
        all_tags.update(tag.lower().replace("_", " ") for tag in w["tags"])

    # Determine relationship context
    relationship_contexts = {
        "romantic": ("your partner", "they", "them"),
        "family": ("your family member", "they", "them"),
        "friendship": ("your friend", "they", "them"),
        "workplace": ("your colleague", "they", "them"),
        "self": ("yourself", "you", "your"),
        "other": ("this person", "they", "them"),
    }
    rel_name, pronoun, obj_pronoun = relationship_contexts.get(relationship_type, ("this person", "they", "them"))

    # Detect emotional themes for Gita-derived advice routing
    is_anger = any(t in all_tags for t in ["anger", "krodha", "resentment", "hatred"])
    is_hurt = any(t in all_tags for t in ["suffering", "pain", "grief", "sorrow"])
    is_fear = any(t in all_tags for t in ["fear", "anxiety", "worry"])
    is_forgiveness = any(t in all_tags for t in ["forgiveness", "compassion", "karuna"])

    sections = []

    # I Hear You - Validation (derived from Gita's Karuna/Daya)
    sections.append("# I Hear You")
    if is_anger:
        sections.append(f"What you're feeling makes complete sense. When someone we care about does something that feels unfair, that fire inside is your mind's way of saying \"this matters deeply to me.\" The ancient wisdom teaches that strong emotions aren't the enemy - it's what we do with them that matters. Don't judge yourself for feeling this way.")
    elif is_hurt:
        sections.append(f"I can hear how much this is affecting you. When someone close to us causes pain, it can shake our whole sense of safety. Your feelings are completely valid - this kind of hurt runs deep precisely because this relationship matters to you.")
    elif is_fear:
        sections.append(f"It sounds like there's a lot of uncertainty here. That unsettled feeling often comes from caring deeply about something and feeling like it's not in your control. What you're feeling is a very human response to an uncertain situation.")
    else:
        sections.append(f"I hear you. What you're going through is genuinely difficult. The fact that you're taking time to reflect rather than just react says something important about you - it shows real self-awareness and courage.")
    sections.append("")

    # What Might Be Happening - Insight (derived from Gita's Raga-Dvesha + Krodha chain)
    sections.append("# What Might Be Happening")
    sections.append("A few things that might be at play here:")
    sections.append("")

    if is_anger:
        # Derived from BG 2.62-63 Krodha chain + BG 16.21 three gates
        sections.append(f"- **The replay trap**: When we keep mentally replaying what upset us, frustration grows into full anger, and anger clouds our thinking. Notice if you're stuck in a mental loop.")
        sections.append(f"- **Unmet needs beneath the anger**: Strong frustration almost always signals something important to us isn't being acknowledged. What do you really need here - respect? Fairness? To be heard?")
        sections.append(f"- **The desire-frustration cycle**: We wanted something specific from {rel_name} - when that expectation wasn't met, frustration naturally followed. The key isn't to stop wanting - it's to hold expectations more loosely.")
    elif is_hurt:
        # Derived from BG 2.14 Titiksha + BG 2.55-56 Sthitaprajna
        sections.append(f"- **The gap between expectation and reality**: We carry deep (often unspoken) expectations about how people should treat us. When reality doesn't match, the gap itself is what hurts.")
        sections.append(f"- **Seeking worth from outside**: Part of the pain may come from looking to {rel_name} for a sense of validation or worth that ultimately can only come from within.")
        sections.append(f"- **Temporary vs. permanent**: This pain feels enormous right now, but like all experiences, it will shift. Hard times come and go - your core self remains steady underneath.")
    else:
        # Derived from BG 3.27-28 on beings acting from conditioning + BG 6.32 equal vision
        sections.append(f"- **Different inner worlds**: You and {rel_name} are experiencing this situation through completely different lenses, shaped by different experiences and fears. Neither view is the whole picture.")
        sections.append(f"- **Surface vs. depth**: What this conflict seems to be about on the surface is rarely the full story. Underneath, there's usually a deeper need - for safety, connection, respect, or understanding.")
        sections.append(f"- **Everyone acts from their conditioning**: People behave based on their accumulated experiences, habits, and fears. Understanding this doesn't excuse harm, but it helps you see the full picture.")
    sections.append("")

    # The Other Side - Perspective (derived from BG 6.32 Sama-darshana + BG 3.27-28)
    sections.append("# The Other Side")
    sections.append(f"Without excusing any hurtful behavior: {rel_name} is also navigating their own fears, wounds, and conditioning. One of the deepest insights from ancient wisdom is that people act from their own inner state, not from a conscious desire to cause harm.")
    sections.append("")
    sections.append("Consider:")
    sections.append(f"- What might {pronoun} be struggling with internally that you can't see?")
    sections.append(f"- Is there a possibility {pronoun}'re unaware of how their actions are landing?")
    sections.append(f"- What would it look like to see their struggles with the same compassion you'd want for yourself?")
    sections.append("")
    sections.append("Understanding isn't the same as excusing. It's about seeing the full picture so you can respond more wisely.")
    sections.append("")

    # What You Could Try - each derived from a specific Gita principle
    sections.append("# What You Could Try")
    sections.append("Here are approaches rooted in timeless wisdom, translated into practical action:")
    sections.append("")

    if is_anger:
        # Derived from BG 2.47 Nishkama Karma + BG 6.19 Sakshi Bhava + BG 17.15 Vak-tapas
        sections.append(f"1. **Observe before you act** (the witness practice): When anger rises, pause. Instead of becoming the anger, try watching it: \"I notice I'm feeling angry right now.\" This tiny shift from being angry to noticing anger creates space for wisdom.")
        sections.append("")
        sections.append(f"2. **Focus on your actions, not their response**: You can't control how {rel_name} behaves. But you can control how you show up. Ask: \"What would the most centered version of me do right now?\"")
        sections.append("")
        sections.append(f"3. **Speak truth with kindness**: When you do talk, apply the fourfold test: Is it true? Is it kind? Is it helpful? Is it the right time? If any answer is no, wait.")
    elif is_forgiveness:
        # Derived from BG 16.2 Kshama + BG 12.13-14 Adveshta + BG 6.5-6 Atma-seva
        sections.append(f"1. **Forgiveness as self-liberation**: Holding resentment is like carrying a heavy stone hoping someone else gets tired. Forgiveness isn't saying it was okay - it's putting down the weight for YOUR peace.")
        sections.append("")
        sections.append(f"2. **Be your own best friend**: Treat yourself with the same kindness you'd give to a close friend in your situation. You can be your greatest ally or your harshest critic - choose wisely.")
        sections.append("")
        sections.append(f"3. **Protect your peace with clear limits**: You can release resentment AND maintain firm boundaries. Understanding someone's behavior doesn't require tolerating it.")
    else:
        # Derived from BG 2.47 Nishkama Karma + BG 17.15 Vak-tapas + BG 6.32 Sama-darshana
        sections.append(f"1. **Name your actual need**: Get specific. \"I need to feel respected when we disagree\" is clearer and more actionable than \"I want things to be better.\"")
        sections.append("")
        sections.append(f"2. **Choose the right moment**: Timing matters. A conversation when both people are calm and present is worth ten conversations in the heat of the moment.")
        sections.append("")
        sections.append(f"3. **Listen to truly understand**: When {pronoun} speak, listen as if you're genuinely trying to learn something new about them. People can feel the difference between real listening and waiting for your turn to talk.")
    sections.append("")

    # A Way to Say It - derived from BG 17.15 Vak-tapas
    sections.append("# A Way to Say It")
    sections.append("When you're ready, here's a way to open the conversation:")
    sections.append("")
    sections.append(f"*\"I've been thinking about us, and I want to share something honestly but kindly. When [specific situation], I felt [your emotion]. I think it's because I really need [underlying need]. I'm not looking for a debate - I just want us to understand each other better. Can you help me understand what was going on for you?\"*")
    sections.append("")
    sections.append("The key principles: truthful but kind, helpful not harmful, and spoken at the right time. Start gently - the first few minutes set the tone for the entire conversation.")
    sections.append("")

    # Gita Wisdom - ONE to TWO relevant verses in accessible language
    sections.append("# Gita Wisdom")
    sections.append("")

    # Primary verse based on emotional theme
    if is_anger and teachings:
        wisdom = teachings[0]
        verse_ref = wisdom["verse_ref"] or "2:62-63"
        sections.append(f"**{verse_ref}** - There's a powerful insight here: when we keep replaying what upset us, attachment to the situation grows. From that attachment comes stronger desire for things to be different. When that desire is frustrated, anger erupts - and anger clouds our ability to think clearly.")
        sections.append("")
        sections.append(f"What this means for you: Your anger is valid, but notice if you're caught in a replay loop. The path to peace isn't suppressing the anger - it's choosing not to feed it with endless mental reruns. You can honor the hurt without letting it run the show.")
    elif is_hurt and teachings:
        wisdom = teachings[0]
        verse_ref = wisdom["verse_ref"] or "2:14"
        sections.append(f"**{verse_ref}** - An ancient truth that still holds: joy and pain come and go like seasons. They are real experiences, but they are visitors - not permanent residents. The wise person learns to hold both without being swept away.")
        sections.append("")
        sections.append(f"What this means for you: This pain is real and it matters. But it won't define you forever. You've weathered storms before. Underneath the hurt, there's a steady, unshakeable part of you that no one can touch.")
    elif is_forgiveness and teachings:
        wisdom = teachings[0]
        verse_ref = wisdom["verse_ref"] or "12:13-14"
        sections.append(f"**{verse_ref}** - The ideal described here is someone free from ill-will toward all beings, genuinely friendly and compassionate. Not because they've never been hurt, but because they've chosen freedom over resentment.")
        sections.append("")
        sections.append(f"What this means for you: Kshama (forgiveness) isn't about saying what happened was acceptable. It's about freeing yourself from the weight of carrying it. When you forgive, you're not excusing {obj_pronoun} - you're releasing yourself.")
    elif is_fear and teachings:
        wisdom = teachings[0]
        verse_ref = wisdom["verse_ref"] or "2:20"
        sections.append(f"**{verse_ref}** - At the deepest level, your true essence cannot be harmed, diminished, or taken away by any circumstance. Who you really are is beyond any situation.")
        sections.append("")
        sections.append(f"What this means for you: Whatever you're afraid of losing, your fundamental worth remains intact. You are not this situation. The fear is natural, but at your core, there's something steady and whole that persists regardless of how this unfolds.")
    else:
        verse_ref = "2:47"
        if teachings and teachings[0]["verse_ref"]:
            verse_ref = teachings[0]["verse_ref"]
        sections.append(f"**{verse_ref}** - Perhaps the most powerful teaching for relationships: you have every right to do your best - but you don't get to control the outcome. Focus on how YOU show up; release attachment to how others respond.")
        sections.append("")
        sections.append(f"What this means for you: You can't control how {rel_name} will react. But you can control whether you show up with integrity, honesty, and genuine care. Do your part well, then let go of trying to manage the result. Peace lives in that letting go.")

    # Add second verse if available
    if len(teachings) > 1:
        wisdom2 = teachings[1]
        verse_ref2 = wisdom2["verse_ref"]
        if verse_ref2:
            sections.append("")
            sections.append(f"**{verse_ref2}** - \"{wisdom2['english'][:120]}...\" This teaching reminds us that the quality of our actions matters more than any specific outcome we're chasing.")
    sections.append("")

    # One Small Step - derived from Gita practice (Sakshi Bhava, Dhyana, Vak-tapas)
    sections.append("# One Small Step")
    if is_anger:
        # Derived from Sakshi Bhava (witness consciousness) BG 6.19
        sections.append(f"For today: When you feel the anger rising, try this - instead of diving into it, step back and observe it. Say to yourself: \"I notice anger is here.\" That small act of witnessing rather than becoming the emotion is one of the most powerful things you can practice. It creates just enough space for wisdom.")
    elif is_hurt:
        # Derived from Svadhyaya (self-study) BG 4.38
        sections.append(f"For today: Write down what you're really feeling - not what you think you \"should\" feel, but what's actually there. Sometimes getting it out of your head and onto paper reveals what you truly need. This honest self-reflection is one of the oldest paths to clarity.")
    elif is_forgiveness:
        # Derived from Sama-darshana (equal vision) BG 6.32
        sections.append(f"For today: See if you can hold both truths at once - \"what {pronoun} did hurt me\" AND \"{pronoun}'re a human being struggling with their own fears and limitations.\" You don't have to choose between these. Both are true simultaneously.")
    else:
        # Derived from Nishkama Karma (intention-setting) BG 2.47
        sections.append(f"For today: Before your next interaction with {rel_name}, set a clear intention - not about the outcome you want, but about how you want to show up. Something like: \"I'm going to listen with genuine curiosity\" or \"I'm going to speak honestly but kindly.\" Focus on the action, not the result.")

    return "\n".join(sections)
