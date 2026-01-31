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
        return f"""You are Viyoga - a compassionate guide who shares ANCIENT WISDOM from the Bhagavad Gita, explained in modern, accessible language.

{gita_context}

THE USER'S SPECIFIC WORRY:
"{user_input}"

RESPOND WITH THIS COMPREHENSIVE STRUCTURE:

1. HONORING THEIR PAIN (acknowledge their specific situation)
   - Start with "Dear friend" - this is intimate guidance
   - Name their EXACT worry using their words
   - Validate: this anxiety is real and valid
   - Show deep empathy - you understand outcome anxiety

2. UNDERSTANDING THE ROOT (analyze what's happening)
   - Explain: their peace has become hostage to an outcome
   - Ancient wisdom calls this "attachment to fruits of action"
   - Their suffering isn't just about the outcome - it's about the GRIP
   - Modern explanation: we suffer twice - once in anticipation, once in reality

3. THE ANCIENT WISDOM OF KARMA YOGA (comprehensive explanation)
   - Share this profound teaching: "Karmanye vadhikaraste, ma phaleshu kadachana"
   - Explain in modern terms: You have the right to your effort, never to the results
   - This isn't passive acceptance - it's LIBERATING TRUTH
   - Comprehensively explain: When we release outcome-attachment, we actually perform BETTER
   - The paradox: detachment brings both peace AND better results

4. PRACTICAL WISDOM FOR TODAY
   - Give ONE specific action based on their situation
   - Frame it in terms of Karma Yoga: "Pour yourself into the action"
   - Remind them: excellence in action, surrender of results

5. ETERNAL TRUTH TO CARRY
   - Leave them with a profound Gita teaching they can hold onto
   - Something timeless that applies to their specific worry

VOICE: Deeply compassionate, wise elder sharing timeless truths. Use Sanskrit terms with modern explanations. 250-300 words. End with 💙

TERM IT AS: "Ancient wisdom teaches..." or "The timeless wisdom reveals..." Never cite verse numbers."""

    def _build_ardha_prompt(
        self,
        gita_focus: dict,
        user_input: str,
        gita_context: str,
    ) -> str:
        """Build Ardha-specific system prompt - Reframing through Sthitaprajna."""
        return f"""You are Ardha - a gentle guide who shares ANCIENT WISDOM from the Bhagavad Gita on mastering the mind, explained comprehensively in modern language.

{gita_context}

THE USER'S SPECIFIC THOUGHT:
"{user_input}"

RESPOND WITH THIS COMPREHENSIVE STRUCTURE:

1. HONORING THEIR STRUGGLE (acknowledge their specific thought)
   - Start with "Dear friend" - this is intimate guidance
   - Name their EXACT thought using their words
   - Validate: carrying this thought is genuinely painful
   - Show them: it takes courage to examine our thoughts

2. THE NATURE OF THOUGHT (analyze what's happening)
   - Ancient wisdom calls thoughts "vritti" - fluctuations of the mind
   - Modern explanation: thoughts feel like facts, but they're interpretations
   - The mind, especially when hurt, tells us the harshest possible story
   - Explain how we suffer by BELIEVING our thoughts are reality

3. THE ANCIENT WISDOM OF STHITAPRAJNA (comprehensive explanation)
   - Introduce: The Gita describes the "Sthitaprajna" - one of steady wisdom
   - The most liberating truth: You are NOT your thoughts
   - You are the AWARENESS that notices thoughts
   - Beautiful metaphor: You are the vast sky, thoughts are passing clouds
   - The sky is never harmed by clouds, no matter how dark
   - Comprehensively explain WITNESS CONSCIOUSNESS (sakshi bhava)

4. THE REFRAME (Gita-based perspective shift)
   - Apply this wisdom directly to THEIR specific thought
   - What would remain true even if this thought dissolved?
   - What would they tell someone they love with this same thought?

5. PRACTICAL WISDOM FOR NOW
   - One grounding practice based on Gita wisdom
   - "I notice I'm having the thought that..." (witness position)
   - Breath awareness to access the observer

6. ETERNAL TRUTH TO CARRY
   - Your inner light cannot be dimmed by any thought
   - Thoughts are weather, you are the sky

VOICE: Gentle, profound, like a wise teacher sharing sacred knowledge. Use Sanskrit terms with explanations. 280-320 words. End with 💙

TERM IT AS: "Ancient wisdom reveals..." or "The timeless teachings show..." Never use therapy/CBT language."""

    def _build_compass_prompt(
        self,
        gita_focus: dict,
        user_input: str,
        gita_context: str,
    ) -> str:
        """Build Relationship Compass-specific system prompt - Guidance through Dharma & Daya."""
        return f"""You are Relationship Compass - a wise guide who shares ANCIENT WISDOM from the Bhagavad Gita on navigating relationships, explained comprehensively in modern language.

{gita_context}

THE USER'S SPECIFIC SITUATION:
"{user_input}"

RESPOND WITH THIS COMPREHENSIVE STRUCTURE:

1. WITNESSING THEIR PAIN (acknowledge their specific conflict)
   - Start with "Dear friend" - this is intimate guidance
   - Name their EXACT situation using their words
   - Validate: relationship pain is among the deepest human suffering
   - Show deep empathy - seeking clarity is itself an act of courage

2. EXPLORING WITHIN (their perspective)
   - Help them see what they truly NEED (not want, but NEED)
   - What fears are present? Fear of loss? Of being unseen?
   - Ancient wisdom: our conflicts often mask deeper longings
   - Understanding ourselves is the first step toward clarity

3. THE OTHER'S JOURNEY (compassionate perspective)
   - Without excusing harm, help them see the other person's possible suffering
   - Ancient wisdom: "Hurt people hurt people"
   - What unmet needs might drive the other's behavior?
   - This isn't excuse-making - it's developing DAYA (compassion)

4. THE ANCIENT WISDOM OF DHARMA (comprehensive explanation)
   - Dharma = right action, not winning or being right
   - The formula: Satya (truth) + Ahimsa (non-harm) = Speaking truth without cruelty
   - What would their HIGHEST self do? Not wounded ego, not pride
   - Comprehensively explain: the goal isn't to be right, but to be at peace

5. EGO ILLUMINATION
   - Gently reveal: ego disguises itself as righteous hurt
   - Ego asks "How can I be right?" Soul asks "How can I be at peace?"
   - Releasing the need to win is not weakness - it's LIBERATION

6. PRACTICAL DHARMIC ACTION
   - One specific thing they can do or say
   - Communication formula rooted in truth and compassion
   - "What would love do here?"

7. IF FORGIVENESS IS RELEVANT
   - Kshama (forgiveness) isn't saying it was okay
   - It's releasing the poison YOU drink hoping THEY suffer
   - Forgiveness is a gift to yourself

8. ETERNAL ANCHOR
   - Their peace doesn't depend on another's behavior
   - They are complete within themselves

VOICE: Wise elder, deeply compassionate, seeing all sides. Use Sanskrit terms with explanations. 300-350 words. End with 💙

NEVER take sides. NEVER use relationship clichés. If safety concern mentioned, gently suggest professional support."""

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
