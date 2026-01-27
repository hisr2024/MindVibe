"""
AI Provider Manager - Runtime provider selection with automatic fallback.

Manages multiple AI providers and provides:
- Runtime provider selection based on configuration
- Automatic fallback on retryable failures
- Health checking and latency tracking
- Provider usage tracking for analytics
"""

import asyncio
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any

from .base import (
    AIProvider,
    AIProviderError,
    HealthCheckResult,
    ProviderResponse,
    ProviderStatus,
)
from .openai_provider import OpenAIProvider
from .sarvam_provider import SarvamProvider
from .oai_compat_provider import OpenAICompatibleProvider

logger = logging.getLogger(__name__)


class ProviderManager:
    """
    Manages AI providers with automatic fallback.

    Configuration via environment variables:
    - AI_PROVIDER: Primary provider (auto|openai|sarvam|oai_compat)
    - AI_PROVIDER_FALLBACKS: Comma-separated fallback order

    Features:
    - Auto mode picks first configured+healthy provider
    - Automatic fallback on retryable failures
    - Tracks provider used per request
    """

    def __init__(self) -> None:
        """Initialize the provider manager."""
        self._providers: dict[str, AIProvider] = {}
        self._health_cache: dict[str, HealthCheckResult] = {}
        self._health_cache_ttl = timedelta(minutes=5)

        # Get configuration from environment
        self._primary_provider = os.getenv("AI_PROVIDER", "auto")
        fallbacks_str = os.getenv("AI_PROVIDER_FALLBACKS", "openai,sarvam,oai_compat")
        self._fallback_order = [p.strip() for p in fallbacks_str.split(",") if p.strip()]

        # Initialize providers
        self._init_providers()

        logger.info(
            f"ProviderManager initialized: primary={self._primary_provider}, "
            f"fallbacks={self._fallback_order}"
        )

    def _init_providers(self) -> None:
        """Initialize all available providers."""
        # OpenAI
        openai_provider = OpenAIProvider()
        if openai_provider.is_configured:
            self._providers["openai"] = openai_provider
            logger.info("OpenAI provider configured")

        # Sarvam
        sarvam_provider = SarvamProvider()
        if sarvam_provider.is_configured:
            self._providers["sarvam"] = sarvam_provider
            logger.info("Sarvam provider configured")

        # OpenAI Compatible
        oai_compat_provider = OpenAICompatibleProvider()
        if oai_compat_provider.is_configured:
            self._providers["oai_compat"] = oai_compat_provider
            logger.info("OpenAI-compatible provider configured")

    def get_provider(self, name: str) -> AIProvider | None:
        """Get a specific provider by name."""
        return self._providers.get(name)

    def list_providers(self) -> list[str]:
        """List all configured provider names."""
        return list(self._providers.keys())

    def get_configured_providers(self) -> list[AIProvider]:
        """Get all configured providers in fallback order."""
        result = []
        for name in self._fallback_order:
            if name in self._providers:
                result.append(self._providers[name])
        return result

    async def get_health_status(self, name: str) -> HealthCheckResult:
        """Get cached health status for a provider."""
        # Check cache
        if name in self._health_cache:
            cached = self._health_cache[name]
            # Use timezone-aware datetime (utcnow() is deprecated in Python 3.12+)
            age = datetime.now(timezone.utc) - cached.timestamp
            if age < self._health_cache_ttl:
                return cached

        # Perform health check
        provider = self._providers.get(name)
        if not provider:
            return HealthCheckResult(
                status=ProviderStatus.UNKNOWN,
                error="Provider not configured",
            )

        result = await provider.health_check()
        self._health_cache[name] = result
        return result

    async def get_all_health_status(self) -> dict[str, HealthCheckResult]:
        """Get health status for all providers."""
        results = {}
        for name in self._providers:
            results[name] = await self.get_health_status(name)
        return results

    async def select_provider(
        self,
        preference: str | None = None,
    ) -> AIProvider | None:
        """
        Select the best available provider.

        Args:
            preference: User preference (auto|openai|sarvam|oai_compat)

        Returns:
            Selected provider or None if none available
        """
        # If specific preference given and available
        if preference and preference != "auto":
            provider = self._providers.get(preference)
            if provider:
                health = await self.get_health_status(preference)
                if health.status != ProviderStatus.UNHEALTHY:
                    return provider
                logger.warning(f"Preferred provider {preference} is unhealthy")

        # Auto mode: find first healthy provider in fallback order
        for name in self._fallback_order:
            if name not in self._providers:
                continue

            health = await self.get_health_status(name)
            if health.status == ProviderStatus.HEALTHY:
                return self._providers[name]

        # If no healthy providers, try any configured one
        for name in self._fallback_order:
            if name in self._providers:
                logger.warning(f"No healthy providers, using {name}")
                return self._providers[name]

        logger.error("No AI providers available")
        return None

    async def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 500,
        response_format: dict[str, str] | None = None,
        preference: str | None = None,
        max_retries: int = 2,
    ) -> ProviderResponse:
        """
        Generate chat completion with automatic fallback.

        Args:
            messages: Chat messages
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            response_format: Optional format specification
            preference: Provider preference
            max_retries: Maximum retry attempts per provider

        Returns:
            ProviderResponse with content and provider info

        Raises:
            AIProviderError: If all providers fail
        """
        preference = preference or self._primary_provider

        # Get ordered list of providers to try
        providers_to_try: list[AIProvider] = []

        # Start with preferred provider if specified
        if preference and preference != "auto":
            if preference in self._providers:
                providers_to_try.append(self._providers[preference])

        # Add fallback providers
        for name in self._fallback_order:
            if name in self._providers:
                provider = self._providers[name]
                if provider not in providers_to_try:
                    providers_to_try.append(provider)

        if not providers_to_try:
            raise AIProviderError(
                "No AI providers configured",
                provider="none",
                retryable=False,
            )

        # Try each provider with retries
        last_error: AIProviderError | None = None

        for provider in providers_to_try:
            for attempt in range(max_retries):
                try:
                    response = await provider.chat(
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        response_format=response_format,
                    )
                    return response

                except AIProviderError as e:
                    last_error = e
                    logger.warning(
                        f"Provider {provider.name} failed (attempt {attempt + 1}): {e}"
                    )

                    if not e.retryable:
                        break  # Move to next provider

                    if attempt < max_retries - 1:
                        # Wait before retry with exponential backoff
                        await asyncio.sleep(2 ** attempt)

            logger.info(f"Moving to next provider after {provider.name} failed")

        # All providers failed
        raise last_error or AIProviderError(
            "All providers failed",
            provider="all",
            retryable=False,
        )

    async def chat_with_tracking(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 500,
        response_format: dict[str, str] | None = None,
        preference: str | None = None,
    ) -> tuple[ProviderResponse, dict[str, Any]]:
        """
        Generate chat completion with usage tracking.

        Returns:
            Tuple of (response, tracking_info)
            tracking_info includes provider_used, model_used, latency_ms
        """
        response = await self.chat(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format=response_format,
            preference=preference,
        )

        tracking = {
            "provider_used": response.provider,
            "model_used": response.model,
            "latency_ms": response.latency_ms,
            "prompt_tokens": response.prompt_tokens,
            "completion_tokens": response.completion_tokens,
            "total_tokens": response.total_tokens,
        }

        return response, tracking


# Singleton instance
_manager_instance: ProviderManager | None = None


def get_provider_manager() -> ProviderManager:
    """Get the singleton ProviderManager instance."""
    global _manager_instance
    if _manager_instance is None:
        _manager_instance = ProviderManager()
    return _manager_instance


# Convenience export
provider_manager = get_provider_manager()
