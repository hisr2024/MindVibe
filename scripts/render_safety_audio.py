#!/usr/bin/env python3
"""Render the Sakha safety audio bundle from prompts/safety_audio_manifest.json.

Produces real .opus files at backend/static/voice/safety/<slot>.opus for the
30 placeholder slots (3 categories × 10 languages) declared in the manifest.

Usage
─────

    # Render English + Hindi only (the two highest-traffic languages):
    python scripts/render_safety_audio.py --languages en,hi

    # Render every language in the manifest:
    python scripts/render_safety_audio.py --languages all

    # Force re-render even if real audio already exists:
    python scripts/render_safety_audio.py --languages en,hi --force

    # Dry run — print what would be rendered, don't call any APIs:
    python scripts/render_safety_audio.py --languages all --dry-run

Required env vars
─────────────────

    SARVAM_API_KEY        — needed for any Indic language (hi/mr/bn/ta/te/pa/gu/kn/ml)
    ELEVENLABS_API_KEY    — needed for English

The script picks the right provider per slot based on `voice_id` prefix
in the manifest (`sarvam:` → Sarvam, `elevenlabs:` → ElevenLabs).

What it does
────────────

  1. Loads prompts/safety_audio_manifest.json
  2. Filters slots by --languages (and optionally --force)
  3. For each slot:
       - Looks up the per-language utterance text (TRANSLATIONS dict below)
       - Calls the appropriate TTS service
       - Writes .opus bytes to backend/static/voice/safety/<slot>.opus
       - Removes the corresponding .opus.placeholder marker
       - Updates the slot's `status: 'real'` and `sha256` in the manifest
  4. Writes the updated manifest back

Translations
────────────

Each safety category has an English master text in the manifest. Non-English
translations live in the TRANSLATIONS dict below — keep these reviewed by a
native speaker before shipping (the safety register matters more than
literal accuracy). The hi/en seeds are pre-filled; other languages start
empty and must be added before --languages all will succeed.

After running this script
─────────────────────────

    # Verify the manifest now shows status='real' for the rendered slots:
    python scripts/validate_safety_audio.py --strict

    # Commit:
    git add backend/static/voice/safety/*.opus prompts/safety_audio_manifest.json
    git commit -m "assets(voice): render safety audio bundle (en, hi)"

The audio is checked into the repo because it's small (each clip < 200KB,
total bundle < 6MB even at full 30 slots) and must be deterministic at
build time — clients fetch via /static/voice/safety/<file>, no runtime
generation involved.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import logging
import os
import sys
from pathlib import Path

# Make the repo importable when run as a script.
REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

# Imports below depend on sys.path being set above.
from backend.services.elevenlabs_tts_service import (  # noqa: E402
    synthesize_elevenlabs_tts,
)
from backend.services.sarvam_tts_service import (  # noqa: E402
    synthesize_sarvam_tts,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("render_safety_audio")

MANIFEST_PATH = REPO_ROOT / "prompts" / "safety_audio_manifest.json"
SAFETY_DIR = REPO_ROOT / "backend" / "static" / "voice" / "safety"


# ─── Per-language utterance text ──────────────────────────────────────────
#
# The manifest carries the English master text. This dict provides the
# translations Sakha will speak in each non-English language. Keep these
# reviewed by a native speaker; safety register matters more than literal
# accuracy. Empty string means "not yet translated — render skipped".
#
# Structure: TRANSLATIONS[category][lang] = utterance string
# ──────────────────────────────────────────────────────────────────────────

TRANSLATIONS: dict[str, dict[str, str]] = {
    "crisis_routing": {
        "en": (
            "I am right here with you. What you are feeling is real, and "
            "there is help — right now, on this phone. Please call the "
            "number on your screen. I will wait."
        ),
        "hi": (
            "मैं यहाँ हूँ तुम्हारे साथ। तुम जो महसूस कर रहे हो, वह सच है — "
            "और मदद है, अभी, इसी फ़ोन पर। कृपया स्क्रीन पर दिए नंबर पर "
            "फ़ोन करो। मैं प्रतीक्षा करूँगा।"
        ),
        # Other languages: needs native-speaker translation before shipping.
        "mr": "",
        "bn": "",
        "ta": "",
        "te": "",
        "pa": "",
        "gu": "",
        "kn": "",
        "ml": "",
    },
    "quota_upgrade": {
        "en": (
            "We have reached the rest of today's voice together. Walk "
            "further when it feels right. I am still here in silence."
        ),
        "hi": (
            "हम आज के बाक़ी समय तक साथ पहुँच गए हैं। जब सही लगे तब आगे "
            "चलना। मैं अब भी हूँ — मौन में।"
        ),
        "mr": "",
        "bn": "",
        "ta": "",
        "te": "",
        "pa": "",
        "gu": "",
        "kn": "",
        "ml": "",
    },
    "silence_hum": {
        # silence_hum is a sustained breath-paced tone, not language-
        # specific words. The English version is fine for all languages
        # but we duplicate for routing simplicity.
        "en": "हम्म…",
        "hi": "हम्म…",
        "mr": "हम्म…",
        "bn": "হুম…",
        "ta": "ம்ம்…",
        "te": "హ్మ్…",
        "pa": "ਹੁੰ…",
        "gu": "હુમ્મ…",
        "kn": "ಹ್ಮ್…",
        "ml": "ഹ്മ്…",
    },
}


# ─── Manifest helpers ─────────────────────────────────────────────────────


def load_manifest() -> dict:
    with MANIFEST_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_manifest(manifest: dict) -> None:
    # Pretty-print with 2-space indent and stable key order so the diff
    # stays reviewable when rendering adds sha256 fields.
    with MANIFEST_PATH.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(64 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


# ─── TTS dispatch ─────────────────────────────────────────────────────────


async def render_one(slot: dict, text: str, dry_run: bool) -> bytes | None:
    """Call the right TTS provider for one slot. Returns audio bytes or None."""
    voice_id = slot["voice_id"]
    lang = slot["lang"]

    if dry_run:
        log.info(
            "  [dry-run] would render %s → %s (%d chars, voice_id=%s)",
            slot["id"], slot["path"], len(text), voice_id,
        )
        return None

    if voice_id.startswith("elevenlabs:"):
        provider_voice = voice_id.split(":", 1)[1]
        bytes_ = await synthesize_elevenlabs_tts(
            text=text, language=lang, voice_id=provider_voice, mood="warm",
        )
    elif voice_id.startswith("sarvam:"):
        provider_voice = voice_id.split(":", 1)[1]
        bytes_ = await synthesize_sarvam_tts(
            text=text, language=lang, voice_id=provider_voice, mood="warm",
        )
    else:
        log.error("  unknown voice_id prefix on slot %s: %r", slot["id"], voice_id)
        return None

    if not bytes_:
        log.error("  TTS returned empty audio for slot %s", slot["id"])
        return None
    return bytes_


# ─── Main render loop ─────────────────────────────────────────────────────


async def render_all(
    languages: list[str],
    force: bool,
    dry_run: bool,
) -> int:
    """Render the requested slots. Returns 0 on success, 1 on any failure."""
    manifest = load_manifest()
    SAFETY_DIR.mkdir(parents=True, exist_ok=True)

    selected_langs = (
        set(manifest["languages"]) if languages == ["all"] else set(languages)
    )
    rendered = 0
    skipped = 0
    failed = 0

    for slot in manifest["slots"]:
        if slot["lang"] not in selected_langs:
            continue
        if not force and slot.get("status") == "real":
            log.info("  skip (already real): %s", slot["id"])
            skipped += 1
            continue

        text = TRANSLATIONS.get(slot["category"], {}).get(slot["lang"], "")
        if not text:
            log.warning(
                "  skip (no translation for %s/%s): add to TRANSLATIONS dict",
                slot["category"], slot["lang"],
            )
            skipped += 1
            continue

        log.info("Rendering %s ...", slot["id"])
        try:
            audio = await render_one(slot, text, dry_run=dry_run)
        except Exception as e:
            log.exception("  failed: %s", e)
            failed += 1
            continue

        if dry_run:
            rendered += 1
            continue
        if audio is None:
            failed += 1
            continue

        out_path = REPO_ROOT / slot["path"]
        out_path.write_bytes(audio)
        # Remove the placeholder marker if present.
        placeholder = out_path.with_suffix(out_path.suffix + ".placeholder")
        if placeholder.exists():
            placeholder.unlink()
        # Stamp the manifest entry.
        slot["status"] = "real"
        slot["sha256"] = sha256_of(out_path)
        slot["bytes"] = out_path.stat().st_size
        log.info(
            "  ✓ wrote %s (%d bytes, sha256=%s…)",
            out_path.name, slot["bytes"], slot["sha256"][:12],
        )
        rendered += 1

    if not dry_run:
        save_manifest(manifest)

    log.info(
        "Done. rendered=%d skipped=%d failed=%d",
        rendered, skipped, failed,
    )
    return 0 if failed == 0 else 1


# ─── CLI entry ────────────────────────────────────────────────────────────


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument(
        "--languages",
        required=True,
        help='Comma-separated BCP-47 language codes, or "all". Example: --languages en,hi',
    )
    p.add_argument(
        "--force",
        action="store_true",
        help="Re-render slots even if status is already 'real'.",
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be rendered, don't call APIs or write files.",
    )
    return p.parse_args()


def main() -> int:
    args = parse_args()
    languages = [s.strip() for s in args.languages.split(",")]

    # Quick env-var sanity (skip in dry run).
    if not args.dry_run:
        if not os.environ.get("SARVAM_API_KEY") and any(
            l != "en" for l in languages
        ):
            log.error("SARVAM_API_KEY required for non-English rendering")
            return 2
        if not os.environ.get("ELEVENLABS_API_KEY") and "en" in languages:
            log.error("ELEVENLABS_API_KEY required for English rendering")
            return 2

    return asyncio.run(
        render_all(
            languages=languages,
            force=args.force,
            dry_run=args.dry_run,
        )
    )


if __name__ == "__main__":
    sys.exit(main())
