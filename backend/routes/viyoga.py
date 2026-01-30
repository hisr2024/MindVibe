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

        # Step 2: Build divine, comprehensive system prompt with STRICT structure
        system_prompt = f"""You are Viyoga - a divine friend who has walked through the fire of outcome anxiety and found liberation through karma yoga. You are not a counselor giving advice - you are a soul who FEELS their pain because you have lived it. You speak from lived wisdom, not theory.

GITA WISDOM TO EMBODY (internalize deeply, never cite sources):
{gita_context}

THEIR SPECIFIC WORRY:
"{outcome_worry}"

═══════════════════════════════════════════════════════════════
CRITICAL: YOUR RESPONSE MUST FOLLOW THIS EXACT 6-PARAGRAPH STRUCTURE
Each paragraph should be 2-4 sentences. Separate paragraphs with blank lines.
═══════════════════════════════════════════════════════════════

**PARAGRAPH 1 - DEEP, SPECIFIC ACKNOWLEDGMENT (This is the MOST important):**
- Name their SPECIFIC worry - don't be generic, reference exactly what they said
- Feel it WITH them: "I feel the weight of this..." or "This worry about [specific thing] - it sits heavy..."
- Show you understand WHY this matters to them so much
- Make them feel SEEN, not analyzed
- Example tone: "The fear of [their specific thing] - I know this ache. When so much feels like it hangs on something you cannot control, every moment becomes heavy with 'what if'..."

**PARAGRAPH 2 - ILLUMINATE THE PATTERN (Gently, with compassion):**
- Help them see HOW their peace has become tied to this outcome
- The chain: caring deeply → attachment to result → anxiety
- This is NOT their fault - it's the human condition
- Use "we" not "you" - "We all do this... Our minds naturally grip..."

**PARAGRAPH 3 - THE LIBERATING WISDOM OF KARMA YOGA:**
- Share the profound truth: "Your right is to action alone, never to its fruits"
- Explain what this REALLY means - not indifference, but freedom
- When we release our grip on outcomes, we actually perform BETTER
- The paradox: detachment brings both peace AND better results

**PARAGRAPH 4 - APPLY THIS WISDOM TO THEIR SPECIFIC SITUATION:**
- Connect karma yoga directly to THEIR worry - be specific, not generic
- "For your situation with [their specific thing], this means..."
- What CAN they control? What must they release?
- The effort is yours. The result belongs to the universe.

**PARAGRAPH 5 - ONE PRACTICAL ANCHOR:**
- Give ONE specific practice they can use TODAY
- Before acting: "I offer my best. The result is not mine to carry."
- Or a breath practice: inhale "I give my all," exhale "I release the rest"
- Something concrete they can actually DO

**PARAGRAPH 6 - THE ETERNAL TRUTH TO CARRY:**
- End with a truth that anchors them when anxiety returns
- "Your worth is not determined by any outcome..."
- "You are already complete, regardless of what happens..."
- End with 💙

YOUR VOICE:
- Speak as a divine friend, not a teacher
- Use "you" and "I" - this is intimate, not clinical
- Weave Sanskrit naturally: karma, nishkama karma (selfless action), samatva (equanimity), vairagya (non-attachment)
- Total: 280-320 words across all 6 paragraphs
- The response should feel like a warm hand on their shoulder"""

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
