"""
Speech Module Data Models

Standardized data structures for cross-provider speech processing,
enabling seamless integration of diverse speech technologies.

"Unity in diversity - all voices speak the same language of the heart."
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any, Literal, TYPE_CHECKING
from enum import Enum

# Optional numpy import for voice embeddings
try:
    import numpy as np
    NumpyArray = np.ndarray
except ImportError:
    # Fallback when numpy is not installed
    NumpyArray = Any  # type: ignore


class SpeechProvider(Enum):
    """Available speech synthesis providers."""
    # Neural TTS Providers
    COQUI_XTTS = "coqui_xtts"          # Multi-lingual, voice cloning
    COQUI_TTS = "coqui_tts"            # High-quality neural TTS
    SILERO = "silero"                   # Fast Russian-origin TTS
    BARK = "bark"                       # Suno's generative audio
    PIPER = "piper"                     # Fast local neural TTS
    STYLE_TTS2 = "style_tts2"          # Expressive style-based TTS
    VITS = "vits"                       # Variational inference TTS

    # Cloud/API Providers
    GOOGLE_CLOUD = "google_cloud"       # Google Cloud TTS
    EDGE_TTS = "edge_tts"              # Microsoft Edge TTS
    AMAZON_POLLY = "amazon_polly"       # AWS Polly

    # Classic Open Source
    ESPEAK = "espeak"                   # eSpeak NG
    FESTIVAL = "festival"               # Festival TTS
    MARY_TTS = "mary_tts"              # MaryTTS
    PYTTSX3 = "pyttsx3"                # Local system TTS

    # Indian Language Specialists
    VAKYANSH = "vakyansh"              # Indian TTS
    AI4BHARAT = "ai4bharat"            # Indic language models
    SARVAM = "sarvam"                  # Sarvam AI

    # Asian Language Specialists
    PADDLE_SPEECH = "paddle_speech"    # Baidu PaddleSpeech
    ESPNET = "espnet"                  # ESPnet toolkit


class SpeechRecognizer(Enum):
    """Available speech recognition providers."""
    WHISPER = "whisper"                # OpenAI Whisper
    WHISPER_CPP = "whisper_cpp"        # C++ optimized Whisper
    VOSK = "vosk"                      # Offline recognition
    DEEP_SPEECH = "deep_speech"        # Mozilla DeepSpeech
    WAV2VEC = "wav2vec"                # Facebook wav2vec 2.0
    WENET = "wenet"                    # WeNet production STT
    GOOGLE_STT = "google_stt"          # Google Cloud STT


class VoiceQuality(Enum):
    """Voice quality tiers."""
    DIVINE = "divine"          # Highest quality, slowest
    PREMIUM = "premium"        # High quality, moderate speed
    STANDARD = "standard"      # Good quality, fast
    FAST = "fast"             # Lower quality, very fast
    OFFLINE = "offline"        # Offline-only, variable quality


class EmotionCategory(Enum):
    """Emotional categories for prosody adaptation."""
    SERENE = "serene"          # Deep peace, meditation
    COMPASSIONATE = "compassionate"  # Warm, caring
    WISE = "wise"              # Thoughtful, measured
    JOYFUL = "joyful"          # Uplifting, bright
    SOLEMN = "solemn"          # Reverent, serious
    GENTLE = "gentle"          # Soft, tender
    ENCOURAGING = "encouraging"  # Supportive, hopeful
    NEUTRAL = "neutral"        # Balanced, clear


@dataclass
class EmotionalProsody:
    """Prosody settings for emotional expression."""
    emotion: EmotionCategory = EmotionCategory.NEUTRAL
    intensity: float = 0.5  # 0.0 to 1.0

    # Core prosody parameters
    speaking_rate: float = 1.0    # 0.5 to 2.0
    pitch: float = 0.0            # -20 to +20 semitones
    pitch_range: float = 1.0      # Pitch variation
    volume: float = 1.0           # 0.0 to 1.0

    # Advanced prosody
    breathiness: float = 0.0      # 0.0 to 1.0
    warmth: float = 0.5           # Voice warmth
    clarity: float = 0.8          # Articulation clarity
    resonance: float = 0.5        # Chest vs head voice

    # Pause and rhythm
    pause_frequency: float = 1.0  # How often to pause
    pause_duration: float = 1.0   # How long pauses are
    rhythm_regularity: float = 0.7  # Regular vs varied rhythm

    # Emotional markers
    smile: bool = False           # Smile in voice
    whisper: bool = False         # Whisper mode
    emphasis_strength: float = 1.0  # Word emphasis strength


@dataclass
class VoiceProfile:
    """Profile for a specific voice persona."""
    id: str
    name: str
    description: str

    # Voice characteristics
    gender: Literal["male", "female", "neutral"] = "female"
    age: Literal["child", "young", "adult", "elderly"] = "adult"
    accent: str = "neutral"
    language: str = "en"

    # Provider preferences
    preferred_providers: List[SpeechProvider] = field(default_factory=list)
    provider_voice_ids: Dict[str, str] = field(default_factory=dict)

    # Voice cloning data
    reference_audio_path: Optional[str] = None
    voice_embedding: Optional[NumpyArray] = None
    cloning_quality: float = 0.0

    # Prosody defaults
    default_prosody: EmotionalProsody = field(default_factory=EmotionalProsody)

    # Usage statistics
    times_used: int = 0
    average_rating: float = 0.0
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class SpeechSynthesisRequest:
    """Request for speech synthesis."""
    text: str
    language: str = "en"
    voice_profile: Optional[VoiceProfile] = None

    # Provider preferences
    preferred_provider: Optional[SpeechProvider] = None
    fallback_providers: List[SpeechProvider] = field(default_factory=list)
    quality_tier: VoiceQuality = VoiceQuality.PREMIUM

    # Prosody
    prosody: EmotionalProsody = field(default_factory=EmotionalProsody)
    emotion: Optional[str] = None
    emotion_intensity: float = 0.5

    # Output format
    output_format: str = "mp3"
    sample_rate: int = 22050
    channels: int = 1

    # Advanced options
    use_ssml: bool = True
    normalize_audio: bool = True
    add_silence_padding: bool = True
    silence_padding_ms: int = 200

    # Caching
    use_cache: bool = True
    cache_key: Optional[str] = None

    # Voice cloning
    clone_voice: bool = False
    reference_audio: Optional[bytes] = None

    # Context
    content_type: str = "conversation"  # verse, meditation, conversation, affirmation
    user_id: Optional[str] = None
    session_id: Optional[str] = None


@dataclass
class SpeechSynthesisResult:
    """Result from speech synthesis."""
    success: bool
    audio_data: Optional[bytes] = None

    # Provider info
    provider_used: Optional[SpeechProvider] = None
    fallback_used: bool = False
    providers_tried: List[SpeechProvider] = field(default_factory=list)

    # Quality metrics
    quality_score: float = 0.0
    naturalness_score: float = 0.0
    clarity_score: float = 0.0

    # Timing
    synthesis_time_ms: int = 0
    audio_duration_ms: int = 0

    # Audio properties
    sample_rate: int = 22050
    format: str = "mp3"
    file_size_bytes: int = 0

    # Error handling
    error_message: Optional[str] = None
    error_code: Optional[str] = None

    # Cache info
    from_cache: bool = False
    cache_key: Optional[str] = None

    # Metadata
    ssml_used: Optional[str] = None
    voice_id_used: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class SpeechRecognitionRequest:
    """Request for speech recognition."""
    audio_data: bytes
    language: str = "en"

    # Provider preferences
    preferred_provider: Optional[SpeechRecognizer] = None
    fallback_providers: List[SpeechRecognizer] = field(default_factory=list)

    # Recognition options
    enable_punctuation: bool = True
    enable_word_timestamps: bool = False
    enable_speaker_diarization: bool = False
    num_speakers: Optional[int] = None

    # Audio format
    sample_rate: int = 16000
    channels: int = 1
    audio_format: str = "wav"

    # Advanced
    vocabulary_boost: List[str] = field(default_factory=list)  # Spiritual terms
    profanity_filter: bool = False

    # Context
    user_id: Optional[str] = None
    session_id: Optional[str] = None


@dataclass
class WordTimestamp:
    """Timestamp for a recognized word."""
    word: str
    start_time_ms: int
    end_time_ms: int
    confidence: float = 1.0


@dataclass
class SpeechRecognitionResult:
    """Result from speech recognition."""
    success: bool
    transcript: str = ""
    confidence: float = 0.0

    # Provider info
    provider_used: Optional[SpeechRecognizer] = None
    fallback_used: bool = False

    # Detailed results
    word_timestamps: List[WordTimestamp] = field(default_factory=list)
    alternative_transcripts: List[str] = field(default_factory=list)

    # Timing
    recognition_time_ms: int = 0
    audio_duration_ms: int = 0

    # Error handling
    error_message: Optional[str] = None
    error_code: Optional[str] = None

    # Metadata
    language_detected: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class VoiceCloneRequest:
    """Request to create a voice clone."""
    reference_audio: bytes
    voice_name: str
    description: str = ""

    # Cloning options
    provider: SpeechProvider = SpeechProvider.COQUI_XTTS
    quality: VoiceQuality = VoiceQuality.PREMIUM

    # Audio requirements
    min_audio_duration_seconds: float = 3.0
    max_audio_duration_seconds: float = 30.0

    # User info
    user_id: Optional[str] = None


@dataclass
class SpeechQualityMetrics:
    """Quality metrics for speech output."""
    # Overall scores (0-100)
    overall_score: float = 0.0
    naturalness: float = 0.0
    intelligibility: float = 0.0
    expressiveness: float = 0.0

    # Technical metrics
    signal_to_noise_ratio: float = 0.0
    mean_opinion_score: float = 0.0  # MOS
    word_error_rate: float = 0.0     # For STT

    # Prosody analysis
    pitch_variation: float = 0.0
    speech_rate_consistency: float = 0.0
    pause_appropriateness: float = 0.0

    # Emotional accuracy
    emotion_match_score: float = 0.0
    intended_emotion: Optional[str] = None
    detected_emotion: Optional[str] = None

    # Provider comparison
    provider: Optional[SpeechProvider] = None
    benchmark_comparison: Dict[str, float] = field(default_factory=dict)


# ============================================================================
# DIVINE VOICE PRESETS - Optimized for Natural, Human, Divine Delivery
# ============================================================================

# Voice Gender Selection
class DivineVoiceGender(Enum):
    """Gender options for divine voice."""
    FEMALE = "female"    # Default - nurturing, maternal divine presence
    MALE = "male"        # Paternal, wise sage divine presence
    NEUTRAL = "neutral"  # Gender-neutral divine presence


# Natural Speech Enhancement Settings
@dataclass
class NaturalSpeechEnhancement:
    """Settings for human-like, natural speech delivery."""
    # Breath and Life
    add_breath_sounds: bool = True         # Add natural breath between phrases
    breath_frequency: float = 0.3          # How often to add breaths (0-1)
    breath_intensity: float = 0.4          # How audible breaths are

    # Micro-variations (makes voice less robotic)
    pitch_micro_variation: float = 0.15    # Subtle pitch fluctuations
    timing_variation: float = 0.1          # Natural timing imperfections
    volume_micro_variation: float = 0.08   # Subtle volume changes

    # Human characteristics
    vocal_fry: float = 0.0                 # End-of-phrase vocal fry (0-1)
    lip_smacks: bool = False               # Occasional lip sounds
    throat_clear: bool = False             # Very rare throat sounds

    # Emotional authenticity
    emotion_bleed: float = 0.3             # Emotion carries between sentences
    crescendo_decrescendo: bool = True     # Natural volume arcs

    # Pause naturalness
    thinking_pauses: bool = True           # Natural "thinking" pauses
    hesitation_markers: bool = False       # "um", "hmm" (disabled for divine)
    pause_variation: float = 0.2           # Randomize pause lengths


# Female Divine Voice Profiles
DIVINE_FEMALE_VOICES = {
    "shakti_serene": VoiceProfile(
        id="shakti_serene",
        name="Shakti - Divine Mother",
        description="The nurturing divine mother - deeply calming, infinitely compassionate, like being held by the universe",
        gender="female",
        age="adult",
        accent="neutral",
        language="en",
        preferred_providers=[
            SpeechProvider.COQUI_XTTS,
            SpeechProvider.STYLE_TTS2,
            SpeechProvider.EDGE_TTS,
        ],
        provider_voice_ids={
            "edge_tts": "en-US-AnaNeural",      # Warm, natural female
            "coqui_xtts": "female_serene",
            "silero": "en_0",                    # Calm female
            "google_cloud": "en-US-Neural2-C",  # Natural female
        },
        default_prosody=EmotionalProsody(
            emotion=EmotionCategory.SERENE,
            intensity=0.75,
            speaking_rate=0.85,     # Slower for divinity
            pitch=-0.8,             # Slightly lower for warmth
            pitch_range=1.2,        # Natural variation
            warmth=0.92,            # Very warm
            breathiness=0.25,       # Soft, airy quality
            clarity=0.85,
            resonance=0.6,          # Balanced chest/head voice
            pause_frequency=1.4,
            pause_duration=1.3,
            rhythm_regularity=0.6,  # Natural, not robotic
            smile=True,             # Warmth in voice
        ),
    ),

    "saraswati_wise": VoiceProfile(
        id="saraswati_wise",
        name="Saraswati - Divine Teacher",
        description="The goddess of wisdom - clear, enlightening, each word carries profound meaning",
        gender="female",
        age="adult",
        accent="neutral",
        language="en",
        preferred_providers=[
            SpeechProvider.STYLE_TTS2,
            SpeechProvider.COQUI_XTTS,
            SpeechProvider.EDGE_TTS,
        ],
        provider_voice_ids={
            "edge_tts": "en-US-JennyNeural",    # Clear, articulate
            "coqui_xtts": "female_wise",
            "silero": "en_1",
            "google_cloud": "en-US-Neural2-F",
        },
        default_prosody=EmotionalProsody(
            emotion=EmotionCategory.WISE,
            intensity=0.65,
            speaking_rate=0.90,
            pitch=-0.3,
            pitch_range=1.3,
            warmth=0.7,
            clarity=0.95,           # Crystal clear articulation
            resonance=0.55,
            pause_frequency=1.25,
            rhythm_regularity=0.7,
            emphasis_strength=1.15,
        ),
    ),

    "lakshmi_compassionate": VoiceProfile(
        id="lakshmi_compassionate",
        name="Lakshmi - Divine Grace",
        description="The goddess of abundance - overflowing with love, grace, and tender care",
        gender="female",
        age="adult",
        accent="neutral",
        language="en",
        preferred_providers=[
            SpeechProvider.BARK,
            SpeechProvider.COQUI_XTTS,
            SpeechProvider.STYLE_TTS2,
        ],
        provider_voice_ids={
            "edge_tts": "en-US-AriaNeural",     # Expressive, warm
            "coqui_xtts": "female_compassionate",
            "silero": "en_2",
        },
        default_prosody=EmotionalProsody(
            emotion=EmotionCategory.COMPASSIONATE,
            intensity=0.85,
            speaking_rate=0.87,
            pitch=-0.2,
            warmth=0.95,            # Maximum warmth
            breathiness=0.2,
            smile=True,
            pause_frequency=1.1,
            rhythm_regularity=0.55,
        ),
    ),

    "parvati_meditation": VoiceProfile(
        id="parvati_meditation",
        name="Parvati - Divine Stillness",
        description="The goddess of meditation - whisper-soft, transcendent, guiding into deep stillness",
        gender="female",
        age="adult",
        accent="neutral",
        language="en",
        preferred_providers=[
            SpeechProvider.COQUI_XTTS,
            SpeechProvider.SILERO,
        ],
        provider_voice_ids={
            "edge_tts": "en-US-AnaNeural",
            "coqui_xtts": "female_meditation",
            "silero": "en_0",
        },
        default_prosody=EmotionalProsody(
            emotion=EmotionCategory.SERENE,
            intensity=0.9,
            speaking_rate=0.78,     # Very slow
            pitch=-1.5,             # Deep, grounding
            warmth=0.8,
            breathiness=0.45,       # Very soft, airy
            whisper=False,          # Soft but not whisper
            pause_frequency=2.0,    # Lots of space
            pause_duration=1.8,
            rhythm_regularity=0.5,
        ),
    ),
}


# Male Divine Voice Profiles
DIVINE_MALE_VOICES = {
    "krishna_serene": VoiceProfile(
        id="krishna_serene",
        name="Krishna - Divine Friend",
        description="The beloved friend - warm, playful yet profound, infinitely loving presence",
        gender="male",
        age="adult",
        accent="neutral",
        language="en",
        preferred_providers=[
            SpeechProvider.COQUI_XTTS,
            SpeechProvider.STYLE_TTS2,
            SpeechProvider.EDGE_TTS,
        ],
        provider_voice_ids={
            "edge_tts": "en-US-GuyNeural",       # Warm male
            "coqui_xtts": "male_serene",
            "silero": "en_3",                    # Calm male
            "google_cloud": "en-US-Neural2-D",  # Natural male
        },
        default_prosody=EmotionalProsody(
            emotion=EmotionCategory.SERENE,
            intensity=0.7,
            speaking_rate=0.87,
            pitch=-2.5,             # Deep, grounding male voice
            pitch_range=1.1,
            warmth=0.88,
            breathiness=0.15,
            clarity=0.88,
            resonance=0.7,          # More chest resonance
            pause_frequency=1.35,
            rhythm_regularity=0.6,
            smile=True,
        ),
    ),

    "vishnu_wise": VoiceProfile(
        id="vishnu_wise",
        name="Vishnu - Cosmic Preserver",
        description="The sustainer of all - measured, profound, each word carries the weight of eternity",
        gender="male",
        age="adult",
        accent="neutral",
        language="en",
        preferred_providers=[
            SpeechProvider.STYLE_TTS2,
            SpeechProvider.COQUI_XTTS,
            SpeechProvider.EDGE_TTS,
        ],
        provider_voice_ids={
            "edge_tts": "en-US-DavisNeural",    # Authoritative
            "coqui_xtts": "male_wise",
            "silero": "en_4",
            "google_cloud": "en-US-Neural2-J",
        },
        default_prosody=EmotionalProsody(
            emotion=EmotionCategory.WISE,
            intensity=0.65,
            speaking_rate=0.88,
            pitch=-3.0,             # Deep, authoritative
            pitch_range=1.0,
            warmth=0.65,
            clarity=0.92,
            resonance=0.75,
            pause_frequency=1.4,
            pause_duration=1.2,
            rhythm_regularity=0.7,
            emphasis_strength=1.1,
        ),
    ),

    "shiva_compassionate": VoiceProfile(
        id="shiva_compassionate",
        name="Shiva - Divine Transformer",
        description="The compassionate destroyer - gentle power, holding space for transformation",
        gender="male",
        age="adult",
        accent="neutral",
        language="en",
        preferred_providers=[
            SpeechProvider.BARK,
            SpeechProvider.COQUI_XTTS,
            SpeechProvider.STYLE_TTS2,
        ],
        provider_voice_ids={
            "edge_tts": "en-US-JasonNeural",    # Warm, gentle
            "coqui_xtts": "male_compassionate",
            "silero": "en_5",
        },
        default_prosody=EmotionalProsody(
            emotion=EmotionCategory.COMPASSIONATE,
            intensity=0.8,
            speaking_rate=0.85,
            pitch=-2.8,
            warmth=0.9,
            breathiness=0.12,
            resonance=0.72,
            smile=False,            # Serene, not smiling
            pause_frequency=1.3,
            rhythm_regularity=0.55,
        ),
    ),

    "brahma_meditation": VoiceProfile(
        id="brahma_meditation",
        name="Brahma - Cosmic Creator",
        description="The source of all - primordial stillness, the sound before sound",
        gender="male",
        age="elderly",             # Ancient wisdom
        accent="neutral",
        language="en",
        preferred_providers=[
            SpeechProvider.COQUI_XTTS,
            SpeechProvider.SILERO,
        ],
        provider_voice_ids={
            "edge_tts": "en-US-TonyNeural",     # Mature, deep
            "coqui_xtts": "male_meditation",
            "silero": "en_6",
        },
        default_prosody=EmotionalProsody(
            emotion=EmotionCategory.SERENE,
            intensity=0.85,
            speaking_rate=0.75,     # Very slow, ancient
            pitch=-4.0,             # Very deep
            warmth=0.75,
            breathiness=0.3,
            resonance=0.8,          # Deep chest resonance
            pause_frequency=2.2,
            pause_duration=2.0,
            rhythm_regularity=0.45,
        ),
    ),
}


# Unified Divine Voice Profiles (backwards compatible)
DIVINE_VOICE_PROFILES = {
    # Default female voices (backwards compatible with original names)
    "kiaan_serene": DIVINE_FEMALE_VOICES["shakti_serene"],
    "kiaan_wise": DIVINE_FEMALE_VOICES["saraswati_wise"],
    "kiaan_compassionate": DIVINE_FEMALE_VOICES["lakshmi_compassionate"],
    "kiaan_meditation": DIVINE_FEMALE_VOICES["parvati_meditation"],

    # All female voices
    **DIVINE_FEMALE_VOICES,

    # All male voices
    **DIVINE_MALE_VOICES,
}


# Natural Speech Enhancement Presets
NATURAL_SPEECH_PRESETS = {
    "divine_natural": NaturalSpeechEnhancement(
        add_breath_sounds=True,
        breath_frequency=0.35,
        breath_intensity=0.3,
        pitch_micro_variation=0.12,
        timing_variation=0.08,
        volume_micro_variation=0.06,
        emotion_bleed=0.4,
        crescendo_decrescendo=True,
        thinking_pauses=True,
        pause_variation=0.25,
    ),
    "meditation_natural": NaturalSpeechEnhancement(
        add_breath_sounds=True,
        breath_frequency=0.5,           # More breaths for meditation
        breath_intensity=0.4,
        pitch_micro_variation=0.08,     # Less variation, more consistent
        timing_variation=0.05,
        volume_micro_variation=0.04,
        emotion_bleed=0.5,
        crescendo_decrescendo=True,
        thinking_pauses=True,
        pause_variation=0.3,
    ),
    "conversation_natural": NaturalSpeechEnhancement(
        add_breath_sounds=True,
        breath_frequency=0.25,
        breath_intensity=0.25,
        pitch_micro_variation=0.18,     # More natural variation
        timing_variation=0.12,
        volume_micro_variation=0.1,
        emotion_bleed=0.35,
        crescendo_decrescendo=True,
        thinking_pauses=True,
        pause_variation=0.2,
    ),
}


# Emotion to prosody mapping for divine voice
DIVINE_EMOTION_PROSODY = {
    "peace": EmotionalProsody(
        emotion=EmotionCategory.SERENE,
        speaking_rate=0.85,
        pitch=-1.2,
        warmth=0.85,
        breathiness=0.25,
        pause_frequency=1.5,
        rhythm_regularity=0.55,
    ),
    "compassion": EmotionalProsody(
        emotion=EmotionCategory.COMPASSIONATE,
        speaking_rate=0.87,
        pitch=-0.5,
        warmth=0.92,
        breathiness=0.18,
        smile=True,
        rhythm_regularity=0.5,
    ),
    "wisdom": EmotionalProsody(
        emotion=EmotionCategory.WISE,
        speaking_rate=0.90,
        pitch=-0.3,
        clarity=0.92,
        pause_frequency=1.3,
        emphasis_strength=1.1,
        rhythm_regularity=0.65,
    ),
    "joy": EmotionalProsody(
        emotion=EmotionCategory.JOYFUL,
        speaking_rate=0.94,
        pitch=0.3,
        warmth=0.75,
        smile=True,
        rhythm_regularity=0.6,
    ),
    "solemnity": EmotionalProsody(
        emotion=EmotionCategory.SOLEMN,
        speaking_rate=0.82,
        pitch=-1.8,
        resonance=0.75,
        pause_frequency=1.6,
        rhythm_regularity=0.7,
    ),
    "encouragement": EmotionalProsody(
        emotion=EmotionCategory.ENCOURAGING,
        speaking_rate=0.92,
        pitch=0.2,
        warmth=0.85,
        emphasis_strength=1.2,
        rhythm_regularity=0.55,
    ),
    "love": EmotionalProsody(
        emotion=EmotionCategory.COMPASSIONATE,
        speaking_rate=0.85,
        pitch=-0.3,
        warmth=0.95,
        breathiness=0.22,
        smile=True,
        rhythm_regularity=0.5,
    ),
    "stillness": EmotionalProsody(
        emotion=EmotionCategory.SERENE,
        speaking_rate=0.78,
        pitch=-2.0,
        warmth=0.8,
        breathiness=0.35,
        pause_frequency=2.0,
        pause_duration=1.8,
        rhythm_regularity=0.45,
    ),
}
