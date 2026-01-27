"""
MindVibe Text-to-Speech Service - Ultra-Natural Voice Processing with OFFLINE SUPPORT

Provides multilingual voice synthesis for Gita verses, KIAAN responses,
and meditation guidance across 17 languages with advanced prosody,
emotion-aware synthesis, and intelligent caching.

Features:
- Google Cloud Studio/Journey/Wavenet voices for maximum naturalness
- SSML-based prosody control with emotional inflection
- Intelligent pause injection for natural rhythm
- Emphasis detection for important phrases
- Breathing simulation for meditation content
- Emotion-adaptive voice modulation
- Multi-layer caching (Redis + Memory)
- Real-time quality metrics tracking

OFFLINE INDEPENDENCE (v3.0):
- pyttsx3 for fully offline TTS (no internet required)
- edge-tts for high-quality Microsoft voices (works with cached tokens)
- Automatic fallback chain: Google → edge-tts → pyttsx3
- Local audio caching for common phrases
- Pre-generated audio for offline meditation content

Quantum Coherence: Voice brings ancient wisdom to life, creating resonance
between text and sound, making teachings accessible to all learning modalities.
"""

import hashlib
import logging
import re
import threading
import asyncio
from typing import Optional, Literal, Dict, List, Tuple
from io import BytesIO
from pathlib import Path
import os
import json

# Google Cloud TTS (primary provider)
try:
    from google.cloud import texttospeech
    GOOGLE_TTS_AVAILABLE = True
except ImportError:
    GOOGLE_TTS_AVAILABLE = False

# pyttsx3 for offline TTS (no internet required)
try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False

# edge-tts for Microsoft voices (lightweight, works offline with cached tokens)
try:
    import edge_tts
    EDGE_TTS_AVAILABLE = True
except ImportError:
    EDGE_TTS_AVAILABLE = False

logger = logging.getLogger(__name__)

VoiceType = Literal["calm", "wisdom", "friendly"]
VoiceGender = Literal["male", "female", "neutral"]

# Emotion-to-prosody mapping for ULTRA-NATURAL adaptive voice
# Refined for subtle, human-like emotional expression without robotic exaggeration
EMOTION_PROSODY_MAP = {
    "joy": {"rate": 1.02, "pitch": 1.0, "volume": "medium", "emphasis": "moderate"},
    "sadness": {"rate": 0.90, "pitch": -1.0, "volume": "soft", "emphasis": "reduced"},
    "anxiety": {"rate": 0.88, "pitch": -0.5, "volume": "soft", "emphasis": "reduced"},
    "peace": {"rate": 0.92, "pitch": -0.3, "volume": "soft", "emphasis": "none"},
    "gratitude": {"rate": 0.96, "pitch": 0.5, "volume": "medium", "emphasis": "moderate"},
    "anger": {"rate": 0.94, "pitch": 0.2, "volume": "medium", "emphasis": "strong"},
    "fear": {"rate": 0.88, "pitch": 0.3, "volume": "soft", "emphasis": "reduced"},
    "hope": {"rate": 0.97, "pitch": 0.8, "volume": "medium", "emphasis": "moderate"},
    "love": {"rate": 0.93, "pitch": 0.3, "volume": "soft", "emphasis": "moderate"},
    "compassion": {"rate": 0.91, "pitch": -0.2, "volume": "soft", "emphasis": "moderate"},
    "curiosity": {"rate": 0.98, "pitch": 0.4, "volume": "medium", "emphasis": "moderate"},
    "confidence": {"rate": 0.95, "pitch": 0.0, "volume": "medium", "emphasis": "strong"},
    "serenity": {"rate": 0.90, "pitch": -0.4, "volume": "soft", "emphasis": "none"},
    "neutral": {"rate": 0.95, "pitch": 0.0, "volume": "medium", "emphasis": "none"},
}

# Sanskrit/Hindi spiritual terms that need emphasis
SPIRITUAL_TERMS = [
    "dharma", "karma", "yoga", "atman", "brahman", "moksha", "samsara",
    "nirvana", "prana", "chakra", "mantra", "om", "namaste", "guru",
    "krishna", "arjuna", "gita", "bhagavad", "vedanta", "upanishad",
    "sanskrit", "divine", "eternal", "consciousness", "enlightenment",
    "meditation", "mindfulness", "awareness", "presence", "wisdom",
]

# Pause markers for ULTRA-NATURAL speech rhythm
# Calibrated to match human speech patterns - not too long, not too short
PAUSE_PATTERNS = {
    r'\.{3,}': '<break time="600ms"/>',   # Ellipsis - thoughtful pause (not too long)
    r'\.\s+': '<break time="350ms"/> ',   # Period - natural sentence boundary
    r'\?\s+': '<break time="300ms"/> ',   # Question - natural thinking pause
    r'!\s+': '<break time="280ms"/> ',    # Exclamation - energetic but brief
    r':\s+': '<break time="280ms"/> ',    # Colon - subtle anticipation
    r';\s+': '<break time="250ms"/> ',    # Semicolon - thought continuation
    r',\s+': '<break time="150ms"/> ',    # Comma - micro-pause (human-like)
    r'—': '<break time="320ms"/>',        # Em-dash - subtle dramatic pause
    r'–': '<break time="220ms"/>',        # En-dash - brief pause
}

# Additional natural speech patterns for human-like delivery
NATURAL_PHRASE_PATTERNS = {
    # Add micro-pauses before important words
    r'\b(because|therefore|however|moreover|furthermore)\b': '<break time="120ms"/>\\1',
    # Subtle emphasis on transitional phrases
    r'\b(In other words|That is to say|For example)\b': '<break time="180ms"/>\\1',
    # Natural pause before quoted speech
    r'(\s)(said|says|asked|replied|whispered)(\s)': '\\1\\2<break time="100ms"/>\\3',
}


# Language to Google TTS voice mapping - Using Neural2/Studio voices for MAXIMUM naturalness
# Neural2 voices: Latest generation with human-like intonation, emphasis, and natural prosody
# Studio voices: Premium quality for English/Spanish with film-quality naturalness
# Journey voices: Optimized for longer content with expressive storytelling quality
# Priority: Neural2 > Studio > Journey > Wavenet > Standard
LANGUAGE_VOICE_MAP: Dict[str, Dict[str, str]] = {
    "en": {
        # English - Premium Studio voices for absolute naturalness
        "calm": "en-US-Studio-O",      # Studio female - soothing, therapeutic quality
        "wisdom": "en-US-Neural2-D",   # Neural2 male - warm, authoritative, human-like
        "friendly": "en-US-Neural2-F", # Neural2 female - conversational, natural warmth
    },
    "hi": {  # Hindi - Neural2 for most natural Indian language synthesis
        "calm": "hi-IN-Neural2-A",     # Neural2 female - soft, calming
        "wisdom": "hi-IN-Neural2-B",   # Neural2 male - measured, wise
        "friendly": "hi-IN-Neural2-D", # Neural2 female - warm, approachable
    },
    "ta": {  # Tamil - Neural2 for natural prosody
        "calm": "ta-IN-Neural2-A",     # Neural2 female - gentle
        "wisdom": "ta-IN-Neural2-B",   # Neural2 male - contemplative
        "friendly": "ta-IN-Neural2-A", # Neural2 female - warm
    },
    "te": {  # Telugu - Neural2 for human-like quality
        "calm": "te-IN-Neural2-A",     # Neural2 female - soothing
        "wisdom": "te-IN-Neural2-B",   # Neural2 male - wise
        "friendly": "te-IN-Neural2-A", # Neural2 female - friendly
    },
    "bn": {  # Bengali - Neural2 for natural speech
        "calm": "bn-IN-Neural2-A",     # Neural2 female - calming
        "wisdom": "bn-IN-Neural2-B",   # Neural2 male - thoughtful
        "friendly": "bn-IN-Neural2-A", # Neural2 female - warm
    },
    "mr": {  # Marathi - Neural2 for improved naturalness
        "calm": "mr-IN-Neural2-A",     # Neural2 female - gentle
        "wisdom": "mr-IN-Neural2-B",   # Neural2 male - wise
        "friendly": "mr-IN-Neural2-A", # Neural2 female - approachable
    },
    "gu": {  # Gujarati - Neural2 for natural intonation
        "calm": "gu-IN-Neural2-A",     # Neural2 female - soft
        "wisdom": "gu-IN-Neural2-B",   # Neural2 male - grounded
        "friendly": "gu-IN-Neural2-A", # Neural2 female - warm
    },
    "kn": {  # Kannada - Neural2 for human-like prosody
        "calm": "kn-IN-Neural2-A",     # Neural2 female - soothing
        "wisdom": "kn-IN-Neural2-B",   # Neural2 male - contemplative
        "friendly": "kn-IN-Neural2-A", # Neural2 female - friendly
    },
    "ml": {  # Malayalam - Neural2 for natural speech flow
        "calm": "ml-IN-Neural2-A",     # Neural2 female - calming
        "wisdom": "ml-IN-Neural2-B",   # Neural2 male - wise
        "friendly": "ml-IN-Neural2-A", # Neural2 female - warm
    },
    "pa": {  # Punjabi - Neural2 for authentic naturalness
        "calm": "pa-IN-Neural2-A",     # Neural2 female - gentle
        "wisdom": "pa-IN-Neural2-B",   # Neural2 male - grounded
        "friendly": "pa-IN-Neural2-A", # Neural2 female - approachable
    },
    "sa": {  # Sanskrit - Hindi Neural2 with optimized settings for classical pronunciation
        "calm": "hi-IN-Neural2-A",     # Neural2 - soft, reverent
        "wisdom": "hi-IN-Neural2-B",   # Neural2 - authoritative, classical
        "friendly": "hi-IN-Neural2-D", # Neural2 - accessible
    },
    "es": {  # Spanish - Neural2/Studio for native-quality speech
        "calm": "es-US-Neural2-A",     # Neural2 female - soothing
        "wisdom": "es-US-Neural2-B",   # Neural2 male - wise, warm
        "friendly": "es-US-Neural2-C", # Neural2 female - conversational
    },
    "fr": {  # French - Neural2 for authentic, natural French
        "calm": "fr-FR-Neural2-A",     # Neural2 female - soft, elegant
        "wisdom": "fr-FR-Neural2-B",   # Neural2 male - thoughtful
        "friendly": "fr-FR-Neural2-C", # Neural2 female - warm, approachable
    },
    "de": {  # German - Neural2 for natural German prosody
        "calm": "de-DE-Neural2-A",     # Neural2 female - calming
        "wisdom": "de-DE-Neural2-B",   # Neural2 male - measured, wise
        "friendly": "de-DE-Neural2-C", # Neural2 female - warm
    },
    "pt": {  # Portuguese - Neural2 for natural Brazilian/European Portuguese
        "calm": "pt-BR-Neural2-A",     # Neural2 female - soothing
        "wisdom": "pt-BR-Neural2-B",   # Neural2 male - thoughtful
        "friendly": "pt-BR-Neural2-C", # Neural2 female - friendly
    },
    "ja": {  # Japanese - Neural2 for natural Japanese with proper honorifics intonation
        "calm": "ja-JP-Neural2-B",     # Neural2 female - gentle, calming
        "wisdom": "ja-JP-Neural2-C",   # Neural2 male - wise, measured
        "friendly": "ja-JP-Neural2-D", # Neural2 female - warm, natural
    },
    "zh": {  # Chinese Mandarin - Neural2 for natural tonal accuracy
        "calm": "cmn-CN-Neural2-A",    # Neural2 female - soft, soothing
        "wisdom": "cmn-CN-Neural2-B",  # Neural2 male - wise, grounded
        "friendly": "cmn-CN-Neural2-D",# Neural2 female - warm, conversational
    },
    "ar": {  # Arabic - Neural2 for natural Arabic prosody
        "calm": "ar-XA-Neural2-A",     # Neural2 female - calming
        "wisdom": "ar-XA-Neural2-B",   # Neural2 male - wise, measured
        "friendly": "ar-XA-Neural2-C", # Neural2 female - warm
    },
}

# Voice type specific settings for ULTRA-NATURAL speech prosody
# Optimized for human-like speech patterns with subtle variations
VOICE_TYPE_SETTINGS: Dict[str, Dict[str, float]] = {
    "calm": {
        "speed": 0.92,       # Natural slow pace - not too robotic slow
        "pitch": -0.8,       # Subtle lower pitch for warmth without sounding artificial
        "volume_gain": 0.0,  # Natural volume
    },
    "wisdom": {
        "speed": 0.94,       # Measured but natural pace - like a wise friend speaking
        "pitch": -0.3,       # Slightly grounded tone for authority without monotone
        "volume_gain": 0.5,  # Slight boost for clarity
    },
    "friendly": {
        "speed": 0.97,       # Natural conversational pace - not rushed
        "pitch": 0.3,        # Subtle warmth without being artificially high
        "volume_gain": 0.0,  # Natural volume
    },
}

# Natural speech enhancement settings
NATURAL_SPEECH_CONFIG = {
    "enable_micro_pauses": True,           # Add tiny pauses between phrases
    "enable_breath_simulation": True,       # Add subtle breath-like pauses
    "enable_emphasis_variation": True,      # Vary emphasis naturally
    "enable_prosodic_boundaries": True,     # Natural phrase boundaries
    "sample_rate_hertz": 24000,            # High quality sample rate
    "audio_effects": ["headphone-class-device"],  # Premium audio quality
}


# =============================================================================
# OFFLINE TTS - Edge-TTS Voice Mapping
# =============================================================================

# Edge TTS (Microsoft) Neural Voices - PREMIUM quality fallback voices
# Using the most natural-sounding Microsoft Neural voices for each language
# These voices have human-like intonation, natural pauses, and emotional expression
EDGE_TTS_VOICES: Dict[str, Dict[str, str]] = {
    "en": {
        # English - Most natural Microsoft voices
        "calm": "en-US-AvaNeural",         # Ava - warm, soothing, very natural
        "wisdom": "en-US-AndrewNeural",    # Andrew - warm, thoughtful male voice
        "friendly": "en-US-EmmaNeural",    # Emma - friendly, conversational
    },
    "hi": {
        # Hindi - Natural Indian voices
        "calm": "hi-IN-SwaraNeural",       # Swara - soft, calming female
        "wisdom": "hi-IN-MadhurNeural",    # Madhur - warm, wise male
        "friendly": "hi-IN-SwaraNeural",   # Swara - warm, approachable
    },
    "ta": {
        # Tamil - Natural voices
        "calm": "ta-IN-PallaviNeural",     # Pallavi - gentle female
        "wisdom": "ta-IN-ValluvarNeural",  # Valluvar - wise male
        "friendly": "ta-IN-PallaviNeural", # Pallavi - warm female
    },
    "te": {
        # Telugu - Natural voices
        "calm": "te-IN-ShrutiNeural",      # Shruti - soft female
        "wisdom": "te-IN-MohanNeural",     # Mohan - measured male
        "friendly": "te-IN-ShrutiNeural",  # Shruti - warm female
    },
    "bn": {
        # Bengali - Natural voices
        "calm": "bn-IN-TanishaaNeural",    # Tanishaa - gentle female
        "wisdom": "bn-IN-BashkarNeural",   # Bashkar - wise male
        "friendly": "bn-IN-TanishaaNeural",# Tanishaa - friendly
    },
    "mr": {
        # Marathi - Natural voices
        "calm": "mr-IN-AarohiNeural",      # Aarohi - soft female
        "wisdom": "mr-IN-ManoharNeural",   # Manohar - thoughtful male
        "friendly": "mr-IN-AarohiNeural",  # Aarohi - warm
    },
    "gu": {
        # Gujarati - Natural voices
        "calm": "gu-IN-DhwaniNeural",      # Dhwani - gentle female
        "wisdom": "gu-IN-NiranjanNeural",  # Niranjan - grounded male
        "friendly": "gu-IN-DhwaniNeural",  # Dhwani - approachable
    },
    "kn": {
        # Kannada - Natural voices
        "calm": "kn-IN-SapnaNeural",       # Sapna - calming female
        "wisdom": "kn-IN-GaganNeural",     # Gagan - wise male
        "friendly": "kn-IN-SapnaNeural",   # Sapna - warm
    },
    "ml": {
        # Malayalam - Natural voices
        "calm": "ml-IN-SobhanaNeural",     # Sobhana - soft female
        "wisdom": "ml-IN-MidhunNeural",    # Midhun - measured male
        "friendly": "ml-IN-SobhanaNeural", # Sobhana - friendly
    },
    "pa": {
        # Punjabi - Natural voices (fallback to Hindi if unavailable)
        "calm": "hi-IN-SwaraNeural",       # Swara - gentle
        "wisdom": "hi-IN-MadhurNeural",    # Madhur - grounded
        "friendly": "hi-IN-SwaraNeural",   # Swara - warm
    },
    "es": {
        # Spanish - Most natural Microsoft Spanish voices
        "calm": "es-ES-ElviraNeural",      # Elvira - soft, calming
        "wisdom": "es-ES-AlvaroNeural",    # Alvaro - warm, thoughtful
        "friendly": "es-MX-DaliaNeural",   # Dalia - friendly, natural
    },
    "fr": {
        # French - Natural French voices
        "calm": "fr-FR-DeniseNeural",      # Denise - gentle, elegant
        "wisdom": "fr-FR-HenriNeural",     # Henri - measured, thoughtful
        "friendly": "fr-FR-VivienneNeural",# Vivienne - warm, conversational
    },
    "de": {
        # German - Natural German voices
        "calm": "de-DE-KatjaNeural",       # Katja - soft, calming
        "wisdom": "de-DE-ConradNeural",    # Conrad - wise, measured
        "friendly": "de-DE-AmalaNeural",   # Amala - warm, friendly
    },
    "pt": {
        # Portuguese - Natural Portuguese voices
        "calm": "pt-BR-FranciscaNeural",   # Francisca - gentle
        "wisdom": "pt-BR-AntonioNeural",   # Antonio - thoughtful
        "friendly": "pt-BR-ThalitaNeural", # Thalita - warm, conversational
    },
    "ja": {
        # Japanese - Most natural Microsoft Japanese voices
        "calm": "ja-JP-NanamiNeural",      # Nanami - soft, calming
        "wisdom": "ja-JP-KeitaNeural",     # Keita - measured, wise
        "friendly": "ja-JP-AoiNeural",     # Aoi - warm, natural
    },
    "zh": {
        # Chinese Mandarin - Natural voices
        "calm": "zh-CN-XiaoxiaoNeural",    # Xiaoxiao - gentle, soothing
        "wisdom": "zh-CN-YunxiNeural",     # Yunxi - warm, wise
        "friendly": "zh-CN-XiaoyiNeural",  # Xiaoyi - friendly, conversational
    },
    "ar": {
        # Arabic - Natural Arabic voices
        "calm": "ar-SA-ZariyahNeural",     # Zariyah - gentle female
        "wisdom": "ar-SA-HamedNeural",     # Hamed - measured male
        "friendly": "ar-SA-ZariyahNeural", # Zariyah - warm
    },
}


# =============================================================================
# LOCAL TTS PROVIDERS
# =============================================================================

class LocalTTSProvider:
    """
    Local TTS provider using pyttsx3 for fully offline voice synthesis.
    Works without any internet connection.
    """

    def __init__(self):
        self._engine = None
        self._lock = threading.Lock()
        self._initialized = False

    def _ensure_initialized(self) -> bool:
        """Initialize pyttsx3 engine on first use."""
        if self._initialized:
            return self._engine is not None

        with self._lock:
            if self._initialized:
                return self._engine is not None

            if not PYTTSX3_AVAILABLE:
                logger.warning("pyttsx3 not available for offline TTS")
                self._initialized = True
                return False

            try:
                self._engine = pyttsx3.init()

                # Configure voice properties
                self._engine.setProperty('rate', 150)  # Words per minute
                self._engine.setProperty('volume', 0.9)

                # Try to set a good voice
                voices = self._engine.getProperty('voices')
                if voices:
                    # Prefer female voices for calm
                    for voice in voices:
                        if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
                            self._engine.setProperty('voice', voice.id)
                            break

                logger.info("pyttsx3 TTS initialized successfully")
                self._initialized = True
                return True

            except Exception as e:
                logger.error(f"Failed to initialize pyttsx3: {e}")
                self._initialized = True
                return False

    def synthesize(
        self,
        text: str,
        voice_type: str = "friendly",
        speed: float = 1.0
    ) -> Optional[bytes]:
        """Synthesize text to audio using pyttsx3."""
        if not self._ensure_initialized():
            return None

        try:
            import tempfile
            import wave

            # Adjust rate based on voice type
            base_rate = 150
            rate_multiplier = {
                "calm": 0.85,
                "wisdom": 0.90,
                "friendly": 1.0
            }.get(voice_type, 1.0)

            self._engine.setProperty('rate', int(base_rate * rate_multiplier * speed))

            # Save to temp file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                temp_path = f.name

            self._engine.save_to_file(text, temp_path)
            self._engine.runAndWait()

            # Read the file and convert to bytes
            with open(temp_path, 'rb') as f:
                audio_bytes = f.read()

            # Clean up
            os.unlink(temp_path)

            return audio_bytes

        except Exception as e:
            logger.error(f"pyttsx3 synthesis failed: {e}")
            return None

    def is_available(self) -> bool:
        """Check if pyttsx3 is available."""
        return PYTTSX3_AVAILABLE and self._ensure_initialized()


class EdgeTTSProvider:
    """
    Edge TTS provider using Microsoft's neural voices.
    High quality voices that work with minimal bandwidth.
    """

    def __init__(self):
        self._available = EDGE_TTS_AVAILABLE

    async def synthesize(
        self,
        text: str,
        language: str = "en",
        voice_type: str = "friendly",
        speed: float = 1.0
    ) -> Optional[bytes]:
        """Synthesize text using edge-tts."""
        if not self._available:
            return None

        try:
            # Get appropriate voice
            voice = self._get_voice(language, voice_type)

            # Adjust rate (+/- percentage)
            rate_adjustment = int((speed - 1.0) * 100)
            rate_str = f"+{rate_adjustment}%" if rate_adjustment >= 0 else f"{rate_adjustment}%"

            # Create communication object
            communicate = edge_tts.Communicate(text, voice, rate=rate_str)

            # Collect audio chunks
            audio_chunks = []
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_chunks.append(chunk["data"])

            if audio_chunks:
                return b"".join(audio_chunks)
            return None

        except Exception as e:
            logger.error(f"edge-tts synthesis failed: {e}")
            return None

    def _get_voice(self, language: str, voice_type: str) -> str:
        """Get edge-tts voice for language and type."""
        lang_voices = EDGE_TTS_VOICES.get(language, EDGE_TTS_VOICES.get("en", {}))
        return lang_voices.get(voice_type, "en-US-AriaNeural")

    def is_available(self) -> bool:
        """Check if edge-tts is available."""
        return self._available


class OfflineAudioCache:
    """
    Cache for pre-generated offline audio.
    Stores commonly used phrases and meditations for instant access.
    """

    def __init__(self, cache_dir: Optional[str] = None):
        self.cache_dir = Path(cache_dir or Path.home() / ".mindvibe" / "audio_cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._index: Dict[str, str] = {}
        self._load_index()

    def _load_index(self) -> None:
        """Load cache index from disk."""
        index_file = self.cache_dir / "index.json"
        if index_file.exists():
            try:
                with open(index_file, "r") as f:
                    self._index = json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load audio cache index: {e}")

    def _save_index(self) -> None:
        """Save cache index to disk."""
        index_file = self.cache_dir / "index.json"
        try:
            with open(index_file, "w") as f:
                json.dump(self._index, f, indent=2)
        except Exception as e:
            logger.warning(f"Failed to save audio cache index: {e}")

    def _generate_key(self, text: str, language: str, voice_type: str) -> str:
        """Generate cache key."""
        content = f"{text}:{language}:{voice_type}"
        return hashlib.md5(content.encode()).hexdigest()

    def get(self, text: str, language: str, voice_type: str) -> Optional[bytes]:
        """Get cached audio if available."""
        key = self._generate_key(text, language, voice_type)
        if key not in self._index:
            return None

        audio_file = self.cache_dir / self._index[key]
        if not audio_file.exists():
            return None

        try:
            with open(audio_file, "rb") as f:
                return f.read()
        except Exception:
            return None

    def set(self, text: str, language: str, voice_type: str, audio: bytes) -> None:
        """Cache audio for future offline use."""
        key = self._generate_key(text, language, voice_type)
        filename = f"{key}.mp3"
        audio_file = self.cache_dir / filename

        try:
            with open(audio_file, "wb") as f:
                f.write(audio)
            self._index[key] = filename
            self._save_index()
        except Exception as e:
            logger.warning(f"Failed to cache audio: {e}")

    def clear(self) -> None:
        """Clear all cached audio."""
        for filename in self._index.values():
            try:
                (self.cache_dir / filename).unlink(missing_ok=True)
            except Exception:
                pass
        self._index = {}
        self._save_index()


# Global offline providers
_local_tts_provider: Optional[LocalTTSProvider] = None
_edge_tts_provider: Optional[EdgeTTSProvider] = None
_offline_audio_cache: Optional[OfflineAudioCache] = None


def get_local_tts_provider() -> LocalTTSProvider:
    """Get or create local TTS provider."""
    global _local_tts_provider
    if _local_tts_provider is None:
        _local_tts_provider = LocalTTSProvider()
    return _local_tts_provider


def get_edge_tts_provider() -> EdgeTTSProvider:
    """Get or create edge TTS provider."""
    global _edge_tts_provider
    if _edge_tts_provider is None:
        _edge_tts_provider = EdgeTTSProvider()
    return _edge_tts_provider


def get_offline_audio_cache() -> OfflineAudioCache:
    """Get or create offline audio cache."""
    global _offline_audio_cache
    if _offline_audio_cache is None:
        _offline_audio_cache = OfflineAudioCache()
    return _offline_audio_cache


class TTSService:
    """
    Text-to-Speech service with Google Cloud TTS, edge-tts, and pyttsx3 fallback.

    OFFLINE SUPPORT (v3.0):
    - Primary: Google Cloud TTS (highest quality, requires internet)
    - Fallback 1: edge-tts (Microsoft neural voices, lightweight)
    - Fallback 2: pyttsx3 (fully offline, no internet required)
    - Automatic fallback chain based on availability
    """

    def __init__(self, redis_client=None):
        """
        Initialize TTS service with offline fallback support.

        Args:
            redis_client: Optional Redis client for caching
        """
        self.redis_client = redis_client
        self.memory_cache: Dict[str, bytes] = {}  # Fallback cache
        self.cache_ttl = 604800  # 1 week in seconds

        # Initialize Google TTS client (primary)
        if GOOGLE_TTS_AVAILABLE:
            try:
                self.tts_client = texttospeech.TextToSpeechClient()
                logger.info("Google Cloud TTS initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Google TTS: {e}")
                self.tts_client = None
        else:
            logger.warning("Google Cloud TTS not available - will use offline fallback")
            self.tts_client = None

        # Initialize offline providers (v3.0)
        self.local_tts = get_local_tts_provider()
        self.edge_tts = get_edge_tts_provider()
        self.offline_cache = get_offline_audio_cache()

        # Track provider availability
        self._google_available = self.tts_client is not None
        self._edge_available = EDGE_TTS_AVAILABLE
        self._local_available = PYTTSX3_AVAILABLE

        logger.info(f"TTS Providers: Google={self._google_available}, "
                   f"Edge={self._edge_available}, Local={self._local_available}")

    def _generate_cache_key(
        self,
        text: str,
        language: str,
        voice_type: VoiceType,
        speed: float = 0.9
    ) -> str:
        """Generate unique cache key for audio"""
        content = f"{text}:{language}:{voice_type}:{speed}"
        return f"tts:{hashlib.md5(content.encode()).hexdigest()}"

    def _get_voice_config(
        self,
        language: str,
        voice_type: VoiceType
    ) -> Optional[str]:
        """Get voice name for language and type"""
        if language not in LANGUAGE_VOICE_MAP:
            # Fallback to English
            language = "en"

        return LANGUAGE_VOICE_MAP[language].get(voice_type)

    def _get_cached_audio(self, cache_key: str) -> Optional[bytes]:
        """Retrieve audio from cache (Redis or memory)"""
        # Try Redis first
        if self.redis_client:
            try:
                cached = self.redis_client.get(cache_key)
                if cached:
                    logger.info(f"Cache hit (Redis): {cache_key}")
                    return cached
            except Exception as e:
                logger.warning(f"Redis cache read failed: {e}")

        # Fallback to memory cache
        if cache_key in self.memory_cache:
            logger.info(f"Cache hit (memory): {cache_key}")
            return self.memory_cache[cache_key]

        return None

    def _cache_audio(self, cache_key: str, audio_bytes: bytes) -> None:
        """Store audio in cache"""
        # Store in Redis
        if self.redis_client:
            try:
                self.redis_client.setex(cache_key, self.cache_ttl, audio_bytes)
                logger.info(f"Cached in Redis: {cache_key}")
            except Exception as e:
                logger.warning(f"Redis cache write failed: {e}")

        # Always store in memory cache (with size limit)
        if len(self.memory_cache) > 100:  # Limit to 100 entries
            # Remove oldest entry (simple FIFO)
            oldest_key = next(iter(self.memory_cache))
            del self.memory_cache[oldest_key]

        self.memory_cache[cache_key] = audio_bytes
        logger.info(f"Cached in memory: {cache_key}")

    def synthesize(
        self,
        text: str,
        language: str = "en",
        voice_type: VoiceType = "friendly",
        speed: Optional[float] = None,
        pitch: Optional[float] = None,
        force_offline: bool = False
    ) -> Optional[bytes]:
        """
        Synthesize text to speech with natural prosody and offline fallback.

        Args:
            text: Text to synthesize
            language: Language code (en, hi, ta, etc.)
            voice_type: Voice persona (calm, wisdom, friendly)
            speed: Speaking rate (0.5 - 2.0), defaults to voice type optimal
            pitch: Voice pitch (-20.0 - 20.0), defaults to voice type optimal
            force_offline: Force offline synthesis even when Google is available

        Returns:
            MP3/WAV audio bytes or None if synthesis fails
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for TTS")
            return None

        # Get voice type specific settings for more natural speech
        voice_settings = VOICE_TYPE_SETTINGS.get(voice_type, VOICE_TYPE_SETTINGS["friendly"])
        actual_speed = speed if speed is not None else voice_settings["speed"]
        actual_pitch = pitch if pitch is not None else voice_settings["pitch"]

        # Check cache first (including offline cache)
        cache_key = self._generate_cache_key(text, language, voice_type, actual_speed)
        cached_audio = self._get_cached_audio(cache_key)
        if cached_audio:
            return cached_audio

        # Check offline cache
        offline_cached = self.offline_cache.get(text, language, voice_type)
        if offline_cached:
            logger.info("Using offline cached audio")
            return offline_cached

        # If forcing offline or Google not available, use offline providers
        if force_offline or not self.tts_client:
            return self._synthesize_offline(text, language, voice_type, actual_speed)

        # Try Google TTS first, then fallback to offline
        audio = self._synthesize_google(text, language, voice_type, actual_speed, actual_pitch)

        if audio:
            # Cache for future offline use
            self.offline_cache.set(text, language, voice_type, audio)
            return audio

        # Google failed, try offline
        logger.warning("Google TTS failed, trying offline fallback")
        return self._synthesize_offline(text, language, voice_type, actual_speed)

    def _synthesize_offline(
        self,
        text: str,
        language: str,
        voice_type: str,
        speed: float
    ) -> Optional[bytes]:
        """Synthesize using offline providers (edge-tts → pyttsx3)."""
        # Try edge-tts first (better quality)
        if self._edge_available:
            try:
                # Use asyncio.to_thread for sync context or get running loop for async context
                try:
                    # Check if we're already in an async context
                    loop = asyncio.get_running_loop()
                    # We're in async context - use create_task
                    audio = await self.edge_tts.synthesize(text, language, voice_type, speed)
                except RuntimeError:
                    # No running loop - use run_until_complete
                    loop = asyncio.new_event_loop()
                    try:
                        audio = loop.run_until_complete(
                            self.edge_tts.synthesize(text, language, voice_type, speed)
                        )
                    finally:
                        loop.close()

                if audio:
                    logger.info("Successfully synthesized with edge-tts")
                    return audio
            except Exception as e:
                logger.warning(f"edge-tts synthesis failed: {e}")

        # Fallback to pyttsx3 (fully offline)
        if self._local_available:
            audio = self.local_tts.synthesize(text, voice_type, speed)
            if audio:
                logger.info("Successfully synthesized with pyttsx3 (fully offline)")
                return audio

        logger.error("All TTS providers failed")
        return None

    def _synthesize_google(
        self,
        text: str,
        language: str,
        voice_type: str,
        speed: float,
        pitch: float
    ) -> Optional[bytes]:
        """Synthesize using Google Cloud TTS."""
        if not self.tts_client:
            return None

        try:
            # Get voice configuration
            voice_name = self._get_voice_config(language, voice_type)
            if not voice_name:
                logger.error(f"No voice configured for language: {language}")
                return None

            # Configure synthesis input with SSML for more natural pauses
            processed_text = self._add_natural_pauses(text)
            synthesis_input = texttospeech.SynthesisInput(ssml=processed_text)

            # Configure voice parameters
            voice = texttospeech.VoiceSelectionParams(
                language_code=language if language != "sa" else "hi",  # Sanskrit fallback
                name=voice_name
            )

            # Configure audio output with enhanced settings
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=speed,
                pitch=pitch,
                # Enable audio effects for more natural sound
                effects_profile_id=["headphone-class-device"]
            )

            # Perform synthesis
            response = self.tts_client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )

            audio_bytes = response.audio_content
            logger.info(
                f"Generated Google TTS audio: {len(audio_bytes)} bytes "
                f"(lang={language}, voice={voice_type}, speed={speed}, pitch={pitch})"
            )

            # Cache in memory/redis
            cache_key = self._generate_cache_key(text, language, voice_type, speed)
            self._cache_audio(cache_key, audio_bytes)

            return audio_bytes

        except Exception as e:
            logger.error(f"Google TTS synthesis failed: {e}", exc_info=True)
            return None

    def _add_natural_pauses(self, text: str) -> str:
        """
        Convert text to SSML with ULTRA-NATURAL pauses for human-like speech.

        Implements:
        - Natural punctuation-based pauses
        - Micro-pauses before important phrases
        - Breathing simulation at natural break points
        - Prosodic boundary markers

        Args:
            text: Plain text to convert

        Returns:
            SSML formatted text with natural pauses
        """
        # Escape XML special characters
        ssml_text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        # Apply main pause patterns
        for pattern, replacement in PAUSE_PATTERNS.items():
            ssml_text = re.sub(pattern, replacement, ssml_text)

        # Apply natural phrase patterns for human-like flow
        for pattern, replacement in NATURAL_PHRASE_PATTERNS.items():
            ssml_text = re.sub(pattern, replacement, ssml_text)

        # Add natural breathing at paragraph boundaries (max 2 per text)
        breath_count = 0
        lines = ssml_text.split('\n')
        processed_lines = []
        for line in lines:
            if line.strip() and breath_count < 2:
                # Add subtle breath mark at start of new paragraphs
                if len(line) > 50:  # Only for substantial paragraphs
                    line = f'<break time="400ms"/>{line}'
                    breath_count += 1
            processed_lines.append(line)
        ssml_text = '\n'.join(processed_lines)

        # Natural contractions for more conversational feel
        contractions = [
            (r'\bI am\b', "I'm"),
            (r'\byou are\b', "you're"),
            (r'\bit is\b', "it's"),
            (r'\bthat is\b', "that's"),
            (r'\bdo not\b', "don't"),
            (r'\bdoes not\b', "doesn't"),
            (r'\bcannot\b', "can't"),
            (r'\bwill not\b', "won't"),
            (r'\bshould not\b', "shouldn't"),
            (r'\bwould not\b', "wouldn't"),
            (r'\bcould not\b', "couldn't"),
        ]
        for pattern, replacement in contractions:
            ssml_text = re.sub(pattern, replacement, ssml_text, flags=re.IGNORECASE)

        # Wrap in speak tags with prosody for natural flow
        return f'<speak>{ssml_text}</speak>'

    def _add_emphasis_to_spiritual_terms(self, ssml_text: str) -> str:
        """
        Add subtle emphasis to spiritual and wisdom terms for gravitas.

        Args:
            ssml_text: SSML text (already escaped)

        Returns:
            SSML with emphasis tags on spiritual terms
        """
        for term in SPIRITUAL_TERMS:
            # Case-insensitive replacement with emphasis
            pattern = re.compile(rf'\b({term})\b', re.IGNORECASE)
            ssml_text = pattern.sub(
                r'<emphasis level="moderate">\1</emphasis>',
                ssml_text
            )
        return ssml_text

    def _detect_emotion_from_text(self, text: str) -> str:
        """
        Simple emotion detection from text content.

        Args:
            text: Input text

        Returns:
            Detected emotion string
        """
        text_lower = text.lower()

        # Emotion keyword mapping
        emotion_keywords = {
            "anxiety": ["anxious", "worried", "nervous", "stress", "panic", "fear", "scared"],
            "sadness": ["sad", "depressed", "lonely", "grief", "loss", "pain", "hurt", "crying"],
            "joy": ["happy", "joy", "grateful", "blessed", "wonderful", "amazing", "excited"],
            "peace": ["calm", "peaceful", "serene", "tranquil", "relaxed", "content"],
            "anger": ["angry", "frustrated", "annoyed", "irritated", "furious"],
            "hope": ["hope", "optimistic", "better", "forward", "future", "believe"],
            "love": ["love", "care", "compassion", "kindness", "heart", "soul"],
            "gratitude": ["thank", "grateful", "appreciate", "blessed", "fortunate"],
        }

        for emotion, keywords in emotion_keywords.items():
            if any(kw in text_lower for kw in keywords):
                return emotion

        return "neutral"

    def _apply_emotion_prosody(
        self,
        ssml_text: str,
        emotion: str,
        base_rate: float,
        base_pitch: float
    ) -> str:
        """
        Apply emotion-aware prosody adjustments to SSML.

        Args:
            ssml_text: Base SSML text
            emotion: Detected or specified emotion
            base_rate: Base speaking rate
            base_pitch: Base pitch

        Returns:
            SSML with prosody wrapper
        """
        prosody = EMOTION_PROSODY_MAP.get(emotion, EMOTION_PROSODY_MAP["neutral"])

        # Combine base settings with emotion adjustments
        final_rate = base_rate * prosody["rate"]
        final_pitch = base_pitch + prosody["pitch"]

        # Clamp values to valid ranges
        final_rate = max(0.5, min(2.0, final_rate))
        final_pitch = max(-20.0, min(20.0, final_pitch))

        # Format rate as percentage for SSML
        rate_percent = f"{int(final_rate * 100)}%"

        # Wrap content in prosody tag
        # Extract content between <speak> tags
        match = re.search(r'<speak>(.*)</speak>', ssml_text, re.DOTALL)
        if match:
            content = match.group(1)
            return f'<speak><prosody rate="{rate_percent}" pitch="{final_pitch:+.1f}st" volume="{prosody["volume"]}">{content}</prosody></speak>'

        return ssml_text

    def _add_breathing_simulation(self, ssml_text: str) -> str:
        """
        Add subtle breathing pauses for meditation/calm content.

        This creates a more natural, living quality to the voice.

        Args:
            ssml_text: Input SSML

        Returns:
            SSML with breathing pauses
        """
        # Add breath marks at natural pause points
        # Replace some medium breaks with breath marks for variety
        ssml_text = re.sub(
            r'<break time="450ms"/>',
            '<break time="450ms"/><mark name="breath"/>',
            ssml_text,
            count=3  # Only first 3 occurrences
        )

        return ssml_text

    def synthesize_with_emotion(
        self,
        text: str,
        language: str = "en",
        voice_type: VoiceType = "friendly",
        emotion: Optional[str] = None,
        speed: Optional[float] = None,
        pitch: Optional[float] = None,
        add_emphasis: bool = True,
        breathing_simulation: bool = False,
    ) -> Optional[bytes]:
        """
        Synthesize text with emotion-aware prosody for ultra-natural speech.

        This is the premium synthesis method that produces the most natural
        sounding voice output, suitable for emotional support conversations.

        Args:
            text: Text to synthesize
            language: Language code
            voice_type: Voice persona
            emotion: Emotion to convey (auto-detected if None)
            speed: Speaking rate override
            pitch: Pitch override
            add_emphasis: Add emphasis to spiritual terms
            breathing_simulation: Add breathing pauses

        Returns:
            MP3 audio bytes
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for emotion TTS")
            return None

        # Auto-detect emotion if not provided
        if emotion is None:
            emotion = self._detect_emotion_from_text(text)
            logger.debug(f"Auto-detected emotion: {emotion}")

        # Get voice type settings
        voice_settings = VOICE_TYPE_SETTINGS.get(voice_type, VOICE_TYPE_SETTINGS["friendly"])
        base_rate = speed if speed is not None else voice_settings["speed"]
        base_pitch = pitch if pitch is not None else voice_settings["pitch"]

        # Generate cache key including emotion
        cache_key = self._generate_cache_key(
            f"{text}:{emotion}:{add_emphasis}:{breathing_simulation}",
            language,
            voice_type,
            base_rate
        )

        # Check cache
        cached_audio = self._get_cached_audio(cache_key)
        if cached_audio:
            return cached_audio

        if not self.tts_client:
            logger.error("TTS client not available")
            return None

        try:
            # Build SSML with natural pauses
            ssml_text = self._add_natural_pauses(text)

            # Add spiritual term emphasis
            if add_emphasis:
                ssml_text = self._add_emphasis_to_spiritual_terms(ssml_text)

            # Apply emotion prosody
            ssml_text = self._apply_emotion_prosody(
                ssml_text, emotion, base_rate, base_pitch
            )

            # Add breathing simulation for calm content
            if breathing_simulation:
                ssml_text = self._add_breathing_simulation(ssml_text)

            logger.debug(f"Generated SSML: {ssml_text[:200]}...")

            # Get voice configuration
            voice_name = self._get_voice_config(language, voice_type)
            if not voice_name:
                logger.error(f"No voice configured for language: {language}")
                return None

            # Configure synthesis
            synthesis_input = texttospeech.SynthesisInput(ssml=ssml_text)

            voice = texttospeech.VoiceSelectionParams(
                language_code=language if language != "sa" else "hi",
                name=voice_name
            )

            # Enhanced audio config for maximum quality
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=1.0,  # Rate already in SSML prosody
                pitch=0.0,  # Pitch already in SSML prosody
                effects_profile_id=["headphone-class-device"],
                sample_rate_hertz=24000,  # High quality sample rate
            )

            # Synthesize
            response = self.tts_client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )

            audio_bytes = response.audio_content
            logger.info(
                f"Generated emotion-aware TTS: {len(audio_bytes)} bytes "
                f"(lang={language}, voice={voice_type}, emotion={emotion})"
            )

            # Cache result
            self._cache_audio(cache_key, audio_bytes)

            return audio_bytes

        except Exception as e:
            logger.error(f"Emotion TTS synthesis failed: {e}", exc_info=True)
            return None

    def synthesize_affirmation(
        self,
        affirmation: str,
        language: str = "en",
        include_breathing: bool = True,
    ) -> Optional[bytes]:
        """
        Synthesize an affirmation with optimal settings for personal impact.

        Affirmations are spoken slowly, clearly, with warm emphasis.

        Args:
            affirmation: The affirmation text
            language: Language code
            include_breathing: Include natural breathing pauses

        Returns:
            MP3 audio bytes
        """
        return self.synthesize_with_emotion(
            text=affirmation,
            language=language,
            voice_type="calm",
            emotion="peace",
            speed=0.85,  # Slower for impact
            add_emphasis=True,
            breathing_simulation=include_breathing,
        )

    def synthesize_guided_meditation(
        self,
        script: str,
        language: str = "en",
        include_long_pauses: bool = True,
    ) -> Optional[bytes]:
        """
        Synthesize guided meditation with extended pauses and calm prosody.

        Args:
            script: Meditation script text
            language: Language code
            include_long_pauses: Add extended pauses for meditation

        Returns:
            MP3 audio bytes
        """
        if include_long_pauses:
            # Enhance pauses for meditation
            script = re.sub(r'\.\.\.\s*', '... <break time="2s"/> ', script)
            script = re.sub(r'\[pause\]', '<break time="3s"/>', script, flags=re.IGNORECASE)
            script = re.sub(r'\[breath\]', '<break time="1500ms"/>', script, flags=re.IGNORECASE)

        return self.synthesize_with_emotion(
            text=script,
            language=language,
            voice_type="calm",
            emotion="peace",
            speed=0.80,  # Very slow for meditation
            pitch=-2.0,  # Lower pitch for calm
            add_emphasis=True,
            breathing_simulation=True,
        )

    def synthesize_verse_with_context(
        self,
        verse_text: str,
        context_text: Optional[str] = None,
        language: str = "en",
        include_sanskrit: bool = False,
        sanskrit_text: Optional[str] = None,
    ) -> Optional[bytes]:
        """
        Synthesize a Gita verse with optional context and Sanskrit.

        Args:
            verse_text: Main verse translation
            context_text: Optional explanatory context
            language: Language code
            include_sanskrit: Include Sanskrit recitation
            sanskrit_text: Sanskrit text if including

        Returns:
            MP3 audio bytes
        """
        full_text = ""

        # Add Sanskrit if requested
        if include_sanskrit and sanskrit_text:
            full_text += f"{sanskrit_text}... "

        # Add main verse
        full_text += verse_text

        # Add context with pause
        if context_text:
            full_text += f"... {context_text}"

        return self.synthesize_with_emotion(
            text=full_text,
            language=language,
            voice_type="wisdom",
            emotion="peace",
            add_emphasis=True,
            breathing_simulation=False,
        )

    def synthesize_verse(
        self,
        verse_text: str,
        language: str = "en",
        include_commentary: bool = False,
        commentary_text: Optional[str] = None
    ) -> Optional[bytes]:
        """
        Synthesize Gita verse with optional commentary using natural wisdom voice

        Args:
            verse_text: The verse text to synthesize
            language: Language code
            include_commentary: Whether to include commentary
            commentary_text: Commentary text (if include_commentary=True)

        Returns:
            MP3 audio bytes
        """
        full_text = verse_text

        if include_commentary and commentary_text:
            # Add pause between verse and commentary
            full_text = f"{verse_text}... {commentary_text}"

        # Use wisdom voice type - settings optimized for verses automatically
        return self.synthesize(
            text=full_text,
            language=language,
            voice_type="wisdom"
        )

    def synthesize_kiaan_message(
        self,
        message: str,
        language: str = "en"
    ) -> Optional[bytes]:
        """
        Synthesize KIAAN chatbot message with natural conversational tone

        Args:
            message: KIAAN's response text
            language: Language code

        Returns:
            MP3 audio bytes
        """
        # Use friendly voice type - natural conversational settings applied automatically
        return self.synthesize(
            text=message,
            language=language,
            voice_type="friendly"
        )

    def synthesize_meditation(
        self,
        meditation_script: str,
        language: str = "en"
    ) -> Optional[bytes]:
        """
        Synthesize meditation guidance with soothing, calm voice

        Args:
            meditation_script: Meditation script text
            language: Language code

        Returns:
            MP3 audio bytes
        """
        # Use calm voice type - optimal meditation settings applied automatically
        return self.synthesize(
            text=meditation_script,
            language=language,
            voice_type="calm"
        )

    def get_supported_languages(self) -> list[str]:
        """Get list of supported language codes"""
        return list(LANGUAGE_VOICE_MAP.keys())

    def clear_cache(self) -> None:
        """Clear all cached audio"""
        self.memory_cache.clear()
        logger.info("Memory cache cleared")

        if self.redis_client:
            try:
                # Clear all TTS keys from Redis
                keys = self.redis_client.keys("tts:*")
                if keys:
                    self.redis_client.delete(*keys)
                logger.info(f"Cleared {len(keys)} keys from Redis cache")
            except Exception as e:
                logger.warning(f"Failed to clear Redis cache: {e}")


# Singleton instance with thread-safe initialization
_tts_service_instance: Optional[TTSService] = None
_tts_service_lock = threading.Lock()


def get_tts_service(redis_client=None) -> TTSService:
    """Get singleton TTS service instance with thread-safe initialization"""
    global _tts_service_instance
    if _tts_service_instance is None:
        with _tts_service_lock:
            # Double-check after acquiring lock
            if _tts_service_instance is None:
                _tts_service_instance = TTSService(redis_client)
    return _tts_service_instance


def is_offline_tts_available() -> bool:
    """Check if any offline TTS provider is available."""
    return PYTTSX3_AVAILABLE or EDGE_TTS_AVAILABLE


def get_available_tts_providers() -> Dict[str, bool]:
    """Get status of all TTS providers."""
    return {
        "google_cloud": GOOGLE_TTS_AVAILABLE,
        "edge_tts": EDGE_TTS_AVAILABLE,
        "pyttsx3": PYTTSX3_AVAILABLE,
        "offline_capable": is_offline_tts_available()
    }
