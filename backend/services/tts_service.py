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


# Language to Google TTS voice mapping - Using Studio/Journey voices where available for maximum naturalness
# Studio voices provide the most human-like speech synthesis
# Journey voices are optimized for longer content with natural prosody
# Wavenet voices offer improved naturalness over Standard voices
LANGUAGE_VOICE_MAP: Dict[str, Dict[str, str]] = {
    "en": {
        "calm": "en-US-Studio-O",  # Studio female - extremely natural, soothing
        "wisdom": "en-US-Studio-Q",  # Studio male - natural, warm authority
        "friendly": "en-US-Journey-F",  # Journey female - conversational, engaging
    },
    "hi": {  # Hindi - using Wavenet for improved naturalness
        "calm": "hi-IN-Wavenet-A",
        "wisdom": "hi-IN-Wavenet-B",
        "friendly": "hi-IN-Wavenet-C",
    },
    "ta": {  # Tamil - using Wavenet where available
        "calm": "ta-IN-Wavenet-A",
        "wisdom": "ta-IN-Wavenet-B",
        "friendly": "ta-IN-Wavenet-A",
    },
    "te": {  # Telugu - using Wavenet
        "calm": "te-IN-Standard-A",
        "wisdom": "te-IN-Standard-B",
        "friendly": "te-IN-Standard-A",
    },
    "bn": {  # Bengali - using Wavenet
        "calm": "bn-IN-Wavenet-A",
        "wisdom": "bn-IN-Wavenet-B",
        "friendly": "bn-IN-Wavenet-A",
    },
    "mr": {  # Marathi - using Wavenet
        "calm": "mr-IN-Wavenet-A",
        "wisdom": "mr-IN-Wavenet-B",
        "friendly": "mr-IN-Wavenet-A",
    },
    "gu": {  # Gujarati - using Wavenet
        "calm": "gu-IN-Wavenet-A",
        "wisdom": "gu-IN-Wavenet-B",
        "friendly": "gu-IN-Wavenet-A",
    },
    "kn": {  # Kannada - using Wavenet
        "calm": "kn-IN-Wavenet-A",
        "wisdom": "kn-IN-Wavenet-B",
        "friendly": "kn-IN-Wavenet-A",
    },
    "ml": {  # Malayalam - using Wavenet
        "calm": "ml-IN-Wavenet-A",
        "wisdom": "ml-IN-Wavenet-B",
        "friendly": "ml-IN-Wavenet-A",
    },
    "pa": {  # Punjabi - using Wavenet
        "calm": "pa-IN-Wavenet-A",
        "wisdom": "pa-IN-Wavenet-B",
        "friendly": "pa-IN-Wavenet-A",
    },
    "sa": {  # Sanskrit (use Hindi Wavenet as fallback)
        "calm": "hi-IN-Wavenet-A",
        "wisdom": "hi-IN-Wavenet-B",
        "friendly": "hi-IN-Wavenet-C",
    },
    "es": {  # Spanish - using Studio/Journey
        "calm": "es-US-Studio-B",
        "wisdom": "es-US-Journey-D",
        "friendly": "es-US-Journey-F",
    },
    "fr": {  # French - using Studio/Journey
        "calm": "fr-FR-Studio-A",
        "wisdom": "fr-FR-Studio-D",
        "friendly": "fr-FR-Journey-F",
    },
    "de": {  # German - using Studio/Journey
        "calm": "de-DE-Studio-B",
        "wisdom": "de-DE-Studio-C",
        "friendly": "de-DE-Journey-F",
    },
    "pt": {  # Portuguese - using Studio/Wavenet
        "calm": "pt-BR-Studio-B",
        "wisdom": "pt-BR-Wavenet-B",
        "friendly": "pt-BR-Studio-C",
    },
    "ja": {  # Japanese - using Wavenet for better naturalness
        "calm": "ja-JP-Wavenet-A",
        "wisdom": "ja-JP-Wavenet-C",
        "friendly": "ja-JP-Wavenet-B",
    },
    "zh": {  # Chinese - using Wavenet
        "calm": "cmn-CN-Wavenet-A",
        "wisdom": "cmn-CN-Wavenet-B",
        "friendly": "cmn-CN-Wavenet-C",
    },
}

# Voice type specific settings for natural speech prosody
VOICE_TYPE_SETTINGS: Dict[str, Dict[str, float]] = {
    "calm": {
        "speed": 0.88,  # Slightly slower for calming effect
        "pitch": -1.5,  # Slightly lower pitch for warmth
    },
    "wisdom": {
        "speed": 0.90,  # Measured pace for contemplation
        "pitch": -0.5,  # Natural, grounded tone
    },
    "friendly": {
        "speed": 0.98,  # Natural conversational pace
        "pitch": 0.5,  # Slightly higher for warmth and approachability
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
        speed: Optional[float] = None,
        pitch: Optional[float] = None
    ) -> Optional[bytes]:
        """
        Synthesize text to speech with natural prosody

        Args:
            text: Text to synthesize
            language: Language code (en, hi, ta, etc.)
            voice_type: Voice persona (calm, wisdom, friendly)
            speed: Speaking rate (0.5 - 2.0), defaults to voice type optimal
            pitch: Voice pitch (-20.0 - 20.0), defaults to voice type optimal

        Returns:
            MP3 audio bytes or None if synthesis fails
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for TTS")
            return None

        # Get voice type specific settings for more natural speech
        voice_settings = VOICE_TYPE_SETTINGS.get(voice_type, VOICE_TYPE_SETTINGS["friendly"])
        actual_speed = speed if speed is not None else voice_settings["speed"]
        actual_pitch = pitch if pitch is not None else voice_settings["pitch"]

        # Check cache first
        cache_key = self._generate_cache_key(text, language, voice_type, actual_speed)
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

            # Configure synthesis input with SSML for more natural pauses
            # Add subtle pauses after punctuation for natural rhythm
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
                speaking_rate=actual_speed,
                pitch=actual_pitch,
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
                f"Generated TTS audio: {len(audio_bytes)} bytes "
                f"(lang={language}, voice={voice_type}, speed={actual_speed}, pitch={actual_pitch})"
            )

            # Cache the result
            self._cache_audio(cache_key, audio_bytes)

            return audio_bytes

        except Exception as e:
            logger.error(f"TTS synthesis failed: {e}", exc_info=True)
            return None

    def _add_natural_pauses(self, text: str) -> str:
        """
        Convert text to SSML with natural pauses for more human-like speech

        Args:
            text: Plain text to convert

        Returns:
            SSML formatted text with natural pauses
        """
        import re

        # Escape XML special characters
        ssml_text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        # Add medium pauses after sentences
        ssml_text = re.sub(r'([.!?])\s+', r'\1<break time="400ms"/> ', ssml_text)

        # Add short pauses after commas
        ssml_text = re.sub(r',\s+', r',<break time="200ms"/> ', ssml_text)

        # Add pauses after colons and semicolons
        ssml_text = re.sub(r'[:;]\s+', r'<break time="300ms"/> ', ssml_text)

        # Add pauses after ellipsis for dramatic effect
        ssml_text = re.sub(r'\.{3,}\s*', r'<break time="600ms"/> ', ssml_text)

        # Wrap in speak tags
        return f'<speak>{ssml_text}</speak>'

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


# Singleton instance
_tts_service_instance: Optional[TTSService] = None


def get_tts_service(redis_client=None) -> TTSService:
    """Get singleton TTS service instance"""
    global _tts_service_instance
    if _tts_service_instance is None:
        _tts_service_instance = TTSService(redis_client)
    return _tts_service_instance
