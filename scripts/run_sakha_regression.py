#!/usr/bin/env python3
"""Sakha regression runner — offline + live modes.

Spec: every prompt change requires regression-testing against the 50 fixed
cases in prompts/sakha.regression.jsonl, then a human review of 20 sampled
outputs in actual TTS audio. This script automates the first half.

Modes:

  offline (default)
    For each case, builds a synthetic "ideal Sakha response" from the
    retrieved verse + a templated arc, then runs the StreamingGitaFilter
    on it. Asserts:
      • filter verdict == PASS
      • response contains every string in expected_signals
      • response contains no string in must_not_contain

    Cost: zero. Latency: <2s for all 50 cases. Used in CI on every PR
    that touches prompts/ or backend/services/gita_wisdom_filter.py.

  live --model=gpt-4o-mini  --max-cases=N
    Same assertions, but the response comes from a real LLM call. Requires
    OPENAI_API_KEY in the env. Used by humans before bumping
    persona-version. NEVER run in CI (cost + nondeterminism).

Exit codes:
  0  all cases pass
  1  one or more cases failed
  2  configuration error (missing key, invalid mode, etc.)

Usage:
  python scripts/run_sakha_regression.py --offline
  python scripts/run_sakha_regression.py --offline --verbose
  python scripts/run_sakha_regression.py --live --max-cases=20
  python scripts/run_sakha_regression.py --offline --case-id=G-001
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path

# Make the repo importable when run from anywhere
_REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_REPO_ROOT))

from backend.services.gita_wisdom_filter import (  # noqa: E402
    StreamingFilterVerdict,
    StreamingGitaFilter,
)
from backend.services.prompt_loader import (  # noqa: E402
    RegressionCase,
    get_persona_version,
    get_prompt_text,
    load_regression_set,
)

# ─── Synthetic Sakha response (offline mode) ──────────────────────────────


def _synthetic_voice_response(case: RegressionCase) -> str:
    """Build a Sakha-style voice arc from the retrieved verse alone.

    This is what an *ideal* Sakha response looks like — Sanskrit verbatim,
    pause, translation, one connection sentence, one suggestion, soft
    closer. The filter should always PASS on this. If the filter rejects
    it, either:
      • the regression case is malformed (verse not in retrieval), OR
      • the filter has regressed (a bug in StreamingGitaFilter)

    Either failure is a real signal worth catching in CI.
    """
    if not case.retrieved_verses:
        # ASSISTANT cases without a verse fall through to a Karma-Yoga
        # framing so the filter still has a Gita signal.
        return (
            "तस्मात्सर्वेषु कालेषु मामनुस्मर युध्य च। <pause:medium> "
            "Krishna's teaching on Karma Yoga — act, with awareness. "
            "<pause:short> Right now, do this one thing fully. "
            "<pause:long>"
        )

    v = case.retrieved_verses[0]
    sanskrit = v.get("sanskrit", "")
    english = v.get("english", "")
    ref = v.get("ref", "BG")

    return (
        f"{sanskrit} <pause:medium> "
        f"{english} <pause:short> "
        f"This Gita teaching — {ref} — speaks directly to what you are feeling. "
        f"<pause:short> Right now, breathe once and act with care for what is yours. "
        f"<pause:long>"
    )


def _synthetic_text_response(case: RegressionCase) -> str:
    """Same idea for text mode — the canonical 4-Part structure."""
    if not case.retrieved_verses:
        return (
            "**Ancient Wisdom Principle:** Krishna teaches in BG 2.47 that we have a "
            "right to action alone, never to its fruits.\n\n"
            "**Modern Application:** This applies to your situation directly.\n\n"
            "**Practical Steps:**\n1. Take one mindful breath.\n2. Do the next thing fully.\n3. Release the result.\n\n"
            "**Deeper Understanding:** This is the seed of Karma Yoga.\n"
        )
    v = case.retrieved_verses[0]
    sanskrit = v.get("sanskrit", "")
    english = v.get("english", "")
    ref = v.get("ref", "BG")
    return (
        f"**Ancient Wisdom Principle:** Krishna teaches in {ref}:\n\n"
        f"> {sanskrit}\n> \"{english}\"\n\n"
        f"**Modern Application:** This Gita teaching speaks directly to what you are facing.\n\n"
        f"**Practical Steps:**\n"
        f"1. Notice the feeling without identifying with it.\n"
        f"2. Take one breath as karma yoga.\n"
        f"3. Do the next single action fully.\n\n"
        f"**Deeper Understanding:** Across the Bhagavad Gita, Krishna returns to "
        f"this teaching — act fully, surrender the fruit. What is one fruit "
        f"you can release today?\n"
    )


# ─── Per-case evaluator ───────────────────────────────────────────────────


@dataclass
class CaseResult:
    case_id: str
    passed: bool
    verdict: str
    score: float
    failure_reason: str | None
    missing_signals: list[str]
    forbidden_hits: list[str]
    response_excerpt: str
    elapsed_ms: int


_VERSE_SHAPE = __import__("re").compile(r"^BG\s+\d{1,2}\.\d{1,3}$")


def _filterable_signals(case: RegressionCase, mode: str) -> list[str]:
    """Which expected_signals are meaningful to enforce in this mode?

    Offline mode runs a synthetic response built from the verse alone, so
    task-specific signals like 'Karmic Tree' or '7' (alarm time) cannot
    appear. We restrict offline checks to verse-shaped signals (BG x.y)
    plus core Gita concepts that should always make it into the synthetic.

    Live mode enforces everything — that's the whole point of paying for
    the LLM call.
    """
    if mode == "live":
        return list(case.expected_signals)
    return [s for s in case.expected_signals if _VERSE_SHAPE.match(s.strip())]


def _evaluate(case: RegressionCase, response: str, mode: str) -> CaseResult:
    start = time.monotonic()

    allowed_verses = [v.get("ref") for v in case.retrieved_verses if v.get("ref")]
    f = StreamingGitaFilter(retrieved_verses=allowed_verses)
    f.feed(response)
    final = f.finalize()

    enforceable = _filterable_signals(case, mode)
    missing = [s for s in enforceable if s.lower() not in response.lower()]
    forbidden = [s for s in case.must_not_contain if s.lower() in response.lower()]

    passed = (
        final.verdict == StreamingFilterVerdict.PASS
        and not missing
        and not forbidden
    )

    elapsed_ms = int((time.monotonic() - start) * 1000)
    return CaseResult(
        case_id=case.case_id,
        passed=passed,
        verdict=final.verdict.value,
        score=round(final.cumulative_score, 3),
        failure_reason=final.failure_reason,
        missing_signals=missing,
        forbidden_hits=forbidden,
        response_excerpt=response[:160].replace("\n", " "),
        elapsed_ms=elapsed_ms,
    )


# ─── Live runner (optional, requires OPENAI_API_KEY) ──────────────────────


def _live_response(case: RegressionCase, model: str, render_mode: str) -> str:
    """Call the LLM with the actual Sakha prompt + the case's context.

    Lazy-imports openai so the offline path runs without the SDK installed.
    Returns the full streamed response as a single string (we accumulate
    the deltas — the filter is exercised in offline mode separately)."""
    try:
        from openai import OpenAI
    except ImportError:
        print("ERROR: openai package not installed — required for --live mode")
        sys.exit(2)

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY not set — required for --live mode")
        sys.exit(2)

    client = OpenAI(api_key=api_key)

    user_payload = {
        "persona_version": get_persona_version(),
        "render_mode": render_mode,
        "delivery_channel": "voice_android" if render_mode == "voice" else "text",
        "lang_hint": case.language,
        "user_latest": case.user_latest,
        "history": [],
        "mood": {"label": case.mood, "intensity": 0.6, "trend": "rising"},
        "engine": case.engine,
        "voice_target_duration_sec": 45 if case.engine == "GUIDANCE" else 30,
        "retrieved_verses": case.retrieved_verses,
    }

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": get_prompt_text(render_mode)},
            {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
        ],
        stream=False,  # we collect the whole thing for the offline-style eval
        temperature=0.7,
        max_tokens=600,
    )
    return response.choices[0].message.content or ""


# ─── CLI ──────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description="Sakha regression runner")
    parser.add_argument(
        "--mode",
        choices=("offline", "live"),
        default="offline",
        help="offline = synthetic responses (default, free, fast); "
        "live = real LLM calls (requires OPENAI_API_KEY)",
    )
    parser.add_argument(
        "--offline",
        dest="mode",
        action="store_const",
        const="offline",
        help="Shortcut for --mode=offline",
    )
    parser.add_argument(
        "--live",
        dest="mode",
        action="store_const",
        const="live",
        help="Shortcut for --mode=live",
    )
    parser.add_argument(
        "--render-mode",
        choices=("voice", "text"),
        default="voice",
        help="Which Sakha persona to test (default: voice)",
    )
    parser.add_argument(
        "--model",
        default=os.environ.get("KIAAN_LLM_MODEL", "gpt-4o-mini"),
        help="LLM model id for --mode=live (default: gpt-4o-mini)",
    )
    parser.add_argument(
        "--case-id",
        action="append",
        default=[],
        help="Run only matching case IDs (can repeat). Default: all 50.",
    )
    parser.add_argument(
        "--max-cases",
        type=int,
        default=None,
        help="Cap how many cases to run (useful for --live with cost limits).",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Print per-case result lines (default: print only failures + summary).",
    )
    args = parser.parse_args()

    cases = load_regression_set()
    if args.case_id:
        wanted = set(args.case_id)
        cases = [c for c in cases if c.case_id in wanted]
        if not cases:
            print(f"ERROR: no cases matched --case-id {args.case_id}")
            return 2
    if args.max_cases:
        cases = cases[: args.max_cases]

    print(f"Sakha regression — persona-version {get_persona_version()} "
          f"render-mode={args.render_mode} mode={args.mode} "
          f"running {len(cases)} cases\n")

    results: list[CaseResult] = []
    overall_start = time.monotonic()

    for case in cases:
        if args.mode == "offline":
            if args.render_mode == "voice":
                response = _synthetic_voice_response(case)
            else:
                response = _synthetic_text_response(case)
        else:
            response = _live_response(case, args.model, args.render_mode)

        result = _evaluate(case, response, args.mode)
        results.append(result)

        if args.verbose or not result.passed:
            tag = "PASS" if result.passed else "FAIL"
            print(f"  {tag}  {result.case_id}  "
                  f"verdict={result.verdict}  score={result.score:.2f}  "
                  f"elapsed={result.elapsed_ms}ms")
            if not result.passed:
                if result.failure_reason:
                    print(f"        filter reason: {result.failure_reason}")
                if result.missing_signals:
                    print(f"        missing signals: {result.missing_signals}")
                if result.forbidden_hits:
                    print(f"        forbidden hits: {result.forbidden_hits}")
                print(f"        excerpt: {result.response_excerpt}…")

    elapsed = time.monotonic() - overall_start
    passed = sum(1 for r in results if r.passed)
    failed = len(results) - passed

    print(f"\n=== {passed}/{len(results)} passed, {failed} failed "
          f"in {elapsed:.2f}s ===")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
