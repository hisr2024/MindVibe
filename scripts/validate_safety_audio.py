#!/usr/bin/env python3
"""Validate the Sakha safety audio bundle.

Two modes:

  default — report the asset state across all 30 slots:
              status, voice_id, expected_duration, sha256
            Exit 0. Used during development.

  --strict (or KIAAN_SAFETY_AUDIO_REQUIRED=1)
            Same report, but exit 1 if any slot is still a
            placeholder. Used in production / pre-release CI.

Run as:
    python scripts/validate_safety_audio.py
    KIAAN_SAFETY_AUDIO_REQUIRED=1 python scripts/validate_safety_audio.py
    python scripts/validate_safety_audio.py --strict
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_REPO_ROOT))

from backend.services.voice.safety_audio import (  # noqa: E402
    manifest_summary,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Sakha safety audio validator")
    parser.add_argument(
        "--strict",
        action="store_true",
        default=os.environ.get("KIAAN_SAFETY_AUDIO_REQUIRED") == "1",
        help="Fail with exit 1 if any slot is still a placeholder.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit JSON summary instead of human-readable.",
    )
    args = parser.parse_args()

    summary = manifest_summary()

    if args.json:
        import json
        print(json.dumps(summary, indent=2))
        if args.strict and not summary["ready_for_production"]:
            return 1
        return 0

    print(
        f"Sakha safety audio · schema={summary['schema_version']} "
        f"persona={summary['persona_version']}"
    )
    print(
        f"  total slots: {summary['total_slots']}   "
        f"real: {summary['by_status']['real']}   "
        f"placeholder: {summary['by_status']['placeholder']}   "
        f"missing: {summary['by_status']['missing']}"
    )
    print()
    print("By category:")
    for cat, stats in summary["by_category"].items():
        print(
            f"  {cat:18s}  real {stats['real']:>2}  "
            f"placeholder {stats['placeholder']:>2}  "
            f"missing {stats['missing']:>2}"
        )
    print()
    print("By language:")
    for lang, stats in summary["by_language"].items():
        print(
            f"  {lang:5s}  real {stats['real']:>2}  "
            f"placeholder {stats['placeholder']:>2}  "
            f"missing {stats['missing']:>2}"
        )

    if summary["ready_for_production"]:
        print("\n  ready for production: YES")
        return 0

    print(
        f"\n  ready for production: NO  "
        f"({summary['by_status']['placeholder']} placeholders, "
        f"{summary['by_status']['missing']} missing)"
    )
    if args.strict:
        print(
            "\n  --strict: failing build because not all slots have real audio.",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
