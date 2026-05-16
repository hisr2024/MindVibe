#!/usr/bin/env python3
"""Seed the Dynamic Wisdom corpus (``learned_wisdom``) safely.

Why this script exists
----------------------
The audit (``AUDIT_VOICE_DEEP.md`` Q3) found ``learned_wisdom`` is
schema-complete but **empty** — 0 rows. The 24/7 ingestion daemon
(``backend/services/kiaan_learning_daemon.py``) is gated by
``KIAAN_DAEMON_ENABLED`` and stays off because the upstream sources
have outstanding license questions
(``legal/LEGAL_RISK_INVENTORY_2026-05-16.md``).

This script grows the Dynamic Wisdom corpus without touching any
third-party copyrighted material. Source of truth: the **static Gita
corpus we already ship and own** (``data/gita/gita_verses_complete.json``,
public-domain Sanskrit). For each verse, we ask the configured LLM to
write a fresh "modern application reflection" — a short paragraph that
applies the verse's principle to a 2026 scenario. Three properties make
this legally safe:

  1. **Source is public domain.** Sanskrit Bhagavad-Gita verses are
     pre-1900 public-domain text in every jurisdiction we care about.
  2. **Transformative output.** The LLM produces a fresh paraphrase
     focused on modern application, not a re-quotation of any
     contemporary translation. We never feed it Prabhupada / Easwaran /
     ISKCON content (see ``ip-hygiene.yml``).
  3. **First-party authorship.** The generated reflections are
     work-for-hire output of MindVibe's deployment. We own them.

Each row is written with::

    source_type      = ContentSourceType.MANUAL
    source_name      = "kiaan_internal_paraphrase_<verse_ref>"
    validation_status= ValidationStatus.VALIDATED
    quality_score    = 0.75  (mid-tier — earned-up via effectiveness loop)
    keywords         = derived from the verse's theme + chapter
    content_hash     = sha256(content)  for dedup

Usage
-----
::

    # Dry run: print what would be written, no DB / LLM calls
    python scripts/seed_dynamic_wisdom.py --dry-run

    # Full run: 701 verses × N variants each
    python scripts/seed_dynamic_wisdom.py --variants 2

    # Resume from a specific chapter (idempotent re-runs)
    python scripts/seed_dynamic_wisdom.py --from-chapter 12

Idempotency: ``content_hash`` is the unique index on ``learned_wisdom``,
so the same generated paraphrase will not be re-inserted on a re-run.

Cost
----
At gpt-4o-mini list price (~$0.15 / 1M input tokens, $0.60 / 1M output
tokens) and ~300 input + ~180 output tokens per call:

  * 701 verses × 2 variants = 1402 calls ≈ $0.20 total
  * 701 verses × 3 variants = 2103 calls ≈ $0.30 total

A trivial one-time cost for a 1500+-row Dynamic Wisdom seed.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import logging
import os
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

# Make the package importable when running from the repo root.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select  # noqa: E402

from backend.deps import SessionLocal  # noqa: E402
from backend.models.ai import (  # noqa: E402
    ContentSourceType,
    LearnedWisdom,
    ValidationStatus,
)

logger = logging.getLogger("seed_dynamic_wisdom")

GITA_JSON_PATH = (
    Path(__file__).resolve().parent.parent / "data" / "gita" / "gita_verses_complete.json"
)

PARAPHRASE_SYSTEM_PROMPT = """You are an editorial assistant for a
spiritual-wellness app. You write short, modern, secular reflections
that apply a Bhagavad-Gita verse's underlying principle to a 2026
real-life scenario.

Strict rules:
- You do NOT quote or paraphrase any contemporary published translation
  (Prabhupada, Easwaran, etc.). Your reflection is your own modern
  prose, not a re-translation of the verse.
- You do NOT quote the Sanskrit text.
- You DO state the principle in plain modern language (1 sentence),
  then describe a present-day scenario where that principle applies
  (2–3 sentences), then give one concrete action a person could take
  today (1 sentence).
- Tone is warm, practical, and secular — like a thoughtful friend, not
  a guru.
- Length: 80–140 words. No headings. No bullet points.

Output ONLY the reflection text. No preamble, no labels, no JSON."""


def _content_hash(text: str) -> str:
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()


def _load_gita_corpus() -> list[dict[str, Any]]:
    with GITA_JSON_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)
    # Schema is documented at backend/services/kiaan_wisdom_helper.py — the
    # top-level structure varies across snapshots; normalise to a flat list
    # of {chapter, verse, sanskrit, theme, keywords?} dicts.
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("verses", "data", "items"):
            if key in data and isinstance(data[key], list):
                return data[key]
        # Otherwise treat top-level keys as verse refs.
        return [
            {"verse_ref": k, **(v if isinstance(v, dict) else {"sanskrit": v})}
            for k, v in data.items()
        ]
    raise ValueError(f"Unexpected Gita corpus shape in {GITA_JSON_PATH}")


def _verse_signature(verse: dict[str, Any]) -> tuple[int, int]:
    """Return ``(chapter, verse_number)`` for stable ordering.

    Falls back to ``(0, 0)`` for malformed rows so the script does not
    crash on a single bad entry.
    """
    chapter = verse.get("chapter")
    verse_num = verse.get("verse") or verse.get("verse_number")
    try:
        return int(chapter or 0), int(verse_num or 0)
    except (TypeError, ValueError):
        return 0, 0


async def _generate_paraphrase(
    verse: dict[str, Any],
    *,
    model: str,
    temperature: float,
) -> str | None:
    """Call the LLM to produce one paraphrase. Returns None on failure."""
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY not configured. Cannot generate paraphrases."
        )

    from openai import AsyncOpenAI

    chapter, verse_num = _verse_signature(verse)
    principle = (
        verse.get("principle")
        or verse.get("theme")
        or verse.get("english_summary")
        or ""
    )
    theme = verse.get("theme") or ""

    user_prompt = (
        f"Bhagavad Gita chapter {chapter}, verse {verse_num}.\n"
        f"Theme: {theme or 'general'}.\n"
        f"Principle (from our own corpus, plain modern language): "
        f"{principle or '(write the principle in your own words first)'}\n\n"
        "Write the modern reflection now."
    )

    client = AsyncOpenAI(api_key=api_key, timeout=30.0)
    try:
        completion = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": PARAPHRASE_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=220,
            temperature=temperature,
        )
    except Exception as exc:
        logger.warning(
            "paraphrase failed BG%d.%d: %s", chapter, verse_num, exc
        )
        return None

    text = (completion.choices[0].message.content or "").strip()
    if len(text) < 60:
        logger.debug(
            "paraphrase too short for BG%d.%d (%d chars)",
            chapter,
            verse_num,
            len(text),
        )
        return None
    return text


def _build_row(verse: dict[str, Any], paraphrase: str) -> LearnedWisdom:
    chapter, verse_num = _verse_signature(verse)
    theme = verse.get("theme") or "general"
    domains = verse.get("primary_domain") or verse.get("spiritual_domain")
    keywords = list(
        filter(
            None,
            (
                theme,
                verse.get("life_domain"),
                f"chapter_{chapter}",
                "modern_reflection",
                "kiaan_internal",
            ),
        )
    )
    return LearnedWisdom(
        content=paraphrase,
        content_hash=_content_hash(paraphrase),
        source_type=ContentSourceType.MANUAL,
        source_url=None,
        source_name=f"kiaan_internal_paraphrase_BG{chapter}.{verse_num}",
        source_author="MindVibe / KIAAN editorial",
        language="en",
        chapter_refs=[chapter] if chapter else [],
        verse_refs=[[chapter, verse_num]] if chapter and verse_num else [],
        themes=[theme] if theme else [],
        shad_ripu_tags=[],
        keywords=keywords,
        primary_domain=domains if isinstance(domains, str) else None,
        secondary_domains=None,
        mental_health_applications=None,
        quality_score=0.75,
        validation_status=ValidationStatus.VALIDATED,
        validated_by="seed_dynamic_wisdom.py",
        validated_at=datetime.now(UTC),
        rejection_reason=None,
        embedding=None,
        usage_count=0,
        extra_metadata={
            "generator": "seed_dynamic_wisdom.py",
            "model_at_seed_time": os.getenv("AI_MODEL", "gpt-4o-mini"),
            "transformation": "modern_application_reflection",
            "ip_safety": "first_party_authored_from_public_domain_source",
        },
    )


async def seed(
    *,
    variants: int,
    from_chapter: int,
    dry_run: bool,
    model: str,
) -> dict[str, int]:
    """Generate paraphrases and write them to ``learned_wisdom``.

    Returns a stats dict suitable for printing.
    """
    corpus = _load_gita_corpus()
    corpus.sort(key=_verse_signature)
    corpus = [v for v in corpus if _verse_signature(v)[0] >= from_chapter]

    logger.info(
        "Loaded %d verses from %s (resuming at chapter %d)",
        len(corpus),
        GITA_JSON_PATH.name,
        from_chapter,
    )

    stats = {
        "verses_seen": 0,
        "paraphrases_generated": 0,
        "rows_inserted": 0,
        "rows_skipped_dedup": 0,
        "rows_skipped_dry_run": 0,
        "errors": 0,
    }

    # Slightly varied temperatures across variants gives stylistic spread
    # without straying off-rubric. 0.55–0.85 keeps the rubric tight.
    temps = [0.55, 0.70, 0.85][:variants] or [0.7]

    async with SessionLocal() as db:
        for verse in corpus:
            stats["verses_seen"] += 1
            chapter, verse_num = _verse_signature(verse)

            for variant_idx, temp in enumerate(temps):
                try:
                    if dry_run:
                        # Still log what we would generate.
                        logger.info(
                            "[dry-run] would generate variant=%d BG%d.%d (t=%.2f)",
                            variant_idx,
                            chapter,
                            verse_num,
                            temp,
                        )
                        stats["rows_skipped_dry_run"] += 1
                        continue

                    paraphrase = await _generate_paraphrase(
                        verse, model=model, temperature=temp
                    )
                    if not paraphrase:
                        stats["errors"] += 1
                        continue
                    stats["paraphrases_generated"] += 1

                    # Dedup: unique index on content_hash makes this a
                    # cheap pre-check. Avoids INSERT…ON CONFLICT churn.
                    h = _content_hash(paraphrase)
                    existing = await db.execute(
                        select(LearnedWisdom.id).where(
                            LearnedWisdom.content_hash == h
                        )
                    )
                    if existing.scalar_one_or_none():
                        stats["rows_skipped_dedup"] += 1
                        continue

                    row = _build_row(verse, paraphrase)
                    db.add(row)
                    stats["rows_inserted"] += 1
                except Exception as exc:
                    stats["errors"] += 1
                    logger.warning(
                        "seed error BG%d.%d v=%d: %s",
                        chapter,
                        verse_num,
                        variant_idx,
                        exc,
                    )

            # Commit per-verse so a crash mid-corpus does not lose progress.
            if not dry_run and stats["verses_seen"] % 10 == 0:
                await db.commit()
                logger.info(
                    "checkpoint: %d verses, %d rows inserted",
                    stats["verses_seen"],
                    stats["rows_inserted"],
                )

        if not dry_run:
            await db.commit()

    return stats


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed the Dynamic Wisdom corpus with first-party "
        "paraphrased reflections of the public-domain static Gita corpus.",
    )
    parser.add_argument(
        "--variants",
        type=int,
        default=2,
        help="Paraphrase variants per verse (1–3). Default: 2.",
    )
    parser.add_argument(
        "--from-chapter",
        type=int,
        default=1,
        help="Resume from this chapter (1–18). Default: 1.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not call the LLM or write to the DB.",
    )
    parser.add_argument(
        "--model",
        default=os.getenv("AI_MODEL", "gpt-4o-mini"),
        help="LLM model id. Default: gpt-4o-mini.",
    )
    args = parser.parse_args()
    if not (1 <= args.variants <= 3):
        parser.error("--variants must be between 1 and 3")
    if not (1 <= args.from_chapter <= 18):
        parser.error("--from-chapter must be between 1 and 18")
    return args


def _configure_logging() -> None:
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )


async def _amain() -> int:
    args = _parse_args()
    _configure_logging()

    print("=" * 72)
    print("MindVibe — Dynamic Wisdom Seed")
    print("=" * 72)
    print(f"  variants:      {args.variants}")
    print(f"  from chapter:  {args.from_chapter}")
    print(f"  model:         {args.model}")
    print(f"  dry-run:       {args.dry_run}")
    print()

    if not args.dry_run and not os.getenv("OPENAI_API_KEY"):
        print("ERROR: OPENAI_API_KEY not set. Pass --dry-run to preview.")
        return 2

    stats = await seed(
        variants=args.variants,
        from_chapter=args.from_chapter,
        dry_run=args.dry_run,
        model=args.model,
    )

    print()
    print("=" * 72)
    print("Done.")
    for k, v in stats.items():
        print(f"  {k:.<32s} {v}")
    print("=" * 72)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(asyncio.run(_amain()))
    except KeyboardInterrupt:
        print("\nInterrupted.")
        sys.exit(130)
