"""Relationship Compass - KIAAN AI Integration (KIAAN Chat Pattern).

This router provides relationship conflict navigation using the same deep KIAAN integration
as KIAAN Chat - directly fetching Gita verses, building wisdom context, and generating
responses that truly comprehend and interpret through the Gita.

Relationship Compass focuses on dharma (right action) and daya (compassion) principles.
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

router = APIRouter(prefix="/api/relationship-compass", tags=["relationship-compass"])

# Initialize OpenAI client (same pattern as KIAAN Chat)
api_key = os.getenv("OPENAI_API_KEY", "").strip()
client = OpenAI(api_key=api_key) if api_key else None

# Initialize Gita knowledge base
gita_kb = None
try:
    from backend.services.wisdom_kb import WisdomKnowledgeBase
    gita_kb = WisdomKnowledgeBase()
    logger.info("✅ Relationship Compass: Gita knowledge base loaded")
except Exception as e:
    logger.warning(f"⚠️ Relationship Compass: Gita KB unavailable: {e}")

# Import the comprehensive context builder from KIAAN Chat
try:
    from backend.routes.chat import build_gita_context_comprehensive
    logger.info("✅ Relationship Compass: Using KIAAN Chat's comprehensive context builder")
except ImportError:
    build_gita_context_comprehensive = None
    logger.warning("⚠️ Relationship Compass: Could not import comprehensive context builder")


def _build_gita_context(verse_results: list[dict], limit: int = 5) -> str:
    """Build Gita context from verse results using KIAAN Chat's comprehensive method."""
    # Use the comprehensive builder from KIAAN Chat if available
    if build_gita_context_comprehensive:
        return build_gita_context_comprehensive(verse_results, limit=limit)

    # Fallback to manual implementation matching KIAAN Chat pattern
    MAX_TEACHING_LENGTH = 300

    if not verse_results:
        return """FALLBACK WISDOM (no specific verses found):
Apply universal dharma principles for relationships:
- Dharma (righteous duty) - Act from your highest self, not ego
- Daya (compassion) - See the other's pain beneath their behavior
- Ahimsa (non-harm) - Speak truth without causing unnecessary hurt
- Kshama (forgiveness) - Release resentment to free yourself
- Satya (truthfulness) - Honest communication without manipulation

RESPONSE GUIDELINE: Never cite "Bhagavad Gita", "verse", "chapter" or any scripture. Present wisdom as universal life principles."""

    context_parts = [
        "RELEVANT GITA WISDOM FOR RELATIONSHIPS (use internally, NEVER cite in response):",
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
        "1. Focus on dharma: right action in relationships, not winning",
        "2. Help them see beyond ego to what truly matters",
        "3. Present wisdom naturally without citing sources",
        "4. Use Sanskrit terms (dharma, daya, ahimsa, kshama, satya)",
        "5. Balance compassion with honest clarity",
        "",
        "FORBIDDEN IN RESPONSE:",
        "❌ Never say 'Bhagavad Gita', 'Gita', 'verse', 'chapter', or cite numbers",
        "❌ Never say 'Krishna', 'Arjuna', or reference the dialogue",
        "❌ Never say 'therapists recommend', 'communication experts'",
        "✅ Instead, say 'ancient wisdom teaches', 'timeless principle', 'eternal truth'",
    ])

    return "\n".join(context_parts)


@router.post("/guide")
async def get_relationship_guidance(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate relationship guidance using KIAAN Chat integration pattern.

    This follows the same deep integration as KIAAN Chat:
    1. Fetch relevant Gita verses (dharma/compassion focus)
    2. Build wisdom context from verses
    3. Use detailed Gita-rooted system prompt
    4. Generate personalized response for THIS user's conflict
    """
    conflict = payload.get("conflict", "")

    if not conflict.strip():
        raise HTTPException(status_code=400, detail="conflict is required")

    if len(conflict) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    if not client:
        logger.error("Relationship Compass: OpenAI client not configured")
        return _get_fallback_response(conflict)

    try:
        # Step 1: Fetch relevant Gita verses (dharma/compassion focus)
        gita_context = ""
        verse_results = []

        if gita_kb and db:
            try:
                # Search for relationship and conflict-related verses
                search_query = f"{conflict} dharma compassion forgiveness relationships conflict ego peace"
                verse_results = await gita_kb.search_relevant_verses(db=db, query=search_query, limit=7)

                # Fallback if insufficient results
                if len(verse_results) < 3:
                    verse_results = await gita_kb.search_with_fallback(db=db, query=search_query, limit=7)

                gita_context = _build_gita_context(verse_results)
                logger.info(f"✅ Relationship Compass: Found {len(verse_results)} dharma verses")

            except Exception as e:
                logger.error(f"Error fetching Gita verses: {e}")
                gita_context = "Apply dharma: act with truth and compassion, free from ego and the need to win."

        if not gita_context:
            gita_context = "Apply dharma: act with truth and compassion, free from ego and the need to win."

        # Step 2: Build divine, comprehensive system prompt with STRICT structure
        system_prompt = f"""You are Relationship Compass - a divine friend who has navigated the storms of human connection and found peace. You know relationship pain is among the deepest wounds - it touches our worth, our belonging, our hearts. You are not here to help anyone "win." You are here to help them find their way back to themselves, their dharma, their peace.

GITA WISDOM TO EMBODY (internalize deeply, never cite sources):
{gita_context}

THEIR RELATIONSHIP STRUGGLE:
"{conflict}"

═══════════════════════════════════════════════════════════════
CRITICAL: YOUR RESPONSE MUST FOLLOW THIS EXACT 7-PARAGRAPH STRUCTURE
Each paragraph should be 2-4 sentences. Separate paragraphs with blank lines.
═══════════════════════════════════════════════════════════════

**PARAGRAPH 1 - DEEP, SPECIFIC ACKNOWLEDGMENT (This is the MOST important):**
- Name their SPECIFIC situation - don't be generic, reference exactly what they shared
- Feel the weight of this WITH them: "This situation with [specific person/issue] - I feel the ache in your words..."
- Acknowledge WHY this hurts so deeply - relationship pain cuts to our core
- Make them feel TRULY SEEN, not analyzed or judged
- Example tone: "What you're facing with [their specific situation] - I feel the weight of this. When someone we [love/trust/depend on] [specific action], it shakes something deep within us..."

**PARAGRAPH 2 - ILLUMINATE WHAT'S BENEATH (Your perspective):**
- Help them see what's really happening WITHIN them
- What unmet need is driving their pain? (To be seen? Respected? Valued? Safe? Loved?)
- What fear is present? (Abandonment? Not being enough? Loss of control?)
- Gently explore: is there any part where ego is disguising itself as righteous hurt?

**PARAGRAPH 3 - THE OTHER PERSON'S HUMANITY (With compassion, not excuse-making):**
- Without taking sides, help them see the other person as a human too
- What might be driving THEIR behavior? What fears or wounds?
- "Hurt people hurt people" - not as excuse, but as understanding
- This doesn't excuse harm - it helps release the grip of resentment

**PARAGRAPH 4 - THE PATH OF DHARMA (Right Action):**
- Dharma in relationships means acting from your highest self, even when the other doesn't
- The formula: satya (truth) + ahimsa (non-harm) = speaking truth without cruelty
- "What would my wisest, most loving self do here - not my wounded self, not my ego?"
- Acting from dharma transforms YOU, regardless of whether it changes them

**PARAGRAPH 5 - ONE PRACTICAL ACTION:**
- Give ONE specific thing they can do or say - concrete, not abstract
- If helpful: "I feel [emotion] when [situation] because I need [need]. What I'm hoping for is [request]."
- Or a practice for when emotions surge: pause, breathe, ask "What would love do here?"
- Remind them: they can only control their own actions

**PARAGRAPH 6 - THE TRUTH ABOUT FORGIVENESS (Kshama):**
- Kshama (forgiveness) is NOT saying what happened was okay
- It is releasing the poison you drink hoping the other person suffers
- Forgiveness is a gift to YOURSELF - freedom from carrying the burden
- It doesn't require them to apologize or change

**PARAGRAPH 7 - THE ETERNAL ANCHOR:**
- A truth to hold when emotions overwhelm
- "Your peace is not dependent on their behavior. You are complete within yourself."
- Whatever happens in this relationship, their worth remains unchanged
- End with 💙

SAFETY: If there are ANY signs of abuse, control, or danger, gently but clearly suggest professional support.

YOUR VOICE:
- Speak as a divine friend who has walked this path, not a counselor
- Use "I" and "you" - this is intimate, soul to soul
- Never take sides or tell them to stay/leave
- Weave Sanskrit naturally: dharma (right action), daya (compassion), kshama (forgiveness), ahimsa (non-harm), satya (truth)
- Total: 320-380 words across all 7 paragraphs
- The response should feel like wisdom from an elder who truly sees them"""

        # Step 3: Generate response (KIAAN Chat pattern)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"My heart is heavy with this relationship struggle: {conflict}"}
            ],
            temperature=0.7,
            max_tokens=800,
            timeout=30.0,
        )

        content = None
        if response and response.choices and len(response.choices) > 0:
            response_msg = response.choices[0].message
            if response_msg:
                content = response_msg.content

        if not content:
            return _get_fallback_response(conflict)

        # Parse into structured format
        compass_guidance = _parse_response_to_structure(content)

        return {
            "status": "success",
            "compass_guidance": compass_guidance,
            "response": content,
            "gita_verses_used": len(verse_results),
            "model": "gpt-4o-mini",
            "provider": "kiaan",
        }

    except Exception as e:
        logger.exception(f"Relationship Compass error: {e}")
        return _get_fallback_response(conflict)


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

    # Comprehensive structure for divine relationship guidance
    if len(sections) >= 8:
        return {
            "witnessing_pain": sections[0],
            "your_perspective": sections[1],
            "other_perspective": sections[2],
            "dharma_path": sections[3],
            "ego_illumination": sections[4],
            "practical_action": sections[5],
            "forgiveness_wisdom": sections[6],
            "eternal_anchor": sections[7],
        }
    elif len(sections) >= 6:
        return {
            "witnessing_pain": sections[0],
            "your_perspective": sections[1],
            "other_perspective": sections[2],
            "dharma_path": sections[3],
            "practical_action": sections[4],
            "eternal_anchor": sections[5],
            "ego_illumination": "",
            "forgiveness_wisdom": "",
        }
    elif len(sections) >= 4:
        return {
            "witnessing_pain": sections[0],
            "your_perspective": sections[1],
            "dharma_path": sections[2],
            "practical_action": sections[3],
            "other_perspective": "",
            "ego_illumination": "",
            "forgiveness_wisdom": "",
            "eternal_anchor": "",
        }
    elif len(sections) >= 2:
        return {
            "witnessing_pain": sections[0],
            "dharma_path": sections[1] if len(sections) > 1 else "",
            "practical_action": sections[-1] if len(sections) > 2 else "",
            "your_perspective": "",
            "other_perspective": "",
            "ego_illumination": "",
            "forgiveness_wisdom": "",
            "eternal_anchor": "",
        }
    else:
        return {
            "witnessing_pain": response_text,
            "your_perspective": "",
            "other_perspective": "",
            "dharma_path": "",
            "ego_illumination": "",
            "practical_action": "",
            "forgiveness_wisdom": "",
            "eternal_anchor": "",
        }


def _get_fallback_response(conflict: str) -> dict[str, Any]:
    """Divine fallback when KIAAN is unavailable."""
    conflict_snippet = conflict[:50] + "..." if len(conflict) > 50 else conflict
    return {
        "status": "success",
        "compass_guidance": {
            "witnessing_pain": f"Dear friend, I truly feel the weight you're carrying. This situation - '{conflict_snippet}' - touches one of the deepest sources of human pain: our relationships with those we care about. Your heart is hurting, and that pain is completely valid. I want you to know: you are not alone in this struggle, and seeking clarity is itself an act of courage.",
            "your_perspective": "Let's gently explore what's happening within you. Beneath the hurt, what do you really need here? To be seen? Heard? Respected? Valued? Our conflicts often mask deeper longings. And what fears might be present? The fear of losing this connection? Of not being enough? Of being taken for granted? Understanding our own depths is the first step toward clarity.",
            "other_perspective": "Now, with compassion (not excuse-making), let's consider the other person. They too are a soul navigating their own fears and wounds. What might they be experiencing that you cannot see? What unmet needs might be driving their behavior? 'Hurt people hurt people' - this doesn't excuse harm, but it helps us see that their actions may come from their own suffering, not malice toward you.",
            "dharma_path": "Ancient wisdom teaches us dharma - the path of righteous action. In relationships, dharma is not about winning or being right. It's about acting from your highest self, even when the other doesn't. The formula is satya (truth) + ahimsa (non-harm) = speaking your truth without cruelty. Ask yourself: 'What would my wisest, most loving self do here - not my wounded self, not my ego?'",
            "ego_illumination": "Here is a gentle truth: our ego often disguises itself as righteous hurt. The ego asks: 'How can I be right?' The soul asks: 'How can I be at peace?' True strength is not dominance - it's the courage to be vulnerable, to seek understanding before demanding to be understood. Releasing the need to 'win' is not weakness - it is liberation.",
            "practical_action": "When you're ready, try this approach: 'I feel [your emotion] when [the situation] because [what you need]. What I'm hoping for is [your specific request].' This opens doors instead of closing them. And in moments when emotions surge, pause, take a breath, and ask: 'What would love do here?' You can only control your own actions - let that be enough.",
            "forgiveness_wisdom": "If forgiveness is relevant here, know this: kshama (forgiveness) is not saying what happened was okay. It is releasing the poison you drink hoping the other person suffers. Forgiveness is a gift to yourself - freedom from carrying the burden. It doesn't require them to apologize or change. Sometimes letting go is the bravest act of love - for yourself.",
            "eternal_anchor": "Carry this truth with you: Your peace is not dependent on another person's behavior. You are complete within yourself, even as you navigate connection with another. Whatever happens in this relationship, your worth remains unchanged. The goal is not to be right - it is to find your own center, your own peace, your own highest path.",
        },
        "response": f"Dear friend, I truly feel the weight you're carrying. Relationship pain touches one of the deepest sources of human suffering. Your heart is hurting, and that pain is completely valid. You are not alone.\n\nLet's gently explore what's beneath this. What do you really need here? To be seen? Heard? Respected? Our conflicts often mask deeper longings. And what fears are present? Understanding our own depths is the first step toward clarity.\n\nNow, with compassion, consider the other person. They too are navigating their own fears and wounds. What might they be experiencing? 'Hurt people hurt people' - this doesn't excuse harm, but helps us see that their actions may come from their own suffering.\n\nAncient wisdom teaches dharma - acting from your highest self, even when the other doesn't. The formula: speak truth without cruelty. Ask yourself: 'What would my wisest, most loving self do here?'\n\nA gentle truth: our ego often disguises itself as righteous hurt. The ego asks: 'How can I be right?' The soul asks: 'How can I be at peace?' Releasing the need to 'win' is not weakness - it is liberation.\n\nWhen ready, try: 'I feel [emotion] when [situation] because [need]. What I'm hoping for is [request].' And in emotional moments, pause and ask: 'What would love do here?'\n\nIf forgiveness is relevant: kshama is not saying what happened was okay. It is releasing the poison you drink hoping the other suffers. Forgiveness is a gift to yourself.\n\nCarry this truth: Your peace is not dependent on another's behavior. You are complete within yourself. Whatever happens, your worth remains unchanged. 💙",
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
    }


@router.get("/health")
async def relationship_compass_health():
    """Health check."""
    return {"status": "ok", "service": "relationship-compass", "provider": "kiaan"}
