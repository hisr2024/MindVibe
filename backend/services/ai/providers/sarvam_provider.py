"""
Sarvam AI Provider Implementation.

Sarvam AI is an Indian AI company providing multilingual models
with strong Hindi and other Indian language support.

API Documentation: https://docs.sarvam.ai/
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

# Default Sarvam API settings
DEFAULT_SARVAM_BASE_URL = "https://api.sarvam.ai/v1"
DEFAULT_SARVAM_MODEL = "sarvam-m"


class SarvamProvider(AIProvider):
    """
    Sarvam AI provider for multilingual support.

    Sarvam models are optimized for Indian languages and provide
    strong Hindi, Tamil, Telugu, and other language support.

    Note: Sarvam may not guarantee JSON mode, so we use
    extract+validate+retry approach for structured outputs.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
    ):
        """
        Initialize Sarvam provider.

        Args:
            api_key: Sarvam API key (falls back to SARVAM_API_KEY env var)
            model: Model to use (falls back to AI_MODEL_SARVAM env var or sarvam-m)
            base_url: Optional base URL override
        """
        self._api_key = api_key or os.getenv("SARVAM_API_KEY")
        self._model = model or os.getenv("AI_MODEL_SARVAM", DEFAULT_SARVAM_MODEL)
        self._base_url = base_url or os.getenv("SARVAM_BASE_URL", DEFAULT_SARVAM_BASE_URL)

        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            timeout=httpx.Timeout(30.0, connect=10.0),
            headers={
                "Authorization": f"Bearer {self._api_key}" if self._api_key else "",
                "Content-Type": "application/json",
            },
        )

    @property
    def name(self) -> str:
        return "sarvam"

    @property
    def model(self) -> str:
        return self._model

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key)

    def supports_json_mode(self) -> bool:
        # Sarvam doesn't guarantee JSON mode, use extraction
        return False

    def get_display_name(self) -> str:
        return f"Sarvam AI ({self._model})"

    async def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 500,
        response_format: dict[str, str] | None = None,
    ) -> ProviderResponse:
        """Generate chat completion using Sarvam AI."""
        if not self.is_configured:
            raise AIProviderError(
                "Sarvam provider not configured (missing SARVAM_API_KEY)",
                provider=self.name,
                retryable=False,
            )

        start_time = time.time()

        # If JSON is requested, add instruction to system prompt
        effective_messages = messages.copy()
        if response_format and response_format.get("type") == "json_object":
            # Find or create system message
            has_system = any(m["role"] == "system" for m in effective_messages)
            json_instruction = "\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no explanation."

            if has_system:
                for i, m in enumerate(effective_messages):
                    if m["role"] == "system":
                        effective_messages[i] = {
                            "role": "system",
                            "content": m["content"] + json_instruction,
                        }
                        break
            else:
                effective_messages.insert(0, {
                    "role": "system",
                    "content": "You are a helpful assistant." + json_instruction,
                })

        # Build request
        payload = {
            "model": self._model,
            "messages": effective_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        try:
            response = await self._client.post("/chat/completions", json=payload)

            latency_ms = int((time.time() - start_time) * 1000)

            # Handle errors
            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After")
                raise RateLimitError(
                    "Sarvam rate limit exceeded",
                    self.name,
                    int(retry_after) if retry_after else None,
                )

            if response.status_code == 401:
                raise AuthenticationError("Sarvam authentication failed", self.name)

            if response.status_code >= 500:
                raise AIProviderError(
                    f"Sarvam server error: {response.status_code}",
                    provider=self.name,
                    retryable=True,
                    status_code=response.status_code,
                )

            if response.status_code != 200:
                raise AIProviderError(
                    f"Sarvam error: {response.status_code} - {response.text}",
                    provider=self.name,
                    retryable=False,
                    status_code=response.status_code,
                )

            # Parse response
            data = response.json()

            # Extract content
            choices = data.get("choices", [])
            if not choices:
                raise InvalidResponseError("No choices in Sarvam response", self.name)

            content = choices[0].get("message", {}).get("content", "")
            if not content:
                raise InvalidResponseError("Empty content in Sarvam response", self.name)

            # If JSON was requested, try to extract and validate
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
                },
            )

        except httpx.TimeoutException:
            raise TimeoutError("Sarvam request timed out", self.name)

        except (RateLimitError, AuthenticationError, AIProviderError):
            raise

        except Exception as e:
            logger.error(f"Sarvam unexpected error: {type(e).__name__}: {e}")
            raise AIProviderError(
                str(e),
                provider=self.name,
                retryable=True,
            )

    def _extract_json(self, content: str) -> str:
        """
        Extract JSON from response content.

        Sarvam may return JSON with markdown wrappers or extra text.
        This method attempts to extract valid JSON.
        """
        # Try parsing as-is first
        try:
            json.loads(content)
            return content
        except json.JSONDecodeError:
            pass

        # Try to find JSON in markdown code blocks
        patterns = [
            r"```json\s*([\s\S]*?)\s*```",  # ```json ... ```
            r"```\s*([\s\S]*?)\s*```",  # ``` ... ```
            r"\{[\s\S]*\}",  # { ... }
        ]

        for pattern in patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                try:
                    # Validate it's valid JSON
                    json.loads(match)
                    return match
                except json.JSONDecodeError:
                    continue

        # Return original if no valid JSON found
        logger.warning("Could not extract valid JSON from Sarvam response")
        return content

    async def health_check(self) -> HealthCheckResult:
        """Check Sarvam health with a minimal request."""
        if not self.is_configured:
            return HealthCheckResult(
                status=ProviderStatus.UNHEALTHY,
                error="Provider not configured",
            )

        start_time = time.time()

        try:
            response = await self._client.post(
                "/chat/completions",
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
