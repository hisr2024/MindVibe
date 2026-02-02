"""Analytics sub-routes package."""

from fastapi import APIRouter

from backend.routes.analytics.karmic_tree import router as karmic_tree_router

# Create a parent router that includes sub-routers
router = APIRouter()

# Include sub-routers
router.include_router(karmic_tree_router, prefix="/analytics", tags=["analytics"])

__all__ = ["router", "karmic_tree_router"]
