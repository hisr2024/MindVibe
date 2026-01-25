"""
AI Services - Multi-provider LLM support for MindVibe.

This package provides:
- Multi-provider support (OpenAI, Sarvam AI, OpenAI-compatible)
- Automatic fallback on failures
- Provider health monitoring
- Usage tracking
"""

from .providers import (
    AIProvider,
    AIProviderError,
    ProviderResponse,
    OpenAIProvider,
    SarvamProvider,
    OpenAICompatibleProvider,
    ProviderManager,
    get_provider_manager,
)

__all__ = [
    "AIProvider",
    "AIProviderError",
    "ProviderResponse",
    "OpenAIProvider",
    "SarvamProvider",
    "OpenAICompatibleProvider",
    "ProviderManager",
    "get_provider_manager",
]
