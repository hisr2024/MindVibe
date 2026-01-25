"""
OpenAI-Compatible Provider Implementation.

Supports any provider with an OpenAI-compatible API:
- Azure OpenAI
- Local LLM servers (llama.cpp, vLLM, etc.)
- Other cloud providers with OpenAI-compatible endpoints
"""

import json
import logging
import os
import re
import time
from datetime import datetime

import httpx

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


class OpenAICompatibleProvider(AIProvider):
    """
    Generic OpenAI-compatible provider.

    Connects to any service implementing the OpenAI chat completions API.
    Useful for self-hosted models or alternative cloud providers.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
        provider_name: str = "oai_compat",
    ):
        """
        Initialize OpenAI-compatible provider.

        Args:
            api_key: API key (falls back to OAI_COMPAT_API_KEY env var)
            model: Model to use (falls back to OAI_COMPAT_MODEL env var)
            base_url: Base URL (falls back to OAI_COMPAT_BASE_URL env var)
            provider_name: Custom name for this provider instance
        """
        self._api_key = api_key or os.getenv("OAI_COMPAT_API_KEY", "")
        self._model = model or os.getenv("OAI_COMPAT_MODEL", "default")
        self._base_url = base_url or os.getenv("OAI_COMPAT_BASE_URL", "")
        self._provider_name = provider_name

        # Build headers
        headers = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"

        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            timeout=httpx.Timeout(60.0, connect=10.0),
            headers=headers,
        )

    @property
    def name(self) -> str:
        return self._provider_name

    @property
    def model(self) -> str:
        return self._model

    @property
    def is_configured(self) -> bool:
        return bool(self._base_url)

    def supports_json_mode(self) -> bool:
        # Assume compatible providers may support JSON mode
        return True

    def get_display_name(self) -> str:
        return f"OpenAI Compatible ({self._model})"

    async def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 500,
        response_format: dict[str, str] | None = None,
    ) -> ProviderResponse:
        """Generate chat completion using OpenAI-compatible API."""
        if not self.is_configured:
            raise AIProviderError(
                "OpenAI-compatible provider not configured (missing OAI_COMPAT_BASE_URL)",
                provider=self.name,
                retryable=False,
            )

        start_time = time.time()

        # Build request
        payload: dict = {
            "model": self._model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        # Try to add response format if requested
        if response_format and response_format.get("type") == "json_object":
            payload["response_format"] = {"type": "json_object"}

        try:
            # Use /v1/chat/completions if base_url doesn't include path
            endpoint = "/v1/chat/completions"
            if "/chat/completions" in self._base_url:
                endpoint = ""

            response = await self._client.post(endpoint, json=payload)

            latency_ms = int((time.time() - start_time) * 1000)

            # Handle errors
            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After")
                raise RateLimitError(
                    "Rate limit exceeded",
                    self.name,
                    int(retry_after) if retry_after else None,
                )

            if response.status_code == 401:
                raise AuthenticationError("Authentication failed", self.name)

            if response.status_code >= 500:
                raise AIProviderError(
                    f"Server error: {response.status_code}",
                    provider=self.name,
                    retryable=True,
                    status_code=response.status_code,
                )

            if response.status_code != 200:
                error_text = response.text[:500]  # Limit error text
                raise AIProviderError(
                    f"Error {response.status_code}: {error_text}",
                    provider=self.name,
                    retryable=False,
                    status_code=response.status_code,
                )

            # Parse response
            data = response.json()

            # Extract content
            choices = data.get("choices", [])
            if not choices:
                raise InvalidResponseError("No choices in response", self.name)

            content = choices[0].get("message", {}).get("content", "")
            if not content:
                raise InvalidResponseError("Empty content in response", self.name)

            # If JSON was requested but response_format wasn't supported, try extraction
            if response_format and response_format.get("type") == "json_object":
                content = self._extract_json(content)

            # Get token usage if available
            usage = data.get("usage", {})
            prompt_tokens = usage.get("prompt_tokens", 0)
            completion_tokens = usage.get("completion_tokens", 0)

            return ProviderResponse(
                content=content,
                provider=self.name,
                model=self._model,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=prompt_tokens + completion_tokens,
                latency_ms=latency_ms,
                metadata={
                    "finish_reason": choices[0].get("finish_reason"),
                    "base_url": self._base_url,
                },
            )

        except httpx.TimeoutException:
            raise TimeoutError("Request timed out", self.name)

        except (RateLimitError, AuthenticationError, AIProviderError):
            raise

        except Exception as e:
            logger.error(f"OpenAI-compat unexpected error: {type(e).__name__}: {e}")
            raise AIProviderError(
                str(e),
                provider=self.name,
                retryable=True,
            )

    def _extract_json(self, content: str) -> str:
        """Extract JSON from response content."""
        try:
            json.loads(content)
            return content
        except json.JSONDecodeError:
            pass

        # Try to find JSON in markdown or raw text
        patterns = [
            r"```json\s*([\s\S]*?)\s*```",
            r"```\s*([\s\S]*?)\s*```",
            r"\{[\s\S]*\}",
        ]

        for pattern in patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                try:
                    json.loads(match)
                    return match
                except json.JSONDecodeError:
                    continue

        return content

    async def health_check(self) -> HealthCheckResult:
        """Check provider health."""
        if not self.is_configured:
            return HealthCheckResult(
                status=ProviderStatus.UNHEALTHY,
                error="Provider not configured",
            )

        start_time = time.time()

        try:
            # Use /v1/chat/completions if base_url doesn't include path
            endpoint = "/v1/chat/completions"
            if "/chat/completions" in self._base_url:
                endpoint = ""

            response = await self._client.post(
                endpoint,
                json={
                    "model": self._model,
                    "messages": [{"role": "user", "content": "Hi"}],
                    "max_tokens": 5,
                },
            )

            latency_ms = int((time.time() - start_time) * 1000)

            if response.status_code == 200:
                return HealthCheckResult(
                    status=ProviderStatus.HEALTHY,
                    latency_ms=latency_ms,
                )
            else:
                return HealthCheckResult(
                    status=ProviderStatus.UNHEALTHY,
                    latency_ms=latency_ms,
                    error=f"Status {response.status_code}",
                )

        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            return HealthCheckResult(
                status=ProviderStatus.UNHEALTHY,
                latency_ms=latency_ms,
                error=str(e),
            )

    async def close(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()
