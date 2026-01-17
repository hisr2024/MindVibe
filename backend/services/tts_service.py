"""
MindVibe Text-to-Speech Service

Provides multilingual voice synthesis for Gita verses, KIAAN responses,
and meditation guidance across 17 languages with caching for performance.

Quantum Coherence: Voice brings ancient wisdom to life, creating resonance
between text and sound, making teachings accessible to all learning modalities.
"""

import hashlib
import logging
from typing import Optional, Literal, Dict
from io import BytesIO
import os

# Google Cloud TTS (primary provider)
try:
    from google.cloud import texttospeech
    GOOGLE_TTS_AVAILABLE = True
except ImportError:
    GOOGLE_TTS_AVAILABLE = False

logger = logging.getLogger(__name__)

VoiceType = Literal["calm", "wisdom", "friendly"]
VoiceGender = Literal["male", "female", "neutral"]


# Language to Google TTS voice mapping
LANGUAGE_VOICE_MAP: Dict[str, Dict[str, str]] = {
    "en": {
        "calm": "en-US-Neural2-C",  # Female, soothing
        "wisdom": "en-US-Neural2-D",  # Male, authoritative
        "friendly": "en-US-Neural2-A",  # Female, warm
    },
    "hi": {  # Hindi
        "calm": "hi-IN-Neural2-A",
        "wisdom": "hi-IN-Neural2-B",
        "friendly": "hi-IN-Neural2-C",
    },
    "ta": {  # Tamil
        "calm": "ta-IN-Standard-A",
        "wisdom": "ta-IN-Standard-B",
        "friendly": "ta-IN-Standard-A",
    },
    "te": {  # Telugu
        "calm": "te-IN-Standard-A",
        "wisdom": "te-IN-Standard-B",
        "friendly": "te-IN-Standard-A",
    },
    "bn": {  # Bengali
        "calm": "bn-IN-Standard-A",
        "wisdom": "bn-IN-Standard-B",
        "friendly": "bn-IN-Standard-A",
    },
    "mr": {  # Marathi
        "calm": "mr-IN-Standard-A",
        "wisdom": "mr-IN-Standard-B",
        "friendly": "mr-IN-Standard-A",
    },
    "gu": {  # Gujarati
        "calm": "gu-IN-Standard-A",
        "wisdom": "gu-IN-Standard-B",
        "friendly": "gu-IN-Standard-A",
    },
    "kn": {  # Kannada
        "calm": "kn-IN-Standard-A",
        "wisdom": "kn-IN-Standard-B",
        "friendly": "kn-IN-Standard-A",
    },
    "ml": {  # Malayalam
        "calm": "ml-IN-Standard-A",
        "wisdom": "ml-IN-Standard-B",
        "friendly": "ml-IN-Standard-A",
    },
    "pa": {  # Punjabi
        "calm": "pa-IN-Standard-A",
        "wisdom": "pa-IN-Standard-B",
        "friendly": "pa-IN-Standard-A",
    },
    "sa": {  # Sanskrit (use Hindi as fallback)
        "calm": "hi-IN-Neural2-A",
        "wisdom": "hi-IN-Neural2-B",
        "friendly": "hi-IN-Neural2-C",
    },
    "es": {  # Spanish
        "calm": "es-US-Neural2-A",
        "wisdom": "es-US-Neural2-B",
        "friendly": "es-US-Neural2-A",
    },
    "fr": {  # French
        "calm": "fr-FR-Neural2-A",
        "wisdom": "fr-FR-Neural2-B",
        "friendly": "fr-FR-Neural2-C",
    },
    "de": {  # German
        "calm": "de-DE-Neural2-A",
        "wisdom": "de-DE-Neural2-B",
        "friendly": "de-DE-Neural2-C",
    },
    "pt": {  # Portuguese
        "calm": "pt-BR-Neural2-A",
        "wisdom": "pt-BR-Neural2-B",
        "friendly": "pt-BR-Neural2-C",
    },
    "ja": {  # Japanese
        "calm": "ja-JP-Neural2-B",
        "wisdom": "ja-JP-Neural2-C",
        "friendly": "ja-JP-Neural2-D",
    },
    "zh": {  # Chinese
        "calm": "cmn-CN-Standard-A",
        "wisdom": "cmn-CN-Standard-B",
        "friendly": "cmn-CN-Standard-C",
    },
}


class TTSService:
    """Text-to-Speech service with Google Cloud TTS and caching"""

    def __init__(self, redis_client=None):
        """
        Initialize TTS service

        Args:
            redis_client: Optional Redis client for caching
        """
        self.redis_client = redis_client
        self.memory_cache: Dict[str, bytes] = {}  # Fallback cache
        self.cache_ttl = 604800  # 1 week in seconds

        # Initialize Google TTS client
        if GOOGLE_TTS_AVAILABLE:
            try:
                self.tts_client = texttospeech.TextToSpeechClient()
                logger.info("Google Cloud TTS initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Google TTS: {e}")
                self.tts_client = None
        else:
            logger.warning("Google Cloud TTS not available - install google-cloud-texttospeech")
            self.tts_client = None

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
        speed: float = 0.9,
        pitch: float = 0.0
    ) -> Optional[bytes]:
        """
        Synthesize text to speech

        Args:
            text: Text to synthesize
            language: Language code (en, hi, ta, etc.)
            voice_type: Voice persona (calm, wisdom, friendly)
            speed: Speaking rate (0.5 - 2.0)
            pitch: Voice pitch (-20.0 - 20.0)

        Returns:
            MP3 audio bytes or None if synthesis fails
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for TTS")
            return None

        # Check cache first
        cache_key = self._generate_cache_key(text, language, voice_type, speed)
        cached_audio = self._get_cached_audio(cache_key)
        if cached_audio:
            return cached_audio

        # Generate new audio
        if not self.tts_client:
            logger.error("TTS client not available")
            return None

        try:
            # Get voice configuration
            voice_name = self._get_voice_config(language, voice_type)
            if not voice_name:
                logger.error(f"No voice configured for language: {language}")
                return None

            # Configure synthesis input
            synthesis_input = texttospeech.SynthesisInput(text=text)

            # Configure voice parameters
            voice = texttospeech.VoiceSelectionParams(
                language_code=language if language != "sa" else "hi",  # Sanskrit fallback
                name=voice_name
            )

            # Configure audio output
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=speed,
                pitch=pitch
            )

            # Perform synthesis
            response = self.tts_client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )

            audio_bytes = response.audio_content
            logger.info(
                f"Generated TTS audio: {len(audio_bytes)} bytes "
                f"(lang={language}, voice={voice_type}, speed={speed})"
            )

            # Cache the result
            self._cache_audio(cache_key, audio_bytes)

            return audio_bytes

        except Exception as e:
            logger.error(f"TTS synthesis failed: {e}", exc_info=True)
            return None

    def synthesize_verse(
        self,
        verse_text: str,
        language: str = "en",
        include_commentary: bool = False,
        commentary_text: Optional[str] = None
    ) -> Optional[bytes]:
        """
        Synthesize Gita verse with optional commentary

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

        return self.synthesize(
            text=full_text,
            language=language,
            voice_type="wisdom",  # Use wisdom persona for verses
            speed=0.85  # Slightly slower for verses
        )

    def synthesize_kiaan_message(
        self,
        message: str,
        language: str = "en"
    ) -> Optional[bytes]:
        """
        Synthesize KIAAN chatbot message

        Args:
            message: KIAAN's response text
            language: Language code

        Returns:
            MP3 audio bytes
        """
        return self.synthesize(
            text=message,
            language=language,
            voice_type="friendly",  # Warm, conversational tone
            speed=0.95  # Normal speed
        )

    def synthesize_meditation(
        self,
        meditation_script: str,
        language: str = "en"
    ) -> Optional[bytes]:
        """
        Synthesize meditation guidance

        Args:
            meditation_script: Meditation script text
            language: Language code

        Returns:
            MP3 audio bytes
        """
        return self.synthesize(
            text=meditation_script,
            language=language,
            voice_type="calm",  # Soothing, meditative tone
            speed=0.8  # Slower for meditation
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


# Singleton instance
_tts_service_instance: Optional[TTSService] = None


def get_tts_service(redis_client=None) -> TTSService:
    """Get singleton TTS service instance"""
    global _tts_service_instance
    if _tts_service_instance is None:
        _tts_service_instance = TTSService(redis_client)
    return _tts_service_instance
