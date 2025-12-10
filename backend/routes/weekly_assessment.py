"""
KIAAN Weekly Assessment API Routes

Provides structured weekly mental health evaluations with
Gita-wisdom integration and personalized recommendations.
"""

import logging
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user_optional, get_db
from backend.models import UserAssessment, GitaVerse
from backend.services.gita_service import GitaService
from backend.services.kiaan_core import KIAANCore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/kiaan/weekly-assessment", tags=["kiaan", "weekly-assessment"])

kiaan_core = KIAANCore()


# Assessment questions for mental health evaluation
ASSESSMENT_QUESTIONS = [
    {
        "id": "emotional_state",
        "question": "How would you describe your overall emotional state this week?",
        "type": "scale",
        "scale": {"min": 1, "max": 10, "labels": ["Very Poor", "Excellent"]},
    },
    {
        "id": "stress_level",
        "question": "What has been your stress level this week?",
        "type": "scale",
        "scale": {"min": 1, "max": 10, "labels": ["No Stress", "Extreme Stress"]},
    },
    {
        "id": "sleep_quality",
        "question": "How would you rate your sleep quality this week?",
        "type": "scale",
        "scale": {"min": 1, "max": 10, "labels": ["Very Poor", "Excellent"]},
    },
    {
        "id": "social_connection",
        "question": "How connected do you feel to others?",
        "type": "scale",
        "scale": {"min": 1, "max": 10, "labels": ["Very Isolated", "Very Connected"]},
    },
    {
        "id": "purpose_meaning",
        "question": "How strong is your sense of purpose and meaning?",
        "type": "scale",
        "scale": {"min": 1, "max": 10, "labels": ["No Purpose", "Very Strong Purpose"]},
    },
    {
        "id": "challenges_faced",
        "question": "What were your main challenges this week?",
        "type": "multiselect",
        "options": [
            "Anxiety", "Depression", "Stress", "Relationship Issues",
            "Work Pressure", "Health Concerns", "Financial Worries",
            "Loneliness", "Self-doubt", "Other"
        ],
    },
]


class AssessmentResponse(BaseModel):
    """Response model for weekly assessment."""
    id: int
    assessment_date: date
    assessment_type: str
    questions_responses: dict[str, Any]
    calculated_scores: dict[str, Any]
    recommended_focus_areas: list[str]
    personalized_verses: list[dict[str, Any]]
    overall_score: int | None
    completed: bool
    created_at: datetime


class AssessmentSubmission(BaseModel):
    """Request model for submitting assessment responses."""
    responses: dict[str, Any] = Field(
        ..., description="Responses to assessment questions"
    )


class AssessmentQuestions(BaseModel):
    """Response model for assessment questions."""
    questions: list[dict[str, Any]]


@router.get("/questions")
async def get_assessment_questions() -> AssessmentQuestions:
    """
    Get the weekly assessment questions.
    
    Returns a list of questions with their types and options.
    """
    return AssessmentQuestions(questions=ASSESSMENT_QUESTIONS)


@router.post("/submit")
async def submit_assessment(
    submission: AssessmentSubmission,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> AssessmentResponse:
    """
    Submit weekly assessment responses.
    
    Creates a new assessment record with calculated scores and
    personalized Gita verse recommendations based on responses.
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to submit assessment",
        )
    
    # Validate responses
    required_questions = {q["id"] for q in ASSESSMENT_QUESTIONS}
    provided_responses = set(submission.responses.keys())
    
    if not provided_responses.issubset(required_questions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question IDs in responses",
        )
    
    # Calculate scores
    calculated_scores = _calculate_scores(submission.responses)
    overall_score = calculated_scores.get("overall_score", 0)
    
    # Determine focus areas based on responses
    focus_areas = _determine_focus_areas(submission.responses, calculated_scores)
    
    # Get personalized verses based on challenges and scores
    verse_refs = await _get_personalized_verses(
        db, submission.responses, calculated_scores
    )
    
    # Create assessment record
    assessment = UserAssessment(
        user_id=user_id,
        assessment_date=date.today(),
        assessment_type="weekly",
        questions_responses=submission.responses,
        calculated_scores=calculated_scores,
        recommended_focus_areas=focus_areas,
        personalized_verses=verse_refs,
        overall_score=overall_score,
        completed=True,
    )
    
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    
    # Fetch full verse details
    verse_details = await _fetch_verse_details(db, verse_refs)
    
    return AssessmentResponse(
        id=assessment.id,
        assessment_date=assessment.assessment_date,
        assessment_type=assessment.assessment_type,
        questions_responses=assessment.questions_responses,
        calculated_scores=assessment.calculated_scores or {},
        recommended_focus_areas=assessment.recommended_focus_areas or [],
        personalized_verses=verse_details,
        overall_score=assessment.overall_score,
        completed=assessment.completed,
        created_at=assessment.created_at,
    )


@router.get("/latest")
async def get_latest_assessment(
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> AssessmentResponse | None:
    """
    Get the most recent weekly assessment for the user.
    
    Returns None if no assessments exist.
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for assessment",
        )
    
    result = await db.execute(
        select(UserAssessment)
        .where(UserAssessment.user_id == user_id)
        .order_by(UserAssessment.created_at.desc())
        .limit(1)
    )
    assessment = result.scalar_one_or_none()
    
    if not assessment:
        return None
    
    verse_details = await _fetch_verse_details(
        db, assessment.personalized_verses or []
    )
    
    return AssessmentResponse(
        id=assessment.id,
        assessment_date=assessment.assessment_date,
        assessment_type=assessment.assessment_type,
        questions_responses=assessment.questions_responses,
        calculated_scores=assessment.calculated_scores or {},
        recommended_focus_areas=assessment.recommended_focus_areas or [],
        personalized_verses=verse_details,
        overall_score=assessment.overall_score,
        completed=assessment.completed,
        created_at=assessment.created_at,
    )


@router.get("/history")
async def get_assessment_history(
    limit: int = Field(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user_optional),
) -> list[AssessmentResponse]:
    """
    Get assessment history for the user.
    
    Args:
        limit: Number of assessments to retrieve (1-50, default 10)
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for assessment history",
        )
    
    result = await db.execute(
        select(UserAssessment)
        .where(UserAssessment.user_id == user_id)
        .order_by(UserAssessment.created_at.desc())
        .limit(limit)
    )
    assessments = result.scalars().all()
    
    response_list = []
    for assessment in assessments:
        verse_details = await _fetch_verse_details(
            db, assessment.personalized_verses or []
        )
        response_list.append(
            AssessmentResponse(
                id=assessment.id,
                assessment_date=assessment.assessment_date,
                assessment_type=assessment.assessment_type,
                questions_responses=assessment.questions_responses,
                calculated_scores=assessment.calculated_scores or {},
                recommended_focus_areas=assessment.recommended_focus_areas or [],
                personalized_verses=verse_details,
                overall_score=assessment.overall_score,
                completed=assessment.completed,
                created_at=assessment.created_at,
            )
        )
    
    return response_list


def _calculate_scores(responses: dict[str, Any]) -> dict[str, Any]:
    """Calculate assessment scores from responses."""
    scores = {}
    
    # Calculate individual domain scores
    if "emotional_state" in responses:
        scores["emotional_wellbeing"] = responses["emotional_state"]
    
    if "stress_level" in responses:
        scores["stress_management"] = 10 - responses["stress_level"]  # Invert stress
    
    if "sleep_quality" in responses:
        scores["sleep_score"] = responses["sleep_quality"]
    
    if "social_connection" in responses:
        scores["social_wellbeing"] = responses["social_connection"]
    
    if "purpose_meaning" in responses:
        scores["purpose_score"] = responses["purpose_meaning"]
    
    # Calculate overall score (average of all scale responses)
    scale_scores = [
        responses.get("emotional_state", 5),
        10 - responses.get("stress_level", 5),
        responses.get("sleep_quality", 5),
        responses.get("social_connection", 5),
        responses.get("purpose_meaning", 5),
    ]
    scores["overall_score"] = round(sum(scale_scores) / len(scale_scores) * 10)
    
    return scores


def _determine_focus_areas(
    responses: dict[str, Any],
    scores: dict[str, Any]
) -> list[str]:
    """Determine recommended focus areas based on responses and scores."""
    focus_areas = []
    
    # Check low scores
    if scores.get("emotional_wellbeing", 10) < 5:
        focus_areas.append("Emotional regulation and self-compassion")
    
    if scores.get("stress_management", 10) < 5:
        focus_areas.append("Stress management and relaxation techniques")
    
    if scores.get("sleep_score", 10) < 5:
        focus_areas.append("Sleep hygiene and rest")
    
    if scores.get("social_wellbeing", 10) < 5:
        focus_areas.append("Building social connections and relationships")
    
    if scores.get("purpose_score", 10) < 5:
        focus_areas.append("Exploring purpose and meaning in life")
    
    # Check challenges
    challenges = responses.get("challenges_faced", [])
    if "Anxiety" in challenges:
        focus_areas.append("Anxiety management and grounding practices")
    if "Depression" in challenges:
        focus_areas.append("Mood elevation and positive activities")
    
    # Default if no specific areas identified
    if not focus_areas:
        focus_areas.append("Maintaining overall wellbeing")
    
    return focus_areas[:3]  # Limit to top 3


async def _get_personalized_verses(
    db: AsyncSession,
    responses: dict[str, Any],
    scores: dict[str, Any]
) -> list[dict[str, int]]:
    """Get personalized Gita verses based on assessment responses."""
    verse_refs = []
    
    # Map challenges to verse themes
    challenges = responses.get("challenges_faced", [])
    
    if "Anxiety" in challenges or scores.get("stress_management", 10) < 5:
        verse_refs.extend([
            {'chapter': 2, 'verse': 47},  # Karma Yoga - detachment from outcomes
            {'chapter': 6, 'verse': 5},   # Self-elevation
        ])
    
    if "Depression" in challenges or scores.get("emotional_wellbeing", 10) < 5:
        verse_refs.extend([
            {'chapter': 2, 'verse': 14},  # Enduring dualities
            {'chapter': 2, 'verse': 56},  # Sthitaprajna
        ])
    
    if "Loneliness" in challenges or scores.get("social_wellbeing", 10) < 5:
        verse_refs.extend([
            {'chapter': 6, 'verse': 32},  # Seeing self in all beings
            {'chapter': 12, 'verse': 13}, # Compassion
        ])
    
    if scores.get("purpose_score", 10) < 5:
        verse_refs.extend([
            {'chapter': 3, 'verse': 19},  # Performing duty
            {'chapter': 18, 'verse': 66}, # Surrender
        ])
    
    # Default verses if none selected
    if not verse_refs:
        verse_refs = [
            {'chapter': 2, 'verse': 47},
            {'chapter': 6, 'verse': 5},
            {'chapter': 2, 'verse': 56},
        ]
    
    # Remove duplicates and limit
    unique_refs = []
    seen = set()
    for ref in verse_refs:
        key = (ref['chapter'], ref['verse'])
        if key not in seen:
            seen.add(key)
            unique_refs.append(ref)
    
    return unique_refs[:5]  # Limit to 5 verses


async def _fetch_verse_details(
    db: AsyncSession,
    verse_refs: list[dict[str, int]]
) -> list[dict[str, Any]]:
    """Fetch full details for verse references."""
    verse_details = []
    for verse_ref in verse_refs:
        if isinstance(verse_ref, dict) and 'chapter' in verse_ref and 'verse' in verse_ref:
            verse = await GitaService.get_verse_by_reference(
                db, verse_ref['chapter'], verse_ref['verse']
            )
            if verse:
                verse_details.append({
                    'chapter': verse.chapter,
                    'verse': verse.verse,
                    'english': verse.english,
                    'sanskrit': verse.sanskrit,
                    'theme': verse.theme,
                    'principle': verse.principle,
                })
    return verse_details
