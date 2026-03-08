"""
Karma Problem Analysis API - Real-Life Problem to Karmic Path Resolution.

This module provides API endpoints for analyzing real-life problems and
mapping them to the appropriate karmic path for transformation through
the Karma Reset system.

Endpoints:
- GET  /api/karma-reset/problems/categories     - All problem categories
- GET  /api/karma-reset/problems/category/{key}  - Problems in a category
- POST /api/karma-reset/problems/analyze         - Analyze situation text
- GET  /api/karma-reset/problems/problem/{id}    - Get specific problem
- GET  /api/karma-reset/problems/all              - All problems flat list

The Gita teaches (BG 4.17): "The intricacies of action are very hard
to understand. Therefore one should know properly what action is,
what forbidden action is, and what inaction is."
"""

import logging
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.karma_problem_resolver import KarmaProblemResolver

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/karma-reset/problems",
    tags=["karma-reset", "problems"]
)

problem_resolver = KarmaProblemResolver()


# ==================== REQUEST/RESPONSE MODELS ====================

class AnalyzeSituationRequest(BaseModel):
    """Request model for situation analysis."""
    situation: str = Field(
        ...,
        min_length=5,
        max_length=2000,
        description="Description of the problem or situation"
    )


class ProblemTemplate(BaseModel):
    """A specific problem template with karmic path recommendation."""
    id: str
    label: str
    situation_template: str
    feeling_template: str
    shad_ripu: str
    primary_path: str
    secondary_path: str
    gita_ref: str
    healing_insight: str


class ProblemCategory(BaseModel):
    """A category of life problems."""
    key: str
    name: str
    sanskrit_name: str
    sanskrit_label: str
    icon: str
    description: str
    color: str
    problem_count: int


class SituationAnalysis(BaseModel):
    """Result of analyzing a situation description."""
    recommended_category: str
    category_name: str
    category_sanskrit: str
    recommended_path: str
    path_name: str
    path_sanskrit: str
    secondary_path: str
    confidence: float
    matched_keywords: list[str]
    healing_insight: str
    gita_ref: str
    matched_problem: Optional[dict[str, Any]] = None
    shad_ripu: str


# ==================== ENDPOINTS ====================

@router.get("/categories", response_model=list[ProblemCategory])
async def get_problem_categories():
    """
    Get all life problem categories.

    Returns the 8 major categories of human problems/situations,
    each mapped to Gita-aligned karmic paths for resolution.
    """
    categories = problem_resolver.get_problem_categories()
    return categories


@router.get("/category/{category_key}")
async def get_category_problems(category_key: str):
    """
    Get all problems within a specific category.

    Args:
        category_key: Category identifier (e.g., 'relationship_conflict')

    Returns:
        List of problem templates with karmic path recommendations
    """
    problems = problem_resolver.get_problems_for_category(category_key)
    if not problems:
        raise HTTPException(
            status_code=404,
            detail=f"Category '{category_key}' not found. Use /categories to see available categories."
        )
    return {
        "category": category_key,
        "problems": problems,
        "total": len(problems),
    }


@router.post("/analyze", response_model=SituationAnalysis)
async def analyze_situation(body: AnalyzeSituationRequest):
    """
    Analyze a situation description and recommend the best karmic path.

    Uses intelligent keyword analysis to identify:
    - The problem category
    - The recommended karmic path
    - A secondary alternative path
    - Confidence score (0-1)
    - Relevant Gita reference
    - Healing insight from Gita wisdom
    """
    analysis = problem_resolver.analyze_situation(body.situation)

    logger.info(
        f"Situation analyzed: category={analysis['recommended_category']}, "
        f"path={analysis['recommended_path']}, "
        f"confidence={analysis['confidence']}"
    )

    return SituationAnalysis(**analysis)


@router.get("/problem/{problem_id}")
async def get_problem_by_id(problem_id: str):
    """
    Get a specific problem template by its ID.

    Args:
        problem_id: Problem identifier (e.g., 'hurt_partner')

    Returns:
        Problem data with category info and karmic path recommendation
    """
    problem = problem_resolver.get_problem_by_id(problem_id)
    if not problem:
        raise HTTPException(
            status_code=404,
            detail=f"Problem '{problem_id}' not found."
        )
    return problem


@router.get("/all")
async def get_all_problems():
    """
    Get all problems across all categories in a flat list.

    Useful for search/filter functionality on the frontend.
    """
    problems = problem_resolver.get_all_problems_flat()
    return {
        "problems": problems,
        "total": len(problems),
    }
