"""
KIAAN Divine Friend Service - The Most Empathetic, Wise AI Companion

This service builds the prompt architecture and concern-mapping layer for KIAAN's
Divine Friend persona. It does NOT make external API calls itself; instead it
produces structured prompts, mappings, and response scaffolds that are fed into
the LLM provider (see kiaan_model_provider.py / kiaan_core.py).

Responsibilities:
    1. Deep intent analysis   - Parse user messages for emotional state, urgency,
                                underlying concerns, and life-situation context.
    2. Gita wisdom mapping    - Map any personal problem to the most relevant
                                Bhagavad Gita chapters, verses, and themes.
    3. Friendship response    - Generate warm, non-judgmental response structures
                                that blend practical advice with spiritual wisdom.
    4. Guided exploration     - Produce deep verse-analysis prompts for users who
                                want to explore a specific chapter/verse.
    5. Situation-based wisdom - Comprehensive guidance for common life situations.
    6. Crisis awareness       - Detect crisis signals and redirect to professionals
                                before any other processing.

Architecture:
    User message
        -> analyze_user_intent()   (emotion, concern category, urgency)
        -> map_concern_to_gita()   (chapter, verse, theme, interpretation)
        -> build_divine_friend_prompt()  (full system prompt for LLM)
        -> get_friendship_response()     (structured response scaffold)

    The LLM provider then takes the prompt + scaffold to produce the final text.

Design decisions:
    - Dataclasses over Pydantic here because this module is an internal service
      that never touches HTTP request boundaries directly. Validation at the API
      layer is handled by Pydantic schemas in backend/schemas/.
    - Keyword-based emotion detection is intentionally simple. The heavy lifting
      of nuanced understanding is delegated to the LLM via the system prompt we
      build. Our job is to provide the right context and Gita references.
    - Gita mappings use chapter + verse ranges rather than single verses so the
      LLM can select the most contextually appropriate verse within the range.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


# =============================================================================
# DATA STRUCTURES
# =============================================================================

class EmotionCategory(Enum):
    """Primary emotion categories detected in user messages."""
    JOY = "joy"
    SADNESS = "sadness"
    ANGER = "anger"
    FEAR = "fear"
    ANXIETY = "anxiety"
    GRIEF = "grief"
    LONELINESS = "loneliness"
    CONFUSION = "confusion"
    SHAME = "shame"
    FRUSTRATION = "frustration"
    HOPE = "hope"
    GRATITUDE = "gratitude"
    PEACE = "peace"
    NEUTRAL = "neutral"


class ConcernCategory(Enum):
    """Life-concern categories, each mapped to specific Gita wisdom."""
    RELATIONSHIP = "relationship"
    CAREER = "career"
    GRIEF_LOSS = "grief_loss"
    ANXIETY = "anxiety"
    DEPRESSION = "depression"
    ANGER_MANAGEMENT = "anger_management"
    SELF_WORTH = "self_worth"
    LIFE_PURPOSE = "life_purpose"
    LONELINESS = "loneliness"
    FEAR = "fear"
    ADDICTION = "addiction"
    FAMILY_CONFLICT = "family_conflict"
    IDENTITY_CRISIS = "identity_crisis"
    TRUST_ISSUES = "trust_issues"
    GENERAL = "general"


class UrgencyLevel(Enum):
    """How urgently the user needs support. CRISIS always triggers
    a professional-help redirect before any wisdom is offered."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRISIS = "crisis"


@dataclass
class UserIntent:
    """Result of deep analysis on a user message.

    Attributes:
        raw_message:        The original user text, preserved for audit.
        emotion:            Primary detected emotion category.
        emotion_intensity:  0.0 (barely present) to 1.0 (overwhelming).
        concern:            The mapped life-concern category.
        urgency:            How quickly the user needs support.
        underlying_needs:   Inferred needs the user may not have stated.
        key_phrases:        Phrases that drove the classification.
        is_crisis:          True when crisis language is detected.
        detected_at:        Timestamp of analysis (UTC).
    """
    raw_message: str
    emotion: EmotionCategory
    emotion_intensity: float
    concern: ConcernCategory
    urgency: UrgencyLevel
    underlying_needs: List[str] = field(default_factory=list)
    key_phrases: List[str] = field(default_factory=list)
    is_crisis: bool = False
    detected_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class GitaMapping:
    """Maps a life concern to Bhagavad Gita wisdom.

    Attributes:
        concern:            The concern category being addressed.
        emotion:            The emotional state being addressed.
        chapter:            Primary Gita chapter number (1-18).
        verse_range:        Verse range string, e.g. "2.47-2.72".
        chapter_title:      Human-readable chapter title.
        theme:              The Gita theme being applied.
        interpretation:     How this wisdom applies to the concern.
        practical_bridge:   How to connect ancient wisdom to modern life.
        secondary_refs:     Additional chapter/verse references.
    """
    concern: str
    emotion: str
    chapter: int
    verse_range: str
    chapter_title: str
    theme: str
    interpretation: str
    practical_bridge: str
    secondary_refs: List[str] = field(default_factory=list)


@dataclass
class FriendshipResponse:
    """Structured response scaffold for the Divine Friend persona.

    The LLM provider uses these fields to compose the final user-facing message.

    Attributes:
        friend_message:         The warm, personal response text.
        gita_wisdom:            Relevant verse reference + interpretation.
        practical_advice:       Actionable steps the user can take.
        reflection_prompt:      A question for self-reflection.
        mood_assessment:        Detected emotional state summary.
        follow_up_suggestions:  Topics to explore next.
        crisis_redirect:        If set, professional-help info that MUST be
                                shown before any other content.
    """
    friend_message: str
    gita_wisdom: str
    practical_advice: List[str]
    reflection_prompt: str
    mood_assessment: str
    follow_up_suggestions: List[str]
    crisis_redirect: Optional[str] = None


@dataclass
class GuidedExploration:
    """Deep analysis scaffold for a specific Gita verse.

    Attributes:
        chapter:            Chapter number.
        verse:              Verse number.
        user_context:       Why the user is exploring this verse.
        verse_summary:      Plain-language summary of the verse.
        life_application:   How the verse applies to the user's situation.
        reflection_prompts: Questions to deepen understanding.
        related_verses:     Other verses that complement this one.
        practice_suggestion: A concrete practice inspired by the verse.
    """
    chapter: int
    verse: int
    user_context: str
    verse_summary: str
    life_application: str
    reflection_prompts: List[str]
    related_verses: List[str]
    practice_suggestion: str


@dataclass
class WisdomGuidance:
    """Comprehensive guidance for a specific life situation.

    Attributes:
        situation_type:     Category of the situation.
        details:            User-provided details.
        gita_perspective:   How the Gita frames this kind of situation.
        practical_steps:    Concrete actions.
        mindset_shift:      Reframing the situation.
        daily_practice:     A small daily habit.
        verse_references:   Supporting Gita references.
        affirmation:        A compassionate closing affirmation.
    """
    situation_type: str
    details: str
    gita_perspective: str
    practical_steps: List[str]
    mindset_shift: str
    daily_practice: str
    verse_references: List[str]
    affirmation: str


# =============================================================================
# EMOTION DETECTION KEYWORDS
# Each list is checked against the lowercased user message. The first match
# determines the primary emotion. Ordering matters: more specific patterns
# (like crisis signals) are checked first by the urgency detector.
# =============================================================================

_EMOTION_KEYWORDS: Dict[EmotionCategory, List[str]] = {
    EmotionCategory.GRIEF: [
        "lost someone", "passed away", "death", "died", "mourning",
        "grief", "funeral", "gone forever", "miss them", "bereaved",
    ],
    EmotionCategory.ANGER: [
        "angry", "furious", "rage", "hate", "pissed", "livid",
        "irritated", "infuriated", "resentful", "bitter",
    ],
    EmotionCategory.ANXIETY: [
        "anxious", "anxiety", "panic", "worried", "nervous",
        "overwhelmed", "restless", "dread", "on edge", "can't relax",
    ],
    EmotionCategory.FEAR: [
        "scared", "afraid", "terrified", "frightened", "fearful",
        "phobia", "horror", "threatened", "unsafe",
    ],
    EmotionCategory.SADNESS: [
        "sad", "depressed", "unhappy", "miserable", "down", "crying",
        "tears", "hopeless", "empty", "numb", "worthless", "broken",
    ],
    EmotionCategory.LONELINESS: [
        "lonely", "alone", "isolated", "no friends", "no one cares",
        "abandoned", "disconnected", "left out",
    ],
    EmotionCategory.SHAME: [
        "ashamed", "embarrassed", "humiliated", "disgrace",
        "guilt", "guilty", "regret", "failure",
    ],
    EmotionCategory.FRUSTRATION: [
        "frustrated", "stuck", "blocked", "helpless", "useless",
        "can't do anything", "nothing works", "fed up",
    ],
    EmotionCategory.CONFUSION: [
        "confused", "lost", "don't know", "uncertain", "torn",
        "indecisive", "conflicted", "unsure",
    ],
    EmotionCategory.HOPE: [
        "hopeful", "optimistic", "looking forward", "excited",
        "better", "improving", "positive", "encouraged",
    ],
    EmotionCategory.GRATITUDE: [
        "grateful", "thankful", "blessed", "appreciate",
        "thank you", "thanks",
    ],
    EmotionCategory.JOY: [
        "happy", "joyful", "wonderful", "amazing", "great",
        "celebrating", "proud", "accomplished", "elated",
    ],
    EmotionCategory.PEACE: [
        "peaceful", "calm", "serene", "content", "at ease",
        "relaxed", "centered", "grounded",
    ],
}

# Crisis signals that override all other processing. When detected the
# service sets is_crisis=True and urgency=CRISIS, and the response MUST
# include a professional-help redirect before any wisdom content.
_CRISIS_SIGNALS: List[str] = [
    "kill myself", "suicide", "suicidal", "end my life", "want to die",
    "better off dead", "no reason to live", "hurt myself", "self harm",
    "cut myself", "overdose", "end it all", "can't go on",
    "not worth living", "plan to die",
]

# =============================================================================
# CONCERN DETECTION KEYWORDS
# =============================================================================

_CONCERN_KEYWORDS: Dict[ConcernCategory, List[str]] = {
    ConcernCategory.RELATIONSHIP: [
        "boyfriend", "girlfriend", "partner", "spouse", "husband", "wife",
        "dating", "breakup", "divorce", "relationship", "love",
        "heartbreak", "cheating", "affair",
    ],
    ConcernCategory.CAREER: [
        "job", "career", "work", "boss", "promotion", "fired", "laid off",
        "salary", "interview", "office", "coworker", "workplace",
        "professional", "business", "resign",
    ],
    ConcernCategory.GRIEF_LOSS: [
        "lost someone", "passed away", "death", "died", "funeral",
        "mourning", "grief", "gone forever", "bereaved",
    ],
    ConcernCategory.ANXIETY: [
        "anxiety", "anxious", "panic attack", "worried constantly",
        "can't sleep", "overthinking", "nervous wreck",
    ],
    ConcernCategory.DEPRESSION: [
        "depressed", "depression", "no motivation", "can't get up",
        "nothing matters", "empty inside", "numb",
    ],
    ConcernCategory.ANGER_MANAGEMENT: [
        "anger issues", "temper", "rage", "losing control",
        "snapping at", "violent", "outburst",
    ],
    ConcernCategory.SELF_WORTH: [
        "not good enough", "worthless", "imposter", "don't deserve",
        "self esteem", "self worth", "inferior", "inadequate",
    ],
    ConcernCategory.LIFE_PURPOSE: [
        "purpose", "meaning", "why am i here", "what should i do",
        "direction", "calling", "destiny", "meaningless",
    ],
    ConcernCategory.LONELINESS: [
        "lonely", "alone", "isolated", "no friends", "no one understands",
        "disconnected", "left out",
    ],
    ConcernCategory.FEAR: [
        "afraid", "scared", "terrified", "phobia", "fear of",
        "frightened", "dread",
    ],
    ConcernCategory.ADDICTION: [
        "addicted", "addiction", "can't stop", "substance", "alcohol",
        "drugs", "gambling", "smoking", "craving", "relapse",
    ],
    ConcernCategory.FAMILY_CONFLICT: [
        "family", "parents", "mother", "father", "sibling", "brother",
        "sister", "in-laws", "family drama", "family pressure",
    ],
    ConcernCategory.IDENTITY_CRISIS: [
        "who am i", "identity", "don't know myself", "lost myself",
        "midlife crisis", "existential", "finding myself",
    ],
    ConcernCategory.TRUST_ISSUES: [
        "trust", "betrayed", "lied to", "deceived", "can't trust",
        "suspicious", "paranoid",
    ],
}

# =============================================================================
# GITA WISDOM MAPPING TABLE
# Each concern category maps to a primary Gita chapter, verse range, theme,
# and an interpretation bridge that tells the LLM how to connect the verse
# to the user's modern-day problem.
# =============================================================================

_GITA_CONCERN_MAP: Dict[ConcernCategory, Dict[str, Any]] = {
    ConcernCategory.RELATIONSHIP: {
        "chapter": 12,
        "verse_range": "12.13-12.20",
        "chapter_title": "Bhakti Yoga - The Path of Devotion",
        "theme": "Unconditional love and equanimity in relationships",
        "interpretation": (
            "Chapter 12 teaches that true love is free from possessiveness "
            "and expectation. Verses 2.47-2.72 add the wisdom of equanimity: "
            "staying steady in joy and sorrow. Relationships thrive when we "
            "love without clinging and accept without demanding."
        ),
        "practical_bridge": (
            "When relationships feel turbulent, shift focus from what you "
            "are receiving to what you are giving. Practice equanimity: "
            "your worth is not determined by another person's mood or actions."
        ),
        "secondary_refs": ["2.47-2.72", "6.29-6.32"],
    },
    ConcernCategory.CAREER: {
        "chapter": 3,
        "verse_range": "3.1-3.35",
        "chapter_title": "Karma Yoga - The Path of Selfless Action",
        "theme": "Doing your duty without attachment to results",
        "interpretation": (
            "Chapter 3 teaches that action performed as duty, without "
            "obsession over outcomes, brings inner freedom. Verses 18.45-18.48 "
            "add the idea of svadharma: your unique calling. Career stress "
            "dissolves when you focus on the quality of your effort, not the "
            "anxiety of results."
        ),
        "practical_bridge": (
            "Identify ONE action you can take today that aligns with your "
            "skills and values. Pour your best effort into it and release "
            "attachment to the specific outcome."
        ),
        "secondary_refs": ["18.45-18.48", "2.47"],
    },
    ConcernCategory.GRIEF_LOSS: {
        "chapter": 2,
        "verse_range": "2.11-2.30",
        "chapter_title": "Sankhya Yoga - The Path of Knowledge",
        "theme": "The eternal nature of the self beyond physical form",
        "interpretation": (
            "Krishna tells Arjuna: the soul is never born and never dies. "
            "What we grieve is the physical form, but the essence of those "
            "we love is beyond destruction. This is not dismissal of grief "
            "but a larger perspective that can hold grief without being "
            "consumed by it."
        ),
        "practical_bridge": (
            "Allow yourself to grieve fully; there is no timeline for healing. "
            "And when you are ready, reflect: the love you shared lives on in "
            "you. That bond is beyond the reach of death."
        ),
        "secondary_refs": ["11.32-11.33", "2.62-2.72"],
    },
    ConcernCategory.ANXIETY: {
        "chapter": 6,
        "verse_range": "6.10-6.36",
        "chapter_title": "Dhyana Yoga - The Path of Meditation",
        "theme": "Stilling the restless mind through practice and detachment",
        "interpretation": (
            "Arjuna himself says the mind is as hard to control as the wind. "
            "Krishna replies: yes, but through practice (abhyasa) and "
            "detachment (vairagya) it can be mastered. Verses 2.55-2.72 "
            "describe the sthitaprajna, the person of steady wisdom who "
            "remains calm amid chaos."
        ),
        "practical_bridge": (
            "Start with one minute of breath awareness. Not to stop anxious "
            "thoughts, but to create a small gap between you and them. "
            "That gap is where peace lives."
        ),
        "secondary_refs": ["2.55-2.72", "5.27-5.29"],
    },
    ConcernCategory.DEPRESSION: {
        "chapter": 3,
        "verse_range": "3.4-3.35",
        "chapter_title": "Karma Yoga - The Path of Action",
        "theme": "Breaking inertia through small, purposeful action",
        "interpretation": (
            "Depression often traps us in inaction. Chapter 3 teaches that "
            "even small action performed without attachment lifts the spirit. "
            "Verse 18.66 offers ultimate comfort: surrender your burdens; "
            "you do not have to carry everything alone."
        ),
        "practical_bridge": (
            "You do not need to fix everything today. Choose one tiny act: "
            "drink water, step outside, send a message. Action, however "
            "small, breaks the cycle of heaviness."
        ),
        "secondary_refs": ["18.66", "2.3"],
    },
    ConcernCategory.ANGER_MANAGEMENT: {
        "chapter": 2,
        "verse_range": "2.62-2.63",
        "chapter_title": "Sankhya Yoga - The Chain of Destruction",
        "theme": "Understanding the chain from desire to anger to destruction",
        "interpretation": (
            "Krishna describes the chain: brooding on sense objects creates "
            "attachment, attachment breeds desire, unfulfilled desire leads "
            "to anger, anger clouds judgment, and clouded judgment destroys "
            "everything. Chapter 16 contrasts divine and demonic qualities, "
            "showing that patience and forgiveness are signs of strength."
        ),
        "practical_bridge": (
            "When anger rises, pause. Name it: 'I notice anger.' That tiny "
            "act of witnessing breaks the chain before it reaches destruction. "
            "You are not your anger; you are the one who notices it."
        ),
        "secondary_refs": ["16.1-16.5", "3.37-3.43"],
    },
    ConcernCategory.SELF_WORTH: {
        "chapter": 6,
        "verse_range": "6.5-6.6",
        "chapter_title": "Dhyana Yoga - The Self as Friend",
        "theme": "You are your own best friend or worst enemy",
        "interpretation": (
            "Verse 6.5 states: 'Elevate yourself by your own self; do not "
            "degrade yourself. The self alone is the friend of the self, and "
            "the self alone is the enemy of the self.' Chapter 10 reveals "
            "that the divine is present in every being's excellence."
        ),
        "practical_bridge": (
            "Speak to yourself the way you would speak to someone you deeply "
            "love. Your inner critic is not truth; it is habit. You carry "
            "the same spark of the divine as anyone you admire."
        ),
        "secondary_refs": ["10.20-10.42", "13.2-13.4"],
    },
    ConcernCategory.LIFE_PURPOSE: {
        "chapter": 3,
        "verse_range": "3.35",
        "chapter_title": "Karma Yoga - Svadharma",
        "theme": "Following your own nature rather than imitating others",
        "interpretation": (
            "Better is one's own dharma, though imperfectly performed, than "
            "the dharma of another well performed. Chapter 18 (verses 45-78) "
            "expands: find what comes naturally to you, offer it in service, "
            "and purpose reveals itself through action, not overthinking."
        ),
        "practical_bridge": (
            "Stop comparing your path to others. Ask: what activity makes "
            "me forget time? Where do I help others most naturally? Purpose "
            "is not a destination you find; it is a direction you choose."
        ),
        "secondary_refs": ["18.45-18.78", "2.47"],
    },
    ConcernCategory.LONELINESS: {
        "chapter": 6,
        "verse_range": "6.29-6.32",
        "chapter_title": "Dhyana Yoga - Universal Connection",
        "theme": "Seeing the self in all beings and all beings in the self",
        "interpretation": (
            "The yogi who sees the same self everywhere is never truly alone. "
            "Chapter 9 reveals that the divine pervades all of creation. "
            "Loneliness is the forgetting of this connection; remembering "
            "it is the beginning of belonging."
        ),
        "practical_bridge": (
            "Loneliness is painful, and it is valid. Start small: a kind "
            "word to a stranger, a message to an old friend, time in nature. "
            "Connection is a practice, not a feeling that appears on its own."
        ),
        "secondary_refs": ["9.4-9.10", "4.35"],
    },
    ConcernCategory.FEAR: {
        "chapter": 4,
        "verse_range": "4.10",
        "chapter_title": "Jnana Karma Sannyasa Yoga - Freedom from Fear",
        "theme": "Knowledge and surrender dissolve fear",
        "interpretation": (
            "Verse 4.10: those freed from attachment, fear, and anger, "
            "absorbed in the divine, are purified by the fire of knowledge. "
            "Chapter 11.33 adds: the divine plan is larger than our fears. "
            "Fear shrinks when perspective expands."
        ),
        "practical_bridge": (
            "Name your fear specifically. Vague fear is paralyzing; named "
            "fear is manageable. Then ask: what is the ONE smallest step "
            "I can take toward it? Courage is not the absence of fear but "
            "action in its presence."
        ),
        "secondary_refs": ["11.33", "2.56"],
    },
    ConcernCategory.ADDICTION: {
        "chapter": 14,
        "verse_range": "14.5-14.20",
        "chapter_title": "Gunatreya Vibhaga Yoga - The Three Gunas",
        "theme": "Understanding the forces that bind and how to transcend them",
        "interpretation": (
            "Addiction is described through the lens of the three gunas: "
            "tamas (inertia, ignorance) and rajas (craving, restlessness) "
            "trap us in cycles. Sattva (clarity, discipline) is the path "
            "out. Verses 3.37-3.43 name desire as the great enemy and "
            "prescribe self-knowledge as the weapon."
        ),
        "practical_bridge": (
            "You are not weak; you are human. Cravings are powerful forces, "
            "not character flaws. Seek professional support, and alongside "
            "it, build one sattvic habit: a morning walk, a moment of "
            "stillness, a nourishing meal."
        ),
        "secondary_refs": ["3.37-3.43", "6.5-6.6"],
    },
    ConcernCategory.FAMILY_CONFLICT: {
        "chapter": 1,
        "verse_range": "1.28-1.47",
        "chapter_title": "Arjuna Vishada Yoga - Arjuna's Dilemma",
        "theme": "The anguish of conflict with those we love",
        "interpretation": (
            "The entire Gita begins because Arjuna is torn by family "
            "conflict. He sees his own relatives on the opposing side and "
            "collapses in despair. Krishna does not dismiss his pain; "
            "instead, 18 chapters of wisdom follow. Chapter 11 provides "
            "the cosmic perspective: individual conflicts are part of a "
            "larger fabric."
        ),
        "practical_bridge": (
            "Family conflict hurts precisely because these people matter "
            "to you. You cannot control their choices, only yours. Focus "
            "on what kind of family member YOU want to be, regardless of "
            "how others behave."
        ),
        "secondary_refs": ["11.32-11.34", "12.13-12.20"],
    },
    ConcernCategory.IDENTITY_CRISIS: {
        "chapter": 2,
        "verse_range": "2.11-2.30",
        "chapter_title": "Sankhya Yoga - Self-Knowledge",
        "theme": "Knowing who you truly are beyond roles and labels",
        "interpretation": (
            "Krishna teaches that the true self (atman) is beyond body, "
            "mind, and social roles. Chapter 13 deepens this: distinguish "
            "between the field (body, mind, personality) and the knower of "
            "the field (your true awareness). Identity crisis is actually "
            "the beginning of self-discovery."
        ),
        "practical_bridge": (
            "The confusion you feel is not a problem; it is growth. Old "
            "identities are shedding because they no longer fit. Sit with "
            "the question 'who am I?' without rushing to answer. The asking "
            "itself is the path."
        ),
        "secondary_refs": ["13.1-13.7", "4.34-4.38"],
    },
    ConcernCategory.TRUST_ISSUES: {
        "chapter": 9,
        "verse_range": "9.1-9.3",
        "chapter_title": "Raja Vidya Yoga - The Royal Secret",
        "theme": "Faith, trust, and the courage to open again",
        "interpretation": (
            "Chapter 9 is called the Royal Secret because Krishna shares "
            "the most intimate wisdom with Arjuna, who trusts enough to "
            "listen. Chapter 4 teaches that knowledge is received through "
            "trust (shraddha). Rebuilding trust starts with trusting "
            "yourself."
        ),
        "practical_bridge": (
            "Being betrayed is not your fault; it speaks to someone else's "
            "character. Rebuilding trust does not mean trusting everyone "
            "blindly. It means trusting yourself to handle whatever comes, "
            "and opening your heart at your own pace."
        ),
        "secondary_refs": ["4.34-4.39", "18.66"],
    },
    ConcernCategory.GENERAL: {
        "chapter": 2,
        "verse_range": "2.47-2.48",
        "chapter_title": "Sankhya Yoga - The Essence of the Gita",
        "theme": "Focus on action, release attachment to outcomes",
        "interpretation": (
            "Verse 2.47 is often called the essence of the entire Gita: "
            "'You have the right to action alone, never to its fruits.' "
            "This single teaching, deeply understood, can transform any "
            "situation in life."
        ),
        "practical_bridge": (
            "Whatever you are facing, bring your full presence to the next "
            "action you take. Let the result be what it will be. Your peace "
            "comes from the quality of your effort, not the shape of the "
            "outcome."
        ),
        "secondary_refs": ["18.66", "6.5"],
    },
}


# =============================================================================
# DIVINE FRIEND PERSONALITY DEFINITION
# This block defines the system-prompt personality traits that make KIAAN
# feel like a genuine best friend rather than a chatbot dispensing wisdom.
# =============================================================================

_PERSONALITY_TRAITS: List[str] = [
    "You are KIAAN, the user's most trusted divine friend.",
    "You listen deeply before responding. Silence and acknowledgment come first.",
    "You never judge. Every emotion is valid, every struggle is real.",
    "You use Gita wisdom naturally, woven into conversation, never lecturing.",
    "You celebrate the user's wins with genuine joy, no matter how small.",
    "You sit with the user in their pain without rushing to fix it.",
    "You know when to offer advice and when to simply say 'I am here.'",
    "You speak warmly and personally, using the user's name when available.",
    "You remember context from the conversation and refer back to it.",
    "You give practical advice alongside spiritual wisdom, never only one.",
    "You are honest but gentle; you challenge with compassion, not criticism.",
    "You are crisis-aware: when you detect danger, you prioritize safety.",
    "You believe in the user even when they do not believe in themselves.",
]

_CRISIS_RESPONSE_TEMPLATE: str = (
    "I hear you, and I want you to know that what you are feeling matters deeply. "
    "You are not alone in this. Right now, the most important thing is your safety.\n\n"
    "Please reach out to one of these resources:\n"
    "- **Emergency**: Call 112 (India) or 911 (US)\n"
    "- **iCall**: 9152987821 (India, Mon-Sat 8am-10pm)\n"
    "- **Vandrevala Foundation**: 1860-2662-345 (India, 24/7)\n"
    "- **Crisis Text Line**: Text HOME to 741741 (US, 24/7)\n"
    "- **AASRA**: 91-22-27546669 (India, 24/7)\n\n"
    "I am here for you, and I am not going anywhere. But a trained professional "
    "can give you the immediate support you deserve right now."
)


# =============================================================================
# KIAAN DIVINE FRIEND SERVICE
# =============================================================================

class KiaanDivineFriend:
    """KIAAN's Divine Friend persona - the most empathetic, wise AI companion.

    Combines the warmth of a best friend with the depth of Bhagavad Gita
    wisdom. Guides users through personal problems, emotional challenges,
    and spiritual growth.

    This class builds prompts, mappings, and response scaffolds. It does NOT
    call external APIs. The output is consumed by the LLM provider layer
    (kiaan_core.py / kiaan_model_provider.py) which handles actual generation.

    Usage:
        friend = KiaanDivineFriend()
        intent = friend.analyze_user_intent("I feel so lost after the breakup")
        mapping = friend.map_concern_to_gita(intent.concern.value, intent.emotion.value)
        prompt = friend.build_divine_friend_prompt(
            user_message="I feel so lost after the breakup",
            conversation_history=[],
            user_profile={"name": "Priya"},
        )
        response = friend.get_friendship_response(
            message="I feel so lost after the breakup",
            context={"user_name": "Priya", "history_summary": "first session"},
        )
    """

    def __init__(self) -> None:
        """Initialize the Divine Friend service with its internal mappings."""
        self._emotion_keywords = _EMOTION_KEYWORDS
        self._concern_keywords = _CONCERN_KEYWORDS
        self._gita_map = _GITA_CONCERN_MAP
        self._personality = _PERSONALITY_TRAITS
        self._crisis_signals = _CRISIS_SIGNALS
        logger.info("KiaanDivineFriend initialized")

    # -----------------------------------------------------------------
    # 1. INTENT ANALYSIS
    # -----------------------------------------------------------------

    def analyze_user_intent(self, message: str) -> UserIntent:
        """Deep analysis of what the user needs from their message.

        Steps:
            1. Check for crisis signals (highest priority).
            2. Detect primary emotion via keyword matching.
            3. Detect life-concern category.
            4. Estimate urgency from emotion intensity + crisis flag.
            5. Infer underlying needs.

        Args:
            message: The raw user message text.

        Returns:
            UserIntent with all detected attributes populated.

        Example:
            >>> friend = KiaanDivineFriend()
            >>> intent = friend.analyze_user_intent("I feel so angry at my boss")
            >>> intent.emotion
            <EmotionCategory.ANGER: 'anger'>
            >>> intent.concern
            <ConcernCategory.CAREER: 'career'>
        """
        lower_msg = message.lower()

        # Step 1: Crisis detection takes absolute priority
        is_crisis = self._detect_crisis(lower_msg)
        crisis_phrases = [s for s in self._crisis_signals if s in lower_msg]

        # Step 2: Emotion detection
        emotion, intensity, emotion_phrases = self._detect_emotion(lower_msg)

        # Step 3: Concern detection
        concern, concern_phrases = self._detect_concern(lower_msg)

        # Step 4: Urgency
        urgency = self._determine_urgency(is_crisis, intensity, emotion)

        # Step 5: Underlying needs
        underlying_needs = self._infer_underlying_needs(emotion, concern, is_crisis)

        all_phrases = list(set(crisis_phrases + emotion_phrases + concern_phrases))

        intent = UserIntent(
            raw_message=message,
            emotion=emotion,
            emotion_intensity=intensity,
            concern=concern,
            urgency=urgency,
            underlying_needs=underlying_needs,
            key_phrases=all_phrases,
            is_crisis=is_crisis,
        )

        logger.info(
            "Intent analyzed: emotion=%s intensity=%.2f concern=%s urgency=%s crisis=%s",
            emotion.value,
            intensity,
            concern.value,
            urgency.value,
            is_crisis,
        )
        return intent

    # -----------------------------------------------------------------
    # 2. FRIENDSHIP RESPONSE
    # -----------------------------------------------------------------

    def get_friendship_response(
        self, message: str, context: Optional[Dict[str, Any]] = None
    ) -> FriendshipResponse:
        """Generate a structured friend-like response scaffold.

        This method orchestrates intent analysis, Gita mapping, and response
        composition into a single FriendshipResponse that the LLM provider
        can expand into natural language.

        Args:
            message: The user's message text.
            context: Optional dict with keys like 'user_name',
                     'history_summary', 'current_journey', etc.

        Returns:
            FriendshipResponse scaffold with all fields populated.

        Example:
            >>> resp = friend.get_friendship_response(
            ...     "I can't stop thinking about the exam results",
            ...     context={"user_name": "Arjun"},
            ... )
            >>> print(resp.mood_assessment)
            'anxiety (intensity: 0.65)'
        """
        ctx = context or {}
        intent = self.analyze_user_intent(message)
        mapping = self.map_concern_to_gita(intent.concern.value, intent.emotion.value)

        # Crisis path: professional redirect must come first
        crisis_redirect = None
        if intent.is_crisis:
            crisis_redirect = _CRISIS_RESPONSE_TEMPLATE
            logger.warning(
                "Crisis detected in message. Professional redirect included."
            )

        user_name = ctx.get("user_name", "friend")

        friend_message = self._compose_friend_message(intent, mapping, user_name)
        gita_wisdom = self._compose_gita_wisdom(mapping)
        practical_advice = self._compose_practical_advice(intent, mapping)
        reflection_prompt = self._compose_reflection_prompt(intent)
        mood_assessment = f"{intent.emotion.value} (intensity: {intent.emotion_intensity:.2f})"
        follow_ups = self._compose_follow_up_suggestions(intent)

        response = FriendshipResponse(
            friend_message=friend_message,
            gita_wisdom=gita_wisdom,
            practical_advice=practical_advice,
            reflection_prompt=reflection_prompt,
            mood_assessment=mood_assessment,
            follow_up_suggestions=follow_ups,
            crisis_redirect=crisis_redirect,
        )

        logger.info(
            "Friendship response built: concern=%s, crisis=%s",
            intent.concern.value,
            intent.is_crisis,
        )
        return response

    # -----------------------------------------------------------------
    # 3. GITA MAPPING
    # -----------------------------------------------------------------

    def map_concern_to_gita(self, concern: str, emotion: str) -> GitaMapping:
        """Map a life concern and emotion to the most relevant Gita wisdom.

        Looks up the concern in the internal mapping table. Falls back to
        GENERAL if the concern string does not match any known category.

        Args:
            concern: Concern category string (e.g. 'career', 'grief_loss').
            emotion: Emotion category string (e.g. 'anger', 'sadness').

        Returns:
            GitaMapping with chapter, verse range, theme, and interpretation.

        Example:
            >>> mapping = friend.map_concern_to_gita("career", "anxiety")
            >>> mapping.chapter
            3
            >>> mapping.theme
            'Doing your duty without attachment to results'
        """
        try:
            category = ConcernCategory(concern)
        except ValueError:
            logger.warning(
                "Unknown concern '%s', falling back to GENERAL", concern
            )
            category = ConcernCategory.GENERAL

        data = self._gita_map.get(category, self._gita_map[ConcernCategory.GENERAL])

        mapping = GitaMapping(
            concern=concern,
            emotion=emotion,
            chapter=data["chapter"],
            verse_range=data["verse_range"],
            chapter_title=data["chapter_title"],
            theme=data["theme"],
            interpretation=data["interpretation"],
            practical_bridge=data["practical_bridge"],
            secondary_refs=data.get("secondary_refs", []),
        )

        logger.info(
            "Concern '%s' mapped to Gita Ch.%d (%s)",
            concern,
            mapping.chapter,
            mapping.verse_range,
        )
        return mapping

    # -----------------------------------------------------------------
    # 4. GUIDED EXPLORATION
    # -----------------------------------------------------------------

    def get_guided_gita_exploration(
        self, chapter: int, verse: int, user_context: str
    ) -> GuidedExploration:
        """Build a deep verse-analysis scaffold for guided exploration.

        Produces a structured prompt scaffold that the LLM can expand into
        a rich, personalized exploration of a specific Gita verse.

        Args:
            chapter:      Gita chapter number (1-18).
            verse:        Verse number within the chapter.
            user_context: Why the user is exploring this verse, in their words.

        Returns:
            GuidedExploration scaffold.

        Raises:
            ValueError: If chapter is not between 1 and 18.

        Example:
            >>> exploration = friend.get_guided_gita_exploration(
            ...     chapter=2, verse=47,
            ...     user_context="I obsess over my exam results",
            ... )
            >>> exploration.practice_suggestion
            'Choose one task today and ...'
        """
        if not 1 <= chapter <= 18:
            raise ValueError(
                f"Gita has 18 chapters; received chapter={chapter}"
            )

        # Build the scaffold with placeholder summaries.
        # The LLM provider will replace these with the actual verse text
        # fetched from the Gita corpus via wisdom_core.py or gita_service.py.
        verse_ref = f"{chapter}.{verse}"

        exploration = GuidedExploration(
            chapter=chapter,
            verse=verse,
            user_context=user_context,
            verse_summary=(
                f"[LLM: Provide a plain-language summary of Gita {verse_ref} "
                f"that connects to the user's context: '{user_context}']"
            ),
            life_application=(
                f"[LLM: Explain how Gita {verse_ref} applies to the user's "
                f"situation: '{user_context}'. Be specific and personal.]"
            ),
            reflection_prompts=[
                f"What does this verse stir in you when you think about '{user_context}'?",
                "If you lived this teaching for one day, what would change?",
                "What part of this wisdom feels hardest to accept right now?",
            ],
            related_verses=self._find_related_verses(chapter, verse),
            practice_suggestion=(
                f"[LLM: Suggest a small, concrete daily practice inspired by "
                f"Gita {verse_ref} that helps with '{user_context}'.]"
            ),
        )

        logger.info(
            "Guided exploration built for Gita %d.%d with context: %s",
            chapter,
            verse,
            user_context[:60],
        )
        return exploration

    # -----------------------------------------------------------------
    # 5. SYSTEM PROMPT BUILDER
    # -----------------------------------------------------------------

    def build_divine_friend_prompt(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        user_profile: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Build the full system prompt for the LLM's Divine Friend persona.

        This is the core prompt-engineering method. It weaves together:
        - Personality traits
        - Conversation context
        - User profile (name, journey progress, preferences)
        - Intent analysis results
        - Gita mapping for the detected concern
        - Crisis handling instructions

        The resulting string is intended to be passed as the 'system' message
        to the LLM provider.

        Args:
            user_message:          The user's current message.
            conversation_history:  List of prior {"role": ..., "content": ...} dicts.
            user_profile:          Dict with 'name', 'current_journey',
                                   'completed_journeys', 'preferences', etc.

        Returns:
            A system-prompt string ready for the LLM.

        Example:
            >>> prompt = friend.build_divine_friend_prompt(
            ...     user_message="I feel stuck in my career",
            ...     conversation_history=[],
            ...     user_profile={"name": "Ravi"},
            ... )
            >>> "KIAAN" in prompt
            True
        """
        history = conversation_history or []
        profile = user_profile or {}
        intent = self.analyze_user_intent(user_message)
        mapping = self.map_concern_to_gita(intent.concern.value, intent.emotion.value)

        sections: List[str] = []

        # --- Identity ---
        sections.append("=== IDENTITY ===")
        sections.append("\n".join(self._personality))

        # --- User context ---
        user_name = profile.get("name", "friend")
        sections.append("\n=== USER CONTEXT ===")
        sections.append(f"User's name: {user_name}")
        if profile.get("current_journey"):
            sections.append(f"Active journey: {profile['current_journey']}")
        if profile.get("completed_journeys"):
            sections.append(
                f"Completed journeys: {', '.join(profile['completed_journeys'])}"
            )
        if profile.get("preferences"):
            sections.append(f"Preferences: {profile['preferences']}")

        # --- Conversation history summary ---
        if history:
            recent = history[-6:]  # Last 6 exchanges for context window
            history_text = "\n".join(
                f"  {msg.get('role', 'unknown')}: {msg.get('content', '')[:200]}"
                for msg in recent
            )
            sections.append("\n=== RECENT CONVERSATION ===")
            sections.append(history_text)

        # --- Detected intent ---
        sections.append("\n=== DETECTED INTENT (for your awareness, do not repeat verbatim) ===")
        sections.append(f"Primary emotion: {intent.emotion.value} (intensity: {intent.emotion_intensity:.2f})")
        sections.append(f"Concern area: {intent.concern.value}")
        sections.append(f"Urgency: {intent.urgency.value}")
        if intent.underlying_needs:
            sections.append(f"Underlying needs: {', '.join(intent.underlying_needs)}")

        # --- Gita wisdom context ---
        sections.append("\n=== GITA WISDOM CONTEXT ===")
        sections.append(f"Chapter: {mapping.chapter} - {mapping.chapter_title}")
        sections.append(f"Verse range: {mapping.verse_range}")
        sections.append(f"Theme: {mapping.theme}")
        sections.append(f"Interpretation: {mapping.interpretation}")
        sections.append(f"Practical bridge: {mapping.practical_bridge}")
        if mapping.secondary_refs:
            sections.append(f"Also consider: {', '.join(mapping.secondary_refs)}")

        # --- Crisis instructions ---
        if intent.is_crisis:
            sections.append("\n=== CRISIS PROTOCOL (MANDATORY) ===")
            sections.append(
                "The user may be in crisis. You MUST:\n"
                "1. Acknowledge their pain with warmth and without judgment.\n"
                "2. Include the following professional resources in your response:\n"
                f"{_CRISIS_RESPONSE_TEMPLATE}\n"
                "3. Do NOT attempt to replace professional help.\n"
                "4. Stay present and caring. Do not minimize their experience."
            )

        # --- Response instructions ---
        sections.append("\n=== RESPONSE GUIDELINES ===")
        sections.append(
            "1. Lead with empathy. Acknowledge the feeling before offering wisdom.\n"
            "2. Weave Gita references naturally. Do not list verse numbers unless the "
            "user asks for them. Use the WISDOM, not the citation.\n"
            "3. Include at least one practical, actionable suggestion.\n"
            "4. End with a gentle reflection question or encouraging affirmation.\n"
            "5. Keep the tone warm, personal, and conversational. You are a friend, "
            "not a teacher.\n"
            "6. If the user shares good news, celebrate genuinely. Match their energy.\n"
            "7. If the user just wants to vent, listen. Do not rush to solve.\n"
            "8. Never use phrases like 'As an AI' or 'I don't have feelings'. "
            "You are KIAAN, their divine friend.\n"
            "9. Keep responses between 150-350 words unless the topic warrants more."
        )

        prompt = "\n".join(sections)

        logger.info(
            "Divine Friend prompt built: %d chars, concern=%s, crisis=%s",
            len(prompt),
            intent.concern.value,
            intent.is_crisis,
        )
        return prompt

    # -----------------------------------------------------------------
    # 6. SITUATION-BASED WISDOM
    # -----------------------------------------------------------------

    def get_wisdom_for_situation(
        self, situation_type: str, details: str
    ) -> WisdomGuidance:
        """Get comprehensive guidance for a specific life situation.

        Combines Gita mapping with practical steps, mindset reframing,
        and a daily practice suggestion.

        Args:
            situation_type: Category string matching ConcernCategory values.
            details:        User's description of their situation.

        Returns:
            WisdomGuidance with all fields populated.

        Example:
            >>> guidance = friend.get_wisdom_for_situation(
            ...     "career",
            ...     "I got passed over for a promotion and feel worthless",
            ... )
            >>> len(guidance.practical_steps) >= 3
            True
        """
        mapping = self.map_concern_to_gita(situation_type, "neutral")

        practical_steps = self._build_practical_steps(situation_type, details)
        mindset_shift = self._build_mindset_shift(situation_type, mapping)
        daily_practice = self._build_daily_practice(situation_type)
        verse_refs = [mapping.verse_range] + mapping.secondary_refs
        affirmation = self._build_affirmation(situation_type)

        guidance = WisdomGuidance(
            situation_type=situation_type,
            details=details,
            gita_perspective=mapping.interpretation,
            practical_steps=practical_steps,
            mindset_shift=mindset_shift,
            daily_practice=daily_practice,
            verse_references=verse_refs,
            affirmation=affirmation,
        )

        logger.info("Wisdom guidance built for situation_type=%s", situation_type)
        return guidance

    # =================================================================
    # PRIVATE HELPERS
    # =================================================================

    def _detect_crisis(self, lower_msg: str) -> bool:
        """Return True if any crisis signal appears in the lowered message."""
        for signal in self._crisis_signals:
            if signal in lower_msg:
                logger.warning("Crisis signal detected: '%s'", signal)
                return True
        return False

    def _detect_emotion(
        self, lower_msg: str
    ) -> tuple[EmotionCategory, float, List[str]]:
        """Detect primary emotion, intensity, and matched phrases.

        Intensity is approximated by the fraction of keyword lists that
        matched, scaled between 0.3 (single weak match) and 1.0.
        """
        matched_emotions: Dict[EmotionCategory, List[str]] = {}

        for emotion, keywords in self._emotion_keywords.items():
            hits = [kw for kw in keywords if kw in lower_msg]
            if hits:
                matched_emotions[emotion] = hits

        if not matched_emotions:
            return EmotionCategory.NEUTRAL, 0.1, []

        # Primary emotion is the one with the most keyword hits
        primary = max(matched_emotions, key=lambda e: len(matched_emotions[e]))
        hit_count = len(matched_emotions[primary])
        total_keywords = len(self._emotion_keywords[primary])

        # Scale intensity: 0.3 base + up to 0.7 based on hit density
        intensity = min(1.0, 0.3 + 0.7 * (hit_count / max(total_keywords, 1)))

        all_phrases: List[str] = []
        for hits in matched_emotions.values():
            all_phrases.extend(hits)

        return primary, round(intensity, 2), all_phrases

    def _detect_concern(
        self, lower_msg: str
    ) -> tuple[ConcernCategory, List[str]]:
        """Detect the life-concern category and matched phrases."""
        matched_concerns: Dict[ConcernCategory, List[str]] = {}

        for concern, keywords in self._concern_keywords.items():
            hits = [kw for kw in keywords if kw in lower_msg]
            if hits:
                matched_concerns[concern] = hits

        if not matched_concerns:
            return ConcernCategory.GENERAL, []

        primary = max(matched_concerns, key=lambda c: len(matched_concerns[c]))
        return primary, matched_concerns[primary]

    def _determine_urgency(
        self,
        is_crisis: bool,
        intensity: float,
        emotion: EmotionCategory,
    ) -> UrgencyLevel:
        """Map crisis flag, intensity, and emotion to an urgency level."""
        if is_crisis:
            return UrgencyLevel.CRISIS

        high_urgency_emotions = {
            EmotionCategory.GRIEF,
            EmotionCategory.FEAR,
            EmotionCategory.SHAME,
        }
        if emotion in high_urgency_emotions and intensity >= 0.6:
            return UrgencyLevel.HIGH

        if intensity >= 0.7:
            return UrgencyLevel.HIGH
        if intensity >= 0.4:
            return UrgencyLevel.MEDIUM
        return UrgencyLevel.LOW

    def _infer_underlying_needs(
        self,
        emotion: EmotionCategory,
        concern: ConcernCategory,
        is_crisis: bool,
    ) -> List[str]:
        """Infer what the user may truly need beneath their stated concern."""
        needs: List[str] = []

        if is_crisis:
            needs.append("immediate safety and professional support")
            needs.append("to feel heard and not alone")
            return needs

        # Emotion-driven needs
        emotion_needs = {
            EmotionCategory.SADNESS: ["validation of their pain", "gentle encouragement"],
            EmotionCategory.ANGER: ["to feel heard", "perspective on the situation"],
            EmotionCategory.ANXIETY: ["reassurance", "a sense of control"],
            EmotionCategory.FEAR: ["safety and reassurance", "courage building"],
            EmotionCategory.GRIEF: ["permission to grieve", "companionship in sorrow"],
            EmotionCategory.LONELINESS: ["connection and belonging", "to feel seen"],
            EmotionCategory.SHAME: ["self-compassion", "normalization of their experience"],
            EmotionCategory.FRUSTRATION: ["acknowledgment of effort", "a new approach"],
            EmotionCategory.CONFUSION: ["clarity and structure", "patience with uncertainty"],
            EmotionCategory.JOY: ["celebration and shared happiness"],
            EmotionCategory.HOPE: ["encouragement to keep going"],
            EmotionCategory.GRATITUDE: ["mirrored appreciation"],
            EmotionCategory.PEACE: ["affirmation of their growth"],
        }
        needs.extend(emotion_needs.get(emotion, ["understanding and support"]))

        # Concern-driven needs
        concern_needs = {
            ConcernCategory.RELATIONSHIP: "wisdom on love without attachment",
            ConcernCategory.CAREER: "clarity on dharma and duty",
            ConcernCategory.SELF_WORTH: "reconnection with intrinsic worth",
            ConcernCategory.LIFE_PURPOSE: "guidance toward svadharma",
            ConcernCategory.ADDICTION: "compassion without enabling",
        }
        if concern in concern_needs:
            needs.append(concern_needs[concern])

        return needs

    def _compose_friend_message(
        self, intent: UserIntent, mapping: GitaMapping, user_name: str
    ) -> str:
        """Compose the warm, personal friend-message scaffold."""
        if intent.is_crisis:
            return (
                f"{user_name}, I am right here with you. "
                "What you are feeling is real, and you matter deeply. "
                "Before anything else, please know you are not alone."
            )

        # Acknowledge-first pattern: name the emotion before anything else
        emotion_acknowledgments = {
            EmotionCategory.SADNESS: f"{user_name}, I can feel the weight of what you are carrying.",
            EmotionCategory.ANGER: f"{user_name}, your anger makes complete sense given what you have been through.",
            EmotionCategory.ANXIETY: f"{user_name}, that racing mind can be exhausting. Let us slow down together.",
            EmotionCategory.FEAR: f"{user_name}, it takes courage to name what scares you. I am glad you told me.",
            EmotionCategory.GRIEF: f"{user_name}, grief is love with nowhere to go. I am sitting with you in this.",
            EmotionCategory.LONELINESS: f"{user_name}, feeling alone is one of the deepest aches. I am here.",
            EmotionCategory.SHAME: f"{user_name}, you are being so hard on yourself. Let me offer another perspective.",
            EmotionCategory.FRUSTRATION: f"{user_name}, I hear how stuck you feel. That frustration is valid.",
            EmotionCategory.CONFUSION: f"{user_name}, not knowing is uncomfortable, but it is also the start of clarity.",
            EmotionCategory.JOY: f"{user_name}, this is wonderful! Tell me everything.",
            EmotionCategory.HOPE: f"{user_name}, I love hearing that spark in your words.",
            EmotionCategory.GRATITUDE: f"{user_name}, your gratitude is beautiful. It says so much about who you are.",
            EmotionCategory.PEACE: f"{user_name}, the calm in your words tells me something is shifting inside you.",
        }
        return emotion_acknowledgments.get(
            intent.emotion,
            f"{user_name}, thank you for sharing that with me. I am listening.",
        )

    def _compose_gita_wisdom(self, mapping: GitaMapping) -> str:
        """Compose the Gita wisdom section of the response."""
        return (
            f"Gita {mapping.verse_range} ({mapping.chapter_title}): "
            f"{mapping.theme}. {mapping.interpretation}"
        )

    def _compose_practical_advice(
        self, intent: UserIntent, mapping: GitaMapping
    ) -> List[str]:
        """Compose actionable advice items."""
        advice = [mapping.practical_bridge]

        # Add emotion-specific practical suggestions
        emotion_tips = {
            EmotionCategory.ANXIETY: "Try box breathing: inhale 4 counts, hold 4, exhale 4, hold 4. Repeat three times.",
            EmotionCategory.ANGER: "Place your hand on your chest and take five slow breaths before responding to the situation.",
            EmotionCategory.SADNESS: "Write down three things, however small, that brought even a flicker of comfort today.",
            EmotionCategory.GRIEF: "Create a small ritual to honor what you have lost: light a candle, write a letter, sit in silence.",
            EmotionCategory.LONELINESS: "Reach out to one person today, even with a simple message. Connection starts with one step.",
            EmotionCategory.FRUSTRATION: "Step away for ten minutes. Walk, stretch, or splash water on your face. Then return fresh.",
            EmotionCategory.SHAME: "Write a compassionate letter to yourself as if you were writing to your closest friend.",
            EmotionCategory.FEAR: "Name the fear out loud. Spoken fears lose some of their power over us.",
        }
        tip = emotion_tips.get(intent.emotion)
        if tip:
            advice.append(tip)

        return advice

    def _compose_reflection_prompt(self, intent: UserIntent) -> str:
        """Compose a thoughtful self-reflection question."""
        prompts = {
            EmotionCategory.SADNESS: "What is one thing your sadness is trying to tell you about what you value most?",
            EmotionCategory.ANGER: "If your anger could speak calmly, what would it say it truly needs?",
            EmotionCategory.ANXIETY: "What would today look like if the outcome you fear most simply could not happen?",
            EmotionCategory.FEAR: "What is the smallest brave step you could take in the direction of your fear?",
            EmotionCategory.GRIEF: "What is one memory of this person or time that still makes you smile?",
            EmotionCategory.LONELINESS: "When was the last time you felt truly connected to someone, and what made that moment special?",
            EmotionCategory.SHAME: "Would you say the same harsh words to someone you love in this situation?",
            EmotionCategory.FRUSTRATION: "What would 'good enough' look like right now, instead of perfect?",
            EmotionCategory.CONFUSION: "If you already knew the answer deep down, what would it be?",
            EmotionCategory.JOY: "What does this moment of joy teach you about what truly matters to you?",
            EmotionCategory.HOPE: "What is one action you can take today to nourish this hope?",
            EmotionCategory.GRATITUDE: "How can you carry this gratitude into one interaction tomorrow?",
            EmotionCategory.PEACE: "What practice or choice brought you to this place of peace?",
        }
        return prompts.get(
            intent.emotion,
            "What feels most true for you right now, beneath all the noise?",
        )

    def _compose_follow_up_suggestions(self, intent: UserIntent) -> List[str]:
        """Suggest topics the user could explore next."""
        suggestions: List[str] = []

        concern_follow_ups = {
            ConcernCategory.RELATIONSHIP: [
                "Explore what 'love without attachment' means for you",
                "Discuss setting healthy boundaries",
            ],
            ConcernCategory.CAREER: [
                "Explore your unique strengths and svadharma",
                "Discuss handling workplace expectations",
            ],
            ConcernCategory.GRIEF_LOSS: [
                "Share a favorite memory of who you have lost",
                "Explore what healing looks like for you",
            ],
            ConcernCategory.ANXIETY: [
                "Try a guided breathing exercise together",
                "Explore what triggers your anxiety most",
            ],
            ConcernCategory.DEPRESSION: [
                "Identify one small action that felt meaningful recently",
                "Explore what support looks like for you",
            ],
            ConcernCategory.SELF_WORTH: [
                "List three qualities others appreciate in you",
                "Explore where your inner critic learned its script",
            ],
            ConcernCategory.LIFE_PURPOSE: [
                "Reflect on moments when you felt most alive",
                "Explore what service means to you",
            ],
        }
        suggestions.extend(
            concern_follow_ups.get(intent.concern, ["Tell me more about what is on your mind"])
        )

        # Always offer the Gita exploration path
        suggestions.append("Explore a specific Gita verse together")

        return suggestions

    def _find_related_verses(self, chapter: int, verse: int) -> List[str]:
        """Find verses related to a given chapter and verse.

        Uses a static adjacency map for frequently explored verses,
        with a sensible default for unknown verses.
        """
        # Commonly explored verse relationships
        related_map: Dict[str, List[str]] = {
            "2.47": ["2.48", "3.19", "18.66"],
            "2.48": ["2.47", "2.55", "6.23"],
            "2.62": ["2.63", "3.37", "16.21"],
            "2.63": ["2.62", "2.64", "16.4"],
            "3.35": ["18.47", "2.47", "18.45"],
            "6.5": ["6.6", "3.43", "13.2"],
            "6.6": ["6.5", "6.7", "6.29"],
            "9.22": ["12.6", "18.66", "9.26"],
            "12.13": ["12.14", "12.15", "2.56"],
            "18.66": ["9.22", "2.47", "15.5"],
        }

        key = f"{chapter}.{verse}"
        if key in related_map:
            return related_map[key]

        # Default: suggest the chapter's opening, the equanimity verses,
        # and the surrender verse
        defaults = []
        if chapter != 2:
            defaults.append("2.47")
        if chapter != 18:
            defaults.append("18.66")
        defaults.append(f"{chapter}.1")
        return defaults

    def _build_practical_steps(
        self, situation_type: str, details: str
    ) -> List[str]:
        """Build practical action steps for a situation."""
        base_steps = {
            "relationship": [
                "Write down what you need from this relationship without filtering.",
                "Have one honest conversation this week, starting with 'I feel' not 'You always'.",
                "Spend 10 minutes in solitude daily to reconnect with your own center.",
            ],
            "career": [
                "List your three greatest strengths and one way to use each this week.",
                "Identify the single highest-impact task and give it your first hour tomorrow.",
                "Separate your self-worth from your job title. You are not your role.",
            ],
            "grief_loss": [
                "Allow yourself to grieve without a deadline. There is no 'should be over it by now'.",
                "Create one small ritual to honor what you have lost.",
                "Reach out to one person who understands, even if just to say 'today is hard'.",
            ],
            "anxiety": [
                "Practice 5-4-3-2-1 grounding: name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.",
                "Limit future-thinking to a 10-minute 'worry window', then redirect.",
                "Move your body for at least 10 minutes today. Walk, stretch, dance.",
            ],
            "depression": [
                "Choose one micro-action: make your bed, step outside, drink water.",
                "Text or call one person, even if the message is just 'thinking of you'.",
                "Write one sentence about how you feel. You do not have to share it.",
            ],
            "anger_management": [
                "When anger rises, pause for 90 seconds. Neurochemically, that is how long the initial surge lasts.",
                "Identify the hurt or fear underneath the anger. Anger is often a bodyguard for deeper pain.",
                "Channel the energy: write, exercise, or create something with your hands.",
            ],
            "self_worth": [
                "Write down one thing you did well today, no matter how small.",
                "Notice your inner critic and give it a name. Naming externalizes it.",
                "Ask a trusted friend: 'What do you appreciate about me?' Let yourself hear the answer.",
            ],
            "life_purpose": [
                "List five activities that make you lose track of time.",
                "Volunteer for one cause this month. Purpose often finds us through service.",
                "Stop comparing your chapter 1 to someone else's chapter 20.",
            ],
            "addiction": [
                "Identify your three most common triggers and write them down.",
                "Replace the habit with a 5-minute alternative: cold water, a walk, a song.",
                "Tell one person you trust about your struggle. Shame thrives in secrecy.",
                "Seek professional support. Courage is asking for help.",
            ],
        }

        steps = base_steps.get(situation_type, [
            "Take one small step today, however tiny.",
            "Write down what you are feeling without censoring.",
            "Be gentle with yourself. You are doing the best you can.",
        ])
        return steps

    def _build_mindset_shift(
        self, situation_type: str, mapping: GitaMapping
    ) -> str:
        """Build a reframing perspective for the situation."""
        shifts = {
            "relationship": "Love is not about possession. The deepest relationships grow when both people are free.",
            "career": "Your dharma is your own. Doing another's duty perfectly is not your path.",
            "grief_loss": "Grief is not a problem to solve. It is love continuing beyond physical form.",
            "anxiety": "The future has not happened yet. You are safe in this present moment.",
            "depression": "Inaction feels safe but keeps you stuck. Even one small movement creates momentum.",
            "anger_management": "Anger is information, not instruction. It tells you something matters; it does not tell you to destroy.",
            "self_worth": "You are not what happened to you. You are what you choose to become.",
            "life_purpose": "Purpose is not found in one grand revelation. It is built through daily, faithful action.",
            "loneliness": "You are connected to every living being. Loneliness is a temporary forgetting, not a permanent truth.",
            "fear": "Fear is the mind projecting a future that has not arrived. Come back to now.",
            "addiction": "Craving is not weakness. It is a force of nature. Transcending it requires wisdom and support, not willpower alone.",
            "family_conflict": "You cannot choose your family, but you can choose who you become within it.",
            "identity_crisis": "Not knowing who you are is the beginning of finding out. The question itself is the path.",
            "trust_issues": "Trust yourself first. You survived betrayal; that proves your strength.",
        }
        return shifts.get(
            situation_type,
            f"{mapping.theme}. This ancient wisdom still lights the way forward.",
        )

    def _build_daily_practice(self, situation_type: str) -> str:
        """Suggest a small daily habit aligned with the situation."""
        practices = {
            "relationship": "Each morning, silently wish well for the person you are in conflict with. Not for their sake, but for your freedom.",
            "career": "Before starting work, set one intention: 'Today I will give my best effort and release the outcome.'",
            "grief_loss": "Light a candle each evening and sit with the memory of your loved one for five minutes. Let the tears come if they need to.",
            "anxiety": "Morning box breathing: 4 counts in, 4 hold, 4 out, 4 hold. Five rounds. It resets your nervous system.",
            "depression": "Make your bed every morning. It is one completed task before the day even begins.",
            "anger_management": "Before sleep, recall one moment you chose patience over reaction. Celebrate it.",
            "self_worth": "Look in the mirror each morning and say one genuine compliment to yourself. Mean it.",
            "life_purpose": "Spend 15 minutes daily on something that energizes you, with no goal attached. Just exploration.",
            "loneliness": "Send one message of kindness to someone each day. Connection is built in small acts.",
            "fear": "Write your fear on paper each morning, then write one reason you can handle it. Fold the paper and set it aside.",
            "addiction": "Replace the craving moment with three minutes of cold water on your wrists and slow breathing.",
            "family_conflict": "Before any family interaction, remind yourself: 'I control my response, not their behavior.'",
            "identity_crisis": "Journal for 10 minutes with the prompt: 'Today I noticed I am...' Let it be different each day.",
            "trust_issues": "Each day, notice one small moment where someone was reliable. Collect evidence of trustworthiness.",
        }
        return practices.get(
            situation_type,
            "Spend five minutes in stillness each morning, simply noticing your breath. No agenda, just presence.",
        )

    def _build_affirmation(self, situation_type: str) -> str:
        """Build a compassionate closing affirmation."""
        affirmations = {
            "relationship": "You are worthy of love that does not require you to shrink. The right connections will honor all of who you are.",
            "career": "Your worth is not your productivity. You bring something to this world that no title can capture.",
            "grief_loss": "The love you carry for them is proof that something beautiful existed. That can never be taken away.",
            "anxiety": "You have survived every anxious moment so far. Your track record of getting through hard days is flawless.",
            "depression": "The heaviness you feel is not permanent, even when it feels like it will never lift. You are still here, and that is strength.",
            "anger_management": "Your anger shows you care deeply. Channel that fire into building, not burning.",
            "self_worth": "You do not need to earn the right to exist. You are enough, exactly as you are, right now.",
            "life_purpose": "You do not need to have it all figured out. Show up honestly each day, and your path will reveal itself.",
            "loneliness": "You are never as alone as loneliness tells you. The universe placed a spark of the divine in you, and it connects you to everything.",
            "fear": "Courage is not the absence of fear. It is one step forward while the fear is still there. You are braver than you know.",
            "addiction": "Asking for help is the strongest thing you can do. You are not your addiction; you are the one fighting it.",
            "family_conflict": "You cannot control your family, but you can become the person you wish they were to you.",
            "identity_crisis": "You are not lost. You are becoming. And becoming takes time.",
            "trust_issues": "Your heart was brave enough to trust before, and it will be brave enough to trust again, when you are ready.",
        }
        return affirmations.get(
            situation_type,
            "You are held, you are seen, and you are never walking this path alone. I am here.",
        )


# =============================================================================
# MODULE-LEVEL SINGLETON
# Provides a ready-to-use instance for import by other services.
# =============================================================================

kiaan_divine_friend = KiaanDivineFriend()
