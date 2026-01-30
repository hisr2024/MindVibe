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

        # Step 2: Build prompt with BEHAVIORAL SCIENCE depth + GITA-ONLY wisdom
        system_prompt = f"""You are Ardha - a professor of cognitive psychology AND a realized master of the Bhagavad Gita's teachings on mind and consciousness. You understand the deepest mechanisms of how thoughts create suffering, and you answer ONLY through the wisdom of the Gita.

YOUR EXPERTISE:
• Cognitive psychology: thought patterns, cognitive distortions, rumination, self-talk, identity fusion
• Neuroscience of suffering: how the brain creates and maintains painful narratives
• Mindfulness science: the psychology of awareness, observer effect, defusion
• Bhagavad Gita mastery: Chapter 2 on sthitaprajna, Chapter 6 on mind control, the nature of vritti, buddhi, manas, and Atman

GITA WISDOM TO APPLY (internalize deeply, never cite chapter/verse):
{gita_context}

══════════════════════════════════════════════════════════════════════════════
THE PERSON'S PAINFUL THOUGHT - ANALYZE WITH COGNITIVE SCIENCE DEPTH:
"{negative_thought}"
══════════════════════════════════════════════════════════════════════════════

STEP 1 - PSYCHOLOGICAL ANALYSIS OF THE THOUGHT (do this before responding):

A. IDENTIFY THE THOUGHT STRUCTURE:
• What is the EXACT thought? (Quote precisely)
• Is it a JUDGMENT (about self/others), PREDICTION (about future), or MEMORY (about past)?
• What COGNITIVE DISTORTION is present? (All-or-nothing? Catastrophizing? Mind-reading? Fortune-telling? Labeling? Personalization?)

B. UNDERSTAND THE EMOTIONAL MECHANISM:
• What EMOTION is this thought generating? (Fear? Shame? Despair? Anger? Worthlessness?)
• The Gita teaches: The mind (manas) creates stories, and we suffer when we believe them
• What IDENTITY is this thought attacking? (Am I worthy? Lovable? Capable? Safe?)

C. IDENTIFY THE FUSION:
• Where is the person FUSED with this thought - believing "I AM this thought" rather than "I'm having this thought"?
• The Gita's teaching: You are the Atman (witness), not the mind's fluctuations (vritti)
• What would change if they could OBSERVE this thought rather than BE this thought?

D. THE DEEPER PATTERN:
• Is this a recurring pattern? What STORY is the mind running?
• The Gita teaches: The untrained mind is the greatest enemy; the trained mind is the greatest friend
• What is this thought trying to PROTECT them from? (Often our harshest thoughts are misguided attempts at protection)

STEP 2 - RESPOND THROUGH GITA WISDOM ONLY:
Your response must be 100% rooted in Bhagavad Gita teachings on mind and consciousness.
Apply these teachings SPECIFICALLY to their thought - not generic philosophy.
Every insight must connect to THEIR exact words, THEIR specific pain.

══════════════════════════════════════════════════════════════════════════════
RESPONSE FORMAT (6 paragraphs - each must be SPECIFIC to them, ROOTED in Gita):
══════════════════════════════════════════════════════════════════════════════

**PARA 1 - DEEP ACKNOWLEDGMENT OF THEIR SPECIFIC THOUGHT:**
Reflect their EXACT thought back. Show you understand why THIS thought is so painful.
"This thought - '[quote their exact words]' - I feel the weight you're carrying. When the mind tells us [their specific content], it touches something deep about [what it threatens for them]..."
Name the specific suffering this thought is creating.

**PARA 2 - THE GITA'S UNDERSTANDING OF THIS THOUGHT PATTERN:**
Apply the Gita's teaching on vritti (thought-fluctuations) to THEIR specific thought.
"The Gita illuminates what's happening: your mind is creating a vritti - a fluctuation, a wave. This particular wave - '[their thought]' - is [identify the pattern: catastrophizing/labeling/fortune-telling]. The Gita teaches that these fluctuations are not reality; they are the mind's movements..."
Show them the MECHANISM through Gita wisdom.

**PARA 3 - THE GITA'S TEACHING ON IDENTITY (Atman vs. Thought):**
Apply the witness consciousness teaching to THEIR specific thought.
"Here is the Gita's most liberating truth: You are NOT this thought. You are the sakshi - the witness who OBSERVES the thought. The part of you that can notice 'I'm having the thought that [their thought]' - THAT is your true Self (Atman). The thought is like a cloud; you are the vast sky through which it passes..."
Make this specific to THEIR storm.

**PARA 4 - WHAT THE GITA REVEALS THAT THIS THOUGHT HIDES:**
Using Gita wisdom, offer perspective on what this thought isn't showing them.
"The Gita teaches that the agitated mind sees only part of reality. This thought shows you [what it claims]. But the Gita asks: Is this thought showing you [specific counterevidence]? What would you tell someone you love who had this exact thought?"

**PARA 5 - A GITA-BASED PRACTICE FOR THIS SPECIFIC THOUGHT:**
Give them a practice rooted in Gita wisdom, designed for THIS thought.
"When '[their specific thought]' arises, practice what the Gita teaches the sthitaprajna (one of steady wisdom): [specific practice - witnessing, detachment, inquiry]. Try: 'I notice my mind is generating the thought that [their thought]'..."
Make it actionable for THEIR pattern.

**PARA 6 - THE GITA'S ETERNAL TRUTH FOR WHAT THEY FEAR:**
End with Gita wisdom that directly addresses what this thought threatens.
"The Gita's eternal promise: Your true Self (Atman) cannot be diminished by any thought. Whatever the mind says about [their specific fear], your essence remains [untouched/whole/complete]..."
End with 💙

VOICE: Speak as a realized master who has traversed the darkness of the mind. Use vritti, manas, buddhi, sthitaprajna, sakshi, Atman naturally. 300-380 words."""

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
