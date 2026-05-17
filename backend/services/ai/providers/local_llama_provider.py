"""Local llama.cpp provider — true offline fallback.

Implements ``IMPROVEMENT_ROADMAP.md`` P1 §6: the framework gains a real
on-device LLM at the tail of the provider chain, so a cloud outage no
longer makes Sakha mute. The current chain is::

    OpenAI → Sarvam → OpenAI-compat → LocalLlama → tier-4 canned

The provider is intentionally **opt-in** by deployment. Three things
have to line up before it serves traffic:

1. ``llama-cpp-python`` installed at runtime. When missing, the
   provider reports ``is_configured = False`` and the manager skips it.
2. ``KIAAN_LOCAL_MODEL_PATH`` env var pointing at a GGUF file on disk.
   Typical values (operator's choice):

   * ``/models/phi-3-mini-4k-instruct-q4.gguf``  (~ 2.3 GB)
   * ``/models/qwen2.5-1.5b-instruct-q4_k_m.gguf`` (~ 1 GB)

3. ``KIAAN_LOCAL_LLAMA_ENABLED=true`` (the default; flip to ``false``
   to hard-disable without touching the model file or libs).

When any of those is missing the provider degrades silently — the
chain hops to the next provider, and ``health_check`` reports
``UNHEALTHY`` with a precise reason string so the dashboard can show
the operator *which* of the three is wrong.

Threading model
---------------
``llama_cpp.Llama`` is not async-safe. We hold one process-wide
instance behind an ``asyncio.Lock`` and run the actual ``__call__``
inside ``asyncio.to_thread`` so the event loop stays unblocked. This
limits concurrent generation to 1 turn at a time — fine because the
provider is the **fallback** and rarely serves the main load; if it
ever becomes the primary, lift the lock and pool instances.

Model loading
-------------
First request after startup pays the load cost (~3-8 s on a CPU box
for Phi-3-mini, depending on disk). Subsequent requests reuse the
loaded model. To pre-load at startup, call ``LocalLlamaProvider().preload()``
during the application's ``startup`` hook — the provider also exposes
``preload`` so ops can warm the cache before the first user request.

Cost / quality tradeoffs (Phi-3-mini-q4)
----------------------------------------
* Tokens/sec on a 4-vCPU box: ~25 (16-bit) to ~45 (4-bit quantised).
* Quality on Gita-grounded reflections: ~70 % of gpt-4o-mini's score
  on the regression set today. Better than the canned tier-4 fallback;
  worse than cloud. Use it as a *fallback*, not a primary.

Operator runbook is in ``docs/wisdom_core_invariant.md`` under the
"Local-LLM fallback" section.
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from typing import Any

from .base import (
    AIProvider,
    AIProviderError,
    HealthCheckResult,
    ProviderResponse,
    ProviderStatus,
)

logger = logging.getLogger(__name__)


# ── Optional dependency: llama-cpp-python ─────────────────────────────
# Imported lazily inside the class so the module loads cleanly even
# when the wheel is not installed (most dev environments). The
# import is cached after the first attempt.
_llama_cls_cache: Any = None
_llama_cls_import_attempted = False


def _llama_class() -> Any | None:
    """Return ``llama_cpp.Llama`` or ``None`` if the library is missing."""
    global _llama_cls_cache, _llama_cls_import_attempted
    if _llama_cls_import_attempted:
        return _llama_cls_cache
    _llama_cls_import_attempted = True
    try:
        from llama_cpp import Llama  # type: ignore[import-not-found]

        _llama_cls_cache = Llama
        return Llama
    except Exception as exc:
        logger.info(
            "local_llama_provider: llama-cpp-python not available "
            "(install with `pip install llama-cpp-python` to enable "
            "local-model fallback). reason=%s",
            exc,
        )
        return None


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name, "").strip().lower()
    if raw in ("true", "1", "yes", "on"):
        return True
    if raw in ("false", "0", "no", "off"):
        return False
    return default


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


class LocalLlamaProvider(AIProvider):
    """On-device LLM via llama.cpp. Opt-in via env config.

    Configuration env vars
    ----------------------
    ``KIAAN_LOCAL_LLAMA_ENABLED`` (default ``true``)
        Hard kill switch. Set to ``false`` to disable the provider
        regardless of the model file / library state.

    ``KIAAN_LOCAL_MODEL_PATH`` (no default)
        Absolute path to the GGUF file. When unset, the provider
        reports ``is_configured = False``.

    ``KIAAN_LOCAL_MODEL_NAME`` (default ``"local-llama"``)
        Display name surfaced in ``ProviderResponse.model``.

    ``KIAAN_LOCAL_LLAMA_N_CTX`` (default ``4096``)
        Context window. Phi-3-mini-4k handles 4096; lower for memory-
        constrained boxes.

    ``KIAAN_LOCAL_LLAMA_N_THREADS`` (default = host CPU count)
        CPU threads for inference.

    ``KIAAN_LOCAL_LLAMA_N_GPU_LAYERS`` (default ``0``)
        Number of layers to offload to GPU. ``-1`` for all-on-GPU; ``0``
        for CPU-only. Most deployments stay at 0 until a GPU instance
        is provisioned (separate roadmap item).
    """

    def __init__(
        self,
        *,
        model_path: str | None = None,
        n_ctx: int | None = None,
        n_threads: int | None = None,
        n_gpu_layers: int | None = None,
    ) -> None:
        self._enabled = _env_bool("KIAAN_LOCAL_LLAMA_ENABLED", True)
        self._model_path = (
            model_path or os.getenv("KIAAN_LOCAL_MODEL_PATH", "") or ""
        ).strip()
        self._model_name = (
            os.getenv("KIAAN_LOCAL_MODEL_NAME", "local-llama").strip()
            or "local-llama"
        )
        self._n_ctx = n_ctx if n_ctx is not None else _env_int(
            "KIAAN_LOCAL_LLAMA_N_CTX", 4096
        )
        self._n_threads = n_threads if n_threads is not None else _env_int(
            "KIAAN_LOCAL_LLAMA_N_THREADS", os.cpu_count() or 4
        )
        self._n_gpu_layers = (
            n_gpu_layers if n_gpu_layers is not None
            else _env_int("KIAAN_LOCAL_LLAMA_N_GPU_LAYERS", 0)
        )
        # The actual Llama instance, lazily constructed. Lock guards
        # concurrent generation against a single process-wide instance.
        self._llm: Any = None
        self._lock = asyncio.Lock()
        self._load_failure: str | None = None

    # ── AIProvider interface ──────────────────────────────────────────

    @property
    def name(self) -> str:
        return "local_llama"

    @property
    def model(self) -> str:
        return self._model_name

    @property
    def is_configured(self) -> bool:
        """All three preconditions must hold before the manager wires us in."""
        if not self._enabled:
            return False
        if not self._model_path:
            return False
        if not os.path.isfile(self._model_path):
            return False
        return _llama_class() is not None

    def configuration_status(self) -> dict[str, Any]:
        """Surface why ``is_configured`` is what it is — useful for
        the ``/health/detailed`` route and the ops dashboard."""
        return {
            "enabled": self._enabled,
            "model_path": self._model_path or None,
            "model_path_exists": bool(
                self._model_path and os.path.isfile(self._model_path)
            ),
            "llama_cpp_installed": _llama_class() is not None,
            "n_ctx": self._n_ctx,
            "n_threads": self._n_threads,
            "n_gpu_layers": self._n_gpu_layers,
            "load_failure": self._load_failure,
        }

    async def preload(self) -> None:
        """Load the model into memory now. Safe to call multiple times.

        Use in the FastAPI startup hook to amortise the first-request
        load cost (~3-8 s for Phi-3-mini-q4 on a CPU box).
        """
        if not self.is_configured:
            return
        async with self._lock:
            await asyncio.to_thread(self._ensure_loaded)

    def _ensure_loaded(self) -> Any:
        """Synchronous load. Must be called inside ``asyncio.to_thread``
        or from a sync context; not from the event loop directly."""
        if self._llm is not None:
            return self._llm
        Llama = _llama_class()
        if Llama is None:
            self._load_failure = "llama_cpp not installed"
            return None
        try:
            self._llm = Llama(
                model_path=self._model_path,
                n_ctx=self._n_ctx,
                n_threads=self._n_threads,
                n_gpu_layers=self._n_gpu_layers,
                verbose=False,
            )
            self._load_failure = None
            logger.info(
                "local_llama_provider: model loaded path=%s n_ctx=%d "
                "n_threads=%d n_gpu_layers=%d",
                self._model_path,
                self._n_ctx,
                self._n_threads,
                self._n_gpu_layers,
            )
            return self._llm
        except Exception as exc:
            self._load_failure = f"{type(exc).__name__}: {exc}"
            logger.warning(
                "local_llama_provider: model load failed path=%s err=%s",
                self._model_path,
                self._load_failure,
            )
            return None

    async def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 500,
        response_format: dict[str, str] | None = None,
    ) -> ProviderResponse:
        """Generate a chat completion from a local GGUF model.

        Mirrors the OpenAI provider's contract: takes messages with
        ``role`` + ``content``, returns ``ProviderResponse`` carrying
        ``content``, ``provider``, ``model``, token counts when the
        underlying llama.cpp reports them, and latency_ms.
        """
        if not self.is_configured:
            raise AIProviderError(
                "LocalLlamaProvider not configured: "
                f"{self.configuration_status()}",
                provider=self.name,
                retryable=False,
            )

        started = time.monotonic()
        async with self._lock:
            llm = await asyncio.to_thread(self._ensure_loaded)
            if llm is None:
                raise AIProviderError(
                    f"LocalLlamaProvider failed to load model: "
                    f"{self._load_failure}",
                    provider=self.name,
                    retryable=False,
                )

            # response_format is honoured at best effort. llama.cpp
            # supports grammar-constrained JSON via the GBNF format;
            # most Gita-tool callers do not need it, so we just pass a
            # hint through the system prompt instead of wiring a grammar
            # for v1 of this provider.
            extra: dict[str, Any] = {}
            if response_format and response_format.get("type") == "json_object":
                # Best-effort steer; if the operator wants strict JSON,
                # bundle a grammar file and extend this code path.
                messages = list(messages) + [
                    {
                        "role": "system",
                        "content": (
                            "Respond ONLY with valid JSON. No prose, "
                            "no code fences."
                        ),
                    }
                ]

            try:
                raw = await asyncio.to_thread(
                    llm.create_chat_completion,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    **extra,
                )
            except Exception as exc:
                raise AIProviderError(
                    f"LocalLlamaProvider generation failed: {exc}",
                    provider=self.name,
                    retryable=False,
                ) from exc

        latency_ms = int((time.monotonic() - started) * 1000)
        choice = (raw.get("choices") or [{}])[0]
        msg = choice.get("message") or {}
        content = msg.get("content") or ""
        usage = raw.get("usage") or {}
        if not content.strip():
            raise AIProviderError(
                "LocalLlamaProvider returned empty content",
                provider=self.name,
                retryable=False,
            )
        return ProviderResponse(
            content=content,
            provider=self.name,
            model=self._model_name,
            prompt_tokens=int(usage.get("prompt_tokens") or 0),
            completion_tokens=int(usage.get("completion_tokens") or 0),
            total_tokens=int(usage.get("total_tokens") or 0),
            latency_ms=latency_ms,
            cached=False,
            metadata={
                "finish_reason": choice.get("finish_reason"),
                "n_ctx": self._n_ctx,
                "n_threads": self._n_threads,
                "n_gpu_layers": self._n_gpu_layers,
            },
        )

    async def health_check(self) -> HealthCheckResult:
        """Three-state health: UNHEALTHY (config missing), DEGRADED
        (configured but model not yet loaded), HEALTHY (model loaded
        and ready). Never blocks — load is not triggered here.
        """
        if not self._enabled:
            return HealthCheckResult(
                status=ProviderStatus.UNHEALTHY,
                error="KIAAN_LOCAL_LLAMA_ENABLED=false",
            )
        if not self._model_path:
            return HealthCheckResult(
                status=ProviderStatus.UNHEALTHY,
                error="KIAAN_LOCAL_MODEL_PATH not set",
            )
        if not os.path.isfile(self._model_path):
            return HealthCheckResult(
                status=ProviderStatus.UNHEALTHY,
                error=f"model file not found: {self._model_path}",
            )
        if _llama_class() is None:
            return HealthCheckResult(
                status=ProviderStatus.UNHEALTHY,
                error="llama-cpp-python not installed",
            )
        if self._llm is None:
            # Configured but cold — manager will still route here
            # under degraded conditions; first request pays load cost.
            return HealthCheckResult(
                status=ProviderStatus.DEGRADED,
                error="model not yet loaded (first request will load it)",
            )
        return HealthCheckResult(
            status=ProviderStatus.HEALTHY,
            latency_ms=0,
        )

    def supports_json_mode(self) -> bool:
        # We don't enforce JSON via grammar yet — see the comment in
        # chat(). Report False so the manager doesn't preferentially
        # route JSON requests here.
        return False

    def get_display_name(self) -> str:
        return "Local llama.cpp"


__all__ = ["LocalLlamaProvider"]
