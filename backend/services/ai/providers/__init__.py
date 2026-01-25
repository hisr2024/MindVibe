"""
AI Provider System - Multi-provider LLM support with automatic fallback.

Supports:
- OpenAI (GPT-4o-mini, GPT-4)
- Sarvam AI (sarvam-m)
- Generic OpenAI-compatible providers

Features:
- Runtime provider selection
- Automatic fallback on retryable failures
- Health checking with latency tracking
- Provider usage tracking per request
"""

from .base import AIProvider, AIProviderError, ProviderResponse
from .openai_provider import OpenAIProvider
from .sarvam_provider import SarvamProvider
from .oai_compat_provider import OpenAICompatibleProvider
from .provider_manager import ProviderManager, get_provider_manager

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
