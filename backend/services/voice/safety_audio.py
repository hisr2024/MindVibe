"""Safety audio service — looks up + serves the pre-rendered Sakha
safety bundle (crisis_routing / quota_upgrade / silence_hum) per
language.

Until the human-asset pipeline drops real .opus files at
backend/static/voice/safety/, the slots are placeholder marker files
ending in `.opus.placeholder`. This service:

  • detects placeholders vs real audio
  • returns the right path or a placeholder signal
  • caches the lookup result in-memory (asset state changes only on
    deploy)
  • exposes a manifest endpoint the admin dashboard can use to see
    which slots are still empty

Mobile-side fallback: when a placeholder is detected the WSS handler
falls back to wisdom_engine._render_voice (the spoken-arc text path)
and lets the live TTS layer render it. Audible result: a single ~250ms
extra first-byte cost vs the cached clip.
"""

from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path

logger = logging.getLogger(__name__)

# Repo root resolved relative to this file: backend/services/voice/safety_audio.py
_REPO_ROOT = Path(__file__).resolve().parents[3]
MANIFEST_PATH = _REPO_ROOT / "prompts" / "safety_audio_manifest.json"
SAFETY_AUDIO_DIR = _REPO_ROOT / "backend" / "static" / "voice" / "safety"

VALID_CATEGORIES: frozenset[str] = frozenset({
    "crisis_routing", "quota_upgrade", "silence_hum",
})
VALID_LANGUAGES: frozenset[str] = frozenset({
    "en", "hi", "mr", "bn", "ta", "te", "pa", "gu", "kn", "ml",
})


class AssetStatus(StrEnum):
    REAL = "real"
    PLACEHOLDER = "placeholder"
    MISSING = "missing"


@dataclass(frozen=True)
class SafetyAudioResolution:
    """Result of resolving a (category, lang) request to a concrete file."""

    slot_id: str
    status: AssetStatus
    path: Path | None       # the actual file to serve (None when missing)
    real_path: Path         # where a real .opus would live
    placeholder_path: Path  # where the placeholder marker is
    voice_id: str
    expected_duration_sec: int
    sha256: str | None      # only set when status == REAL


# ─── Manifest loading (cached) ────────────────────────────────────────────


_manifest_cache: dict | None = None


def load_manifest() -> dict:
    """Load + cache the safety audio manifest. Raises if malformed."""
    global _manifest_cache
    if _manifest_cache is not None:
        return _manifest_cache
    if not MANIFEST_PATH.exists():
        raise RuntimeError(
            f"Safety audio manifest not found at {MANIFEST_PATH}. "
            "Run scripts/validate_safety_audio.py to bootstrap."
        )
    data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or "slots" not in data:
        raise RuntimeError(
            f"Safety audio manifest at {MANIFEST_PATH} is malformed: missing 'slots'."
        )
    _manifest_cache = data
    return data


def reset_manifest_cache_for_tests() -> None:
    """Test-only — recompute the manifest cache."""
    global _manifest_cache
    _manifest_cache = None


# ─── Resolver ─────────────────────────────────────────────────────────────


def resolve(category: str, lang: str) -> SafetyAudioResolution:
    """Resolve a (category, lang) to an asset state. Always returns a
    SafetyAudioResolution — callers branch on .status."""
    if category not in VALID_CATEGORIES:
        raise ValueError(f"Unknown safety audio category: {category!r}")
    normalized_lang = (lang or "en").lower().split("-")[0]
    if normalized_lang not in VALID_LANGUAGES:
        # Fall back to English — never want to fail a crisis lookup
        # because the user's locale is exotic.
        normalized_lang = "en"

    slot_id = f"{category}.{normalized_lang}"
    real_filename = f"{category}.{normalized_lang}.opus"
    real_path = SAFETY_AUDIO_DIR / real_filename
    placeholder_path = real_path.with_suffix(".opus.placeholder")

    # Find slot metadata
    manifest = load_manifest()
    slot_meta = next((s for s in manifest["slots"] if s["id"] == slot_id), None)
    voice_id = slot_meta["voice_id"] if slot_meta else "elevenlabs:sakha-en-v1"
    expected_duration = int(slot_meta["expected_duration_sec"]) if slot_meta else 0

    if real_path.exists() and real_path.stat().st_size > 0:
        return SafetyAudioResolution(
            slot_id=slot_id,
            status=AssetStatus.REAL,
            path=real_path,
            real_path=real_path,
            placeholder_path=placeholder_path,
            voice_id=voice_id,
            expected_duration_sec=expected_duration,
            sha256=_sha256_of_file(real_path),
        )
    if placeholder_path.exists():
        return SafetyAudioResolution(
            slot_id=slot_id,
            status=AssetStatus.PLACEHOLDER,
            path=None,
            real_path=real_path,
            placeholder_path=placeholder_path,
            voice_id=voice_id,
            expected_duration_sec=expected_duration,
            sha256=None,
        )
    return SafetyAudioResolution(
        slot_id=slot_id,
        status=AssetStatus.MISSING,
        path=None,
        real_path=real_path,
        placeholder_path=placeholder_path,
        voice_id=voice_id,
        expected_duration_sec=expected_duration,
        sha256=None,
    )


def _sha256_of_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


# ─── Manifest summary (admin endpoint reads this) ─────────────────────────


def manifest_summary() -> dict:
    """Aggregate status across all 30 slots — used by admin dashboard
    + the validator script."""
    manifest = load_manifest()
    by_status = {AssetStatus.REAL.value: 0, AssetStatus.PLACEHOLDER.value: 0, AssetStatus.MISSING.value: 0}
    by_category: dict[str, dict[str, int]] = {}
    by_language: dict[str, dict[str, int]] = {}
    slot_states = []
    for slot in manifest["slots"]:
        cat, lang = slot["category"], slot["lang"]
        res = resolve(cat, lang)
        by_status[res.status.value] += 1
        by_category.setdefault(cat, {"real": 0, "placeholder": 0, "missing": 0})[res.status.value] += 1
        by_language.setdefault(lang, {"real": 0, "placeholder": 0, "missing": 0})[res.status.value] += 1
        slot_states.append({
            "id": slot["id"],
            "category": cat,
            "lang": lang,
            "status": res.status.value,
            "voice_id": res.voice_id,
            "expected_duration_sec": res.expected_duration_sec,
            "sha256": res.sha256,
        })
    return {
        "schema_version": manifest.get("schema_version", "1.0.0"),
        "persona_version": manifest.get("persona_version", "1.0.0"),
        "total_slots": len(manifest["slots"]),
        "by_status": by_status,
        "by_category": by_category,
        "by_language": by_language,
        "slots": slot_states,
        "ready_for_production": by_status[AssetStatus.PLACEHOLDER.value] == 0
        and by_status[AssetStatus.MISSING.value] == 0,
    }
