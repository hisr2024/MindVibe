"""backend/services/feedback_service.py"""

from datetime import datetime
from typing import Any


class FeedbackService:
    """User feedback collection and analysis service"""

    def __init__(self):
        self.feedbacks: list[dict[str, Any]] = []
        self.nps_responses: list[dict[str, Any]] = []

    def submit_rating(
        self,
        user_id: str,
        session_id: str,
        rating: int,
        feedback_text: str | None = None,
    ) -> dict[str, str]:
        """Submit response rating (1-5)"""
        feedback = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "session_id": session_id,
            "rating": rating,
            "feedback_text": feedback_text,
        }
        self.feedbacks.append(feedback)
        return {"status": "received", "rating": str(rating)}

    def submit_suggestion(
        self, user_id: str, suggestion: str, category: str
    ) -> dict[str, str]:
        """Submit improvement suggestion"""
        feedback = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "suggestion": suggestion,
            "category": category,
        }
        self.feedbacks.append(feedback)
        return {"status": "received", "category": category}

    def submit_bug_report(
        self, user_id: str, description: str, affected_feature: str
    ) -> dict[str, str]:
        """Submit bug report"""
        feedback = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "type": "bug_report",
            "description": description,
            "affected_feature": affected_feature,
        }
        self.feedbacks.append(feedback)
        return {"status": "received", "ticket_id": f"BUG-{len(self.feedbacks)}"}

    def submit_feature_request(
        self, user_id: str, feature_description: str
    ) -> dict[str, str]:
        """Submit feature request"""
        feedback = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "type": "feature_request",
            "feature_description": feature_description,
        }
        self.feedbacks.append(feedback)
        return {"status": "received", "feature_id": f"FEAT-{len(self.feedbacks)}"}

    def submit_nps_response(
        self, user_id: str, score: int, reason: str | None = None
    ) -> dict[str, Any]:
        """Submit NPS (Net Promoter Score) response"""
        nps_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "score": score,
            "reason": reason,
        }
        self.nps_responses.append(nps_entry)
        return {"status": "recorded", "score": score}

    def get_feedback_analytics(self) -> dict[str, Any]:
        """Get feedback analytics"""
        return {
            "total_feedback": len(self.feedbacks),
            "nps_responses": len(self.nps_responses),
        }

    def get_nps_score(self) -> dict[str, Any]:
        """Calculate Net Promoter Score"""
        if not self.nps_responses:
            return {"nps": 0, "respondents": 0}
        scores = [r["score"] for r in self.nps_responses]
        return {
            "nps": sum(scores) / len(scores),
            "respondents": len(self.nps_responses),
        }


feedback_service = FeedbackService()
