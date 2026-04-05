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
