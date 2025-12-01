"""Plan-based feature gating middleware and helpers."""
from __future__ import annotations

import json
import logging
from typing import Callable, Iterable

from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware

from backend.core.settings import settings

logger = logging.getLogger("mindvibe.feature_gates")

DEFAULT_PLAN_MATRIX = {
    "free": {
        "chat",
        "journal",
        "health-check",
    },
    "pro": {
        "chat",
        "journal",
        "health-check",
        "webhooks",
        "advanced-insights",
    },
    "enterprise": {
        "chat",
        "journal",
        "health-check",
        "webhooks",
        "advanced-insights",
        "governance",
    },
}

PLAN_ORDER: list[str] = ["free", "pro", "enterprise"]


def _load_plan_matrix() -> dict[str, set[str]]:
    """Load the plan matrix from environment or defaults."""
    if settings.FEATURE_PLAN_MATRIX:
        try:
            parsed = json.loads(settings.FEATURE_PLAN_MATRIX)
            return {key.lower(): set(value) for key, value in parsed.items()}
        except json.JSONDecodeError:
            logger.warning("invalid_plan_matrix_config", extra={"value": settings.FEATURE_PLAN_MATRIX})
    return {key: set(value) for key, value in DEFAULT_PLAN_MATRIX.items()}


def _plan_satisfies(plan: str, minimum_plan: str | None) -> bool:
    if not minimum_plan:
        return True
    try:
        return PLAN_ORDER.index(plan) >= PLAN_ORDER.index(minimum_plan)
    except ValueError:
        return False


def _normalize_plan(plan: str | None) -> str:
    return (plan or settings.DEFAULT_PLAN).lower()


def require_feature(feature: str, minimum_plan: str | None = None) -> Callable:
    """Decorator to annotate routes with a required feature/plan."""

    def decorator(func: Callable) -> Callable:
        setattr(func, "__required_feature__", feature)
        if minimum_plan:
            setattr(func, "__required_plan__", minimum_plan.lower())
        return func

    return decorator


class PlanGateMiddleware(BaseHTTPMiddleware):
    """Middleware that enforces plan-based access rules when present."""

    def __init__(self, app):
        super().__init__(app)
        self.plan_matrix = _load_plan_matrix()

    async def dispatch(self, request: Request, call_next: Callable):
        plan = _normalize_plan(request.headers.get("X-User-Plan") or request.query_params.get("plan"))
        allowed_features: set[str] = self.plan_matrix.get(plan, set())

        # store on request state for downstream handlers
        request.state.plan = plan
        request.state.allowed_features = allowed_features

        endpoint = request.scope.get("endpoint")
        required_feature = getattr(endpoint, "__required_feature__", None)
        required_plan = getattr(endpoint, "__required_plan__", None)

        if required_plan and not _plan_satisfies(plan, required_plan):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Plan '{plan}' is below the required tier '{required_plan}'",
            )

        if required_feature and required_feature not in allowed_features:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature '{required_feature}' is not enabled for plan '{plan}'",
            )

        response = await call_next(request)
        response.headers["X-Plan"] = plan
        response.headers["X-Allowed-Features"] = ",".join(sorted(allowed_features)) if allowed_features else ""
        return response

    def reload_matrix(self, matrix: dict[str, Iterable[str]]) -> None:
        self.plan_matrix = {key.lower(): set(value) for key, value in matrix.items()}

