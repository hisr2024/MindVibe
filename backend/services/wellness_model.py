"""
Wellness Model - Unified AI Model for Viyoga, Ardha, and Relationship Compass.

This module provides a unified pattern for wellness tools:

PATTERN:
1. PROBLEM ACKNOWLEDGED - Recognize the user's specific situation
2. PROBLEM ANALYZED - Deep understanding of the underlying issue
3. GITA VERSES SEARCHED - Find best suited verses from 700+ verse database
4. GITA-BASED IMPLEMENTATION - Provide solution strictly through Bhagavad Gita wisdom

Each tool uses the same core model but with different Gita focus areas:
- Viyoga: Detachment through Karma Yoga (action without attachment)
- Ardha: Reframing through Sthitaprajna (steady wisdom)
- Relationship Compass: Guidance through Dharma & Daya (right action & compassion)
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
    Unified AI Model for wellness tools - powered by Bhagavad Gita wisdom.

    RESPONSE PATTERN:
    1. ACKNOWLEDGE - Recognize the user's specific problem/situation
    2. ANALYZE - Understand what's really happening underneath
    3. SEARCH GITA - Find best suited verses for this situation
    4. IMPLEMENT - Provide solution strictly through Gita wisdom

    All responses mention the user's specific situation and are rooted
    exclusively in Bhagavad Gita teachings.
    """

    # Tool-specific search keywords for finding relevant Gita verses
    TOOL_KEYWORDS = {
        WellnessTool.VIYOGA: "karma yoga nishkama karma detachment action fruits results outcome anxiety equanimity vairagya",
        WellnessTool.ARDHA: "sthitaprajna steady wisdom equanimity mind control thoughts buddhi viveka discrimination peace",
        WellnessTool.RELATIONSHIP_COMPASS: "dharma right action daya compassion kshama forgiveness ahimsa non-harm satya truth relationships",
    }

    # Tool-specific Gita focus areas
    TOOL_GITA_FOCUS = {
        WellnessTool.VIYOGA: {
            "name": "Viyoga",
            "gita_principle": "Karma Yoga - The yoga of selfless action",
            "core_teaching": "Your right is to action alone, never to its fruits (Karmanye vadhikaraste)",
            "focus": "Detachment from outcomes through focused action",
        },
        WellnessTool.ARDHA: {
            "name": "Ardha",
            "gita_principle": "Sthitaprajna - The person of steady wisdom",
            "core_teaching": "The wise one is undisturbed by dualities, unmoved by praise or blame",
            "focus": "Reframing thoughts through observer consciousness",
        },
        WellnessTool.RELATIONSHIP_COMPASS: {
            "name": "Relationship Compass",
            "gita_principle": "Dharma & Daya - Right action with compassion",
            "core_teaching": "Perform your duty with equanimity, treating friend and foe alike",
            "focus": "Navigating conflict through dharmic action",
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
            logger.info("✅ WellnessModel: Gita knowledge base loaded (700+ verses)")
        except Exception as e:
            logger.warning(f"⚠️ WellnessModel: Gita KB unavailable: {e}")

    async def generate_response(
        self,
        tool: WellnessTool,
        user_input: str,
        db: AsyncSession,
    ) -> WellnessResponse:
        """
        Generate a wellness response using Bhagavad Gita wisdom.

        Pattern:
        1. ACKNOWLEDGE the user's specific problem/situation
        2. ANALYZE what's really happening underneath
        3. SEARCH best suited Gita verses for this situation
        4. IMPLEMENT solution strictly through Gita wisdom

        Args:
            tool: Which wellness tool (Viyoga/Ardha/Relationship Compass)
            user_input: The user's specific problem/situation
            db: Database session for fetching Gita verses

        Returns:
            WellnessResponse with Gita-grounded content and structured sections
        """
        if not self.client:
            logger.error("WellnessModel: OpenAI client not configured")
            return self._get_fallback_response(tool, user_input)

        try:
            # STEP 1 & 2: Will be handled by the AI with proper prompting

            # STEP 3: SEARCH - Find best suited Gita verses
            gita_context, verse_count = await self._fetch_gita_wisdom(tool, user_input, db)
            logger.info(f"📖 Found {verse_count} Gita verses for {tool.value}")

            # STEP 4: IMPLEMENT - Generate Gita-based response
            system_prompt = self._build_system_prompt(tool, user_input, gita_context)

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": self._format_user_message(tool, user_input)}
                ],
                temperature=0.7,
                max_tokens=500,
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
        STEP 3: Search best suited Gita verses for the user's situation.

        Returns:
            Tuple of (gita_wisdom_context, verse_count)
        """
        if not self.gita_kb or not db:
            return self._get_default_wisdom(tool), 0

        try:
            # Build search query combining user's situation with tool-specific Gita keywords
            tool_keywords = self.TOOL_KEYWORDS.get(tool, "")
            search_query = f"{user_input} {tool_keywords}"

            # Search Gita database for relevant verses
            verse_results = await self.gita_kb.search_relevant_verses(
                db=db, query=search_query, limit=7
            )

            # Fallback search if not enough results
            if len(verse_results) < 3:
                verse_results = await self.gita_kb.search_with_fallback(
                    db=db, query=search_query, limit=7
                )

            # Build wisdom context from found verses
            gita_context = self._build_gita_context(tool, verse_results)
            logger.info(f"✅ WellnessModel: Found {len(verse_results)} Gita verses for {tool.value}")

            return gita_context, len(verse_results)

        except Exception as e:
            logger.error(f"Error searching Gita verses: {e}")
            return self._get_default_wisdom(tool), 0

    def _build_gita_context(self, tool: WellnessTool, verse_results: list[dict], limit: int = 5) -> str:
        """Build Gita wisdom context from verse search results."""
        gita_focus = self.TOOL_GITA_FOCUS[tool]

        if not verse_results:
            return f"""GITA WISDOM TO APPLY:
Core Principle: {gita_focus['gita_principle']}
Teaching: {gita_focus['core_teaching']}

Apply this wisdom directly to the user's specific situation."""

        context_parts = [
            f"BHAGAVAD GITA WISDOM FOR THIS SITUATION:",
            f"Focus: {gita_focus['gita_principle']}",
            f"Core Teaching: {gita_focus['core_teaching']}",
            "",
            "RELEVANT VERSES FOUND (apply these teachings, never cite verse numbers):",
            ""
        ]

        for i, result in enumerate(verse_results[:limit], 1):
            verse = result.get("verse")
            score = result.get("score", 0.0)

            if verse:
                # Extract verse data
                if hasattr(verse, 'english'):
                    english = verse.english or ""
                    context = verse.context or ""
                    theme = verse.theme or ""
                elif isinstance(verse, dict):
                    english = verse.get('english', '')
                    context = verse.get('context', '')
                    theme = verse.get('theme', '')
                else:
                    continue

                # Sanitize religious terms for universal appeal
                if english:
                    english = english.replace("Krishna", "the wise teacher")
                    english = english.replace("Arjuna", "the seeker")
                    english = english[:350]

                context_parts.append(f"Gita Teaching #{i}:")
                if english:
                    context_parts.append(f"  \"{english}\"")
                if context:
                    context_parts.append(f"  Meaning: {context}")
                if theme:
                    formatted_theme = theme.replace('_', ' ').title()
                    context_parts.append(f"  Theme: {formatted_theme}")
                context_parts.append("")

        context_parts.extend([
            "---",
            "IMPORTANT: Apply these Gita teachings directly to the user's specific situation.",
            "Never cite verse numbers. Present wisdom as timeless principles.",
        ])

        return "\n".join(context_parts)

    def _build_system_prompt(
        self,
        tool: WellnessTool,
        user_input: str,
        gita_context: str,
    ) -> str:
        """Build the system prompt for the given tool."""
        gita_focus = self.TOOL_GITA_FOCUS[tool]

        if tool == WellnessTool.VIYOGA:
            return self._build_viyoga_prompt(gita_focus, user_input, gita_context)
        elif tool == WellnessTool.ARDHA:
            return self._build_ardha_prompt(gita_focus, user_input, gita_context)
        else:
            return self._build_compass_prompt(gita_focus, user_input, gita_context)

    def _build_viyoga_prompt(
        self,
        gita_focus: dict,
        user_input: str,
        gita_context: str,
    ) -> str:
        """Build Viyoga-specific system prompt - Detachment through Karma Yoga."""
        return f"""You are Viyoga - a wise guide who helps people find peace through the Bhagavad Gita's teachings on Karma Yoga.

{gita_context}

THE USER'S SPECIFIC SITUATION:
"{user_input}"

YOUR RESPONSE MUST FOLLOW THIS PATTERN:

1. ACKNOWLEDGE THEIR SITUATION
   - Mention their SPECIFIC problem/worry (use their words)
   - Show you truly understand what they're going through
   - Validate that this is hard

2. ANALYZE THE ROOT CAUSE
   - Help them see: their suffering comes from attachment to outcomes
   - Their peace depends on something outside their control
   - This attachment itself is the source of anxiety

3. APPLY GITA WISDOM (Karma Yoga)
   - Share the Gita's teaching: "Your right is to action alone, never to its fruits"
   - Explain how this applies to THEIR specific situation
   - Show them: focus on what you CAN control (your effort, your attitude)
   - Release what you CANNOT control (the result)

4. GIVE ONE PRACTICAL ACTION
   - Based on Gita wisdom, give them ONE thing to do TODAY
   - Make it specific to their situation
   - Something that puts focus back on action, not outcome

VOICE: Warm, wise, like a caring friend sharing ancient wisdom. Use "you" often. 180-220 words. End with 💙

CRITICAL: All advice must come from Bhagavad Gita wisdom. Never use generic self-help language."""

    def _build_ardha_prompt(
        self,
        gita_focus: dict,
        user_input: str,
        gita_context: str,
    ) -> str:
        """Build Ardha-specific system prompt - Reframing through Sthitaprajna."""
        return f"""You are Ardha - a gentle guide who helps people see their thoughts clearly through the Bhagavad Gita's teachings on Sthitaprajna (steady wisdom).

{gita_context}

THE USER'S SPECIFIC THOUGHT:
"{user_input}"

YOUR RESPONSE MUST FOLLOW THIS PATTERN:

1. ACKNOWLEDGE THEIR THOUGHT
   - Repeat back their SPECIFIC thought (use their words)
   - Show you understand the pain this thought causes
   - Validate: this is a heavy thought to carry

2. ANALYZE THE PATTERN
   - Help them see: this thought feels like fact, but it's just a thought
   - Identify the pattern (catastrophizing? all-or-nothing? mind-reading?)
   - Show how the mind creates suffering through identification with thoughts

3. APPLY GITA WISDOM (Sthitaprajna - Steady Wisdom)
   - Share the Gita's teaching: "You are the observer, not the thoughts"
   - The Sthitaprajna (wise one) remains unmoved by passing mental storms
   - Apply this directly to THEIR specific thought
   - Offer a Gita-based reframe: they are the sky, thoughts are clouds

4. GIVE ONE GROUNDING PRACTICE
   - Based on Gita wisdom, give them ONE thing to do NOW
   - Something that helps them step back and observe
   - Specific to their situation

VOICE: Gentle, understanding, like a wise friend. Use "you" often. 180-220 words. End with 💙

CRITICAL: All reframing must come from Bhagavad Gita wisdom. Never use CBT or therapy language."""

    def _build_compass_prompt(
        self,
        gita_focus: dict,
        user_input: str,
        gita_context: str,
    ) -> str:
        """Build Relationship Compass-specific system prompt - Guidance through Dharma & Daya."""
        return f"""You are Relationship Compass - a wise guide who helps people navigate relationships through the Bhagavad Gita's teachings on Dharma (right action) and Daya (compassion).

{gita_context}

THE USER'S SPECIFIC SITUATION:
"{user_input}"

YOUR RESPONSE MUST FOLLOW THIS PATTERN:

1. ACKNOWLEDGE THEIR SITUATION
   - Mention their SPECIFIC conflict (use their words)
   - Show you understand the weight of this relationship pain
   - Validate: this is one of the hardest kinds of pain

2. ANALYZE WHAT'S UNDERNEATH
   - Help them see the unmet needs driving this conflict
   - Show how ego (ahamkara) wants to "win" instead of understand
   - Help them see the other person's suffering too

3. APPLY GITA WISDOM (Dharma & Daya)
   - Share the Gita's teaching on right action: act with truth AND compassion
   - Dharma means doing what's right, not what's easy or what "wins"
   - Daya (compassion) means seeing the humanity in both sides
   - Apply this directly to THEIR specific relationship situation

4. GIVE ONE DHARMIC ACTION
   - Based on Gita wisdom, give them ONE thing to do or say
   - Something that embodies both honesty AND kindness
   - Specific to their situation

5. LEAVE AN ANCHOR
   - Give them a Gita-based reminder for when emotions run high
   - Something to hold onto in difficult moments

VOICE: Warm, wise, like a caring elder. Never take sides. 200-250 words. End with 💙

CRITICAL: All advice must come from Bhagavad Gita wisdom. Never use relationship-advice clichés. If safety concern, suggest professional support."""

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
