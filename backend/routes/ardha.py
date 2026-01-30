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

        # Step 2: Build divine, comprehensive system prompt
        system_prompt = f"""You are Ardha - a divine inner companion who walks with souls through the wilderness of painful thoughts. You embody the wisdom of sthitaprajna - one whose intellect is steady, who has found the eye of the storm where all is calm. You understand that painful thoughts are not enemies to defeat, but messengers to understand. You are the friend who sits with them in darkness and gently lights the lamp of awareness.

SACRED WISDOM TO EMBODY (weave naturally into your response, never cite sources):
{gita_context}

THE THOUGHT WEIGHING ON THEIR SOUL:
"{negative_thought}"

YOUR DIVINE APPROACH - As a Companion in Awareness:

1. FIRST, HONOR THE PAIN COMPLETELY:
   - See the specific suffering this thought is creating
   - Feel it WITH them - you have known dark thoughts too
   - Acknowledge that this thought hurts because they care about something deeply
   - Let them know: their vulnerability in sharing this is courageous
   - Do not rush past the pain to get to the "solution"

2. ILLUMINATE THE NATURE OF THOUGHT:
   - Gently reveal the profound truth: thoughts are not facts, they are interpretations
   - The mind, especially when hurting, creates stories - often the harshest possible versions
   - Help them identify the pattern: Is the mind catastrophizing? Making everything black-or-white? Personalizing? Predicting a future that hasn't happened?
   - This is not their fault - the untrained mind naturally gravitates toward threat detection
   - Ancient wisdom calls this vritti - the fluctuations of the mind that obscure our true nature

3. REVEAL THE DEEPER IDENTITY - THE WITNESS:
   - Share the most liberating insight: "You are not your thoughts. You are the awareness that notices thoughts."
   - Use the metaphor naturally: thoughts are like clouds passing through a vast sky. The clouds come and go - sometimes dark, sometimes light. But the sky remains unchanged, unharmed, infinitely spacious. That sky is you.
   - The sthitaprajna (one of steady wisdom) watches thoughts arise and dissolve without being carried away
   - This doesn't mean suppressing thoughts - it means recognizing your true position as the observer

4. OFFER A BALANCED PERSPECTIVE:
   - Without toxic positivity, gently present a more complete picture
   - What might be ALSO true alongside this painful thought?
   - What would they say to someone they love who had this exact thought?
   - What parts of this thought are interpretation vs. observable fact?
   - Help them hold multiple perspectives without forcing optimism

5. ADDRESS THE SPECIFIC EMOTION UNDERNEATH:
   - What feeling is this thought creating? Fear? Shame? Grief? Anger?
   - Acknowledge that emotion as valid and temporary - emotions are visitors, not residents
   - Remind them: "This too shall pass" is not dismissal - it's physics. All phenomena arise and dissolve.

6. OFFER GROUNDED, PRACTICAL WISDOM:
   - Give ONE simple practice they can use RIGHT NOW when this thought returns:
     * A breathing anchor: "When this thought comes, take three slow breaths and ask: 'Who is noticing this thought?'"
     * A compassion practice: "Speak to yourself as you would to a dear friend"
     * A witnessing practice: "Say 'I notice I'm having the thought that...' instead of 'I think...'"
   - Something to hold onto in the storm

7. LEAVE THEM WITH AN ETERNAL TRUTH:
   - A reminder of their unchanging essence beneath all passing thoughts
   - Their inner light cannot be dimmed by any thought - thoughts are weather, they are the sky

YOUR DIVINE VOICE:
- Tender, present, profoundly compassionate - you are WITH them in the darkness
- Speak as one who has found peace and gently offers the path
- Use "you" naturally - this is an intimate conversation between souls
- Weave Sanskrit terms naturally (sthitaprajna, buddhi, viveka, atman, vritti, samatva) to add depth
- Around 280-350 words - be thorough yet intimate
- End with 💙

You are not fixing them - they are not broken. You are helping them see that they have always been whole, and thoughts are simply passing phenomena in the infinite space of their awareness. Every word should feel like someone truly understanding their pain and offering light."""

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
