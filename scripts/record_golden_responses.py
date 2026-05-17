#!/usr/bin/env python3
"""Record golden responses for the regression suite.

Implements ``IMPROVEMENT_ROADMAP.md`` P1.5 §11. Iterates over the
canonical input corpora in ``tests/golden/inputs/*.json`` and, for each
input, calls the real Wisdom-Core-gated pipeline
(``call_kiaan_ai_grounded``) to record the response, retrieved verse
refs, wisdom score, and filter verdict. Writes one JSON per (surface,
id) pair under ``tests/golden/recordings/<surface>/<id>.json``.

The verifier (``tests/test_golden_regression.py``) loads these
recordings on every CI run and fails the build when:

* verse_refs change (verse drift)
* wisdom_score drops more than 0.10 below the recorded value
* filter_pass rate drops below the recorded value minus 2 %

Usage
-----

::

    # one-shot rebuild (requires OPENAI_API_KEY + real DB)
    python scripts/record_golden_responses.py --all

    # rebuild a single surface
    python scripts/record_golden_responses.py --surface ardha

    # diff against current recordings without writing (preview)
    python scripts/record_golden_responses.py --all --dry-run

    # control which AI provider records (defaults to AI_PROVIDER env)
    AI_PROVIDER=openai AI_MODEL=gpt-4o-mini \\
        python scripts/record_golden_responses.py --all

Cost & runtime
--------------
~56 canonical inputs × ~700 tokens average × $0.15/1M input + $0.60/1M
output (gpt-4o-mini) ≈ $0.03 per full rebuild. End-to-end runtime is
dominated by the LLM round-trip — expect ~3 minutes for a full sweep
on a single key with no concurrency.

The recordings live in version control so ops can review what changed
between commits. Re-record after intentional prompt or persona changes;
let CI catch unintended drift.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any

# Allow running from the repo root without installing the package.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.deps import SessionLocal  # noqa: E402
from backend.services.kiaan_grounded_ai import (  # noqa: E402
    call_kiaan_ai_grounded,
)
from backend.services.tool_envelope import build_tool_message  # noqa: E402

logger = logging.getLogger("record_golden_responses")

# Map surface name → (tool_name for grounded call, input-corpus filename).
# ``None`` tool_name means "bare chat / Sakha".
_SURFACES: dict[str, tuple[str | None, str]] = {
    "emotional_reset": ("Emotional Reset", "emotional_reset.json"),
    "ardha": ("Ardha", "ardha.json"),
    "viyoga": ("Viyoga", "viyoga.json"),
    "karma_reset": ("Karma Reset", "karma_reset.json"),
    "sambandh_dharma": (
        "Sambandh Dharma (Relationship Compass)",
        "sambandh_dharma.json",
    ),
    "karmalytix": ("KarmaLytix", "karmalytix.json"),
    "chat": (None, "chat.json"),
}

_GOLDEN_DIR = Path(__file__).resolve().parent.parent / "tests" / "golden"
_INPUTS_DIR = _GOLDEN_DIR / "inputs"
_RECORDINGS_DIR = _GOLDEN_DIR / "recordings"


def _build_message_for_record(
    *,
    surface: str,
    tool_name: str | None,
    record: dict[str, Any],
) -> str:
    """Produce the user-message the grounded pipeline will receive.

    Tool surfaces hand structured inputs through ``build_tool_message``
    — same envelope the production routes use. The bare chat surface
    sends the message verbatim.
    """
    if surface == "chat":
        msg = record.get("message", "")
        if not msg:
            raise ValueError(
                f"chat record {record.get('id')!r} has no 'message' field"
            )
        return msg
    inputs = record.get("inputs") or {}
    return build_tool_message(tool_name or surface, inputs)


async def _record_surface(
    surface: str,
    *,
    user_id: str,
    dry_run: bool,
) -> tuple[int, int]:
    """Record every input in one surface's corpus.

    Returns ``(written, skipped)``.
    """
    tool_name, filename = _SURFACES[surface]
    inputs_path = _INPUTS_DIR / filename
    if not inputs_path.exists():
        logger.warning("no input corpus at %s", inputs_path)
        return 0, 0
    with inputs_path.open("r", encoding="utf-8") as f:
        records = json.load(f)

    out_dir = _RECORDINGS_DIR / surface
    out_dir.mkdir(parents=True, exist_ok=True)

    written = 0
    skipped = 0
    async with SessionLocal() as db:
        for record in records:
            rec_id = record["id"]
            try:
                message = _build_message_for_record(
                    surface=surface, tool_name=tool_name, record=record
                )
            except ValueError as exc:
                logger.warning("skip %s/%s: %s", surface, rec_id, exc)
                skipped += 1
                continue

            try:
                grounded = await call_kiaan_ai_grounded(
                    message=message,
                    db=db,
                    user_id=user_id,
                    tool_name=tool_name,
                )
            except Exception as exc:
                logger.warning(
                    "skip %s/%s: grounded call failed: %s",
                    surface,
                    rec_id,
                    exc,
                )
                skipped += 1
                continue

            payload = {
                "id": rec_id,
                "surface": surface,
                "tool_name": tool_name,
                "input_record": record,
                "response": {
                    "text": grounded.text,
                    "verses": [
                        {
                            "verse_ref": v.get("verse_ref"),
                            "source": v.get("source"),
                        }
                        for v in grounded.verses
                    ],
                    "is_gita_grounded": grounded.is_gita_grounded,
                    "wisdom_score": grounded.wisdom_score,
                    "enhancement_applied": grounded.enhancement_applied,
                    "filter_applied": grounded.filter_applied,
                },
                "provider": {
                    "AI_PROVIDER": os.getenv("AI_PROVIDER", "openai"),
                    "AI_MODEL": os.getenv("AI_MODEL", "gpt-4o-mini"),
                },
                "schema_version": 1,
            }

            out_path = out_dir / f"{rec_id}.json"
            if dry_run:
                logger.info(
                    "[dry-run] would write %s (text_len=%d verses=%d score=%.2f)",
                    out_path.relative_to(_GOLDEN_DIR.parent),
                    len(grounded.text),
                    len(grounded.verses),
                    grounded.wisdom_score,
                )
            else:
                with out_path.open("w", encoding="utf-8") as f:
                    json.dump(payload, f, ensure_ascii=False, indent=2)
                logger.info(
                    "wrote %s",
                    out_path.relative_to(_GOLDEN_DIR.parent),
                )
            written += 1
    return written, skipped


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Rebuild golden response recordings for the "
        "regression suite. See module docstring for cost / runtime.",
    )
    grp = parser.add_mutually_exclusive_group(required=True)
    grp.add_argument(
        "--all", action="store_true", help="Rebuild every surface."
    )
    grp.add_argument(
        "--surface",
        choices=sorted(_SURFACES),
        help="Rebuild a single surface only.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run the recordings but do not write to disk.",
    )
    parser.add_argument(
        "--user-id",
        default="golden-test-user",
        help="Stable user_id for the Dynamic Wisdom pick. Keep the "
        "default so recordings are reproducible across rebuilds.",
    )
    return parser.parse_args()


def _configure_logging() -> None:
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )


async def _amain() -> int:
    args = _parse_args()
    _configure_logging()

    if not os.getenv("OPENAI_API_KEY", "").strip():
        print(
            "ERROR: OPENAI_API_KEY not set. Recording requires a real "
            "provider key. Use --dry-run to validate the input corpus "
            "without recording.",
            file=sys.stderr,
        )
        return 2

    surfaces = sorted(_SURFACES) if args.all else [args.surface]

    print("=" * 72)
    print("MindVibe — Golden Response Recorder")
    print("=" * 72)
    print(f"  surfaces:      {', '.join(surfaces)}")
    print(f"  user_id:       {args.user_id}")
    print(f"  AI_PROVIDER:   {os.getenv('AI_PROVIDER', 'openai')}")
    print(f"  AI_MODEL:      {os.getenv('AI_MODEL', 'gpt-4o-mini')}")
    print(f"  dry-run:       {args.dry_run}")
    print()

    total_written = 0
    total_skipped = 0
    for surface in surfaces:
        print(f"-- {surface}")
        written, skipped = await _record_surface(
            surface, user_id=args.user_id, dry_run=args.dry_run
        )
        total_written += written
        total_skipped += skipped

    print()
    print("=" * 72)
    print(f"Done. wrote={total_written}, skipped={total_skipped}")
    print("=" * 72)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(asyncio.run(_amain()))
    except KeyboardInterrupt:
        print("\nInterrupted.")
        sys.exit(130)
