"""
KIAAN Voice Continuous Learning Engine

State-of-the-art voice AI that learns and evolves infinitely.
"""

from .continuous_learning_engine import (
    ContinuousLearningEngine,
    ContinuousLearningConfig,
    InfiniteScenarioGenerator,
    ActiveLearningEngine,
    FederatedLearningEngine,
    NeuralArchitectureSearch,
    Scenario,
    ScenarioType,
    NaturalVoice,
    VoicePersonality,
    NATURAL_VOICES,
)

from .audio_synthesizer import (
    AudioSynthesizer,
    AudioAugmenter,
    EdgeTTSEngine,
)

__all__ = [
    "ContinuousLearningEngine",
    "ContinuousLearningConfig",
    "InfiniteScenarioGenerator",
    "ActiveLearningEngine",
    "FederatedLearningEngine",
    "NeuralArchitectureSearch",
    "AudioSynthesizer",
    "AudioAugmenter",
    "EdgeTTSEngine",
    "Scenario",
    "ScenarioType",
    "NaturalVoice",
    "VoicePersonality",
    "NATURAL_VOICES",
]

__version__ = "2.0.0"
