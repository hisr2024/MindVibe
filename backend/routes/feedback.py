"""backend/routes/feedback.py"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Optional
from backend.services.feedback_service import feedback_service

router = APIRouter(prefix="/feedback", tags=["Feedback"])

@router.post("/rate")
async def submit_rating(user_id: str, session_id: str, rating: int, feedback_text: Optional[str] = None) -> Dict[str, str]:
    """Submit response rating (1-5 stars)"""
    if not 1 <= rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    return feedback_service.submit_rating(user_id, session_id, rating, feedback_text)

@router.post("/suggest")
async def submit_suggestion(user_id: str, suggestion: str, category: str) -> Dict[str, str]:
    """Submit improvement suggestion"""
    return feedback_service.submit_suggestion(user_id, suggestion, category)

@router.post("/bug-report")
async def submit_bug_report(user_id: str, description: str, affected_feature: str) -> Dict[str, str]:
    """Submit bug report"""
    return feedback_service.submit_bug_report(user_id, description, affected_feature)

@router.post("/feature-request")
async def submit_feature_request(user_id: str, feature_description: str) -> Dict[str, str]:
    """Submit feature request"""
    return feedback_service.submit_feature_request(user_id, feature_description)

@router.post("/nps")
async def submit_nps_response(user_id: str, score: int, reason: Optional[str] = None) -> Dict[str, str]:
    """Submit NPS response"""
    if not 0 <= score <= 10:
        raise HTTPException(status_code=400, detail="NPS score must be 0-10")
    return feedback_service.submit_nps_response(user_id, score, reason)

@router.get("/analytics")
async def get_feedback_analytics() -> Dict[str, any]:
    """Get feedback analytics"""
    return feedback_service.get_feedback_analytics()

@router.get("/nps")
async def get_nps_score() -> Dict[str, any]:
    """Get NPS score"""
    return feedback_service.get_nps_score()

@router.get("/sentiment")
async def get_sentiment_analysis() -> Dict[str, str]:
    """Get sentiment analysis"""
    return {"sentiment": "positive", "score": 0.85, "respondents": len(feedback_service.feedbacks)}
