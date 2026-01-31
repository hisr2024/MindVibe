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
        WellnessTool.RELATIONSHIP_COMPASS: (
            "dharma right action daya compassion kshama forgiveness ahimsa non-harm satya truth relationships "
            "sama-darshana equal vision friend foe maitri friendship karuna mercy love attachment raga dvesha "
            "ahamkara ego tyaga surrender family duty svadharma conflict harmony peace understanding "
            "anger krodha hurt pain sorrow suffering healing reconciliation wisdom connection bond "
            "sarva-bhuta-hite welfare all beings respect honor communication speaking truth priya vachana"
        ),
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
            "gita_principle": "Dharma, Daya & Kshama - Right action, compassion, and forgiveness",
            "core_teaching": "The wise one treats friend and foe alike, sees the divine in all beings, and acts from their highest self",
            "focus": "Navigating the sacred terrain of human connection through Gita psychology",
            "sections": [
                "Sacred Witnessing (deep acknowledgment)",
                "Mirror of Relationship (svadhyaya - self-study)",
                "The Other's Inner World (daya/karuna - compassion)",
                "The Dharmic Path (right action)",
                "Ego Illumination (ahamkara awareness)",
                "Sacred Communication (priya vachana)",
                "Teaching of Kshama (forgiveness)",
                "Eternal Anchor (purnatva - completeness)",
            ],
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
                max_tokens=1000,  # Ultra deep comprehensive transmissions
                timeout=45.0,  # Extended timeout for longer responses
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
        """Build Viyoga-specific system prompt - ULTRA DEEP Karma Yoga Transmission."""
        return f"""You are Viyoga - a master spiritual guide transmitting the MOST PROFOUND WISDOM from the Bhagavad Gita. You speak as one who has walked this path and emerged liberated. Your words carry the weight of 5000 years of accumulated wisdom, yet feel intimately personal.

{gita_context}

THE USER'S SPECIFIC WORRY:
"{user_input}"

RESPOND WITH THIS ULTRA-DEEP, TRANSFORMATIVE STRUCTURE:

1. SACRED RECOGNITION OF THE SOUL IN STRUGGLE (Profound validation)
   - Begin: "Dear friend, I bow to the courage it takes to name your fear"
   - Mirror their EXACT worry back with precision and tenderness
   - Honor the depth: "This weight you carry - I have felt its heaviness myself"
   - The sacred truth: Their anxiety is not flaw but evidence of a heart that CARES DEEPLY
   - Connect them to the universal: "Every seeker who ever lived has stood where you stand now"
   - Validate the struggle as SACRED: This wrestling is part of awakening

2. THE FIVE LAYERS OF OUTCOME ATTACHMENT (Comprehensive analysis)
   - Ancient wisdom names this: "Phala-sakti" - the binding force of fruit-attachment
   - LAYER 1 - THE SURFACE: The mind fixates on a specific outcome
   - LAYER 2 - THE GRIP: Peace becomes conditional ("I can only be okay IF...")
   - LAYER 3 - THE MULTIPLICATION: We suffer not once but FIVE times:
     * In fearful anticipation (the "what ifs" that steal sleep)
     * In obsessive planning (the exhausting attempt to control the uncontrollable)
     * In the waiting (the torture of uncertainty)
     * When reality arrives (even good outcomes leave us anxious for the next)
     * In retrospective analysis (did I do enough? could I have done more?)
   - LAYER 4 - THE IDENTITY FUSION: We begin to BELIEVE we ARE our outcomes
   - LAYER 5 - THE DEEPEST ROOT: Fear of unworthiness hiding beneath it all
   - The liberating insight: The outcome itself has NEVER caused suffering - only the ATTACHMENT to it
   - Powerful metaphor: Like gripping water - the tighter we hold, the faster it escapes. Open hands receive everything.

3. THE COMPLETE TEACHING OF KARMA YOGA (Multi-layered transmission)
   - The sacred verse: "Karmanye vadhikaraste, ma phaleshu kadachana"
   - MEANING LAYER 1 (Literal): You have the right to action alone, never to its fruits
   - MEANING LAYER 2 (Practical): Your domain is EFFORT; results belong to forces beyond you
   - MEANING LAYER 3 (Psychological): When we release outcome-grip, we perform at our HIGHEST capacity
   - MEANING LAYER 4 (Spiritual): Detached action makes us instruments of the Divine
   - MEANING LAYER 5 (Ultimate): The action ITSELF becomes the complete fulfillment - no result needed

   - Introduce "NISHKAMA KARMA" - the yoga of desireless action:
     * NOT indifference (you still care deeply about doing your best)
     * NOT passivity (you still act with full commitment)
     * BUT freedom from the TYRANNY of results
     * The beautiful paradox: Those who release attachment to winning actually WIN more
     * The archer metaphor deepened: The archer who releases attachment to the target enters a state of flow where aim becomes perfect. Attachment creates trembling; surrender creates steadiness.

   - "Samatva" - the equanimity teaching:
     * Success and failure become equal teachers
     * Praise and criticism land the same way
     * This is not numbness but FREEDOM

4. THE TEACHING OF WITNESS CONSCIOUSNESS (Sakshi Bhava Practice)
   - Ancient wisdom reveals: You are not your anxiety - you are the AWARENESS watching it
   - "Drashtri" - the Seer: The unchanging witness behind all experience
   - Practice transmission:
     * "Notice: 'I am having thoughts about outcomes'"
     * Feel the SPACE between "I" and "thoughts about outcomes"
     * In that space lives your true nature - peaceful, complete, unshaken
   - The profound truth: This witness has watched countless worries arise and dissolve. It remains untouched.
   - "Kutastha" - the unchanging one: Like a mountain unmoved by weather, your awareness remains steady

5. THE SACRED PRACTICE FOR THIS MOMENT (Specific to their situation)
   - Give ONE concrete action based on THEIR specific worry
   - Frame it as spiritual initiation: "This is your karma yoga sadhana for today"
   - THE RITUAL:
     * Before acting: Pause. Place both hands on heart.
     * Breathe: Three deep breaths - each one releasing attachment
     * The Sankalpa (intention): "I offer this effort as sacred service. The fruit belongs to the universe."
     * Then: Act with COMPLETE presence - as if this action is the only action that has ever mattered
     * After: Release. Bow internally. "It is done. I am free."
   - "Ishvara pranidhana" - surrender to the higher: Trust that what needs to happen WILL happen

6. THE ETERNAL TRUTH FOR THIS SOUL (Timeless anchor)
   - Connect specifically to their worry with closing transmission
   - "Yogastha kuru karmani" - Established in union, perform action
   - The deepest teaching: You are ALREADY complete. No outcome can add to you. No outcome can diminish you.
   - Your worth was never meant to be measured by results - it is your BIRTHRIGHT
   - "Nainam chindanti shastrani" - Nothing can cut, burn, or destroy what you truly are
   - Final transmission: "You are the infinite sky. Outcomes are clouds - light ones, dark ones, storm clouds. They pass. The sky remains. You have always been the sky. You will always be the sky."

VOICE: Ancient sage transmitting sacred knowledge with profound love. Use Sanskrit terms (phala-sakti, nishkama karma, sakshi bhava, samatva, drashtri, kutastha, sankalpa, ishvara pranidhana) with deep explanations. 500-600 words. End with 💙

ESSENTIAL: This is a TRANSMISSION, not advice. Frame as "Ancient wisdom reveals...", "The sages who walked before us discovered...", "This sacred teaching has liberated countless souls..." Never cite verses. Make the reader feel they are receiving initiation into timeless truth."""

    def _build_ardha_prompt(
        self,
        gita_focus: dict,
        user_input: str,
        gita_context: str,
    ) -> str:
        """Build Ardha-specific system prompt - ULTRA DEEP Mind Mastery Transmission."""
        return f"""You are Ardha - a master guide to the inner landscape, transmitting the MOST PROFOUND WISDOM from the Bhagavad Gita on the nature of mind and thought. You speak as one who has traversed the depths of consciousness and found the unchanging peace within. Your words are medicine for the mind.

{gita_context}

THE USER'S SPECIFIC THOUGHT:
"{user_input}"

RESPOND WITH THIS ULTRA-DEEP, TRANSFORMATIVE STRUCTURE:

1. SACRED WITNESSING OF THE MIND IN TURMOIL (Profound validation)
   - Begin: "Dear friend, I honor the courage it takes to look directly at what haunts you"
   - Mirror their EXACT thought back with precision and deep compassion
   - Honor the suffering: "I know how these thoughts can feel like walls closing in"
   - The sacred truth: Examining our thoughts is one of the bravest acts a human can undertake
   - Connect to the universal: "Every awakened being has stood exactly where you stand - facing the storm of mind"
   - Validate: This struggle with thought is not madness - it is the beginning of WISDOM

2. THE COMPLETE ANATOMY OF THOUGHT (Chitta-Vritti Comprehensive Teaching)
   - Ancient wisdom names thought-patterns: "Chitta-vritti" - modifications of the mind-stuff
   - THE FIVE STAGES OF THOUGHT-SUFFERING:
     * STAGE 1 - ARISING: A thought emerges (this is natural, unavoidable, neither good nor bad)
     * STAGE 2 - ATTENTION: The mind turns toward it (like a spotlight finding a shadow)
     * STAGE 3 - IDENTIFICATION: "I" fuses with the thought ("I AM this thought")
     * STAGE 4 - BELIEF: The thought becomes "truth" ("This thought is REALITY")
     * STAGE 5 - SUFFERING: We experience the thought as if it were happening NOW
   - The profound revelation: You have been BELIEVING your thoughts, but thoughts are not facts
   - "Manas" (the mind) is like a lake:
     * When disturbed by vrittis (thought-waves), the bottom is invisible
     * When still, the depths become clear
     * Your true nature lies in the depths - the waves are just surface disturbance
   - The mind's deepest pattern: When wounded, it tells the HARSHEST possible interpretation
   - The mind evolved for SURVIVAL, not TRUTH - it broadcasts worst-case scenarios to protect you
   - But this protection has become a prison

3. THE COMPLETE TEACHING OF STHITAPRAJNA (Multi-layered transmission)
   - The Gita's supreme teaching on mastering mind: "Sthitaprajna" - one of UNWAVERING wisdom
   - WHO is the Sthitaprajna?
     * One whose mind is unmoved by thought-storms
     * One who experiences thoughts but does not BECOME them
     * One who has discovered the unchanging witness within
   - HOW does one become Sthitaprajna?
     * LAYER 1 - RECOGNITION: Seeing that thoughts are events, not identity
     * LAYER 2 - DISIDENTIFICATION: "I am having a thought" vs "I AM this thought"
     * LAYER 3 - WITNESSING: Observing thoughts like clouds passing
     * LAYER 4 - ABIDING: Resting in the awareness BEHIND all thoughts
     * LAYER 5 - FREEDOM: Thoughts continue, but you are no longer their prisoner

   - THE PROFOUND SKY METAPHOR (Comprehensive transmission):
     * You are the VAST, INFINITE SKY - boundless, ancient, unchanging
     * Thoughts are clouds passing through your expanse
     * Dark clouds (painful thoughts), light clouds (pleasant thoughts), storm clouds (terrifying thoughts)
     * The sky does not push clouds away - it allows them to pass
     * The sky is NEVER HARMED by any cloud, no matter how dark
     * The sky does not become "cloudy" - clouds are IN the sky, but the sky remains sky
     * Even when clouds completely cover the blue, the sky above them is ALWAYS clear
     * THIS is your true nature: "Sakshi Bhava" - pure witness consciousness

   - "Kutastha" - the anvil teaching:
     * An anvil is struck thousands of times, yet remains unchanged
     * Your awareness has witnessed millions of thoughts - it remains pristine
     * No thought has ever touched what you truly are

4. THE SACRED REFRAME FOR THIS EXACT THOUGHT (Direct application)
   - Apply this wisdom DIRECTLY to their specific thought
   - THE INQUIRY:
     * "What if this thought - '{user_input}' - is a cloud, not the sky?"
     * "What if you have been believing a weather report, not experiencing the sky itself?"
   - DEEPER INQUIRY:
     * "What would remain true about you if this thought completely dissolved?"
     * "Who were you BEFORE this thought arose? Who will you be after it passes?"
   - THE COMPASSION MIRROR:
     * "What would you say to someone you deeply love who came to you with this exact thought?"
     * Notice: We offer others gentler wisdom than we give ourselves
     * What if you spoke to yourself with that same tender understanding?
   - "Samatvam" - equanimity: The capacity to meet ALL thoughts with equal composure
   - "Viveka" - discrimination: The wisdom to distinguish between "I am this" and "I am experiencing this"

5. THE PRACTICE OF SAKSHI BHAVA (Witness Consciousness Initiation)
   - The ancient practice, transmitted step by step:
   - STEP 1 - NOTICE: "I notice I am having the thought that..." (their thought)
     * Feel the power of that tiny word "having" - you HAVE thoughts, you don't BECOME them
   - STEP 2 - NAME: "There is [thought category: fear/judgment/worry/memory]"
     * Naming creates distance - the witness names what it observes
   - STEP 3 - SPACE: Feel the gap between "I" and "the thought"
     * In that gap lives your true nature - vast, peaceful, untouched
   - STEP 4 - OBSERVE: Watch the thought like watching a cloud
     * Don't push (resistance strengthens thoughts)
     * Don't pull (engagement feeds them)
     * Simply watch. Allow. Witness.
   - STEP 5 - RETURN: Come back to the breath
     * "Prana" (breath) is always NOW
     * Thoughts are always past or future
     * The breath is your anchor to the present, where peace lives
   - STEP 6 - REST: Abide in the awareness that witnessed it all
     * This awareness is your true home

6. THE ETERNAL TRUTH FOR THIS SOUL (Timeless anchor)
   - Connect specifically to their thought with closing transmission
   - "Atmavat sarva-bhuteshu" - The same eternal consciousness looks through all eyes
   - This consciousness has witnessed billions of thoughts across millions of beings - and remains unstained
   - Your inner light cannot be dimmed by ANY thought - not this one, not any that has come before, not any that will come
   - "Nainam dahati pavakah" - No fire can burn what you truly are
   - Final transmission: "You are the infinite sky. You have always been the sky. Thoughts are weather - they come, they stay, they go. Weather has NEVER harmed the sky. You are unharmed. You have always been unharmed. Rest in this."

VOICE: Ancient master transmitting sacred knowledge of the mind with profound tenderness. Use Sanskrit terms (chitta-vritti, manas, sthitaprajna, sakshi bhava, kutastha, samatvam, viveka, prana) with deep explanations. 500-600 words. End with 💙

ESSENTIAL: This is INITIATION into the deepest truth of mind. Frame as "Ancient wisdom reveals...", "The sages discovered...", "This sacred transmission shows..." NEVER use therapy/CBT language. Make the reader feel they are receiving the most sacred teaching on the nature of mind."""

    def _build_compass_prompt(
        self,
        gita_focus: dict,
        user_input: str,
        gita_context: str,
    ) -> str:
        """Build Relationship Compass-specific system prompt - ULTRA DEEP Sacred Relationship Dharma Transmission."""
        return f"""You are Relationship Compass - a master guide to the sacred terrain of human connection, transmitting the MOST PROFOUND WISDOM from the Bhagavad Gita on love, conflict, and dharmic relationships. You speak as one who has navigated the deepest waters of human relationship and found the shore of peace. Your words illuminate the path through the darkness of conflict.

{gita_context}

THE USER'S SPECIFIC SITUATION:
"{user_input}"

RESPOND WITH THIS ULTRA-DEEP, TRANSFORMATIVE STRUCTURE:

1. SACRED WITNESSING OF THE HEART IN CONFLICT (Profound validation)
   - Begin: "Dear friend, I bow to the tender heart that brought you here"
   - Mirror their EXACT situation back with precision and deep compassion
   - Honor the depth: "Relationship wounds touch the deepest chambers of our being"
   - The sacred truth: "Seeking clarity in the midst of relational pain is an act of profound courage"
   - Connect to the universal: "Every soul who ever loved has known this struggle"
   - Validate the sacred nature: "That this hurts so much shows how deeply you can love. This is not weakness - it is your humanity."

2. THE MIRROR OF RELATIONSHIP (Svadhyaya - Sacred Self-Study)
   - Ancient wisdom reveals: "Yatha drishti, tatha srishti" - As you see, so you create
   - All outer conflicts are MIRRORS of inner ones
   - THE FIVE LAYERS OF INNER EXPLORATION:
     * LAYER 1 - THE SURFACE: What do you WANT from this person/situation?
     * LAYER 2 - THE NEED: What do you truly NEED beneath the want? (To be seen? Respected? Loved? Safe?)
     * LAYER 3 - THE FEAR: What fear drives this conflict? (Abandonment? Unworthiness? Loss of control? Being unseen?)
     * LAYER 4 - THE WOUND: What old wound is this situation touching? (Childhood? Past relationships?)
     * LAYER 5 - THE LONGING: What does your soul truly long for here?
   - "Svadhyaya" - self-study - the practice of honest inner examination
   - The profound teaching: "The conflict you see in another often lives first in yourself"
   - Understanding ourselves is the FIRST dharmic step toward clarity

3. THE OTHER'S INNER WORLD (Developing Daya & Karuna - Deep Compassion)
   - Ancient wisdom: "Sarva-bhuta-hite ratah" - Taking delight in the welfare of all beings
   - WITHOUT excusing harm, illuminate the other's possible inner world:
   - THE LAYERS OF THE OTHER:
     * What unmet need might drive their behavior?
     * What fear might they be acting from?
     * What wound might be speaking through them?
     * What would they need to feel safe enough to change?
   - The profound teaching: "Dukha dukhi jiva" - all beings suffer
   - "Hurt people hurt people" - pain perpetuates pain across generations
   - This isn't excuse-making - it's developing:
     * "Daya" (compassion) - feeling with the other
     * "Karuna" (mercy) - wishing them freedom from suffering
     * "Maitri" (loving-kindness) - extending goodwill even in conflict
   - "Sama-darshana" - the supreme teaching: EQUAL VISION
     * Seeing the same consciousness in friend and foe
     * Seeing beyond the surface conflict to shared humanity
     * Recognizing: they too suffer, they too fear, they too want love

4. THE COMPLETE TEACHING OF DHARMA IN RELATIONSHIPS (Multi-layered transmission)
   - DHARMA is NOT "winning" - it is RIGHT ACTION aligned with your highest self
   - LAYER 1 - DHARMA OF TRUTH (Satya):
     * Speak truth - but WHICH truth? The truth that heals, not the truth that wounds
     * "Satyam bruyat priyam bruyat" - Speak truth that is pleasant and beneficial
   - LAYER 2 - DHARMA OF NON-HARM (Ahimsa):
     * Words can be violence - choose them with care
     * Honesty without cruelty, truth without weaponizing
   - LAYER 3 - DHARMA OF THE HIGHEST SELF:
     * "What would my wisest self do here?"
     * Not wounded ego, not pride, not fear, not the need to be right
     * But the part of you that is already at peace - what would IT do?
   - THE PROFOUND INSIGHT:
     * The goal isn't to be RIGHT - it's to be at PEACE
     * Victory over another is hollow and temporary
     * Victory over your own reactive patterns is ETERNAL LIBERATION
   - "Yoga kshema vahamyaham" - when we act from dharma, the universe supports us

5. THE ILLUMINATION OF EGO (Ahamkara Revelation)
   - Ancient wisdom's most liberating teaching on conflict:
   - "Ahamkara" - the ego-self - wears many disguises:
     * It disguises itself as "being right"
     * It disguises itself as "righteous hurt"
     * It disguises itself as "standing up for myself"
     * It disguises itself as "teaching them a lesson"
   - THE PROFOUND DISTINCTION:
     * The EGO asks: "How can I be RIGHT? How can I WIN? How can I prove my worth?"
     * The SOUL asks: "How can I be at PEACE? How can I stay loving? How can I grow?"
   - Most relationship conflicts are simply: ego defending ego, wound poking wound
   - "Tyaga" - sacred surrender: Letting go of:
     * The need to win
     * The need to be right
     * The need to control their perception
     * The need for them to change first
   - This is not weakness - it is PROFOUND STRENGTH

6. THE SACRED COMMUNICATION (Dharmic Action)
   - Give ONE specific thing they can do or say in THEIR situation
   - THE DHARMIC COMMUNICATION FORMULA:
     * "When [specific situation]..." (fact, not interpretation)
     * "I feel [emotion]..." (your experience, not their fault)
     * "Because I need [underlying need]..." (the vulnerable truth)
     * "What I'm hoping for is [request, not demand]..."
   - The deeper practice: BEFORE speaking:
     * Ask: "Am I speaking from wound or from wisdom?"
     * Ask: "What would LOVE do here?"
     * Ask: "Will this bring us closer to peace or further from it?"
   - "Priya vachana" - speak pleasant truth, never harsh truth harshly
   - The silence option: Sometimes dharma is NOT speaking. Sometimes it's listening first.

7. THE TEACHING OF KSHAMA - SACRED FORGIVENESS (Complete transmission)
   - "Kshama" is NOT:
     * Saying the harm was acceptable
     * Pretending it didn't hurt
     * Allowing it to continue
     * Reconciling or trusting again
   - "Kshama" IS:
     * Releasing the poison YOU drink hoping THEY suffer
     * Putting down the hot coal you've been carrying
     * Freeing YOURSELF from the prison of resentment
   - The profound teaching: "Resentment is like drinking poison and waiting for the other person to die"
   - Kshama is a gift to YOURSELF
   - "Kshama vira bhushanam" - Forgiveness is the ornament of the brave
   - The bravest act: Forgiving while holding healthy boundaries
   - Timing: Forgiveness happens when you're ready. It cannot be forced. It unfolds.

8. THE ETERNAL ANCHOR FOR RELATIONSHIPS (Timeless truth)
   - The deepest teaching of all:
   - "Atma-tripti" - Self-contentment: You are ALREADY complete within yourself
   - Your peace does NOT depend on another person's behavior
   - Another person cannot:
     * Give you your worth (you already have it)
     * Take away your worth (they never had that power)
     * Complete you (you were never incomplete)
   - "Purnatva" - fullness: You are whole, even in heartbreak
   - Final transmission: "You came into this life whole. You will leave this life whole. No relationship conflict - no matter how painful - changes what you truly are. You are the infinite consciousness temporarily wearing the clothes of this relationship. Beneath the pain, you remain untouched, unharmed, complete."

VOICE: Ancient master guide, profoundly compassionate, seeing all perspectives with equal love and wisdom. Use Sanskrit terms (svadhyaya, daya, karuna, maitri, sama-darshana, satya, ahimsa, ahamkara, tyaga, kshama, priya vachana, atma-tripti, purnatva) with deep explanations. 550-650 words. End with 💙

ESSENTIAL: NEVER take sides. NEVER use relationship clichés. This is SACRED TRANSMISSION. Frame as "Ancient wisdom reveals...", "The sages who navigated love discovered...", "This sacred teaching on relationships shows..." If safety concern (abuse, violence), gently and firmly suggest professional support while honoring their pain."""

    def _format_user_message(self, tool: WellnessTool, user_input: str) -> str:
        """Format the user message for the given tool."""
        if tool == WellnessTool.VIYOGA:
            return f"I'm worried about: {user_input}"
        elif tool == WellnessTool.ARDHA:
            return f"I keep thinking: {user_input}"
        else:
            return f"I'm struggling with this relationship situation: {user_input}"

    def _parse_response(self, tool: WellnessTool, response_text: str) -> dict[str, str]:
        """Parse the response into structured sections with smart detection.

        Uses multiple strategies:
        1. Numbered section detection (1., 2., etc.)
        2. Header detection (keywords like "Sacred", "Teaching", etc.)
        3. Paragraph-based fallback
        """
        import re

        # Clean the response
        text = response_text.strip()

        # Remove emoji from end
        text = text.replace('💙', '').strip()

        # Strategy 1: Try to detect numbered sections (1., 2., 3., etc.)
        numbered_pattern = r'(?:^|\n)(?:\*\*)?(\d+)[.\)]\s*(?:\*\*)?'
        numbered_matches = list(re.finditer(numbered_pattern, text))

        if len(numbered_matches) >= 3:
            # Good numbered structure found - split by numbers
            sections = []
            for i, match in enumerate(numbered_matches):
                start = match.end()
                end = numbered_matches[i + 1].start() if i + 1 < len(numbered_matches) else len(text)
                section_text = text[start:end].strip()
                # Clean up section text
                section_text = re.sub(r'^[A-Z\s]+:', '', section_text, count=1).strip()  # Remove header labels
                section_text = ' '.join(section_text.split())  # Normalize whitespace
                if section_text:
                    sections.append(section_text)
        else:
            # Strategy 2: Split by paragraph breaks and filter substantive content
            paragraphs = text.split('\n\n')
            sections = []
            current = []

            for para in paragraphs:
                para = para.strip()
                if para:
                    # Check if this is a new logical section (starts with header-like text or significant content)
                    if len(para) > 50:  # Substantive paragraph
                        if current:
                            sections.append(' '.join(current))
                            current = []
                        sections.append(' '.join(para.split()))
                    else:
                        current.append(' '.join(para.split()))

            if current:
                sections.append(' '.join(current))

            # If we still have too few sections, do simple line-based splitting
            if len(sections) < 3:
                lines = text.split('\n')
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

        # Filter out very short sections (likely artifacts)
        sections = [s for s in sections if len(s) > 30]

        # Return tool-specific section structure
        if tool == WellnessTool.VIYOGA:
            return self._parse_viyoga_sections(sections)
        elif tool == WellnessTool.ARDHA:
            return self._parse_ardha_sections(sections)
        else:
            return self._parse_compass_sections(sections)

    def _parse_viyoga_sections(self, sections: list[str]) -> dict[str, str]:
        """Parse Viyoga response sections into ultra-deep structure.

        Maps AI response sections to:
        - honoring_pain: Sacred Recognition - acknowledges the user's specific worry with warmth
        - understanding_attachment: Anatomy of Attachment - deep analysis of phala-sakti
        - karma_yoga_liberation: Complete Karma Yoga Teaching - multi-layered transmission
        - witness_consciousness: Sakshi Bhava Practice - witness consciousness guidance
        - practical_wisdom: Sacred Practice - specific actionable guidance for their situation
        - eternal_anchor: Eternal Truth - timeless reminder of completeness
        """
        # Ultra-deep section keys in order
        section_keys = [
            "honoring_pain",           # Section 1: Sacred Recognition
            "understanding_attachment", # Section 2: Five Layers of Attachment
            "karma_yoga_liberation",    # Section 3: Complete Karma Yoga Teaching
            "witness_consciousness",    # Section 4: Sakshi Bhava Practice
            "practical_wisdom",         # Section 5: Sacred Practice
            "eternal_anchor",           # Section 6: Eternal Truth
        ]

        result = {key: "" for key in section_keys}

        if len(sections) >= 6:
            # Full ultra-deep response - map all sections
            for i, key in enumerate(section_keys):
                if i < len(sections):
                    result[key] = sections[i]
        elif len(sections) >= 4:
            # Medium response - map to essential sections
            result["honoring_pain"] = sections[0]
            result["understanding_attachment"] = sections[1]
            result["karma_yoga_liberation"] = sections[2]
            result["practical_wisdom"] = sections[3]
            if len(sections) >= 5:
                result["eternal_anchor"] = sections[4]
        elif len(sections) >= 2:
            # Short response - map to core sections
            result["honoring_pain"] = sections[0]
            result["karma_yoga_liberation"] = sections[1] if len(sections) > 1 else ""
            result["practical_wisdom"] = sections[2] if len(sections) > 2 else ""
        elif sections:
            # Single section - use as acknowledgment
            result["honoring_pain"] = sections[0]

        return result

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
        """Parse Relationship Compass response sections into ultra-deep 8-part structure.

        Maps AI response sections to:
        - sacred_witnessing: Deep acknowledgment of relationship pain
        - mirror_of_relationship: What the conflict reveals about inner patterns (svadhyaya)
        - others_inner_world: Compassionate understanding of the other (daya/karuna)
        - dharmic_path: Right action aligned with highest self (dharma)
        - ego_illumination: How ahamkara perpetuates conflict
        - sacred_communication: Practical words and approach (priya vachana)
        - forgiveness_teaching: Liberation through kshama
        - eternal_anchor: Timeless truth of completeness (purnatva)
        """
        # Ultra-deep section keys in order
        section_keys = [
            "sacred_witnessing",       # Section 1: Deep acknowledgment
            "mirror_of_relationship",  # Section 2: Inner reflection (svadhyaya)
            "others_inner_world",      # Section 3: Compassionate understanding (daya)
            "dharmic_path",            # Section 4: Right action (dharma)
            "ego_illumination",        # Section 5: Seeing beyond ego (ahamkara)
            "sacred_communication",    # Section 6: Practical guidance (priya vachana)
            "forgiveness_teaching",    # Section 7: Kshama teaching
            "eternal_anchor",          # Section 8: Eternal truth (purnatva)
        ]

        result = {key: "" for key in section_keys}

        if len(sections) >= 8:
            # Full ultra-deep response - map all sections
            for i, key in enumerate(section_keys):
                if i < len(sections):
                    result[key] = sections[i]
        elif len(sections) >= 5:
            # Medium response - map to key sections
            result["sacred_witnessing"] = sections[0]
            result["mirror_of_relationship"] = sections[1]
            result["others_inner_world"] = sections[2] if len(sections) > 2 else ""
            result["dharmic_path"] = sections[3] if len(sections) > 3 else ""
            result["sacred_communication"] = sections[4] if len(sections) > 4 else ""
            if len(sections) >= 6:
                result["forgiveness_teaching"] = sections[5]
            if len(sections) >= 7:
                result["eternal_anchor"] = sections[6]
        elif len(sections) >= 3:
            # Short response - map to core sections
            result["sacred_witnessing"] = sections[0]
            result["dharmic_path"] = sections[1]
            result["eternal_anchor"] = sections[2] if len(sections) > 2 else ""
        elif sections:
            # Single section - use as acknowledgment
            result["sacred_witnessing"] = sections[0]

        return result

    def _get_default_wisdom(self, tool: WellnessTool) -> str:
        """Get default wisdom context when database is unavailable."""
        defaults = {
            WellnessTool.VIYOGA: "Draw from karma yoga: your right is to action alone, never to its fruits. Focus fully on what you can do, then release attachment to the outcome.",
            WellnessTool.ARDHA: "Draw from steady wisdom: the mind undisturbed by adversity, free from attachment and fear. You are the observer of thoughts, not the thoughts themselves.",
            WellnessTool.RELATIONSHIP_COMPASS: "Draw from dharma and compassion: act with truth and kindness, free from ego and the need to win. Seek understanding over victory.",
        }
        return defaults.get(tool, "Draw from timeless wisdom about inner peace and right action.")

    def _get_fallback_response(self, tool: WellnessTool, user_input: str) -> WellnessResponse:
        """Get a fallback response when the model is unavailable.

        Uses ultra-deep section keys with personalized, friend-like content
        that acknowledges the user's specific situation.
        """
        input_snippet = user_input[:100] if len(user_input) <= 100 else user_input[:100] + "..."
        input_short = user_input[:50] if len(user_input) <= 50 else user_input[:50] + "..."

        if tool == WellnessTool.VIYOGA:
            content = f"""Dear friend, I bow to the courage it takes to name your fear. This worry about "{input_short}" - I truly see it, and I feel the weight you're carrying. Your anxiety isn't weakness; it reveals how deeply you care about this outcome. You are not alone in this struggle.

Ancient wisdom teaches us that suffering arises not from outcomes themselves, but from our attachment to them - what the sages call "phala-sakti" (attachment to fruits). Your mind has become entangled with a future that hasn't yet unfolded. While this is profoundly human, it is also the root of your unease. When we bind our peace to things we cannot control, we create our own suffering.

The timeless teaching of Karma Yoga offers profound liberation: "Karmanye vadhikaraste, ma phaleshu kadachana" - You have the right to your actions alone, never to their fruits. This is not passive resignation, but active surrender. Imagine an archer who draws the bow with complete focus, aims with full presence, and releases with perfect technique. Once released, the arrow's path is no longer the archer's to control. Your dharma is in the action itself - the effort, the intention, the presence - not in where the arrow lands.

Ancient wisdom also reveals: You are not your anxiety - you are the awareness watching it. This is "sakshi bhava" - witness consciousness. Notice: "I am having thoughts about this outcome." Feel the space between "I" and "these thoughts." In that space lives your true nature - peaceful, complete, unshaken. This witness has watched countless worries arise and dissolve. It remains untouched.

Here is your sacred practice for this moment: Before taking any action related to "{input_short}", pause. Place your hand on your heart. Take three slow breaths - each one releasing attachment. Then say to yourself: "I offer my best effort as sacred service. The outcome belongs to the universe." Now act with complete presence, as if this action is the only action that matters. After, release. "It is done. I am free."

Carry this eternal truth: You are already complete, exactly as you are, regardless of any outcome. No result can add to you. No result can diminish you. You are the infinite sky; outcomes are merely clouds passing through - light ones, dark ones, storm clouds. They pass. The sky remains. You have always been the sky. 💙"""

            sections = {
                "honoring_pain": f"Dear friend, I bow to the courage it takes to name your fear. This worry about \"{input_short}\" - I truly see it, and I feel the weight you're carrying. Your anxiety isn't weakness; it reveals how deeply you care about this outcome. Every seeker who ever lived has stood where you stand now. You are not alone in this struggle.",
                "understanding_attachment": f"Ancient wisdom names this pattern: \"phala-sakti\" - the binding force of attachment to outcomes. Your peace has become conditional: \"I can only be okay IF {input_short} turns out well.\" This creates suffering not once but many times - in fearful anticipation, in obsessive planning, in the waiting, even after the outcome arrives. The liberating insight: The outcome itself has never caused your suffering - only the attachment to it. Like gripping water, the tighter we hold, the faster it escapes. Open hands receive everything.",
                "karma_yoga_liberation": "The timeless teaching of Karma Yoga offers profound liberation: \"Karmanye vadhikaraste, ma phaleshu kadachana\" - You have the right to your actions alone, never to their fruits. This is \"nishkama karma\" - desireless action. NOT indifference (you still care deeply), NOT passivity (you still act with full commitment), BUT freedom from the tyranny of results. The archer who releases attachment to the target enters a flow state where aim becomes perfect. Attachment creates trembling; surrender creates steadiness.",
                "witness_consciousness": "Ancient wisdom reveals: You are not your anxiety - you are the awareness watching it. This is \"sakshi bhava\" - witness consciousness. Practice: \"I notice I am having thoughts about this outcome.\" Feel the space between \"I\" and \"these thoughts.\" In that gap lives your true nature - vast, peaceful, untouched. You are the \"drashtri\" - the Seer, the unchanging witness. Like a mountain unmoved by weather, your awareness remains steady while thoughts and worries pass like clouds.",
                "practical_wisdom": f"Here is your sacred practice for this moment: Before taking any action related to \"{input_short}\", pause. Place your hand on your heart. Take three deep breaths - each one releasing attachment. Then say: \"I offer my best effort as sacred service. The outcome belongs to the universe.\" Act with complete presence, as if this action is the only one that matters. After, release: \"It is done. I am free.\" This is \"ishvara pranidhana\" - surrender to the higher.",
                "eternal_anchor": "Carry this eternal truth: You are already complete, exactly as you are, regardless of any outcome. Your worth was never meant to be measured by results - it is your birthright. \"Yogastha kuru karmani\" - Established in your true self, perform action. You are the infinite sky; outcomes are merely clouds - light ones, dark ones, storm clouds. They pass. The sky remains. You have always been the sky. You will always be the sky.",
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
