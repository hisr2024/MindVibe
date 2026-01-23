"""
KIAAN Multi-Model Provider - Flexible LLM Integration

This module provides KIAAN with the ability to use multiple LLM providers:
1. OpenAI (GPT-4, GPT-4o, GPT-4o-mini)
2. Anthropic (Claude 3.5 Sonnet, Claude 3 Opus)
3. Google (Gemini Pro, Gemini Ultra)
4. Local Models (Ollama - Llama, Mistral, CodeLlama)
5. Azure OpenAI (Enterprise)

Features:
- Automatic fallback between providers
- Cost optimization (use cheaper models when appropriate)
- Streaming support across all providers
- Unified interface for all models
"""

import asyncio
import json
import logging
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, AsyncGenerator, Optional

import aiohttp

logger = logging.getLogger(__name__)


class ModelProvider(str, Enum):
    """Available model providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    OLLAMA = "ollama"
    AZURE = "azure"


class ModelCapability(str, Enum):
    """Model capabilities."""
    CHAT = "chat"
    CODE = "code"
    REASONING = "reasoning"
    VISION = "vision"
    FUNCTION_CALLING = "function_calling"
    LONG_CONTEXT = "long_context"


@dataclass
class ModelConfig:
    """Configuration for a specific model."""
    provider: ModelProvider
    model_id: str
    display_name: str
    max_tokens: int
    context_window: int
    capabilities: list[ModelCapability]
    cost_per_1k_input: float  # USD
    cost_per_1k_output: float  # USD
    supports_streaming: bool = True
    supports_functions: bool = False


@dataclass
class ModelResponse:
    """Unified response from any model."""
    content: str
    model: str
    provider: ModelProvider
    tokens_used: dict = field(default_factory=dict)
    finish_reason: Optional[str] = None
    metadata: dict = field(default_factory=dict)
    latency_ms: float = 0


@dataclass
class Message:
    """A chat message."""
    role: str  # system, user, assistant
    content: str
    name: Optional[str] = None


# Model Registry
AVAILABLE_MODELS: dict[str, ModelConfig] = {
    # OpenAI Models
    "gpt-4o": ModelConfig(
        provider=ModelProvider.OPENAI,
        model_id="gpt-4o",
        display_name="GPT-4o",
        max_tokens=4096,
        context_window=128000,
        capabilities=[
            ModelCapability.CHAT,
            ModelCapability.CODE,
            ModelCapability.REASONING,
            ModelCapability.VISION,
            ModelCapability.FUNCTION_CALLING,
            ModelCapability.LONG_CONTEXT
        ],
        cost_per_1k_input=0.005,
        cost_per_1k_output=0.015,
        supports_functions=True
    ),
    "gpt-4o-mini": ModelConfig(
        provider=ModelProvider.OPENAI,
        model_id="gpt-4o-mini",
        display_name="GPT-4o Mini",
        max_tokens=4096,
        context_window=128000,
        capabilities=[
            ModelCapability.CHAT,
            ModelCapability.CODE,
            ModelCapability.FUNCTION_CALLING
        ],
        cost_per_1k_input=0.00015,
        cost_per_1k_output=0.0006,
        supports_functions=True
    ),
    "gpt-4-turbo": ModelConfig(
        provider=ModelProvider.OPENAI,
        model_id="gpt-4-turbo",
        display_name="GPT-4 Turbo",
        max_tokens=4096,
        context_window=128000,
        capabilities=[
            ModelCapability.CHAT,
            ModelCapability.CODE,
            ModelCapability.REASONING,
            ModelCapability.VISION,
            ModelCapability.FUNCTION_CALLING,
            ModelCapability.LONG_CONTEXT
        ],
        cost_per_1k_input=0.01,
        cost_per_1k_output=0.03,
        supports_functions=True
    ),

    # Anthropic Models
    "claude-3-5-sonnet": ModelConfig(
        provider=ModelProvider.ANTHROPIC,
        model_id="claude-3-5-sonnet-20241022",
        display_name="Claude 3.5 Sonnet",
        max_tokens=8192,
        context_window=200000,
        capabilities=[
            ModelCapability.CHAT,
            ModelCapability.CODE,
            ModelCapability.REASONING,
            ModelCapability.VISION,
            ModelCapability.FUNCTION_CALLING,
            ModelCapability.LONG_CONTEXT
        ],
        cost_per_1k_input=0.003,
        cost_per_1k_output=0.015,
        supports_functions=True
    ),
    "claude-3-opus": ModelConfig(
        provider=ModelProvider.ANTHROPIC,
        model_id="claude-3-opus-20240229",
        display_name="Claude 3 Opus",
        max_tokens=4096,
        context_window=200000,
        capabilities=[
            ModelCapability.CHAT,
            ModelCapability.CODE,
            ModelCapability.REASONING,
            ModelCapability.VISION,
            ModelCapability.FUNCTION_CALLING,
            ModelCapability.LONG_CONTEXT
        ],
        cost_per_1k_input=0.015,
        cost_per_1k_output=0.075,
        supports_functions=True
    ),
    "claude-3-haiku": ModelConfig(
        provider=ModelProvider.ANTHROPIC,
        model_id="claude-3-haiku-20240307",
        display_name="Claude 3 Haiku",
        max_tokens=4096,
        context_window=200000,
        capabilities=[
            ModelCapability.CHAT,
            ModelCapability.CODE,
            ModelCapability.FUNCTION_CALLING
        ],
        cost_per_1k_input=0.00025,
        cost_per_1k_output=0.00125,
        supports_functions=True
    ),

    # Google Models
    "gemini-pro": ModelConfig(
        provider=ModelProvider.GOOGLE,
        model_id="gemini-1.5-pro",
        display_name="Gemini 1.5 Pro",
        max_tokens=8192,
        context_window=1000000,
        capabilities=[
            ModelCapability.CHAT,
            ModelCapability.CODE,
            ModelCapability.REASONING,
            ModelCapability.VISION,
            ModelCapability.FUNCTION_CALLING,
            ModelCapability.LONG_CONTEXT
        ],
        cost_per_1k_input=0.00125,
        cost_per_1k_output=0.005,
        supports_functions=True
    ),
    "gemini-flash": ModelConfig(
        provider=ModelProvider.GOOGLE,
        model_id="gemini-1.5-flash",
        display_name="Gemini 1.5 Flash",
        max_tokens=8192,
        context_window=1000000,
        capabilities=[
            ModelCapability.CHAT,
            ModelCapability.CODE,
            ModelCapability.FUNCTION_CALLING,
            ModelCapability.LONG_CONTEXT
        ],
        cost_per_1k_input=0.000075,
        cost_per_1k_output=0.0003,
        supports_functions=True
    ),

    # Local Models (Ollama)
    "llama-3-70b": ModelConfig(
        provider=ModelProvider.OLLAMA,
        model_id="llama3:70b",
        display_name="Llama 3 70B",
        max_tokens=4096,
        context_window=8192,
        capabilities=[
            ModelCapability.CHAT,
            ModelCapability.CODE,
            ModelCapability.REASONING
        ],
        cost_per_1k_input=0,
        cost_per_1k_output=0,
        supports_functions=False
    ),
    "codellama-34b": ModelConfig(
        provider=ModelProvider.OLLAMA,
        model_id="codellama:34b",
        display_name="CodeLlama 34B",
        max_tokens=4096,
        context_window=16384,
        capabilities=[
            ModelCapability.CODE
        ],
        cost_per_1k_input=0,
        cost_per_1k_output=0,
        supports_functions=False
    ),
    "mistral-7b": ModelConfig(
        provider=ModelProvider.OLLAMA,
        model_id="mistral:7b",
        display_name="Mistral 7B",
        max_tokens=4096,
        context_window=32768,
        capabilities=[
            ModelCapability.CHAT,
            ModelCapability.CODE
        ],
        cost_per_1k_input=0,
        cost_per_1k_output=0,
        supports_functions=False
    ),
}


class BaseModelClient(ABC):
    """Abstract base class for model clients."""

    @abstractmethod
    async def complete(
        self,
        messages: list[Message],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        functions: Optional[list[dict]] = None
    ) -> AsyncGenerator[str, None] | ModelResponse:
        """Generate a completion."""
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        """Check if the provider is available."""
        pass


class OpenAIClient(BaseModelClient):
    """OpenAI API client."""

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.base_url = "https://api.openai.com/v1"

    async def is_available(self) -> bool:
        return bool(self.api_key)

    async def complete(
        self,
        messages: list[Message],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        functions: Optional[list[dict]] = None
    ) -> AsyncGenerator[str, None] | ModelResponse:
        import time
        start_time = time.time()

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": temperature,
            "stream": stream
        }

        if max_tokens:
            payload["max_tokens"] = max_tokens

        if functions:
            payload["tools"] = [{"type": "function", "function": f} for f in functions]

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=120)
            ) as response:
                if response.status != 200:
                    error = await response.text()
                    raise Exception(f"OpenAI API error: {error}")

                if stream:
                    async for line in response.content:
                        line = line.decode("utf-8").strip()
                        if line.startswith("data: ") and line != "data: [DONE]":
                            try:
                                data = json.loads(line[6:])
                                delta = data["choices"][0].get("delta", {})
                                if "content" in delta and delta["content"]:
                                    yield delta["content"]
                            except json.JSONDecodeError:
                                continue
                else:
                    data = await response.json()
                    choice = data["choices"][0]
                    yield ModelResponse(
                        content=choice["message"]["content"],
                        model=model,
                        provider=ModelProvider.OPENAI,
                        tokens_used={
                            "input": data["usage"]["prompt_tokens"],
                            "output": data["usage"]["completion_tokens"]
                        },
                        finish_reason=choice.get("finish_reason"),
                        latency_ms=(time.time() - start_time) * 1000
                    )


class AnthropicClient(BaseModelClient):
    """Anthropic API client."""

    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
        self.base_url = "https://api.anthropic.com/v1"

    async def is_available(self) -> bool:
        return bool(self.api_key)

    async def complete(
        self,
        messages: list[Message],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        functions: Optional[list[dict]] = None
    ) -> AsyncGenerator[str, None] | ModelResponse:
        import time
        start_time = time.time()

        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }

        # Convert messages format
        system_message = None
        api_messages = []

        for msg in messages:
            if msg.role == "system":
                system_message = msg.content
            else:
                api_messages.append({"role": msg.role, "content": msg.content})

        payload = {
            "model": model,
            "messages": api_messages,
            "temperature": temperature,
            "max_tokens": max_tokens or 4096,
            "stream": stream
        }

        if system_message:
            payload["system"] = system_message

        if functions:
            payload["tools"] = [
                {
                    "name": f["name"],
                    "description": f.get("description", ""),
                    "input_schema": f.get("parameters", {})
                }
                for f in functions
            ]

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/messages",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=120)
            ) as response:
                if response.status != 200:
                    error = await response.text()
                    raise Exception(f"Anthropic API error: {error}")

                if stream:
                    async for line in response.content:
                        line = line.decode("utf-8").strip()
                        if line.startswith("data: "):
                            try:
                                data = json.loads(line[6:])
                                if data["type"] == "content_block_delta":
                                    delta = data.get("delta", {})
                                    if "text" in delta:
                                        yield delta["text"]
                            except json.JSONDecodeError:
                                continue
                else:
                    data = await response.json()
                    content = ""
                    for block in data.get("content", []):
                        if block["type"] == "text":
                            content += block["text"]

                    yield ModelResponse(
                        content=content,
                        model=model,
                        provider=ModelProvider.ANTHROPIC,
                        tokens_used={
                            "input": data["usage"]["input_tokens"],
                            "output": data["usage"]["output_tokens"]
                        },
                        finish_reason=data.get("stop_reason"),
                        latency_ms=(time.time() - start_time) * 1000
                    )


class GoogleClient(BaseModelClient):
    """Google AI (Gemini) client."""

    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY", "").strip()
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    async def is_available(self) -> bool:
        return bool(self.api_key)

    async def complete(
        self,
        messages: list[Message],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        functions: Optional[list[dict]] = None
    ) -> AsyncGenerator[str, None] | ModelResponse:
        import time
        start_time = time.time()

        # Convert messages to Gemini format
        contents = []
        system_instruction = None

        for msg in messages:
            if msg.role == "system":
                system_instruction = msg.content
            else:
                role = "user" if msg.role == "user" else "model"
                contents.append({
                    "role": role,
                    "parts": [{"text": msg.content}]
                })

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens or 4096
            }
        }

        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        endpoint = "streamGenerateContent" if stream else "generateContent"
        url = f"{self.base_url}/models/{model}:{endpoint}?key={self.api_key}"

        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=120)
            ) as response:
                if response.status != 200:
                    error = await response.text()
                    raise Exception(f"Google API error: {error}")

                if stream:
                    async for line in response.content:
                        line = line.decode("utf-8").strip()
                        if line:
                            try:
                                data = json.loads(line)
                                candidates = data.get("candidates", [])
                                if candidates:
                                    content = candidates[0].get("content", {})
                                    parts = content.get("parts", [])
                                    for part in parts:
                                        if "text" in part:
                                            yield part["text"]
                            except json.JSONDecodeError:
                                continue
                else:
                    data = await response.json()
                    candidates = data.get("candidates", [])
                    content = ""
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        content = "".join(p.get("text", "") for p in parts)

                    usage = data.get("usageMetadata", {})
                    yield ModelResponse(
                        content=content,
                        model=model,
                        provider=ModelProvider.GOOGLE,
                        tokens_used={
                            "input": usage.get("promptTokenCount", 0),
                            "output": usage.get("candidatesTokenCount", 0)
                        },
                        finish_reason=candidates[0].get("finishReason") if candidates else None,
                        latency_ms=(time.time() - start_time) * 1000
                    )


class OllamaClient(BaseModelClient):
    """Ollama local model client."""

    def __init__(self):
        self.base_url = os.getenv("OLLAMA_URL", "http://localhost:11434")

    async def is_available(self) -> bool:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/api/tags",
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    return response.status == 200
        except Exception:
            return False

    async def complete(
        self,
        messages: list[Message],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        functions: Optional[list[dict]] = None
    ) -> AsyncGenerator[str, None] | ModelResponse:
        import time
        start_time = time.time()

        payload = {
            "model": model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": stream,
            "options": {
                "temperature": temperature
            }
        }

        if max_tokens:
            payload["options"]["num_predict"] = max_tokens

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=300)
            ) as response:
                if response.status != 200:
                    error = await response.text()
                    raise Exception(f"Ollama API error: {error}")

                if stream:
                    async for line in response.content:
                        line = line.decode("utf-8").strip()
                        if line:
                            try:
                                data = json.loads(line)
                                message = data.get("message", {})
                                if "content" in message:
                                    yield message["content"]
                            except json.JSONDecodeError:
                                continue
                else:
                    data = await response.json()
                    message = data.get("message", {})

                    yield ModelResponse(
                        content=message.get("content", ""),
                        model=model,
                        provider=ModelProvider.OLLAMA,
                        tokens_used={
                            "input": data.get("prompt_eval_count", 0),
                            "output": data.get("eval_count", 0)
                        },
                        finish_reason="stop",
                        latency_ms=(time.time() - start_time) * 1000
                    )


class KIAANModelProvider:
    """
    Unified model provider for KIAAN.

    Features:
    - Automatic provider selection
    - Fallback chain
    - Cost optimization
    - Model capability matching
    """

    def __init__(self):
        self.clients: dict[ModelProvider, BaseModelClient] = {
            ModelProvider.OPENAI: OpenAIClient(),
            ModelProvider.ANTHROPIC: AnthropicClient(),
            ModelProvider.GOOGLE: GoogleClient(),
            ModelProvider.OLLAMA: OllamaClient(),
        }

        # Default model preferences
        self.default_model = "gpt-4o-mini"
        self.reasoning_model = "claude-3-5-sonnet"
        self.code_model = "gpt-4o"
        self.fast_model = "gemini-flash"

        # Fallback chain
        self.fallback_chain = [
            "gpt-4o-mini",
            "claude-3-haiku",
            "gemini-flash",
            "mistral-7b"
        ]

    async def initialize(self) -> dict[str, bool]:
        """Check availability of all providers."""
        availability = {}
        for provider, client in self.clients.items():
            availability[provider.value] = await client.is_available()
        return availability

    def get_model_config(self, model_name: str) -> Optional[ModelConfig]:
        """Get configuration for a model."""
        return AVAILABLE_MODELS.get(model_name)

    def select_model_for_task(
        self,
        task_type: str,
        required_capabilities: Optional[list[ModelCapability]] = None,
        prefer_fast: bool = False,
        prefer_cheap: bool = False
    ) -> str:
        """Select the best model for a given task."""
        # Task-specific defaults
        task_models = {
            "research": self.reasoning_model,
            "code": self.code_model,
            "analysis": self.reasoning_model,
            "chat": self.default_model,
            "planning": self.reasoning_model,
            "synthesis": self.reasoning_model
        }

        if prefer_fast:
            return self.fast_model
        if prefer_cheap:
            return "gpt-4o-mini"

        base_model = task_models.get(task_type, self.default_model)

        # Check if required capabilities are met
        if required_capabilities:
            config = self.get_model_config(base_model)
            if config:
                has_all = all(cap in config.capabilities for cap in required_capabilities)
                if not has_all:
                    # Find a model with all required capabilities
                    for name, cfg in AVAILABLE_MODELS.items():
                        if all(cap in cfg.capabilities for cap in required_capabilities):
                            return name

        return base_model

    async def complete(
        self,
        messages: list[Message],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        functions: Optional[list[dict]] = None,
        fallback: bool = True
    ) -> AsyncGenerator[str, None] | ModelResponse:
        """
        Generate a completion using the specified or best available model.

        Args:
            messages: List of messages
            model: Model to use (optional, will select automatically)
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            stream: Whether to stream the response
            functions: Function schemas for tool use
            fallback: Whether to try fallback models on failure

        Yields/Returns:
            Streamed text chunks or ModelResponse
        """
        model = model or self.default_model
        config = self.get_model_config(model)

        if not config:
            raise ValueError(f"Unknown model: {model}")

        client = self.clients.get(config.provider)
        if not client:
            raise ValueError(f"No client for provider: {config.provider}")

        # Try primary model
        try:
            if await client.is_available():
                async for result in client.complete(
                    messages=messages,
                    model=config.model_id,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=stream,
                    functions=functions if config.supports_functions else None
                ):
                    yield result
                return
        except Exception as e:
            logger.warning(f"Model {model} failed: {e}")
            if not fallback:
                raise

        # Try fallback models
        for fallback_model in self.fallback_chain:
            if fallback_model == model:
                continue

            fallback_config = self.get_model_config(fallback_model)
            if not fallback_config:
                continue

            fallback_client = self.clients.get(fallback_config.provider)
            if not fallback_client:
                continue

            try:
                if await fallback_client.is_available():
                    logger.info(f"Falling back to {fallback_model}")
                    async for result in fallback_client.complete(
                        messages=messages,
                        model=fallback_config.model_id,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        stream=stream,
                        functions=functions if fallback_config.supports_functions else None
                    ):
                        yield result
                    return
            except Exception as e:
                logger.warning(f"Fallback model {fallback_model} failed: {e}")
                continue

        raise Exception("All models failed")

    async def estimate_cost(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int
    ) -> float:
        """Estimate cost for a completion."""
        config = self.get_model_config(model)
        if not config:
            return 0.0

        input_cost = (input_tokens / 1000) * config.cost_per_1k_input
        output_cost = (output_tokens / 1000) * config.cost_per_1k_output

        return input_cost + output_cost

    def list_available_models(
        self,
        provider: Optional[ModelProvider] = None,
        capability: Optional[ModelCapability] = None
    ) -> list[dict]:
        """List available models with optional filtering."""
        models = []

        for name, config in AVAILABLE_MODELS.items():
            if provider and config.provider != provider:
                continue
            if capability and capability not in config.capabilities:
                continue

            models.append({
                "name": name,
                "display_name": config.display_name,
                "provider": config.provider.value,
                "capabilities": [c.value for c in config.capabilities],
                "context_window": config.context_window,
                "cost_per_1k_input": config.cost_per_1k_input,
                "cost_per_1k_output": config.cost_per_1k_output
            })

        return models


# Singleton instance
kiaan_model_provider = KIAANModelProvider()


# Export
__all__ = [
    "KIAANModelProvider",
    "ModelProvider",
    "ModelCapability",
    "ModelConfig",
    "ModelResponse",
    "Message",
    "AVAILABLE_MODELS",
    "kiaan_model_provider"
]
