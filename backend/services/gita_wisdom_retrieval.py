"""Shared Gita Wisdom Retrieval Service for Viyoga and Relationship Compass.

This service provides direct access to the 701 Bhagavad Gita verses stored in JSON,
with keyword-based search optimized for spiritual wellness applications.

ENHANCED v2.0: Now includes AI-powered analysis integration via gita_ai_analyzer.
Keyword matching serves as fallback when AI is unavailable.

Used by:
- Viyoga (Detachment Coach) - Karma Yoga focused verses
- Relationship Compass - Dharma/Daya/Kshama focused verses
- Fallback for all tools when RAG/OpenAI is unavailable

The service ensures ALL responses are grounded in actual Gita wisdom from the repository.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Load complete Gita verses from JSON (701 verses)
GITA_VERSES: list[dict[str, Any]] = []
GITA_VERSES_PATH = Path(__file__).parent.parent.parent / "data" / "gita" / "gita_verses_complete.json"

try:
    if GITA_VERSES_PATH.exists():
        with open(GITA_VERSES_PATH, "r", encoding="utf-8") as f:
            GITA_VERSES = json.load(f)
        logger.info(f"✅ GitaWisdomRetrieval: Loaded {len(GITA_VERSES)} verses from JSON")
    else:
        logger.warning(f"⚠️ GitaWisdomRetrieval: Verses file not found at {GITA_VERSES_PATH}")
except Exception as e:
    logger.error(f"❌ GitaWisdomRetrieval: Failed to load verses: {e}")


# =============================================================================
# KEYWORD MAPPINGS FOR DIFFERENT TOOLS
# =============================================================================

# Viyoga (Detachment/Karma Yoga) keywords
VIYOGA_KEYWORDS = {
    # Outcome/results anxiety
    "outcome": ["outcome", "result", "consequence", "fruit", "fruits", "phala"],
    "anxiety": ["anxious", "anxiety", "worried", "worry", "fear", "afraid", "stress"],
    "control": ["control", "manage", "guarantee", "ensure", "make sure"],
    "future": ["future", "what if", "might happen", "could go wrong", "will be"],
    # Attachment patterns
    "attachment": ["attached", "attachment", "clingy", "holding on", "let go", "release"],
    "perfectionism": ["perfect", "flawless", "mistake", "failure", "success"],
    "approval": ["approve", "approval", "validation", "acceptance", "rejected", "judged"],
    # Karma Yoga concepts
    "action": ["action", "duty", "work", "effort", "karma", "doing"],
    "detachment": ["detach", "detachment", "surrender", "release", "freedom"],
    "equanimity": ["equanimity", "balance", "steady", "calm", "peace", "even-minded"],
}

# Relationship Compass keywords
RELATIONSHIP_KEYWORDS = {
    # Emotions
    "anger": ["angry", "anger", "rage", "furious", "irritated", "frustrated", "mad"],
    "hurt": ["hurt", "pain", "wounded", "betrayed", "abandoned", "rejected"],
    "fear": ["fear", "afraid", "scared", "anxious", "worried", "insecure"],
    "guilt": ["guilt", "guilty", "shame", "ashamed", "regret", "sorry"],
    "jealousy": ["jealous", "jealousy", "envy", "envious", "possessive"],
    "resentment": ["resentment", "bitter", "grudge", "hate", "hatred"],
    "grief": ["grief", "loss", "mourning", "sad", "sorrow", "missing"],
    # Relationship dynamics
    "forgiveness": ["forgive", "forgiveness", "pardon", "let go", "release"],
    "compassion": ["compassion", "empathy", "understanding", "kindness", "caring"],
    "communication": ["communicate", "talk", "speak", "listen", "conversation"],
    "trust": ["trust", "faith", "believe", "reliable", "dependable"],
    "boundaries": ["boundary", "boundaries", "space", "respect", "limits"],
    # Relationship types
    "family": ["family", "parent", "mother", "father", "sibling", "child", "son", "daughter"],
    "romantic": ["partner", "spouse", "husband", "wife", "love", "romantic", "relationship"],
    "friendship": ["friend", "friendship", "companion", "buddy"],
    "workplace": ["colleague", "boss", "coworker", "work", "office", "professional"],
}

# Chapter focus areas for spiritual wellness
CHAPTER_MENTAL_HEALTH_FOCUS = {
    2: ["wisdom", "equanimity", "steady_mind", "grief", "confusion"],  # Sankhya Yoga
    3: ["action", "duty", "karma", "work", "selfless_service"],  # Karma Yoga
    6: ["meditation", "mind_control", "restlessness", "discipline"],  # Dhyana Yoga
    12: ["devotion", "compassion", "qualities", "love"],  # Bhakti Yoga
    16: ["virtues", "divine_qualities", "anger", "pride", "ego"],  # Divine/Demonic
    18: ["liberation", "surrender", "renunciation", "conclusion"],  # Moksha Sannyasa
}


def search_gita_verses(
    query: str,
    tool: str = "general",
    limit: int = 8,
    depth: str = "standard"
) -> list[dict[str, Any]]:
    """Search 701 Gita verses using keyword matching and spiritual wellness relevance.

    Args:
        query: User's input/concern
        tool: Which tool is searching ("viyoga", "relationship_compass", "general")
        limit: Maximum verses to return
        depth: Analysis depth ("standard", "deep_dive", "quantum_dive")

    Returns:
        List of matching verses with relevance scores and metadata
    """
    if not GITA_VERSES:
        logger.warning("GitaWisdomRetrieval: No verses loaded")
        return []

    query_lower = query.lower()
    query_words = set(query_lower.split())

    # Select keyword mapping based on tool
    if tool == "viyoga":
        keyword_map = VIYOGA_KEYWORDS
    elif tool == "relationship_compass":
        keyword_map = RELATIONSHIP_KEYWORDS
    else:
        keyword_map = {**VIYOGA_KEYWORDS, **RELATIONSHIP_KEYWORDS}

    # Expand query with related keywords
    expanded_keywords = set(query_words)
    for category, keywords in keyword_map.items():
        for keyword in keywords:
            if keyword in query_lower:
                expanded_keywords.add(category)
                expanded_keywords.update(keywords)

    # Score each verse
    scored_verses: list[tuple[float, dict[str, Any]]] = []

    for verse in GITA_VERSES:
        score = 0.0

        # Check spiritual wellness applications (highest priority)
        mh_apps = verse.get("mental_health_applications", [])
        for app in mh_apps:
            app_lower = app.lower()
            if app_lower in expanded_keywords or any(k in app_lower for k in expanded_keywords):
                score += 3.0

        # Check theme
        theme = verse.get("theme", "").lower()
        if any(k in theme for k in expanded_keywords):
            score += 2.0

        # Check principle
        principle = verse.get("principle", "").lower()
        for word in expanded_keywords:
            if len(word) > 3 and word in principle:
                score += 1.5

        # Check English translation
        english = verse.get("english", "").lower()
        for word in expanded_keywords:
            if len(word) > 3 and word in english:
                score += 0.5

        # Check Sanskrit/Hindi (for Gita-specific terms)
        hindi = verse.get("hindi", "").lower()
        for word in expanded_keywords:
            if len(word) > 3 and word in hindi:
                score += 0.3

        # Boost important chapters based on tool
        chapter = verse.get("chapter", 0)
        if tool == "viyoga":
            # Karma Yoga focus: chapters 2, 3, 5, 18
            if chapter in [2, 3, 5, 18]:
                score *= 1.4
            elif chapter == 6:
                score *= 1.2
        elif tool == "relationship_compass":
            # Relationship focus: chapters 2, 12, 16, 18
            if chapter in [12, 16]:
                score *= 1.4
            elif chapter in [2, 18]:
                score *= 1.2
        else:
            # General: boost spiritual wellness chapters
            if chapter in [2, 6, 12, 18]:
                score *= 1.3

        if score > 0:
            scored_verses.append((score, verse))

    # Sort by score
    scored_verses.sort(key=lambda x: x[0], reverse=True)

    # Adjust limit based on depth
    if depth == "quantum_dive":
        limit = min(limit + 6, 14)
    elif depth == "deep_dive":
        limit = min(limit + 3, 11)

    return [v for _, v in scored_verses[:limit]]


def build_gita_context(verses: list[dict[str, Any]], tool: str = "general") -> tuple[str, list[dict[str, str]]]:
    """Build rich context string from verses for AI prompt with strict Gita adherence.

    Includes Sanskrit text, transliteration, word meanings, themes, principles,
    and spiritual wellness applications for comprehensive Gita-grounded guidance.

    Args:
        verses: List of verse dictionaries from 701-verse repository
        tool: Tool requesting context ("viyoga", "relationship_compass", "general")

    Returns:
        Tuple of (context_string, source_references)
    """
    lines = ["[GITA_CORE_WISDOM_CONTEXT]"]
    lines.append(f"Source: Bhagavad Gita 701-verse repository (static core wisdom)")
    lines.append(f"Retrieved {len(verses)} relevant verses:\n")
    sources: list[dict[str, str]] = []

    for verse in verses:
        chapter = verse.get("chapter", 0)
        verse_num = verse.get("verse", 0)
        reference = f"BG {chapter}.{verse_num}"
        file_path = "data/gita/gita_verses_complete.json"

        english = verse.get("english", "")
        sanskrit = verse.get("sanskrit", "")
        transliteration = verse.get("transliteration", "")
        hindi = verse.get("hindi", "")
        theme = verse.get("theme", "")
        principle = verse.get("principle", "")
        mh_apps = verse.get("mental_health_applications", [])
        word_meanings = verse.get("word_meanings", {})

        lines.append(f"- Reference: {reference}")
        if sanskrit:
            # Include first line of Sanskrit for authenticity
            sanskrit_first = sanskrit.split("\n")[0].strip()
            lines.append(f"  Sanskrit: {sanskrit_first[:150]}")
        if transliteration:
            translit_first = transliteration.split("\n")[0].strip()
            lines.append(f"  Transliteration: {translit_first[:150]}")
        lines.append(f"  Translation: {english}")
        if hindi:
            hindi_first = hindi.split("\n")[0].strip()
            lines.append(f"  Hindi: {hindi_first[:150]}")
        if principle:
            lines.append(f"  Gita Principle: {principle}")
        if theme:
            lines.append(f"  Theme: {theme.replace('_', ' ').title()}")
        if mh_apps:
            lines.append(f"  Spiritual Wellness Applications: {', '.join(mh_apps[:6])}")

        # Include key word meanings for deeper understanding
        if word_meanings and isinstance(word_meanings, dict):
            key_words = list(word_meanings.items())[:5]
            if key_words:
                meanings_str = "; ".join(f"{k}: {v}" for k, v in key_words)
                lines.append(f"  Key Terms: {meanings_str}")

        lines.append("")

        sources.append({"file": file_path, "reference": reference})

    lines.append("[/GITA_CORE_WISDOM_CONTEXT]")
    return "\n".join(lines), sources


def generate_viyoga_fallback(
    user_input: str,
    verses: list[dict[str, Any]],
    attachment_type: str = "outcome_anxiety"
) -> dict[str, Any]:
    """Generate Gita-grounded Viyoga response when AI is unavailable.

    This creates a meaningful response using actual verses from the 701-verse
    repository, ensuring guidance is always rooted in authentic Gita wisdom.

    Args:
        user_input: User's concern about outcomes
        verses: Retrieved Gita verses
        attachment_type: Type of attachment detected

    Returns:
        Dictionary with sections and response grounded in Gita verses
    """
    worry_snippet = user_input[:80] + "..." if len(user_input) > 80 else user_input

    # Extract wisdom from verses
    teachings = []
    for verse in verses[:6]:
        chapter = verse.get("chapter", 0)
        verse_num = verse.get("verse", 0)
        ref = f"BG {chapter}.{verse_num}"
        english = verse.get("english", "")
        principle = verse.get("principle", "")
        if english:
            teachings.append({
                "ref": ref,
                "text": english,
                "principle": principle,
            })

    # If no verses retrieved, use core teaching
    if not teachings:
        teachings = [{
            "ref": "BG 2.47",
            "text": "You have the right to perform your prescribed duty, but you are not entitled to the fruits of action.",
            "principle": "Nishkama Karma",
        }]

    # Build sections using actual verses
    primary = teachings[0]
    secondary = teachings[1] if len(teachings) > 1 else primary
    tertiary = teachings[2] if len(teachings) > 2 else secondary

    sections = {
        "honoring_your_concern": f"Dear friend, I see you carrying the weight of this concern about '{worry_snippet}'. The ancient wisdom of the Gita speaks directly to this struggle - the struggle between wanting to act and fearing the outcome. Your anxiety reveals not weakness, but how deeply you care. This caring itself is a form of dharma.",

        "understanding_the_attachment": f"The Gita teaches ({primary['ref']}): '{primary['text'][:200]}...' This is the essence of phala-sakti - attachment to fruits. Your mind has reached forward into a future that doesn't exist yet, and in that reaching, has created suffering in the present. The outcome you fear or desire is not here; only this moment is real.",

        "karma_yoga_teaching": f"Krishna's teaching on Karma Yoga ({secondary['ref']}) illuminates the path: '{secondary['text'][:200]}...' This is not passive resignation - it is active liberation. The archer draws the bow with complete focus, aims with full presence, releases with perfect technique. Once released, the arrow's path is no longer the archer's to control. Your dharma lies in the drawing, the aiming, the releasing - not in where the arrow lands.",

        "the_shift_to_effort": f"The Gita offers this profound shift ({tertiary['ref']}): '{tertiary['text'][:180]}...' {tertiary.get('principle', 'Samatva - equanimity')} asks us to redirect the energy we spend worrying about outcomes into the quality of our action right now. What is within your control? Your intention. Your effort. Your presence. Your integrity. Everything else - release it.",

        "one_eternal_truth": f"({primary['ref']}): '{primary['text'][:150]}...' You are not your outcomes. You are the consciousness that acts, witnesses, and learns - regardless of what unfolds.",

        "one_sacred_action": f"Today, practice this: Before taking any action related to this concern, pause. Place your hand on your heart. Take three slow breaths. Then say: 'I offer my best effort as an act of devotion. The result belongs to the universe.' Then act with complete presence, as if the action itself is the sacred offering.",

        "one_releasing_question": "If you knew - truly knew in your bones - that your worth and peace could never depend on this outcome, how would you act differently right now?",
    }

    response_text = "\n\n".join([
        f"Honoring Your Concern\n{sections['honoring_your_concern']}",
        f"Understanding the Attachment\n{sections['understanding_the_attachment']}",
        f"Karma Yoga Teaching\n{sections['karma_yoga_teaching']}",
        f"The Shift to Effort\n{sections['the_shift_to_effort']}",
        f"One Eternal Truth\n{sections['one_eternal_truth']}",
        f"One Sacred Action\n{sections['one_sacred_action']}",
        f"One Releasing Question\n{sections['one_releasing_question']}",
    ])

    return {
        "sections": sections,
        "response": response_text,
        "gita_verses_used": len(teachings),
        "verses": teachings,
    }


def generate_relationship_compass_fallback(
    user_input: str,
    verses: list[dict[str, Any]],
    relationship_type: str = "other"
) -> dict[str, Any]:
    """Generate Gita-grounded Relationship Compass response when AI is unavailable.

    Args:
        user_input: User's relationship concern
        verses: Retrieved Gita verses
        relationship_type: Type of relationship

    Returns:
        Dictionary with sections and response grounded in Gita verses
    """
    conflict_snippet = user_input[:80] + "..." if len(user_input) > 80 else user_input

    # Extract wisdom from verses
    teachings = []
    for verse in verses[:8]:
        chapter = verse.get("chapter", 0)
        verse_num = verse.get("verse", 0)
        ref = f"BG {chapter}.{verse_num}"
        english = verse.get("english", "")
        principle = verse.get("principle", "")
        theme = verse.get("theme", "")
        if english:
            teachings.append({
                "ref": ref,
                "text": english,
                "principle": principle,
                "theme": theme,
            })

    if not teachings:
        teachings = [{
            "ref": "BG 6.32",
            "text": "One who sees equality everywhere, seeing his own self in all beings, is the highest yogi.",
            "principle": "Sama-darshana",
            "theme": "equal_vision",
        }]

    primary = teachings[0]
    verse_refs = [t["ref"] for t in teachings[:4]]

    # Relationship context
    rel_contexts = {
        "romantic": "your partner",
        "family": "your family member",
        "friendship": "your friend",
        "workplace": "your colleague",
        "self": "yourself",
        "other": "this person",
    }
    rel_context = rel_contexts.get(relationship_type, "this person")

    sections = {
        "sacred_acknowledgement": f"I witness what you carry. This situation - '{conflict_snippet}' - touches deep places. The ancient wisdom teaches ({primary['ref']}): '{primary['text'][:150]}...' Your willingness to seek understanding rather than react is itself an act of dharma.",

        "inner_conflict_mirror": f"The Gita reveals: all outer conflicts mirror inner ones. The teaching of svadhyaya (self-study) invites us to look within first. What do you truly need beneath this conflict with {rel_context}? To be seen? Understood? Respected? The verse ({teachings[1]['ref'] if len(teachings) > 1 else primary['ref']}) illuminates: '{teachings[1]['text'][:150] if len(teachings) > 1 else primary['text'][:150]}...'",

        "gita_teachings_used": f"These verses from the Bhagavad Gita illuminate your path:\n\n" + "\n".join([
            f"- ({t['ref']}): \"{t['text'][:120]}...\" [{t.get('principle', 'Dharma')}]"
            for t in teachings[:4]
        ]),

        "dharma_options": f"""Drawing from these teachings ({', '.join(verse_refs)}), consider three dharmic paths:

1. **Karma Yoga Path**: Focus on YOUR actions and intentions toward {rel_context}, releasing attachment to how they respond. ({teachings[0]['ref']})

2. **Kshama (Forgiveness) Path**: Forgiveness is YOUR liberation - releasing the weight you carry. It does not mean condoning harm. ({teachings[1]['ref'] if len(teachings) > 1 else teachings[0]['ref']})

3. **Sama-Darshana Path**: See the divine struggling in {rel_context} too. They act from their own wounds and conditioning. ({teachings[2]['ref'] if len(teachings) > 2 else teachings[0]['ref']})""",

        "sacred_speech": f"The Gita teaches ({teachings[3]['ref'] if len(teachings) > 3 else primary['ref']}): Speech should be truthful, pleasant, and beneficial. When ready to speak with {rel_context}, try: 'When [situation], I feel [emotion], because I need [need]. What I'm hoping for is [request].'",

        "detachment_anchor": f"({primary['ref']}): '{primary['text'][:150]}...' Your dharma is to act with integrity; the outcome of this relationship situation is not yours to control. Release attachment to HOW this must resolve.",

        "one_next_step": f"Today, practice witness consciousness ({teachings[1]['ref'] if len(teachings) > 1 else primary['ref']}): When emotions about {rel_context} arise, observe them without becoming them. Say: 'I see you, emotion. I am not you - I am the one who witnesses.'",

        "one_gentle_question": f"If you were at complete peace with yourself - needing nothing from {rel_context} to feel whole - how would you respond to this situation?",
    }

    response_text = "\n\n".join([
        f"# Sacred Acknowledgement\n{sections['sacred_acknowledgement']}",
        f"# Inner Conflict Mirror\n{sections['inner_conflict_mirror']}",
        f"# Gita Teachings Used\n{sections['gita_teachings_used']}",
        f"# Dharma Options\n{sections['dharma_options']}",
        f"# Sacred Speech\n{sections['sacred_speech']}",
        f"# Detachment Anchor\n{sections['detachment_anchor']}",
        f"# One Next Step\n{sections['one_next_step']}",
        f"# One Gentle Question\n{sections['one_gentle_question']}",
    ])

    return {
        "sections": sections,
        "response": response_text,
        "gita_verses_used": len(teachings),
        "verses": teachings,
    }


def get_verses_count() -> int:
    """Return the number of verses loaded."""
    return len(GITA_VERSES)


def is_ready() -> bool:
    """Check if the retrieval service is ready."""
    return len(GITA_VERSES) > 0


# =============================================================================
# AI-POWERED ANALYSIS INTEGRATION (v2.0)
# =============================================================================

async def analyze_relationship_with_ai(user_input: str) -> dict[str, any]:
    """
    Analyze relationship dynamics using AI-powered Gita wisdom analyzer.

    REPLACES: RELATIONSHIP_KEYWORDS dictionary matching with OpenAI + Core Wisdom

    Args:
        user_input: User's relationship concern

    Returns:
        Dictionary with AI-analyzed relationship insights grounded in Gita
    """
    try:
        from backend.services.gita_ai_analyzer import get_gita_ai_analyzer

        analyzer = get_gita_ai_analyzer()
        analysis = await analyzer.analyze_relationship(user_input)

        return {
            "relationship_type": analysis.relationship_type,
            "dominant_emotion": analysis.dominant_emotion,
            "dharma_lens": analysis.dharma_lens,
            "primary_verse": analysis.primary_verse,
            "verse_text": analysis.verse_text,
            "core_principle": analysis.core_principle,
            "healing_insight": analysis.healing_insight,
            "action_steps": analysis.action_steps,
            "ai_powered": True,
        }
    except Exception as e:
        logger.warning(f"AI relationship analysis failed, using keyword fallback: {e}")
        return _fallback_relationship_keyword_analysis(user_input)


def _fallback_relationship_keyword_analysis(user_input: str) -> dict[str, any]:
    """Fallback to keyword-based relationship analysis when AI unavailable."""
    input_lower = user_input.lower()

    # Detect relationship type using RELATIONSHIP_KEYWORDS
    detected_type = "other"
    for rel_type, keywords in RELATIONSHIP_KEYWORDS.items():
        if any(kw in input_lower for kw in keywords):
            if rel_type in ["family", "romantic", "friendship", "workplace"]:
                detected_type = rel_type
                break

    # Detect dominant emotion
    emotion_order = ["anger", "hurt", "fear", "guilt", "jealousy", "resentment", "grief"]
    detected_emotion = "confusion"
    for emotion in emotion_order:
        if emotion in RELATIONSHIP_KEYWORDS:
            if any(kw in input_lower for kw in RELATIONSHIP_KEYWORDS[emotion]):
                detected_emotion = emotion
                break

    # Get relevant verse
    verses = search_gita_verses(user_input, tool="relationship_compass", limit=3)
    if verses:
        verse = verses[0]
        verse_ref = f"BG {verse.get('chapter', 6)}.{verse.get('verse', 32)}"
        verse_text = verse.get("english", "")[:200]
    else:
        verse_ref = "BG 6.32"
        verse_text = "One who sees equality everywhere is the highest yogi."

    return {
        "relationship_type": detected_type,
        "dominant_emotion": detected_emotion,
        "dharma_lens": "Every relationship is an opportunity for spiritual growth",
        "primary_verse": verse_ref,
        "verse_text": verse_text,
        "core_principle": "sama-darshana",
        "healing_insight": "See the divine struggling in the other person",
        "action_steps": [
            "Practice witness consciousness",
            "Speak with truth and kindness",
            "Release attachment to outcomes",
        ],
        "ai_powered": False,
    }


async def analyze_emotion_with_ai(
    mood_score: int,
    tags: list[str] | None = None,
    note: str | None = None,
) -> dict[str, any]:
    """
    Analyze emotional state using AI-powered Gita wisdom analyzer.

    REPLACES: Hardcoded emotion categories with OpenAI + Core Wisdom

    Args:
        mood_score: 1-10 mood score
        tags: Optional mood tags
        note: Optional mood note

    Returns:
        Dictionary with AI-analyzed emotional insights grounded in Gita
    """
    try:
        from backend.services.gita_ai_analyzer import get_gita_ai_analyzer

        analyzer = get_gita_ai_analyzer()
        analysis = await analyzer.analyze_emotion(
            mood_score=mood_score,
            tags=tags,
            note=note,
        )

        return {
            "primary_emotion": analysis.primary_emotion,
            "gita_mapping": analysis.gita_mapping,
            "intensity": analysis.intensity,
            "description": analysis.description,
            "recommended_verse": analysis.recommended_verse,
            "verse_text": analysis.verse_text,
            "healing_path": analysis.healing_path,
            "activities": analysis.activities,
            "ai_powered": True,
        }
    except Exception as e:
        logger.warning(f"AI emotion analysis failed, using fallback: {e}")
        return _fallback_emotion_analysis(mood_score, tags or [], note or "")


def _fallback_emotion_analysis(
    mood_score: int,
    tags: list[str],
    note: str,
) -> dict[str, any]:
    """Fallback emotion analysis when AI unavailable."""
    normalized_tags = [t.lower() for t in tags]

    # Simple emotion detection
    if any(t in normalized_tags for t in ["anxious", "stressed", "worried"]):
        emotion = "anxious"
        gita_mapping = "chinta"
    elif mood_score <= 3 or any(t in normalized_tags for t in ["sad", "low", "down"]):
        emotion = "melancholic"
        gita_mapping = "vishada"
    elif mood_score >= 8 and any(t in normalized_tags for t in ["energetic", "excited"]):
        emotion = "energized"
        gita_mapping = "utsaha"
    elif mood_score >= 7:
        emotion = "calm"
        gita_mapping = "shanti"
    else:
        emotion = "balanced"
        gita_mapping = "samatvam"

    return {
        "primary_emotion": emotion,
        "gita_mapping": gita_mapping,
        "intensity": 0.5,
        "description": f"Emotional state indicating {gita_mapping}",
        "recommended_verse": "BG 2.48",
        "verse_text": "Equanimity is called yoga.",
        "healing_path": "Practice witness consciousness",
        "activities": ["Meditation", "Read verses", "Journal"],
        "ai_powered": False,
    }
