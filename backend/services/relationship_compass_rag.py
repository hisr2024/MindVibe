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

# Secular, modern, friendly headings (no spiritual language)
HEADINGS_SECULAR = [
    "I Hear You",
    "What Might Be Happening",
    "The Other Side",
    "What You Could Try",
    "A Way to Say It",
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
    """Generate a Gita-based response deeply rooted in retrieved verse wisdom.

    This creates meaningful guidance using actual Gita teachings from the 700+ verse
    repository, similar to KIAAN Chat's approach of grounding every response in
    authentic scripture wisdom.
    """
    if not chunks:
        return build_insufficient_response()

    # Extract rich wisdom from top chunks
    wisdom_items = [extract_verse_wisdom(chunk) for chunk in chunks[:8]]
    teachings = [w for w in wisdom_items if w["english"]]
    verse_refs = [w["verse_ref"] for w in wisdom_items if w["verse_ref"]]

    # Collect themes and tags for understanding the retrieved context
    all_tags = set()
    for w in wisdom_items:
        all_tags.update(tag.lower().replace("_", " ") for tag in w["tags"])

    # Determine relationship-specific context
    relationship_contexts = {
        "romantic": "partner, beloved, spouse",
        "family": "family member, parent, child, sibling",
        "friendship": "friend, companion",
        "workplace": "colleague, work relationship",
        "self": "yourself, inner self",
        "other": "this person",
    }
    rel_context = relationship_contexts.get(relationship_type, "this person")

    # Build response sections deeply grounded in retrieved Gita wisdom
    sections = []

    # Sacred Acknowledgement - grounded in retrieved themes
    sections.append("# Sacred Acknowledgement")
    ack_teaching = teachings[0]["english"] if teachings else ""
    if "compassion" in all_tags or "karuna" in all_tags or "daya" in all_tags:
        sections.append(f"I witness the pain you carry with deep daya (compassion). The timeless wisdom reminds us: '{ack_teaching[:150]}...' Your willingness to seek understanding rather than simply reacting reveals your inner strength. This moment of reflection is itself an act of dharma.")
    elif "anger" in all_tags or "krodha" in all_tags:
        sections.append(f"I honor the intensity of what you're feeling. The ancient teachings speak directly to this: '{ack_teaching[:150]}...' Anger often masks deeper wounds - fear, hurt, unmet needs. Your awareness of this conflict is the first step toward clarity.")
    else:
        sections.append(f"I bow to the tender heart that brought you here. The eternal wisdom teaches: '{ack_teaching[:150]}...' Every awakened soul throughout time has faced moments exactly like this. You are not alone in this struggle.")
    sections.append("")

    # Inner Conflict Mirror - using actual verse teachings
    sections.append("# Inner Conflict Mirror")
    if len(teachings) > 1:
        mirror_teaching = teachings[1]["english"]
        sections.append(f"The Gita reveals a profound truth ({verse_refs[1] if len(verse_refs) > 1 else '2:62'}): '{mirror_teaching[:200]}' This speaks directly to your situation with {rel_context}. What wound is being touched here? What do you truly need beneath the surface - to be seen? Understood? Respected? Safe?")
    else:
        sections.append("Ancient wisdom teaches: all outer conflicts are mirrors of inner ones. The Gita's teaching of svadhyaya (self-study) invites us to look within first. What do you truly need beneath the surface of this conflict?")
    sections.append("")

    # Gita Teachings Used - comprehensive verse integration
    sections.append("# Gita Teachings Used")
    sections.append(f"These verses from the Bhagavad Gita ({', '.join(verse_refs[:4])}) illuminate your path:")
    sections.append("")
    for i, wisdom in enumerate(teachings[:4], 1):
        if wisdom["english"]:
            theme_note = f" [{wisdom['theme']}]" if wisdom["theme"] else ""
            sections.append(f"{i}. ({wisdom['verse_ref']}){theme_note}: \"{wisdom['english'][:180]}...\"")
            sections.append("")
    sections.append("")

    # Dharma Options - grounded in specific retrieved wisdom
    sections.append("# Dharma Options")
    sections.append("Drawing from these teachings, consider three dharmic paths:")
    sections.append("")

    # Option 1 - based on first relevant teaching
    opt1_ref = verse_refs[0] if verse_refs else "2:47"
    opt1_teaching = teachings[0]["english"][:100] if teachings else "Focus on action, release attachment to results"
    sections.append(f"1. **Karma Yoga Path** ({opt1_ref}): '{opt1_teaching}...' Applied here: Focus on YOUR actions and intentions, not on controlling {rel_context}'s response. What right action can you take today, regardless of outcome?")
    sections.append("")

    # Option 2 - based on second teaching or forgiveness theme
    opt2_ref = verse_refs[1] if len(verse_refs) > 1 else "12:13"
    if len(teachings) > 1:
        opt2_teaching = teachings[1]["english"][:100]
    else:
        opt2_teaching = "One who is free from malice toward all beings, friendly and compassionate"
    sections.append(f"2. **Kshama (Forgiveness) Path** ({opt2_ref}): '{opt2_teaching}...' Applied here: Forgiveness is not condoning harm - it is YOUR liberation. It means releasing the poison of resentment so YOU can be free.")
    sections.append("")

    # Option 3 - equal vision
    opt3_ref = verse_refs[2] if len(verse_refs) > 2 else "6:32"
    if len(teachings) > 2:
        opt3_teaching = teachings[2]["english"][:100]
    else:
        opt3_teaching = "One who sees equality everywhere, seeing their own self in all beings"
    sections.append(f"3. **Sama-Darshana (Equal Vision) Path** ({opt3_ref}): '{opt3_teaching}...' Applied here: See the divine struggling in {rel_context} too. They act from their own wounds, fears, and conditioning - not to hurt you, but because they suffer too.")
    sections.append("")

    # Sacred Speech - with verse grounding
    sections.append("# Sacred Speech")
    speech_ref = verse_refs[3] if len(verse_refs) > 3 else "17:15"
    sections.append(f"The Gita teaches ({speech_ref}): 'Speech that causes no distress, that is truthful, pleasant, and beneficial.' When you're ready to speak:")
    sections.append("")
    sections.append("Try this dharmic formula: 'When [specific situation happens], I feel [your emotion], because I need [underlying need]. What I'm hoping we can explore together is [request, not demand].'")
    sections.append("")
    sections.append("Before speaking, pause and ask: Am I speaking from my wound or my wisdom? Will these words bring us closer to peace?")
    sections.append("")

    # Detachment Anchor - with core teaching
    sections.append("# Detachment Anchor")
    anchor_ref = verse_refs[0] if verse_refs else "2:47"
    anchor_teaching = teachings[0]["english"] if teachings else "You have the right to action alone, never to the fruits"
    sections.append(f"({anchor_ref}): '{anchor_teaching[:150]}...'")
    sections.append("")
    sections.append(f"Your dharma is to act with integrity toward {rel_context}; the outcome is not yours to control. Release attachment to HOW this must resolve. Trust that right action, performed without attachment, creates right results in ways you cannot foresee.")
    sections.append("")

    # One Next Step - specific action from teachings
    sections.append("# One Next Step")
    step_ref = verse_refs[1] if len(verse_refs) > 1 else "6:5"
    sections.append(f"Today, practice witness consciousness ({step_ref}): When emotions arise about this situation, simply observe them without becoming them. Say internally: 'I see you, anger/hurt/fear. I am not you - I am the one who witnesses.'")
    sections.append("")
    sections.append("This is sakshi bhava - the observer stance that the Gita teaches as the gateway to equanimity.")
    sections.append("")

    # One Gentle Question
    sections.append("# One Gentle Question")
    sections.append(f"If you were at complete peace with yourself - needing nothing from {rel_context} to feel whole - how would you respond to this situation? What would your highest self do here?")

    return "\n".join(sections)


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
    """Generate a modern, friendly response using wisdom internally but without spiritual language.

    This creates practical relationship guidance that's informed by timeless wisdom
    but presented in everyday, secular language that anyone can relate to.
    """
    if not chunks:
        return build_secular_insufficient_response()

    # Extract wisdom themes to inform our advice (but never mention them)
    wisdom_items = [extract_verse_wisdom(chunk) for chunk in chunks[:8]]
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

    # Detect emotional themes from tags to tailor advice
    is_anger = any(t in all_tags for t in ["anger", "krodha", "resentment", "hatred"])
    is_hurt = any(t in all_tags for t in ["suffering", "pain", "grief", "sorrow"])
    is_fear = any(t in all_tags for t in ["fear", "anxiety", "worry"])
    is_forgiveness = any(t in all_tags for t in ["forgiveness", "compassion", "karuna"])
    is_communication = any(t in all_tags for t in ["speech", "truth", "communication"])

    sections = []

    # I Hear You - Validation
    sections.append("# I Hear You")
    if is_anger:
        sections.append(f"What you're feeling makes total sense. When someone we care about does something that feels unfair or hurtful, anger is a natural response. It's actually your mind's way of saying \"this matters to me\" and \"something isn't right here.\" Don't judge yourself for feeling this way.")
    elif is_hurt:
        sections.append(f"I can hear how much this is affecting you. When we're hurt by someone close to us, it can feel like the rug has been pulled out from under us. Your feelings are completely valid - this kind of pain runs deep precisely because the relationship matters to you.")
    elif is_fear:
        sections.append(f"It sounds like there's a lot of uncertainty here, and that can be really unsettling. Fear in relationships often comes from caring deeply and not wanting to lose something important. What you're feeling is understandable.")
    else:
        sections.append(f"I hear you. Relationship challenges can feel overwhelming, especially when you're right in the middle of them. The fact that you're taking time to reflect on this instead of just reacting shows a lot of self-awareness.")
    sections.append("")

    # What Might Be Happening - Insight
    sections.append("# What Might Be Happening")
    sections.append("A few things that might be at play here:")
    sections.append("")

    if is_anger:
        sections.append(f"- **Unmet needs**: Anger often signals that something important to us isn't being acknowledged. What do you really need here - respect? To be heard? Fairness?")
        sections.append(f"- **Accumulated frustration**: Sometimes what feels like a big reaction is actually built up from smaller moments over time.")
        sections.append(f"- **Feeling powerless**: Anger can be our mind's way of trying to regain a sense of control when we feel helpless.")
    elif is_hurt:
        sections.append(f"- **Expectations vs. reality**: We often have unspoken expectations of how people should treat us. When reality doesn't match, it hurts.")
        sections.append(f"- **Past experiences**: Sometimes current situations trigger old wounds. The pain might feel bigger than the situation because it's connected to something deeper.")
        sections.append(f"- **Need for validation**: Feeling hurt often connects to wanting to be seen, valued, or understood.")
    else:
        sections.append(f"- **Different perspectives**: You and {rel_name} might be seeing the same situation very differently. Neither view is necessarily \"wrong.\"")
        sections.append(f"- **Underlying needs**: Conflicts often aren't about what they seem to be on the surface. What's the deeper need here?")
        sections.append(f"- **Communication patterns**: Sometimes how we communicate (or don't) creates misunderstandings that snowball.")
    sections.append("")

    # The Other Side - Perspective
    sections.append("# The Other Side")
    sections.append(f"Without excusing any hurtful behavior, it might help to consider: {rel_name} is also a person navigating their own fears, insecurities, and past experiences. People often act from their own pain, not from a desire to hurt us.")
    sections.append("")
    sections.append("Some questions to consider:")
    sections.append(f"- What might {pronoun} be feeling or fearing in this situation?")
    sections.append(f"- Is there any possibility {pronoun}'re unaware of how their actions are affecting you?")
    sections.append(f"- What pressure or stress might {pronoun} be under that you might not fully see?")
    sections.append("")
    sections.append("This isn't about justifying bad behavior - it's about understanding that helps you respond more effectively.")
    sections.append("")

    # What You Could Try - Practical suggestions
    sections.append("# What You Could Try")
    sections.append("Here are a few approaches that might help:")
    sections.append("")

    if is_communication or is_anger:
        sections.append("1. **Take a breather first**: Before having a conversation, give yourself time to move from reactive to responsive. A calm conversation is 10x more productive than one driven by raw emotion.")
        sections.append("")
        sections.append("2. **Focus on what you can control**: You can't control how someone else behaves, but you can control how you respond. Ask yourself: \"What would the version of me I'm proud of do here?\"")
        sections.append("")
        sections.append("3. **Lead with curiosity, not accusations**: Instead of \"You always...\" try \"Help me understand...\" People get defensive when they feel attacked, which usually makes things worse.")
    elif is_forgiveness:
        sections.append("1. **Separate the person from the action**: The person who hurt you is flawed (like all of us), but they're also more than their worst moments. This doesn't excuse the behavior - it just helps you process it.")
        sections.append("")
        sections.append("2. **Forgiveness is for you**: Holding onto resentment is like drinking poison and expecting someone else to suffer. Forgiveness doesn't mean what happened was okay - it means you're choosing to let go for your own peace.")
        sections.append("")
        sections.append("3. **Set boundaries if needed**: You can forgive someone and still set healthy boundaries. Understanding why someone hurt you doesn't mean you have to accept ongoing harmful behavior.")
    else:
        sections.append("1. **Name what you actually need**: Get specific about what you're hoping for. \"I need to feel respected\" is clearer than \"I want things to be better.\"")
        sections.append("")
        sections.append("2. **Pick the right moment**: Timing matters. Choose a moment when both of you can be present and calm, not in the heat of conflict or when either of you is stressed/tired.")
        sections.append("")
        sections.append("3. **Listen to understand, not to respond**: When they talk, really listen. Try to understand their point of view before crafting your rebuttal. People feel it when you genuinely try to understand them.")
    sections.append("")

    # A Way to Say It - Communication script
    sections.append("# A Way to Say It")
    sections.append("When you're ready, here's a template that tends to work well:")
    sections.append("")
    sections.append(f"*\"Hey, can we talk about something that's been on my mind? When [specific situation], I felt [your emotion - use 'I' statements]. I think it's because [your underlying need]. I'm not looking to argue - I just want us to understand each other better. What was going on for you in that moment?\"*")
    sections.append("")
    sections.append("Some tips:")
    sections.append("- Start soft. The first 3 minutes of a conversation often predict how it'll go.")
    sections.append("- Use \"I feel\" instead of \"You made me feel\" - it's less accusatory.")
    sections.append("- Ask genuine questions and actually listen to the answers.")
    sections.append("")

    # One Small Step - Actionable next step
    sections.append("# One Small Step")
    if is_anger:
        sections.append("For today, try this: When you notice anger about this situation rising, pause and take 3 slow breaths. Then ask yourself: \"What do I actually need here?\" Sometimes just naming the need takes away some of anger's intensity.")
    elif is_hurt:
        sections.append("For today, try this: Write down what you're feeling without censoring yourself. Sometimes getting thoughts out of our head and onto paper helps us see them more clearly. You might discover what you really need from this situation.")
    elif is_forgiveness:
        sections.append(f"For today, try this: See if you can hold two truths at once - \"what {pronoun} did hurt me\" AND \"{pronoun}'re a flawed human doing their best.\" You don't have to choose. Both can be true.")
    else:
        sections.append(f"For today, try this: Before your next interaction with {rel_name}, take a moment to set an intention. Not an outcome you're hoping for, but a way of being. Something like: \"I'm going to stay curious\" or \"I'm going to listen more than I speak.\"")

    return "\n".join(sections)
