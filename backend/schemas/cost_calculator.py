"""Pydantic schemas for the subscription cost calculator endpoint."""

from pydantic import BaseModel, Field
from typing import Any


class CostCalculatorRequest(BaseModel):
    """Input schema for the subscription cost calculator.

    All fields are optional - defaults are used when not provided.
    """

    model: str = Field(
        default="gpt-4o-mini",
        description="OpenAI model to use for pricing calculation.",
    )
    avg_prompt_tokens: int = Field(
        default=650,
        ge=1,
        le=128000,
        description="Average prompt tokens per KIAAN question.",
    )
    avg_completion_tokens: int = Field(
        default=200,
        ge=1,
        le=16000,
        description="Average completion tokens per KIAAN response.",
    )
    profit_margins: dict[str, float] | None = Field(
        default=None,
        description="Target profit margin % per tier. Keys: free, basic, premium, enterprise. Values: 0-99.",
    )
    enterprise_estimated_questions: int = Field(
        default=2000,
        ge=100,
        le=100000,
        description="Estimated monthly questions for enterprise tier (unlimited quota).",
    )


class TierCostBreakdownOut(BaseModel):
    """Cost breakdown for a single subscription tier."""

    tier: str
    monthly_questions: int
    openai_cost_per_question: float
    openai_cost_monthly: float
    infrastructure_cost_monthly: float
    total_cost_monthly: float
    profit_margin_pct: float
    profit_amount_monthly: float
    suggested_price_monthly: float
    current_price_monthly: float
    current_margin_pct: float
    current_profit_monthly: float
    is_profitable: bool


class CostCalculatorResponse(BaseModel):
    """Full response from the subscription cost calculator."""

    model: str
    avg_prompt_tokens: int
    avg_completion_tokens: int
    cost_per_question: float
    tiers: list[TierCostBreakdownOut]
    summary: dict[str, Any]
