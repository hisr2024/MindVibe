"""
Karma Reset Service with KIAAN Integration.

This service provides read-only integration between the Karma Reset tool
and the KIAAN Wisdom Engine ecosystem. It maps repair actions to relevant
Bhagavad Gita verses and validates reset guidance against Gita wisdom.

Key Features:
- Read-only access to WisdomKnowledgeBase
- Theme mapping for different repair types
- Gita-based validation of reset guidance
- Zero impact on existing KIAAN services
"""

import logging
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession

from backend.services.wisdom_kb import WisdomKnowledgeBase
from backend.services.gita_validator import GitaValidator

logger = logging.getLogger(__name__)


class KarmaResetService:
    """
    Service for integrating Karma Reset with KIAAN Wisdom Engine.
    
    Provides read-only access to Gita verses and validation capabilities
    without modifying any existing KIAAN services or data.
    """
    
    # Input validation constants
    MIN_SITUATION_LENGTH = 10
    MAX_SITUATION_LENGTH = 200
    
    # Map repair types to Gita themes for verse retrieval
    REPAIR_TYPE_THEMES = {
        "apology": ["forgiveness", "humility", "compassion"],
        "clarification": ["truth", "communication", "clarity"],
        "calm_followup": ["equanimity", "peace", "emotional_balance"],
        "self-forgive": ["self_compassion", "acceptance", "peace"],
    }
    
    # Map repair types to mental health applications
    REPAIR_TYPE_APPLICATIONS = {
        "apology": ["forgiveness", "compassion", "humility"],
        "clarification": ["clear_communication", "truth", "understanding"],
        "calm_followup": ["emotional_balance", "peace", "equanimity"],
        "self-forgive": ["self_compassion", "acceptance", "inner_peace"],
    }
    
    def __init__(self):
        """Initialize the Karma Reset service."""
        self._wisdom_kb = WisdomKnowledgeBase()
        self._validator = GitaValidator()
    
    def _normalize_repair_type(self, repair_type: str) -> str:
        """
        Normalize repair type to standard format.
        
        Args:
            repair_type: Raw repair type from request (e.g., "Apology", "Calm follow-up")
            
        Returns:
            Normalized repair type (e.g., "apology", "calm_followup")
        """
        # Convert to lowercase and replace spaces/hyphens with underscores
        normalized = repair_type.lower().strip()
        normalized = normalized.replace(" ", "_").replace("-", "_")
        
        # Handle common variations
        if "follow" in normalized and "up" in normalized:
            return "calm_followup"
        elif "clarif" in normalized:
            return "clarification"
        elif "apolog" in normalized:
            return "apology"
        elif "forgive" in normalized and "self" in normalized:
            return "self-forgive"
        
        return normalized
    
    async def get_reset_verses(
        self,
        db: AsyncSession,
        repair_type: str,
        situation: str = "",
        limit: int = 5
    ) -> list[dict[str, Any]]:
        """
        Get relevant Gita verses for a karma reset scenario.
        
        Uses WisdomKnowledgeBase in read-only mode to search for verses
        that match the repair type and situation.
        
        Args:
            db: Database session (read-only)
            repair_type: Type of repair action (apology, clarification, calm_followup)
            situation: Optional situation description for better matching
            limit: Maximum number of verses to return (default 5)
            
        Returns:
            List of verse results with scores and sanitized text
        """
        normalized_type = self._normalize_repair_type(repair_type)
        
        # Build search query from situation and repair type
        query_parts = []
        
        # Add situation if provided
        if situation and len(situation) > self.MIN_SITUATION_LENGTH:
            query_parts.append(situation[:self.MAX_SITUATION_LENGTH])
        
        # Add repair-specific keywords
        if normalized_type == "apology":
            query_parts.append("forgiveness compassion humility sincere apology")
        elif normalized_type == "clarification":
            query_parts.append("truth clarity communication understanding")
        elif normalized_type == "calm_followup":
            query_parts.append("peace equanimity balance emotional calm")
        elif normalized_type == "self-forgive":
            query_parts.append("self-compassion acceptance inner peace")
        else:
            # Generic fallback
            query_parts.append("compassion wisdom peace")
        
        query = " ".join(query_parts)
        
        try:
            # Search using WisdomKB (read-only)
            verse_results = await self._wisdom_kb.search_relevant_verses_full_db(
                db=db,
                query=query,
                limit=limit
            )
            
            logger.info(
                f"Retrieved {len(verse_results)} verses for repair type '{normalized_type}'"
            )
            
            return verse_results
            
        except Exception as e:
            logger.error(f"Error retrieving verses for karma reset: {str(e)}")
            # Return empty list on error - allows fallback guidance
            return []
    
    def build_gita_context(
        self,
        verse_results: list[dict[str, Any]],
        repair_type: str
    ) -> str:
        """
        Build a wisdom context string from Gita verses.
        
        Formats verses into a context string that can be used to enhance
        karma reset guidance without exposing religious terminology.
        
        Args:
            verse_results: List of verse results from get_reset_verses()
            repair_type: Type of repair action
            
        Returns:
            Formatted context string for guidance generation
        """
        if not verse_results:
            return ""
        
        normalized_type = self._normalize_repair_type(repair_type)
        
        # Build context header
        context_parts = [
            f"Ancient wisdom for {normalized_type.replace('_', ' ')}:",
            ""
        ]
        
        # Add verse wisdom (using sanitized text)
        for i, result in enumerate(verse_results[:3], 1):  # Limit to top 3
            verse = result.get("verse", {})
            sanitized_text = result.get("sanitized_text", "")
            
            if sanitized_text:
                # Extract verse identifier
                verse_id = verse.get("verse_id", f"{i}")
                context_parts.append(f"Verse {verse_id}: {sanitized_text}")
        
        return "\n".join(context_parts)
    
    async def validate_reset_guidance(
        self,
        guidance: dict[str, str],
        verse_context: str
    ) -> dict[str, Any]:
        """
        Validate karma reset guidance using GitaValidator.
        
        Checks that the guidance is rooted in Gita wisdom principles
        without being overly religious or generic.
        
        Args:
            guidance: Reset guidance dictionary with keys like breathingLine, etc.
            verse_context: Gita context string from build_gita_context()
            
        Returns:
            Validation results dictionary with:
            - valid: bool
            - issues: list of validation issues
            - score: float (0.0 to 1.0)
        """
        # Combine all guidance parts into a single text for validation
        guidance_text = " ".join([
            guidance.get("breathingLine", ""),
            guidance.get("rippleSummary", ""),
            guidance.get("repairAction", ""),
            guidance.get("forwardIntention", "")
        ])
        
        # Skip validation if text is too short
        if len(guidance_text.split()) < 20:
            return {
                "valid": True,
                "issues": [],
                "score": 0.5,
                "note": "Text too short for validation"
            }
        
        try:
            # Use GitaValidator's validate_response method
            # Note: This is read-only validation, no data modification
            validation_result = self._validator.validate_response(
                response_text=guidance_text,
                verse_citations=[]  # Karma reset doesn't use explicit citations
            )
            
            return {
                "valid": validation_result.get("is_valid", False),
                "issues": validation_result.get("issues", []),
                "score": validation_result.get("gita_score", 0.0),
                "gita_terms_found": validation_result.get("gita_terms_found", [])
            }
            
        except Exception as e:
            logger.error(f"Error validating reset guidance: {str(e)}")
            # On error, assume valid to not block the user
            return {
                "valid": True,
                "issues": [f"Validation error: {str(e)}"],
                "score": 0.5
            }
    
    def get_repair_theme_suggestions(self, repair_type: str) -> list[str]:
        """
        Get theme suggestions for a repair type.
        
        Useful for understanding what themes are associated with each
        repair action type.
        
        Args:
            repair_type: Type of repair action
            
        Returns:
            List of theme names
        """
        normalized_type = self._normalize_repair_type(repair_type)
        return self.REPAIR_TYPE_THEMES.get(normalized_type, ["compassion", "wisdom"])
    
    def get_repair_applications(self, repair_type: str) -> list[str]:
        """
        Get mental health application tags for a repair type.
        
        Args:
            repair_type: Type of repair action
            
        Returns:
            List of application tag names
        """
        normalized_type = self._normalize_repair_type(repair_type)
        return self.REPAIR_TYPE_APPLICATIONS.get(
            normalized_type,
            ["compassion", "emotional_balance"]
        )
