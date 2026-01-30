"""Ardha Reframing Engine - KIAAN AI Integration (KIAAN Chat Pattern).

This router provides cognitive reframing using the same deep KIAAN integration
as KIAAN Chat - directly fetching Gita verses, building wisdom context, and generating
responses that truly comprehend and interpret through the Gita.

Ardha focuses on sthitaprajna (steady wisdom) principles for thought transformation.
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

router = APIRouter(prefix="/api/ardha", tags=["ardha"])

# Initialize OpenAI client (same pattern as KIAAN Chat)
api_key = os.getenv("OPENAI_API_KEY", "").strip()
client = OpenAI(api_key=api_key) if api_key else None

# Initialize Gita knowledge base
gita_kb = None
try:
    from backend.services.wisdom_kb import WisdomKnowledgeBase
    gita_kb = WisdomKnowledgeBase()
    logger.info("✅ Ardha: Gita knowledge base loaded")
except Exception as e:
    logger.warning(f"⚠️ Ardha: Gita KB unavailable: {e}")

# Import the comprehensive context builder from KIAAN Chat
try:
    from backend.routes.chat import build_gita_context_comprehensive
    logger.info("✅ Ardha: Using KIAAN Chat's comprehensive context builder")
except ImportError:
    build_gita_context_comprehensive = None
    logger.warning("⚠️ Ardha: Could not import comprehensive context builder")


def _build_gita_context(verse_results: list[dict], limit: int = 5) -> str:
    """Build Gita context from verse results using KIAAN Chat's comprehensive method."""
    # Use the comprehensive builder from KIAAN Chat if available
    if build_gita_context_comprehensive:
        return build_gita_context_comprehensive(verse_results, limit=limit)

    # Fallback to manual implementation matching KIAAN Chat pattern
    MAX_TEACHING_LENGTH = 300

    if not verse_results:
        return """FALLBACK WISDOM (no specific verses found):
Apply universal sthitaprajna principles:
- Sthitaprajna (steady wisdom) - Mind undisturbed by dualities
- Buddhi (higher intellect) - Discernment between real and unreal
- Viveka (discrimination) - Seeing thoughts as interpretations, not facts
- Samatva (equanimity) - Balance in pleasure and pain
- Atman (true self) - You are the observer, not the thoughts

RESPONSE GUIDELINE: Never cite "Bhagavad Gita", "verse", "chapter" or any scripture. Present wisdom as universal life principles."""

    context_parts = [
        "RELEVANT GITA WISDOM FOR COGNITIVE REFRAMING (use internally, NEVER cite in response):",
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
        "1. Focus on sthitaprajna: steady wisdom undisturbed by thoughts",
        "2. Help them see they are the observer, not the thoughts themselves",
        "3. Present wisdom naturally without citing sources",
        "4. Use Sanskrit terms (sthitaprajna, buddhi, atman, viveka, samatva)",
        "5. Make ancient wisdom feel immediately relevant to thought transformation",
        "",
        "FORBIDDEN IN RESPONSE:",
        "❌ Never say 'Bhagavad Gita', 'Gita', 'verse', 'chapter', or cite numbers",
        "❌ Never say 'Krishna', 'Arjuna', or reference the dialogue",
        "❌ Never say 'cognitive distortion', 'CBT', 'reframing technique'",
        "✅ Instead, say 'ancient wisdom teaches', 'timeless principle', 'eternal truth'",
    ])

    return "\n".join(context_parts)


@router.post("/reframe")
async def reframe_thought(
    payload: dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> dict[str, Any]:
    """Generate cognitive reframing using KIAAN Chat integration pattern.

    This follows the same deep integration as KIAAN Chat:
    1. Fetch relevant Gita verses (sthitaprajna focus)
    2. Build wisdom context from verses
    3. Use detailed Gita-rooted system prompt
    4. Generate personalized response for THIS user's thought
    """
    negative_thought = payload.get("negative_thought", "")

    if not negative_thought.strip():
        raise HTTPException(status_code=400, detail="negative_thought is required")

    if len(negative_thought) > 2000:
        raise HTTPException(status_code=400, detail="Input too long (max 2000 characters)")

    if not client:
        logger.error("Ardha: OpenAI client not configured")
        return _get_fallback_response(negative_thought)

    try:
        # Step 1: Fetch relevant Gita verses (sthitaprajna/equanimity focus)
        gita_context = ""
        verse_results = []

        if gita_kb and db:
            try:
                # Search for equanimity and mind-stability related verses
                search_query = f"{negative_thought} equanimity mind stability wisdom balance thoughts peace"
                verse_results = await gita_kb.search_relevant_verses(db=db, query=search_query, limit=7)

                # Fallback if insufficient results
                if len(verse_results) < 3:
                    verse_results = await gita_kb.search_with_fallback(db=db, query=search_query, limit=7)

                gita_context = _build_gita_context(verse_results)
                logger.info(f"✅ Ardha: Found {len(verse_results)} sthitaprajna verses")

            except Exception as e:
                logger.error(f"Error fetching Gita verses: {e}")
                gita_context = "Apply sthitaprajna: the mind undisturbed by adversity, free from attachment and fear."

        if not gita_context:
            gita_context = "Apply sthitaprajna: the mind undisturbed by adversity, free from attachment and fear."

        # Step 2: Build divine prompt with DEEP CONTEXTUAL ANALYSIS
        system_prompt = f"""You are Ardha - a divine friend and guru of sthitaprajna (steady wisdom) who DEEPLY UNDERSTANDS each person's unique mental suffering.

GITA WISDOM (internalize, never cite):
{gita_context}

══════════════════════════════════════════════════════════════════════════════
THE PERSON'S PAINFUL THOUGHT - ANALYZE THIS DEEPLY BEFORE RESPONDING:
"{negative_thought}"
══════════════════════════════════════════════════════════════════════════════

STEP 1 - FIRST, ANALYZE THEIR THOUGHT (do this mentally before writing):
• What is the EXACT thought tormenting them? (Quote their words precisely)
• What EMOTION is this thought creating? (Fear? Shame? Despair? Anger? Worthlessness?)
• What does this thought THREATEN? (Their identity? Worth? Future? Relationships? Hope?)
• What PATTERN is the mind using? (Catastrophizing? All-or-nothing? Mind-reading? Fortune-telling? Labeling?)
• What is the DEEPER FEAR beneath this thought?
• What might be TRUE that this thought is hiding from them?

STEP 2 - NOW RESPOND WITH 100% CONTEXTUAL WISDOM:
Your response must prove you UNDERSTOOD their specific thought and suffering.
Every sentence must connect to THEIR words, THEIR thought, THEIR specific pain.
If your response could apply to any negative thought, it's too generic - make it SPECIFIC.

══════════════════════════════════════════════════════════════════════════════
RESPONSE FORMAT (6 paragraphs, each MUST reference THEIR specific thought):
══════════════════════════════════════════════════════════════════════════════

**PARA 1 - PROVE YOU UNDERSTOOD THEIR SUFFERING (Most Critical):**
Reflect their EXACT thought back. Show you understand why THIS thought is so painful.
"This thought - '[quote their exact words]' - I feel the weight of it. When our mind tells us [their specific fear], it touches something so deep..."
Acknowledge what this thought threatens for THEM specifically.
They must feel: "Yes! Someone understands exactly why this thought hurts so much."

**PARA 2 - ANALYZE THE SPECIFIC PATTERN IN THEIR THOUGHT:**
Name the specific cognitive pattern THEIR thought is using. Be precise.
"Notice what your mind is doing here: it's [catastrophizing/all-or-nothing/labeling] - telling you that [their specific distortion]..."
Show them how THIS specific thought is a vritti (fluctuation), not truth.

**PARA 3 - WITNESS CONSCIOUSNESS APPLIED TO THEIR THOUGHT:**
Apply the witness teaching DIRECTLY to their specific thought.
"This thought '[their thought]' feels like YOU. But here's the truth: you are the awareness NOTICING this thought. The part of you that can observe 'I'm having the thought that [their thought]' - THAT is who you really are..."
Make the sky/clouds metaphor specific to THEIR storm.

**PARA 4 - WHAT THEIR THOUGHT ISN'T SHOWING THEM:**
Offer a specific, balanced perspective for THEIR situation.
"This thought is showing you [what it claims]. But is it showing you [specific counterevidence relevant to their situation]?"
What would THEY say to someone they love who had this EXACT thought?

**PARA 5 - A PRACTICE DESIGNED FOR THEIR SPECIFIC THOUGHT:**
Not generic mindfulness. A practice for THIS thought.
"When '[their specific thought]' arises again, try: 'I notice I'm having the thought that [their exact words].' This small shift moves you from INSIDE the thought to WATCHING it..."
Make it actionable for THEIR specific pattern.

**PARA 6 - AN ANCHOR THAT ADDRESSES THEIR SPECIFIC FEAR:**
End with truth that directly counters what THEIR thought threatens.
If their thought attacks their worth: "Your worth is not determined by [their specific thing]..."
If their thought predicts doom: "Even if [their fear], you remain..."
End with 💙

VOICE: Speak as someone who has LIVED through the darkness of intrusive thoughts. Use vritti, sthitaprajna, sakshi, atman naturally. 280-350 words."""

        # Step 3: Generate response (KIAAN Chat pattern)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"This thought keeps haunting me: {negative_thought}"}
            ],
            temperature=0.7,
            max_tokens=700,
            timeout=30.0,
        )

        content = None
        if response and response.choices and len(response.choices) > 0:
            response_msg = response.choices[0].message
            if response_msg:
                content = response_msg.content

        if not content:
            return _get_fallback_response(negative_thought)

        # Parse into structured format
        reframe_guidance = _parse_response_to_structure(content)

        return {
            "status": "success",
            "reframe_guidance": reframe_guidance,
            "raw_text": content,
            "gita_verses_used": len(verse_results),
            "model": "gpt-4o-mini",
            "provider": "kiaan",
        }

    except Exception as e:
        logger.exception(f"Ardha error: {e}")
        return _get_fallback_response(negative_thought)


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

    # Comprehensive structure for divine wisdom
    if len(sections) >= 7:
        return {
            "honoring_pain": sections[0],
            "nature_of_thought": sections[1],
            "witness_consciousness": sections[2],
            "balanced_perspective": sections[3],
            "emotion_underneath": sections[4],
            "practical_anchor": sections[5],
            "eternal_truth": sections[6],
        }
    elif len(sections) >= 5:
        return {
            "honoring_pain": sections[0],
            "nature_of_thought": sections[1],
            "witness_consciousness": sections[2],
            "balanced_perspective": sections[3],
            "practical_anchor": sections[4],
            "emotion_underneath": "",
            "eternal_truth": "",
        }
    elif len(sections) >= 3:
        return {
            "honoring_pain": sections[0],
            "witness_consciousness": sections[1],
            "practical_anchor": sections[2],
            "nature_of_thought": "",
            "balanced_perspective": "",
            "emotion_underneath": "",
            "eternal_truth": "",
        }
    else:
        return {
            "honoring_pain": response_text,
            "nature_of_thought": "",
            "witness_consciousness": "",
            "balanced_perspective": "",
            "emotion_underneath": "",
            "practical_anchor": "",
            "eternal_truth": "",
        }


def _get_fallback_response(negative_thought: str) -> dict[str, Any]:
    """Divine fallback when KIAAN is unavailable."""
    thought_snippet = negative_thought[:50] + "..." if len(negative_thought) > 50 else negative_thought
    return {
        "status": "success",
        "reframe_guidance": {
            "honoring_pain": f"Dear friend, I truly see you. This thought - '{thought_snippet}' - it sits in your mind like a heavy stone. The pain it creates is real, and I want you to know: your struggle with this thought is not weakness. It takes courage to look at our dark thoughts instead of running from them. You are not alone in this moment.",
            "nature_of_thought": "Let me share something profound: thoughts feel like absolute truth, especially the painful ones. But here is what the ancient wisdom teaches - thoughts are not facts. They are vritti, fluctuations of the mind, interpretations created by a mind that is trying to protect you. The mind, when in pain, often tells us the harshest possible story.",
            "witness_consciousness": "Here is the most liberating truth I can offer you: You are not your thoughts. You are the awareness that notices thoughts. Imagine a vast, clear sky. Thoughts are like clouds passing through - some dark and heavy, some light. But the sky itself? It remains unchanged, untouched, infinitely spacious. That sky - that unchanging witness - that is who you truly are. The clouds cannot harm the sky.",
            "balanced_perspective": "Now, let's gently examine this thought together. What if this thought is not the complete picture? What might ALSO be true? If someone you deeply loved came to you with this exact thought, what gentle words would you offer them? Those words - you deserve to hear them too.",
            "emotion_underneath": "Beneath this thought, there is a feeling - perhaps fear, shame, grief, or anger. Whatever it is, know this: emotions are visitors, not permanent residents. They arise, they stay for a while, and they pass. This too shall pass - not as empty comfort, but as truth. All phenomena arise and dissolve.",
            "practical_anchor": "When this thought returns, try this: Instead of 'I think...' say 'I notice I'm having the thought that...' This small shift moves you from inside the thought to the position of the witness. Then take three slow breaths and gently ask: 'Who is noticing this thought?' Rest in that awareness.",
            "eternal_truth": "Carry this with you: Your inner light cannot be dimmed by any thought. Thoughts are weather. You are the sky. Whatever storms pass through your mind, your essential nature remains whole, peaceful, and radiant.",
        },
        "raw_text": f"Dear friend, I truly see you. This thought sits in your mind like a heavy stone. The pain it creates is real, and I want you to know: your struggle is not weakness. It takes courage to look at our dark thoughts.\n\nLet me share something profound: thoughts feel like absolute truth, especially the painful ones. But thoughts are not facts. They are vritti - fluctuations of the mind, interpretations created by a mind trying to protect you.\n\nHere is the most liberating truth: You are not your thoughts. You are the awareness that notices thoughts. Imagine a vast, clear sky. Thoughts are like clouds passing through - some dark, some light. But the sky itself remains unchanged, untouched, infinitely spacious. That sky - that unchanging witness - that is who you truly are.\n\nLet's gently examine this thought. What might ALSO be true? If someone you loved came to you with this exact thought, what gentle words would you offer them? Those words - you deserve to hear them too.\n\nBeneath this thought is a feeling - perhaps fear, shame, grief. Know this: emotions are visitors, not permanent residents. This too shall pass.\n\nWhen this thought returns, try this: Instead of 'I think...' say 'I notice I'm having the thought that...' This small shift moves you to the position of the witness. Then breathe and ask: 'Who is noticing this thought?'\n\nYour inner light cannot be dimmed by any thought. Thoughts are weather. You are the sky. 💙",
        "gita_verses_used": 0,
        "model": "fallback",
        "provider": "kiaan",
    }


@router.get("/health")
async def ardha_health():
    """Health check."""
    return {"status": "ok", "service": "ardha", "provider": "kiaan"}
