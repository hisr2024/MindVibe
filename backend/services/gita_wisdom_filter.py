"""
KIAAN AI Gita Core Wisdom Filter v1.0

This service ensures ALL OpenAI API responses pass through Bhagavad Gita Core Wisdom.
It provides both static wisdom validation (700+ verses) and dynamic response enhancement.

CORE PRINCIPLES:
1. Every AI response MUST be grounded in Bhagavad Gita teachings
2. Static wisdom from 701 verses provides the foundation
3. Dynamic enhancement adds contextual Gita insights
4. All tools (Ardha, Viyoga, Relationship Compass, Emotional Reset, Karma Reset)
   MUST have their responses filtered through this service

FILTER STAGES:
1. VALIDATION - Check if response contains Gita wisdom elements
2. ENHANCEMENT - Add Gita context if missing
3. GROUNDING - Ensure practical wisdom is Gita-aligned
4. CITATION - Verify verse references are from the 701-verse repository

USAGE:
    from backend.services.gita_wisdom_filter import gita_wisdom_filter

    # Filter any AI response
    filtered_response = await gita_wisdom_filter.filter_response(
        content=ai_response,
        tool_type="viyoga",  # ardha, viyoga, relationship_compass, emotional_reset, karma_reset
        user_context="User's original concern"
    )
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


class WisdomTool(Enum):
    """Tools that require Gita wisdom filtering."""
    ARDHA = "ardha"
    VIYOGA = "viyoga"
    RELATIONSHIP_COMPASS = "relationship_compass"
    EMOTIONAL_RESET = "emotional_reset"
    KARMA_RESET = "karma_reset"
    GENERAL = "general"


@dataclass
class FilterResult:
    """Result of Gita wisdom filtering."""
    content: str
    is_gita_grounded: bool
    wisdom_score: float  # 0.0 to 1.0
    verses_referenced: list[str]
    gita_concepts_found: list[str]
    enhancement_applied: bool
    filter_metadata: dict[str, Any] = field(default_factory=dict)


# =============================================================================
# STATIC GITA WISDOM DATABASE
# =============================================================================

# Core Gita concepts that indicate Gita-grounded responses
GITA_CORE_CONCEPTS = {
    # Karma Yoga concepts
    "karma": "selfless action",
    "nishkama": "desireless action",
    "phala": "fruits of action",
    "samatva": "equanimity",
    "svadharma": "one's sacred duty",
    "karma yoga": "yoga of action",

    # Mind and wisdom concepts
    "sthitaprajna": "person of steady wisdom",
    "buddhi": "discriminative intellect",
    "viveka": "discrimination",
    "sakshi": "witness consciousness",
    "chitta": "mind-stuff",
    "vritti": "mental modification",

    # Emotional concepts
    "krodha": "anger",
    "raga": "attachment",
    "dvesha": "aversion",
    "moha": "delusion",
    "lobha": "greed",
    "mada": "pride",
    "matsarya": "jealousy",
    "bhaya": "fear",
    "shoka": "grief",

    # Relationship concepts
    "dharma": "righteous duty",
    "daya": "compassion",
    "kshama": "forgiveness",
    "ahimsa": "non-violence",
    "satya": "truth",
    "sama-darshana": "equal vision",
    "maitri": "friendship",
    "karuna": "compassion",

    # Spiritual concepts
    "atman": "eternal self",
    "yoga": "union",
    "vairagya": "detachment",
    "santosha": "contentment",
    "ishvara pranidhana": "surrender to the divine",
    "prakriti": "nature",
    "guna": "quality/attribute",
    "sattva": "purity",
    "rajas": "activity",
    "tamas": "inertia",
}

# Verse reference patterns
VERSE_PATTERNS = [
    r"BG\s*\d+\.\d+",  # BG 2.47
    r"Gita\s*\d+\.\d+",  # Gita 2.47
    r"Chapter\s*\d+[\s,]*[Vv]erse\s*\d+",  # Chapter 2, Verse 47
    r"\d+\.\d+",  # 2.47 (within Gita context)
]

# Key Gita teachings for each tool
TOOL_CORE_TEACHINGS = {
    WisdomTool.ARDHA: {
        "primary_verse": "BG 2.14",
        "teaching": "The contacts of the senses with their objects give rise to feelings of cold and heat, pleasure and pain. They come and go; they are impermanent. Endure them.",
        "concepts": ["sthitaprajna", "buddhi", "viveka", "sakshi", "chitta", "vritti"],
        "keywords": ["reframe", "witness", "thought", "mind", "steady", "wisdom", "observe"],
    },
    WisdomTool.VIYOGA: {
        "primary_verse": "BG 2.47",
        "teaching": "You have the right to perform your prescribed duty, but you are not entitled to the fruits of action.",
        "concepts": ["karma", "nishkama", "phala", "samatva", "vairagya", "karma yoga"],
        "keywords": ["detach", "outcome", "action", "effort", "release", "fruit", "result"],
    },
    WisdomTool.RELATIONSHIP_COMPASS: {
        "primary_verse": "BG 6.32",
        "teaching": "One who sees equality everywhere, seeing his own self in all beings, is the highest yogi.",
        "concepts": ["dharma", "daya", "kshama", "ahimsa", "sama-darshana", "maitri"],
        "keywords": ["relationship", "compassion", "forgive", "communicate", "understand", "connect"],
    },
    WisdomTool.EMOTIONAL_RESET: {
        "primary_verse": "BG 6.5",
        "teaching": "One must elevate, not degrade oneself by one's own mind. The mind is the friend of the conditioned soul, and his enemy as well.",
        "concepts": ["chitta", "shanti", "samatva", "sthitaprajna", "santosha"],
        "keywords": ["breath", "calm", "peace", "reset", "release", "emotion", "balance"],
    },
    WisdomTool.KARMA_RESET: {
        "primary_verse": "BG 18.66",
        "teaching": "Abandon all varieties of dharmas and surrender unto Me alone. I shall deliver you from all sinful reactions. Do not fear.",
        "concepts": ["karma", "kshama", "pratyavekshanam", "dharma", "prayaschitta"],
        "keywords": ["repair", "forgive", "amend", "intention", "action", "heal", "restore"],
    },
    WisdomTool.GENERAL: {
        "primary_verse": "BG 2.48",
        "teaching": "Perform action, O Arjuna, being steadfast in yoga, abandoning attachment and balanced in success and failure. Equanimity is called yoga.",
        "concepts": ["yoga", "samatva", "karma", "buddhi", "dharma"],
        "keywords": ["wisdom", "guidance", "insight", "help", "support"],
    },
}

# Load complete Gita verses from JSON
GITA_VERSES: list[dict[str, Any]] = []
GITA_VERSES_PATH = Path(__file__).parent.parent.parent / "data" / "gita" / "gita_verses_complete.json"

try:
    if GITA_VERSES_PATH.exists():
        with open(GITA_VERSES_PATH, "r", encoding="utf-8") as f:
            GITA_VERSES = json.load(f)
        logger.info(f"GitaWisdomFilter: Loaded {len(GITA_VERSES)} verses for validation")
    else:
        logger.warning(f"GitaWisdomFilter: Verses file not found at {GITA_VERSES_PATH}")
except Exception as e:
    logger.error(f"GitaWisdomFilter: Failed to load verses: {e}")


# =============================================================================
# GITA WISDOM FILTER CLASS
# =============================================================================

class GitaWisdomFilter:
    """
    Central filter for ensuring all AI responses are grounded in Bhagavad Gita wisdom.

    This filter is applied to ALL OpenAI API responses before they are returned
    to users. It validates, enhances, and grounds responses in authentic Gita teachings.

    FILTER STAGES:
    1. VALIDATION - Check if response contains Gita wisdom elements
    2. ENHANCEMENT - Add Gita context if missing or weak
    3. GROUNDING - Ensure practical wisdom aligns with Gita principles
    4. CITATION - Verify verse references are from the 701-verse repository

    WISDOM SCORE THRESHOLDS:
    - 0.8+ : Excellent Gita grounding, no enhancement needed
    - 0.5-0.8: Moderate grounding, minor enhancement applied
    - 0.3-0.5: Weak grounding, significant enhancement applied
    - <0.3 : Poor grounding, major enhancement or fallback used
    """

    # Minimum wisdom score thresholds
    MIN_WISDOM_SCORE = 0.3  # Below this, major enhancement required
    GOOD_WISDOM_SCORE = 0.5  # Above this, only minor enhancement
    EXCELLENT_WISDOM_SCORE = 0.8  # Above this, no enhancement needed

    def __init__(self):
        """Initialize the Gita Wisdom Filter."""
        self._verses = GITA_VERSES
        self._concepts = GITA_CORE_CONCEPTS
        self._tool_teachings = TOOL_CORE_TEACHINGS
        self._verse_index = self._build_verse_index()

        logger.info(
            f"GitaWisdomFilter initialized: "
            f"{len(self._verses)} verses, "
            f"{len(self._concepts)} concepts"
        )

    def _build_verse_index(self) -> dict[str, dict[str, Any]]:
        """Build an index of verses by reference for quick lookup."""
        index = {}
        for verse in self._verses:
            chapter = verse.get("chapter", 0)
            verse_num = verse.get("verse", 0)
            ref = f"BG {chapter}.{verse_num}"
            index[ref] = verse
            # Also index without 'BG' prefix
            index[f"{chapter}.{verse_num}"] = verse
        return index

    def _calculate_wisdom_score(
        self,
        content: str,
        tool_type: WisdomTool,
    ) -> tuple[float, list[str], list[str]]:
        """
        Calculate how well the content is grounded in Gita wisdom.

        Returns:
            Tuple of (score, verses_found, concepts_found)
        """
        content_lower = content.lower()
        score = 0.0
        verses_found = []
        concepts_found = []

        # Check for verse references (high value)
        for pattern in VERSE_PATTERNS:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                # Validate verse exists in our repository
                normalized = match.upper().replace(" ", "")
                if not normalized.startswith("BG"):
                    normalized = f"BG{match}"
                if normalized.replace("BG", "BG ") in self._verse_index or match in self._verse_index:
                    verses_found.append(match)
                    score += 0.15  # Each valid verse reference adds 0.15

        # Check for Gita concepts (medium value)
        for concept, meaning in self._concepts.items():
            if concept.lower() in content_lower:
                concepts_found.append(concept)
                score += 0.08  # Each concept adds 0.08
            # Also check for the meaning/translation
            if meaning.lower() in content_lower:
                if concept not in concepts_found:
                    concepts_found.append(f"{concept} ({meaning})")
                    score += 0.05

        # Check for tool-specific keywords (lower value)
        tool_teaching = self._tool_teachings.get(tool_type, self._tool_teachings[WisdomTool.GENERAL])
        for keyword in tool_teaching.get("keywords", []):
            if keyword.lower() in content_lower:
                score += 0.02

        # Check for tool-specific concepts (bonus)
        for concept in tool_teaching.get("concepts", []):
            if concept.lower() in content_lower and concept not in concepts_found:
                concepts_found.append(concept)
                score += 0.1  # Tool-specific concepts get higher bonus

        # Cap score at 1.0
        score = min(score, 1.0)

        return score, list(set(verses_found)), list(set(concepts_found))

    def _get_enhancement_context(
        self,
        tool_type: WisdomTool,
        user_context: str,
    ) -> dict[str, Any]:
        """Get Gita enhancement context for a tool and user context."""
        tool_teaching = self._tool_teachings.get(tool_type, self._tool_teachings[WisdomTool.GENERAL])

        # Search for relevant verses based on user context
        relevant_verses = self._search_verses(user_context, tool_type, limit=3)

        return {
            "primary_verse": tool_teaching["primary_verse"],
            "primary_teaching": tool_teaching["teaching"],
            "core_concepts": tool_teaching["concepts"][:3],
            "relevant_verses": relevant_verses,
        }

    def _search_verses(
        self,
        query: str,
        tool_type: WisdomTool,
        limit: int = 3,
    ) -> list[dict[str, Any]]:
        """Search for relevant verses based on query and tool type."""
        if not self._verses:
            return []

        query_lower = query.lower()
        query_words = set(query_lower.split())

        # Get tool-specific keywords
        tool_teaching = self._tool_teachings.get(tool_type, self._tool_teachings[WisdomTool.GENERAL])
        tool_keywords = set(tool_teaching.get("keywords", []))

        # Expand with Gita concepts
        expanded_keywords = query_words | tool_keywords
        for concept in tool_teaching.get("concepts", []):
            expanded_keywords.add(concept.lower())

        # Score verses
        scored_verses = []
        for verse in self._verses:
            score = 0.0

            # Check mental health applications
            mh_apps = verse.get("mental_health_applications", [])
            for app in mh_apps:
                if any(k in app.lower() for k in expanded_keywords):
                    score += 2.0

            # Check theme
            theme = verse.get("theme", "").lower()
            if any(k in theme for k in expanded_keywords):
                score += 1.5

            # Check English translation
            english = verse.get("english", "").lower()
            for word in expanded_keywords:
                if len(word) > 3 and word in english:
                    score += 0.5

            # Check principle
            principle = verse.get("principle", "").lower()
            for word in expanded_keywords:
                if len(word) > 3 and word in principle:
                    score += 0.3

            if score > 0:
                scored_verses.append((score, verse))

        # Sort and return top results
        scored_verses.sort(key=lambda x: x[0], reverse=True)

        return [
            {
                "reference": f"BG {v.get('chapter', 0)}.{v.get('verse', 0)}",
                "english": v.get("english", ""),
                "principle": v.get("principle", ""),
            }
            for _, v in scored_verses[:limit]
        ]

    def _create_wisdom_enhancement(
        self,
        original_content: str,
        enhancement_context: dict[str, Any],
        wisdom_score: float,
    ) -> str:
        """
        Enhance content with Gita wisdom when score is below threshold.

        For significant enhancements (score < 0.3), prepends a Gita grounding block.
        For minor enhancements (score 0.3-0.5), appends relevant verse context.
        """
        if wisdom_score >= self.GOOD_WISDOM_SCORE:
            # Only minor enhancement - add verse reference if missing
            if not any(pattern in original_content for pattern in ["BG ", "Gita ", "Chapter "]):
                primary_verse = enhancement_context.get("primary_verse", "BG 2.47")
                return f"{original_content}\n\n*Grounded in {primary_verse}*"
            return original_content

        # Build enhancement based on score
        enhanced_parts = []

        if wisdom_score < self.MIN_WISDOM_SCORE:
            # Major enhancement needed - add Gita grounding block at start
            primary_teaching = enhancement_context.get("primary_teaching", "")
            primary_verse = enhancement_context.get("primary_verse", "BG 2.47")

            grounding_block = f"""**Gita Wisdom Foundation**

As {primary_verse} teaches: "{primary_teaching}"

"""
            enhanced_parts.append(grounding_block)

        enhanced_parts.append(original_content)

        # Add relevant verses at the end
        relevant_verses = enhancement_context.get("relevant_verses", [])
        if relevant_verses and wisdom_score < self.GOOD_WISDOM_SCORE:
            verses_block = "\n\n**Gita Wisdom Applied**\n"
            for verse in relevant_verses[:2]:
                ref = verse.get("reference", "")
                english = verse.get("english", "")[:150]
                if ref and english:
                    verses_block += f"\n- ({ref}): \"{english}...\""
            enhanced_parts.append(verses_block)

        return "".join(enhanced_parts)

    async def filter_response(
        self,
        content: str,
        tool_type: str | WisdomTool = WisdomTool.GENERAL,
        user_context: str = "",
        enhance_if_needed: bool = True,
    ) -> FilterResult:
        """
        Filter an AI response through Gita Core Wisdom.

        This is the MAIN entry point that ALL AI responses should pass through.

        Args:
            content: The AI-generated response content
            tool_type: Which tool generated this response (for context-specific filtering)
            user_context: Original user input (for relevant verse search)
            enhance_if_needed: Whether to enhance responses with low wisdom scores

        Returns:
            FilterResult with filtered/enhanced content and metadata
        """
        # Convert string tool type to enum
        if isinstance(tool_type, str):
            try:
                tool_type = WisdomTool(tool_type.lower())
            except ValueError:
                tool_type = WisdomTool.GENERAL

        # Stage 1: Calculate wisdom score
        wisdom_score, verses_found, concepts_found = self._calculate_wisdom_score(
            content, tool_type
        )

        is_gita_grounded = wisdom_score >= self.MIN_WISDOM_SCORE
        enhancement_applied = False
        filtered_content = content

        # Stage 2 & 3: Enhancement and Grounding (if needed)
        if enhance_if_needed and wisdom_score < self.EXCELLENT_WISDOM_SCORE:
            enhancement_context = self._get_enhancement_context(tool_type, user_context)
            filtered_content = self._create_wisdom_enhancement(
                content, enhancement_context, wisdom_score
            )
            enhancement_applied = True

            # Recalculate score after enhancement
            new_score, new_verses, new_concepts = self._calculate_wisdom_score(
                filtered_content, tool_type
            )
            verses_found = list(set(verses_found + new_verses))
            concepts_found = list(set(concepts_found + new_concepts))
            wisdom_score = max(wisdom_score, new_score)
            is_gita_grounded = wisdom_score >= self.MIN_WISDOM_SCORE

        # Stage 4: Citation validation (verify verse references)
        validated_verses = []
        for verse_ref in verses_found:
            # Normalize reference
            normalized = verse_ref.upper().replace(" ", "")
            if not normalized.startswith("BG"):
                normalized = f"BG{verse_ref}"
            check_ref = normalized.replace("BG", "BG ")

            if check_ref in self._verse_index or verse_ref in self._verse_index:
                validated_verses.append(verse_ref)

        logger.info(
            f"GitaWisdomFilter: tool={tool_type.value}, "
            f"score={wisdom_score:.2f}, "
            f"grounded={is_gita_grounded}, "
            f"verses={len(validated_verses)}, "
            f"concepts={len(concepts_found)}, "
            f"enhanced={enhancement_applied}"
        )

        return FilterResult(
            content=filtered_content,
            is_gita_grounded=is_gita_grounded,
            wisdom_score=wisdom_score,
            verses_referenced=validated_verses,
            gita_concepts_found=concepts_found,
            enhancement_applied=enhancement_applied,
            filter_metadata={
                "tool_type": tool_type.value,
                "original_length": len(content),
                "filtered_length": len(filtered_content),
                "validation_passed": is_gita_grounded,
            },
        )

    def validate_response(
        self,
        content: str,
        tool_type: str | WisdomTool = WisdomTool.GENERAL,
        min_score: float | None = None,
    ) -> tuple[bool, float, dict[str, Any]]:
        """
        Validate if a response meets Gita wisdom requirements.

        This is a quick validation check without enhancement.

        Args:
            content: The AI response to validate
            tool_type: Which tool this is for
            min_score: Minimum required score (defaults to MIN_WISDOM_SCORE)

        Returns:
            Tuple of (is_valid, score, details)
        """
        if isinstance(tool_type, str):
            try:
                tool_type = WisdomTool(tool_type.lower())
            except ValueError:
                tool_type = WisdomTool.GENERAL

        min_score = min_score or self.MIN_WISDOM_SCORE

        score, verses, concepts = self._calculate_wisdom_score(content, tool_type)

        is_valid = score >= min_score

        return is_valid, score, {
            "verses_found": verses,
            "concepts_found": concepts,
            "min_required": min_score,
            "tool_type": tool_type.value,
        }

    def get_tool_context(self, tool_type: str | WisdomTool) -> dict[str, Any]:
        """Get the Gita context for a specific tool."""
        if isinstance(tool_type, str):
            try:
                tool_type = WisdomTool(tool_type.lower())
            except ValueError:
                tool_type = WisdomTool.GENERAL

        return self._tool_teachings.get(tool_type, self._tool_teachings[WisdomTool.GENERAL])

    def get_fallback_response(self, tool_type: str | WisdomTool) -> str:
        """Get a Gita-grounded fallback response for a tool."""
        if isinstance(tool_type, str):
            try:
                tool_type = WisdomTool(tool_type.lower())
            except ValueError:
                tool_type = WisdomTool.GENERAL

        teaching = self._tool_teachings.get(tool_type, self._tool_teachings[WisdomTool.GENERAL])

        return f"""**Wisdom from the Bhagavad Gita**

{teaching['primary_verse']} teaches us:

"{teaching['teaching']}"

This ancient wisdom reminds us that true peace comes from understanding ourselves and acting with equanimity. Whatever you are facing, remember that you are not alone in this journey.

*Take a moment to breathe, reflect, and connect with your inner wisdom.*"""


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

_filter_instance: GitaWisdomFilter | None = None


def get_gita_wisdom_filter() -> GitaWisdomFilter:
    """Get the singleton GitaWisdomFilter instance."""
    global _filter_instance
    if _filter_instance is None:
        _filter_instance = GitaWisdomFilter()
    return _filter_instance


# Convenience export
gita_wisdom_filter = get_gita_wisdom_filter()


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

async def filter_ai_response(
    content: str,
    tool_type: str = "general",
    user_context: str = "",
) -> str:
    """
    Convenience function to filter an AI response through Gita wisdom.

    This is the simplest way to ensure any AI response is Gita-grounded.

    Args:
        content: AI response content
        tool_type: Type of tool (ardha, viyoga, relationship_compass, etc.)
        user_context: Original user input

    Returns:
        Filtered content grounded in Gita wisdom
    """
    result = await gita_wisdom_filter.filter_response(
        content=content,
        tool_type=tool_type,
        user_context=user_context,
    )
    return result.content


def is_gita_grounded(content: str, tool_type: str = "general") -> bool:
    """Quick check if content is Gita-grounded."""
    is_valid, _, _ = gita_wisdom_filter.validate_response(content, tool_type)
    return is_valid
