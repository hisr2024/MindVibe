"""
Speech Module Data Models

Standardized data structures for cross-provider speech processing,
enabling seamless integration of diverse speech technologies.

"Unity in diversity - all voices speak the same language of the heart."
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any, Literal
from enum import Enum
import numpy as np


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
    voice_embedding: Optional[np.ndarray] = None
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
# DIVINE VOICE PRESETS - Optimized for Spiritual Content
# ============================================================================

DIVINE_VOICE_PROFILES = {
    "kiaan_serene": VoiceProfile(
        id="kiaan_serene",
        name="KIAAN Serene",
        description="The primary divine voice - deeply calming, wise, and compassionate",
        gender="female",
        age="adult",
        accent="neutral",
        language="en",
        preferred_providers=[
            SpeechProvider.COQUI_XTTS,
            SpeechProvider.SILERO,
            SpeechProvider.EDGE_TTS,
        ],
        default_prosody=EmotionalProsody(
            emotion=EmotionCategory.SERENE,
            intensity=0.7,
            speaking_rate=0.88,
            pitch=-1.0,
            warmth=0.8,
            breathiness=0.2,
            pause_frequency=1.3,
        ),
    ),

    "kiaan_wise": VoiceProfile(
        id="kiaan_wise",
        name="KIAAN Wise",
        description="The teaching voice - measured, thoughtful, authoritative yet gentle",
        gender="female",
        age="adult",
        accent="neutral",
        language="en",
        preferred_providers=[
            SpeechProvider.STYLE_TTS2,
            SpeechProvider.COQUI_XTTS,
            SpeechProvider.EDGE_TTS,
        ],
        default_prosody=EmotionalProsody(
            emotion=EmotionCategory.WISE,
            intensity=0.6,
            speaking_rate=0.92,
            pitch=-0.5,
            warmth=0.6,
            clarity=0.9,
            pause_frequency=1.2,
        ),
    ),

    "kiaan_compassionate": VoiceProfile(
        id="kiaan_compassionate",
        name="KIAAN Compassionate",
        description="The nurturing voice - warm, tender, deeply caring",
        gender="female",
        age="adult",
        accent="neutral",
        language="en",
        preferred_providers=[
            SpeechProvider.BARK,
            SpeechProvider.COQUI_XTTS,
            SpeechProvider.STYLE_TTS2,
        ],
        default_prosody=EmotionalProsody(
            emotion=EmotionCategory.COMPASSIONATE,
            intensity=0.8,
            speaking_rate=0.90,
            pitch=-0.3,
            warmth=0.9,
            breathiness=0.15,
            smile=True,
        ),
    ),

    "kiaan_meditation": VoiceProfile(
        id="kiaan_meditation",
        name="KIAAN Meditation Guide",
        description="The meditation voice - whisper-like, deeply tranquil, hypnotic",
        gender="female",
        age="adult",
        accent="neutral",
        language="en",
        preferred_providers=[
            SpeechProvider.COQUI_XTTS,
            SpeechProvider.SILERO,
        ],
        default_prosody=EmotionalProsody(
            emotion=EmotionCategory.SERENE,
            intensity=0.9,
            speaking_rate=0.80,
            pitch=-2.0,
            warmth=0.7,
            breathiness=0.4,
            whisper=False,  # Not full whisper, but soft
            pause_frequency=1.8,
            pause_duration=1.5,
        ),
    ),
}

# Emotion to prosody mapping for divine voice
DIVINE_EMOTION_PROSODY = {
    "peace": EmotionalProsody(
        emotion=EmotionCategory.SERENE,
        speaking_rate=0.88,
        pitch=-1.2,
        warmth=0.8,
        breathiness=0.2,
        pause_frequency=1.4,
    ),
    "compassion": EmotionalProsody(
        emotion=EmotionCategory.COMPASSIONATE,
        speaking_rate=0.90,
        pitch=-0.5,
        warmth=0.9,
        smile=True,
    ),
    "wisdom": EmotionalProsody(
        emotion=EmotionCategory.WISE,
        speaking_rate=0.92,
        pitch=-0.3,
        clarity=0.9,
        pause_frequency=1.2,
    ),
    "joy": EmotionalProsody(
        emotion=EmotionCategory.JOYFUL,
        speaking_rate=0.96,
        pitch=0.3,
        warmth=0.7,
        smile=True,
    ),
    "solemnity": EmotionalProsody(
        emotion=EmotionCategory.SOLEMN,
        speaking_rate=0.85,
        pitch=-1.5,
        resonance=0.7,
        pause_frequency=1.5,
    ),
    "encouragement": EmotionalProsody(
        emotion=EmotionCategory.ENCOURAGING,
        speaking_rate=0.94,
        pitch=0.2,
        warmth=0.8,
        emphasis_strength=1.2,
    ),
}
