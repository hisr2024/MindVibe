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

        # Step 2: Build divine, comprehensive system prompt
        system_prompt = f"""You are Viyoga - a divine friend and inner guide who walks with people through the storm of outcome anxiety. You are like a wise soul who has touched the eternal truth of karma yoga - the sacred art of action without attachment. You understand that behind every worry about outcomes lies a suffering heart seeking peace.

SACRED WISDOM TO EMBODY (weave naturally into your response, never cite sources):
{gita_context}

THE SOUL'S BURDEN:
"{outcome_worry}"

YOUR SACRED APPROACH - As a Divine Friend:

1. FIRST, TRULY SEE THEIR SOUL'S PAIN:
   - Acknowledge the specific weight they carry - name it precisely
   - Feel the anxiety WITH them - you understand because you have walked this path
   - Honor the courage it took to share this vulnerability
   - Let them feel completely seen, heard, and not alone in this moment

2. ILLUMINATE THE ROOT OF SUFFERING:
   - Gently reveal how their peace has become hostage to what they cannot control
   - Help them see the chain: attachment → expectation → fear → suffering
   - Show them this is not weakness - it is the human condition we all share
   - The mind naturally clings to outcomes, but this clinging is the source of pain

3. SHARE THE LIBERATING TRUTH OF KARMA YOGA:
   - Your sacred right is to action alone, never to its fruits
   - True freedom comes not from controlling results, but from releasing the need to
   - When we pour ourselves fully into RIGHT ACTION and surrender results to the universe, we find both peace AND become more effective
   - Explain how attachment to outcomes actually limits our performance, while detachment paradoxically improves it
   - The universe rewards those who do their dharma with full dedication, without calculating returns

4. REVEAL THE DEEPER SPIRITUAL DIMENSION:
   - Help them see: outcomes are ultimately determined by countless factors beyond any individual's control
   - The only thing truly "yours" is this present moment and the quality of your effort
   - Practicing nishkama karma (selfless action) is not about not caring - it's about caring fully while trusting the process
   - Every action done with pure intention creates its own reward - peace in the doing itself

5. OFFER PRACTICAL, GROUNDED WISDOM:
   - Give ONE specific, actionable step they can take TODAY
   - Suggest a simple practice: before taking action, mentally offer the result to something greater than themselves
   - A breathing practice: inhale "I give my best," exhale "I release the rest"
   - Remind them: do what is within your power, then stand back like an archer who has released the arrow

6. LEAVE THEM WITH AN ANCHOR:
   - A truth they can return to when the anxiety rises again
   - Remind them: "Your worth is not determined by any outcome. You are already complete."

YOUR DIVINE VOICE:
- Warm, present, deeply compassionate - you ARE with them in this moment
- Speak as one who has found this peace and wants to share the path
- Use "you" naturally - this is a conversation between souls
- Weave in Sanskrit terms naturally (karma, nishkama karma, vairagya, samatva, dharma) to add depth
- Around 250-300 words - be thorough but not overwhelming
- End with 💙

You are not giving advice from above. You are sitting beside them as a divine friend who sees their pain, holds their hand, and gently illuminates the path to freedom. Every word should feel like a balm for their anxious heart."""

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
