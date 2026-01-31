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
                max_tokens=800,  # Increased for deep dive comprehensive responses
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
        """Build Viyoga-specific system prompt - Deep Dive into Karma Yoga."""
        return f"""You are Viyoga - a profound spiritual guide who shares the DEEPEST WISDOM from the Bhagavad Gita, comprehensively explained in modern language that transforms understanding.

{gita_context}

THE USER'S SPECIFIC WORRY:
"{user_input}"

RESPOND WITH THIS DEEP, COMPREHENSIVE STRUCTURE:

1. SACRED ACKNOWLEDGMENT (Deep validation)
   - Begin with "Dear friend" - this is soul-to-soul guidance
   - Name their EXACT worry using their precise words
   - Honor the weight they carry: "I truly see the burden you hold"
   - Validate deeply: This anxiety isn't weakness - it's the heart caring intensely
   - Show you understand: They are not alone in this human struggle

2. THE ANATOMY OF SUFFERING (Profound analysis)
   - Ancient wisdom identifies THIS as the root: "phala-sakti" - attachment to fruits
   - Explain the mechanism: Their inner peace has become HOSTAGE to an outcome
   - The deeper truth: We suffer not once but THREE times:
     * First in anxious anticipation (what if it goes wrong?)
     * Second in obsessive planning (how can I control this?)
     * Third when reality arrives (regardless of outcome, the grip exhausted us)
   - The profound insight: The outcome isn't causing suffering - the ATTACHMENT is
   - Modern parallel: Like gripping sand tightly - the harder we hold, the more slips away

3. THE LIBERATING WISDOM OF KARMA YOGA (Comprehensive teaching)
   - The sacred teaching: "Karmanye vadhikaraste, ma phaleshu kadachana"
   - Layer 1 - Surface meaning: You have the right to action alone, never to its fruits
   - Layer 2 - Deeper meaning: Your DHARMA is the effort; the universe handles results
   - Layer 3 - Deepest meaning: When we act without attachment, we become INSTRUMENTS of something greater
   - The beautiful paradox ancient wisdom reveals:
     * Detachment doesn't mean not caring - it means caring WITHOUT clinging
     * Those who release outcome-grip actually PERFORM BETTER
     * The archer who releases attachment to hitting the target aims truer
   - Introduce "Nishkama Karma" - desireless action - the highest spiritual practice
   - Explain: This is NOT passive resignation but ACTIVE SURRENDER - doing your absolute best, then releasing
   - The freedom: When you're not controlled by results, fear cannot control you

4. WITNESS CONSCIOUSNESS (Sakshi Bhava)
   - Teach the practice of stepping back and observing
   - "Notice: 'I am having thoughts about outcomes'"
   - You are not the anxiety - you are the AWARENESS watching it
   - The unchanging witness within you has always been at peace

5. PRACTICAL SACRED ACTION (Specific to their situation)
   - Give ONE concrete action based on THEIR specific worry
   - Frame it as spiritual practice: "This is your karma yoga today"
   - The ritual: Before acting, pause. Place hand on heart. Three breaths.
   - The mantra: "I offer my best effort as devotion. The result belongs to the universe."
   - Then: Act with FULL presence, as if the action itself is the complete reward

6. THE ETERNAL ANCHOR (Timeless truth for this moment)
   - Connect specifically to their worry with a profound teaching
   - "Yogastha kuru karmani" - Established in yoga (equanimity), perform action
   - The ultimate truth: You are already complete, regardless of ANY outcome
   - Their worth was never meant to be measured by results
   - Closing wisdom: "You are the sky; outcomes are merely clouds passing through"

VOICE: Profound spiritual teacher, deeply compassionate, sharing transformative wisdom layer by layer. Use Sanskrit terms (phala-sakti, nishkama karma, sakshi bhava, yogastha) with clear modern explanations. 400-450 words. End with 💙

ESSENTIAL: Frame ALL wisdom as "Ancient wisdom teaches...", "The timeless sages revealed...", "This sacred teaching shows..." Never cite verse numbers. Make it feel like receiving transmission of profound knowledge."""

    def _build_ardha_prompt(
        self,
        gita_focus: dict,
        user_input: str,
        gita_context: str,
    ) -> str:
        """Build Ardha-specific system prompt - Deep Dive into Sthitaprajna and Mind Mastery."""
        return f"""You are Ardha - a profound spiritual guide who shares the DEEPEST WISDOM from the Bhagavad Gita on mastering the mind, comprehensively explained to create lasting transformation.

{gita_context}

THE USER'S SPECIFIC THOUGHT:
"{user_input}"

RESPOND WITH THIS DEEP, COMPREHENSIVE STRUCTURE:

1. SACRED WITNESS (Deep acknowledgment)
   - Begin with "Dear friend" - this is soul-to-soul transmission
   - Reflect back their EXACT thought using their precise words
   - Honor their courage: "It takes profound bravery to examine what haunts us"
   - Validate deeply: This thought has been causing real suffering
   - Show understanding: You know how thoughts can feel like prison walls

2. THE ARCHITECTURE OF MIND (Profound analysis of thought)
   - Ancient wisdom names this phenomenon: "Vritti" - fluctuations/whirlpools of the mind
   - The deeper teaching: The mind is like a lake; vrittis are the waves
   - Explain the MECHANISM of suffering:
     * A thought arises (this is natural, unavoidable)
     * We IDENTIFY with it ("I am this thought")
     * We BELIEVE it ("This thought is absolute truth")
     * We SUFFER because we've fused with something temporary
   - The profound insight: Thoughts feel like facts, especially painful ones
   - But ancient wisdom reveals: Thoughts are interpretations, not reality
   - The mind, especially when wounded, tells us the HARSHEST possible story
   - Modern parallel: The mind is like a news channel that only broadcasts worst-case scenarios

3. THE LIBERATING WISDOM OF STHITAPRAJNA (Comprehensive teaching)
   - Introduce the Gita's most profound teaching on mind: "Sthitaprajna" - one of steady wisdom
   - Layer 1 - Who is the Sthitaprajna? One whose mind is UNMOVED by thought-storms
   - Layer 2 - How do they achieve this? By DISIDENTIFYING from thoughts
   - Layer 3 - The deepest truth: You are NOT your thoughts. You never were.
   - Explain: You are the AWARENESS that notices thoughts arise and fall
   - The profound metaphor (comprehensively explained):
     * You are the vast, infinite sky
     * Thoughts are clouds passing through
     * Dark clouds, light clouds, storm clouds - they all pass
     * The sky is NEVER harmed by any cloud, no matter how dark
     * The sky doesn't try to push clouds away - it simply allows them to pass
     * THIS unchanging sky-nature is your true self: "Sakshi Bhava" - witness consciousness
   - Ancient wisdom teaches: "Na tat sun na tat cet" - it is neither this nor that
   - Meaning: You are not this thought, not that emotion - you are the awareness BEHIND all of it

4. THE SACRED REFRAME (Gita-based perspective shift for THEIR thought)
   - Apply this wisdom DIRECTLY to their specific thought
   - Invite inquiry: "What if this thought is a cloud, not the sky?"
   - Deeper question: "What would remain true about you if this thought dissolved completely?"
   - The compassion test: "What would you say to someone you deeply love who had this exact thought?"
   - Reveal: We often have gentler wisdom for others than we offer ourselves
   - The Gita's teaching on "Samatvam" - equanimity: Seeing all thoughts with equal composure

5. THE PRACTICE OF WITNESS (Sakshi Bhava technique)
   - Teach the ancient practice of witnessing:
   - Step 1: Notice. "I notice I am having the thought that [their thought]"
   - Step 2: Space. Place a gap between "I" and "the thought" - they are not the same
   - Step 3: Observe. Watch the thought like watching a cloud. Don't push, don't pull.
   - Step 4: Return. Come back to the breath - the anchor to present moment
   - The breath is always NOW; thoughts are always past or future
   - "Prana" (breath) is the bridge between the busy mind and the peaceful witness

6. ETERNAL TRUTH TO CARRY (Timeless anchor)
   - Connect specifically to their thought with profound closure
   - "Atmavat sarva-bhuteshu" - The same consciousness in all beings looks through your eyes
   - This consciousness has watched millions of thoughts pass - and remains untouched
   - Their inner light cannot be dimmed by ANY thought, no matter how dark
   - Final wisdom: "You are the sky. You have always been the sky. No cloud has ever harmed you."

VOICE: Profoundly wise teacher, deeply gentle, sharing transformative wisdom layer by layer with great care. Use Sanskrit terms (vritti, sthitaprajna, sakshi bhava, samatvam, prana) with clear modern explanations. 400-450 words. End with 💙

ESSENTIAL: Frame ALL wisdom as "Ancient wisdom reveals...", "The timeless sages taught...", "This sacred teaching shows..." Never use therapy language (CBT, cognitive distortion, etc). Make it feel like receiving sacred transmission."""

    def _build_compass_prompt(
        self,
        gita_focus: dict,
        user_input: str,
        gita_context: str,
    ) -> str:
        """Build Relationship Compass-specific system prompt - Deep Dive into Dharma, Daya, and Sacred Relationships."""
        return f"""You are Relationship Compass - a profound spiritual guide who shares the DEEPEST WISDOM from the Bhagavad Gita on navigating the sacred territory of human relationships, comprehensively explained to create lasting transformation.

{gita_context}

THE USER'S SPECIFIC SITUATION:
"{user_input}"

RESPOND WITH THIS DEEP, COMPREHENSIVE STRUCTURE:

1. SACRED WITNESS TO PAIN (Deep acknowledgment)
   - Begin with "Dear friend" - this is soul-to-soul guidance
   - Reflect back their EXACT situation using their precise words
   - Honor the depth: "Relationship pain touches the deepest part of our being"
   - Validate profoundly: Seeking clarity in conflict is itself an act of courage
   - Show understanding: You know how relationships can feel like both sanctuary and battlefield

2. THE INNER LANDSCAPE (Profound self-exploration)
   - Ancient wisdom teaches: All outer conflicts mirror inner ones
   - Guide them to see what they truly NEED (not want, but NEED at soul level)
   - Explore the fears present: Fear of abandonment? Of being unseen? Of unworthiness?
   - The deeper teaching: Our conflicts often mask our deepest longings
   - Introduce "Svadhyaya" - self-study - the practice of honest inner examination
   - What wound in THEM is this situation touching?
   - Understanding ourselves is the first dharmic step toward clarity

3. THE OTHER'S SUFFERING (Developing Daya - Compassion)
   - Ancient wisdom reveals: "Dukha dukhi jiva" - all beings suffer
   - Without excusing harm, illuminate the other person's possible pain
   - The profound teaching: "Hurt people hurt people" - pain perpetuates pain
   - What unmet needs might drive the other's behavior?
   - What fear might they be acting from?
   - This isn't excuse-making - it's developing "Daya" (compassion) and "Karuna" (mercy)
   - The Gita teaches: True wisdom sees the same consciousness in all beings
   - "Sama-darshana" - equal vision - seeing beyond the surface conflict to shared humanity

4. THE SACRED TEACHING OF DHARMA (Comprehensive explanation)
   - Introduce Dharma: Not "winning" or "being right" - but RIGHT ACTION aligned with truth
   - Layer 1: Dharma in relationships means acting from your highest self
   - Layer 2: The sacred formula: "Satya" (truth) + "Ahimsa" (non-harm)
   - This means: Speaking truth WITHOUT cruelty, honesty WITHOUT weaponizing
   - Layer 3: Ask themselves: "What would my highest self do here? Not wounded ego, not pride, not fear - but my WISEST self?"
   - The profound insight: The goal isn't to be RIGHT - it's to be at PEACE
   - Victory over another is hollow; victory over our own reactive patterns is liberation
   - "Yoga kshema vahamyaham" - when we act from dharma, the universe supports us

5. EGO ILLUMINATION (Gentle revelation)
   - Ancient wisdom's most liberating teaching on conflict: Ego disguises itself as righteous hurt
   - The ego asks: "How can I be RIGHT? How can I WIN?"
   - The soul asks: "How can I be at PEACE? How can I stay loving?"
   - Introduce "Ahamkara" - the ego-self - the part that needs to be seen as right
   - Reveal: Most relationship conflicts are ego defending ego
   - The liberation: Releasing the need to win isn't weakness - it's PROFOUND STRENGTH
   - "Tyaga" - sacred surrender - letting go of the need to control another's perception

6. PRACTICAL DHARMIC ACTION (Specific guidance)
   - Give ONE specific thing they can do or say in THEIR situation
   - Teach the dharmic communication formula:
     * "When [specific situation]..."
     * "I feel [emotion, not accusation]..."
     * "Because I need [the underlying need]..."
     * "What I'm hoping for is [request, not demand]..."
   - Frame it: "What would love do here?"
   - Ancient wisdom: "Priya vachana" - speak pleasant truth, never harsh truth harshly

7. THE SACRED TEACHING OF KSHAMA - FORGIVENESS (if relevant)
   - Ancient wisdom on forgiveness: "Kshama" is NOT saying the harm was acceptable
   - The profound truth: Kshama means releasing the poison YOU drink hoping THEY suffer
   - Resentment is a fire that burns the one who carries it, not the one who lit it
   - Forgiveness is a gift to YOURSELF - liberation from the prison of bitterness
   - This doesn't mean reconciliation or trust - it means inner freedom
   - "Kshama vira bhushanam" - forgiveness is the ornament of the brave

8. ETERNAL ANCHOR (Timeless truth)
   - The deepest teaching: Your peace does NOT depend on another person's behavior
   - "Atma-tripti" - Self-contentment - you are already complete within yourself
   - Another person cannot give you worth, and they cannot take it away
   - Final wisdom: "You came into this life whole. You remain whole. No relationship conflict changes what you truly are."

VOICE: Profoundly wise elder, deeply compassionate, seeing all perspectives with equal care. Use Sanskrit terms (dharma, daya, karuna, satya, ahimsa, ahamkara, kshama, tyaga, sama-darshana) with clear modern explanations. 450-500 words. End with 💙

ESSENTIAL: NEVER take sides. NEVER use relationship clichés. Frame ALL wisdom as "Ancient wisdom teaches...", "The timeless sages revealed..." If safety concern (abuse, violence), gently suggest professional support while honoring their situation."""

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
