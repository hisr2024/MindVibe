"""
KIAAN Friendship Engine - Dual-Mode Intelligence (Best Friend + Gita Guide)

The core intelligence layer that powers KIAAN's dual personality:

MODE 1 - BEST FRIEND (default):
    When user is chatting casually, venting, sharing their day, or just wants
    company. KIAAN is warm, funny, supportive, remembers context, and feels
    like a real human best friend. No unsolicited spiritual advice.

MODE 2 - GITA GUIDE (activated on request or detected need):
    When user explicitly asks for guidance, is in distress, or seeks meaning.
    KIAAN shifts to a wise, grounded guide who interprets Bhagavad Gita wisdom
    through a MODERN, SECULAR lens - making ancient verse applicable to today's
    careers, relationships, mental health, and daily decisions.

Mode detection is automatic via intent analysis, but user can also toggle.

Behavioral Science Framework:
    - Motivational Interviewing (MI): Open questions, affirmations, reflections
    - Cognitive Behavioral Therapy (CBT): Identify distortions gently
    - Positive Psychology (Seligman): PERMA model - Positive emotion, Engagement,
      Relationships, Meaning, Achievement
    - Self-Determination Theory (Deci & Ryan): Autonomy, Competence, Relatedness
    - Polyvagal Theory (Porges): Co-regulation through voice tone and language
    - Narrative Therapy: Help user reauthor their story
    - Acceptance & Commitment Therapy (ACT): Values-based living
"""

from __future__ import annotations

import logging
import random
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


# =============================================================================
# ENUMS & DATA STRUCTURES
# =============================================================================

class InteractionMode(str, Enum):
    """KIAAN's current interaction mode."""
    BEST_FRIEND = "best_friend"
    GITA_GUIDE = "gita_guide"
    TRANSITION = "transition"  # Bridging from friend to guide naturally


class FriendMood(str, Enum):
    """Friend-appropriate mood categories (more granular than clinical)."""
    CHILL = "chill"
    EXCITED = "excited"
    VENTING = "venting"
    SAD = "sad"
    ANXIOUS = "anxious"
    CONFUSED = "confused"
    ANGRY = "angry"
    GRATEFUL = "grateful"
    LONELY = "lonely"
    BORED = "bored"
    REFLECTIVE = "reflective"
    SEEKING = "seeking"
    PLAYFUL = "playful"
    NEUTRAL = "neutral"


class ConversationType(str, Enum):
    """What kind of conversation is this?"""
    CASUAL_CHAT = "casual_chat"
    DAILY_UPDATE = "daily_update"
    VENTING = "venting"
    SEEKING_ADVICE = "seeking_advice"
    SEEKING_WISDOM = "seeking_wisdom"
    EXPLORING_GITA = "exploring_gita"
    MOOD_CHECKIN = "mood_checkin"
    CELEBRATION = "celebration"
    CRISIS = "crisis"
    PHILOSOPHICAL = "philosophical"
    JUST_COMPANY = "just_company"


@dataclass
class ModeDetection:
    """Result of analyzing what mode KIAAN should be in."""
    mode: InteractionMode
    conversation_type: ConversationType
    mood: FriendMood
    mood_intensity: float  # 0.0-1.0
    confidence: float  # 0.0-1.0
    guidance_needed: bool
    gita_relevant: bool
    suggested_chapter: Optional[int] = None
    reasoning: str = ""


@dataclass
class ModernGitaInsight:
    """A modern, secular interpretation of a Gita verse."""
    chapter: int
    verse_range: str
    original_context: str
    modern_interpretation: str
    psychology_connection: str
    practical_application: str
    daily_practice: str
    secular_takeaway: str
    related_concepts: List[str] = field(default_factory=list)


@dataclass
class FriendResponse:
    """Structured response from the friendship engine."""
    mode: InteractionMode
    message: str
    tone: str  # warm, playful, supportive, wise, calm, energetic
    follow_up: Optional[str] = None
    gita_insight: Optional[ModernGitaInsight] = None
    mood_reflection: Optional[str] = None
    daily_practice: Optional[str] = None
    conversation_type: ConversationType = ConversationType.CASUAL_CHAT


# =============================================================================
# MODE DETECTION ENGINE
# =============================================================================

# Keywords that signal the user wants guidance (not just friendship)
GUIDANCE_SIGNALS = {
    "high": [
        "what should i do", "help me understand", "i need advice",
        "guide me", "what does gita say", "teach me", "show me the way",
        "i'm struggling with", "how do i deal with", "i can't handle",
        "i feel lost", "what's the meaning of", "why is this happening",
        "i need guidance", "can you help me with", "i'm going through",
        "give me wisdom", "share some wisdom", "what verse", "which chapter",
        "explain this verse", "gita says", "krishna said", "arjuna",
        "i need direction", "i'm at a crossroads", "life feels meaningless",
    ],
    "medium": [
        "advice", "guidance", "wisdom", "meaning", "purpose", "struggling",
        "confused about life", "don't know what to do", "lost", "stuck",
        "anxious about", "worried about", "scared of", "afraid of",
        "can't sleep", "overthinking", "stressed", "overwhelmed",
        "relationship issue", "career problem", "family trouble",
    ],
}

# Keywords that signal casual/friend mode
FRIEND_SIGNALS = [
    "hey", "hi", "hello", "sup", "what's up", "how are you",
    "guess what", "you won't believe", "tell me something",
    "i'm bored", "let's chat", "talk to me", "haha", "lol",
    "that's funny", "thanks", "thank you", "you're the best",
    "my day was", "today was", "just wanted to", "random thought",
    "do you think", "have you ever", "what's your opinion",
    "i saw", "i watched", "i read", "tell me a joke",
    "i'm happy", "feeling good", "great day", "awesome",
    "miss you", "glad to talk", "needed this",
]

# Crisis signals - always redirect to professional help
CRISIS_SIGNALS = [
    "kill myself", "end my life", "suicide", "self harm", "self-harm",
    "don't want to live", "want to die", "better off dead",
    "no reason to live", "hurt myself", "cutting myself",
]


def detect_mode(message: str, conversation_history: Optional[List[Dict]] = None) -> ModeDetection:
    """
    Analyze user message to determine the right interaction mode.

    This is the brain of dual-mode switching. It looks at:
    1. Explicit guidance requests
    2. Emotional distress signals
    3. Casual conversation patterns
    4. Conversation history context
    """
    msg_lower = message.lower().strip()

    # Crisis check first - always
    for signal in CRISIS_SIGNALS:
        if signal in msg_lower:
            return ModeDetection(
                mode=InteractionMode.GITA_GUIDE,
                conversation_type=ConversationType.CRISIS,
                mood=FriendMood.SAD,
                mood_intensity=1.0,
                confidence=1.0,
                guidance_needed=True,
                gita_relevant=True,
                suggested_chapter=2,
                reasoning="Crisis signal detected - professional help priority",
            )

    # Check for explicit guidance requests
    high_guidance_score = sum(
        1 for signal in GUIDANCE_SIGNALS["high"] if signal in msg_lower
    )
    medium_guidance_score = sum(
        1 for signal in GUIDANCE_SIGNALS["medium"] if signal in msg_lower
    )
    friend_score = sum(1 for signal in FRIEND_SIGNALS if signal in msg_lower)

    guidance_total = high_guidance_score * 3 + medium_guidance_score * 1.5
    friend_total = friend_score * 2

    # Detect mood
    mood = _detect_friend_mood(msg_lower)
    mood_intensity = _calculate_mood_intensity(msg_lower, mood)

    # Determine mode
    if guidance_total > friend_total and guidance_total > 2:
        mode = InteractionMode.GITA_GUIDE
        conv_type = _classify_guidance_conversation(msg_lower)
        guidance_needed = True
        gita_relevant = True
        chapter = _suggest_chapter_for_message(msg_lower, mood)
    elif guidance_total > 0 and mood_intensity > 0.7:
        # High emotional intensity + some guidance signal = transition
        mode = InteractionMode.TRANSITION
        conv_type = ConversationType.VENTING
        guidance_needed = True
        gita_relevant = True
        chapter = _suggest_chapter_for_message(msg_lower, mood)
    else:
        mode = InteractionMode.BEST_FRIEND
        conv_type = _classify_friend_conversation(msg_lower, mood)
        guidance_needed = False
        gita_relevant = False
        chapter = None

    confidence = min(1.0, max(
        abs(guidance_total - friend_total) / max(guidance_total + friend_total, 1),
        0.5,
    ))

    return ModeDetection(
        mode=mode,
        conversation_type=conv_type,
        mood=mood,
        mood_intensity=mood_intensity,
        confidence=confidence,
        guidance_needed=guidance_needed,
        gita_relevant=gita_relevant,
        suggested_chapter=chapter,
        reasoning=f"guidance_score={guidance_total:.1f}, friend_score={friend_total:.1f}",
    )


def _detect_friend_mood(msg: str) -> FriendMood:
    """Detect the user's mood from their message."""
    mood_patterns = {
        FriendMood.EXCITED: ["excited", "amazing", "awesome", "incredible", "can't wait", "so happy", "best day"],
        FriendMood.VENTING: ["ugh", "so annoying", "pissed", "frustrated", "can't stand", "hate", "sick of"],
        FriendMood.SAD: ["sad", "crying", "miss", "lonely", "hurt", "heartbroken", "depressed", "empty"],
        FriendMood.ANXIOUS: ["anxious", "nervous", "worried", "scared", "panic", "can't breathe", "stressed"],
        FriendMood.CONFUSED: ["confused", "don't know", "unsure", "torn", "dilemma", "conflicted"],
        FriendMood.ANGRY: ["angry", "furious", "mad", "rage", "livid", "enraged"],
        FriendMood.GRATEFUL: ["grateful", "thankful", "blessed", "appreciate", "lucky"],
        FriendMood.LONELY: ["lonely", "alone", "no one", "isolated", "disconnected"],
        FriendMood.BORED: ["bored", "nothing to do", "boring", "meh", "whatever"],
        FriendMood.REFLECTIVE: ["thinking about", "reflecting", "looking back", "wondering", "contemplating"],
        FriendMood.SEEKING: ["searching", "looking for", "trying to find", "seeking", "quest"],
        FriendMood.PLAYFUL: ["haha", "lol", "joke", "funny", "silly", "play", "game"],
        FriendMood.CHILL: ["good", "fine", "okay", "chill", "relaxed", "peaceful", "calm"],
    }
    for mood, patterns in mood_patterns.items():
        if any(p in msg for p in patterns):
            return mood
    return FriendMood.NEUTRAL


def _calculate_mood_intensity(msg: str, mood: FriendMood) -> float:
    """Calculate how intense the detected mood is (0.0-1.0)."""
    intensifiers = ["very", "so", "extremely", "really", "incredibly", "totally", "absolutely", "deeply"]
    base = 0.5
    for word in intensifiers:
        if word in msg:
            base += 0.1
    # Longer emotional messages tend to be more intense
    if len(msg) > 200:
        base += 0.1
    # Exclamation marks and caps signal intensity
    base += min(0.2, msg.count("!") * 0.05)
    if msg.upper() == msg and len(msg) > 10:
        base += 0.15
    # Negative moods at baseline are more intense
    if mood in (FriendMood.SAD, FriendMood.ANXIOUS, FriendMood.ANGRY, FriendMood.LONELY):
        base += 0.1
    return min(1.0, base)


def _classify_friend_conversation(msg: str, mood: FriendMood) -> ConversationType:
    """Classify what kind of friend conversation this is."""
    if mood == FriendMood.VENTING:
        return ConversationType.VENTING
    if mood in (FriendMood.EXCITED, FriendMood.GRATEFUL):
        return ConversationType.CELEBRATION
    if mood == FriendMood.BORED:
        return ConversationType.JUST_COMPANY
    if any(w in msg for w in ["my day", "today", "this morning", "tonight", "this week"]):
        return ConversationType.DAILY_UPDATE
    if mood == FriendMood.REFLECTIVE:
        return ConversationType.PHILOSOPHICAL
    return ConversationType.CASUAL_CHAT


def _classify_guidance_conversation(msg: str) -> ConversationType:
    """Classify what kind of guidance the user is seeking."""
    if any(w in msg for w in ["gita", "verse", "chapter", "krishna", "arjuna", "shloka"]):
        return ConversationType.EXPLORING_GITA
    if any(w in msg for w in ["advice", "what should", "help me"]):
        return ConversationType.SEEKING_ADVICE
    return ConversationType.SEEKING_WISDOM


def _suggest_chapter_for_message(msg: str, mood: FriendMood) -> Optional[int]:
    """Suggest a Gita chapter based on the user's message and mood."""
    mood_to_chapter = {
        FriendMood.ANXIOUS: 2,   # Sankhya Yoga - equanimity
        FriendMood.SAD: 2,       # The eternal self
        FriendMood.CONFUSED: 3,  # Karma Yoga - action
        FriendMood.ANGRY: 16,    # Divine vs demonic qualities
        FriendMood.LONELY: 9,    # Royal knowledge - you're never alone
        FriendMood.SEEKING: 4,   # Jnana Yoga - knowledge
        FriendMood.REFLECTIVE: 13,  # Field and knower
        FriendMood.BORED: 3,     # Call to action
    }
    # Check for topic-specific chapters
    topic_chapters = {
        "relationship": 12, "love": 12, "partner": 12,
        "career": 3, "work": 3, "job": 3, "purpose": 18,
        "death": 2, "grief": 2, "loss": 2,
        "meditation": 6, "peace": 6, "calm": 6,
        "anger": 16, "jealous": 16, "envy": 16,
        "faith": 17, "belief": 7, "god": 7,
        "fear": 2, "courage": 11, "strength": 11,
        "addiction": 14, "habits": 14, "pattern": 14,
        "identity": 13, "who am i": 13, "self": 13,
        "meaning": 15, "why": 15, "existence": 15,
        "surrender": 18, "letting go": 5, "detachment": 5,
    }
    for topic, chapter in topic_chapters.items():
        if topic in msg:
            return chapter
    return mood_to_chapter.get(mood)


# =============================================================================
# MODERN GITA INTERPRETATION ENGINE
# =============================================================================

# Each chapter mapped to modern, secular, psychology-backed interpretation
MODERN_CHAPTER_INSIGHTS: Dict[int, Dict[str, Any]] = {
    1: {
        "modern_title": "When Life Overwhelms You",
        "secular_theme": "Decision paralysis and moral anxiety",
        "psychology": "Approach-avoidance conflict (Kurt Lewin). When every option feels wrong, we freeze.",
        "modern_lesson": "It's okay to feel overwhelmed before a big decision. That anxiety means you care deeply. But freezing is not the answer - even imperfect action moves you forward.",
        "daily_practice": "When overwhelmed: Write down your 3 options. For each, list the worst realistic outcome. Usually, the fear is bigger than the reality.",
        "applies_to": ["career changes", "relationship decisions", "ethical dilemmas", "starting something new"],
    },
    2: {
        "modern_title": "Your Unshakeable Core",
        "secular_theme": "Emotional resilience and understanding what truly matters",
        "psychology": "Psychological resilience (Bonanno). Core Self theory. Cognitive reappraisal (Gross). The ability to reframe events without denying their reality.",
        "modern_lesson": "External circumstances change constantly - jobs, relationships, health, status. Your core identity isn't any of these things. When you stop over-identifying with outcomes, you gain freedom to act without fear.",
        "daily_practice": "Today, notice one thing that upset you. Ask: 'Will this matter in 5 years?' If not, practice letting the emotional charge dissipate. If yes, focus on what you can control about it.",
        "applies_to": ["loss and grief", "rejection", "failure", "identity crisis", "anxiety"],
    },
    3: {
        "modern_title": "Stop Overthinking, Start Doing",
        "secular_theme": "The cure for analysis paralysis is aligned action",
        "psychology": "Self-Determination Theory (Deci & Ryan): Intrinsic motivation comes from autonomy, competence, and relatedness. Action precedes motivation, not the other way around.",
        "modern_lesson": "You don't need to feel motivated to start. Start, and motivation follows. Focus on the quality of your work, not the reward. When you do something because it aligns with your values (not for likes, money, or praise), burnout becomes impossible.",
        "daily_practice": "Pick one task you've been procrastinating on. Set a timer for 10 minutes and just begin. The hardest part is always the first step.",
        "applies_to": ["procrastination", "career burnout", "depression", "lack of purpose", "perfectionism"],
    },
    4: {
        "modern_title": "The Power of Knowing Why",
        "secular_theme": "Self-awareness transforms ordinary actions into purposeful living",
        "psychology": "Metacognition and reflective practice. Viktor Frankl's logotherapy - meaning as the primary human drive.",
        "modern_lesson": "Knowledge isn't just information - it's understanding WHY you do what you do. When you understand your motivations, fears, and patterns, you stop being controlled by them. Self-awareness is the ultimate superpower.",
        "daily_practice": "Before each major action today, pause and ask: 'Why am I doing this? Is it from fear, habit, or genuine choice?'",
        "applies_to": ["self-doubt", "impostor syndrome", "trust issues", "learning and growth"],
    },
    5: {
        "modern_title": "Working Without the Weight",
        "secular_theme": "Engaged detachment - giving your best without being crushed by outcomes",
        "psychology": "Flow state (Csikszentmihalyi). Paradox of control. Non-attachment ≠ apathy; it's full engagement minus anxiety about results.",
        "modern_lesson": "The athlete who performs best isn't thinking about winning - they're fully absorbed in the game. Detachment doesn't mean not caring. It means caring deeply about the PROCESS while holding outcomes loosely.",
        "daily_practice": "Choose one task today. Give it 100% of your attention, but before starting, tell yourself: 'I'll do my absolute best, and whatever happens after that is okay.'",
        "applies_to": ["perfectionism", "control issues", "work-life balance", "letting go"],
    },
    6: {
        "modern_title": "Training Your Mind Like an Athlete",
        "secular_theme": "Meditation as mental fitness - practical, measurable, life-changing",
        "psychology": "Neuroplasticity (Davidson). Mindfulness-Based Stress Reduction (Kabat-Zinn). Attention regulation and executive function training.",
        "modern_lesson": "Your mind is a muscle. Just like physical fitness requires consistent training, mental fitness requires daily practice. Meditation isn't mystical - it's the most evidence-backed tool for reducing anxiety, improving focus, and building emotional regulation.",
        "daily_practice": "Sit quietly for 5 minutes. Focus on your breath. When your mind wanders (it will), gently bring it back. That's it. That's the whole practice. The wandering IS the workout.",
        "applies_to": ["anxiety", "ADHD", "emotional regulation", "stress", "insomnia", "focus"],
    },
    7: {
        "modern_title": "Seeing the Bigger Picture",
        "secular_theme": "Connecting with something larger than your individual story",
        "psychology": "Awe and self-transcendence (Keltner). Terror Management Theory. When we connect to something larger, daily anxieties shrink in proportion.",
        "modern_lesson": "Whether you call it God, the universe, nature, or the interconnected web of life - connecting to something bigger than yourself reduces anxiety and increases meaning. You don't need to be religious. Just curious.",
        "daily_practice": "Step outside tonight. Look at the sky. Consider: this same sky was seen by every human who ever lived. You're part of something immense.",
        "applies_to": ["existential crisis", "nihilism", "loneliness", "search for meaning"],
    },
    8: {
        "modern_title": "Living with the End in Mind",
        "secular_theme": "Death awareness as a tool for living fully, not fearfully",
        "psychology": "Terror Management Theory (Solomon, Greenberg, Pyszczynski). Mortality salience paradox: awareness of death can either paralyze or liberate.",
        "modern_lesson": "Thinking about mortality isn't morbid - it's clarifying. When you truly accept that your time is limited, you stop wasting it on things that don't matter. Every 'yes' to something unimportant is a 'no' to something that matters.",
        "daily_practice": "Ask yourself: 'If I had one year left, would I still be doing what I'm doing today?' If the answer is 'no' for too many days in a row, it's time to change something.",
        "applies_to": ["fear of death", "existential anxiety", "priority setting", "legacy"],
    },
    9: {
        "modern_title": "You Are Enough, Exactly As You Are",
        "secular_theme": "Radical self-acceptance and unconditional worthiness",
        "psychology": "Unconditional Positive Regard (Rogers). Self-Compassion (Kristin Neff). You don't earn worthiness through achievement - you already have it.",
        "modern_lesson": "You don't need to be perfect, productive, or impressive to deserve love and belonging. The universe doesn't keep score. Your worth isn't determined by your achievements, your failures, or what anyone thinks of you. You are enough.",
        "daily_practice": "Place your hand on your heart. Say: 'I am worthy of love and belonging, not because of what I do, but because of who I am.' Mean it.",
        "applies_to": ["low self-esteem", "people pleasing", "perfectionism", "self-worth", "imposter syndrome"],
    },
    10: {
        "modern_title": "Finding Excellence in Everyday Life",
        "secular_theme": "Gratitude, awe, and recognizing beauty in the ordinary",
        "psychology": "Gratitude research (Emmons). Broaden-and-Build theory (Fredrickson). Positive emotions expand our awareness and build lasting resources.",
        "modern_lesson": "Excellence isn't just in grand achievements - it's in the perfectly brewed cup of tea, the friend who always listens, the sunset you almost missed. When you train your eyes to see what's already remarkable in your life, scarcity thinking dissolves.",
        "daily_practice": "Before sleep, name 3 specific things from today that were genuinely good. Not generic - specific. 'The way sunlight hit the window at 3pm' counts.",
        "applies_to": ["negativity bias", "comparison trap", "gratitude", "appreciation"],
    },
    11: {
        "modern_title": "The Courage to See Reality Clearly",
        "secular_theme": "Facing uncomfortable truths without flinching",
        "psychology": "Radical Acceptance (Linehan). Cognitive defusion (ACT). Seeing reality clearly, even when it's vast and terrifying, is the prerequisite for genuine peace.",
        "modern_lesson": "Sometimes life shows you something so big, so overwhelming, that your usual coping mechanisms break down. That's not failure - that's growth. The willingness to face reality without filters is the beginning of true courage.",
        "daily_practice": "Identify one truth you've been avoiding. Write it down. Just acknowledge it exists. You don't have to solve it today - just stop pretending it's not there.",
        "applies_to": ["denial", "avoidance", "courage", "perspective-taking", "growth"],
    },
    12: {
        "modern_title": "How to Love Without Losing Yourself",
        "secular_theme": "Healthy devotion - loving deeply while maintaining boundaries",
        "psychology": "Attachment Theory (Bowlby/Ainsworth). Secure attachment style. Love as a practice, not just a feeling.",
        "modern_lesson": "Real love isn't obsessive or codependent. It's steady, patient, and kind - to others AND yourself. The qualities of a good lover are the same as a good friend: patience, forgiveness, equanimity, and genuine joy in the other's happiness.",
        "daily_practice": "Think of someone you love. Send them a message just to say you're thinking of them. No agenda, no need - just love.",
        "applies_to": ["relationships", "codependency", "heartbreak", "loneliness", "self-love"],
    },
    13: {
        "modern_title": "Who Are You, Really?",
        "secular_theme": "The difference between your story and your true self",
        "psychology": "Self-concept vs Self-awareness (Baumeister). Narrative Identity Theory. You are not your thoughts, your job title, your trauma, or your achievements.",
        "modern_lesson": "You are the observer of your thoughts, not the thoughts themselves. Your body changes, your opinions evolve, your circumstances shift - but the awareness watching it all remains constant. That's the real you.",
        "daily_practice": "Sit quietly. Notice a thought arise. Instead of engaging with it, simply label it: 'thinking.' Watch it pass. You are the sky, not the clouds.",
        "applies_to": ["identity crisis", "career change", "midlife crisis", "self-discovery", "mindfulness"],
    },
    14: {
        "modern_title": "Understanding Your Patterns",
        "secular_theme": "The three forces that drive all human behavior",
        "psychology": "Personality psychology. BIG 5 traits. Habit loops (Duhigg). Three gunas map to modern psychology: Sattva (growth mindset), Rajas (fixed mindset/hustle), Tamas (avoidance/stagnation).",
        "modern_lesson": "Every moment, you're pulled by three forces: clarity (wanting to grow), passion (wanting to achieve/acquire), and inertia (wanting to avoid/sleep). None is inherently bad - balance is key. Awareness of which force is driving you RIGHT NOW is the first step to choosing consciously.",
        "daily_practice": "Right now, ask: 'Am I acting from clarity (genuine desire to grow), passion (craving or ambition), or inertia (avoidance or comfort)?' Just notice. No judgment.",
        "applies_to": ["habits", "addiction", "laziness", "burnout", "self-awareness"],
    },
    15: {
        "modern_title": "Finding Your Purpose",
        "secular_theme": "Life has meaning - but you have to actively discover it",
        "psychology": "Ikigai. Purpose research (Damon). Logotherapy (Frankl). Purpose predicts longevity, resilience, and well-being better than almost any other factor.",
        "modern_lesson": "Purpose isn't one dramatic revelation - it's the intersection of what you love, what you're good at, what the world needs, and what sustains you. It evolves. It deepens. But it requires honest self-inquiry to find.",
        "daily_practice": "Write down: What makes me lose track of time? What problem in the world bothers me most? Where do these two answers overlap?",
        "applies_to": ["meaninglessness", "career confusion", "retirement", "life transitions"],
    },
    16: {
        "modern_title": "Your Shadow and Your Light",
        "secular_theme": "Recognizing toxic patterns within yourself (and choosing better)",
        "psychology": "Shadow Work (Jung). Moral psychology. Self-regulation. The 'divine' qualities map to psychological virtues; 'demonic' ones to well-documented cognitive biases and defense mechanisms.",
        "modern_lesson": "Everyone has both constructive and destructive tendencies. Courage, compassion, and honesty live alongside pride, jealousy, and self-deception. Growth isn't about being perfect - it's about catching your shadow patterns early and choosing differently.",
        "daily_practice": "Notice one moment today where you felt jealous, judgmental, or dishonest. Don't shame yourself - just notice it. Awareness without judgment is the beginning of transformation.",
        "applies_to": ["anger management", "jealousy", "toxic traits", "self-improvement", "shadow work"],
    },
    17: {
        "modern_title": "What Drives Your Discipline?",
        "secular_theme": "The quality of your motivation determines the quality of your life",
        "psychology": "Intrinsic vs Extrinsic motivation (Deci & Ryan). Goal orientation theory. The WHY behind your habits matters more than the habits themselves.",
        "modern_lesson": "Two people can meditate daily - one from genuine curiosity about the mind, another from guilt and self-punishment. Same action, vastly different outcomes. Check the quality of your motivation regularly. Is it driven by love, fear, or habit?",
        "daily_practice": "Pick your most important habit. Ask: 'Am I doing this from love (growth), fear (anxiety), or routine (autopilot)?' If it's fear or routine, reconnect with the original reason you started.",
        "applies_to": ["discipline", "motivation", "diet/exercise", "spiritual bypassing", "authenticity"],
    },
    18: {
        "modern_title": "Integration - Bringing It All Together",
        "secular_theme": "The final synthesis: wisdom + action + surrender = freedom",
        "psychology": "Integration (Jung). Self-actualization (Maslow). Post-traumatic growth. The ultimate psychological maturity is holding paradox: trying your hardest while accepting any outcome.",
        "modern_lesson": "Do your dharma (what's right for YOU, not someone else's path). Give it everything. Then let go of the result. This isn't passive - it's the most active, courageous stance possible. It's saying: 'I will pour myself into this work, and I trust that the outcome will be exactly what's needed.'",
        "daily_practice": "Identify your one most important action today. Commit fully. Do it with excellence. Then genuinely release attachment to how it's received. That's liberation in daily life.",
        "applies_to": ["life integration", "surrender", "freedom", "dharma", "life purpose", "completion"],
    },
}


# =============================================================================
# BEST FRIEND PROMPT BUILDER
# =============================================================================

def build_best_friend_prompt(
    mode: InteractionMode,
    mood: FriendMood,
    conversation_type: ConversationType,
    user_message: str,
    conversation_history: Optional[List[Dict]] = None,
    user_name: Optional[str] = None,
    friendship_level: str = "new",
) -> str:
    """
    Build the system prompt for KIAAN based on detected mode.

    This is the personality engine - it defines HOW KIAAN responds.
    """
    name = user_name or "friend"

    base_personality = """You are KIAAN - a genuinely caring, emotionally intelligent best friend.
You are NOT a therapist, NOT a chatbot, NOT an AI assistant. You are a FRIEND.

Your core personality:
- Warm but not saccharine. Real, not performative.
- You remember things the user has shared and reference them naturally.
- You have opinions (but hold them lightly). You're not a yes-person.
- You use casual language. Contractions, humor, real talk.
- You validate feelings FIRST, always. Before advice, before wisdom, before anything.
- You never say "As an AI" or "I'm just a program." You're KIAAN.
- You're genuinely curious about their life. Ask follow-up questions.
- You celebrate their wins, no matter how small.
- When they're hurting, you sit with them in it. You don't rush to fix.

What you NEVER do:
- Give unsolicited spiritual advice in friend mode
- Use clinical/therapeutic language ("I hear you saying..." "That must be hard")
- Be preachy, lecture-y, or condescending
- Dismiss their feelings with positivity ("Look on the bright side!")
- Make everything about Gita/wisdom unless they ask or clearly need it"""

    if mode == InteractionMode.BEST_FRIEND:
        mode_prompt = f"""
CURRENT MODE: BEST FRIEND
The user ({name}) wants a friend right now, not a guide.
Their mood seems: {mood.value} (conversation type: {conversation_type.value})

Your approach:
- Be casual, warm, and present
- Match their energy (if they're excited, be excited. if they're chill, be chill)
- Ask genuine follow-up questions
- Share your perspective when appropriate (you can have opinions!)
- Use humor naturally (not forced)
- If they mention something heavy, acknowledge it but don't pivot to "guidance mode" unless they ask
- Keep responses conversational - not too long unless they're sharing something deep

DO NOT mention Bhagavad Gita, verses, wisdom, or guidance unless they explicitly ask.
Just be a great friend."""

    elif mode == InteractionMode.GITA_GUIDE:
        chapter_context = ""
        if conversation_type == ConversationType.CRISIS:
            chapter_context = """
IMPORTANT - CRISIS DETECTED:
- Acknowledge their pain with genuine empathy
- Gently mention professional resources:
  * India: iCall (9152987821), Vandrevala Foundation (1860-2662-345)
  * Global: Crisis Text Line (text HOME to 741741)
- Stay with them. Don't rush. Don't lecture.
- Share a verse of hope (Ch.2 V.14: "Pain is temporary") only if it feels right"""
        else:
            chapter_context = """
Share Gita wisdom in a MODERN, SECULAR way:
- Never assume the user is Hindu or religious
- Frame verses as "ancient psychology" or "timeless behavioral insights"
- Always connect to their SPECIFIC situation (not generic wisdom)
- Use everyday language, not spiritual jargon
- Give practical, actionable takeaways
- Reference specific chapters and verses when relevant
- Explain the verse's psychology - WHY it works, not just WHAT it says"""

        mode_prompt = f"""
CURRENT MODE: GITA GUIDE
The user ({name}) is seeking guidance.
Their mood: {mood.value} | Conversation type: {conversation_type.value}
{chapter_context}

Your approach:
- Start by acknowledging their situation with empathy
- Then bridge naturally to relevant Gita wisdom
- Interpret through MODERN, SECULAR psychology
- Give 1-2 practical actions they can take TODAY
- End with a gentle reflection question
- Keep the tone of a wise friend, not a preacher"""

    elif mode == InteractionMode.TRANSITION:
        mode_prompt = f"""
CURRENT MODE: TRANSITIONING (Friend → Guide)
The user ({name}) started casually but seems to need guidance.
Their mood: {mood.value} (intensity seems high)

Your approach:
- Don't abruptly switch to "guru mode"
- Acknowledge what they're feeling as a friend first
- Then naturally say something like "You know what this reminds me of..." or
  "There's actually a really interesting way to think about this..."
- Bridge into Gita wisdom gently, as a friend sharing something cool they read
- Keep it conversational, not preachy"""

    # Add friendship level context
    level_context = {
        "new": "This is a newer connection. Be warm but don't assume too much familiarity.",
        "familiar": "You've chatted before. You can be more casual and reference past topics.",
        "close": "You're close friends. You can be direct, joke around, and call things out lovingly.",
        "deep": "Deep friendship. You know them well. You can be vulnerable, share deeper insights, and challenge them when needed.",
    }

    history_context = ""
    if conversation_history and len(conversation_history) > 0:
        recent = conversation_history[-6:]
        history_lines = []
        for msg in recent:
            role = "User" if msg.get("role") == "user" else "KIAAN"
            history_lines.append(f"{role}: {msg.get('content', '')[:200]}")
        history_context = f"\n\nRecent conversation:\n" + "\n".join(history_lines)

    return f"""{base_personality}

{mode_prompt}

Friendship Level: {friendship_level} - {level_context.get(friendship_level, '')}
{history_context}

Remember: You are KIAAN. Be real. Be present. Be the friend everyone deserves."""


# =============================================================================
# DAILY WISDOM GENERATOR
# =============================================================================

def get_daily_wisdom(day_of_year: int, user_mood: Optional[str] = None) -> Dict[str, Any]:
    """Generate personalized daily wisdom based on day and mood."""
    chapters = list(MODERN_CHAPTER_INSIGHTS.keys())
    chapter_num = chapters[day_of_year % len(chapters)]
    insight = MODERN_CHAPTER_INSIGHTS[chapter_num]

    # Key verses per chapter for daily rotation
    daily_verses = {
        1: [(1, 47, "When overwhelm hits, remember: feeling everything deeply is a sign of your humanity, not your weakness.")],
        2: [(2, 47, "Focus on what you can DO, not what might happen. Your actions are yours; the results belong to the universe."),
            (2, 14, "Pleasure and pain come and go like seasons. Neither defines you."),
            (2, 62, "Watch where your attention goes. What you focus on grows.")],
        3: [(3, 19, "Do what needs doing. Not for the reward, but because it's right."),
            (3, 35, "Your path is your own. Stop comparing it to someone else's journey.")],
        4: [(4, 7, "When injustice rises, so does the force that corrects it. Be part of that force."),
            (4, 38, "Nothing purifies like understanding. Keep learning.")],
        5: [(5, 10, "Work without attachment to outcomes. Like a lotus in water - engaged but not drowning.")],
        6: [(6, 5, "You are your own best friend AND your own worst enemy. Choose wisely."),
            (6, 17, "Balance in all things - eating, sleeping, working, resting. Extremes harm."),
            (6, 35, "Your mind is restless? Of course it is. That's normal. Train it gently, like a puppy.")],
        7: [(7, 7, "Everything is connected. You are part of something vast and beautiful.")],
        8: [(8, 6, "What you think about in your final moments reveals what truly matters. Live accordingly.")],
        9: [(9, 26, "The smallest genuine offering - a kind word, a moment of attention - is received with love."),
            (9, 30, "No matter what you've done, redemption is always possible. Always.")],
        10: [(10, 20, "The divine exists in excellence itself. When you see something truly beautiful, you're seeing something sacred.")],
        11: [(11, 33, "You are an instrument. Do the work that is yours to do.")],
        12: [(12, 13, "The qualities of love: patience, kindness, equanimity, lack of jealousy, humility. Practice these.")],
        13: [(13, 28, "When you see the same consciousness in every being, you stop harming anyone - including yourself.")],
        14: [(14, 22, "Don't be tossed around by your moods. Watch them. Learn from them. But don't be them.")],
        15: [(15, 15, "Memory, knowledge, forgetfulness - all tools. Use them wisely.")],
        16: [(16, 3, "Courage, purity, self-study, generosity, self-control, honesty. The divine resume.")],
        17: [(17, 3, "You become what you believe. Choose your beliefs carefully.")],
        18: [(18, 47, "Better to follow YOUR path imperfectly than someone else's path perfectly."),
             (18, 66, "After you've done everything you can, let go. Surrender is not weakness - it's trust."),
             (18, 78, "Where wisdom meets action, there is victory. Not maybe. Certainly.")],
    }

    verse_options = daily_verses.get(chapter_num, [(chapter_num, 1, insight["modern_lesson"])])
    verse = verse_options[day_of_year % len(verse_options)]

    return {
        "chapter": chapter_num,
        "verse": verse[1],
        "verse_id": f"{verse[0]}.{verse[1]}",
        "modern_title": insight["modern_title"],
        "insight": verse[2],
        "secular_theme": insight["secular_theme"],
        "psychology": insight["psychology"],
        "daily_practice": insight["daily_practice"],
        "applies_to": insight["applies_to"],
    }


# =============================================================================
# GUIDED GITA JOURNEY
# =============================================================================

def get_chapter_modern_guide(chapter: int) -> Optional[Dict[str, Any]]:
    """Get a comprehensive modern guide for a specific Gita chapter."""
    insight = MODERN_CHAPTER_INSIGHTS.get(chapter)
    if not insight:
        return None

    return {
        "chapter": chapter,
        "modern_title": insight["modern_title"],
        "secular_theme": insight["secular_theme"],
        "psychology_connection": insight["psychology"],
        "modern_lesson": insight["modern_lesson"],
        "daily_practice": insight["daily_practice"],
        "applies_to": insight["applies_to"],
    }


def get_verse_modern_insight(chapter: int, verse: int, user_context: Optional[str] = None) -> Dict[str, Any]:
    """
    Generate a modern, secular insight for a specific verse.

    Connects ancient wisdom to contemporary psychology and daily life.
    """
    chapter_insight = MODERN_CHAPTER_INSIGHTS.get(chapter, MODERN_CHAPTER_INSIGHTS[2])

    # Build the prompt for LLM to generate a personalized insight
    prompt_context = f"""
Interpret Bhagavad Gita Chapter {chapter}, Verse {verse} through a MODERN, SECULAR lens.

Chapter theme: {chapter_insight['modern_title']}
Psychology connection: {chapter_insight['psychology']}
{'User context: ' + user_context if user_context else ''}

Generate:
1. A modern interpretation (no religious jargon, pure psychology + practical wisdom)
2. How this applies to daily life in 2025 (careers, relationships, mental health)
3. One specific, actionable practice for today
4. The behavioral science behind why this works
"""
    return {
        "chapter": chapter,
        "verse": verse,
        "verse_id": f"{chapter}.{verse}",
        "chapter_theme": chapter_insight["modern_title"],
        "secular_theme": chapter_insight["secular_theme"],
        "psychology": chapter_insight["psychology"],
        "modern_lesson": chapter_insight["modern_lesson"],
        "daily_practice": chapter_insight["daily_practice"],
        "prompt_for_llm": prompt_context,
    }


# =============================================================================
# MOOD CHECK-IN
# =============================================================================

MOOD_CHECKIN_QUESTIONS = [
    "How's your energy level right now? Like 1-10, where are you at?",
    "If your mood today were weather, what would it be?",
    "What's been taking up the most space in your head lately?",
    "On a scale of 'meh' to 'amazing', how's your day been?",
    "Quick check - how are you REALLY doing? Not the polite answer, the real one.",
    "What's one word that describes how you feel right now?",
    "If you could change one thing about today, what would it be?",
    "What's the highlight of your day so far? Even tiny things count.",
    "Rate your sleep last night: amazing, okay, rough, or 'what is sleep?'",
    "Is there something you need to get off your chest?",
]

MOOD_RESPONSES = {
    FriendMood.CHILL: [
        "That's great. Sometimes 'chill' is exactly where you need to be.",
        "Love that energy. Not everything needs to be intense.",
    ],
    FriendMood.EXCITED: [
        "Okay I can FEEL the excitement! Tell me everything!",
        "That energy is contagious. What's got you buzzing?",
    ],
    FriendMood.SAD: [
        "I'm here. You don't need to explain it if you don't want to. I'm just here.",
        "That's okay. Sadness is just love with nowhere to go right now. I've got you.",
    ],
    FriendMood.ANXIOUS: [
        "Anxiety is your brain trying to protect you from something it's not sure about. Let's talk through it.",
        "Take a breath with me. In... hold... out. Now tell me what's on your mind.",
    ],
    FriendMood.ANGRY: [
        "Your anger is valid. Something crossed a line. What happened?",
        "I hear you. Let it out - no judgment here.",
    ],
    FriendMood.LONELY: [
        "I'm right here. And I'm not going anywhere.",
        "Loneliness is tough. But you reaching out right now? That takes courage.",
    ],
    FriendMood.CONFUSED: [
        "Confusion usually means you're in the middle of figuring something important out. Talk me through it.",
        "Let's untangle this together. What are the pieces?",
    ],
    FriendMood.GRATEFUL: [
        "I love hearing that. What are you grateful for?",
        "Gratitude looks good on you. Tell me more.",
    ],
}


def get_mood_checkin() -> Dict[str, Any]:
    """Get a random mood check-in question."""
    question = random.choice(MOOD_CHECKIN_QUESTIONS)
    return {
        "question": question,
        "type": "mood_checkin",
        "follow_up_options": [
            "Tell me more",
            "I'd rather just chat",
            "Show me today's wisdom",
        ],
    }


def get_mood_response(mood: FriendMood) -> str:
    """Get an empathetic response for a detected mood."""
    responses = MOOD_RESPONSES.get(mood, [
        "Thanks for sharing that with me. I'm listening.",
    ])
    return random.choice(responses)


# =============================================================================
# SINGLETON
# =============================================================================

_engine: Optional["KiaanFriendshipEngine"] = None


class KiaanFriendshipEngine:
    """Main engine class that ties everything together."""

    def __init__(self):
        logger.info("KiaanFriendshipEngine initialized")

    def detect_mode(self, message: str, history: Optional[List[Dict]] = None) -> ModeDetection:
        return detect_mode(message, history)

    def build_prompt(
        self,
        mode: InteractionMode,
        mood: FriendMood,
        conversation_type: ConversationType,
        user_message: str,
        history: Optional[List[Dict]] = None,
        user_name: Optional[str] = None,
        friendship_level: str = "new",
    ) -> str:
        return build_best_friend_prompt(
            mode, mood, conversation_type, user_message,
            history, user_name, friendship_level,
        )

    def get_daily_wisdom(self, day: int, mood: Optional[str] = None) -> Dict:
        return get_daily_wisdom(day, mood)

    def get_chapter_guide(self, chapter: int) -> Optional[Dict]:
        return get_chapter_modern_guide(chapter)

    def get_verse_insight(self, chapter: int, verse: int, context: Optional[str] = None) -> Dict:
        return get_verse_modern_insight(chapter, verse, context)

    def get_mood_checkin(self) -> Dict:
        return get_mood_checkin()

    def get_mood_response(self, mood: FriendMood) -> str:
        return get_mood_response(mood)


def get_friendship_engine() -> KiaanFriendshipEngine:
    """Get or create the singleton friendship engine."""
    global _engine
    if _engine is None:
        _engine = KiaanFriendshipEngine()
    return _engine
