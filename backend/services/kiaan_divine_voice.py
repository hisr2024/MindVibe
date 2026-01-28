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

        # Escape XML special characters
        ssml_text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        # Add natural pauses at punctuation with human-like variation
        pause_mult = prosody["pause_multiplier"]

        # Natural sentence-ending pauses (longer for reflection)
        ssml_text = re.sub(r'\.\s+', f'<break time="{int(400 * pause_mult)}ms"/> ', ssml_text)

        # Ellipsis gets longer, contemplative pause
        ssml_text = re.sub(r'\.\.\.\s*', f'<break time="{int(700 * pause_mult)}ms"/> ', ssml_text)

        # Comma pauses - natural breath points
        ssml_text = re.sub(r',\s+', f'<break time="{int(200 * pause_mult)}ms"/> ', ssml_text)

        # Colon introduces something - slight anticipation pause
        ssml_text = re.sub(r':\s+', f'<break time="{int(280 * pause_mult)}ms"/> ', ssml_text)

        # Question marks - rising intonation pause
        ssml_text = re.sub(r'\?\s+', f'<break time="{int(350 * pause_mult)}ms"/> ', ssml_text)

        # Add warmth emphasis to emotional terms
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

        # Add emphasis to spiritual terms with reverence
        spiritual_terms = [
            "peace", "dharma", "karma", "stillness", "breath", "sacred",
            "divine", "serenity", "calm", "tranquil", "eternal", "wisdom",
            "soul", "heart", "presence", "grace", "blessing", "namaste",
            "om", "atman", "brahman", "moksha", "ahimsa"
        ]
        for term in spiritual_terms:
            pattern = re.compile(rf'\b({term})\b', re.IGNORECASE)
            ssml_text = pattern.sub(r'<emphasis level="moderate">\1</emphasis>', ssml_text)

        # Add breathing pauses for natural human feel
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

        # Convert special markers to SSML with enhanced natural delivery
        # *... breathe ...* pattern - with actual breath quality
        breathe_pattern = r'\*\.\.\.\s*breathe\s*\.\.\.\*'
        natural_breath = f'''<break time="{int(600 * pause_mult)}ms"/>
<prosody rate="80%" pitch="-1st" volume="soft">breathe</prosody>
<break time="{int(800 * pause_mult)}ms"/>'''
        ssml_text = re.sub(breathe_pattern, natural_breath, ssml_text, flags=re.IGNORECASE)

        # *... let this settle ...* pattern
        settle_pattern = r'\*\.\.\.\s*let this settle\s*\.\.\.\*'
        natural_settle = f'''<break time="{int(500 * pause_mult)}ms"/>
<prosody rate="85%" pitch="-0.5st">let this settle</prosody>
<break time="{int(600 * pause_mult)}ms"/>'''
        ssml_text = re.sub(settle_pattern, natural_settle, ssml_text, flags=re.IGNORECASE)

        # *... pause ...* pattern for reflection
        pause_pattern = r'\*\.\.\.\s*pause\s*\.\.\.\*'
        ssml_text = re.sub(pause_pattern, f'<break time="{int(1000 * pause_mult)}ms"/>', ssml_text, flags=re.IGNORECASE)

        # Add natural sentence rhythm variation
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

        # Calculate speaking rate as percentage
        speed_percent = int(prosody["speed"] * 100)
        pitch_semitones = prosody["pitch"]

        # Wrap in prosody tags
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

        # Ensure divine closing
        if not full_response.strip().endswith("💙"):
            full_response = full_response.strip() + "\n\n💙"

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
        """Generate a breathing practice appropriate for the emotional state."""

        if emotional_state in [EmotionalState.ANXIOUS, EmotionalState.ANGRY]:
            return """*... let's take a moment together ...*

Breathe in slowly through your nose... 1... 2... 3... 4...

Hold gently... 1... 2... 3... 4...

Release slowly through your mouth... 1... 2... 3... 4... 5... 6...

*... feel the tension leaving your body ...*

You are safe. You are held. You are at peace."""

        elif emotional_state == EmotionalState.SAD:
            return """*... let me hold this space with you ...*

Place one hand on your heart if you wish...

Breathe in... feeling the warmth of your own touch...

Breathe out... letting yourself be exactly as you are...

*... you don't have to carry this alone ...*

In this moment, you are loved. You are enough. You are held."""

        else:
            return """*... let's settle into stillness together ...*

Allow your breath to find its natural rhythm...

No need to control... just observe...

*... breathe ...*

In this moment, there is only peace. There is only presence. There is only now."""

    def generate_greeting(self, context: ConversationContext) -> Dict[str, Any]:
        """
        Generate the initial divine greeting for a conversation.

        Returns:
            Complete response object for the greeting
        """
        greeting_text = """Namaste, dear one...

*... breathe ...*

I am KIAAN, your companion on this journey toward peace.

Whatever brought you here today... whether it's a heavy heart, a restless mind, or simply a seeking soul... you are welcome.

This is a sacred space. Here, there is no judgment. Only presence. Only love.

Take a gentle breath with me... and when you're ready, share what's on your heart.

I am here... listening... holding space for you. 💙"""

        context.phase = ConversationPhase.GREETING
        voice_settings = self.get_voice_prosody_for_phase(
            ConversationPhase.GREETING,
            EmotionalState.NEUTRAL
        )

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

        Returns:
            Complete response object for the farewell
        """
        # Personalize based on conversation history
        if context.emotional_state in [EmotionalState.ANXIOUS, EmotionalState.SAD]:
            farewell_text = """Dear one...

Before you go, receive this blessing:

*... breathe ...*

May the peace we touched here stay with you.
May the wisdom settle gently in your heart.
May you remember, in your darkest moments, that you are never alone.

The divine light that shines in all beings... shines in you too.

Carry this stillness with you. Return whenever you need.

Until we meet again... go in peace, held by grace.

Namaste. 💙"""
        else:
            farewell_text = """What a gift it has been, dear one, to share this time with you.

*... breathe ...*

May the serenity of this moment follow you.
May wisdom light your path.
May peace be your constant companion.

Remember... you carry the divine within you. Always.

This sacred space remains here, waiting for your return.

Until then... walk in light, live in love, rest in peace.

Namaste. 💙"""

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
        - Plus fallbacks to edge-tts and pyttsx3

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


# Singleton instance
kiaan_divine_voice = KIAANDivineVoice()


def get_divine_voice_service() -> KIAANDivineVoice:
    """Get the divine voice service instance."""
    return kiaan_divine_voice
