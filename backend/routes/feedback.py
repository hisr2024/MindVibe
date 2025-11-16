from fastapi import APIRouter

router = APIRouter(prefix="/feedback", tags=["feedback"])

@router.post("/rate")
async def submit_rating(rating: int) -> dict[str, str | int]:
    return {"status": "received", "rating": rating}

@router.get("/analytics")
async def get_feedback_analytics() -> dict[str, str | int]:
    return {"status": "success", "total_feedback": 0}
