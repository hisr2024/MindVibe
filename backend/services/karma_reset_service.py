"""
Karma Reset Service - Deep Karmic Transformation Engine.

This service orchestrates deep karma reset strictly grounded in Bhagavad Gita
wisdom. It replaces the superficial 4-step guidance with a comprehensive
7-phase karmic transformation process backed by 10 Gita-aligned karmic paths.

Key Features:
- 10 Gita-aligned karmic repair paths (kshama, satya, shanti, etc.)
- 7-phase deep transformation process (Sthiti Pariksha through Gita Darshan)
- Static wisdom from pre-mapped Gita verses with full Sanskrit text
- Dynamic wisdom from AI enhanced by deep Gita context
- Five Pillar compliance scoring for every reset
- Guna analysis to identify root cause of harmful action
- Integration with WisdomKnowledgeBase for verse retrieval
- Session persistence for tracking karmic transformation over time

Gita Foundation (BG 4.17):
"The intricacies of action are very hard to understand. Therefore one should
know properly what action is, what forbidden action is, and what inaction is."
"""

import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from backend.services.wisdom_kb import WisdomKnowledgeBase
from backend.services.gita_validator import GitaValidator
from backend.services.gita_karma_wisdom import (
    KARMIC_PATHS,
    SEVEN_PHASES,
    KARMA_RESET_CORE_VERSES,
    GUNA_ANALYSIS,
    get_karmic_path,
    get_karmic_path_by_legacy_type,
    get_all_karmic_paths_summary,
    get_seven_phases,
    build_deep_wisdom_context,
)

logger = logging.getLogger(__name__)


class KarmaResetService:
    """
    Deep Karma Reset Service with KIAAN Wisdom Engine integration.

    Orchestrates the complete karmic transformation process:
    1. Resolves the karmic path from user input
    2. Retrieves relevant Gita verses from the database
    3. Builds deep wisdom context combining static + dynamic wisdom
    4. Generates personalized 7-phase guidance
    5. Validates against Gita's Five Pillar compliance
    6. Returns comprehensive karmic transformation data
    """

    # Input validation constants
    MIN_SITUATION_LENGTH = 10
    MAX_SITUATION_LENGTH = 2000

    # Legacy repair type themes (backward compatibility)
    REPAIR_TYPE_THEMES = {
        "apology": ["forgiveness", "humility", "compassion"],
        "clarification": ["truth", "communication", "clarity"],
        "calm_followup": ["equanimity", "peace", "emotional_balance"],
        "self-forgive": ["self_compassion", "acceptance", "peace"],
    }

    REPAIR_TYPE_APPLICATIONS = {
        "apology": ["forgiveness", "compassion", "humility"],
        "clarification": ["clear_communication", "truth", "understanding"],
        "calm_followup": ["emotional_balance", "peace", "equanimity"],
        "self-forgive": ["self_compassion", "acceptance", "inner_peace"],
    }

    def __init__(self):
        """Initialize the deep Karma Reset service."""
        self._wisdom_kb = WisdomKnowledgeBase()
        self._validator = GitaValidator()

    def _normalize_repair_type(self, repair_type: str) -> str:
        """
        Normalize repair type to standard format.

        Supports both legacy 3-type system and new 10-path system.

        Args:
            repair_type: Raw repair type from request

        Returns:
            Normalized repair type string
        """
        normalized = repair_type.lower().strip()
        normalized = normalized.replace(" ", "_").replace("-", "_")

        # Handle legacy variations
        if "follow" in normalized and "up" in normalized:
            return "calm_followup"
        elif "clarif" in normalized:
            return "clarification"
        elif "apolog" in normalized:
            return "apology"
        elif "forgive" in normalized and "self" in normalized:
            return "self-forgive"

        return normalized

    def resolve_karmic_path(self, path_key: str) -> dict[str, Any]:
        """
        Resolve the full karmic path from a path key or legacy repair type.

        Tries direct path lookup first, then falls back to legacy mapping.

        Args:
            path_key: Karmic path key (e.g., 'kshama') or legacy type (e.g., 'apology')

        Returns:
            Full karmic path data dictionary

        Raises:
            ValueError: If no matching path found
        """
        # Try direct karmic path lookup
        path = get_karmic_path(path_key)
        if path:
            return path

        # Try legacy repair type mapping
        normalized = self._normalize_repair_type(path_key)
        path = get_karmic_path_by_legacy_type(normalized)
        if path:
            return path

        # Try direct lookup with normalized key
        path = get_karmic_path(normalized)
        if path:
            return path

        # Default to kshama (forgiveness) as the most universal path
        logger.warning(
            f"Unknown karmic path '{path_key}', defaulting to kshama"
        )
        return KARMIC_PATHS["kshama"]

    def get_available_paths(self) -> list[dict[str, str]]:
        """
        Get all available karmic paths for frontend display.

        Returns:
            List of path summaries with key, name, sanskrit_name, description
        """
        return get_all_karmic_paths_summary()

    def get_phase_definitions(self) -> list[dict[str, Any]]:
        """
        Get the 7-phase karma reset process definitions.

        Returns:
            List of phase definitions for the transformation journey
        """
        return get_seven_phases()

    async def get_reset_verses(
        self,
        db: AsyncSession,
        repair_type: str,
        situation: str = "",
        limit: int = 5
    ) -> list[dict[str, Any]]:
        """
        Get relevant Gita verses for a karma reset scenario.

        Enhanced to use karmic path themes for better verse matching.

        Args:
            db: Database session (read-only)
            repair_type: Karmic path key or legacy repair type
            situation: Optional situation description for better matching
            limit: Maximum number of verses to return

        Returns:
            List of verse results with scores and sanitized text
        """
        # Resolve the karmic path for theme-based searching
        karmic_path = self.resolve_karmic_path(repair_type)
        themes = karmic_path.get("themes", [])

        # Build search query from situation and karmic path themes
        query_parts = []

        if situation and len(situation) > self.MIN_SITUATION_LENGTH:
            query_parts.append(situation[:self.MAX_SITUATION_LENGTH])

        # Use karmic path themes for search
        if themes:
            query_parts.append(" ".join(themes))

        # Add gita principle keywords
        principle = karmic_path.get("gita_principle", "")
        if principle:
            # Extract key terms from the principle
            key_terms = []
            for term in ["forgiveness", "truth", "peace", "compassion", "surrender",
                         "equanimity", "detachment", "non-violence", "service",
                         "self-discipline", "trust", "faith", "wisdom", "duty",
                         "action", "karma", "dharma"]:
                if term in principle.lower():
                    key_terms.append(term)
            if key_terms:
                query_parts.append(" ".join(key_terms))

        # Fallback
        if not query_parts:
            query_parts.append("compassion wisdom peace karma dharma")

        query = " ".join(query_parts)

        try:
            verse_results = await self._wisdom_kb.search_relevant_verses_full_db(
                db=db,
                query=query,
                limit=limit
            )

            logger.info(
                f"Retrieved {len(verse_results)} verses for karmic path "
                f"'{karmic_path.get('name', 'unknown')}'"
            )

            return verse_results

        except Exception as e:
            logger.error(f"Error retrieving verses for karma reset: {str(e)}")
            return []

    def build_gita_context(
        self,
        verse_results: list[dict[str, Any]],
        repair_type: str
    ) -> str:
        """
        Build a wisdom context string from Gita verses.

        Backward-compatible method that now also uses deep wisdom context.

        Args:
            verse_results: List of verse results from get_reset_verses()
            repair_type: Type of repair action or karmic path key

        Returns:
            Formatted context string for guidance generation
        """
        if not verse_results:
            return ""

        context_parts = []

        # Add deep karmic path wisdom
        karmic_path = self.resolve_karmic_path(repair_type)
        deep_context = build_deep_wisdom_context(karmic_path)
        if deep_context:
            context_parts.append(deep_context)

        # Add dynamically retrieved verses
        context_parts.append("ADDITIONAL RELEVANT VERSES FROM DATABASE:")
        for i, result in enumerate(verse_results[:5], 1):
            sanitized_text = result.get("sanitized_text", "")
            verse = result.get("verse", {})
            verse_id = verse.get("verse_id", "")

            if sanitized_text:
                context_parts.append(f"  Verse {i} ({verse_id}): {sanitized_text}")

        return "\n".join(context_parts)

    def build_deep_reset_context(
        self,
        karmic_path: dict[str, Any],
        situation: str,
        feeling: str,
        verse_results: list[dict[str, Any]],
    ) -> str:
        """
        Build the comprehensive deep wisdom context for AI guidance generation.

        Combines static Gita wisdom from the karmic path with dynamically
        retrieved verses to create the richest possible context for AI.

        Args:
            karmic_path: Resolved karmic path data
            situation: User's description of what happened
            feeling: Who was affected
            verse_results: Dynamically retrieved relevant verses

        Returns:
            Complete wisdom context string for AI prompt
        """
        parts = []

        # Deep static wisdom from karmic path
        parts.append(build_deep_wisdom_context(karmic_path, situation))

        # Dynamic verses from database
        if verse_results:
            parts.append("\nDYNAMICALLY RETRIEVED SUPPORTING VERSES:")
            for i, result in enumerate(verse_results[:5], 1):
                sanitized = result.get("sanitized_text", "")
                verse = result.get("verse", {})
                vid = verse.get("verse_id", f"verse_{i}")
                score = result.get("score", 0.0)
                if sanitized:
                    parts.append(f"  [{vid}] (relevance: {score:.2f}): {sanitized}")

        # Seven-phase structure reference
        parts.append("\nSEVEN-PHASE KARMA RESET STRUCTURE:")
        for phase in SEVEN_PHASES:
            parts.append(
                f"  Phase {phase['phase']}: {phase['name']} ({phase['english_name']}) "
                f"- {phase['purpose']}"
            )

        # Guna analysis context
        parts.append("\nGUNA ANALYSIS FRAMEWORK:")
        for guna_key, guna_data in GUNA_ANALYSIS.items():
            parts.append(f"  {guna_data['name']}: {guna_data['description']}")

        return "\n".join(parts)

    async def generate_deep_reset(
        self,
        db: AsyncSession,
        path_key: str,
        situation: str,
        feeling: str,
    ) -> dict[str, Any]:
        """
        Generate the complete deep karma reset data.

        This is the main orchestration method that:
        1. Resolves the karmic path
        2. Retrieves relevant verses
        3. Builds the deep wisdom context
        4. Prepares the static wisdom components
        5. Returns everything needed for AI guidance generation

        The actual AI call is made in the route handler to keep the service
        focused on data preparation and wisdom retrieval.

        Args:
            db: Database session
            path_key: Karmic path key or legacy repair type
            situation: What happened
            feeling: Who was affected

        Returns:
            Complete data package for deep karma reset generation
        """
        # Step 1: Resolve karmic path
        karmic_path = self.resolve_karmic_path(path_key)

        # Step 2: Retrieve dynamically relevant verses
        verse_results = await self.get_reset_verses(
            db=db,
            repair_type=path_key,
            situation=situation,
            limit=7
        )

        # Step 3: Build deep wisdom context for AI
        wisdom_context = self.build_deep_reset_context(
            karmic_path=karmic_path,
            situation=situation,
            feeling=feeling,
            verse_results=verse_results,
        )

        # Step 4: Prepare static wisdom components
        core_verse = karmic_path.get("core_verse", {})
        supporting_verses = karmic_path.get("supporting_verses", [])
        sadhana = karmic_path.get("sadhana", [])

        # Step 5: Prepare verse display data (full verses for frontend)
        verse_display = []
        for result in verse_results[:3]:
            verse = result.get("verse", {})
            verse_display.append({
                "verse_id": verse.get("verse_id", ""),
                "chapter": verse.get("chapter", 0),
                "verse_number": verse.get("verse", 0),
                "sanskrit": verse.get("sanskrit", ""),
                "transliteration": verse.get("transliteration", ""),
                "english": verse.get("english", ""),
                "hindi": verse.get("hindi", ""),
                "theme": verse.get("theme", ""),
                "score": result.get("score", 0.0),
                "sanitized_text": result.get("sanitized_text", ""),
            })

        return {
            "karmic_path": {
                "key": path_key,
                "name": karmic_path.get("name", ""),
                "sanskrit_name": karmic_path.get("sanskrit_name", ""),
                "description": karmic_path.get("description", ""),
                "gita_principle": karmic_path.get("gita_principle", ""),
                "karmic_teaching": karmic_path.get("karmic_teaching", ""),
                "guna_analysis": karmic_path.get("guna_analysis", ""),
                "themes": karmic_path.get("themes", []),
            },
            "core_verse": core_verse,
            "supporting_verses": supporting_verses,
            "sadhana": sadhana,
            "seven_phases": get_seven_phases(),
            "verse_display": verse_display,
            "wisdom_context": wisdom_context,
            "verse_results_count": len(verse_results),
        }

    async def validate_reset_guidance(
        self,
        guidance: dict[str, str],
        verse_context: str
    ) -> dict[str, Any]:
        """
        Validate karma reset guidance using GitaValidator with Five Pillar compliance.

        Enhanced validation that checks both basic Gita adherence and
        Five Pillar deep compliance scoring.

        Args:
            guidance: Reset guidance dictionary
            verse_context: Gita context string

        Returns:
            Comprehensive validation results
        """
        # Combine all guidance text
        all_text_parts = []
        for key, value in guidance.items():
            if isinstance(value, str):
                all_text_parts.append(value)
        guidance_text = " ".join(all_text_parts)

        # Skip validation if text is too short
        if len(guidance_text.split()) < 20:
            return {
                "valid": True,
                "issues": [],
                "score": 0.5,
                "five_pillar_score": 0.0,
                "note": "Text too short for full validation"
            }

        try:
            # Basic Gita validation
            is_valid, validation_details = self._validator.validate_response(
                response=guidance_text,
                verse_context=[]
            )

            # Five Pillar deep compliance scoring
            five_pillar_result = self._validator.score_five_pillar_compliance(
                response=guidance_text,
                secular_mode=True
            )

            return {
                "valid": is_valid,
                "issues": validation_details.get("issues", []),
                "score": five_pillar_result.get("overall_score", 0.0),
                "five_pillar_score": five_pillar_result.get("overall_score", 0.0),
                "five_pillar_details": five_pillar_result.get("pillar_scores", {}),
                "compliance_level": five_pillar_result.get("compliance_level", ""),
                "pillars_met": five_pillar_result.get("pillars_met", 0),
                "missing_pillars": five_pillar_result.get("missing_pillars", []),
                "strong_pillars": five_pillar_result.get("strong_pillars", []),
                "gita_terms_found": validation_details.get("gita_terms_found", []),
                "wisdom_markers_found": validation_details.get("wisdom_markers_found", []),
            }

        except Exception as e:
            logger.error(f"Error validating reset guidance: {str(e)}")
            return {
                "valid": True,
                "issues": [f"Validation error: {str(e)}"],
                "score": 0.5,
                "five_pillar_score": 0.0,
            }

    def get_repair_theme_suggestions(self, repair_type: str) -> list[str]:
        """Get theme suggestions for a repair type (backward compatible)."""
        normalized_type = self._normalize_repair_type(repair_type)
        return self.REPAIR_TYPE_THEMES.get(normalized_type, ["compassion", "wisdom"])

    def get_repair_applications(self, repair_type: str) -> list[str]:
        """Get spiritual wellness application tags for a repair type."""
        normalized_type = self._normalize_repair_type(repair_type)
        return self.REPAIR_TYPE_APPLICATIONS.get(
            normalized_type,
            ["compassion", "emotional_balance"]
        )
