"""
KIAAN Core Service - Central Wisdom Engine

This is the core wisdom engine for the entire KIAAN ecosystem.
All tools (Ardha, Viyoga, Emotional Reset, Karma Reset, Mood, Assessment, Chat)
MUST use this service to ensure:
1. Responses query Gita verses from database
2. Validation requirements are met (2+ Gita terms, wisdom markers, 200-500 words)
3. Authentic Gita-based wisdom
4. Ecosystem consistency
"""

import logging
import os
from typing import Any

from openai import OpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from backend.services.gita_service import GitaService
from backend.services.wisdom_kb import WisdomKnowledgeBase

logger = logging.getLogger(__name__)

# OpenAI client setup
api_key = os.getenv("OPENAI_API_KEY", "").strip()
openai_client = OpenAI(api_key=api_key, timeout=30.0) if api_key else None
ready = bool(api_key)


class KIAANCore:
    """Central KIAAN wisdom engine for the entire ecosystem."""

    def __init__(self):
        self.client = openai_client
        self.ready = ready
        self.gita_service = GitaService()
        self.wisdom_kb = WisdomKnowledgeBase()

    async def get_kiaan_response(
        self,
        message: str,
        user_id: str | None,
        db: AsyncSession,
        context: str = "general",
    ) -> dict[str, Any]:
        """
        Generate KIAAN response with Gita verses from database.
        
        This is the central wisdom engine used by ALL ecosystem tools.
        
        Args:
            message: User message or context
            user_id: User ID (optional)
            db: Database session
            context: Context type (general, ardha_reframe, viyoga_detachment, etc.)
            
        Returns:
            dict with response, verses_used, validation, and context
        """
        if not self.ready or not self.client:
            logger.error("KIAAN Core: OpenAI client not ready")
            return {
                "response": "I'm here for you. Let's try again. 💙",
                "verses_used": [],
                "validation": {"valid": False, "errors": ["OpenAI not configured"]},
                "context": context
            }

        # Step 1: Query relevant Gita verses from database
        verses = await self._get_relevant_verses(db, message, context)
        
        # CRITICAL: Must have at least 2 verses
        if not verses or len(verses) < 2:
            logger.warning(f"KIAAN Core: Only {len(verses) if verses else 0} verses found, getting fallback")
            verses = await self._get_fallback_verses(db)
        
        # Step 2: Build wisdom context from verses
        wisdom_context = self._build_verse_context(verses)
        
        # Step 3: Generate response with GPT-4, incorporating verses
        system_prompt = self._build_system_prompt(wisdom_context, message, context)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                temperature=0.7,
                max_tokens=600,
                timeout=30.0
            )
            
            response_text = response.choices[0].message.content
            if not response_text:
                response_text = "I'm here for you. Let's try again. 💙"
                
        except Exception as e:
            logger.error(f"KIAAN Core: OpenAI error: {e}")
            response_text = "I'm here for you. Let's try again. 💙"
        
        # Step 4: Validate response
        validation = self._validate_kiaan_response(response_text, verses)
        
        # Step 5: Retry with stricter prompt if validation fails
        if not validation["valid"] and validation["errors"]:
            logger.warning(f"KIAAN Core: Validation failed - {validation['errors']}, retrying...")
            response_text = await self._retry_with_validation(message, verses, validation["errors"], context)
            # Re-validate after retry
            validation = self._validate_kiaan_response(response_text, verses)
        
        return {
            "response": response_text,
            "verses_used": [v.get("verse_id", "") for v in verses[:3]],
            "validation": validation,
            "context": context
        }

    async def _get_relevant_verses(
        self,
        db: AsyncSession,
        query: str,
        context: str,
        limit: int = 5
    ) -> list[dict[str, Any]]:
        """Get relevant Gita verses based on query and context."""
        try:
            # Use wisdom KB to search verses
            verse_results = await self.wisdom_kb.search_relevant_verses(
                db=db,
                query=query,
                limit=limit
            )
            
            # Format results
            formatted_verses = []
            for result in verse_results:
                verse = result.get("verse")
                if verse:
                    chapter = getattr(verse, 'chapter', '')
                    verse_num = getattr(verse, 'verse', '')
                    formatted_verses.append({
                        "verse_id": f"{chapter}.{verse_num}" if chapter and verse_num else "",
                        "english": getattr(verse, 'english', ''),
                        "principle": getattr(verse, 'principle', ''),
                        "theme": getattr(verse, 'theme', ''),
                        "score": result.get("score", 0.0)
                    })
            
            return formatted_verses
            
        except Exception as e:
            logger.error(f"KIAAN Core: Error getting verses: {e}")
            return []

    async def _get_fallback_verses(self, db: AsyncSession, limit: int = 3) -> list[dict[str, Any]]:
        """Get fallback verses when search fails."""
        try:
            # Get key verses: 2.47 (karma yoga), 2.48 (equanimity), 6.5 (self-elevation)
            fallback_refs = [(2, 47), (2, 48), (6, 5)]
            fallback_verses = []
            
            for chapter, verse_num in fallback_refs:
                verse = await GitaService.get_verse_by_reference(db, chapter, verse_num)
                if verse:
                    fallback_verses.append({
                        "verse_id": f"{verse.chapter}.{verse.verse}",
                        "english": verse.english,
                        "principle": verse.principle,
                        "theme": verse.theme,
                        "score": 0.8
                    })
            
            return fallback_verses[:limit]
            
        except Exception as e:
            logger.error(f"KIAAN Core: Error getting fallback verses: {e}")
            return []

    def _build_verse_context(self, verses: list[dict[str, Any]]) -> str:
        """Build wisdom context from verses."""
        if not verses:
            return """FALLBACK WISDOM:
Apply universal Gita principles:
- Dharma (righteous duty) - Do what's right
- Karma Yoga (action without attachment) - Focus on effort, not results
- Equanimity (samatva) - Stay balanced in success and failure
- Self-mastery - Control the mind, not external events
- Inner peace - Find calm within
"""
        
        context_parts = ["RELEVANT GITA WISDOM (use internally, NEVER cite in response):", ""]
        
        for i, verse in enumerate(verses[:5], 1):
            context_parts.append(f"WISDOM #{i} (relevance: {verse.get('score', 0):.2f}):")
            
            if verse.get('english'):
                # Truncate at word boundary to avoid cutting mid-word
                english_text = verse['english']
                if len(english_text) > 300:
                    truncated = english_text[:297].rsplit(' ', 1)[0] + '...'
                    context_parts.append(f"Teaching: {truncated}")
                else:
                    context_parts.append(f"Teaching: {english_text}")
            
            if verse.get('principle'):
                context_parts.append(f"Principle: {verse['principle']}")
            
            if verse.get('theme'):
                formatted_theme = verse['theme'].replace('_', ' ').title()
                context_parts.append(f"Theme: {formatted_theme}")
            
            context_parts.append("")
        
        context_parts.extend([
            "---",
            "SYNTHESIS GUIDELINES:",
            "1. Identify the core principle across these verses",
            "2. Find practical application to user's situation",
            "3. Present wisdom naturally without citing sources",
            "4. Use Sanskrit terms (dharma, karma, atman, yoga) to add depth",
            "5. Make ancient wisdom feel immediately relevant",
            "",
            "FORBIDDEN IN RESPONSE:",
            "❌ Never say 'Bhagavad Gita', 'Gita', 'verse', 'chapter', or cite numbers",
            "❌ Never say 'Krishna', 'Arjuna', or reference the dialogue",
            "✅ Instead, say 'ancient wisdom teaches', 'timeless principle', 'eternal truth'",
        ])
        
        return "\n".join(context_parts)

    def _build_system_prompt(self, wisdom_context: str, message: str, context: str) -> str:
        """Build system prompt based on context type."""
        
        base_prompt = f"""You are KIAAN, an AI guide EXCLUSIVELY rooted in the timeless wisdom of the Bhagavad Gita's 700 verses.

GITA WISDOM FOR THIS SITUATION (use internally, NEVER cite):
{wisdom_context}

MANDATORY STRUCTURE - Every response MUST follow this flow:
1. ANCIENT WISDOM: Open with the eternal principle from Gita (without citing)
2. MODERN APPLICATION: Bridge to their current situation naturally
3. PRACTICAL STEPS: Give 2-3 specific, actionable steps they can take TODAY
4. DEEPER UNDERSTANDING: Close with profound insight connecting to their higher self

ABSOLUTE REQUIREMENTS (non-negotiable):
✅ Root EVERY word in Gita wisdom - no generic psychology or modern self-help
✅ Use Sanskrit terms naturally (dharma, karma, yoga, moksha, atman, buddhi, equanimity, detachment, etc.)
✅ Include at least 2 Gita terms in your response
✅ Include wisdom markers like "ancient wisdom teaches", "the timeless truth", "eternal principle"
✅ FORBIDDEN: Never mention "Bhagavad Gita", "Gita", "Krishna", "Arjuna", "verse", "chapter", numbers, or cite scripture
✅ FORBIDDEN: Never say "studies show", "research indicates", "experts say", "therapy suggests"
✅ Present wisdom as universal life principles, not religious teaching
✅ Be warm, conversational, deeply compassionate - like a wise friend
✅ Focus on mental wellness and practical daily life guidance
✅ 200-400 words, ALWAYS end with 💙

TONE & STYLE:
- Contemporary and accessible, never preachy or formal
- Speak to their specific struggle with empathy
- Make ancient wisdom feel immediately relevant
- Balance spiritual depth with practical action
- Encourage without toxic positivity

Remember: You are KIAAN - every response must be 100% Gita-rooted wisdom presented naturally and practically."""

        # Add context-specific instructions
        if context == "ardha_reframe":
            base_prompt += """

CONTEXT: This is for thought reframing (Ardha). Help them shift from negative thought patterns to balanced perspective using Gita wisdom about equanimity (samatva) and steady wisdom (sthitaprajna)."""
        
        elif context == "viyoga_detachment":
            base_prompt += """

CONTEXT: This is for outcome detachment (Viyoga). Guide them to release attachment to results using karma yoga principles - focus on action, not fruits."""
        
        elif context == "emotional_reset":
            base_prompt += """

CONTEXT: This is for emotional reset. Guide them through releasing difficult emotions using Gita wisdom about emotional regulation and inner peace."""
        
        elif context == "karma_reset":
            base_prompt += """

CONTEXT: This is for relational healing (Karma Reset). Guide them to repair relationships and restore balance using Gita principles of compassion (daya) and right action (dharma)."""
        
        elif context == "mood_assessment":
            base_prompt += """

CONTEXT: This is mood tracking feedback. Offer wisdom-based encouragement and guidance based on their emotional state."""
        
        elif context == "weekly_assessment":
            base_prompt += """

CONTEXT: This is weekly reflection feedback. Offer deeper wisdom about their growth journey using Gita principles of self-development (sadhana)."""
        
        return base_prompt

    def _validate_kiaan_response(self, response: str, verses: list[dict[str, Any]]) -> dict[str, Any]:
        """Validate KIAAN response meets requirements."""
        errors = []
        
        # Word count check (200-500 words)
        word_count = len(response.split())
        if not (200 <= word_count <= 500):
            errors.append(f"Word count {word_count} not in range 200-500")
        
        # Gita terms check (at least 2)
        gita_terms = [
            "dharma", "karma", "yoga", "moksha", "atman", "prakriti", "purusha",
            "sattva", "rajas", "tamas", "buddhi", "equanimity", "detachment",
            "samatva", "sthitaprajna", "vairagya", "abhyasa", "nishkama"
        ]
        terms_found = [term for term in gita_terms if term.lower() in response.lower()]
        if len(terms_found) < 2:
            errors.append(f"Only {len(terms_found)} Gita terms found, need at least 2")
        
        # Wisdom markers check
        wisdom_markers = [
            "ancient wisdom", "timeless", "eternal truth", "eternal principle",
            "teaches us", "reminds us", "universal principle"
        ]
        markers_found = any(marker.lower() in response.lower() for marker in wisdom_markers)
        if not markers_found:
            errors.append("No wisdom markers found in response")
        
        # Check for forbidden citations
        forbidden = ["bhagavad gita", "gita says", "krishna", "arjuna", "verse", "chapter"]
        citations_found = [f for f in forbidden if f in response.lower()]
        if citations_found:
            errors.append(f"Forbidden citations found: {citations_found}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "word_count": word_count,
            "gita_terms": terms_found,
            "markers_found": markers_found
        }

    async def _retry_with_validation(
        self,
        message: str,
        verses: list[dict[str, Any]],
        errors: list[str],
        context: str
    ) -> str:
        """Retry with stricter prompt when validation fails."""
        if not self.ready or not self.client:
            logger.error("KIAAN Core: OpenAI client not ready for retry")
            return self._get_emergency_fallback(context)
        
        wisdom_context = self._build_verse_context(verses)
        
        # Build stricter prompt that addresses the errors
        strict_prompt = f"""You are KIAAN. Your previous response failed validation. Fix these issues:
{chr(10).join(f'- {error}' for error in errors)}

CRITICAL REQUIREMENTS:
1. Response MUST be 200-400 words (count carefully!)
2. Include AT LEAST 2 Sanskrit/Gita terms: dharma, karma, yoga, atman, moksha, buddhi, equanimity, detachment, etc.
3. Include wisdom markers: "ancient wisdom teaches", "timeless truth", "eternal principle"
4. NEVER mention: Bhagavad Gita, Gita, Krishna, Arjuna, verse, chapter, or any citations
5. End with 💙

{wisdom_context}

User message: {message}

Provide a complete, validated response that meets ALL requirements above."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": strict_prompt},
                    {"role": "user", "content": "Generate the validated response now."}
                ],
                temperature=0.7,
                max_tokens=600,
                timeout=30.0
            )
            
            response_text = response.choices[0].message.content
            if not response_text:
                response_text = self._get_emergency_fallback(context)
            
            return response_text
            
        except Exception as e:
            logger.error(f"KIAAN Core: Retry failed: {e}")
            return self._get_emergency_fallback(context)

    def _get_emergency_fallback(self, context: str) -> str:
        """Emergency fallback response when all else fails."""
        return """The ancient wisdom teaches us that life's challenges are opportunities for growth. When we face difficulties, we're invited to develop inner strength through the practice of equanimity - maintaining balance regardless of external circumstances.

Your journey right now calls for patience and self-compassion. The timeless principle of karma yoga reminds us to focus on our actions, not the results. You can take these steps today: First, acknowledge your feelings without judgment. Second, identify one small action within your control. Third, practice steady presence in that action.

This path of self-mastery isn't about perfection - it's about consistent effort. The eternal truth reveals that your essence (atman) remains peaceful and complete, even when circumstances feel turbulent. Each moment is fresh, each breath a new beginning.

Trust in your inner wisdom (buddhi) to guide you forward. You have the strength to navigate this with grace and dharma. 💙"""


# Global instance
kiaan_core = KIAANCore()
