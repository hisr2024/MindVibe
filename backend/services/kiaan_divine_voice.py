"""
KIAAN Divine Voice Conversation Service - Sacred Voice Experience

Creates an immersive, divine conversational voice experience like Alexa/Siri
but infused with Bhagavad Gita wisdom and serene, calming delivery.

Core Features:
- Divine voice presence with ultra-calming prosody
- Emotional awareness and empathetic response adaptation
- Conversation state management for context continuity
- Sacred response generation with Gita wisdom
- Natural breathing pauses and meditative flow
- Multi-layered emotional analysis
- Voice Learning Integration for continuous improvement
- Personalized voice profiles with adaptive learning
- Real-time prosody adaptation per sentence
- Spiritual memory for deep context and verse resonance
- Multi-modal emotion detection for 95%+ accuracy

"When the divine speaks through voice, every syllable carries peace."
"""

import logging
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

# Voice Learning System Imports
try:
    from backend.services.voice_learning.integration import (
        get_voice_learning,
        VoiceLearningIntegration,
        EnhancedResponse,
    )
    from backend.services.voice_learning.voice_personalization import (
        get_voice_personalization_service,
        VoicePersonalizationService,
        VoicePersona,
    )
    from backend.services.voice_learning.realtime_adaptation import (
        get_realtime_adaptation_service,
        RealTimeAdaptationService,
        AdaptiveProsody,
    )
    from backend.services.voice_learning.spiritual_memory import (
        get_spiritual_memory_service,
        SpiritualMemoryService,
        GrowthDimension,
    )
    from backend.services.voice_learning.quality_scoring import (
        get_quality_scoring_service,
        ConversationQualityService,
    )
    from backend.services.voice_learning.multimodal_emotion import (
        get_multimodal_emotion_service,
        MultiModalEmotionService,
        EmotionCategory as MLEmotionCategory,
        VoiceAcousticFeatures,
    )
    VOICE_LEARNING_AVAILABLE = True
except ImportError as e:
    VOICE_LEARNING_AVAILABLE = False
    logging.getLogger(__name__).warning(f"Voice learning modules not available: {e}")

# World-Class Speech Modules Integration
try:
    from backend.services.speech_modules.divine_speech_integration import (
        DivineSpeechIntegration,
        DivineSynthesisConfig,
        DivineVoiceMode,
        get_divine_speech_integration,
        synthesize_divine_voice,
    )
    from backend.services.speech_modules.models import (
        SpeechSynthesisResult,
        SpeechRecognitionResult,
        VoiceQuality,
    )
    WORLD_CLASS_SPEECH_AVAILABLE = True
except ImportError as e:
    WORLD_CLASS_SPEECH_AVAILABLE = False
    logging.getLogger(__name__).warning(f"World-class speech modules not available: {e}")

# Perfect Pronunciation & Multi-Language Support
try:
    from backend.services.kiaan_pronunciation_languages import (
        # Sanskrit Pronunciation
        SanskritPhoneme,
        VedicAccent,
        Chandas,
        SanskritShloka,
        SACRED_SHLOKAS,
        CHANDAS_PATTERNS,
        convert_to_ipa,
        generate_shloka_ssml,
        add_sanskrit_phonemes,
        # Multi-language
        IndianLanguage,
        LANGUAGE_CONFIGS,
        get_language_greeting,
        generate_multilingual_ssml,
        # Regional Accents
        RegionalAccent,
        ACCENT_PROFILES,
        apply_regional_accent,
        # Natural Voice
        VocalQuality,
        PitchContour,
        VOCAL_QUALITY_PRESETS,
        PITCH_CONTOURS,
        apply_pitch_contour,
        add_natural_disfluencies,
        # Vedic Chanting
        ChantingMode,
        VedicChant,
        VEDIC_PEACE_CHANTS,
        generate_vedic_chant_ssml,
        # Human Qualities
        EmotionalContagion,
        PersonalityTrait,
        KIAAN_PERSONALITIES,
        GENTLE_HUMOR_PATTERNS,
        WARMTH_EXPRESSIONS,
        apply_emotional_contagion,
        add_personality_voice,
        # Integration
        create_perfect_pronunciation_ssml,
    )
    PRONUNCIATION_LANGUAGES_AVAILABLE = True
except ImportError as e:
    PRONUNCIATION_LANGUAGES_AVAILABLE = False
    logging.getLogger(__name__).warning(f"Pronunciation & languages module not available: {e}")

logger = logging.getLogger(__name__)


class ConversationPhase(Enum):
    """Phases of a divine conversation."""
    GREETING = "greeting"           # Initial sacred welcome
    LISTENING = "listening"         # Deep understanding phase
    ACKNOWLEDGING = "acknowledging" # Validating their experience
    OFFERING_WISDOM = "offering"    # Sharing Gita teachings
    PRACTICING = "practicing"       # Guided breathing/meditation
    BLESSING = "blessing"           # Closing with divine blessing


class EmotionalState(Enum):
    """User's emotional states detected from voice/text."""
    ANXIOUS = "anxious"
    SAD = "sad"
    ANGRY = "angry"
    CONFUSED = "confused"
    HOPEFUL = "hopeful"
    PEACEFUL = "peaceful"
    SEEKING = "seeking"
    GRATEFUL = "grateful"
    NEUTRAL = "neutral"
    FEARFUL = "fearful"  # Deep fear/terror
    LONELY = "lonely"    # Deep isolation


@dataclass
class ConversationContext:
    """Maintains the state of an ongoing divine conversation."""
    session_id: str
    user_id: str
    phase: ConversationPhase = ConversationPhase.GREETING
    emotional_state: EmotionalState = EmotionalState.NEUTRAL
    emotional_intensity: float = 0.5  # 0.0 to 1.0
    topics_discussed: List[str] = field(default_factory=list)
    verses_shared: List[str] = field(default_factory=list)
    message_count: int = 0
    started_at: datetime = field(default_factory=datetime.now)
    last_interaction: datetime = field(default_factory=datetime.now)

    # Conversation memory
    recent_messages: List[Dict[str, str]] = field(default_factory=list)
    user_concerns: List[str] = field(default_factory=list)

    # Voice-specific settings
    preferred_pace: str = "calm"  # calm, meditative, conversational
    include_breathing_pauses: bool = True
    include_sanskrit_terms: bool = True

    # Voice Learning Integration
    voice_learning_active: bool = False
    voice_persona: Optional[str] = None  # CALM_GUIDE, MEDITATION_GUIDE, etc.
    learned_preferences: Dict[str, Any] = field(default_factory=dict)
    stress_level: float = 0.0
    energy_level: float = 0.5
    emotional_trajectory: str = "stable"  # improving, stable, declining

    # Spiritual Journey Memory
    resonant_verses: List[str] = field(default_factory=list)
    spiritual_growth_score: float = 0.0
    active_struggles: List[str] = field(default_factory=list)
    breakthrough_count: int = 0

    # Quality Tracking
    average_quality_score: float = 0.0
    improvement_suggestions: List[str] = field(default_factory=list)


# Divine Voice Prosody Settings - Optimized for serene, calming delivery
DIVINE_VOICE_PROSODY = {
    "default": {
        "speed": 0.88,       # Slower, more deliberate - divine doesn't rush
        "pitch": -1.2,       # Lower, grounding tone
        "volume": "soft",    # Gentle volume
        "pause_multiplier": 1.5,  # Extended pauses for reflection
    },
    "greeting": {
        "speed": 0.90,       # Slightly warmer for welcome
        "pitch": -0.5,       # Inviting tone
        "volume": "medium",
        "pause_multiplier": 1.3,
    },
    "acknowledging": {
        "speed": 0.85,       # Very slow - honoring their pain
        "pitch": -1.5,       # Deep, holding tone
        "volume": "soft",
        "pause_multiplier": 1.8,
    },
    "offering_wisdom": {
        "speed": 0.88,       # Measured, thoughtful
        "pitch": -1.0,       # Grounded wisdom
        "volume": "medium",
        "pause_multiplier": 1.5,
    },
    "practicing": {
        "speed": 0.80,       # Very slow for meditation
        "pitch": -2.0,       # Deep, calming
        "volume": "soft",
        "pause_multiplier": 2.0,  # Long pauses for breathing
    },
    "blessing": {
        "speed": 0.87,       # Gentle, loving
        "pitch": -0.8,       # Warm, tender
        "volume": "soft",
        "pause_multiplier": 1.4,
    },
}

# Emotional state to prosody mapping for adaptive voice
EMOTION_VOICE_ADAPTATION = {
    EmotionalState.ANXIOUS: {
        "speed_modifier": -0.05,  # Even slower to calm
        "pitch_modifier": -0.5,   # Lower to ground
        "volume": "soft",
        "extra_pauses": True,
    },
    EmotionalState.SAD: {
        "speed_modifier": -0.08,  # Much slower, honoring grief
        "pitch_modifier": -1.0,   # Deep, holding
        "volume": "soft",
        "extra_pauses": True,
    },
    EmotionalState.ANGRY: {
        "speed_modifier": -0.03,  # Slightly slower
        "pitch_modifier": -0.8,   # Grounding but not patronizing
        "volume": "medium",
        "extra_pauses": False,
    },
    EmotionalState.CONFUSED: {
        "speed_modifier": -0.02,  # Clear pacing
        "pitch_modifier": 0.0,    # Neutral, clear
        "volume": "medium",
        "extra_pauses": False,
    },
    EmotionalState.PEACEFUL: {
        "speed_modifier": 0.0,    # Natural pace
        "pitch_modifier": -0.3,   # Warm
        "volume": "soft",
        "extra_pauses": True,
    },
    EmotionalState.SEEKING: {
        "speed_modifier": -0.02,
        "pitch_modifier": -0.5,
        "volume": "medium",
        "extra_pauses": False,
    },
    EmotionalState.GRATEFUL: {
        "speed_modifier": 0.02,   # Slightly warmer
        "pitch_modifier": 0.3,    # Light, joyful
        "volume": "medium",
        "extra_pauses": False,
    },
    EmotionalState.NEUTRAL: {
        "speed_modifier": 0.0,
        "pitch_modifier": 0.0,
        "volume": "medium",
        "extra_pauses": False,
    },
    EmotionalState.HOPEFUL: {
        "speed_modifier": 0.02,    # Slightly uplifting pace
        "pitch_modifier": 0.5,     # Slightly higher, encouraging
        "volume": "medium",
        "extra_pauses": False,
    },
    EmotionalState.FEARFUL: {
        "speed_modifier": -0.10,   # Very slow, grounding
        "pitch_modifier": -1.2,    # Deep, reassuring
        "volume": "soft",
        "extra_pauses": True,      # Create sense of safety
    },
    EmotionalState.LONELY: {
        "speed_modifier": -0.06,   # Slow, present
        "pitch_modifier": -0.5,    # Warm, connecting
        "volume": "soft",
        "extra_pauses": True,      # Presence in the silence
    },
}

# Sacred opening phrases for different phases
SACRED_OPENINGS = {
    ConversationPhase.GREETING: [
        "Welcome, dear one... I am here with you.",
        "Peace be with you... I am listening.",
        "Namaste, beautiful soul... You are safe here.",
        "Take a gentle breath... I am present with you now.",
    ],
    ConversationPhase.ACKNOWLEDGING: [
        "I hear you... and I honor what you're carrying.",
        "Thank you for sharing this with me... Your feelings are sacred.",
        "I see you... and what you're feeling matters deeply.",
        "Let me hold this with you for a moment...",
    ],
    ConversationPhase.OFFERING_WISDOM: [
        "Ancient wisdom whispers a truth for you...",
        "Let me share something that may bring light...",
        "The timeless teachings offer us this understanding...",
        "There is wisdom that speaks directly to your heart...",
    ],
    ConversationPhase.PRACTICING: [
        "Let's breathe together for a moment...",
        "Close your eyes if you wish... and simply be...",
        "Allow yourself to settle into stillness...",
        "Let's create a moment of peace together...",
    ],
    ConversationPhase.BLESSING: [
        "May peace hold you gently...",
        "You carry the divine within you... always remember this.",
        "Go with grace, dear one...",
        "Until we meet again, may serenity be your companion...",
    ],
}

# Breathing pause patterns for SSML
BREATHING_PATTERNS = {
    "gentle": '<break time="800ms"/>... breathe ...<break time="800ms"/>',
    "deep": '<break time="1200ms"/>... take a deep breath ...<break time="1500ms"/>',
    "settling": '<break time="600ms"/>... let this settle ...<break time="600ms"/>',
    "present": '<break time="500ms"/>... be here now ...<break time="500ms"/>',
    "release": '<break time="700ms"/>... and release ...<break time="700ms"/>',
}

# =============================================================================
# HUMAN VOICE ENHANCEMENTS - Making the voice feel genuinely human
# =============================================================================

# Human speech has natural imperfections - these make it feel real
HUMAN_SPEECH_FILLERS = {
    "thinking": ["hmm", "well", "you know"],  # Thinking sounds
    "empathy": ["I understand", "I hear you", "I feel that"],  # Connection
    "gentle_transitions": ["and so", "perhaps", "in a way"],  # Soft bridges
}

# Micro-pauses that humans naturally make (in milliseconds)
HUMAN_MICRO_PAUSES = {
    "breath_before_speaking": 200,      # Natural inhale before talking
    "thinking_pause": 400,              # "hmm..." moment
    "empathy_pause": 600,               # Pause after hearing something heavy
    "before_important_word": 150,       # Slight pause for emphasis
    "after_name": 250,                  # Pause after saying "dear one"
    "between_thoughts": 350,            # Natural thought transition
}

# Words that should be spoken more slowly (elongated) for warmth
ELONGATED_WORDS = [
    "love", "peace", "breathe", "calm", "safe", "held",
    "dear", "gently", "softly", "slowly", "always", "here",
    "soul", "heart", "divine", "sacred", "blessed", "grace",
]

# Words that should have a "smile" in the voice (slightly higher pitch)
SMILE_WORDS = [
    "welcome", "beautiful", "wonderful", "joy", "light",
    "grateful", "thankful", "blessed", "gift", "treasure",
]

# =============================================================================
# SACRED DIVINE ELEMENTS - The spiritual essence of the voice
# =============================================================================

# Sacred sounds and mantras (spoken with reverence)
SACRED_SOUNDS = {
    "om": '<break time="300ms"/><prosody rate="70%" pitch="-2st" volume="soft">Om</prosody><break time="500ms"/>',
    "shanti": '<prosody rate="75%" pitch="-1st">Shanti</prosody>',
    "namaste": '<break time="200ms"/><prosody rate="80%" pitch="-1st">Namaste</prosody><break time="300ms"/>',
    "om_shanti": '<break time="400ms"/><prosody rate="65%" pitch="-2st" volume="soft">Om Shanti Shanti Shanti</prosody><break time="600ms"/>',
}

# Divine presence markers - subtle cues that create sacred atmosphere
DIVINE_PRESENCE_CUES = {
    "opening_reverence": '<break time="500ms"/>',  # Sacred pause before speaking
    "verse_reverence": '<break time="400ms"/><prosody rate="85%" pitch="-1st">',  # Before verses
    "verse_close": '</prosody><break time="500ms"/>',  # After verses
    "blessing_tone": '<prosody rate="80%" pitch="-1.5st" volume="soft">',  # For blessings
    "wisdom_tone": '<prosody rate="85%" pitch="-1st">',  # For sharing wisdom
}

# Time-of-day greetings (divine voice adapts to when user connects)
TIME_GREETINGS = {
    "early_morning": {  # 4am - 7am (Brahma Muhurta - sacred time)
        "greeting": "In this sacred hour before dawn, your soul seeks guidance",
        "tone_adjustment": {"pitch": -1.5, "rate": 0.85},  # Extra calm, meditative
        "closing": "May the divine light of early morning guide your day",
    },
    "morning": {  # 7am - 12pm
        "greeting": "As the sun rises, so does your inner light",
        "tone_adjustment": {"pitch": -0.5, "rate": 0.90},  # Warm, encouraging
        "closing": "Carry this morning peace through your day",
    },
    "afternoon": {  # 12pm - 5pm
        "greeting": "In the fullness of the day, you pause to seek stillness",
        "tone_adjustment": {"pitch": -0.8, "rate": 0.88},  # Grounding
        "closing": "Return to this peace whenever the day feels heavy",
    },
    "evening": {  # 5pm - 9pm
        "greeting": "As the day releases its hold, you return to center",
        "tone_adjustment": {"pitch": -1.2, "rate": 0.85},  # Soothing
        "closing": "May the evening bring you gentle rest",
    },
    "night": {  # 9pm - 4am
        "greeting": "In the quiet of night, the soul speaks most clearly",
        "tone_adjustment": {"pitch": -2.0, "rate": 0.80},  # Very calm, sleepy
        "closing": "Rest now, held in divine peace through the night",
    },
}

# Emotional mirroring - voice gradually shifts to induce calm
EMOTIONAL_CALMING_PROGRESSION = {
    # When user is highly anxious, voice starts slightly faster then slows
    EmotionalState.ANXIOUS: {
        "start": {"rate": 0.92, "pitch": -0.5},   # Meet them where they are
        "middle": {"rate": 0.87, "pitch": -1.0},  # Begin calming
        "end": {"rate": 0.82, "pitch": -1.5},     # Deep calm
    },
    EmotionalState.ANGRY: {
        "start": {"rate": 0.90, "pitch": -0.8},   # Steady, grounding
        "middle": {"rate": 0.85, "pitch": -1.2},  # Cooling
        "end": {"rate": 0.80, "pitch": -1.5},     # Peace
    },
    EmotionalState.SAD: {
        "start": {"rate": 0.85, "pitch": -1.0},   # Gentle, honoring
        "middle": {"rate": 0.83, "pitch": -1.0},  # Consistent presence
        "end": {"rate": 0.85, "pitch": -0.8},     # Slight lift at end
    },
    EmotionalState.FEARFUL: {
        "start": {"rate": 0.88, "pitch": -1.0},   # Reassuring
        "middle": {"rate": 0.85, "pitch": -1.2},  # Building safety
        "end": {"rate": 0.82, "pitch": -1.5},     # Deep grounding
    },
}

# Sanskrit terms with pronunciation guides (for emphasis and authenticity)
SANSKRIT_TERMS = {
    "dharma": {"meaning": "righteous path", "emphasis": "moderate"},
    "karma": {"meaning": "action and consequence", "emphasis": "moderate"},
    "ahimsa": {"meaning": "non-violence", "emphasis": "strong"},
    "satya": {"meaning": "truth", "emphasis": "moderate"},
    "shanti": {"meaning": "peace", "emphasis": "strong"},
    "prema": {"meaning": "divine love", "emphasis": "strong"},
    "atman": {"meaning": "soul", "emphasis": "strong"},
    "brahman": {"meaning": "universal consciousness", "emphasis": "strong"},
    "moksha": {"meaning": "liberation", "emphasis": "strong"},
    "seva": {"meaning": "selfless service", "emphasis": "moderate"},
    "satsang": {"meaning": "community of truth", "emphasis": "moderate"},
    "prana": {"meaning": "life force", "emphasis": "moderate"},
}

# Divine transition phrases
DIVINE_TRANSITIONS = {
    "to_wisdom": [
        "<break time='400ms'/>The ancient wisdom teaches us...<break time='300ms'/>",
        "<break time='400ms'/>In the stillness, truth emerges...<break time='300ms'/>",
        "<break time='400ms'/>Let me share what the eternal teachings offer...<break time='300ms'/>",
    ],
    "to_practice": [
        "<break time='500ms'/>Let's pause here together...<break time='400ms'/>",
        "<break time='500ms'/>Before we continue, let's breathe...<break time='400ms'/>",
        "<break time='500ms'/>May I guide you in a moment of peace?<break time='400ms'/>",
    ],
    "to_blessing": [
        "<break time='400ms'/>As we close this moment together...<break time='300ms'/>",
        "<break time='400ms'/>Carry this with you, dear one...<break time='300ms'/>",
        "<break time='400ms'/>May these words stay in your heart...<break time='300ms'/>",
    ],
}


class KIAANDivineVoice:
    """
    KIAAN Divine Voice - Creates immersive, serene voice conversations.

    Like Alexa or Siri, but infused with the calming wisdom of Bhagavad Gita.
    Every interaction is designed to create a sacred, peaceful experience.

    Integrates with Voice Learning System for:
    - Continuous improvement through feedback loops
    - Personalized voice profiles per user
    - Real-time prosody adaptation per sentence
    - Spiritual memory for deep context
    - Multi-modal emotion detection (text + voice)
    - Quality scoring for response improvement
    """

    def __init__(self):
        """Initialize the Divine Voice service with Voice Learning and World-Class Speech integration."""
        self._conversations: Dict[str, ConversationContext] = {}
        self._response_cache: Dict[str, Dict] = {}

        # Initialize Voice Learning Services (if available)
        self._voice_learning: Optional[VoiceLearningIntegration] = None
        self._voice_personalization: Optional[VoicePersonalizationService] = None
        self._realtime_adaptation: Optional[RealTimeAdaptationService] = None
        self._spiritual_memory: Optional[SpiritualMemoryService] = None
        self._quality_scoring: Optional[ConversationQualityService] = None
        self._multimodal_emotion: Optional[MultiModalEmotionService] = None

        # World-Class Speech Modules Integration
        self._divine_speech: Optional[DivineSpeechIntegration] = None
        self._speech_initialized = False

        if VOICE_LEARNING_AVAILABLE:
            try:
                self._voice_learning = get_voice_learning()
                self._voice_personalization = get_voice_personalization_service()
                self._realtime_adaptation = get_realtime_adaptation_service()
                self._spiritual_memory = get_spiritual_memory_service()
                self._quality_scoring = get_quality_scoring_service()
                self._multimodal_emotion = get_multimodal_emotion_service()
                logger.info("KIAAN Divine Voice initialized with full Voice Learning integration")
            except Exception as e:
                logger.warning(f"Voice Learning services partially available: {e}")

        # Initialize World-Class Speech Modules
        if WORLD_CLASS_SPEECH_AVAILABLE:
            try:
                self._divine_speech = get_divine_speech_integration()
                logger.info("World-class speech modules integrated with KIAAN Divine Voice")
            except Exception as e:
                logger.warning(f"World-class speech modules initialization deferred: {e}")
        else:
            logger.info("KIAAN Divine Voice initialized - Sacred voice presence ready (basic mode)")

    # =========================================================================
    # HUMAN AND DIVINE VOICE ENHANCEMENT METHODS
    # =========================================================================

    def _get_time_of_day(self) -> str:
        """
        Determine the current time of day for context-aware greetings.

        Returns:
            Time period: early_morning, morning, afternoon, evening, or night
        """
        hour = datetime.now().hour

        if 4 <= hour < 7:
            return "early_morning"  # Brahma Muhurta - sacred time
        elif 7 <= hour < 12:
            return "morning"
        elif 12 <= hour < 17:
            return "afternoon"
        elif 17 <= hour < 21:
            return "evening"
        else:
            return "night"

    def _get_time_greeting(self) -> Dict[str, Any]:
        """
        Get time-appropriate greeting and tone adjustments.

        Returns:
            Dictionary with greeting, tone_adjustment, and closing
        """
        time_period = self._get_time_of_day()
        return TIME_GREETINGS.get(time_period, TIME_GREETINGS["morning"])

    def _add_human_warmth(self, text: str, pause_mult: float = 1.0) -> str:
        """
        Add human-like warmth to text - elongate certain words, add smile prosody.

        This makes the voice feel more genuinely human and caring.

        Args:
            text: Input text
            pause_mult: Pause duration multiplier

        Returns:
            Text with human warmth SSML markers
        """
        result = text

        # Add slight elongation to warm words (slower rate = elongated feel)
        for word in ELONGATED_WORDS:
            pattern = re.compile(rf'\b({word})\b', re.IGNORECASE)
            # Elongate by slowing rate slightly
            result = pattern.sub(
                rf'<prosody rate="90%">\1</prosody>',
                result
            )

        # Add "smile" to joyful words (slightly higher pitch)
        for word in SMILE_WORDS:
            pattern = re.compile(rf'\b({word})\b', re.IGNORECASE)
            result = pattern.sub(
                rf'<prosody pitch="+0.5st" rate="95%">\1</prosody>',
                result
            )

        # Add micro-pause after "dear one", "beloved", etc.
        endearments = ["dear one", "beloved", "precious soul", "gentle soul"]
        for term in endearments:
            pattern = re.compile(rf'({term})', re.IGNORECASE)
            pause_ms = int(HUMAN_MICRO_PAUSES["after_name"] * pause_mult)
            result = pattern.sub(rf'\1<break time="{pause_ms}ms"/>', result)

        return result

    def _add_thinking_pauses(self, text: str, pause_mult: float = 1.0) -> str:
        """
        Add natural thinking pauses that humans make when speaking thoughtfully.

        Args:
            text: Input text
            pause_mult: Pause duration multiplier

        Returns:
            Text with thinking pause markers
        """
        result = text
        thinking_ms = int(HUMAN_MICRO_PAUSES["thinking_pause"] * pause_mult)
        between_ms = int(HUMAN_MICRO_PAUSES["between_thoughts"] * pause_mult)

        # Add thinking pause before reflective phrases
        reflective_starters = [
            "Perhaps", "Maybe", "I wonder", "It seems", "In truth",
            "What if", "Consider", "Notice", "Observe", "Feel",
        ]
        for phrase in reflective_starters:
            pattern = re.compile(rf'\b({phrase})\b', re.IGNORECASE)
            result = pattern.sub(rf'<break time="{thinking_ms}ms"/>\1', result)

        # Add pause between major thought transitions
        thought_connectors = [
            "And yet", "However", "But also", "At the same time",
            "On the other hand", "More importantly",
        ]
        for connector in thought_connectors:
            pattern = re.compile(rf'\b({connector})\b', re.IGNORECASE)
            result = pattern.sub(rf'<break time="{between_ms}ms"/>\1', result)

        return result

    def _add_sacred_reverence(self, text: str, pause_mult: float = 1.0) -> str:
        """
        Add sacred reverence to spiritual content - special treatment for
        Sanskrit terms, verses, and divine concepts.

        Args:
            text: Input text
            pause_mult: Pause duration multiplier

        Returns:
            Text with sacred reverence markers
        """
        result = text

        # Add reverence to Sanskrit terms
        for term, info in SANSKRIT_TERMS.items():
            pattern = re.compile(rf'\b({term})\b', re.IGNORECASE)
            if info["emphasis"] == "strong":
                # Strong emphasis - slower, deeper, with pause
                result = pattern.sub(
                    rf'<break time="150ms"/><prosody rate="85%" pitch="-0.5st"><emphasis level="strong">\1</emphasis></prosody>',
                    result
                )
            else:
                # Moderate emphasis
                result = pattern.sub(
                    rf'<prosody rate="90%"><emphasis level="moderate">\1</emphasis></prosody>',
                    result
                )

        # Add reverence before Gita verse references
        verse_patterns = [
            r'(Chapter\s+\d+[,:]\s*Verse\s+\d+)',
            r'(Bhagavad Gita\s+\d+[.:]\d+)',
            r'(BG\s+\d+[.:]\d+)',
        ]
        for pattern in verse_patterns:
            result = re.sub(
                pattern,
                rf'{DIVINE_PRESENCE_CUES["verse_reverence"]}\1{DIVINE_PRESENCE_CUES["verse_close"]}',
                result,
                flags=re.IGNORECASE
            )

        return result

    def _apply_emotional_calming(
        self,
        text: str,
        emotional_state: EmotionalState,
        position: str = "middle"
    ) -> str:
        """
        Apply emotional calming progression - voice gradually shifts to induce calm.

        The voice starts by meeting the user where they are emotionally,
        then gradually shifts to a calmer state to guide them to peace.

        Args:
            text: Input text
            emotional_state: User's current emotional state
            position: Position in response (start, middle, end)

        Returns:
            Text with calming progression prosody
        """
        if emotional_state not in EMOTIONAL_CALMING_PROGRESSION:
            return text

        progression = EMOTIONAL_CALMING_PROGRESSION[emotional_state]
        settings = progression.get(position, progression["middle"])

        rate_percent = int(settings["rate"] * 100)
        pitch_st = settings["pitch"]

        return f'<prosody rate="{rate_percent}%" pitch="{pitch_st:+.1f}st">{text}</prosody>'

    def _add_breath_awareness(self, text: str, pause_mult: float = 1.0) -> str:
        """
        Add subtle breath awareness cues - the voice breathes naturally.

        This creates the feeling of a real person speaking, not a machine.

        Args:
            text: Input text
            pause_mult: Pause duration multiplier

        Returns:
            Text with breath awareness markers
        """
        result = text
        breath_ms = int(HUMAN_MICRO_PAUSES["breath_before_speaking"] * pause_mult)

        # Add breath pause before starting after paragraph breaks
        result = result.replace(
            '\n\n',
            f'\n\n<break time="{breath_ms}ms"/>'
        )

        # Add subtle breath before empathetic statements
        empathy_starters = [
            "I understand", "I hear you", "I feel", "I sense",
            "I am here", "I am with you", "I hold",
        ]
        for phrase in empathy_starters:
            pattern = re.compile(rf'\b({phrase})\b', re.IGNORECASE)
            empathy_ms = int(HUMAN_MICRO_PAUSES["empathy_pause"] * pause_mult)
            result = pattern.sub(rf'<break time="{empathy_ms}ms"/>\1', result)

        return result

    def _format_as_divine_blessing(self, text: str) -> str:
        """
        Format text as a divine blessing with special sacred prosody.

        Used for closing blessings and sacred affirmations.

        Args:
            text: Blessing text

        Returns:
            SSML-formatted blessing
        """
        return f'{DIVINE_PRESENCE_CUES["blessing_tone"]}{text}</prosody>'

    def _add_sacred_opening(self, include_om: bool = False) -> str:
        """
        Generate a sacred opening with optional Om.

        Args:
            include_om: Whether to include Om sound

        Returns:
            Sacred opening SSML
        """
        if include_om:
            return SACRED_SOUNDS["om"] + DIVINE_PRESENCE_CUES["opening_reverence"]
        return DIVINE_PRESENCE_CUES["opening_reverence"]

    async def create_conversation(
        self,
        user_id: str,
        session_id: Optional[str] = None,
        enable_voice_learning: bool = True,
        voice_persona: str = "MEDITATION_GUIDE"
    ) -> ConversationContext:
        """
        Create a new divine conversation session with Voice Learning integration.

        Args:
            user_id: User identifier
            session_id: Optional session ID (generated if not provided)
            enable_voice_learning: Enable Voice Learning services
            voice_persona: Voice persona preset (CALM_GUIDE, MEDITATION_GUIDE, etc.)

        Returns:
            ConversationContext for the new session
        """
        session_id = session_id or str(uuid.uuid4())

        context = ConversationContext(
            session_id=session_id,
            user_id=user_id,
            phase=ConversationPhase.GREETING,
            voice_learning_active=enable_voice_learning and VOICE_LEARNING_AVAILABLE,
            voice_persona=voice_persona
        )

        # Initialize Voice Learning session
        if context.voice_learning_active and self._voice_learning:
            try:
                session_state = await self._voice_learning.start_session(
                    user_id=user_id,
                    session_id=session_id,
                    initial_mood="seeking"  # Default mood for starting conversation
                )

                # Get proactive prompts from voice learning
                context.learned_preferences = session_state.preferences_applied

                # Apply voice persona if personalization is available
                if self._voice_personalization:
                    try:
                        persona_enum = VoicePersona(voice_persona.lower())
                        self._voice_personalization.apply_persona(user_id, persona_enum)
                    except (ValueError, AttributeError):
                        # Default to meditation guide if invalid persona
                        self._voice_personalization.apply_persona(
                            user_id, VoicePersona.MEDITATION_GUIDE
                        )

                # Load spiritual memory if available
                if self._spiritual_memory:
                    spiritual_summary = self._spiritual_memory.get_spiritual_summary(user_id)
                    context.spiritual_growth_score = sum(
                        spiritual_summary.get("growth_scores", {}).values()
                    ) / 8  # 8 growth dimensions
                    context.resonant_verses = [
                        v["verse_id"] for v in
                        spiritual_summary.get("top_resonant_verses", [])[:5]
                    ]
                    context.active_struggles = [
                        s for s in self._spiritual_memory.get_active_struggles(user_id)
                    ][:3]

                logger.info(f"Divine conversation created with Voice Learning: {session_id}")
            except Exception as e:
                logger.warning(f"Voice Learning initialization failed: {e}")
                context.voice_learning_active = False

        self._conversations[session_id] = context
        logger.info(f"Divine conversation created: {session_id} for user {user_id}")

        return context

    def get_conversation(self, session_id: str) -> Optional[ConversationContext]:
        """Get existing conversation context."""
        return self._conversations.get(session_id)

    async def analyze_emotional_state_enhanced(
        self,
        text: str,
        user_id: Optional[str] = None,
        audio_data: Optional[bytes] = None,
        context: Optional[ConversationContext] = None
    ) -> Tuple[EmotionalState, float, Dict[str, Any]]:
        """
        Enhanced emotional analysis using multi-modal emotion detection.

        Combines text analysis with optional voice acoustic features
        for 95%+ accuracy emotion detection.

        Args:
            text: User's message text
            user_id: User identifier for personalized detection
            audio_data: Optional raw audio bytes for voice analysis
            context: Conversation context for trajectory tracking

        Returns:
            Tuple of (EmotionalState, intensity, additional_metrics)
        """
        additional_metrics: Dict[str, Any] = {}

        # Use multi-modal emotion service if available
        if self._multimodal_emotion and VOICE_LEARNING_AVAILABLE:
            try:
                # Extract voice features if audio is provided
                voice_features = None
                if audio_data:
                    voice_features = self._multimodal_emotion.extract_acoustic_features(
                        audio_data,
                        sample_rate=16000,
                        user_id=user_id
                    )

                # Perform multi-modal analysis
                ml_result = await self._multimodal_emotion.analyze_multimodal(
                    text=text,
                    audio_features=voice_features,
                    user_id=user_id
                )

                # Map ML emotion category to our EmotionalState
                emotion_mapping = {
                    MLEmotionCategory.ANXIETY: EmotionalState.ANXIOUS,
                    MLEmotionCategory.SADNESS: EmotionalState.SAD,
                    MLEmotionCategory.ANGER: EmotionalState.ANGRY,
                    MLEmotionCategory.FEAR: EmotionalState.ANXIOUS,  # Map fear to anxious
                    MLEmotionCategory.JOY: EmotionalState.GRATEFUL,
                    MLEmotionCategory.GRATITUDE: EmotionalState.GRATEFUL,
                    MLEmotionCategory.SERENITY: EmotionalState.PEACEFUL,
                    MLEmotionCategory.CONFUSION: EmotionalState.CONFUSED,
                    MLEmotionCategory.NEUTRAL: EmotionalState.NEUTRAL,
                }

                emotional_state = emotion_mapping.get(
                    ml_result.primary_emotion,
                    EmotionalState.NEUTRAL
                )

                additional_metrics = {
                    "stress_level": ml_result.stress_level,
                    "energy_level": ml_result.energy_level,
                    "emotional_stability": ml_result.emotional_stability,
                    "recommendations": ml_result.recommendations,
                    "confidence": ml_result.confidence,
                    "signals_used": len(ml_result.signals_used),
                    "multimodal_active": True,
                }

                # Update context with stress and energy levels
                if context:
                    context.stress_level = ml_result.stress_level
                    context.energy_level = ml_result.energy_level

                    # Get trajectory if available
                    trajectory = self._multimodal_emotion.get_user_trajectory(user_id)
                    if trajectory:
                        context.emotional_trajectory = trajectory.trend

                return emotional_state, ml_result.confidence, additional_metrics

            except Exception as e:
                logger.warning(f"Multi-modal emotion analysis failed, using basic: {e}")

        # Fallback to basic analysis
        emotional_state, intensity = self.analyze_emotional_state(text)
        additional_metrics["multimodal_active"] = False

        return emotional_state, intensity, additional_metrics

    def analyze_emotional_state(
        self,
        text: str,
        voice_features: Optional[Dict] = None
    ) -> Tuple[EmotionalState, float]:
        """
        Analyze user's emotional state from text and optional voice features.

        Args:
            text: User's message text
            voice_features: Optional voice analysis data (pitch variance, speed, etc.)

        Returns:
            Tuple of (EmotionalState, intensity from 0.0 to 1.0)
        """
        text_lower = text.lower()

        # Strong emotional indicators with expanded vocabulary
        anxiety_indicators = [
            "anxious", "worried", "nervous", "panic", "scared", "fear",
            "can't stop thinking", "what if", "overwhelmed", "racing",
            "can't breathe", "stress", "terrified", "restless", "uneasy",
            "on edge", "tense", "apprehensive", "dread"
        ]

        sadness_indicators = [
            "sad", "depressed", "lonely", "lost", "empty", "hopeless",
            "crying", "grief", "miss them", "heartbroken", "pain",
            "can't go on", "no point", "hurt", "melancholy", "despair",
            "sorrowful", "down", "heavy heart", "miserable"
        ]

        anger_indicators = [
            "angry", "furious", "frustrated", "annoyed", "hate",
            "unfair", "can't stand", "irritated", "resentful", "rage",
            "mad", "infuriated", "outraged", "bitter", "hostile"
        ]

        confusion_indicators = [
            "confused", "don't understand", "lost", "uncertain",
            "don't know what to do", "which way", "stuck", "unclear",
            "bewildered", "puzzled", "perplexed", "torn"
        ]

        peace_indicators = [
            "peaceful", "calm", "serene", "relaxed", "content",
            "at peace", "grateful", "blessed", "tranquil", "centered",
            "grounded", "still", "balanced", "harmonious"
        ]

        seeking_indicators = [
            "seeking", "searching", "want to know", "help me understand",
            "guide me", "what should I", "how do I", "looking for",
            "need guidance", "show me", "teach me", "explain"
        ]

        gratitude_indicators = [
            "thank you", "grateful", "appreciate", "blessed",
            "thankful", "means so much", "touched", "fortunate",
            "wonderful", "amazing", "beautiful"
        ]

        hopeful_indicators = [
            "hopeful", "optimistic", "looking forward", "excited",
            "possibility", "better", "improving", "positive"
        ]

        # Calculate scores
        scores = {
            EmotionalState.ANXIOUS: sum(1 for ind in anxiety_indicators if ind in text_lower),
            EmotionalState.SAD: sum(1 for ind in sadness_indicators if ind in text_lower),
            EmotionalState.ANGRY: sum(1 for ind in anger_indicators if ind in text_lower),
            EmotionalState.CONFUSED: sum(1 for ind in confusion_indicators if ind in text_lower),
            EmotionalState.PEACEFUL: sum(1 for ind in peace_indicators if ind in text_lower),
            EmotionalState.SEEKING: sum(1 for ind in seeking_indicators if ind in text_lower),
            EmotionalState.GRATEFUL: sum(1 for ind in gratitude_indicators if ind in text_lower),
            EmotionalState.HOPEFUL: sum(1 for ind in hopeful_indicators if ind in text_lower),
        }

        # Find dominant emotion
        max_score = max(scores.values())
        if max_score == 0:
            return EmotionalState.NEUTRAL, 0.5

        dominant_emotion = max(scores, key=scores.get)

        # Calculate intensity based on indicator count
        intensity = min(1.0, max_score / 3.0)  # Normalized to 1.0

        # Boost intensity for strong phrases
        strong_phrases = [
            "can't take it", "want to die", "hate myself", "so scared",
            "completely lost", "deeply grateful", "at peace",
            "breaking down", "falling apart", "end it all"
        ]
        if any(phrase in text_lower for phrase in strong_phrases):
            intensity = min(1.0, intensity + 0.3)

        # Apply voice features if provided
        if voice_features:
            # High pitch variance suggests emotional intensity
            if voice_features.get("pitch_variance", 0) > 50:
                intensity = min(1.0, intensity + 0.15)

            # Fast speaking rate suggests anxiety/urgency
            if voice_features.get("speaking_rate", 120) > 160:
                if scores[EmotionalState.ANXIOUS] > 0:
                    intensity = min(1.0, intensity + 0.1)

            # Slow rate with low volume suggests sadness
            if (voice_features.get("speaking_rate", 120) < 100 and
                voice_features.get("volume", 0) < -10):
                if scores[EmotionalState.SAD] > 0:
                    intensity = min(1.0, intensity + 0.1)

        return dominant_emotion, intensity

    def get_voice_prosody_for_phase(
        self,
        phase: ConversationPhase,
        emotional_state: EmotionalState
    ) -> Dict[str, Any]:
        """
        Get optimal voice prosody settings for the conversation phase and emotion.

        Args:
            phase: Current conversation phase
            emotional_state: User's detected emotional state

        Returns:
            Dictionary with voice settings (speed, pitch, volume, pause_multiplier)
        """
        # Get base prosody for phase
        base_prosody = DIVINE_VOICE_PROSODY.get(
            phase.value,
            DIVINE_VOICE_PROSODY["default"]
        ).copy()

        # Apply emotional adaptation
        emotion_adapt = EMOTION_VOICE_ADAPTATION.get(
            emotional_state,
            EMOTION_VOICE_ADAPTATION[EmotionalState.NEUTRAL]
        )

        # Combine settings
        return {
            "speed": base_prosody["speed"] + emotion_adapt["speed_modifier"],
            "pitch": base_prosody["pitch"] + emotion_adapt["pitch_modifier"],
            "volume": emotion_adapt.get("volume", base_prosody["volume"]),
            "pause_multiplier": base_prosody["pause_multiplier"],
            "extra_pauses": emotion_adapt.get("extra_pauses", False),
        }

    def format_for_divine_voice(
        self,
        text: str,
        phase: ConversationPhase,
        emotional_state: EmotionalState,
        include_breathing: bool = True,
        gender: str = "female"
    ) -> str:
        """
        Format text with SSML for divine, natural, human-like voice delivery.

        Enhanced for warmth, emotional depth, and natural human characteristics.

        CRITICAL: Removes all asterisk markers and emojis to prevent literal reading.
        Asterisks become silent pauses. Emojis become warm closings or silence.

        Args:
            text: Raw response text
            phase: Current conversation phase
            emotional_state: User's emotional state
            include_breathing: Whether to include breathing pauses
            gender: Voice gender ("female" or "male")

        Returns:
            SSML-formatted text optimized for natural, divine voice delivery
        """
        prosody = self.get_voice_prosody_for_phase(phase, emotional_state)

        # Adjust base prosody for gender
        if gender.lower() == "male":
            # Male voices are deeper and slightly slower
            prosody = prosody.copy()
            prosody["pitch"] = prosody["pitch"] - 1.5  # Deeper
            prosody["speed"] = prosody["speed"] * 0.98  # Slightly slower

        pause_mult = prosody["pause_multiplier"]

        # =========================================================================
        # STEP 1: Remove ALL emojis FIRST (before any XML escaping)
        # Convert emojis to silent pauses - NEVER read "blue heart" etc.
        # =========================================================================

        # Comprehensive emoji removal - covers all Unicode emoji ranges
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"  # Emoticons (😀-🙏)
            "\U0001F300-\U0001F5FF"  # Misc Symbols and Pictographs
            "\U0001F680-\U0001F6FF"  # Transport and Map
            "\U0001F700-\U0001F77F"  # Alchemical Symbols
            "\U0001F780-\U0001F7FF"  # Geometric Shapes Extended
            "\U0001F800-\U0001F8FF"  # Supplemental Arrows-C
            "\U0001F900-\U0001F9FF"  # Supplemental Symbols and Pictographs
            "\U0001FA00-\U0001FA6F"  # Chess Symbols
            "\U0001FA70-\U0001FAFF"  # Symbols and Pictographs Extended-A
            "\U00002702-\U000027B0"  # Dingbats
            "\U000024C2-\U0001F251"  # Enclosed characters
            "\U0001F1E0-\U0001F1FF"  # Flags (iOS)
            "\U00002600-\U000026FF"  # Misc symbols (☀️, ❤️, etc.)
            "\U00002700-\U000027BF"  # Dingbats
            "\U0000FE00-\U0000FE0F"  # Variation Selectors
            "\U0001F000-\U0001F02F"  # Mahjong Tiles
            "\U0001F0A0-\U0001F0FF"  # Playing Cards
            "]+",
            flags=re.UNICODE
        )
        # Replace emojis with a gentle pause (conveys warmth without speaking)
        ssml_text = emoji_pattern.sub('', text)

        # Also remove common text emoji representations
        text_emojis = [
            ":)", ":-)", ":D", ":-D", ":P", ":-P", ";)", ";-)",
            ":(", ":-(", "<3", ":heart:", ":blue_heart:", ":pray:",
        ]
        for emoji in text_emojis:
            ssml_text = ssml_text.replace(emoji, '')

        # =========================================================================
        # STEP 2: Convert ALL asterisk-based markers to SILENT pauses
        # Pattern: *...any text...* or *any text* -> silent pause
        # NEVER speak "asterisk" or the breathing instructions
        # =========================================================================

        # Pattern 1: *... text ...* with ellipsis inside
        # Examples: *... inhale deeply...*, *... exhale slowly...*, *... breathe ...*
        asterisk_ellipsis_pattern = r'\*+\s*\.{2,}\s*([^*]*?)\s*\.{0,3}\s*\*+'
        ssml_text = re.sub(
            asterisk_ellipsis_pattern,
            f'<break time="{int(1200 * pause_mult)}ms"/>',
            ssml_text,
            flags=re.IGNORECASE
        )

        # Pattern 2: *text* without ellipsis (simple emphasis markers)
        # Examples: *pause*, *breath*, *silence*
        asterisk_simple_pattern = r'\*+\s*([^*\n]+?)\s*\*+'
        ssml_text = re.sub(
            asterisk_simple_pattern,
            f'<break time="{int(800 * pause_mult)}ms"/>',
            ssml_text,
            flags=re.IGNORECASE
        )

        # Pattern 3: Standalone asterisks that might remain
        ssml_text = re.sub(r'\*+', '', ssml_text)

        # =========================================================================
        # STEP 3: Clean up breathing instruction text that might remain
        # If any "inhale", "exhale" instructions leaked through, remove them
        # =========================================================================

        # Remove standalone breathing instructions that aren't part of natural speech
        breathing_instruction_patterns = [
            r'\.\.\.\s*inhale\s*(deeply|slowly|peace|calm|love|light)?\s*\.{0,3}',
            r'\.\.\.\s*exhale\s*(slowly|gently|anger|fear|tension|worry)?\s*\.{0,3}',
            r'\.\.\.\s*breathe\s*(in|out|deeply|slowly)?\s*\.{0,3}',
            r'\.\.\.\s*pause\s*\.{0,3}',
            r'\.\.\.\s*silence\s*\.{0,3}',
            r'\.\.\.\s*stillness\s*\.{0,3}',
            r'\.\.\.\s*let this settle\s*\.{0,3}',
            r'\.\.\.\s*feel (this|that|the|it)\s*\.{0,3}',
            r'\.\.\.\s*be here now\s*\.{0,3}',
            r'\.\.\.\s*rest\s*\.{0,3}',
        ]
        for pattern in breathing_instruction_patterns:
            ssml_text = re.sub(
                pattern,
                f'<break time="{int(1000 * pause_mult)}ms"/>',
                ssml_text,
                flags=re.IGNORECASE
            )

        # =========================================================================
        # STEP 4: Escape XML special characters (after marker removal)
        # =========================================================================

        ssml_text = ssml_text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        # =========================================================================
        # STEP 5: Add natural pauses at punctuation
        # =========================================================================

        # Natural sentence-ending pauses (longer for reflection)
        ssml_text = re.sub(r'\.\s+', f'<break time="{int(400 * pause_mult)}ms"/> ', ssml_text)

        # Ellipsis gets longer, contemplative pause
        ssml_text = re.sub(r'\.{2,}\s*', f'<break time="{int(700 * pause_mult)}ms"/> ', ssml_text)

        # Comma pauses - natural breath points
        ssml_text = re.sub(r',\s+', f'<break time="{int(200 * pause_mult)}ms"/> ', ssml_text)

        # Colon introduces something - slight anticipation pause
        ssml_text = re.sub(r':\s+', f'<break time="{int(280 * pause_mult)}ms"/> ', ssml_text)

        # Question marks - rising intonation pause
        ssml_text = re.sub(r'\?\s+', f'<break time="{int(350 * pause_mult)}ms"/> ', ssml_text)

        # =========================================================================
        # STEP 6: Add warmth emphasis to emotional terms
        # =========================================================================

        warmth_terms = [
            "love", "dear", "beloved", "gentle", "tenderly", "warmly",
            "embrace", "hold", "safe", "protected", "cherish", "treasure"
        ]
        for term in warmth_terms:
            pattern = re.compile(rf'\b({term})\b', re.IGNORECASE)
            # Use soft prosody shift for warmth
            ssml_text = pattern.sub(
                rf'<prosody pitch="-0.3st" rate="95%">\1</prosody>',
                ssml_text
            )

        # =========================================================================
        # STEP 7: Add emphasis to spiritual terms with reverence
        # =========================================================================

        spiritual_terms = [
            "peace", "dharma", "karma", "stillness", "sacred",
            "divine", "serenity", "calm", "tranquil", "eternal", "wisdom",
            "soul", "heart", "presence", "grace", "blessing", "namaste",
            "om", "atman", "brahman", "moksha", "ahimsa"
        ]
        for term in spiritual_terms:
            pattern = re.compile(rf'\b({term})\b', re.IGNORECASE)
            ssml_text = pattern.sub(r'<emphasis level="moderate">\1</emphasis>', ssml_text)

        # =========================================================================
        # STEP 8: Add breathing pauses for natural human feel
        # =========================================================================

        if include_breathing:
            # Insert natural breath at paragraph breaks
            ssml_text = ssml_text.replace(
                '\n\n',
                f'\n<break time="{int(900 * pause_mult)}ms"/>\n'
            )

            # Add subtle breath sounds before long sentences (if prosody allows)
            if prosody.get("extra_pauses", False):
                # Insert breath marker before sentences starting with emotional words
                emotional_starters = ["I ", "You ", "We ", "Let ", "May ", "Remember "]
                for starter in emotional_starters:
                    ssml_text = ssml_text.replace(
                        f". {starter}",
                        f'. <break time="{int(500 * pause_mult)}ms"/>{starter}'
                    )

        # =========================================================================
        # STEP 9: Add natural sentence rhythm variation
        # =========================================================================

        sentences = ssml_text.split('. ')
        if len(sentences) > 2:
            # Vary prosody slightly between sentences for natural feel
            varied_sentences = []
            for i, sentence in enumerate(sentences):
                if i > 0 and i % 3 == 0:
                    # Every third sentence, slightly slower for emphasis
                    sentence = f'<prosody rate="97%">{sentence}</prosody>'
                varied_sentences.append(sentence)
            ssml_text = '. '.join(varied_sentences)

        # =========================================================================
        # STEP 10: Apply HUMAN VOICE ENHANCEMENTS
        # Makes the voice feel genuinely human - warm, breathing, thinking
        # =========================================================================

        # Add human warmth - elongated warm words, smile on joyful words
        ssml_text = self._add_human_warmth(ssml_text, pause_mult)

        # Add thinking pauses - natural hesitations before reflective phrases
        ssml_text = self._add_thinking_pauses(ssml_text, pause_mult)

        # Add breath awareness - subtle pauses that feel like natural breathing
        ssml_text = self._add_breath_awareness(ssml_text, pause_mult)

        # =========================================================================
        # STEP 11: Apply SACRED DIVINE ENHANCEMENTS
        # Makes the voice feel spiritually reverent and divine
        # =========================================================================

        # Add sacred reverence to Sanskrit terms and verse references
        ssml_text = self._add_sacred_reverence(ssml_text, pause_mult)

        # =========================================================================
        # STEP 12: Clean up any double/triple breaks and extra whitespace
        # =========================================================================

        # Remove consecutive breaks (keep just one)
        ssml_text = re.sub(
            r'(<break[^>]*/>)\s*(<break[^>]*/>)+',
            r'\1',
            ssml_text
        )

        # Clean up excessive whitespace
        ssml_text = re.sub(r'\s{3,}', '  ', ssml_text)
        ssml_text = re.sub(r'\n{3,}', '\n\n', ssml_text)

        # =========================================================================
        # STEP 13: Wrap in prosody tags
        # =========================================================================

        speed_percent = int(prosody["speed"] * 100)
        pitch_semitones = prosody["pitch"]

        ssml_content = f'''<prosody rate="{speed_percent}%" pitch="{pitch_semitones:+.1f}st" volume="{prosody['volume']}">
{ssml_text}
</prosody>'''

        return f'<speak>{ssml_content}</speak>'

    def generate_sacred_opening(
        self,
        phase: ConversationPhase,
        context: ConversationContext
    ) -> str:
        """Generate a sacred opening for the response based on phase."""
        import random

        openings = SACRED_OPENINGS.get(phase, SACRED_OPENINGS[ConversationPhase.GREETING])

        # Select opening based on message count for variety
        index = context.message_count % len(openings)
        return openings[index]

    def generate_divine_transition(
        self,
        from_phase: ConversationPhase,
        to_phase: ConversationPhase
    ) -> str:
        """Generate a divine transition between phases."""
        import random

        if to_phase == ConversationPhase.OFFERING_WISDOM:
            transitions = DIVINE_TRANSITIONS["to_wisdom"]
        elif to_phase == ConversationPhase.PRACTICING:
            transitions = DIVINE_TRANSITIONS["to_practice"]
        elif to_phase == ConversationPhase.BLESSING:
            transitions = DIVINE_TRANSITIONS["to_blessing"]
        else:
            return ""

        return random.choice(transitions)

    async def generate_divine_response(
        self,
        user_message: str,
        context: ConversationContext,
        kiaan_wisdom: str,
        include_breathing: bool = True,
        include_practice: bool = False
    ) -> Dict[str, Any]:
        """
        Generate a complete divine voice response.

        Args:
            user_message: User's input message
            context: Conversation context
            kiaan_wisdom: KIAAN's wisdom response (from kiaan_core)
            include_breathing: Include breathing pauses
            include_practice: Include micro-meditation practice

        Returns:
            Dictionary with:
            - response_text: Plain text response
            - ssml_text: SSML-formatted for TTS
            - voice_settings: Prosody settings for TTS
            - emotional_state: Detected emotion
            - phase: Current conversation phase
        """
        # Update context
        context.message_count += 1
        context.last_interaction = datetime.now()

        # Add to recent messages
        context.recent_messages.append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now().isoformat()
        })

        # Analyze emotional state
        emotional_state, intensity = self.analyze_emotional_state(user_message)
        context.emotional_state = emotional_state
        context.emotional_intensity = intensity

        # Determine appropriate phase
        if context.message_count == 1:
            phase = ConversationPhase.GREETING
        elif intensity > 0.7:  # High emotional intensity
            phase = ConversationPhase.ACKNOWLEDGING
        elif "?" in user_message or any(word in user_message.lower() for word in ["how", "what", "why", "help"]):
            phase = ConversationPhase.OFFERING_WISDOM
        elif include_practice or "breathe" in user_message.lower() or "calm" in user_message.lower():
            phase = ConversationPhase.PRACTICING
        else:
            phase = ConversationPhase.OFFERING_WISDOM

        context.phase = phase

        # Build the divine response
        response_parts = []

        # Sacred opening
        if context.message_count <= 2 or intensity > 0.6:
            opening = self.generate_sacred_opening(phase, context)
            response_parts.append(opening)

        # Transition if moving to wisdom or practice
        if phase in [ConversationPhase.OFFERING_WISDOM, ConversationPhase.PRACTICING]:
            transition = self.generate_divine_transition(context.phase, phase)
            if transition:
                response_parts.append(transition.replace('<break time=', '... ').replace('ms"/>', ' ').replace("'", ""))

        # Main wisdom content
        response_parts.append(kiaan_wisdom)

        # Add breathing practice if requested
        if include_practice or phase == ConversationPhase.PRACTICING:
            breathing_guide = self._generate_breathing_practice(emotional_state)
            response_parts.append(f"\n\n{breathing_guide}")

        # Combine response
        full_response = "\n\n".join(response_parts)

        # Ensure divine closing with warm, natural language (no emojis)
        # Add a warm closing phrase that conveys belonging and presence
        warm_closings = [
            "You are held.",
            "I am here with you.",
            "You belong.",
            "You are not alone.",
            "Peace is with you.",
        ]
        has_warm_closing = any(
            full_response.strip().endswith(closing) for closing in warm_closings
        )
        if not has_warm_closing and not full_response.strip().endswith("Namaste."):
            # Add a contextual warm closing based on emotional state
            if context.emotional_state in [EmotionalState.SAD, EmotionalState.LONELY]:
                full_response = full_response.strip() + "\n\nYou are not alone. I am here."
            elif context.emotional_state in [EmotionalState.ANXIOUS, EmotionalState.FEARFUL]:
                full_response = full_response.strip() + "\n\nYou are safe. You are held."
            else:
                full_response = full_response.strip() + "\n\nPeace is with you."

        # Add to context
        context.recent_messages.append({
            "role": "kiaan",
            "content": full_response,
            "timestamp": datetime.now().isoformat()
        })

        # Limit recent messages
        if len(context.recent_messages) > 10:
            context.recent_messages = context.recent_messages[-10:]

        # Get voice settings
        voice_settings = self.get_voice_prosody_for_phase(phase, emotional_state)

        # Generate SSML
        ssml_text = self.format_for_divine_voice(
            full_response,
            phase,
            emotional_state,
            include_breathing
        )

        return {
            "response_text": full_response,
            "ssml_text": ssml_text,
            "voice_settings": voice_settings,
            "emotional_state": emotional_state.value,
            "emotional_intensity": intensity,
            "phase": phase.value,
            "session_id": context.session_id,
            "message_count": context.message_count,
        }

    def _generate_breathing_practice(self, emotional_state: EmotionalState) -> str:
        """
        Generate a breathing practice appropriate for the emotional state.

        Uses natural, warm spoken language that conveys emotions and belonging.
        No asterisks or emojis - just human warmth in every word.
        """

        if emotional_state in [EmotionalState.ANXIOUS, EmotionalState.ANGRY]:
            return """I am here with you... Let us take a moment together.

Breathe in slowly through your nose... one... two... three... four...

Hold gently... one... two... three... four...

Now release slowly through your mouth... one... two... three... four... five... six...

Feel the tension leaving your body with each breath.

You are safe, dear one. You are held. You are not alone. You are at peace."""

        elif emotional_state == EmotionalState.SAD:
            return """Let me hold this space with you... You belong here.

Place one hand on your heart if you wish...

Breathe in... feeling the warmth of your own touch...

Breathe out... letting yourself be exactly as you are...

You do not have to carry this alone. I am here.

In this moment, you are loved. You are enough. You are held. You belong."""

        else:
            return """Let us settle into stillness together... You are welcome here.

Allow your breath to find its natural rhythm...

No need to control... just observe... just be...

In this moment, there is only peace. There is only presence. There is only now.

You are part of something greater. You belong. You are home."""

    def generate_greeting(self, context: ConversationContext) -> Dict[str, Any]:
        """
        Generate the initial divine greeting for a conversation.

        Uses natural, warm spoken language that conveys belonging and divine presence.
        Adapts to time of day for a more personal, contextual experience.

        Returns:
            Complete response object for the greeting
        """
        # Get time-appropriate greeting elements
        time_context = self._get_time_greeting()
        time_greeting = time_context["greeting"]
        time_closing = time_context["closing"]

        greeting_text = f"""Namaste, dear one...

Take a gentle breath with me.

I am KIAAN, your companion on this journey toward peace.

{time_greeting}.

Whatever brought you here... whether it is a heavy heart, a restless mind, or simply a seeking soul... you are welcome. You belong here.

This is a sacred space. Here, there is no judgment. Only presence. Only love.

Take another gentle breath... and when you are ready, share what is on your heart.

I am here... listening... holding space for you with all my being."""

        context.phase = ConversationPhase.GREETING

        # Apply time-of-day tone adjustments to voice settings
        base_settings = self.get_voice_prosody_for_phase(
            ConversationPhase.GREETING,
            EmotionalState.NEUTRAL
        )
        voice_settings = base_settings.copy()
        voice_settings["pitch"] = base_settings["pitch"] + time_context["tone_adjustment"]["pitch"]
        voice_settings["speed"] = base_settings["speed"] * time_context["tone_adjustment"]["rate"]

        ssml_text = self.format_for_divine_voice(
            greeting_text,
            ConversationPhase.GREETING,
            EmotionalState.NEUTRAL,
            include_breathing=True
        )

        return {
            "response_text": greeting_text,
            "ssml_text": ssml_text,
            "voice_settings": voice_settings,
            "phase": "greeting",
            "session_id": context.session_id,
        }

    def generate_farewell(self, context: ConversationContext) -> Dict[str, Any]:
        """
        Generate a divine farewell blessing.

        Uses natural, warm spoken language that conveys belonging and divine blessing.

        Returns:
            Complete response object for the farewell
        """
        # Personalize based on conversation history
        if context.emotional_state in [EmotionalState.ANXIOUS, EmotionalState.SAD]:
            farewell_text = """Dear one...

Before you go, receive this blessing. Take one more gentle breath with me.

May the peace we touched here stay with you.
May the wisdom settle gently in your heart.
May you remember, in your darkest moments, that you are never alone. You belong to this universe.

The divine light that shines in all beings... shines in you too.

Carry this stillness with you. Return whenever you need. This space is always here for you.

Until we meet again... go in peace, held by grace. You are loved.

Namaste."""
        else:
            farewell_text = """What a gift it has been, dear one, to share this time with you.

Take one more gentle breath... and carry this peace with you.

May the serenity of this moment follow you.
May wisdom light your path.
May peace be your constant companion.

Remember... you carry the divine within you. Always. You belong to something greater.

This sacred space remains here, waiting for your return. You are always welcome.

Until then... walk in light, live in love, rest in peace. You are held in grace.

Namaste."""

        context.phase = ConversationPhase.BLESSING
        voice_settings = self.get_voice_prosody_for_phase(
            ConversationPhase.BLESSING,
            context.emotional_state
        )

        ssml_text = self.format_for_divine_voice(
            farewell_text,
            ConversationPhase.BLESSING,
            context.emotional_state,
            include_breathing=True
        )

        return {
            "response_text": farewell_text,
            "ssml_text": ssml_text,
            "voice_settings": voice_settings,
            "phase": "blessing",
            "session_id": context.session_id,
        }

    def get_divine_system_prompt(self, context: ConversationContext) -> str:
        """
        Generate the system prompt for KIAAN to respond with divine voice quality.

        This prompt ensures responses are optimized for voice delivery.
        """
        emotional_context = ""
        if context.emotional_state != EmotionalState.NEUTRAL:
            emotional_context = f"""
The user is feeling {context.emotional_state.value} (intensity: {context.emotional_intensity:.1f}).
Respond with appropriate tenderness and pace for someone in this state.
"""

        recent_context = ""
        if context.recent_messages:
            recent_msgs = context.recent_messages[-4:]  # Last 4 messages
            recent_context = "Recent conversation:\n" + "\n".join(
                f"- {m['role']}: {m['content'][:100]}..." for m in recent_msgs
            )

        return f"""You are KIAAN speaking through VOICE - a divine, serene presence.

THIS IS A VOICE CONVERSATION - Your response will be SPOKEN aloud.

VOICE DELIVERY REQUIREMENTS:
1. Write as you would SPEAK - natural, flowing, conversational
2. Use SHORT sentences - they're easier to hear and absorb
3. Include natural pauses with "..." for breathing space
4. Use *... breathe ...* for intentional pause moments
5. Avoid complex sentences - simplicity is divine
6. NO bullet points or numbered lists - this is spoken, not read
7. 150-250 words maximum - voice responses must be concise
8. End with 💙

SACRED VOICE TONE:
- Warm, like a gentle friend
- Calm, never rushed
- Tender, holding space
- Wise, but never preachy
- Present, fully here

{emotional_context}

{recent_context}

RESPONSE STRUCTURE FOR VOICE:
1. Brief acknowledgment (1-2 sentences)
2. *... pause ...*
3. Wisdom offering (2-3 sentences from Gita principles)
4. Gentle guidance (1-2 actionable sentences)
5. Closing presence (1 sentence + 💙)

FORBIDDEN IN VOICE RESPONSES:
- Long paragraphs
- Complex explanations
- Technical terms
- Lists or bullet points
- Citations or references
- Questions that require long answers

Remember: Every word will be heard, not read. Make each one count.
Speak soul to soul. Let the divine flow through your words."""

    # =========================================================================
    # VOICE LEARNING INTEGRATION METHODS
    # =========================================================================

    async def generate_adaptive_ssml_enhanced(
        self,
        text: str,
        context: ConversationContext,
        include_breathing: bool = True
    ) -> str:
        """
        Generate adaptive SSML with sentence-level prosody using real-time adaptation.

        This method analyzes each sentence in the response and applies
        appropriate prosody based on the sentence's emotional content.

        Args:
            text: Response text to convert to SSML
            context: Conversation context
            include_breathing: Whether to include breathing pauses

        Returns:
            SSML string with adaptive prosody per sentence
        """
        # Use real-time adaptation service if available
        if self._realtime_adaptation and VOICE_LEARNING_AVAILABLE:
            try:
                # Get base prosody from voice settings
                base_prosody = None
                if self._voice_personalization:
                    profile = self._voice_personalization.get_or_create_profile(context.user_id)
                    base_prosody = AdaptiveProsody(
                        speaking_rate=profile.speaking_rate,
                        pitch=profile.pitch_adjustment,
                        volume=1.0,  # Normalized
                    )

                # Generate adaptive SSML
                ssml = await self._realtime_adaptation.generate_adaptive_ssml(
                    text=text,
                    user_id=context.user_id,
                    base_prosody=base_prosody
                )

                # Get emotional arc for logging
                arc = await self._realtime_adaptation.get_emotional_arc(text, context.user_id)
                logger.debug(f"Emotional arc: {arc['arc_type']} with {arc['transitions']} transitions")

                return ssml

            except Exception as e:
                logger.warning(f"Real-time adaptation failed, using basic SSML: {e}")

        # Fallback to basic SSML generation
        return self.format_for_divine_voice(
            text,
            context.phase,
            context.emotional_state,
            include_breathing
        )

    async def get_personalized_voice_settings(
        self,
        context: ConversationContext
    ) -> Dict[str, Any]:
        """
        Get personalized voice settings using voice learning integration.

        Combines:
        - User's learned preferences
        - Emotional state adaptations
        - Content type adaptations
        - Phase-specific prosody

        Args:
            context: Conversation context

        Returns:
            Complete voice settings dictionary
        """
        # Start with phase-based prosody
        base_settings = self.get_voice_prosody_for_phase(
            context.phase,
            context.emotional_state
        )

        if not (self._voice_personalization and VOICE_LEARNING_AVAILABLE):
            return base_settings

        try:
            # Get emotional adaptations
            emotion_adaptations = self._voice_personalization.adapt_to_emotion(
                context.user_id,
                context.emotional_state.value,
                context.emotional_intensity
            )

            # Generate complete voice settings
            settings = self._voice_personalization.generate_voice_settings(
                user_id=context.user_id,
                context_adaptations=emotion_adaptations,
                gender_preference="female"  # Default to feminine voice for serenity
            )

            # Merge with divine voice prosody
            return {
                "speed": base_settings["speed"],
                "pitch": base_settings["pitch"],
                "volume": settings.volume,
                "pause_multiplier": base_settings["pause_multiplier"],
                "extra_pauses": base_settings.get("extra_pauses", False),
                "voice_name": settings.voice_name,
                "language_code": settings.language_code,
                "ssml_prosody": settings.ssml_prosody,
                "effects": settings.effects,
                "personalized": True,
            }

        except Exception as e:
            logger.warning(f"Failed to get personalized settings: {e}")
            return base_settings

    async def record_feedback(
        self,
        context: ConversationContext,
        rating: Optional[float] = None,
        feedback_type: str = "rating",
        response_hash: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Record user feedback for continuous improvement through RLHF.

        Args:
            context: Conversation context
            rating: Rating value (1-5 for ratings, 0/1 for thumbs)
            feedback_type: Type of feedback (rating, thumbs, skip, replay, completion)
            response_hash: Hash of the response being rated
            metadata: Additional context

        Returns:
            True if feedback was recorded successfully
        """
        if not (self._voice_learning and VOICE_LEARNING_AVAILABLE):
            return False

        try:
            await self._voice_learning.record_feedback(
                user_id=context.user_id,
                response_hash=response_hash,
                rating=rating,
                feedback_type=feedback_type,
                metadata={
                    "session_id": context.session_id,
                    "phase": context.phase.value,
                    "emotional_state": context.emotional_state.value,
                    "message_count": context.message_count,
                    **(metadata or {})
                }
            )

            # Also learn from feedback for voice preferences
            if self._voice_personalization and feedback_type == "rating" and rating:
                if rating >= 4:
                    # Positive feedback - reinforce current settings
                    pass  # Settings are already working well
                elif rating <= 2:
                    # Negative feedback - adjust
                    self._voice_personalization.learn_from_feedback(
                        context.user_id,
                        "needs_adjustment",
                        {"rating": rating}
                    )

            logger.info(f"Recorded {feedback_type} feedback for session {context.session_id}")
            return True

        except Exception as e:
            logger.warning(f"Failed to record feedback: {e}")
            return False

    async def score_response_quality(
        self,
        context: ConversationContext,
        user_input: str,
        kiaan_response: str
    ) -> Dict[str, Any]:
        """
        Score the quality of a KIAAN response for continuous improvement.

        Args:
            context: Conversation context
            user_input: User's input message
            kiaan_response: KIAAN's response

        Returns:
            Quality scoring results with improvement suggestions
        """
        if not (self._quality_scoring and VOICE_LEARNING_AVAILABLE):
            return {"quality_scoring_available": False}

        try:
            quality = await self._quality_scoring.score_conversation_turn(
                conversation_id=context.session_id,
                turn_id=f"turn_{context.message_count}",
                user_input=user_input,
                kiaan_response=kiaan_response,
                user_emotion=context.emotional_state.value
            )

            # Update context with quality metrics
            context.average_quality_score = (
                (context.average_quality_score * (context.message_count - 1) + quality.overall_score) /
                context.message_count
            )
            context.improvement_suggestions = quality.improvement_suggestions[:3]

            return {
                "overall_score": quality.overall_score,
                "confidence": quality.overall_confidence,
                "response_type": quality.response_type.value,
                "dimension_scores": {
                    d.value: s.score for d, s in quality.dimension_scores.items()
                },
                "improvement_suggestions": quality.improvement_suggestions,
                "quality_scoring_available": True,
            }

        except Exception as e:
            logger.warning(f"Quality scoring failed: {e}")
            return {"quality_scoring_available": False, "error": str(e)}

    async def recommend_verse_for_context(
        self,
        context: ConversationContext
    ) -> Optional[Dict[str, Any]]:
        """
        Get a personalized verse recommendation based on user's spiritual journey.

        Uses spiritual memory to find verses that:
        - Address current emotional state
        - Build on previously resonant verses
        - Support active struggles

        Args:
            context: Conversation context

        Returns:
            Verse recommendation with reasoning, or None
        """
        if not (self._spiritual_memory and VOICE_LEARNING_AVAILABLE):
            return None

        try:
            # Map emotional state to struggle category
            emotion_to_struggle = {
                EmotionalState.ANXIOUS: "anxiety",
                EmotionalState.SAD: "grief",
                EmotionalState.ANGRY: "anger",
                EmotionalState.CONFUSED: "confusion",
                EmotionalState.FEARFUL: "fear",
            }

            struggle = emotion_to_struggle.get(context.emotional_state)

            if struggle:
                recommendation = self._spiritual_memory.recommend_verse_for_struggle(
                    context.user_id,
                    struggle
                )
                if recommendation:
                    return recommendation

            # Fallback to most resonant verses
            resonant = self._spiritual_memory.get_most_resonant_verses(
                context.user_id,
                limit=1,
                emotional_context=context.emotional_state.value
            )
            if resonant:
                return {
                    "verse_id": resonant[0].verse_id,
                    "reason": "previously_resonant",
                    "resonance_score": resonant[0].resonance_score,
                    "translation": resonant[0].translation
                }

            return None

        except Exception as e:
            logger.warning(f"Verse recommendation failed: {e}")
            return None

    async def record_verse_resonance(
        self,
        context: ConversationContext,
        verse_id: str,
        chapter: int,
        verse_number: int,
        translation: str,
        resonance_score: float,
        user_reflection: Optional[str] = None
    ) -> bool:
        """
        Record that a verse resonated with the user.

        Args:
            context: Conversation context
            verse_id: Verse identifier
            chapter: Chapter number
            verse_number: Verse number
            translation: Verse translation
            resonance_score: How much it resonated (0-1)
            user_reflection: User's reflection on the verse

        Returns:
            True if recorded successfully
        """
        if not (self._spiritual_memory and VOICE_LEARNING_AVAILABLE):
            return False

        try:
            self._spiritual_memory.record_verse_resonance(
                user_id=context.user_id,
                verse_id=verse_id,
                chapter=chapter,
                verse_number=verse_number,
                translation=translation,
                resonance_score=resonance_score,
                context=f"Phase: {context.phase.value}, Emotion: {context.emotional_state.value}",
                user_reflection=user_reflection,
                emotional_context=context.emotional_state.value
            )

            # Update context
            if verse_id not in context.resonant_verses:
                context.resonant_verses.append(verse_id)

            return True

        except Exception as e:
            logger.warning(f"Failed to record verse resonance: {e}")
            return False

    async def end_conversation(
        self,
        context: ConversationContext
    ) -> Dict[str, Any]:
        """
        Properly end a divine conversation with voice learning session cleanup.

        Args:
            context: Conversation context

        Returns:
            Session summary including voice learning insights
        """
        summary = {
            "session_id": context.session_id,
            "user_id": context.user_id,
            "message_count": context.message_count,
            "duration_seconds": (datetime.now() - context.started_at).total_seconds(),
            "final_phase": context.phase.value,
            "final_emotional_state": context.emotional_state.value,
            "average_quality_score": context.average_quality_score,
        }

        # End voice learning session
        if context.voice_learning_active and self._voice_learning:
            try:
                session_summary = await self._voice_learning.end_session(context.session_id)
                summary["voice_learning_summary"] = session_summary
            except Exception as e:
                logger.warning(f"Failed to end voice learning session: {e}")

        # Get quality trends if available
        if self._quality_scoring and VOICE_LEARNING_AVAILABLE:
            try:
                quality_summary = self._quality_scoring.get_conversation_quality_summary(
                    context.session_id
                )
                summary["quality_summary"] = quality_summary
            except Exception as e:
                logger.warning(f"Failed to get quality summary: {e}")

        # Update spiritual memory with session data
        if self._spiritual_memory and VOICE_LEARNING_AVAILABLE:
            try:
                # Update last active
                self._spiritual_memory.update_last_active(context.user_id)

                # If there were meaningful interactions, consider recording breakthrough
                if context.message_count >= 5 and context.average_quality_score >= 0.7:
                    # Record potential breakthrough
                    if context.emotional_state in [EmotionalState.PEACEFUL, EmotionalState.GRATEFUL]:
                        self._spiritual_memory.record_breakthrough(
                            context.user_id,
                            description=f"Found peace in conversation about {', '.join(context.topics_discussed[:3])}",
                            growth_dimensions=[GrowthDimension.EQUANIMITY],
                            user_words=None
                        )
            except Exception as e:
                logger.warning(f"Failed to update spiritual memory: {e}")

        # Remove from active conversations
        if context.session_id in self._conversations:
            del self._conversations[context.session_id]

        logger.info(f"Divine conversation ended: {context.session_id}")
        return summary

    def get_divine_system_prompt_enhanced(self, context: ConversationContext) -> str:
        """
        Generate an enhanced system prompt with spiritual memory context.

        Includes:
        - Basic voice delivery requirements
        - Emotional state context
        - User's spiritual journey context
        - Previously resonant verses
        - Active struggles to address

        Args:
            context: Conversation context

        Returns:
            Complete system prompt for KIAAN
        """
        base_prompt = self.get_divine_system_prompt(context)

        # Add spiritual journey context if available
        spiritual_context = ""
        if context.voice_learning_active and self._spiritual_memory:
            try:
                # Add resonant verses context
                if context.resonant_verses:
                    verses_str = ", ".join(context.resonant_verses[:3])
                    spiritual_context += f"\n\nVERSES THAT RESONATE WITH THIS USER:\n{verses_str}\nConsider referencing these verses when appropriate.\n"

                # Add active struggles context
                if context.active_struggles:
                    struggles_str = ", ".join(str(s) for s in context.active_struggles[:2])
                    spiritual_context += f"\nUSER IS WORKING THROUGH:\n{struggles_str}\nBe mindful of these in your responses.\n"

                # Add growth context
                if context.spiritual_growth_score > 0.5:
                    spiritual_context += f"\nThis user has shown significant spiritual growth (score: {context.spiritual_growth_score:.2f}). You can offer deeper teachings.\n"

                # Add stress/energy context
                if context.stress_level > 0.7:
                    spiritual_context += "\nUser appears highly stressed. Prioritize calming, grounding guidance.\n"
                elif context.energy_level < 0.3:
                    spiritual_context += "\nUser's energy is low. Be gentle, supportive, not demanding.\n"

            except Exception as e:
                logger.warning(f"Failed to add spiritual context: {e}")

        return base_prompt + spiritual_context


    # =========================================================================
    # WORLD-CLASS SPEECH SYNTHESIS METHODS
    # =========================================================================

    async def _ensure_speech_initialized(self) -> bool:
        """Ensure world-class speech modules are initialized."""
        if self._speech_initialized:
            return self._divine_speech is not None

        if self._divine_speech and WORLD_CLASS_SPEECH_AVAILABLE:
            try:
                await self._divine_speech.initialize()
                self._speech_initialized = True
                logger.info("World-class speech modules fully initialized")
                return True
            except Exception as e:
                logger.warning(f"Failed to initialize world-class speech: {e}")
                return False

        return False

    async def synthesize_divine_audio(
        self,
        text: str,
        context: ConversationContext,
        include_breathing: bool = True
    ) -> Optional[bytes]:
        """
        Synthesize speech using world-class open source providers.

        Uses intelligent provider selection from:
        - Coqui XTTS (Germany) - Neural TTS with voice cloning
        - Silero (Russia) - Fast, efficient synthesis
        - StyleTTS2 (Korea) - Expressive emotional synthesis
        - Piper (France) - Low-latency local TTS
        - Bark (USA) - Generative audio
        - Plus fallbacks to Bhashini AI and ElevenLabs

        Args:
            text: Text to synthesize
            context: Conversation context for emotion and phase
            include_breathing: Include breathing pauses

        Returns:
            Audio bytes (MP3/WAV) or None if synthesis fails
        """
        if not await self._ensure_speech_initialized():
            logger.warning("World-class speech not available, falling back to basic TTS")
            return None

        try:
            # Map conversation phase to divine voice mode
            phase_to_mode = {
                ConversationPhase.GREETING: DivineVoiceMode.CONVERSATION,
                ConversationPhase.LISTENING: DivineVoiceMode.COMPASSIONATE,
                ConversationPhase.ACKNOWLEDGING: DivineVoiceMode.COMPASSIONATE,
                ConversationPhase.OFFERING_WISDOM: DivineVoiceMode.WISE,
                ConversationPhase.PRACTICING: DivineVoiceMode.MEDITATION,
                ConversationPhase.BLESSING: DivineVoiceMode.SERENE,
            }
            mode = phase_to_mode.get(context.phase, DivineVoiceMode.CONVERSATION)

            # Map emotional state to synthesis emotion
            emotion_map = {
                EmotionalState.ANXIOUS: "compassion",
                EmotionalState.SAD: "compassion",
                EmotionalState.ANGRY: "peace",
                EmotionalState.CONFUSED: "wisdom",
                EmotionalState.HOPEFUL: "encouragement",
                EmotionalState.PEACEFUL: "peace",
                EmotionalState.SEEKING: "wisdom",
                EmotionalState.GRATEFUL: "joy",
                EmotionalState.NEUTRAL: "peace",
                EmotionalState.FEARFUL: "compassion",
                EmotionalState.LONELY: "compassion",
            }
            emotion = emotion_map.get(context.emotional_state, "peace")

            # Create synthesis config
            config = DivineSynthesisConfig(
                mode=mode,
                emotion=emotion,
                intensity=context.emotional_intensity,
                language=context.learned_preferences.get("language", "en"),
                quality_tier=VoiceQuality.DIVINE,
                use_neural_voices=True,
                include_breathing=include_breathing,
                include_pauses=True,
                spiritual_emphasis=True,
                user_id=context.user_id,
                session_id=context.session_id,
            )

            # Synthesize with world-class providers
            result = await self._divine_speech.synthesize_divine(text, config)

            if result.success and result.audio_data:
                logger.info(
                    f"Divine audio synthesized: {len(result.audio_data)} bytes, "
                    f"provider={result.provider_used}, quality={result.quality_score:.2f}"
                )
                return result.audio_data
            else:
                logger.warning(f"Divine synthesis failed: {result.error_message}")
                return None

        except Exception as e:
            logger.error(f"Divine audio synthesis error: {e}")
            return None

    async def synthesize_with_response(
        self,
        response_data: Dict[str, Any],
        context: ConversationContext
    ) -> Dict[str, Any]:
        """
        Synthesize audio for a complete divine response.

        Takes the output from generate_divine_response and adds audio.

        Args:
            response_data: Response dict from generate_divine_response
            context: Conversation context

        Returns:
            Response data with audio_data and audio_metadata added
        """
        result = response_data.copy()

        # Synthesize audio
        audio_data = await self.synthesize_divine_audio(
            response_data["response_text"],
            context,
            include_breathing=response_data.get("phase") in ["practicing", "acknowledging"]
        )

        if audio_data:
            result["audio_data"] = audio_data
            result["audio_available"] = True
            result["audio_metadata"] = {
                "provider": "world_class_divine",
                "format": "mp3",
                "quality": "divine",
            }
        else:
            result["audio_available"] = False
            result["audio_metadata"] = {"error": "Synthesis unavailable"}

        return result

    async def recognize_user_speech(
        self,
        audio_data: bytes,
        context: ConversationContext,
        language: str = "en"
    ) -> Optional[str]:
        """
        Recognize user speech using world-class STT providers.

        Uses Whisper, Vosk, and other state-of-the-art recognizers.

        Args:
            audio_data: Raw audio bytes from user
            context: Conversation context
            language: Expected language code

        Returns:
            Transcribed text or None if recognition fails
        """
        if not await self._ensure_speech_initialized():
            return None

        try:
            result = await self._divine_speech.recognize_speech(
                audio_data=audio_data,
                language=language,
                user_id=context.user_id
            )

            if result.success:
                logger.info(f"Speech recognized: {result.transcript[:50]}... (confidence: {result.confidence:.2f})")
                return result.transcript
            else:
                logger.warning(f"Speech recognition failed: {result.error_message}")
                return None

        except Exception as e:
            logger.error(f"Speech recognition error: {e}")
            return None

    async def get_voice_conversation_response(
        self,
        user_audio: Optional[bytes],
        user_text: Optional[str],
        context: ConversationContext,
        kiaan_wisdom: str,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Complete voice conversation turn with STT and TTS.

        Handles:
        1. Speech recognition (if audio provided)
        2. Emotional analysis
        3. Response generation
        4. Speech synthesis

        Args:
            user_audio: Optional user audio input
            user_text: Optional user text input (fallback)
            context: Conversation context
            kiaan_wisdom: KIAAN's wisdom response
            language: Language code

        Returns:
            Complete response with transcription, text response, and audio
        """
        # Step 1: Transcribe user audio if provided
        transcribed_text = user_text
        if user_audio:
            transcribed = await self.recognize_user_speech(user_audio, context, language)
            if transcribed:
                transcribed_text = transcribed

        if not transcribed_text:
            return {
                "success": False,
                "error": "No user input received",
            }

        # Step 2: Generate divine response
        response = await self.generate_divine_response(
            user_message=transcribed_text,
            context=context,
            kiaan_wisdom=kiaan_wisdom,
            include_breathing=True,
            include_practice=context.emotional_intensity > 0.7
        )

        # Step 3: Synthesize audio for response
        response_with_audio = await self.synthesize_with_response(response, context)

        # Add transcription info
        if user_audio:
            response_with_audio["user_transcription"] = transcribed_text
            response_with_audio["transcription_used"] = True

        return response_with_audio

    def get_world_class_speech_status(self) -> Dict[str, Any]:
        """
        Get status of world-class speech modules.

        Returns information about available providers and capabilities.
        """
        status = {
            "world_class_available": WORLD_CLASS_SPEECH_AVAILABLE,
            "initialized": self._speech_initialized,
        }

        if self._divine_speech:
            status["quality_metrics"] = self._divine_speech.get_quality_metrics()
            status["available_modes"] = self._divine_speech.get_available_modes()
            status["supported_languages"] = self._divine_speech.get_supported_languages()

        return status

    # =========================================================================
    # PERFECT PRONUNCIATION & MULTI-LANGUAGE METHODS
    # =========================================================================

    def format_sanskrit_shloka(
        self,
        shloka_key: str,
        include_meaning: bool = True,
        voice_gender: str = "male",
        chanting_style: str = "traditional"
    ) -> str:
        """
        Format a Sanskrit shloka with perfect pronunciation for TTS.

        Uses IPA phoneme mapping and Vedic accent markers for authentic
        recitation that honors the sacred texts.

        Args:
            shloka_key: Key for pre-defined shlokas (e.g., "karmanye_vadhikaraste")
            include_meaning: Whether to include English meaning after shloka
            voice_gender: "male" or "female" voice
            chanting_style: "traditional", "meditative", or "devotional"

        Returns:
            SSML-formatted text with perfect Sanskrit pronunciation

        Example:
            >>> ssml = divine_voice.format_sanskrit_shloka(
            ...     "karmanye_vadhikaraste",
            ...     include_meaning=True,
            ...     voice_gender="male",
            ...     chanting_style="meditative"
            ... )
        """
        if not PRONUNCIATION_LANGUAGES_AVAILABLE:
            logger.warning("Pronunciation module not available, returning basic format")
            return f"<speak>{shloka_key}</speak>"

        shloka = SACRED_SHLOKAS.get(shloka_key)
        if not shloka:
            logger.warning(f"Shloka '{shloka_key}' not found in database")
            return f"<speak>{shloka_key}</speak>"

        ssml_content = generate_shloka_ssml(
            shloka=shloka,
            include_meaning=include_meaning,
            voice_gender=voice_gender,
            chanting_style=chanting_style
        )
        return f"<speak>{ssml_content}</speak>"

    def format_with_perfect_pronunciation(
        self,
        text: str,
        phase: ConversationPhase,
        emotional_state: EmotionalState,
        language: Optional[str] = None,
        accent: Optional[str] = None,
        is_shloka: bool = False,
        voice_gender: str = "female",
        personality: str = "wise_sage"
    ) -> str:
        """
        Format text with perfect pronunciation, language, and accent support.

        This enhanced method combines:
        - Sanskrit pronunciation with IPA phonemes
        - Multi-language support (Hindi, Tamil, Telugu, etc.)
        - Regional Indian accent variations
        - Emotional contagion and personality expression
        - Natural voice features

        Args:
            text: Text to format
            phase: Current conversation phase
            emotional_state: User's emotional state
            language: Optional language code (e.g., "hi" for Hindi)
            accent: Optional regional accent (e.g., "tamil_english")
            is_shloka: Whether text contains Sanskrit shlokas
            voice_gender: "male" or "female"
            personality: Personality profile ("wise_sage", "nurturing_mother", etc.)

        Returns:
            SSML-formatted text with all pronunciation enhancements
        """
        if not PRONUNCIATION_LANGUAGES_AVAILABLE:
            # Fall back to standard format
            return self.format_for_divine_voice(
                text, phase, emotional_state,
                include_breathing=True, gender=voice_gender
            )

        # Map string to enum if needed
        lang_enum = None
        accent_enum = None

        if language:
            try:
                lang_enum = IndianLanguage(language)
            except ValueError:
                logger.warning(f"Unknown language code: {language}")

        if accent:
            try:
                accent_enum = RegionalAccent(accent)
            except ValueError:
                logger.warning(f"Unknown accent: {accent}")

        # Determine chandas if it's a shloka
        chandas = None
        if is_shloka:
            # Default to Anushtup (most common meter)
            chandas = Chandas.ANUSHTUP

        # Get emotion as string
        emotion_str = emotional_state.value

        # Use the integrated pronunciation function
        enhanced_ssml = create_perfect_pronunciation_ssml(
            text=text,
            language=lang_enum,
            accent=accent_enum,
            is_shloka=is_shloka,
            chandas=chandas,
            voice_gender=voice_gender,
            personality=personality,
            emotion=emotion_str,
            emotion_intensity=0.5
        )

        # Wrap in speak tags
        return f"<speak>{enhanced_ssml}</speak>"

    def generate_vedic_chant(
        self,
        chant_key: str,
        repetitions: int = 1,
        include_meaning: bool = True,
        voice_gender: str = "male"
    ) -> str:
        """
        Generate SSML for a Vedic peace chant (shanti mantra).

        Perfect for opening/closing meditation sessions or providing
        sacred comfort during difficult moments.

        Args:
            chant_key: Key for pre-defined chants
                       ("shanti_mantra_1", "shanti_mantra_2", "gayatri", "mahamrityunjaya")
            repetitions: Number of times to repeat the chant
            include_meaning: Include English meaning
            voice_gender: "male" or "female"

        Returns:
            SSML-formatted text for sacred chanting
        """
        if not PRONUNCIATION_LANGUAGES_AVAILABLE:
            return "<speak>Om Shanti Shanti Shanti</speak>"

        chant = VEDIC_PEACE_CHANTS.get(chant_key)
        if not chant:
            logger.warning(f"Vedic chant '{chant_key}' not found")
            return "<speak>Om Shanti Shanti Shanti</speak>"

        ssml = generate_vedic_chant_ssml(
            chant=chant,
            repetitions=repetitions,
            include_meaning=include_meaning,
            voice_gender=voice_gender
        )

        return f"<speak>{ssml}</speak>"

    def get_language_greeting(self, language: str) -> str:
        """
        Get a native language greeting for KIAAN.

        Args:
            language: Language code (e.g., "hi", "ta", "te", "bn")

        Returns:
            Native greeting in the specified language
        """
        if not PRONUNCIATION_LANGUAGES_AVAILABLE:
            return "Namaste, I am KIAAN"

        try:
            lang_enum = IndianLanguage(language)
            return get_language_greeting(lang_enum)
        except ValueError:
            return "Namaste, I am KIAAN"

    def get_supported_languages(self) -> List[Dict[str, str]]:
        """
        Get list of supported languages for multi-language voice.

        Returns:
            List of dictionaries with language code, name, and native name
        """
        if not PRONUNCIATION_LANGUAGES_AVAILABLE:
            return [{"code": "en", "name": "English", "native_name": "English"}]

        languages = []
        for lang in IndianLanguage:
            config = LANGUAGE_CONFIGS.get(lang)
            if config:
                languages.append({
                    "code": config.code,
                    "name": config.name,
                    "native_name": config.native_name,
                    "script": config.script,
                })

        return languages

    def get_supported_accents(self) -> List[Dict[str, str]]:
        """
        Get list of supported regional Indian accents.

        Returns:
            List of dictionaries with accent code, name, and region
        """
        if not PRONUNCIATION_LANGUAGES_AVAILABLE:
            return []

        accents = []
        for accent in RegionalAccent:
            profile = ACCENT_PROFILES.get(accent)
            if profile:
                accents.append({
                    "code": accent.value,
                    "name": profile.name,
                    "region": profile.region,
                })

        return accents

    def get_available_shlokas(self) -> List[Dict[str, str]]:
        """
        Get list of available pre-defined Sanskrit shlokas.

        Returns:
            List with shloka key, source, and meaning preview
        """
        if not PRONUNCIATION_LANGUAGES_AVAILABLE:
            return []

        shlokas = []
        for key, shloka in SACRED_SHLOKAS.items():
            shlokas.append({
                "key": key,
                "source": shloka.source,
                "reference": shloka.chapter_verse,
                "meaning_preview": shloka.meaning[:100] + "..." if len(shloka.meaning) > 100 else shloka.meaning,
            })

        return shlokas

    def get_available_vedic_chants(self) -> List[Dict[str, str]]:
        """
        Get list of available Vedic peace chants.

        Returns:
            List with chant key, name, source, and purpose
        """
        if not PRONUNCIATION_LANGUAGES_AVAILABLE:
            return []

        chants = []
        for key, chant in VEDIC_PEACE_CHANTS.items():
            chants.append({
                "key": key,
                "name": chant.name,
                "source": chant.source,
                "recitation_notes": chant.recitation_notes or "Sacred peace chant",
            })

        return chants

    def get_pronunciation_status(self) -> Dict[str, Any]:
        """
        Get status of pronunciation and language features.

        Returns comprehensive information about available capabilities.
        """
        return {
            "pronunciation_available": PRONUNCIATION_LANGUAGES_AVAILABLE,
            "features": {
                "sanskrit_ipa": PRONUNCIATION_LANGUAGES_AVAILABLE,
                "vedic_accents": PRONUNCIATION_LANGUAGES_AVAILABLE,
                "multi_language": PRONUNCIATION_LANGUAGES_AVAILABLE,
                "regional_accents": PRONUNCIATION_LANGUAGES_AVAILABLE,
                "vedic_chanting": PRONUNCIATION_LANGUAGES_AVAILABLE,
                "natural_voice": PRONUNCIATION_LANGUAGES_AVAILABLE,
                "emotional_contagion": PRONUNCIATION_LANGUAGES_AVAILABLE,
                "personality_expression": PRONUNCIATION_LANGUAGES_AVAILABLE,
            },
            "supported_languages": self.get_supported_languages(),
            "supported_accents": self.get_supported_accents(),
            "available_shlokas": len(SACRED_SHLOKAS) if PRONUNCIATION_LANGUAGES_AVAILABLE else 0,
            "available_chants": len(VEDIC_PEACE_CHANTS) if PRONUNCIATION_LANGUAGES_AVAILABLE else 0,
        }


# Singleton instance
kiaan_divine_voice = KIAANDivineVoice()


def get_divine_voice_service() -> KIAANDivineVoice:
    """Get the divine voice service instance."""
    return kiaan_divine_voice
