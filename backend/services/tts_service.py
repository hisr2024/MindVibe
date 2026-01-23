"""
MindVibe Text-to-Speech Service - Ultra-Natural Voice Processing

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

Quantum Coherence: Voice brings ancient wisdom to life, creating resonance
between text and sound, making teachings accessible to all learning modalities.
"""

import hashlib
import logging
import re
from typing import Optional, Literal, Dict, List, Tuple
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

# Emotion-to-prosody mapping for adaptive voice
EMOTION_PROSODY_MAP = {
    "joy": {"rate": 1.05, "pitch": 2.0, "volume": "medium"},
    "sadness": {"rate": 0.85, "pitch": -2.0, "volume": "soft"},
    "anxiety": {"rate": 0.80, "pitch": -1.0, "volume": "soft"},
    "peace": {"rate": 0.85, "pitch": -0.5, "volume": "soft"},
    "gratitude": {"rate": 0.95, "pitch": 1.0, "volume": "medium"},
    "anger": {"rate": 0.90, "pitch": 0.0, "volume": "medium"},
    "fear": {"rate": 0.85, "pitch": 0.5, "volume": "soft"},
    "hope": {"rate": 0.95, "pitch": 1.5, "volume": "medium"},
    "love": {"rate": 0.90, "pitch": 0.5, "volume": "soft"},
    "neutral": {"rate": 0.92, "pitch": 0.0, "volume": "medium"},
}

# Sanskrit/Hindi spiritual terms that need emphasis
SPIRITUAL_TERMS = [
    "dharma", "karma", "yoga", "atman", "brahman", "moksha", "samsara",
    "nirvana", "prana", "chakra", "mantra", "om", "namaste", "guru",
    "krishna", "arjuna", "gita", "bhagavad", "vedanta", "upanishad",
    "sanskrit", "divine", "eternal", "consciousness", "enlightenment",
    "meditation", "mindfulness", "awareness", "presence", "wisdom",
]

# Pause markers for natural speech rhythm
PAUSE_PATTERNS = {
    r'\.{3,}': '<break time="800ms"/>',  # Ellipsis - contemplative pause
    r'\.\s+': '<break time="450ms"/> ',   # Period - sentence boundary
    r'\?\s+': '<break time="400ms"/> ',   # Question - slight pause
    r'!\s+': '<break time="350ms"/> ',    # Exclamation - energetic pause
    r':\s+': '<break time="350ms"/> ',    # Colon - anticipation pause
    r';\s+': '<break time="300ms"/> ',    # Semicolon - thought continuation
    r',\s+': '<break time="200ms"/> ',    # Comma - brief pause
    r'—': '<break time="400ms"/>',        # Em-dash - dramatic pause
    r'–': '<break time="300ms"/>',        # En-dash - medium pause
}


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
        # Escape XML special characters
        ssml_text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        # Apply pause patterns in order of specificity
        for pattern, replacement in PAUSE_PATTERNS.items():
            ssml_text = re.sub(pattern, replacement, ssml_text)

        # Wrap in speak tags
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


# Singleton instance
_tts_service_instance: Optional[TTSService] = None


def get_tts_service(redis_client=None) -> TTSService:
    """Get singleton TTS service instance"""
    global _tts_service_instance
    if _tts_service_instance is None:
        _tts_service_instance = TTSService(redis_client)
    return _tts_service_instance
