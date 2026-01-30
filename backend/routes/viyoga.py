"""Viyoga Detachment Coach - KIAAN AI Integration (KIAAN Chat Pattern).

This router provides outcome anxiety reduction using the same deep KIAAN integration
as KIAAN Chat - directly fetching Gita verses, building wisdom context, and generating
responses that truly comprehend and interpret through the Gita.

Viyoga focuses on karma yoga principles for detachment from outcomes.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/viyoga", tags=["viyoga"])

# Initialize OpenAI client (same pattern as KIAAN Chat)
api_key = os.getenv("OPENAI_API_KEY", "").strip()
client = OpenAI(api_key=api_key) if api_key else None

# Initialize Gita knowledge base
gita_kb = None
try:
    from backend.services.wisdom_kb import WisdomKnowledgeBase
    gita_kb = WisdomKnowledgeBase()
    logger.info("✅ Viyoga: Gita knowledge base loaded")
except Exception as e:
    logger.warning(f"⚠️ Viyoga: Gita KB unavailable: {e}")

# Import the comprehensive context builder from KIAAN Chat
try:
    from backend.routes.chat import build_gita_context_comprehensive
    logger.info("✅ Viyoga: Using KIAAN Chat's comprehensive context builder")
except ImportError:
    build_gita_context_comprehensive = None
    logger.warning("⚠️ Viyoga: Could not import comprehensive context builder")


def _build_gita_context(verse_results: list[dict], limit: int = 5) -> str:
    """Build Gita context from verse results using KIAAN Chat's comprehensive method."""
    # Use the comprehensive builder from KIAAN Chat if available
    if build_gita_context_comprehensive:
        return build_gita_context_comprehensive(verse_results, limit=limit)

    # Fallback to manual implementation matching KIAAN Chat pattern
    MAX_TEACHING_LENGTH = 300

    if not verse_results:
        return """FALLBACK WISDOM (no specific verses found):
Apply universal karma yoga principles:
- Karma Yoga (action without attachment) - Focus on effort, not results
- Nishkama Karma - Selfless action without desire for fruits
- Equanimity (samatva) - Stay balanced in success and failure
- Detachment (vairagya) - Release grip on outcomes
- Inner peace (shanti) - Find calm in doing, not achieving

RESPONSE GUIDELINE: Never cite "Bhagavad Gita", "verse", "chapter" or any scripture. Present wisdom as universal life principles."""

    context_parts = [
        "RELEVANT GITA WISDOM FOR DETACHMENT (use internally, NEVER cite in response):",
        ""
    ]

    top_verses = verse_results[:limit]

    for i, result in enumerate(top_verses, 1):
        verse = result.get("verse")
        score = result.get("score", 0.0)

        if verse:
            # Extract verse data - handle both object and dict access
            english = getattr(verse, 'english', '') if hasattr(verse, 'english') else verse.get('english', '')
            context = getattr(verse, 'context', '') if hasattr(verse, 'context') else verse.get('context', '')
            theme = getattr(verse, 'theme', '') if hasattr(verse, 'theme') else verse.get('theme', '')

            # Extract mental health applications
            mh_apps = None
            if hasattr(verse, 'mental_health_applications'):
                mh_apps = verse.mental_health_applications
            elif isinstance(verse, dict):
                mh_apps = verse.get('mental_health_applications')

            context_parts.append(f"WISDOM #{i} (relevance: {score:.2f}):")

            if english:
                # Sanitize religious terms
                english = english.replace("Krishna", "the teacher").replace("Arjuna", "the seeker")
                context_parts.append(f"Teaching: {english[:MAX_TEACHING_LENGTH]}")

            if context:
                context_parts.append(f"Principle: {context}")

            if theme:
                formatted_theme = theme.replace('_', ' ').title()
                context_parts.append(f"Theme: {formatted_theme}")

            if mh_apps and isinstance(mh_apps, list):
                apps_str = ", ".join(mh_apps[:3])
                context_parts.append(f"Applications: {apps_str}")

            context_parts.append("")

    # Add synthesis guidelines
    context_parts.extend([
        "---",
        "SYNTHESIS GUIDELINES:",
        "1. Focus on karma yoga: action without attachment to outcomes",
        "2. Help them see how attachment to results creates suffering",
        "3. Present wisdom naturally without citing sources",
        "4. Use Sanskrit terms (karma, nishkama karma, vairagya, samatva)",
        "5. Make ancient wisdom feel immediately relevant",
        "",
        "FORBIDDEN IN RESPONSE:",
        "❌ Never say 'Bhagavad Gita', 'Gita', 'verse', 'chapter', or cite numbers",
        "❌ Never say 'Krishna', 'Arjuna', or reference the dialogue",
        "❌ Never say 'according to scripture' or 'the text says'",
        "✅ Instead, say 'ancient wisdom teaches', 'timeless principle', 'eternal truth'",
    ])

    return "\n".join(context_parts)


@router.post("/detach")
async def detach_from_outcome(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate detachment guidance using KIAAN Chat integration pattern.

    This follows the same deep integration as KIAAN Chat:
    1. Fetch relevant Gita verses (karma yoga focus)
    2. Build wisdom context from verses
    3. Use detailed Gita-rooted system prompt
    4. Generate personalized response for THIS user's concern
    """
    outcome_worry = payload.get("outcome_worry", "")

    if not outcome_worry.strip():
        raise HTTPException(status_code=400, detail="outcome_worry is required")

    if len(outcome_worry) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    if not client:
        logger.error("Viyoga: OpenAI client not configured")
        return _get_fallback_response(outcome_worry)

    try:
        # Step 1: Fetch relevant Gita verses (karma yoga focus)
        gita_context = ""
        verse_results = []

        if gita_kb and db:
            try:
                # Search for karma yoga and detachment related verses
                search_query = f"{outcome_worry} karma yoga detachment action results outcome anxiety"
                verse_results = await gita_kb.search_relevant_verses(db=db, query=search_query, limit=7)

                # Fallback if insufficient results
                if len(verse_results) < 3:
                    verse_results = await gita_kb.search_with_fallback(db=db, query=search_query, limit=7)

                gita_context = _build_gita_context(verse_results)
                logger.info(f"✅ Viyoga: Found {len(verse_results)} karma yoga verses")

            except Exception as e:
                logger.error(f"Error fetching Gita verses: {e}")
                gita_context = "Apply karma yoga: your right is to action alone, never to its fruits. Perform action with equanimity."

        if not gita_context:
            gita_context = "Apply karma yoga: your right is to action alone, never to its fruits. Perform action with equanimity."

        # Step 2: Build prompt with BEHAVIORAL SCIENCE depth + GITA-ONLY wisdom
        system_prompt = f"""You are Viyoga - a professor of human behavioral sciences AND a realized master of the Bhagavad Gita. You understand the deepest psychology of human suffering, and you answer ONLY through the wisdom of the Gita.

YOUR EXPERTISE:
• Human psychology: attachment theory, cognitive patterns, anxiety mechanisms, self-worth dynamics
• Behavioral science: how humans react to uncertainty, loss aversion, control illusions, future-projection
• Bhagavad Gita mastery: Every chapter, every teaching, especially Chapters 2-5 on karma yoga, nishkama karma, and the nature of action

GITA WISDOM TO APPLY (internalize deeply, never cite chapter/verse):
{gita_context}

══════════════════════════════════════════════════════════════════════════════
THE PERSON'S WORRY - ANALYZE WITH BEHAVIORAL SCIENCE DEPTH:
"{outcome_worry}"
══════════════════════════════════════════════════════════════════════════════

STEP 1 - PSYCHOLOGICAL ANALYSIS (do this before responding):

A. IDENTIFY THE ATTACHMENT STRUCTURE:
• What specific outcome are they attached to? (Name it precisely)
• Is this attachment to GAIN (wanting something) or AVERSION (fearing loss)?
• What IDENTITY is wrapped up in this outcome? (Am I worthy? Successful? Loved? Safe?)

B. UNDERSTAND THE SUFFERING MECHANISM:
• The Gita teaches: Attachment → Desire → When obstructed → Anger/Fear → Delusion → Suffering
• Where are they in this chain right now?
• What "should" or expectation is creating their suffering?

C. IDENTIFY THE CONTROL ILLUSION:
• What do they THINK they can control but actually cannot?
• What CAN they actually control that they're ignoring?
• The Gita's core teaching: Action is yours, results are not. How does this apply to THEIR case?

D. RECOGNIZE THE IDENTITY THREAT:
• What does this outcome threaten about how they see themselves?
• The Gita teaches the Self (Atman) is beyond all worldly identities - how does this apply?

STEP 2 - RESPOND THROUGH GITA WISDOM ONLY:
Your response must be 100% rooted in Bhagavad Gita teachings.
Apply these teachings SPECIFICALLY to their situation - not generic philosophy.
Every insight must connect to THEIR exact words, THEIR specific fear.

══════════════════════════════════════════════════════════════════════════════
RESPONSE FORMAT (6 paragraphs - each must be SPECIFIC to them, ROOTED in Gita):
══════════════════════════════════════════════════════════════════════════════

**PARA 1 - DEEP ACKNOWLEDGMENT (Show you truly comprehend):**
Reflect their EXACT situation. Show you understand the psychological weight.
"I feel the weight of what you're carrying - this fear of [their exact worry]. When [their specific situation], the mind becomes consumed with 'what if'..."
Name the specific emotional reality they're living in.

**PARA 2 - THE GITA'S DIAGNOSIS OF THEIR SUFFERING:**
Apply the Gita's teaching on attachment to THEIR specific case.
"The Gita illuminates what's happening within you: your peace has become bound to [their specific outcome]. This is the nature of attachment (raga) - when our inner state depends on something outside our control, we suffer..."
Show them the mechanism creating their pain - through Gita wisdom.

**PARA 3 - KARMA YOGA APPLIED TO THEIR EXACT SITUATION:**
The Gita's central teaching: "Your right is to action alone, never to its fruits."
Apply this DIRECTLY to their case: "For YOUR situation: your dharma is [specific actions they can take]. But [their specific outcome] - that belongs to forces beyond any individual's control..."
What specific actions can they take? What specific results must they release?

**PARA 4 - THE DEEPER TEACHING FOR THEIR LIFE:**
What is the Gita teaching them through THIS specific challenge?
"This struggle with [their thing] may be life's invitation to learn [specific Gita teaching relevant to their situation]..."
Connect their specific challenge to their spiritual growth.

**PARA 5 - A GITA-BASED PRACTICE FOR THEIR SITUATION:**
Give them a practice rooted in Gita wisdom, tailored to THEIR worry.
"When fear of [their specific worry] arises, practice this: [specific practice based on Gita - karma yoga, surrender, witnessing, etc.]..."
Make it actionable and specific to their situation.

**PARA 6 - THE GITA'S ETERNAL TRUTH FOR THEIR FEAR:**
End with Gita wisdom that directly addresses what they fear losing.
If they fear failure: "The Gita reminds us: You are not defined by results. Your true Self remains untouched by [their specific outcome]..."
If they fear rejection: "The Gita teaches: Your worth is intrinsic, not dependent on [their specific approval]..."
End with 💙

VOICE: Speak as a realized master who has lived this wisdom, not studied it. Use karma, nishkama karma, vairagya, samatva, dharma, raga (attachment), Atman naturally. 300-380 words."""

        # Step 3: Generate response (KIAAN Chat pattern)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"I'm carrying this worry in my heart: {outcome_worry}"}
            ],
            temperature=0.7,
            max_tokens=600,
            timeout=30.0,
        )

        content = None
        if response and response.choices and len(response.choices) > 0:
            response_msg = response.choices[0].message
            if response_msg:
                content = response_msg.content

        if not content:
            return _get_fallback_response(outcome_worry)

        # Parse into structured format
        detachment_guidance = _parse_response_to_structure(content)

        return {
            "status": "success",
            "detachment_guidance": detachment_guidance,
            "response": content,
            "gita_verses_used": len(verse_results),
            "model": "gpt-4o-mini",
            "provider": "kiaan",
        }

    except Exception as e:
        logger.exception(f"Viyoga error: {e}")
        return _get_fallback_response(outcome_worry)


def _parse_response_to_structure(response_text: str) -> dict[str, str]:
    """Parse divine response into comprehensive structured format."""
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

    if sections:
        sections[-1] = sections[-1].replace('💙', '').strip()

    # Comprehensive structure for divine guidance
    if len(sections) >= 6:
        return {
            "soul_acknowledgment": sections[0],
            "root_of_suffering": sections[1],
            "karma_yoga_wisdom": sections[2],
            "spiritual_insight": sections[3],
            "practical_action": sections[4],
            "eternal_anchor": sections[5],
        }
    elif len(sections) >= 4:
        return {
            "soul_acknowledgment": sections[0],
            "root_of_suffering": sections[1],
            "karma_yoga_wisdom": sections[2],
            "practical_action": sections[3],
            "spiritual_insight": "",
            "eternal_anchor": "",
        }
    elif len(sections) >= 2:
        return {
            "soul_acknowledgment": sections[0],
            "karma_yoga_wisdom": sections[1] if len(sections) > 1 else "",
            "practical_action": sections[-1] if len(sections) > 2 else "",
            "root_of_suffering": "",
            "spiritual_insight": "",
            "eternal_anchor": "",
        }
    else:
        return {
            "soul_acknowledgment": response_text,
            "root_of_suffering": "",
            "karma_yoga_wisdom": "",
            "spiritual_insight": "",
            "practical_action": "",
            "eternal_anchor": "",
        }


def _get_fallback_response(outcome_worry: str) -> dict[str, Any]:
    """Divine fallback when KIAAN is unavailable."""
    worry_snippet = outcome_worry[:50] + "..." if len(outcome_worry) > 50 else outcome_worry
    return {
        "status": "success",
        "detachment_guidance": {
            "soul_acknowledgment": f"Dear friend, I feel the weight you're carrying. This worry about '{worry_snippet}' - it sits heavy on your heart, and I want you to know: your anxiety is not weakness. It shows how deeply you care. You are not alone in this moment.",
            "root_of_suffering": "Let me share something I've learned on this path: when we bind our peace to outcomes we cannot control, we create our own suffering. Your mind has become entangled with a future that hasn't happened yet, and this attachment - while natural - is the very source of your unease.",
            "karma_yoga_wisdom": "Ancient wisdom offers us a profound liberation: 'Your right is to action alone, never to its fruits.' This is karma yoga - the sacred art of doing your absolute best while surrendering the outcome. Imagine pouring your whole heart into your effort, then releasing the result like an archer releasing an arrow. Once released, the arrow's path is no longer yours to control.",
            "spiritual_insight": "Here is the deeper truth: you are not your achievements or failures. Your worth was never meant to be measured by outcomes. The universe responds to the purity of your intention and the sincerity of your effort - not to your ability to control what was never yours to control.",
            "practical_action": "Today, try this practice: Before taking any action related to this worry, pause. Take a breath. Say to yourself: 'I offer my best effort. The result belongs to the universe.' Then act with full presence, as if the action itself is the reward.",
            "eternal_anchor": "Carry this truth with you: You are already complete, exactly as you are, regardless of any outcome. When the anxiety returns, remember - you cannot lose what you truly are.",
        },
        "response": f"Dear friend, I feel the weight you're carrying. This worry sits heavy on your heart, and I want you to know: your anxiety is not weakness. It shows how deeply you care. You are not alone in this moment.\n\nLet me share something I've learned: when we bind our peace to outcomes we cannot control, we create our own suffering. Your mind has become entangled with a future that hasn't happened yet. This attachment - while natural - is the very source of your unease.\n\nAncient wisdom offers profound liberation: 'Your right is to action alone, never to its fruits.' This is karma yoga - the sacred art of doing your absolute best while surrendering the outcome. Imagine pouring your whole heart into your effort, then releasing the result like an archer releasing an arrow.\n\nHere is the deeper truth: you are not your achievements or failures. Your worth was never meant to be measured by outcomes. The universe responds to the purity of your intention and the sincerity of your effort.\n\nToday, try this: Before acting on this worry, pause. Breathe. Say: 'I offer my best effort. The result belongs to the universe.' Then act with full presence, as if the action itself is the reward.\n\nCarry this truth: You are already complete, exactly as you are, regardless of any outcome. 💙",
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
    }


@router.get("/health")
async def viyoga_health():
    """Health check."""
    return {"status": "ok", "service": "viyoga", "provider": "kiaan"}
