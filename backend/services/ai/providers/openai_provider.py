"""
OpenAI Provider Implementation.

Wraps the existing OpenAI integration in the codebase.
Uses GPT-4o-mini by default for cost optimization.
"""

import logging
import os
import time
from datetime import datetime

from .base import (
    AIProvider,
    AIProviderError,
    AuthenticationError,
    HealthCheckResult,
    InvalidResponseError,
    ProviderResponse,
    ProviderStatus,
    RateLimitError,
    TimeoutError,
)

logger = logging.getLogger(__name__)

# Try to import OpenAI
try:
    from openai import AsyncOpenAI, APIError, RateLimitError as OpenAIRateLimitError
    from openai import AuthenticationError as OpenAIAuthError
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI library not installed")


class OpenAIProvider(AIProvider):
    """
    OpenAI provider using GPT-4o-mini by default.

    Reuses existing OpenAI configuration from the codebase.
    Supports JSON mode for structured outputs.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
    ):
        """
        Initialize OpenAI provider.

        Args:
            api_key: OpenAI API key (falls back to OPENAI_API_KEY env var)
            model: Model to use (falls back to AI_MODEL_OPENAI env var or gpt-4o-mini)
            base_url: Optional base URL override
        """
        self._api_key = api_key or os.getenv("OPENAI_API_KEY")
        self._model = model or os.getenv("AI_MODEL_OPENAI", "gpt-4o-mini")
        self._base_url = base_url

        self._client: "AsyncOpenAI | None" = None
        if OPENAI_AVAILABLE and self._api_key:
            self._client = AsyncOpenAI(
                api_key=self._api_key,
                base_url=self._base_url,
            )

    @property
    def name(self) -> str:
        return "openai"

    @property
    def model(self) -> str:
        return self._model

    @property
    def is_configured(self) -> bool:
        return OPENAI_AVAILABLE and bool(self._api_key) and self._client is not None

    def supports_json_mode(self) -> bool:
        return True

    def get_display_name(self) -> str:
        return f"OpenAI ({self._model})"

    async def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 500,
        response_format: dict[str, str] | None = None,
    ) -> ProviderResponse:
        """Generate chat completion using OpenAI."""
        if not self.is_configured:
            raise AIProviderError(
                "OpenAI provider not configured",
                provider=self.name,
                retryable=False,
            )

        start_time = time.time()

        try:
            # Build request parameters
            params: dict = {
                "model": self._model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }

            # Add JSON mode if requested and supported
            if response_format and response_format.get("type") == "json_object":
                params["response_format"] = {"type": "json_object"}

            # Make API call
            response = await self._client.chat.completions.create(**params)

            latency_ms = int((time.time() - start_time) * 1000)

            # Safe null check for OpenAI response
            content = ""
            finish_reason = None
            if response and response.choices and len(response.choices) > 0:
                choice = response.choices[0]
                if choice.message and choice.message.content:
                    content = choice.message.content
                finish_reason = choice.finish_reason

            # Get token usage
            usage = response.usage if response else None
            prompt_tokens = usage.prompt_tokens if usage else 0
            completion_tokens = usage.completion_tokens if usage else 0

            return ProviderResponse(
                content=content,
                provider=self.name,
                model=self._model,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=prompt_tokens + completion_tokens,
                latency_ms=latency_ms,
                metadata={
                    "finish_reason": finish_reason,
                    "response_id": response.id if response else None,
                },
            )

        except OpenAIRateLimitError as e:
            logger.warning(f"OpenAI rate limit: {e}")
            retry_after = None
            if hasattr(e, "response") and e.response:
                retry_after = e.response.headers.get("Retry-After")
                if retry_after:
                    retry_after = int(retry_after)
            raise RateLimitError(str(e), self.name, retry_after)

        except OpenAIAuthError as e:
            logger.error(f"OpenAI auth error: {e}")
            raise AuthenticationError(str(e), self.name)

        except APIError as e:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error(f"OpenAI API error: {e}")

            # Check if retryable
            retryable = e.status_code in (500, 502, 503, 504) if e.status_code else False
            raise AIProviderError(
                str(e),
                provider=self.name,
                retryable=retryable,
                status_code=e.status_code,
            )

        except TimeoutError as e:
            raise TimeoutError(str(e), self.name)

        except Exception as e:
            logger.error(f"OpenAI unexpected error: {type(e).__name__}: {e}")
            raise AIProviderError(
                str(e),
                provider=self.name,
                retryable=True,
            )

    async def health_check(self) -> HealthCheckResult:
        """Check OpenAI health with a minimal request."""
        if not self.is_configured:
            return HealthCheckResult(
                status=ProviderStatus.UNHEALTHY,
                error="Provider not configured",
            )

        start_time = time.time()

        try:
            # Make a minimal request to check health
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=5,
            )

            latency_ms = int((time.time() - start_time) * 1000)

            if response.choices:
                return HealthCheckResult(
                    status=ProviderStatus.HEALTHY,
                    latency_ms=latency_ms,
                )
            else:
                return HealthCheckResult(
                    status=ProviderStatus.DEGRADED,
                    latency_ms=latency_ms,
                    error="Empty response",
                )

        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            return HealthCheckResult(
                status=ProviderStatus.UNHEALTHY,
                latency_ms=latency_ms,
                error=str(e),
            )
