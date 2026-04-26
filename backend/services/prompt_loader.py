"""Sakha prompt loader — versioned, cached, drift-detecting.

Every voice / text turn loads a Sakha persona prompt. The spec is explicit:

  • prompts are read from disk, NOT inlined in code
  • prompts are versioned (prompts/persona-version)
  • prompts are NEVER edited in production — bump the version, regression-test
    against prompts/sakha.regression.jsonl, then deploy

This module enforces those invariants at runtime:

  • Loads + caches prompts at first access (one disk read per process)
  • Computes a SHA-256 hash of the file contents at load time
  • If the file changes after load, subsequent get_persona() calls log a
    DRIFT WARNING and continue to serve the originally-loaded version
    (so a hot-edit in prod cannot quietly change Sakha's behavior)
  • Exposes load_regression_set() for the offline regression runner

Public API:
  • get_persona_version() -> str
  • get_persona(render_mode: "voice" | "text") -> PersonaPrompt
  • get_prompt_text(render_mode) -> str           (convenience)
  • load_regression_set() -> list[RegressionCase]
  • reset_cache_for_tests() -> None               (test-only, raises in prod)
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import threading
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

logger = logging.getLogger(__name__)


# ─── Paths ────────────────────────────────────────────────────────────────
# Resolved relative to the repo root so the loader works regardless of cwd.
# repo_root = /home/user/MindVibe (parent of `backend/`)
_REPO_ROOT = Path(__file__).resolve().parents[2]
_PROMPTS_DIR = _REPO_ROOT / "prompts"

PERSONA_VERSION_FILE = _PROMPTS_DIR / "persona-version"
SAKHA_VOICE_PROMPT = _PROMPTS_DIR / "sakha.voice.openai.md"
SAKHA_TEXT_PROMPT = _PROMPTS_DIR / "sakha.text.openai.md"
SAKHA_REGRESSION_FILE = _PROMPTS_DIR / "sakha.regression.jsonl"


RenderMode = Literal["voice", "text"]


# ─── Errors ───────────────────────────────────────────────────────────────


class PromptLoaderError(RuntimeError):
    """Raised when the prompt files are missing, malformed, or unsafe to use."""


class PromptDriftError(RuntimeError):
    """Raised by reset_cache_for_tests() in non-test environments."""


# ─── Dataclasses ──────────────────────────────────────────────────────────


@dataclass(frozen=True)
class PersonaPrompt:
    """An immutable snapshot of a single persona prompt.

    The hash is computed at load time and pinned for the process lifetime.
    """

    render_mode: RenderMode
    persona_version: str
    text: str
    sha256: str
    source_path: str
    loaded_at_monotonic: float

    def matches_disk(self) -> bool:
        """True if the on-disk file still matches the cached snapshot.

        Used by drift detection — never use this to decide whether to reload.
        Drift warnings are logged but the cached prompt is still served, so a
        hot-edit in prod cannot silently change Sakha's behavior.
        """
        try:
            current = _hash_file(Path(self.source_path))
            return current == self.sha256
        except FileNotFoundError:
            return False


@dataclass(frozen=True)
class RegressionCase:
    """One row from sakha.regression.jsonl."""

    case_id: str
    engine: str            # "GUIDANCE" | "FRIEND" | "ASSISTANT" | "VOICE_GUIDE"
    mood: str              # canonical mood label
    language: str          # "en" | "hi" | "hi-en" | …
    user_latest: str
    retrieved_verses: list[dict]  # same shape the WSS handler builds
    expected_signals: list[str]   # filter signals expected to PASS (e.g. "BG 2.47")
    must_not_contain: list[str] = field(default_factory=list)
    description: str = ""


# ─── Internals ────────────────────────────────────────────────────────────


# Reentrant — get_persona() acquires the lock and then calls
# get_persona_version() which also acquires it. Non-reentrant Lock would
# deadlock on the first cold load.
_lock = threading.RLock()
_persona_version_cache: str | None = None
_prompt_cache: dict[RenderMode, PersonaPrompt] = {}


def _hash_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _read_persona_version() -> str:
    if not PERSONA_VERSION_FILE.exists():
        raise PromptLoaderError(
            f"Missing persona-version file at {PERSONA_VERSION_FILE}. "
            "Cannot start Sakha without a pinned persona-version — see "
            "prompts/sakha.voice.openai.md for the convention."
        )
    text = PERSONA_VERSION_FILE.read_text(encoding="utf-8").strip()
    if not text:
        raise PromptLoaderError(
            f"persona-version file at {PERSONA_VERSION_FILE} is empty"
        )
    # Loose semver check — we accept "1.0.0", "1.0.0-rc1", etc.
    if not text[0].isdigit():
        raise PromptLoaderError(
            f"persona-version {text!r} doesn't look like semver — refusing "
            "to start Sakha with an unpinnable persona."
        )
    return text


def _load_prompt_file(path: Path, render_mode: RenderMode, version: str) -> PersonaPrompt:
    if not path.exists():
        raise PromptLoaderError(
            f"Missing Sakha {render_mode} prompt at {path}. "
            "The voice mode WSS handler cannot start without it."
        )
    text = path.read_text(encoding="utf-8")
    if len(text) < 200:
        raise PromptLoaderError(
            f"Sakha {render_mode} prompt at {path} is suspiciously short "
            f"({len(text)} chars) — refusing to load. Is the file truncated?"
        )
    # Cross-check that the file declares the same persona-version.
    declared_version_marker = f"`{version}`"
    if declared_version_marker not in text and version not in text:
        raise PromptLoaderError(
            f"Sakha {render_mode} prompt at {path} does not declare "
            f"persona-version {version}. Bump the version everywhere together "
            "or roll the persona-version file back."
        )
    import time as _time
    return PersonaPrompt(
        render_mode=render_mode,
        persona_version=version,
        text=text,
        sha256=_hash_file(path),
        source_path=str(path),
        loaded_at_monotonic=_time.monotonic(),
    )


# ─── Public API ───────────────────────────────────────────────────────────


def get_persona_version() -> str:
    """Return the pinned persona-version. Cached after first call."""
    global _persona_version_cache
    if _persona_version_cache is None:
        with _lock:
            if _persona_version_cache is None:
                _persona_version_cache = _read_persona_version()
    return _persona_version_cache


def get_persona(render_mode: RenderMode) -> PersonaPrompt:
    """Return the cached persona prompt for a render mode.

    First call per render_mode reads from disk and pins. Subsequent calls
    return the same immutable instance. If the on-disk file has changed
    since the cache was populated, a DRIFT warning is logged but the
    originally-cached prompt is still returned — production must not
    silently switch personas mid-process.
    """
    if render_mode not in ("voice", "text"):
        raise ValueError(
            f"render_mode must be 'voice' or 'text', got {render_mode!r}"
        )

    cached = _prompt_cache.get(render_mode)
    if cached is not None:
        if not cached.matches_disk():
            logger.warning(
                "prompt-loader DRIFT: %s prompt on disk has changed since "
                "load — serving cached version=%s sha256=%s. "
                "If this is intentional, restart the process and bump "
                "persona-version.",
                render_mode,
                cached.persona_version,
                cached.sha256[:12],
            )
        return cached

    with _lock:
        cached = _prompt_cache.get(render_mode)
        if cached is not None:
            return cached

        version = get_persona_version()
        path = SAKHA_VOICE_PROMPT if render_mode == "voice" else SAKHA_TEXT_PROMPT
        loaded = _load_prompt_file(path, render_mode, version)
        _prompt_cache[render_mode] = loaded
        logger.info(
            "prompt-loader loaded %s persona-version=%s sha256=%s len=%d",
            render_mode,
            loaded.persona_version,
            loaded.sha256[:12],
            len(loaded.text),
        )
        return loaded


def get_prompt_text(render_mode: RenderMode) -> str:
    """Convenience wrapper — returns just the prompt text body."""
    return get_persona(render_mode).text


def load_regression_set() -> list[RegressionCase]:
    """Parse prompts/sakha.regression.jsonl into a list of RegressionCase.

    Used by scripts/run_sakha_regression.py and the Part 4e tests.
    Strict — any malformed row raises PromptLoaderError so a typo can't
    silently shrink the regression set.
    """
    if not SAKHA_REGRESSION_FILE.exists():
        raise PromptLoaderError(
            f"Regression set not found at {SAKHA_REGRESSION_FILE}"
        )
    cases: list[RegressionCase] = []
    seen_ids: set[str] = set()
    with SAKHA_REGRESSION_FILE.open(encoding="utf-8") as f:
        for line_num, raw in enumerate(f, start=1):
            line = raw.strip()
            if not line or line.startswith("#") or line.startswith("//"):
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError as e:
                raise PromptLoaderError(
                    f"{SAKHA_REGRESSION_FILE}:{line_num}: invalid JSON: {e}"
                ) from e
            try:
                case = RegressionCase(
                    case_id=row["case_id"],
                    engine=row["engine"],
                    mood=row["mood"],
                    language=row["language"],
                    user_latest=row["user_latest"],
                    retrieved_verses=row.get("retrieved_verses", []),
                    expected_signals=row.get("expected_signals", []),
                    must_not_contain=row.get("must_not_contain", []),
                    description=row.get("description", ""),
                )
            except KeyError as e:
                raise PromptLoaderError(
                    f"{SAKHA_REGRESSION_FILE}:{line_num}: missing field {e}"
                ) from e
            if case.case_id in seen_ids:
                raise PromptLoaderError(
                    f"{SAKHA_REGRESSION_FILE}:{line_num}: duplicate "
                    f"case_id {case.case_id!r}"
                )
            seen_ids.add(case.case_id)
            cases.append(case)
    return cases


# ─── Test helpers ─────────────────────────────────────────────────────────


def reset_cache_for_tests() -> None:
    """Test-only cache reset.

    Refuses to run unless KIAAN_PROMPT_LOADER_TEST=1 is set in the
    environment so a stray import in production cannot quietly drop the
    pinned persona cache."""
    if os.environ.get("KIAAN_PROMPT_LOADER_TEST") != "1":
        raise PromptDriftError(
            "reset_cache_for_tests() called outside test environment. "
            "Set KIAAN_PROMPT_LOADER_TEST=1 if this is intentional."
        )
    global _persona_version_cache
    _persona_version_cache = None
    _prompt_cache.clear()
