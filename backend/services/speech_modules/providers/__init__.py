"""
World-Class Speech Providers

Individual provider implementations for the finest open source
speech technologies from around the world.

Each provider is optimized for specific use cases:
- Coqui XTTS: Multi-lingual TTS with voice cloning capability
- Silero: Fast, efficient TTS for real-time applications
- StyleTTS2: Expressive, emotion-rich synthesis
- Bark: Creative generative audio with natural sounds
- Piper: Lightweight, fast local neural TTS
- Whisper: State-of-the-art speech recognition
- Vosk: Offline speech recognition
- eSpeak: Ultra-lightweight fallback
- Festival: Classic academic TTS

"Each voice is a unique instrument in the orchestra of divine expression."
"""

from .base import BaseSpeechProvider, BaseTTSProvider, BaseSTTProvider
from .coqui_xtts import CoquiXTTSProvider
from .silero import SileroProvider
from .whisper import WhisperProvider
from .bark import BarkProvider
from .piper import PiperProvider
from .style_tts2 import StyleTTS2Provider
from .vosk import VoskProvider
from .espeak import EspeakProvider
from .festival import FestivalProvider

__all__ = [
    "BaseSpeechProvider",
    "BaseTTSProvider",
    "BaseSTTProvider",
    "CoquiXTTSProvider",
    "SileroProvider",
    "WhisperProvider",
    "BarkProvider",
    "PiperProvider",
    "StyleTTS2Provider",
    "VoskProvider",
    "EspeakProvider",
    "FestivalProvider",
]
