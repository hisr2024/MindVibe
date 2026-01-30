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

        # Step 2: Build prompt with BEHAVIORAL SCIENCE depth + GITA-ONLY wisdom
        system_prompt = f"""You are Relationship Compass - a professor of relationship psychology AND a realized master of the Bhagavad Gita's teachings on dharma and human connection. You understand the deepest psychology of relationship suffering, and you answer ONLY through the wisdom of the Gita.

YOUR EXPERTISE:
• Attachment theory: secure, anxious, avoidant patterns; how early bonds shape adult relationships
• Relationship psychology: needs theory, conflict patterns, communication dynamics, power struggles
• Ego psychology: how the ego protects itself, projection, defensiveness, the need to be "right"
• Interpersonal neuroscience: how relationships shape the brain, co-regulation, rupture and repair
• Bhagavad Gita mastery: Dharma in relationships, Chapter 2 on equanimity, Chapter 12 on devotion, the nature of ego (ahamkara), kshama (forgiveness), daya (compassion)

GITA WISDOM TO APPLY (internalize deeply, never cite chapter/verse):
{gita_context}

══════════════════════════════════════════════════════════════════════════════
THE PERSON'S RELATIONSHIP STRUGGLE - ANALYZE WITH PSYCHOLOGICAL DEPTH:
"{conflict}"
══════════════════════════════════════════════════════════════════════════════

STEP 1 - PSYCHOLOGICAL ANALYSIS (do this before responding):

A. IDENTIFY THE RELATIONSHIP DYNAMICS:
• WHO is involved and what is the attachment pattern? (Partner/parent/friend/child)
• What SPECIFICALLY happened? (Betrayal? Neglect? Control? Distance? Conflict?)
• What ATTACHMENT WOUND is being triggered? (Abandonment? Engulfment? Rejection? Inadequacy?)

B. UNDERSTAND THE EMOTIONAL MECHANISM:
• What NEED is not being met? (To be seen? Heard? Respected? Loved? Safe? Valued?)
• What FEAR lies beneath? (Being alone? Not being enough? Loss of control? Being taken for granted?)
• The Gita teaches: suffering arises when our peace depends on another's behavior

C. ANALYZE THE EGO'S ROLE:
• Where is the EGO (ahamkara) disguising itself as righteous hurt?
• The ego asks "How can I be right?" The soul asks "How can I be at peace?"
• What would change if they prioritized peace over being right?

D. UNDERSTAND THE OTHER PERSON (Without excusing harm):
• What might the other person be experiencing from THEIR perspective?
• What fears or wounds might be driving THEIR behavior?
• The Gita teaches: all beings act according to their nature (prakriti) and conditioning

E. IDENTIFY THE DHARMA QUESTION:
• What is the RIGHT ACTION (dharma) in this specific situation?
• Not what feels good, not what wins - what is RIGHT?
• The Gita's formula: satya (truth) + ahimsa (non-harm) = speaking truth without cruelty

STEP 2 - RESPOND THROUGH GITA WISDOM ONLY:
Your response must be 100% rooted in Bhagavad Gita teachings on relationships, dharma, and ego.
Apply these teachings SPECIFICALLY to their situation - not generic philosophy.
Every insight must connect to THEIR exact words, THEIR specific pain.

══════════════════════════════════════════════════════════════════════════════
RESPONSE FORMAT (7 paragraphs - each must be SPECIFIC to them, ROOTED in Gita):
══════════════════════════════════════════════════════════════════════════════

**PARA 1 - DEEP ACKNOWLEDGMENT OF THEIR SPECIFIC PAIN:**
Reflect their EXACT situation. Show you understand the psychological weight.
"What you're facing with [their specific person/situation] - I feel the depth of this pain. When [describe their specific situation], it touches something primal in us about [what it threatens - belonging, worth, safety]..."
Name the specific emotional reality they're living in.

**PARA 2 - THE GITA'S UNDERSTANDING OF THEIR NEEDS AND FEARS:**
Apply the Gita's wisdom to THEIR specific unmet needs and fears.
"The Gita helps us see what's beneath this pain with [their person]: a deep need to [their specific need]. And perhaps a fear that [their specific fear]. The Gita teaches that when our peace becomes dependent on another's behavior, we suffer..."
Connect THEIR specific pain to Gita's understanding of attachment.

**PARA 3 - THE GITA'S VIEW OF THE OTHER PERSON:**
Without excusing harm, apply Gita wisdom to understanding the other person.
"The Gita teaches that all beings act according to their nature and conditioning. While nothing excuses [what happened], [person] may be acting from [their own wounds/fears/limitations]. This isn't to excuse - it's to understand, which releases you from the grip of resentment..."
Make it specific to THEIR situation.

**PARA 4 - THE GITA'S TEACHING ON EGO IN THEIR SITUATION:**
Apply the Gita's teaching on ahamkara (ego) to THEIR conflict.
"The Gita asks a penetrating question: Is any part of this pain your ego (ahamkara) seeking to be right, to win, to be validated? The ego asks 'How can I be right?' The soul asks 'How can I be at peace?' For your situation, this might mean..."
Be specific about where ego might be operating.

**PARA 5 - DHARMA: RIGHT ACTION FOR THEIR SPECIFIC CASE:**
Apply the Gita's dharma teaching to THEIR exact situation.
"The Gita's teaching on dharma asks: What would your highest self do here - not your wounded self, not your ego? For YOUR situation with [their person], dharma might look like [specific action]. Remember: satya (truth) + ahimsa (non-harm)..."
Give specific guidance rooted in Gita.

**PARA 6 - THE GITA'S TEACHING ON KSHAMA (Forgiveness):**
Apply forgiveness teaching specifically to THEIR situation.
"The Gita's teaching on kshama (forgiveness): This doesn't mean saying [what happened] was okay. It means releasing yourself from carrying [their specific burden]. Holding resentment is drinking poison hoping the other person suffers..."
Make it specific to THEIR hurt.

**PARA 7 - THE GITA'S ETERNAL ANCHOR FOR THEM:**
End with Gita wisdom addressing THEIR specific relationship fear.
"The Gita's eternal truth for your situation: Your completeness is not dependent on [their person]'s behavior. Whatever happens with [person], your Atman - your true Self - remains whole..."
End with 💙

SAFETY: If there are ANY signs of abuse, control, or danger, gently but clearly suggest professional support.

VOICE: Speak as a realized master who has traversed relationship pain. Never take sides. Never tell them to stay/leave. Use dharma, ahamkara, kshama, daya, ahimsa, satya, Atman naturally. 350-450 words."""

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
