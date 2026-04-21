"""KarmaLytix Pydantic schemas for request/response validation."""

from __future__ import annotations

from datetime import date
from typing import Any, Optional

from pydantic import BaseModel


class KarmaScoreResponse(BaseModel):
    """Response schema for a karma score."""

    id: int
    user_id: str
    score_date: date
    emotional_balance: int
    spiritual_growth: int
    consistency: int
    self_awareness: int
    wisdom_integration: int
    overall_score: int

    model_config = {"from_attributes": True}


class KarmaPatternResponse(BaseModel):
    """Response schema for a detected karma pattern."""

    id: int
    pattern_type: str
    pattern_name: str
    description: str
    confidence_score: float
    is_active: bool
    gita_verse_ref: Optional[dict[str, Any]] = None
    supporting_data: dict[str, Any] = {}

    model_config = {"from_attributes": True}


class KarmaReportResponse(BaseModel):
    """Response schema for a karma report."""

    id: int
    report_date: date
    report_type: str
    period_start: date
    period_end: date
    karma_dimensions: dict[str, Any]
    overall_karma_score: int
    kiaan_insight: Optional[str] = None
    recommended_verses: list[dict[str, Any]] = []
    patterns_detected: dict[str, Any] = {}
    comparison_to_previous: dict[str, Any] = {}

    model_config = {"from_attributes": True}


class KarmaDashboardResponse(BaseModel):
    """Response schema for the full karma dashboard."""

    score: KarmaScoreResponse
    patterns: list[KarmaPatternResponse]
    latest_report: Optional[KarmaReportResponse] = None
    history: list[KarmaReportResponse] = []
    privacy_note: str


class GenerateInsightRequest(BaseModel):
    """Request schema for generating a new KIAAN insight."""

    force_regenerate: bool = False


# ---------------------------------------------------------------------------
# Analytics router (PROMPT 4 contract)
#
# The mobile KarmaLytix screen consumes a slightly richer response than the
# legacy /karmalytix/weekly-report shape — it expects the full six-section
# Sacred Mirror JSON (mirror / pattern / gita_echo / growth_edge / blessing
# / dynamic_wisdom) nested inside ``patterns_detected``. We expose a
# dedicated schema here so the contract is obvious at the route layer.
# ---------------------------------------------------------------------------


class SacredReflectionGitaEcho(BaseModel):
    """Curated Gita verse reference emitted as part of the reflection."""

    chapter: int
    verse: int
    sanskrit: str
    connection: str = ""


class SacredReflection(BaseModel):
    """The six structured sections returned by KIAAN's Sacred Mirror."""

    mirror: str
    pattern: str
    gita_echo: SacredReflectionGitaEcho
    growth_edge: str
    blessing: str
    dynamic_wisdom: str


class JournalMetadataSummary(BaseModel):
    """Plaintext metadata aggregated for the reporting period."""

    entry_count: int = 0
    journaling_days: int = 0
    mood_counts: dict[str, int] = {}
    tag_frequencies: dict[str, int] = {}
    unique_tag_count: int = 0
    top_tags: list[list[Any]] = []  # list of [tag, count] pairs
    dominant_mood: Optional[str] = None
    dominant_category: Optional[str] = None
    dominant_time_of_day: Optional[str] = None
    verse_bookmarks: int = 0
    assessment_completed: bool = False


class AnalyticsWeeklyReportResponse(BaseModel):
    """Response for /api/analytics/weekly-report and /api/analytics/generate."""

    id: Optional[int] = None
    report_date: Optional[date] = None
    report_type: str = "weekly"
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    karma_dimensions: dict[str, int] = {}
    overall_karma_score: int = 0
    journal_metadata_summary: JournalMetadataSummary = JournalMetadataSummary()
    kiaan_insight: Optional[str] = None
    recommended_verses: list[dict[str, Any]] = []
    patterns_detected: dict[str, Any] = {}
    comparison_to_previous: dict[str, Any] = {}
    # When insufficient data, fields above stay default and the two flags
    # below tell the mobile UI to render its "Write more reflections" card.
    insufficient_data: bool = False
    entries_needed: int = 0
    message: Optional[str] = None

    model_config = {"from_attributes": True}


class AnalyticsGenerateRequest(BaseModel):
    """Request schema for POST /api/analytics/generate."""

    force_regenerate: bool = False
