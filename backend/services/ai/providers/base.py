"""
Base AI Provider Interface.

Defines the abstract interface that all AI providers must implement.
"""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class ProviderStatus(str, Enum):
    """Health status of a provider."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


class AIProviderError(Exception):
    """Base exception for AI provider errors."""

    def __init__(
        self,
        message: str,
        provider: str,
        retryable: bool = False,
        status_code: int | None = None,
    ):
        super().__init__(message)
        self.provider = provider
        self.retryable = retryable
        self.status_code = status_code


class RateLimitError(AIProviderError):
    """Rate limit exceeded."""

    def __init__(self, message: str, provider: str, retry_after: int | None = None):
        super().__init__(message, provider, retryable=True, status_code=429)
        self.retry_after = retry_after


class AuthenticationError(AIProviderError):
    """Authentication failed."""

    def __init__(self, message: str, provider: str):
        super().__init__(message, provider, retryable=False, status_code=401)


class TimeoutError(AIProviderError):
    """Request timed out."""

    def __init__(self, message: str, provider: str):
        super().__init__(message, provider, retryable=True, status_code=408)


class InvalidResponseError(AIProviderError):
    """Invalid response from provider."""

    def __init__(self, message: str, provider: str):
        super().__init__(message, provider, retryable=True, status_code=500)


@dataclass
class ProviderResponse:
    """Response from an AI provider."""
    content: str
    provider: str
    model: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    latency_ms: int = 0
    cached: bool = False
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class HealthCheckResult:
    """Result of a provider health check."""
    status: ProviderStatus
    latency_ms: int | None = None
    error: str | None = None
    timestamp: datetime = field(default_factory=datetime.utcnow)


class AIProvider(ABC):
    """
    Abstract base class for AI providers.

    All providers must implement:
    - chat(): Generate a response from messages
    - health_check(): Check provider health
    - name: Provider identifier
    - model: Default model to use
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique identifier for this provider."""
        pass

    @property
    @abstractmethod
    def model(self) -> str:
        """Default model used by this provider."""
        pass

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        """Check if this provider is properly configured (has API keys, etc.)."""
        pass

    @abstractmethod
    async def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 500,
        response_format: dict[str, str] | None = None,
    ) -> ProviderResponse:
        """
        Generate a chat completion.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens in response
            response_format: Optional format specification (e.g., {"type": "json_object"})

        Returns:
            ProviderResponse with generated content

        Raises:
            AIProviderError: On any provider error
        """
        pass

    @abstractmethod
    async def health_check(self) -> HealthCheckResult:
        """
        Check if the provider is healthy.

        Returns:
            HealthCheckResult with status and latency
        """
        pass

    def supports_json_mode(self) -> bool:
        """Check if this provider supports JSON response format."""
        return False

    def get_display_name(self) -> str:
        """Get human-readable name for this provider."""
        return self.name.title()

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} name={self.name} model={self.model}>"
