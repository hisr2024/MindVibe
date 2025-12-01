"""Application settings."""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # JWT/Token settings
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    REFRESH_TOKEN_LENGTH: int = 32
    REFRESH_TOKEN_ENABLE_BODY_RETURN: bool = False

    # Security
    SECURE_COOKIE: bool = os.getenv("ENVIRONMENT", "development") == "production"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    WEBHOOK_SIGNING_SECRET: str = os.getenv("WEBHOOK_SIGNING_SECRET", "dev-webhook-secret")
    WEBHOOK_TOLERANCE_SECONDS: int = int(os.getenv("WEBHOOK_TOLERANCE_SECONDS", "300"))

    # Session settings
    SESSION_EXPIRE_DAYS: int = 7
    SESSION_TOUCH_INTERVAL_MINUTES: int = 5

    # Plan-based feature controls
    DEFAULT_PLAN: str = os.getenv("DEFAULT_PLAN", "free")
    FEATURE_PLAN_MATRIX: str = os.getenv("FEATURE_PLAN_MATRIX", "")

    # Caching & queues
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CACHE_DEFAULT_TTL_SECONDS: int = int(os.getenv("CACHE_DEFAULT_TTL_SECONDS", "3600"))
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", REDIS_URL)
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)
    CELERY_DEFAULT_QUEUE: str = os.getenv("CELERY_DEFAULT_QUEUE", "mindvibe")
    USE_CELERY: bool = os.getenv("USE_CELERY", "false").lower() in {"1", "true", "yes", "on"}

    # Observability
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")
    SENTRY_TRACES_SAMPLE_RATE: float = float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1"))
    PROMETHEUS_ENABLED: bool = os.getenv("PROMETHEUS_ENABLED", "true").lower() in {"1", "true", "yes", "on"}
    OTEL_EXPORTER_OTLP_ENDPOINT: str = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "")
    OTEL_SERVICE_NAME: str = os.getenv("OTEL_SERVICE_NAME", "mindvibe-api")
    
    class Config:
        """Pydantic config."""
        env_file = ".env"
        case_sensitive = True


settings = Settings()
