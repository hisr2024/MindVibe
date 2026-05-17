"""Daemon-ingestion safety harness for the Dynamic Wisdom corpus.

Implements ``IMPROVEMENT_ROADMAP.md`` P2 §16. The 24/7 learning daemon
(``backend/services/kiaan_learning_daemon.py``) is intentionally dormant
today — the audit (``AUDIT_VOICE_DEEP.md`` Q3) flagged its trusted-
source list as ``"REMOVED-PENDING-LICENSE-REVIEW"`` and the
``learned_wisdom`` table sits at 0 rows by design.

When ops decides to flip the daemon on, this module is the rail:

  1. **Per-source license whitelist** — every candidate carries an
     explicit ``LicenseTag``. Anything untagged or non-whitelisted is
     rejected at Stage 1, before we do anything expensive.

  2. **Copyright phrase scrubber** — a denylist seeded from
     ``.github/workflows/ip-hygiene.yml`` (Prabhupada, Easwaran,
     ISKCON characteristic phrases). Catches accidental drift even
     when the upstream license tag looks clean.

  3. **Retention policy** — purges ``learned_wisdom`` rows that
     never proved useful: ``usage_count < 3`` AND
     ``created_at < now - 90 days``. Plus marks rows whose
     ``quality_score`` is consistently low (< 0.4 over 20+
     deliveries) as ``validation_status=REJECTED`` rather than
     serving them.

Public surface
--------------
:class:`LicenseTag`                       — enum of permitted tags
:class:`IngestionCandidate`               — input shape for validation
:class:`IngestionValidationResult`        — decision + reason
:func:`validate_ingestion_candidate`      — Stage 1 + Stage 2 check
:func:`contains_denylisted_phrase`        — Stage 2 in isolation
:func:`purge_low_value_learned_rows`      — retention pass (90d / <3
                                            usage)
:func:`mark_low_effectiveness_rejected`   — quality-score auto-reject

None of these activate the daemon — that requires
``KIAAN_DAEMON_ENABLED=true`` in env + a curated trusted-source list.
This module is the safety net for when that flag flips.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from enum import Enum
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


# ── License whitelist ─────────────────────────────────────────────────


class LicenseTag(str, Enum):
    """Permitted licenses for daemon-ingested wisdom content.

    The tag is set by the *operator* who curates the trusted-source
    list — it does not come from the upstream. Anything that can't be
    tagged here goes through manual editorial review or is rejected.
    """

    CC0 = "CC0"
    """Creative Commons Zero — public domain dedication."""

    CC_BY = "CC-BY"
    """Creative Commons Attribution — attribution required, derivatives OK."""

    CC_BY_SA = "CC-BY-SA"
    """Creative Commons Attribution-ShareAlike — same license required."""

    PD_PRE_1928 = "PD-pre-1928"
    """Public domain by age (pre-1928 in the US, similar in most jurisdictions)."""

    FIRST_PARTY = "first-party"
    """MindVibe / Kiaanverse authored content (e.g. the
    ``scripts/seed_dynamic_wisdom.py`` LLM-paraphrase output)."""

    OPERATOR_REVIEWED = "operator-reviewed"
    """Operator manually reviewed the source license. Tag of last
    resort — every entry should still be peer-checked."""


# Whitelist — what the daemon will accept. ``OPERATOR_REVIEWED`` is in
# here because it's the explicit human-in-the-loop tag; remove from
# the env (``KIAAN_LICENSE_WHITELIST``) if you want stricter machine-
# only ingestion.
_DEFAULT_WHITELIST: frozenset[LicenseTag] = frozenset(
    {
        LicenseTag.CC0,
        LicenseTag.CC_BY,
        LicenseTag.CC_BY_SA,
        LicenseTag.PD_PRE_1928,
        LicenseTag.FIRST_PARTY,
        LicenseTag.OPERATOR_REVIEWED,
    }
)


def whitelisted_licenses() -> frozenset[LicenseTag]:
    """Return the env-resolved license whitelist.

    Override via ``KIAAN_LICENSE_WHITELIST`` (comma-separated tag
    values). Unknown values are skipped with a warning so a typo can't
    silently widen acceptance.
    """
    raw = os.getenv("KIAAN_LICENSE_WHITELIST", "").strip()
    if not raw:
        return _DEFAULT_WHITELIST
    out: set[LicenseTag] = set()
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        try:
            out.add(LicenseTag(part))
        except ValueError:
            logger.warning(
                "kiaan_daemon_safety: unknown license tag %r in "
                "KIAAN_LICENSE_WHITELIST — ignored",
                part,
            )
    return frozenset(out) if out else _DEFAULT_WHITELIST


# ── Copyright phrase denylist ─────────────────────────────────────────
# Seeded from ``.github/workflows/ip-hygiene.yml::FORBIDDEN_PHRASES``
# so the CI guard and the runtime scrubber share one source of truth in
# spirit — when the CI list grows, also append here.
DENYLIST_PHRASES: tuple[str, ...] = (
    "Supreme Personality of Godhead",
    "scion of Bharata",
    "descendant of Bharata",
    "Never consider yourself the cause of the result",
    "perform your prescribed dut",  # matches "duty" / "duties"
    "abandon all varieties of dharma",
    "abandon all varieties of religion",
)


def contains_denylisted_phrase(text: str) -> str | None:
    """Return the first matching denylisted phrase, or ``None``.

    Match is case-insensitive. Whitespace inside the candidate text is
    normalised to single spaces so multi-line / hard-wrapped excerpts
    don't slip past the check.
    """
    if not text:
        return None
    normalised = " ".join(text.split()).lower()
    for phrase in DENYLIST_PHRASES:
        if phrase.lower() in normalised:
            return phrase
    return None


# ── Candidate + result types ──────────────────────────────────────────


@dataclass(frozen=True)
class IngestionCandidate:
    """One candidate row the daemon proposes to write to ``learned_wisdom``."""

    content: str
    source_url: str
    source_name: str
    license_tag: LicenseTag | None
    attribution: str = ""
    language: str = "en"
    extra: dict[str, Any] = field(default_factory=dict)


class RejectReason(str, Enum):
    EMPTY_CONTENT = "empty_content"
    MISSING_LICENSE_TAG = "missing_license_tag"
    LICENSE_NOT_WHITELISTED = "license_not_whitelisted"
    DENYLISTED_PHRASE = "denylisted_phrase"
    MISSING_ATTRIBUTION = "missing_attribution"  # for CC-BY / CC-BY-SA


@dataclass(frozen=True)
class IngestionValidationResult:
    accepted: bool
    reason: str  # human-readable
    reject_code: RejectReason | None = None
    matched_phrase: str | None = None  # populated on DENYLISTED_PHRASE


# ── Two-stage validator ───────────────────────────────────────────────


def validate_ingestion_candidate(
    candidate: IngestionCandidate,
) -> IngestionValidationResult:
    """Stage 1 (license) + Stage 2 (copyright scrub).

    Stage 1 — license whitelist:
      * Reject untagged candidates (``MISSING_LICENSE_TAG``).
      * Reject tags outside the env-resolved whitelist
        (``LICENSE_NOT_WHITELISTED``).
      * Reject CC-BY / CC-BY-SA without attribution
        (``MISSING_ATTRIBUTION``) — attribution is contractual under
        those licenses; missing it is a license breach.

    Stage 2 — phrase scrubber:
      * Reject any candidate whose content contains a denylisted
        signature phrase (``DENYLISTED_PHRASE``). The matched phrase
        is surfaced in the result for operator inspection.

    Stage 0 (empty content): the cheapest reject.
    """
    if not candidate.content or not candidate.content.strip():
        return IngestionValidationResult(
            accepted=False,
            reason="content is empty or whitespace-only",
            reject_code=RejectReason.EMPTY_CONTENT,
        )

    # Stage 1: license
    if candidate.license_tag is None:
        return IngestionValidationResult(
            accepted=False,
            reason="no license tag set on candidate",
            reject_code=RejectReason.MISSING_LICENSE_TAG,
        )
    if candidate.license_tag not in whitelisted_licenses():
        return IngestionValidationResult(
            accepted=False,
            reason=(
                f"license {candidate.license_tag.value!r} not in "
                f"whitelist {sorted(t.value for t in whitelisted_licenses())}"
            ),
            reject_code=RejectReason.LICENSE_NOT_WHITELISTED,
        )
    if (
        candidate.license_tag in (LicenseTag.CC_BY, LicenseTag.CC_BY_SA)
        and not (candidate.attribution and candidate.attribution.strip())
    ):
        return IngestionValidationResult(
            accepted=False,
            reason=(
                f"license {candidate.license_tag.value} requires "
                "attribution — none provided"
            ),
            reject_code=RejectReason.MISSING_ATTRIBUTION,
        )

    # Stage 2: copyright phrase scrub
    matched = contains_denylisted_phrase(candidate.content)
    if matched:
        return IngestionValidationResult(
            accepted=False,
            reason=(
                f"content contains denylisted signature phrase "
                f"{matched!r} — suggests derivation from a copyrighted "
                f"translation"
            ),
            reject_code=RejectReason.DENYLISTED_PHRASE,
            matched_phrase=matched,
        )

    return IngestionValidationResult(
        accepted=True,
        reason=(
            f"accepted ({candidate.license_tag.value}; source="
            f"{candidate.source_name!r})"
        ),
    )


# ── Retention pass: purge low-value rows ──────────────────────────────


_DEFAULT_PURGE_AGE_DAYS = 90
_DEFAULT_PURGE_USAGE_THRESHOLD = 3


async def purge_low_value_learned_rows(
    db: AsyncSession,
    *,
    age_days: int = _DEFAULT_PURGE_AGE_DAYS,
    usage_threshold: int = _DEFAULT_PURGE_USAGE_THRESHOLD,
    dry_run: bool = True,
) -> dict[str, Any]:
    """Soft-delete ``learned_wisdom`` rows that never proved useful.

    Default policy: older than 90 days AND ``usage_count < 3``.
    The audit projected unbounded growth of ~250 MB-2 GB/year if the
    daemon runs without this. ``dry_run=True`` by default — explicit
    opt-in to write.

    Returns a stats dict the cron / admin endpoint can log.
    """
    from sqlalchemy import select, update

    from backend.models.ai import LearnedWisdom

    cutoff = datetime.now(UTC) - timedelta(days=age_days)
    candidates = await db.execute(
        select(LearnedWisdom).where(
            LearnedWisdom.created_at < cutoff,
            LearnedWisdom.usage_count < usage_threshold,
            LearnedWisdom.deleted_at.is_(None),
        )
    )
    rows = candidates.scalars().all()
    ids = [r.id for r in rows]

    if dry_run or not ids:
        return {
            "scanned_age_days": age_days,
            "usage_threshold": usage_threshold,
            "rows_eligible": len(ids),
            "rows_purged": 0,
            "dry_run": True,
        }

    now = datetime.now(UTC)
    await db.execute(
        update(LearnedWisdom)
        .where(LearnedWisdom.id.in_(ids))
        .values(deleted_at=now)
    )
    return {
        "scanned_age_days": age_days,
        "usage_threshold": usage_threshold,
        "rows_eligible": len(ids),
        "rows_purged": len(ids),
        "dry_run": False,
    }


# ── Quality-score auto-reject ─────────────────────────────────────────


_DEFAULT_QUALITY_THRESHOLD = 0.40


async def mark_low_effectiveness_rejected(
    db: AsyncSession,
    *,
    quality_threshold: float = _DEFAULT_QUALITY_THRESHOLD,
    min_deliveries: int = 20,
    dry_run: bool = True,
) -> dict[str, Any]:
    """Auto-reject rows that have proven ineffective.

    Default policy: ``quality_score < 0.40`` AND
    ``usage_count >= 20`` (enough deliveries to trust the signal).
    Sets ``validation_status=REJECTED`` so the retrieval path stops
    serving them; the row stays in the table for audit. To purge the
    rejected ones, run :func:`purge_low_value_learned_rows` separately.

    ``dry_run=True`` by default — explicit opt-in to write.
    """
    from sqlalchemy import select, update

    from backend.models.ai import LearnedWisdom, ValidationStatus

    candidates = await db.execute(
        select(LearnedWisdom).where(
            LearnedWisdom.quality_score < quality_threshold,
            LearnedWisdom.usage_count >= min_deliveries,
            LearnedWisdom.validation_status != ValidationStatus.REJECTED,
            LearnedWisdom.deleted_at.is_(None),
        )
    )
    rows = candidates.scalars().all()
    ids = [r.id for r in rows]

    if dry_run or not ids:
        return {
            "quality_threshold": quality_threshold,
            "min_deliveries": min_deliveries,
            "rows_eligible": len(ids),
            "rows_rejected": 0,
            "dry_run": True,
        }

    await db.execute(
        update(LearnedWisdom)
        .where(LearnedWisdom.id.in_(ids))
        .values(
            validation_status=ValidationStatus.REJECTED,
            rejection_reason=(
                f"auto-reject: quality_score < {quality_threshold} "
                f"over {min_deliveries}+ deliveries"
            ),
        )
    )
    return {
        "quality_threshold": quality_threshold,
        "min_deliveries": min_deliveries,
        "rows_eligible": len(ids),
        "rows_rejected": len(ids),
        "dry_run": False,
    }


__all__ = [
    "DENYLIST_PHRASES",
    "IngestionCandidate",
    "IngestionValidationResult",
    "LicenseTag",
    "RejectReason",
    "contains_denylisted_phrase",
    "mark_low_effectiveness_rejected",
    "purge_low_value_learned_rows",
    "validate_ingestion_candidate",
    "whitelisted_licenses",
]
