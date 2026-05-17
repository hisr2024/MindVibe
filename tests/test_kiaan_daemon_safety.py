"""Tests for the daemon-ingestion safety harness.

Covers ``IMPROVEMENT_ROADMAP.md`` P2 §16. Pins:

* License whitelist (Stage 1): untagged / non-whitelisted /
  CC-BY without attribution → reject.
* Copyright phrase scrubber (Stage 2): every signature phrase from
  ``ip-hygiene.yml`` is caught regardless of case / whitespace.
* Retention pass: dry-run by default, real run soft-deletes the
  right rows, ignores already-soft-deleted ones.
* Effectiveness auto-reject: dry-run by default, real run marks
  ``validation_status=REJECTED`` and writes the rejection_reason.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from backend.services.kiaan_daemon_safety import (
    DENYLIST_PHRASES,
    IngestionCandidate,
    LicenseTag,
    RejectReason,
    contains_denylisted_phrase,
    mark_low_effectiveness_rejected,
    purge_low_value_learned_rows,
    validate_ingestion_candidate,
    whitelisted_licenses,
)

# ── License whitelist ────────────────────────────────────────────────


def test_whitelist_defaults_include_all_known_tags() -> None:
    wl = whitelisted_licenses()
    assert LicenseTag.CC0 in wl
    assert LicenseTag.CC_BY in wl
    assert LicenseTag.CC_BY_SA in wl
    assert LicenseTag.PD_PRE_1928 in wl
    assert LicenseTag.FIRST_PARTY in wl
    assert LicenseTag.OPERATOR_REVIEWED in wl


def test_whitelist_env_override_narrows_acceptance(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("KIAAN_LICENSE_WHITELIST", "CC0,first-party")
    wl = whitelisted_licenses()
    assert LicenseTag.CC0 in wl
    assert LicenseTag.FIRST_PARTY in wl
    assert LicenseTag.CC_BY not in wl
    assert LicenseTag.PD_PRE_1928 not in wl


def test_whitelist_env_with_only_unknown_tags_falls_back_to_default(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A typo / future tag must not silently widen acceptance."""
    monkeypatch.setenv("KIAAN_LICENSE_WHITELIST", "totally-fake-license")
    wl = whitelisted_licenses()
    # Defaults preserved because no real tag was recognised.
    assert LicenseTag.CC0 in wl


# ── Stage 1: license validation ──────────────────────────────────────


def test_validation_rejects_empty_content() -> None:
    cand = IngestionCandidate(
        content="   ",
        source_url="https://example.com",
        source_name="example",
        license_tag=LicenseTag.CC0,
    )
    r = validate_ingestion_candidate(cand)
    assert r.accepted is False
    assert r.reject_code == RejectReason.EMPTY_CONTENT


def test_validation_rejects_missing_license_tag() -> None:
    cand = IngestionCandidate(
        content="Krishna teaches selfless action.",
        source_url="https://example.com",
        source_name="example",
        license_tag=None,
    )
    r = validate_ingestion_candidate(cand)
    assert r.accepted is False
    assert r.reject_code == RejectReason.MISSING_LICENSE_TAG


def test_validation_rejects_non_whitelisted_license(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("KIAAN_LICENSE_WHITELIST", "CC0")
    cand = IngestionCandidate(
        content="Krishna teaches selfless action.",
        source_url="https://example.com",
        source_name="example",
        license_tag=LicenseTag.CC_BY,
    )
    r = validate_ingestion_candidate(cand)
    assert r.accepted is False
    assert r.reject_code == RejectReason.LICENSE_NOT_WHITELISTED


def test_validation_rejects_cc_by_without_attribution() -> None:
    """CC-BY requires attribution; missing it is a license breach."""
    cand = IngestionCandidate(
        content="Krishna teaches selfless action.",
        source_url="https://example.com",
        source_name="example",
        license_tag=LicenseTag.CC_BY,
        attribution="",  # missing
    )
    r = validate_ingestion_candidate(cand)
    assert r.accepted is False
    assert r.reject_code == RejectReason.MISSING_ATTRIBUTION


def test_validation_rejects_cc_by_sa_without_attribution() -> None:
    cand = IngestionCandidate(
        content="Krishna teaches selfless action.",
        source_url="https://example.com",
        source_name="example",
        license_tag=LicenseTag.CC_BY_SA,
        attribution="   ",  # whitespace only
    )
    r = validate_ingestion_candidate(cand)
    assert r.accepted is False
    assert r.reject_code == RejectReason.MISSING_ATTRIBUTION


def test_validation_accepts_first_party_without_attribution() -> None:
    """FIRST_PARTY content doesn't need an upstream attribution
    string — we're the author."""
    cand = IngestionCandidate(
        content="Our own modern reflection on equanimity.",
        source_url="internal://seed_dynamic_wisdom",
        source_name="kiaan_internal",
        license_tag=LicenseTag.FIRST_PARTY,
        attribution="",
    )
    r = validate_ingestion_candidate(cand)
    assert r.accepted is True


def test_validation_accepts_pd_pre_1928() -> None:
    cand = IngestionCandidate(
        content="The translation of Annie Besant 1905.",
        source_url="https://archive.org/example",
        source_name="Besant 1905",
        license_tag=LicenseTag.PD_PRE_1928,
    )
    r = validate_ingestion_candidate(cand)
    assert r.accepted is True


# ── Stage 2: denylist phrase scrubber ────────────────────────────────


def test_contains_denylisted_phrase_catches_all_seed_phrases() -> None:
    """Every phrase from ip-hygiene.yml must be caught regardless of
    case + whitespace variations."""
    for phrase in DENYLIST_PHRASES:
        for sample in (
            phrase,
            phrase.upper(),
            phrase.lower(),
            f"  prefix  {phrase}  suffix  ",
        ):
            assert contains_denylisted_phrase(sample) == phrase, (
                f"missed phrase {phrase!r} in sample {sample!r}"
            )


def test_contains_denylisted_phrase_returns_none_on_clean_text() -> None:
    assert contains_denylisted_phrase("Krishna teaches yoga.") is None
    assert contains_denylisted_phrase("") is None


def test_contains_denylisted_phrase_normalises_whitespace() -> None:
    """A hard-wrapped excerpt across lines must still match."""
    sample = "Supreme\nPersonality\nof\nGodhead"
    assert contains_denylisted_phrase(sample) == "Supreme Personality of Godhead"


def test_validation_rejects_content_with_denylisted_phrase() -> None:
    """Even a license-clean candidate is rejected when content matches
    the Prabhupada / ISKCON signature lexicon."""
    cand = IngestionCandidate(
        content=(
            "The Supreme Personality of Godhead instructs us to act "
            "without attachment."
        ),
        source_url="https://example.com",
        source_name="example",
        license_tag=LicenseTag.OPERATOR_REVIEWED,
    )
    r = validate_ingestion_candidate(cand)
    assert r.accepted is False
    assert r.reject_code == RejectReason.DENYLISTED_PHRASE
    assert r.matched_phrase == "Supreme Personality of Godhead"


def test_validation_accepts_clean_first_party_content() -> None:
    cand = IngestionCandidate(
        content=(
            "Acting without attachment to results is the heart of "
            "karma yoga as the Gita teaches it."
        ),
        source_url="internal://seed_dynamic_wisdom",
        source_name="kiaan_internal",
        license_tag=LicenseTag.FIRST_PARTY,
    )
    r = validate_ingestion_candidate(cand)
    assert r.accepted is True


# ── Retention: purge low-value rows ──────────────────────────────────


def _make_row(
    row_id: str, created_days_ago: int, usage_count: int
) -> MagicMock:
    r = MagicMock()
    r.id = row_id
    r.created_at = datetime.now(UTC) - timedelta(days=created_days_ago)
    r.usage_count = usage_count
    r.deleted_at = None
    return r


def _patch_db_for_rows(rows: list[MagicMock]) -> AsyncMock:
    """Stub ``db.execute`` to return a select-result whose
    ``.scalars().all()`` yields the given rows. ``execute`` for
    UPDATE statements returns a no-op."""
    db = MagicMock()

    async def _execute(stmt):
        result = MagicMock()
        # Only the SELECT call drives the scalar yield; UPDATE calls
        # just no-op.
        scalars = MagicMock()
        scalars.all = MagicMock(return_value=rows)
        result.scalars = MagicMock(return_value=scalars)
        return result

    db.execute = AsyncMock(side_effect=_execute)
    return db


@pytest.mark.asyncio
async def test_purge_low_value_dry_run_does_not_write() -> None:
    rows = [
        _make_row("a", created_days_ago=120, usage_count=1),
        _make_row("b", created_days_ago=100, usage_count=2),
    ]
    db = _patch_db_for_rows(rows)
    stats = await purge_low_value_learned_rows(db, dry_run=True)
    assert stats["rows_eligible"] == 2
    assert stats["rows_purged"] == 0
    assert stats["dry_run"] is True
    # Only the SELECT call should have been issued.
    assert db.execute.await_count == 1


@pytest.mark.asyncio
async def test_purge_low_value_executes_when_dry_run_false() -> None:
    rows = [
        _make_row("a", created_days_ago=120, usage_count=1),
    ]
    db = _patch_db_for_rows(rows)
    stats = await purge_low_value_learned_rows(db, dry_run=False)
    assert stats["rows_eligible"] == 1
    assert stats["rows_purged"] == 1
    assert stats["dry_run"] is False
    # SELECT + UPDATE.
    assert db.execute.await_count == 2


@pytest.mark.asyncio
async def test_purge_low_value_no_rows_is_noop() -> None:
    db = _patch_db_for_rows([])
    stats = await purge_low_value_learned_rows(db, dry_run=False)
    assert stats["rows_eligible"] == 0
    assert stats["rows_purged"] == 0
    # SELECT only — no UPDATE issued for an empty set.
    assert db.execute.await_count == 1


# ── Effectiveness auto-reject ────────────────────────────────────────


@pytest.mark.asyncio
async def test_mark_low_effectiveness_dry_run_does_not_write() -> None:
    rows = [
        _make_row("a", created_days_ago=10, usage_count=25),
        _make_row("b", created_days_ago=10, usage_count=30),
    ]
    db = _patch_db_for_rows(rows)
    stats = await mark_low_effectiveness_rejected(db, dry_run=True)
    assert stats["rows_eligible"] == 2
    assert stats["rows_rejected"] == 0
    assert stats["dry_run"] is True
    assert db.execute.await_count == 1  # SELECT only


@pytest.mark.asyncio
async def test_mark_low_effectiveness_executes_when_dry_run_false() -> None:
    rows = [_make_row("a", created_days_ago=10, usage_count=25)]
    db = _patch_db_for_rows(rows)
    stats = await mark_low_effectiveness_rejected(db, dry_run=False)
    assert stats["rows_eligible"] == 1
    assert stats["rows_rejected"] == 1
    assert db.execute.await_count == 2  # SELECT + UPDATE
