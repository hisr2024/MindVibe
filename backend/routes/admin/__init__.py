"""Admin routes package."""

from backend.routes.admin.auth import router as auth_router
from backend.routes.admin.users import router as users_router
from backend.routes.admin.subscriptions import router as subscriptions_router
from backend.routes.admin.moderation import router as moderation_router
from backend.routes.admin.feature_flags import router as feature_flags_router
from backend.routes.admin.announcements import router as announcements_router
from backend.routes.admin.ab_tests import router as ab_tests_router
from backend.routes.admin.audit_logs import router as audit_logs_router
from backend.routes.admin.export import router as export_router
from backend.routes.admin.kiaan_analytics import router as kiaan_analytics_router

__all__ = [
    "auth_router",
    "users_router",
    "subscriptions_router",
    "moderation_router",
    "feature_flags_router",
    "announcements_router",
    "ab_tests_router",
    "audit_logs_router",
    "export_router",
    "kiaan_analytics_router",
]
