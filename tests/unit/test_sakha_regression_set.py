"""Tests that the Sakha regression set itself is well-formed.

These run on every CI build, separate from the runner. They guard against:
  • invalid JSON in the file
  • duplicate case_ids
  • case_ids not matching the expected prefix-pattern
  • engines/languages outside the allowed sets
  • verses cited in expected_signals not appearing in retrieved_verses
  • coverage regressions (e.g. someone deletes all GUIDANCE cases)

The runner itself (scripts/run_sakha_regression.py) tests filter behavior;
this file tests the data integrity of the regression corpus.
"""

from __future__ import annotations

import os
import re

# Loader uses cache reset which requires this env flag
os.environ.setdefault("KIAAN_PROMPT_LOADER_TEST", "1")

from backend.services.prompt_loader import (  # noqa: E402
    load_regression_set,
    reset_cache_for_tests,
)

VALID_ENGINES = {"GUIDANCE", "FRIEND", "VOICE_GUIDE", "ASSISTANT"}
VALID_LANGUAGES = {"en", "hi", "hi-en", "mr", "ta", "te", "bn", "pa", "gu", "kn", "ml"}
CASE_ID_RE = re.compile(r"^[GFVAE]-\d{3}$")
VERSE_REF_RE = re.compile(r"^BG\s+\d{1,2}\.\d{1,3}$")


class TestRegressionSetIntegrity:
    def test_loads_exactly_50_cases(self):
        reset_cache_for_tests()
        cases = load_regression_set()
        assert len(cases) == 50, f"expected 50 cases, got {len(cases)}"

    def test_all_case_ids_unique(self):
        cases = load_regression_set()
        ids = [c.case_id for c in cases]
        assert len(set(ids)) == len(ids)

    def test_case_id_format(self):
        cases = load_regression_set()
        for c in cases:
            assert CASE_ID_RE.match(c.case_id), (
                f"case_id {c.case_id!r} doesn't match prefix-NNN pattern"
            )

    def test_all_engines_valid(self):
        cases = load_regression_set()
        for c in cases:
            assert c.engine in VALID_ENGINES, (
                f"{c.case_id}: invalid engine {c.engine!r}"
            )

    def test_all_languages_valid(self):
        cases = load_regression_set()
        for c in cases:
            assert c.language in VALID_LANGUAGES, (
                f"{c.case_id}: invalid language {c.language!r}"
            )

    def test_user_latest_non_empty(self):
        cases = load_regression_set()
        for c in cases:
            assert c.user_latest.strip(), f"{c.case_id}: user_latest is empty"


class TestRegressionSetCoverage:
    """Coverage thresholds — bumping these requires intentional set growth."""

    def test_minimum_engine_coverage(self):
        cases = load_regression_set()
        by_engine = {}
        for c in cases:
            by_engine[c.engine] = by_engine.get(c.engine, 0) + 1
        # Each engine has at least N cases — protects against accidental
        # deletion of an engine's coverage.
        assert by_engine.get("GUIDANCE", 0) >= 14
        assert by_engine.get("FRIEND", 0) >= 14
        assert by_engine.get("VOICE_GUIDE", 0) >= 7
        assert by_engine.get("ASSISTANT", 0) >= 4

    def test_multilingual_coverage(self):
        cases = load_regression_set()
        langs = {c.language for c in cases}
        # English + Hindi minimum, plus at least 3 other Indic languages
        assert "en" in langs
        assert "hi" in langs
        indic = {"mr", "ta", "te", "bn", "pa", "gu", "kn", "ml", "hi-en"}
        assert len(indic & langs) >= 3, (
            f"expected ≥3 non-EN/HI Indic langs, got {sorted(indic & langs)}"
        )

    def test_filter_probe_cases_present(self):
        """E-prefix cases probe the filter — must include other-tradition
        and therapy-speak negatives."""
        cases = load_regression_set()
        e_cases = [c for c in cases if c.case_id.startswith("E-")]
        assert len(e_cases) >= 6
        all_forbidden = {
            tok.lower() for c in e_cases for tok in c.must_not_contain
        }
        # Coverage of the two highest-stakes filter-failure modes:
        assert any("buddha" in t or "quran" in t or "bible" in t for t in all_forbidden)
        assert any("as an ai" in t for t in all_forbidden)

    def test_at_least_one_crisis_neighbor_with_long_input(self):
        """Long-input edge case must exist (filter must not reject for length)."""
        cases = load_regression_set()
        long_cases = [c for c in cases if len(c.user_latest) > 200]
        assert long_cases, "no long-input edge case present"


class TestVerseConsistency:
    def test_verse_signals_appear_in_retrieved_verses(self):
        """If expected_signals contains a verse-shaped string (BG x.y), that
        verse must be in retrieved_verses — otherwise the case is
        un-passable (the filter would reject the citation)."""
        cases = load_regression_set()
        for c in cases:
            allowed = {v.get("ref") for v in c.retrieved_verses if v.get("ref")}
            for sig in c.expected_signals:
                if VERSE_REF_RE.match(sig.strip()):
                    assert sig in allowed, (
                        f"{c.case_id}: expected_signal {sig!r} is a verse "
                        f"but not in retrieved_verses {sorted(allowed)}"
                    )

    def test_retrieved_verses_have_required_fields(self):
        cases = load_regression_set()
        for c in cases:
            for v in c.retrieved_verses:
                # ref must be the BG x.y pattern
                assert "ref" in v, f"{c.case_id}: verse missing 'ref'"
                assert VERSE_REF_RE.match(v["ref"]), (
                    f"{c.case_id}: bad verse ref {v['ref']!r}"
                )
                # sanskrit + english are mandatory for the synthetic builder
                assert v.get("sanskrit"), f"{c.case_id}/{v['ref']}: missing sanskrit"
                assert v.get("english"), f"{c.case_id}/{v['ref']}: missing english"

    def test_no_chapter_above_18(self):
        """BG only has 18 chapters; anything past that is a hard filter
        violation. A regression case must never cite an impossible verse."""
        cases = load_regression_set()
        for c in cases:
            for v in c.retrieved_verses:
                m = re.match(r"BG\s+(\d{1,2})\.(\d{1,3})", v["ref"])
                assert m, f"{c.case_id}: malformed ref {v['ref']!r}"
                ch = int(m.group(1))
                assert 1 <= ch <= 18, (
                    f"{c.case_id}: chapter {ch} out of range (BG has 18 chapters)"
                )
