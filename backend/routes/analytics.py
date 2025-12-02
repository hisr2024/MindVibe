from fastapi import APIRouter

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard")
async def analytics_dashboard():
    return {"status": "success", "metrics": {}}

@router.get("/users")
async def user_analytics():
    return {"status": "success", "user_analytics": {}}
