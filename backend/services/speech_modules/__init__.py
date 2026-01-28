"""
World-Class Open Source Speech Modules Integration

Bringing together the finest speech technologies from around the world
to create the most divine, natural, and emotionally intelligent voice
experience for KIAAN.

Integrated Technologies:
========================
From USA:
- Whisper (OpenAI) - State-of-the-art speech recognition
- Bark (Suno AI) - Generative text-to-audio with emotions
- DeepSpeech (Mozilla) - Open source speech-to-text

From Germany:
- Coqui XTTS - Multi-lingual TTS with voice cloning
- Coqui TTS - High-quality neural TTS

From Russia:
- Silero Models - Fast, efficient TTS and STT
- Vosk - Offline speech recognition

From UK:
- Festival - University of Edinburgh TTS
- eSpeak NG - Compact multilingual synthesizer

From Japan:
- ESPnet - End-to-end speech processing toolkit

From Korea:
- StyleTTS2 - Style-based expressive TTS
- VITS - Variational Inference TTS

From France:
- Piper - Fast local neural TTS (Rhasspy project)

From China:
- PaddleSpeech - Baidu's speech toolkit
- WeNet - Production speech recognition

From India:
- Vakyansh - Indian language TTS/STT
- AI4Bharat - Indic language models

Cross-Cultural:
- MaryTTS - Multilingual articulatory TTS
- wav2vec 2.0 (Facebook) - Self-supervised speech

"The divine speaks in all languages, through all voices."
"""

from .orchestrator import (
    SpeechModuleOrchestrator,
    get_speech_orchestrator,
)

from .divine_speech_integration import (
    DivineSpeechIntegration,
    DivineSynthesisConfig,
    DivineVoiceMode,
    get_divine_speech_integration,
    synthesize_divine_voice,
)

from .providers import (
    CoquiXTTSProvider,
    SileroProvider,
    WhisperProvider,
    BarkProvider,
    PiperProvider,
    StyleTTS2Provider,
    VoskProvider,
    EspeakProvider,
    FestivalProvider,
)

from .models import (
    SpeechSynthesisRequest,
    SpeechSynthesisResult,
    SpeechRecognitionRequest,
    SpeechRecognitionResult,
    VoiceCloneRequest,
    VoiceProfile,
    EmotionalProsody,
    SpeechQualityMetrics,
)

__all__ = [
    # Orchestrator
    "SpeechModuleOrchestrator",
    "get_speech_orchestrator",

    # Divine Speech Integration
    "DivineSpeechIntegration",
    "DivineSynthesisConfig",
    "DivineVoiceMode",
    "get_divine_speech_integration",
    "synthesize_divine_voice",

    # Providers
    "CoquiXTTSProvider",
    "SileroProvider",
    "WhisperProvider",
    "BarkProvider",
    "PiperProvider",
    "StyleTTS2Provider",
    "VoskProvider",
    "EspeakProvider",
    "FestivalProvider",

    # Models
    "SpeechSynthesisRequest",
    "SpeechSynthesisResult",
    "SpeechRecognitionRequest",
    "SpeechRecognitionResult",
    "VoiceCloneRequest",
    "VoiceProfile",
    "EmotionalProsody",
    "SpeechQualityMetrics",
]
