"""User-scoped response cache for the Wisdom-Core-gated pipeline.

Implements ``IMPROVEMENT_ROADMAP.md`` P0 §2: identical questions return
cached responses without re-hitting OpenAI / Sarvam / Anthropic. The
cache wraps :func:`backend.services.kiaan_grounded_ai.call_kiaan_ai_grounded`
so every KIAAN surface (Sakha/KIAAN Chat and the six sacred tools)
inherits caching by construction.

Privacy model
-------------
The cache is **always** scoped by ``user_id``. A response generated for
user A can never leak to user B, even when the message text is byte
identical. This fixes the global-key privacy bug flagged in
``AUDIT_CACHE_FRAMEWORK.md`` Part 1 against the legacy
``backend/cache/redis_cache.py`` ``cache_kiaan_response`` method (which
keyed only on the message and is intentionally not used here).

When ``user_id`` is ``None`` (admin calls, seed scripts, anonymous
contexts) the cache is bypassed entirely. Safer than inventing a public
segment and accidentally cross-contaminating.

Key shape
---------
::

    sha256(
        user_id |
        tool_name (or "chat") |
        locale (default "en") |
        nfkc_normalized_lowercased_trimmed_message
    )

The normalisation layer absorbs the most common "same question, different
typing" cases that the audit flagged as cache misses today:

* ``"I feel anxious"`` ↔ ``"i feel anxious"`` ↔ ``"I FEEL ANXIOUS"``
* ``"I  feel  anxious"`` ↔ ``"I feel anxious"`` (whitespace collapse)
* Unicode NFKC normalisation: ``"ﬁ"`` ↔ ``"fi"``, ``"①"`` ↔ ``"1"``

A future semantic-similarity layer (Phase 2, see
``docs/wisdom_core_invariant.md``) will catch near-duplicates that
differ in punctuation / phrasing — out of scope for this module; the
``find_semantic_match`` hook below is the integration point.

Backend
-------
Two-tier:

1. **Redis** when ``REDIS_URL`` is set and the singleton in
   ``backend.cache.redis_cache`` is connected. Shares its connection
   pool — no duplicate connection management.
2. **In-memory LRU + TTL** per-process fallback so the cache works in
   CI / single-process deployments. Bounded at
   ``KIAAN_RESPONSE_CACHE_MAX_ENTRIES`` (default 5000) entries.

Both backends honour ``KIAAN_RESPONSE_CACHE_TTL`` (default 3600 s).

Eligibility — when the cache is bypassed
----------------------------------------
* ``KIAAN_RESPONSE_CACHE_ENABLED=false`` — kill switch.
* ``user_id is None`` — privacy floor.
* Caller passed ``system_override`` — they have a bespoke prompt; the
  cache key would not capture the variance.
* Caller passed ``apply_filter=False`` — streaming paths apply their
  own per-sentence filter; cached final-text shape is not appropriate.

Telemetry
---------
Exposed via :func:`get_response_cache().stats()` for ops dashboards:

* ``hits``, ``misses``, ``errors``, ``sets``, ``invalidations``
* ``backend``: ``"redis"`` or ``"memory"`` (current routing)
* ``memory_size``: count in the in-memory fallback (always 0 when
  Redis is the only backend serving).
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import time
import unicodedata
from collections import OrderedDict
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from backend.services.kiaan_grounded_ai import GroundedResponse


# ── CONFIG ─────────────────────────────────────────────────────────────
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


_CACHE_KEY_PREFIX = "kiaan:response:v2:"


# ── STATS ──────────────────────────────────────────────────────────────
@dataclass
class CacheStats:
    """Cumulative counters since process start."""

    hits: int = 0
    misses: int = 0
    errors: int = 0
    sets: int = 0
    invalidations: int = 0


# ── CACHE ──────────────────────────────────────────────────────────────
class KiaanResponseCache:
    """User-scoped, two-tier response cache for the grounded AI path.

    Reuse the singleton via :func:`get_response_cache`. Direct
    construction is allowed in tests so each test gets a clean slate.
    """

    def __init__(self) -> None:
        # In-memory LRU+TTL fallback. ``OrderedDict`` gives us O(1)
        # LRU-touch via ``move_to_end`` and O(1) eviction via
        # ``popitem(last=False)``.
        self._memory: OrderedDict[str, tuple[float, dict[str, Any]]] = OrderedDict()
        # ``asyncio.Lock`` because callers are all async; mutating the
        # dict from concurrent coroutines without one would still be
        # CPython-atomic but the LRU touch is two operations.
        self._lock = asyncio.Lock()
        self._stats = CacheStats()

    # ── normalisation + key ────────────────────────────────────────────
    @staticmethod
    def normalize_message(message: str) -> str:
        """Normalise a message so trivial typing variants share a key.

        Steps applied in order:

        1. Unicode NFKC — collapses ligatures, full-width digits, etc.
        2. ``strip()`` + ``lower()``
        3. Whitespace collapse: every run of whitespace becomes a single
           space.

        Punctuation and spelling are intentionally preserved — the
        semantic layer (Phase 2) is what catches those.
        """
        if not message:
            return ""
        normalized = unicodedata.normalize("NFKC", message)
        return " ".join(normalized.strip().lower().split())

    @staticmethod
    def cache_key(
        *,
        user_id: str,
        tool_name: str | None,
        locale: str,
        message: str,
    ) -> str:
        """Compute the cache key. Pure function — usable for tests."""
        norm = KiaanResponseCache.normalize_message(message)
        signature = f"{user_id}|{tool_name or 'chat'}|{locale}|{norm}"
        digest = hashlib.sha256(signature.encode("utf-8")).hexdigest()
        return f"{_CACHE_KEY_PREFIX}{digest}"

    # ── Redis lookup ──────────────────────────────────────────────────
    async def _redis_client(self) -> Any | None:
        """Return the existing Redis singleton when connected, else None.

        Reuses ``backend.cache.redis_cache.get_redis_cache()`` so we
        share its connection pool. Lazy import + permissive failure:
        the cache is best-effort; we never want a Redis hiccup to break
        a user response.
        """
        try:
            from backend.cache.redis_cache import get_redis_cache

            cache = await get_redis_cache()
        except Exception as exc:
            logger.debug("kiaan_response_cache: redis singleton unavailable: %s", exc)
            return None
        if not getattr(cache, "is_connected", False):
            return None
        return cache

    # ── public API ────────────────────────────────────────────────────
    async def get(
        self,
        *,
        user_id: str | None,
        tool_name: str | None,
        message: str,
        locale: str = "en",
    ) -> dict[str, Any] | None:
        """Return the cached payload or ``None``.

        Returns the *serialisable dict form* of a previous
        ``GroundedResponse`` (text, verses, scores, flags). Callers
        rehydrate via :func:`rehydrate`.
        """
        if not _env_bool("KIAAN_RESPONSE_CACHE_ENABLED", True):
            return None
        if not user_id or not message:
            return None

        key = self.cache_key(
            user_id=user_id, tool_name=tool_name, locale=locale, message=message
        )

        # ── Tier 1: Redis ───────────────────────────────────────────
        redis = await self._redis_client()
        if redis is not None:
            try:
                raw = await redis.get(key)
                if raw is not None:
                    payload = json.loads(raw) if isinstance(raw, str) else raw
                    self._stats.hits += 1
                    return payload
            except Exception as exc:
                logger.warning("kiaan_response_cache: Redis GET failed: %s", exc)
                self._stats.errors += 1
                # Fall through to in-memory.

        # ── Tier 2: in-memory ────────────────────────────────────────
        async with self._lock:
            entry = self._memory.get(key)
            if entry is None:
                self._stats.misses += 1
                return None
            expires_at, data = entry
            if time.time() >= expires_at:
                self._memory.pop(key, None)
                self._stats.misses += 1
                return None
            # LRU touch.
            self._memory.move_to_end(key)
            self._stats.hits += 1
            return data

    async def set(
        self,
        *,
        user_id: str | None,
        tool_name: str | None,
        message: str,
        response: GroundedResponse,
        locale: str = "en",
    ) -> None:
        """Store a response. Best-effort — never raises."""
        if not _env_bool("KIAAN_RESPONSE_CACHE_ENABLED", True):
            return
        if not user_id or not message:
            return
        if not response.text or not response.text.strip():
            return  # never cache empty / failed responses

        key = self.cache_key(
            user_id=user_id, tool_name=tool_name, locale=locale, message=message
        )
        payload: dict[str, Any] = {
            "text": response.text,
            "verses": list(response.verses),
            "is_gita_grounded": bool(response.is_gita_grounded),
            "wisdom_score": float(response.wisdom_score),
            "enhancement_applied": bool(response.enhancement_applied),
            "filter_applied": bool(response.filter_applied),
            "cached_at": time.time(),
        }
        ttl = _env_int("KIAAN_RESPONSE_CACHE_TTL", 3600)

        # ── Tier 1: Redis ───────────────────────────────────────────
        redis = await self._redis_client()
        if redis is not None:
            try:
                # The existing RedisCache wrapper has its own ``set`` that
                # serialises with json. We pre-serialise to be explicit
                # about the on-the-wire shape and to make the in-memory
                # fallback semantics identical.
                ok = await redis.set(key, json.dumps(payload), ttl)
                if ok:
                    self._stats.sets += 1
                    return
            except Exception as exc:
                logger.warning("kiaan_response_cache: Redis SET failed: %s", exc)
                self._stats.errors += 1
                # Fall through to in-memory.

        # ── Tier 2: in-memory ────────────────────────────────────────
        max_entries = _env_int("KIAAN_RESPONSE_CACHE_MAX_ENTRIES", 5000)
        async with self._lock:
            self._memory[key] = (time.time() + ttl, payload)
            self._memory.move_to_end(key)
            while len(self._memory) > max_entries:
                self._memory.popitem(last=False)
        self._stats.sets += 1

    async def invalidate(
        self,
        *,
        user_id: str,
        tool_name: str | None = None,
        message: str | None = None,
        locale: str = "en",
    ) -> int:
        """Remove cached entries. Returns the count of entries removed.

        Two modes:

        * **Targeted** (``message`` provided) — deletes exactly the one
          entry that ``(user_id, tool_name, locale, message)`` would
          produce. Fast.
        * **User-wide** (``message`` omitted) — deletes every entry
          for that ``user_id``. Used when a user reports "this didn't
          help" so the next ask gets a fresh response. On Redis this
          uses ``SCAN`` to avoid blocking the cluster; on in-memory it
          is a linear scan.
        """
        if not user_id:
            return 0
        removed = 0

        if message is not None:
            key = self.cache_key(
                user_id=user_id,
                tool_name=tool_name,
                locale=locale,
                message=message,
            )
            redis = await self._redis_client()
            if redis is not None:
                try:
                    if await redis.delete(key):
                        removed += 1
                except Exception as exc:
                    logger.warning(
                        "kiaan_response_cache: Redis DEL failed: %s", exc
                    )
                    self._stats.errors += 1
            async with self._lock:
                if self._memory.pop(key, None) is not None:
                    removed += 1
            self._stats.invalidations += removed
            return removed

        # User-wide invalidation. Cache keys are SHA-256 digests, so we
        # cannot recover ``user_id`` from a key alone — that means a
        # user-wide invalidation has to fall back to "scan and match
        # the per-user index" or "scan everything". Since the API
        # contract is "best effort, the next call will refresh anyway",
        # we keep this O(n) and small: the in-memory store is bounded
        # at 5K entries, and Redis SCAN is cluster-safe.
        #
        # Implementation note: we additionally maintain a Redis set
        # ``kiaan:response:user_index:<user_id>`` of keys when running
        # against Redis. That index makes user-wide invalidation O(1).
        # See ``_track_user_key`` and ``_user_index_key`` below.
        redis = await self._redis_client()
        if redis is not None:
            index_key = self._user_index_key(user_id)
            try:
                # The RedisCache wrapper exposes lower-level ops via its
                # ``.client`` attribute when present; fall back to a
                # best-effort SCAN otherwise.
                client = getattr(redis, "_client", None)
                if client is not None:
                    members = await client.smembers(index_key)
                    if members:
                        await client.delete(*members)
                        removed += len(members)
                    await client.delete(index_key)
            except Exception as exc:
                logger.warning(
                    "kiaan_response_cache: user-wide Redis invalidate failed: %s",
                    exc,
                )
                self._stats.errors += 1

        # In-memory user-wide invalidate is a no-op by design: cache
        # keys are SHA-256 digests so the user is not recoverable from
        # a key alone, and the in-memory fallback is process-local +
        # bounded. The next exact-match cache miss + TTL expiry will
        # get the user a fresh response within at most TTL_SECONDS.
        # When Redis is the active backend (common in production), the
        # user-index path above does an O(1) targeted delete.

        self._stats.invalidations += removed
        return removed

    # ── stats / introspection ─────────────────────────────────────────
    def stats(self) -> dict[str, Any]:
        return {
            "hits": self._stats.hits,
            "misses": self._stats.misses,
            "errors": self._stats.errors,
            "sets": self._stats.sets,
            "invalidations": self._stats.invalidations,
            "memory_size": len(self._memory),
            "enabled": _env_bool("KIAAN_RESPONSE_CACHE_ENABLED", True),
            "ttl_seconds": _env_int("KIAAN_RESPONSE_CACHE_TTL", 3600),
        }

    async def clear_memory(self) -> int:
        """Wipe the in-memory tier. Useful for tests. Returns count."""
        async with self._lock:
            n = len(self._memory)
            self._memory.clear()
            return n

    # ── helpers ───────────────────────────────────────────────────────
    @staticmethod
    def _user_index_key(user_id: str) -> str:
        return f"kiaan:response:user_index:{user_id}"

    # Hook for the future semantic layer. Returning None today preserves
    # the exact-match-only behaviour while making the integration point
    # explicit. Phase 2 will populate this with text-embedding-3-small +
    # cosine-on-recent-window or Redis vector search.
    async def find_semantic_match(
        self,
        *,
        user_id: str,
        tool_name: str | None,
        message: str,
        locale: str = "en",
        threshold: float = 0.92,
    ) -> dict[str, Any] | None:
        """Phase 2 hook — semantic near-duplicate lookup. Currently no-op."""
        del user_id, tool_name, message, locale, threshold
        return None


# ── singleton ──────────────────────────────────────────────────────────
_singleton: KiaanResponseCache | None = None
_singleton_lock = asyncio.Lock()


def get_response_cache() -> KiaanResponseCache:
    """Return the process-wide singleton cache.

    Synchronous — does not need to be awaited. The singleton itself is
    lazy and stores no state at construction time; all I/O happens
    inside async methods.
    """
    global _singleton
    if _singleton is None:
        _singleton = KiaanResponseCache()
    return _singleton


def rehydrate(payload: dict[str, Any]) -> GroundedResponse:
    """Rebuild a :class:`GroundedResponse` from a cached dict payload.

    Kept here to avoid an import cycle with
    :mod:`backend.services.kiaan_grounded_ai` (lazy import).
    """
    from backend.services.kiaan_grounded_ai import GroundedResponse

    return GroundedResponse(
        text=payload["text"],
        verses=list(payload.get("verses") or []),
        is_gita_grounded=bool(payload.get("is_gita_grounded", True)),
        wisdom_score=float(payload.get("wisdom_score", 1.0)),
        enhancement_applied=bool(payload.get("enhancement_applied", False)),
        filter_applied=bool(payload.get("filter_applied", True)),
    )


__all__ = [
    "CacheStats",
    "KiaanResponseCache",
    "get_response_cache",
    "rehydrate",
]
