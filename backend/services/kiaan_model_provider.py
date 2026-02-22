"""
KIAAN Multi-Model Provider - Flexible LLM Integration with Full Offline Support

This module provides KIAAN with the ability to use multiple LLM providers:
1. OpenAI (GPT-4, GPT-4o, GPT-4o-mini)
2. Anthropic (Claude 3.5 Sonnet, Claude 3 Opus)
3. Google (Gemini Pro, Gemini Ultra)
4. Local Models (Ollama - Llama, Mistral, CodeLlama)
5. Azure OpenAI (Enterprise)
6. LM Studio (Local inference server)
7. Llama.cpp (Direct GGUF model inference - NO INTERNET REQUIRED)

Features:
- Automatic fallback between providers
- Cost optimization (use cheaper models when appropriate)
- Streaming support across all providers
- Unified interface for all models
- FULL OFFLINE SUPPORT via local models
- Automatic connectivity detection
- Local model registry and auto-download
"""

import asyncio
import json
import logging
import os
import socket
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, AsyncGenerator, Optional, Callable

try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    aiohttp = None  # type: ignore[assignment]
    AIOHTTP_AVAILABLE = False

logger = logging.getLogger(__name__)

if not AIOHTTP_AVAILABLE:
    logger.warning("aiohttp not installed. Offline model provider features will be limited. Install with: pip install aiohttp")

# Optional imports for local model support
try:
    from llama_cpp import Llama
    LLAMA_CPP_AVAILABLE = True
except ImportError:
    LLAMA_CPP_AVAILABLE = False
    logger.info("llama-cpp-python not installed. Local GGUF models unavailable.")

try:
    from huggingface_hub import hf_hub_download, scan_cache_dir
    HUGGINGFACE_HUB_AVAILABLE = True
except ImportError:
    HUGGINGFACE_HUB_AVAILABLE = False
    logger.info("huggingface-hub not installed. Model auto-download unavailable.")


class ModelProvider(str, Enum):
    """Available model providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    OLLAMA = "ollama"
    AZURE = "azure"
    LOCAL = "local"  # Direct local inference (llama.cpp)
    LM_STUDIO = "lm_studio"  # LM Studio server


class ConnectionStatus(str, Enum):
    """Network connectivity status."""
    ONLINE = "online"
    OFFLINE = "offline"
    DEGRADED = "degraded"  # Some APIs available, others not


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

    # Local Models (Direct inference via llama.cpp - NO INTERNET REQUIRED)
    "mistral-7b-local": ModelConfig(
        provider=ModelProvider.LOCAL,
        model_id="TheBloke/Mistral-7B-Instruct-v0.2-GGUF",
        display_name="Mistral 7B Local",
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
    "llama-3-8b-local": ModelConfig(
        provider=ModelProvider.LOCAL,
        model_id="QuantFactory/Meta-Llama-3-8B-Instruct-GGUF",
        display_name="Llama 3 8B Local",
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
    "phi-3-mini-local": ModelConfig(
        provider=ModelProvider.LOCAL,
        model_id="microsoft/Phi-3-mini-4k-instruct-gguf",
        display_name="Phi-3 Mini Local",
        max_tokens=2048,
        context_window=4096,
        capabilities=[
            ModelCapability.CHAT,
            ModelCapability.CODE
        ],
        cost_per_1k_input=0,
        cost_per_1k_output=0,
        supports_functions=False
    ),
    "qwen-2-7b-local": ModelConfig(
        provider=ModelProvider.LOCAL,
        model_id="Qwen/Qwen2-7B-Instruct-GGUF",
        display_name="Qwen 2 7B Local",
        max_tokens=4096,
        context_window=32768,
        capabilities=[
            ModelCapability.CHAT,
            ModelCapability.CODE,
            ModelCapability.LONG_CONTEXT
        ],
        cost_per_1k_input=0,
        cost_per_1k_output=0,
        supports_functions=False
    ),

    # LM Studio Models (via local server)
    "lm-studio-default": ModelConfig(
        provider=ModelProvider.LM_STUDIO,
        model_id="local-model",
        display_name="LM Studio Model",
        max_tokens=4096,
        context_window=8192,
        capabilities=[
            ModelCapability.CHAT,
            ModelCapability.CODE
        ],
        cost_per_1k_input=0,
        cost_per_1k_output=0,
        supports_functions=False
    ),
}


# =============================================================================
# CONNECTIVITY & OFFLINE DETECTION
# =============================================================================

class ConnectivityChecker:
    """Check and monitor network connectivity for AI providers."""

    def __init__(self):
        self._status = ConnectionStatus.ONLINE
        self._last_check = datetime.min
        self._check_interval = 300  # 5 minutes
        self._provider_status: dict[ModelProvider, bool] = {}

    async def check_connectivity(self, force: bool = False) -> ConnectionStatus:
        """Check overall connectivity status."""
        now = datetime.now()
        if not force and (now - self._last_check).total_seconds() < self._check_interval:
            return self._status

        # Quick internet check
        is_online = await self._quick_internet_check()

        if not is_online:
            self._status = ConnectionStatus.OFFLINE
            self._last_check = now
            return self._status

        # Check individual providers
        provider_checks = await asyncio.gather(
            self._check_openai(),
            self._check_anthropic(),
            self._check_google(),
            return_exceptions=True
        )

        available_count = sum(1 for r in provider_checks if r is True)

        if available_count == 0:
            self._status = ConnectionStatus.OFFLINE
        elif available_count < len(provider_checks):
            self._status = ConnectionStatus.DEGRADED
        else:
            self._status = ConnectionStatus.ONLINE

        self._last_check = now
        return self._status

    async def _quick_internet_check(self) -> bool:
        """Quick check if internet is available."""
        try:
            # Try to resolve a common domain
            loop = asyncio.get_running_loop()
            await asyncio.wait_for(
                loop.run_in_executor(None, socket.gethostbyname, "api.openai.com"),
                timeout=2.0
            )
            return True
        except Exception:
            return False

    async def _check_openai(self) -> bool:
        """Check if OpenAI API is reachable."""
        if not os.getenv("OPENAI_API_KEY"):
            return False
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                async with session.get("https://api.openai.com/v1/models") as response:
                    self._provider_status[ModelProvider.OPENAI] = response.status in (200, 401)
                    return response.status in (200, 401)  # 401 means API is up but key invalid
        except Exception:
            self._provider_status[ModelProvider.OPENAI] = False
            return False

    async def _check_anthropic(self) -> bool:
        """Check if Anthropic API is reachable."""
        if not os.getenv("ANTHROPIC_API_KEY"):
            return False
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                async with session.get("https://api.anthropic.com/v1/messages") as response:
                    self._provider_status[ModelProvider.ANTHROPIC] = response.status in (200, 401, 405)
                    return response.status in (200, 401, 405)
        except Exception:
            self._provider_status[ModelProvider.ANTHROPIC] = False
            return False

    async def _check_google(self) -> bool:
        """Check if Google AI API is reachable."""
        if not os.getenv("GOOGLE_API_KEY"):
            return False
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                async with session.get("https://generativelanguage.googleapis.com/v1/models") as response:
                    self._provider_status[ModelProvider.GOOGLE] = response.status in (200, 401, 403)
                    return response.status in (200, 401, 403)
        except Exception:
            self._provider_status[ModelProvider.GOOGLE] = False
            return False

    def is_offline(self) -> bool:
        """Check if we're currently offline."""
        return self._status == ConnectionStatus.OFFLINE

    def get_available_providers(self) -> list[ModelProvider]:
        """Get list of currently available providers."""
        available = []
        for provider, status in self._provider_status.items():
            if status:
                available.append(provider)
        # Only add local providers if they are actually available
        if LLAMA_CPP_AVAILABLE and local_model_registry.has_any_model():
            available.append(ModelProvider.LOCAL)
        # Ollama and LM Studio availability is checked at runtime via their
        # clients; don't unconditionally add them here
        return available


# Global connectivity checker
connectivity_checker = ConnectivityChecker()


# =============================================================================
# LOCAL MODEL REGISTRY
# =============================================================================

@dataclass
class LocalModelInfo:
    """Information about a locally available model."""
    name: str
    path: str
    size_gb: float
    quantization: str
    context_size: int
    loaded: bool = False


class LocalModelRegistry:
    """Registry for managing locally available LLM models."""

    # Popular models that can be auto-downloaded
    DOWNLOADABLE_MODELS = {
        "mistral-7b-instruct": {
            "repo_id": "TheBloke/Mistral-7B-Instruct-v0.2-GGUF",
            "filename": "mistral-7b-instruct-v0.2.Q4_K_M.gguf",
            "size_gb": 4.4,
        },
        "llama-3-8b-instruct": {
            "repo_id": "QuantFactory/Meta-Llama-3-8B-Instruct-GGUF",
            "filename": "Meta-Llama-3-8B-Instruct.Q4_K_M.gguf",
            "size_gb": 4.9,
        },
        "phi-3-mini": {
            "repo_id": "microsoft/Phi-3-mini-4k-instruct-gguf",
            "filename": "Phi-3-mini-4k-instruct-q4.gguf",
            "size_gb": 2.4,
        },
        "qwen-2-7b-instruct": {
            "repo_id": "Qwen/Qwen2-7B-Instruct-GGUF",
            "filename": "qwen2-7b-instruct-q4_k_m.gguf",
            "size_gb": 4.5,
        },
        "tinyllama-1.1b": {
            "repo_id": "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF",
            "filename": "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
            "size_gb": 0.67,
        },
    }

    def __init__(self, models_path: Optional[str] = None):
        self.models_path = Path(models_path or os.getenv("LOCAL_MODEL_PATH", str(Path.home() / ".mindvibe" / "models")))
        self.models_path.mkdir(parents=True, exist_ok=True)
        self._available_models: dict[str, LocalModelInfo] = {}
        self._loaded_model: Optional[tuple[str, Any]] = None  # (name, model_instance)

    def scan_models(self) -> dict[str, LocalModelInfo]:
        """Scan local directory for available models."""
        self._available_models = {}

        # Scan for .gguf files
        for gguf_file in self.models_path.rglob("*.gguf"):
            size_gb = gguf_file.stat().st_size / (1024 ** 3)
            name = gguf_file.stem

            # Detect quantization from filename
            quant = "unknown"
            for q in ["Q4_K_M", "Q4_K_S", "Q5_K_M", "Q5_K_S", "Q8_0", "F16", "Q4_0", "Q4_1"]:
                if q.lower() in name.lower():
                    quant = q
                    break

            self._available_models[name] = LocalModelInfo(
                name=name,
                path=str(gguf_file),
                size_gb=round(size_gb, 2),
                quantization=quant,
                context_size=4096,  # Default, will be updated when loaded
                loaded=False
            )

        logger.info(f"Found {len(self._available_models)} local models")
        return self._available_models

    def get_available_models(self) -> list[str]:
        """Get list of available local model names."""
        if not self._available_models:
            self.scan_models()
        return list(self._available_models.keys())

    def get_model_info(self, name: str) -> Optional[LocalModelInfo]:
        """Get info for a specific model."""
        if not self._available_models:
            self.scan_models()
        return self._available_models.get(name)

    def get_best_available_model(self) -> Optional[str]:
        """Get the best available model based on size and capabilities."""
        if not self._available_models:
            self.scan_models()

        if not self._available_models:
            return None

        # Prefer models in this order
        preference_order = [
            "mistral-7b", "llama-3", "qwen", "phi-3", "tinyllama"
        ]

        for pref in preference_order:
            for name in self._available_models:
                if pref.lower() in name.lower():
                    return name

        # Return the largest available model
        return max(self._available_models.keys(),
                   key=lambda k: self._available_models[k].size_gb)

    async def download_model(
        self,
        model_name: str,
        progress_callback: Optional[Callable[[float], None]] = None
    ) -> Optional[str]:
        """Download a model from HuggingFace Hub."""
        if not HUGGINGFACE_HUB_AVAILABLE:
            logger.error("huggingface-hub not installed. Cannot download models.")
            return None

        if model_name not in self.DOWNLOADABLE_MODELS:
            logger.error(f"Unknown model: {model_name}")
            return None

        model_info = self.DOWNLOADABLE_MODELS[model_name]

        try:
            logger.info(f"Downloading {model_name} ({model_info['size_gb']}GB)...")

            # Download with progress
            local_path = hf_hub_download(
                repo_id=model_info["repo_id"],
                filename=model_info["filename"],
                local_dir=str(self.models_path),
                local_dir_use_symlinks=False,
            )

            logger.info(f"Downloaded {model_name} to {local_path}")

            # Rescan models
            self.scan_models()

            return local_path

        except Exception as e:
            logger.error(f"Failed to download {model_name}: {e}")
            return None

    def has_any_model(self) -> bool:
        """Check if any local model is available."""
        if not self._available_models:
            self.scan_models()
        return len(self._available_models) > 0


# Global model registry
local_model_registry = LocalModelRegistry()


# =============================================================================
# MODEL CLIENTS
# =============================================================================

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

    async def pull_model(self, model: str) -> bool:
        """Pull a model from Ollama registry."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/pull",
                    json={"name": model},
                    timeout=aiohttp.ClientTimeout(total=3600)  # 1 hour for large models
                ) as response:
                    if response.status == 200:
                        logger.info(f"Successfully pulled model: {model}")
                        return True
                    return False
        except Exception as e:
            logger.error(f"Failed to pull model {model}: {e}")
            return False

    async def list_models(self) -> list[str]:
        """List available Ollama models."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/api/tags",
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return [m["name"] for m in data.get("models", [])]
                    return []
        except Exception:
            return []


class LocalLLMClient(BaseModelClient):
    """
    Local LLM client using llama-cpp-python for GGUF models.
    Provides FULL OFFLINE support - no internet required.
    """

    def __init__(self):
        self.model_path = os.getenv("LOCAL_MODEL_PATH", str(Path.home() / ".mindvibe" / "models"))
        self.loaded_model: Optional[Any] = None
        self.loaded_model_name: Optional[str] = None  # Stores file path of loaded model
        self._loaded_logical_name: Optional[str] = None  # Stores logical name (e.g. "mistral-7b-local")
        self.context_size = int(os.getenv("LOCAL_MODEL_CONTEXT_SIZE", "4096"))
        self.n_threads = int(os.getenv("MAX_LOCAL_MODEL_THREADS", "4"))
        self._registry = local_model_registry

    async def is_available(self) -> bool:
        """Check if local LLM inference is available."""
        if not LLAMA_CPP_AVAILABLE:
            return False
        return self._registry.has_any_model()

    def _load_model(self, model_path: str) -> bool:
        """Load a model into memory."""
        if not LLAMA_CPP_AVAILABLE:
            return False

        try:
            logger.info(f"Loading local model: {model_path}")
            self.loaded_model = Llama(
                model_path=model_path,
                n_ctx=self.context_size,
                n_threads=self.n_threads,
                verbose=False
            )
            self.loaded_model_name = model_path
            logger.info(f"Successfully loaded model: {model_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to load model {model_path}: {e}")
            return False

    def _ensure_model_loaded(self, model: str) -> bool:
        """Ensure a model is loaded, loading if necessary."""
        # Check if the requested model (by logical name or file path) is already loaded
        if self.loaded_model is not None and (
            self.loaded_model_name == model or
            self._loaded_logical_name == model
        ):
            return True

        # Find model file
        model_info = self._registry.get_model_info(model)
        if model_info:
            success = self._load_model(model_info.path)
            if success:
                self._loaded_logical_name = model
            return success

        # Try to find by partial name match
        available = self._registry.get_available_models()
        for name in available:
            if model.lower() in name.lower():
                info = self._registry.get_model_info(name)
                if info:
                    success = self._load_model(info.path)
                    if success:
                        self._loaded_logical_name = model
                    return success

        # Use best available model
        best = self._registry.get_best_available_model()
        if best:
            info = self._registry.get_model_info(best)
            if info:
                success = self._load_model(info.path)
                if success:
                    self._loaded_logical_name = model
                return success

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
        """Generate completion using local model."""
        import time
        start_time = time.time()

        if not self._ensure_model_loaded(model):
            raise Exception("No local model available")

        # Convert messages to prompt format
        prompt = self._format_messages(messages)

        try:
            if stream:
                # Streaming response
                async for chunk in self._stream_completion(prompt, temperature, max_tokens):
                    yield chunk
            else:
                # Full response - run in executor to avoid blocking event loop
                loop = asyncio.get_running_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: self.loaded_model(
                        prompt,
                        max_tokens=max_tokens or 512,
                        temperature=temperature,
                        stop=["</s>", "[/INST]", "User:", "Human:"],
                        echo=False
                    )
                )

                content = response["choices"][0]["text"].strip()
                usage = response.get("usage", {})

                yield ModelResponse(
                    content=content,
                    model=self.loaded_model_name or model,
                    provider=ModelProvider.LOCAL,
                    tokens_used={
                        "input": usage.get("prompt_tokens", 0),
                        "output": usage.get("completion_tokens", 0)
                    },
                    finish_reason=response["choices"][0].get("finish_reason", "stop"),
                    latency_ms=(time.time() - start_time) * 1000,
                    metadata={"local": True, "offline_capable": True}
                )

        except Exception as e:
            logger.error(f"Local model error: {e}")
            raise

    async def _stream_completion(
        self,
        prompt: str,
        temperature: float,
        max_tokens: Optional[int]
    ) -> AsyncGenerator[str, None]:
        """Stream completion tokens using a thread to avoid blocking the event loop."""
        import queue

        token_queue: queue.Queue = queue.Queue()
        sentinel = object()

        def _run_inference():
            """Run blocking model inference in a thread."""
            try:
                for output in self.loaded_model(
                    prompt,
                    max_tokens=max_tokens or 512,
                    temperature=temperature,
                    stop=["</s>", "[/INST]", "User:", "Human:"],
                    stream=True
                ):
                    token = output["choices"][0]["text"]
                    if token:
                        token_queue.put(token)
                token_queue.put(sentinel)
            except Exception as e:
                token_queue.put(e)

        loop = asyncio.get_running_loop()
        loop.run_in_executor(None, _run_inference)

        while True:
            # Poll the queue without blocking the event loop
            try:
                item = token_queue.get_nowait()
            except queue.Empty:
                await asyncio.sleep(0.01)
                continue

            if item is sentinel:
                break
            if isinstance(item, Exception):
                logger.error(f"Streaming error: {item}")
                raise item
            yield item

    def _format_messages(self, messages: list[Message]) -> str:
        """Format messages for local model."""
        prompt_parts = []

        for msg in messages:
            if msg.role == "system":
                prompt_parts.append(f"[INST] <<SYS>>\n{msg.content}\n<</SYS>>\n")
            elif msg.role == "user":
                if prompt_parts and not prompt_parts[-1].endswith("[/INST]"):
                    prompt_parts.append(f"{msg.content} [/INST]")
                else:
                    prompt_parts.append(f"[INST] {msg.content} [/INST]")
            elif msg.role == "assistant":
                prompt_parts.append(f" {msg.content} </s>")

        return "".join(prompt_parts)

    def unload_model(self) -> None:
        """Unload current model to free memory."""
        if self.loaded_model:
            del self.loaded_model
            self.loaded_model = None
            self.loaded_model_name = None
            import gc
            gc.collect()
            logger.info("Local model unloaded")


class LMStudioClient(BaseModelClient):
    """
    LM Studio API client for local inference.
    LM Studio provides an OpenAI-compatible API.
    """

    def __init__(self):
        self.base_url = os.getenv("LM_STUDIO_URL", "http://localhost:1234/v1")
        self.enabled = os.getenv("LM_STUDIO_ENABLED", "false").lower() == "true"

    async def is_available(self) -> bool:
        """Check if LM Studio is running."""
        if not self.enabled:
            return False
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/models",
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
        """Generate completion via LM Studio (OpenAI-compatible API)."""
        import time
        start_time = time.time()

        payload = {
            "model": model or "local-model",
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": temperature,
            "stream": stream
        }

        if max_tokens:
            payload["max_tokens"] = max_tokens

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=300)
            ) as response:
                if response.status != 200:
                    error = await response.text()
                    raise Exception(f"LM Studio API error: {error}")

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
                        provider=ModelProvider.LM_STUDIO,
                        tokens_used={
                            "input": data.get("usage", {}).get("prompt_tokens", 0),
                            "output": data.get("usage", {}).get("completion_tokens", 0)
                        },
                        finish_reason=choice.get("finish_reason"),
                        latency_ms=(time.time() - start_time) * 1000,
                        metadata={"local": True, "offline_capable": True}
                    )


class KIAANModelProvider:
    """
    Unified model provider for KIAAN with full offline support.

    Features:
    - Automatic provider selection
    - Intelligent fallback chain (cloud → local)
    - Cost optimization
    - Model capability matching
    - FULL OFFLINE SUPPORT via local models
    - Automatic connectivity detection
    """

    def __init__(self):
        self.clients: dict[ModelProvider, BaseModelClient] = {
            ModelProvider.OPENAI: OpenAIClient(),
            ModelProvider.ANTHROPIC: AnthropicClient(),
            ModelProvider.GOOGLE: GoogleClient(),
            ModelProvider.OLLAMA: OllamaClient(),
            ModelProvider.LOCAL: LocalLLMClient(),
            ModelProvider.LM_STUDIO: LMStudioClient(),
        }

        # Connectivity checker for offline detection
        self.connectivity = connectivity_checker
        self.local_registry = local_model_registry

        # Default model preferences
        self.default_model = "gpt-4o-mini"
        self.reasoning_model = "claude-3-5-sonnet"
        self.code_model = "gpt-4o"
        self.fast_model = "gemini-flash"

        # Offline fallback models
        self.offline_default_model = "mistral-7b-local"
        self.offline_fast_model = "phi-3-mini-local"

        # Fallback chain - now includes local models for offline support
        self.fallback_chain = [
            "gpt-4o-mini",           # Primary (cloud)
            "claude-3-haiku",        # Fast fallback (cloud)
            "gemini-flash",          # Another fast option (cloud)
            "mistral-7b",            # Ollama (local server)
            "mistral-7b-local",      # Direct local (no internet)
            "phi-3-mini-local",      # Lightweight local (no internet)
            "tinyllama-1.1b-local",  # Ultra-lightweight (no internet)
        ]

        # Offline-only fallback chain (used when no internet)
        self.offline_fallback_chain = [
            "mistral-7b-local",
            "llama-3-8b-local",
            "phi-3-mini-local",
            "qwen-2-7b-local",
            "lm-studio-default",  # LM Studio if running
            "mistral-7b",         # Ollama fallback
        ]

    async def initialize(self) -> dict[str, Any]:
        """Initialize provider and check availability of all services."""
        # Check connectivity
        status = await self.connectivity.check_connectivity()

        # Check provider availability
        availability = {}
        for provider, client in self.clients.items():
            try:
                availability[provider.value] = await client.is_available()
            except Exception as e:
                logger.warning(f"Error checking {provider.value}: {e}")
                availability[provider.value] = False

        # Scan local models
        local_models = self.local_registry.scan_models()

        return {
            "connectivity": status.value,
            "providers": availability,
            "local_models_count": len(local_models),
            "local_models": list(local_models.keys()),
            "offline_capable": self.is_offline_capable(),
        }

    def is_offline_capable(self) -> bool:
        """Check if offline operation is possible."""
        # Check if local GGUF models are available via llama.cpp
        has_local = LLAMA_CPP_AVAILABLE and self.local_registry.has_any_model()
        # Note: Ollama availability requires an async check, so we only
        # report it as offline-capable if local models are confirmed.
        # Ollama will still be tried at runtime via the fallback chain.
        return has_local

    async def get_best_available_model(self, prefer_local: bool = False) -> str:
        """Get the best currently available model."""
        if prefer_local or self.connectivity.is_offline():
            # Check local models first
            if await self.clients[ModelProvider.LOCAL].is_available():
                best_local = self.local_registry.get_best_available_model()
                if best_local:
                    return best_local

            # Check Ollama
            if await self.clients[ModelProvider.OLLAMA].is_available():
                return "mistral-7b"

            # Check LM Studio
            if await self.clients[ModelProvider.LM_STUDIO].is_available():
                return "lm-studio-default"

        # Online mode - use cloud models
        for model in self.fallback_chain:
            config = self.get_model_config(model)
            if config:
                client = self.clients.get(config.provider)
                if client and await client.is_available():
                    return model

        # Last resort - return whatever local model we have
        return self.offline_default_model

    # NOTE: initialize() is defined above (line ~1402) with full connectivity
    # checks, local model scanning, and rich status reporting.
    # A duplicate bare-bones definition was removed here to prevent silent override.

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
        fallback: bool = True,
        prefer_local: bool = False
    ) -> AsyncGenerator[str, None] | ModelResponse:
        """
        Generate a completion using the specified or best available model.

        Automatically handles offline scenarios by falling back to local models.

        Args:
            messages: List of messages
            model: Model to use (optional, will select automatically)
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            stream: Whether to stream the response
            functions: Function schemas for tool use
            fallback: Whether to try fallback models on failure
            prefer_local: Prefer local models even when online

        Yields/Returns:
            Streamed text chunks or ModelResponse
        """
        # Check connectivity and adjust model selection
        is_offline = self.connectivity.is_offline()

        if is_offline or prefer_local:
            # Use offline fallback chain
            chain = self.offline_fallback_chain
            model = model or self.offline_default_model
            logger.info(f"Using offline mode with model: {model}")
        else:
            chain = self.fallback_chain
            model = model or self.default_model

        config = self.get_model_config(model)

        # If model not found, try to find best available
        if not config:
            best_model = await self.get_best_available_model(prefer_local=is_offline or prefer_local)
            config = self.get_model_config(best_model)
            model = best_model
            logger.info(f"Using best available model: {model}")

        if not config:
            raise ValueError(f"No model available")

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
        for fallback_model in chain:
            if fallback_model == model:
                continue

            fallback_config = self.get_model_config(fallback_model)
            if not fallback_config:
                # For local models, try to find by pattern
                if "local" in fallback_model:
                    best_local = self.local_registry.get_best_available_model()
                    if best_local:
                        fallback_config = ModelConfig(
                            provider=ModelProvider.LOCAL,
                            model_id=best_local,
                            display_name=f"Local: {best_local}",
                            max_tokens=4096,
                            context_window=4096,
                            capabilities=[ModelCapability.CHAT],
                            cost_per_1k_input=0,
                            cost_per_1k_output=0,
                        )
                else:
                    continue

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

        # Final fallback - emergency local response
        logger.error("All models failed - returning emergency fallback")
        yield ModelResponse(
            content="I apologize, but I'm currently unable to process your request. All AI providers are unavailable. Please check your internet connection or ensure local models are installed.",
            model="emergency-fallback",
            provider=ModelProvider.LOCAL,
            tokens_used={"input": 0, "output": 0},
            finish_reason="error",
            metadata={"error": "All models unavailable", "offline": is_offline}
        )

    async def complete_offline(
        self,
        messages: list[Message],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
    ) -> AsyncGenerator[str | ModelResponse, None]:
        """
        Force completion using only local/offline models.
        Useful for air-gapped environments or when minimizing API costs.
        """
        async for result in self.complete(
            messages=messages,
            model=model or self.offline_default_model,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream,
            prefer_local=True
        ):
            yield result

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


def get_kiaan_provider() -> KIAANModelProvider:
    """Factory function to get the singleton KIAAN model provider instance."""
    return kiaan_model_provider


# Export
__all__ = [
    # Main provider
    "KIAANModelProvider",
    "kiaan_model_provider",
    "get_kiaan_provider",

    # Enums
    "ModelProvider",
    "ModelCapability",
    "ConnectionStatus",

    # Data classes
    "ModelConfig",
    "ModelResponse",
    "Message",
    "LocalModelInfo",

    # Model registry
    "AVAILABLE_MODELS",

    # Connectivity & Local Support
    "ConnectivityChecker",
    "connectivity_checker",
    "LocalModelRegistry",
    "local_model_registry",

    # Clients
    "BaseModelClient",
    "OpenAIClient",
    "AnthropicClient",
    "GoogleClient",
    "OllamaClient",
    "LocalLLMClient",
    "LMStudioClient",

    # Constants
    "LLAMA_CPP_AVAILABLE",
    "HUGGINGFACE_HUB_AVAILABLE",
]
