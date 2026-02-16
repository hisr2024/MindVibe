"""Subscription Cost Calculator - OpenAI Usage Costing with Profit Margins.

Calculates the true cost of running each subscription tier based on:
- OpenAI API token costs (GPT-4o-mini pricing)
- Average prompt and completion token usage per KIAAN question
- Monthly quota per tier
- Infrastructure overhead (server, database, CDN, monitoring)
- Configurable profit margins

Exposes cost breakdowns so pricing decisions are data-driven.
"""

import logging
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)

# Mirrored from openai_optimizer.py to avoid heavy dependency chain (tiktoken, openai SDK)
# Keep in sync when model pricing changes.
COST_PER_1M_PROMPT_TOKENS = 0.15   # $0.15 per 1M prompt tokens (gpt-4o-mini)
COST_PER_1M_COMPLETION_TOKENS = 0.60  # $0.60 per 1M completion tokens (gpt-4o-mini)


# ---------------------------------------------------------------------------
# OpenAI model pricing lookup ($ per 1M tokens)
# Source: https://openai.com/api/pricing
# ---------------------------------------------------------------------------
MODEL_PRICING: dict[str, dict[str, float]] = {
    "gpt-4o-mini": {
        "prompt": 0.15,       # $0.15 per 1M prompt tokens
        "completion": 0.60,   # $0.60 per 1M completion tokens
    },
    "gpt-4o": {
        "prompt": 2.50,       # $2.50 per 1M prompt tokens
        "completion": 10.00,  # $10.00 per 1M completion tokens
    },
    "gpt-4-turbo": {
        "prompt": 10.00,
        "completion": 30.00,
    },
    "gpt-3.5-turbo": {
        "prompt": 0.50,
        "completion": 1.50,
    },
}

# Default model used by MindVibe's KIAAN engine
DEFAULT_MODEL = "gpt-4o-mini"

# ---------------------------------------------------------------------------
# Average token usage per KIAAN question (measured from production logs)
# These are configurable defaults; pass overrides for more accurate estimates.
# ---------------------------------------------------------------------------
DEFAULT_AVG_PROMPT_TOKENS = 650      # System prompt + user context + conversation
DEFAULT_AVG_COMPLETION_TOKENS = 200  # Average KIAAN response length

# ---------------------------------------------------------------------------
# Infrastructure overhead as monthly fixed cost per tier.
# Covers: server compute, PostgreSQL, Redis, CDN, monitoring, backups.
# ---------------------------------------------------------------------------
INFRA_COST_PER_TIER: dict[str, float] = {
    "free":       0.00,   # Subsidized by paid tiers
    "basic":      1.50,   # Shared infra allocation
    "premium":    3.00,   # Higher resource allocation
}

# Default profit margin percentages by tier
DEFAULT_PROFIT_MARGINS: dict[str, float] = {
    "free":       0.0,    # 0% - loss leader / acquisition funnel
    "basic":      60.0,   # 60% margin target
    "premium":    65.0,   # 65% margin target
}

# Tier quota definitions (mirrors feature_config.py, kept here for standalone use)
TIER_QUOTAS: dict[str, int] = {
    "free":       15,
    "basic":      150,   # Plus tier
    "premium":    300,   # Pro tier
}


@dataclass
class OpenAICostEstimate:
    """Cost estimate for OpenAI API usage per single KIAAN question."""

    model: str
    avg_prompt_tokens: int
    avg_completion_tokens: int
    cost_per_question: float   # $ per single question
    prompt_cost: float         # prompt portion
    completion_cost: float     # completion portion


@dataclass
class TierCostBreakdown:
    """Full cost breakdown for a single subscription tier."""

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


@dataclass
class CostCalculatorResult:
    """Aggregated cost calculation across all tiers."""

    model: str
    avg_prompt_tokens: int
    avg_completion_tokens: int
    cost_per_question: float
    tiers: list[TierCostBreakdown] = field(default_factory=list)
    summary: dict[str, Any] = field(default_factory=dict)


def calculate_cost_per_question(
    model: str = DEFAULT_MODEL,
    avg_prompt_tokens: int = DEFAULT_AVG_PROMPT_TOKENS,
    avg_completion_tokens: int = DEFAULT_AVG_COMPLETION_TOKENS,
) -> OpenAICostEstimate:
    """Calculate the OpenAI cost for a single KIAAN question.

    Args:
        model: OpenAI model name.
        avg_prompt_tokens: Average prompt tokens per question.
        avg_completion_tokens: Average completion tokens per question.

    Returns:
        OpenAICostEstimate with per-question cost breakdown.
    """
    pricing = MODEL_PRICING.get(model, MODEL_PRICING[DEFAULT_MODEL])

    prompt_cost = (avg_prompt_tokens / 1_000_000) * pricing["prompt"]
    completion_cost = (avg_completion_tokens / 1_000_000) * pricing["completion"]
    total = prompt_cost + completion_cost

    return OpenAICostEstimate(
        model=model,
        avg_prompt_tokens=avg_prompt_tokens,
        avg_completion_tokens=avg_completion_tokens,
        cost_per_question=total,
        prompt_cost=prompt_cost,
        completion_cost=completion_cost,
    )


def calculate_tier_cost(
    tier: str,
    cost_per_question: float,
    monthly_questions: int,
    infra_cost: float,
    profit_margin_pct: float,
    current_price: float,
) -> TierCostBreakdown:
    """Calculate the full cost breakdown for a subscription tier.

    Args:
        tier: Tier name (free, basic, premium).
        cost_per_question: OpenAI cost per single KIAAN question.
        monthly_questions: Expected monthly questions for the tier.
        infra_cost: Monthly infrastructure cost allocation.
        profit_margin_pct: Target profit margin percentage (0-100).
        current_price: Current subscription price.

    Returns:
        TierCostBreakdown with costs, margins, and suggested pricing.
    """
    openai_monthly = cost_per_question * monthly_questions
    total_cost = openai_monthly + infra_cost

    # Suggested price = total_cost / (1 - margin%)
    # e.g. cost=$4, margin=60% → price = $4 / (1 - 0.6) = $10
    if profit_margin_pct >= 100:
        profit_margin_pct = 99.0  # cap to avoid division by zero

    margin_fraction = profit_margin_pct / 100.0
    if margin_fraction < 1.0:
        suggested_price = total_cost / (1.0 - margin_fraction)
    else:
        suggested_price = total_cost * 100  # fallback for edge case

    profit_amount = suggested_price - total_cost

    # Evaluate current pricing
    current_profit = current_price - total_cost
    if current_price > 0:
        current_margin = (current_profit / current_price) * 100.0
    else:
        current_margin = -100.0 if total_cost > 0 else 0.0

    return TierCostBreakdown(
        tier=tier,
        monthly_questions=monthly_questions,
        openai_cost_per_question=cost_per_question,
        openai_cost_monthly=round(openai_monthly, 6),
        infrastructure_cost_monthly=round(infra_cost, 2),
        total_cost_monthly=round(total_cost, 6),
        profit_margin_pct=round(profit_margin_pct, 1),
        profit_amount_monthly=round(profit_amount, 2),
        suggested_price_monthly=round(suggested_price, 2),
        current_price_monthly=round(current_price, 2),
        current_margin_pct=round(current_margin, 1),
        current_profit_monthly=round(current_profit, 2),
        is_profitable=current_profit > 0,
    )


def calculate_subscription_costs(
    model: str = DEFAULT_MODEL,
    avg_prompt_tokens: int = DEFAULT_AVG_PROMPT_TOKENS,
    avg_completion_tokens: int = DEFAULT_AVG_COMPLETION_TOKENS,
    profit_margins: dict[str, float] | None = None,
    current_prices: dict[str, float] | None = None,
    infra_costs: dict[str, float] | None = None,
    tier_quotas: dict[str, int] | None = None,
) -> CostCalculatorResult:
    """Calculate subscription costs across all tiers with profit margins.

    This is the main entry point. It computes OpenAI API costs per question,
    projects monthly costs per tier, adds infrastructure overhead, and
    compares against current pricing to evaluate profitability.

    Args:
        model: OpenAI model name for pricing lookup.
        avg_prompt_tokens: Average prompt tokens per KIAAN question.
        avg_completion_tokens: Average completion tokens per KIAAN question.
        profit_margins: Target profit margin % per tier (overrides defaults).
        current_prices: Current monthly subscription prices per tier.
        infra_costs: Monthly infrastructure cost per tier (overrides defaults).
        tier_quotas: Monthly question quotas per tier (overrides defaults).

    Returns:
        CostCalculatorResult with per-tier breakdowns and summary.
    """
    margins = {**DEFAULT_PROFIT_MARGINS, **(profit_margins or {})}
    prices = current_prices or {
        "free": 0.00,
        "basic": 4.99,      # Plus tier
        "premium": 9.99,    # Pro tier
    }
    infra = {**INFRA_COST_PER_TIER, **(infra_costs or {})}
    quotas = {**TIER_QUOTAS, **(tier_quotas or {})}

    # Step 1: Per-question cost
    question_cost = calculate_cost_per_question(
        model=model,
        avg_prompt_tokens=avg_prompt_tokens,
        avg_completion_tokens=avg_completion_tokens,
    )

    # Step 2: Per-tier breakdown
    tiers: list[TierCostBreakdown] = []
    total_revenue = 0.0
    total_cost = 0.0

    for tier_name in ["free", "basic", "premium"]:
        monthly_q = quotas.get(tier_name, 0)

        breakdown = calculate_tier_cost(
            tier=tier_name,
            cost_per_question=question_cost.cost_per_question,
            monthly_questions=monthly_q,
            infra_cost=infra.get(tier_name, 0.0),
            profit_margin_pct=margins.get(tier_name, 50.0),
            current_price=prices.get(tier_name, 0.0),
        )
        tiers.append(breakdown)
        total_revenue += breakdown.current_price_monthly
        total_cost += breakdown.total_cost_monthly

    # Step 3: Summary
    blended_margin = ((total_revenue - total_cost) / total_revenue * 100.0) if total_revenue > 0 else 0.0

    summary = {
        "total_monthly_revenue_all_tiers": round(total_revenue, 2),
        "total_monthly_cost_all_tiers": round(total_cost, 6),
        "blended_profit_margin_pct": round(blended_margin, 1),
        "model_used": model,
        "pricing_per_1m_prompt_tokens": MODEL_PRICING.get(model, {}).get("prompt", 0),
        "pricing_per_1m_completion_tokens": MODEL_PRICING.get(model, {}).get("completion", 0),
        "unprofitable_tiers": [t.tier for t in tiers if not t.is_profitable],
    }

    result = CostCalculatorResult(
        model=model,
        avg_prompt_tokens=avg_prompt_tokens,
        avg_completion_tokens=avg_completion_tokens,
        cost_per_question=question_cost.cost_per_question,
        tiers=tiers,
        summary=summary,
    )

    logger.info(
        f"Cost calculation complete: model={model}, "
        f"cost/question=${question_cost.cost_per_question:.6f}, "
        f"blended_margin={blended_margin:.1f}%"
    )

    return result


def format_cost_report(result: CostCalculatorResult) -> str:
    """Format the cost calculation into a human-readable report.

    Args:
        result: CostCalculatorResult from calculate_subscription_costs.

    Returns:
        Formatted string report.
    """
    lines = []
    lines.append("=" * 80)
    lines.append("MINDVIBE SUBSCRIPTION COST CALCULATOR")
    lines.append(f"Model: {result.model} | Cost/Question: ${result.cost_per_question:.6f}")
    lines.append(f"Avg Tokens: {result.avg_prompt_tokens} prompt + {result.avg_completion_tokens} completion")
    lines.append("=" * 80)
    lines.append("")

    for t in result.tiers:
        status = "PROFITABLE" if t.is_profitable else "LOSS"
        lines.append(f"--- {t.tier.upper()} TIER ---")
        lines.append(f"  Monthly Questions:        {t.monthly_questions:,}")
        lines.append(f"  OpenAI Cost/Question:     ${t.openai_cost_per_question:.6f}")
        lines.append(f"  OpenAI Cost/Month:        ${t.openai_cost_monthly:.4f}")
        lines.append(f"  Infrastructure Cost/Month:${t.infrastructure_cost_monthly:.2f}")
        lines.append(f"  Total Cost/Month:         ${t.total_cost_monthly:.4f}")
        lines.append(f"  Target Margin:            {t.profit_margin_pct:.1f}%")
        lines.append(f"  Suggested Price:          ${t.suggested_price_monthly:.2f}/mo")
        lines.append(f"  Current Price:            ${t.current_price_monthly:.2f}/mo")
        lines.append(f"  Current Margin:           {t.current_margin_pct:.1f}%")
        lines.append(f"  Current Profit:           ${t.current_profit_monthly:.2f}/mo")
        lines.append(f"  Status:                   [{status}]")
        lines.append("")

    s = result.summary
    lines.append("=" * 80)
    lines.append("SUMMARY")
    lines.append(f"  Total Revenue (all tiers): ${s['total_monthly_revenue_all_tiers']:.2f}/mo")
    lines.append(f"  Total Cost (all tiers):    ${s['total_monthly_cost_all_tiers']:.4f}/mo")
    lines.append(f"  Blended Margin:            {s['blended_profit_margin_pct']:.1f}%")
    if s["unprofitable_tiers"]:
        lines.append(f"  Unprofitable Tiers:        {', '.join(s['unprofitable_tiers'])}")
    else:
        lines.append("  All tiers profitable.")
    lines.append("=" * 80)

    return "\n".join(lines)
