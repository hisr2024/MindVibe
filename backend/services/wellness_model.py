"""
Wellness Model - Unified AI Model for Viyoga, Ardha, and Relationship Compass.

This module provides a unified pattern for wellness tools:
Question → Understanding → Bhagavad Gita-grounded Answer

Each tool uses the same core model but with different focus areas:
- Viyoga: Outcome anxiety & detachment (karma yoga)
- Ardha: Thought reframing (sthitaprajna - steady wisdom)
- Relationship Compass: Conflict navigation (dharma & compassion)
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from enum import Enum
from typing import Any

from openai import OpenAI
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class WellnessTool(Enum):
    """The three wellness tools."""
    VIYOGA = "viyoga"
    ARDHA = "ardha"
    RELATIONSHIP_COMPASS = "relationship_compass"


@dataclass
class WellnessResponse:
    """Structured response from the wellness model."""
    content: str
    sections: dict[str, str]
    gita_verses_used: int
    tool: WellnessTool
    model: str = "gpt-4o-mini"
    provider: str = "kiaan"


class WellnessModel:
    """
    Unified AI Model for wellness tools.

    Provides a consistent pattern:
    1. RECEIVE: User shares their question/concern
    2. UNDERSTAND: Fetch relevant Gita wisdom for context
    3. RESPOND: Generate warm, friendly, Gita-grounded answer

    All responses feel like talking to a wise, caring friend.
    """

    # Tool-specific search keywords for finding relevant Gita verses
    TOOL_KEYWORDS = {
        WellnessTool.VIYOGA: "karma yoga detachment action results outcome anxiety equanimity",
        WellnessTool.ARDHA: "equanimity mind stability wisdom balance thoughts peace sthitaprajna",
        WellnessTool.RELATIONSHIP_COMPASS: "dharma compassion forgiveness relationships conflict ego peace",
    }

    # Tool-specific personalities
    TOOL_PERSONALITIES = {
        WellnessTool.VIYOGA: {
            "name": "Viyoga",
            "role": "a calm, wise friend who helps people find peace when they're anxious about outcomes",
            "focus": "outcome anxiety and finding peace through focused action",
        },
        WellnessTool.ARDHA: {
            "name": "Ardha",
            "role": "a gentle, understanding friend who helps people see their thoughts more clearly",
            "focus": "reframing difficult thoughts and finding mental clarity",
        },
        WellnessTool.RELATIONSHIP_COMPASS: {
            "name": "Relationship Compass",
            "role": "a wise, caring friend who helps people navigate relationship challenges with clarity and compassion",
            "focus": "relationship conflicts and finding understanding over victory",
        },
    }

    def __init__(self):
        """Initialize the wellness model."""
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.client = OpenAI(api_key=api_key) if api_key else None
        self.gita_kb = None

        try:
            from backend.services.wisdom_kb import WisdomKnowledgeBase
            self.gita_kb = WisdomKnowledgeBase()
            logger.info("✅ WellnessModel: Gita knowledge base loaded")
        except Exception as e:
            logger.warning(f"⚠️ WellnessModel: Gita KB unavailable: {e}")

    async def generate_response(
        self,
        tool: WellnessTool,
        user_input: str,
        db: AsyncSession,
    ) -> WellnessResponse:
        """
        Generate a wellness response using the unified model.

        Pattern: Question → Understanding → Gita-grounded Answer

        Args:
            tool: Which wellness tool is being used
            user_input: The user's question/concern
            db: Database session for fetching Gita verses

        Returns:
            WellnessResponse with content and structured sections
        """
        if not self.client:
            logger.error("WellnessModel: OpenAI client not configured")
            return self._get_fallback_response(tool, user_input)

        try:
            # STEP 1: UNDERSTAND - Fetch relevant Gita wisdom
            gita_context, verse_count = await self._fetch_gita_wisdom(tool, user_input, db)

            # STEP 2: BUILD - Create the prompt with personality and wisdom
            system_prompt = self._build_system_prompt(tool, user_input, gita_context)

            # STEP 3: RESPOND - Generate warm, friendly response
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": self._format_user_message(tool, user_input)}
                ],
                temperature=0.7,
                max_tokens=400,
                timeout=30.0,
            )

            content = None
            if response and response.choices and len(response.choices) > 0:
                response_msg = response.choices[0].message
                if response_msg:
                    content = response_msg.content

            if not content:
                return self._get_fallback_response(tool, user_input)

            # Parse response into sections
            sections = self._parse_response(tool, content)

            return WellnessResponse(
                content=content,
                sections=sections,
                gita_verses_used=verse_count,
                tool=tool,
            )

        except Exception as e:
            logger.exception(f"WellnessModel error for {tool.value}: {e}")
            return self._get_fallback_response(tool, user_input)

    async def _fetch_gita_wisdom(
        self,
        tool: WellnessTool,
        user_input: str,
        db: AsyncSession,
    ) -> tuple[str, int]:
        """
        Fetch relevant Gita verses for the given tool and input.

        Returns:
            Tuple of (gita_context_string, verse_count)
        """
        if not self.gita_kb or not db:
            return self._get_default_wisdom(tool), 0

        try:
            # Build search query with tool-specific keywords
            tool_keywords = self.TOOL_KEYWORDS.get(tool, "")
            search_query = f"{user_input} {tool_keywords}"

            # Search for relevant verses
            verse_results = await self.gita_kb.search_relevant_verses(
                db=db, query=search_query, limit=7
            )

            # Fallback if not enough results
            if len(verse_results) < 3:
                verse_results = await self.gita_kb.search_with_fallback(
                    db=db, query=search_query, limit=7
                )

            # Build context from verses
            gita_context = self._build_gita_context(verse_results)
            logger.info(f"✅ WellnessModel: Found {len(verse_results)} verses for {tool.value}")

            return gita_context, len(verse_results)

        except Exception as e:
            logger.error(f"Error fetching Gita verses: {e}")
            return self._get_default_wisdom(tool), 0

    def _build_gita_context(self, verse_results: list[dict], limit: int = 5) -> str:
        """Build a wisdom context string from verse results."""
        if not verse_results:
            return "Draw from timeless wisdom about inner peace, right action, and self-understanding."

        context_parts = ["WISDOM TO DRAW FROM (use naturally, never cite sources):", ""]

        for i, result in enumerate(verse_results[:limit], 1):
            verse = result.get("verse")
            score = result.get("score", 0.0)

            if verse:
                # Extract verse data
                english = getattr(verse, 'english', '') or verse.get('english', '') if isinstance(verse, dict) else getattr(verse, 'english', '')
                context = getattr(verse, 'context', '') or verse.get('context', '') if isinstance(verse, dict) else getattr(verse, 'context', '')
                theme = getattr(verse, 'theme', '') or verse.get('theme', '') if isinstance(verse, dict) else getattr(verse, 'theme', '')

                # Sanitize religious terms
                if english:
                    english = english.replace("Krishna", "the teacher").replace("Arjuna", "the seeker")
                    english = english[:300]  # Limit length

                context_parts.append(f"Wisdom #{i}:")
                if english:
                    context_parts.append(f"  Teaching: {english}")
                if context:
                    context_parts.append(f"  Principle: {context}")
                if theme:
                    formatted_theme = theme.replace('_', ' ').title()
                    context_parts.append(f"  Theme: {formatted_theme}")
                context_parts.append("")

        return "\n".join(context_parts)

    def _build_system_prompt(
        self,
        tool: WellnessTool,
        user_input: str,
        gita_context: str,
    ) -> str:
        """Build the system prompt for the given tool."""
        personality = self.TOOL_PERSONALITIES[tool]

        if tool == WellnessTool.VIYOGA:
            return self._build_viyoga_prompt(personality, user_input, gita_context)
        elif tool == WellnessTool.ARDHA:
            return self._build_ardha_prompt(personality, user_input, gita_context)
        else:
            return self._build_compass_prompt(personality, user_input, gita_context)

    def _build_viyoga_prompt(
        self,
        personality: dict,
        user_input: str,
        gita_context: str,
    ) -> str:
        """Build Viyoga-specific system prompt."""
        return f"""You are {personality['name']} - {personality['role']}.

{gita_context}

THE PERSON'S WORRY:
"{user_input}"

HOW TO RESPOND - Like a caring friend would:

1. First, really hear them. Acknowledge what they're worried about specifically. Let them feel seen and understood. Their anxiety is valid.

2. Gently help them notice: their peace has become tied to something outside their control. This attachment itself is adding to their suffering.

3. Share this freeing truth: We can only control our actions, never the results. When we focus fully on what we CAN do - and release our grip on outcomes - we find both peace and better results.

4. Give them ONE specific, doable thing they can do today. Something small and practical that puts them back in the driver's seat.

YOUR VOICE:
- Warm and understanding, never preachy
- Talk TO them, not AT them - use "you" naturally
- Keep it simple and clear - no jargon
- Around 150-180 words
- End with 💙

You're not a therapist giving clinical advice. You're a wise friend who's been through this too, offering gentle perspective. Help them breathe easier."""

    def _build_ardha_prompt(
        self,
        personality: dict,
        user_input: str,
        gita_context: str,
    ) -> str:
        """Build Ardha-specific system prompt."""
        return f"""You are {personality['name']} - {personality['role']}.

{gita_context}

THE THOUGHT THEY'RE STRUGGLING WITH:
"{user_input}"

HOW TO RESPOND - Like a caring friend would:

1. First, acknowledge what they're feeling. Really see them. This thought is causing them pain, and that matters. Don't rush past this.

2. Gently help them notice: thoughts feel like facts, but they're not. Our minds tell us stories, especially when we're hurting. Help them see the pattern - is their mind jumping to the worst case? Making everything black-or-white?

3. Offer a different way to see it. Not toxic positivity - just a gentler, more balanced perspective. Remind them: you are not your thoughts. You're the one who notices them. Like clouds passing through a big sky.

4. Give them ONE small thing they can do or hold onto right now. Something grounding and practical.

YOUR VOICE:
- Warm and gentle, like talking to a good friend
- Validate before you reframe - never dismiss their pain
- Keep it simple and human - no clinical language
- Around 150-180 words
- End with 💙

This person shared something vulnerable. Honor that trust. Help them feel a little lighter."""

    def _build_compass_prompt(
        self,
        personality: dict,
        user_input: str,
        gita_context: str,
    ) -> str:
        """Build Relationship Compass-specific system prompt."""
        return f"""You are {personality['name']} - {personality['role']}.

{gita_context}

THE SITUATION THEY'RE FACING:
"{user_input}"

HOW TO RESPOND - Like a wise friend would:

1. Really see their situation. Acknowledge the weight of what they're going through. Relationship pain is some of the hardest pain there is.

2. Gently help them see what might be underneath - what needs aren't being met? What fears or hurts might be driving the conflict? (For them AND the other person.) Sometimes our ego wants to win, when what we really need is to be understood.

3. Help them see what "doing the right thing" looks like here - being honest AND kind, setting boundaries without cruelty, choosing understanding over victory.

4. Give them ONE specific thing they can do or say. Something practical and actionable.

5. Leave them with something to hold onto when emotions get intense.

YOUR VOICE:
- Warm and understanding - like a friend who genuinely cares
- Never take sides or tell them to leave/stay
- If there's any safety concern, gently suggest professional support
- Keep it real and human - no relationship-advice clichés
- Around 180-200 words
- End with 💙

This person trusts you with their relationship pain. Help them find clarity, not victory."""

    def _format_user_message(self, tool: WellnessTool, user_input: str) -> str:
        """Format the user message for the given tool."""
        if tool == WellnessTool.VIYOGA:
            return f"I'm worried about: {user_input}"
        elif tool == WellnessTool.ARDHA:
            return f"I keep thinking: {user_input}"
        else:
            return f"I'm struggling with this relationship situation: {user_input}"

    def _parse_response(self, tool: WellnessTool, response_text: str) -> dict[str, str]:
        """Parse the response into structured sections."""
        lines = response_text.strip().split('\n')
        sections = []
        current = []

        for line in lines:
            if line.strip():
                current.append(line.strip())
            elif current:
                sections.append(' '.join(current))
                current = []
        if current:
            sections.append(' '.join(current))

        # Remove emoji from last section
        if sections:
            sections[-1] = sections[-1].replace('💙', '').strip()

        # Return tool-specific section structure
        if tool == WellnessTool.VIYOGA:
            return self._parse_viyoga_sections(sections)
        elif tool == WellnessTool.ARDHA:
            return self._parse_ardha_sections(sections)
        else:
            return self._parse_compass_sections(sections)

    def _parse_viyoga_sections(self, sections: list[str]) -> dict[str, str]:
        """Parse Viyoga response sections."""
        if len(sections) >= 4:
            return {
                "validation": sections[0],
                "attachment_check": sections[1],
                "detachment_principle": sections[2],
                "one_action": sections[3],
            }
        elif len(sections) >= 2:
            return {
                "validation": sections[0],
                "attachment_check": "",
                "detachment_principle": sections[1] if len(sections) > 1 else "",
                "one_action": sections[2] if len(sections) > 2 else "",
            }
        return {"validation": sections[0] if sections else "", "attachment_check": "", "detachment_principle": "", "one_action": ""}

    def _parse_ardha_sections(self, sections: list[str]) -> dict[str, str]:
        """Parse Ardha response sections."""
        if len(sections) >= 4:
            return {
                "recognition": sections[0],
                "deep_insight": sections[1],
                "reframe": sections[2],
                "small_action_step": sections[3],
            }
        elif len(sections) >= 2:
            return {
                "recognition": sections[0],
                "deep_insight": sections[1] if len(sections) > 1 else "",
                "reframe": sections[2] if len(sections) > 2 else "",
                "small_action_step": "",
            }
        return {"recognition": sections[0] if sections else "", "deep_insight": "", "reframe": "", "small_action_step": ""}

    def _parse_compass_sections(self, sections: list[str]) -> dict[str, str]:
        """Parse Relationship Compass response sections."""
        if len(sections) >= 5:
            return {
                "acknowledgment": sections[0],
                "underneath": sections[1],
                "clarity": sections[2],
                "path_forward": sections[3],
                "reminder": sections[4],
            }
        elif len(sections) >= 3:
            return {
                "acknowledgment": sections[0],
                "underneath": sections[1] if len(sections) > 1 else "",
                "clarity": sections[2] if len(sections) > 2 else "",
                "path_forward": "",
                "reminder": "",
            }
        return {"acknowledgment": sections[0] if sections else "", "underneath": "", "clarity": "", "path_forward": "", "reminder": ""}

    def _get_default_wisdom(self, tool: WellnessTool) -> str:
        """Get default wisdom context when database is unavailable."""
        defaults = {
            WellnessTool.VIYOGA: "Draw from karma yoga: your right is to action alone, never to its fruits. Focus fully on what you can do, then release attachment to the outcome.",
            WellnessTool.ARDHA: "Draw from steady wisdom: the mind undisturbed by adversity, free from attachment and fear. You are the observer of thoughts, not the thoughts themselves.",
            WellnessTool.RELATIONSHIP_COMPASS: "Draw from dharma and compassion: act with truth and kindness, free from ego and the need to win. Seek understanding over victory.",
        }
        return defaults.get(tool, "Draw from timeless wisdom about inner peace and right action.")

    def _get_fallback_response(self, tool: WellnessTool, user_input: str) -> WellnessResponse:
        """Get a fallback response when the model is unavailable."""
        input_snippet = user_input[:50] + "..." if len(user_input) > 50 else user_input

        if tool == WellnessTool.VIYOGA:
            content = f"I really hear you - this worry is heavy, and it makes sense that you're feeling it.\n\nHere's what I notice: your peace right now depends on how this turns out. That's a tough place to be, because outcomes aren't fully in our hands.\n\nBut here's something that might help: what if you could give your best effort AND feel okay regardless of what happens? You can only control what you do - not the result. That's actually freeing when you let it sink in.\n\nToday, pick one small thing you can do about this situation. Do it with your full attention. Then take a breath and remind yourself: you did what you could. The rest isn't yours to carry. 💙"
            sections = {
                "validation": f"I really hear you - this worry about '{input_snippet}' is heavy. It's okay to feel this way.",
                "attachment_check": "Your peace right now depends on how this turns out. That's a tough place to be.",
                "detachment_principle": "What if you could give your best effort AND feel okay no matter what happens? You can only control what you do - not the result.",
                "one_action": "Today, pick one small thing you can do about this. Do it with your full attention. Then let go of the rest.",
            }
        elif tool == WellnessTool.ARDHA:
            content = f"I hear you. This thought you're carrying - it's heavy. And it makes sense that it's getting to you.\n\nHere's something that might help: thoughts feel like absolute truth, especially the painful ones. But thoughts aren't facts. They're just your mind trying to make sense of things, often in the hardest possible way.\n\nTry this perspective: you're not your thoughts. You're the one noticing them. Like clouds drifting across a big sky - the clouds come and go, but the sky is always there, always okay. That sky is you.\n\nRight now, take one slow breath. Then ask yourself: what would you say to a friend who told you they had this same thought? We often have gentler words for others than we give ourselves. 💙"
            sections = {
                "recognition": f"I hear you. This thought - '{input_snippet}' - it's heavy. And it's okay that you're struggling with it.",
                "deep_insight": "Thoughts feel like facts, especially the painful ones. But they're not. They're just your mind trying to make sense of things.",
                "reframe": "You're not your thoughts - you're the one noticing them. Like clouds passing through a big sky, this thought will pass.",
                "small_action_step": "Take one slow breath. Then ask yourself: what would you say to a friend with this same thought?",
            }
        else:
            content = f"I hear you. This situation is weighing on you, and relationship struggles hit deep.\n\nHere's what I've noticed about conflict: underneath the arguments and hurt feelings, there's usually an unmet need - to feel heard, respected, or truly understood. Take a moment: what do you really need here? Not what you want them to do or say, but what you actually need.\n\nDoing the right thing in relationships doesn't mean winning. It means being honest AND kind - even when that's really hard.\n\nWhen you're ready, try this: 'I feel [your emotion] when [the situation] because [what you need]. What I'm hoping for is [your request].' It opens doors instead of closing them.\n\nAnd when emotions run high, remember: the goal isn't to be right. It's to understand and be understood. That's where peace lives. 💙"
            sections = {
                "acknowledgment": f"I hear you - this situation with '{input_snippet}' is really weighing on you. Relationship struggles hit deep.",
                "underneath": "Underneath most conflicts, there's an unmet need - to feel heard, respected, or understood. What do you really need here?",
                "clarity": "Doing the right thing doesn't mean winning. It means being honest AND kind - even when that's hard.",
                "path_forward": "Try: 'I feel [emotion] when [situation] because [what I need]. What I'm hoping for is [request].'",
                "reminder": "The goal isn't to be right. It's to understand and be understood. That's where peace lives.",
            }

        return WellnessResponse(
            content=content,
            sections=sections,
            gita_verses_used=0,
            tool=tool,
            model="fallback",
        )


# Singleton instance
_wellness_model: WellnessModel | None = None


def get_wellness_model() -> WellnessModel:
    """Get the singleton WellnessModel instance."""
    global _wellness_model
    if _wellness_model is None:
        _wellness_model = WellnessModel()
    return _wellness_model
