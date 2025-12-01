"""Application settings."""

import os
from pydantic_settings import BaseSettings

from backend.security.secret_manager import secret_manager


class Settings(BaseSettings):
    """Application settings."""

    # JWT/Token settings
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    REFRESH_TOKEN_LENGTH: int = 32
    REFRESH_TOKEN_ENABLE_BODY_RETURN: bool = False

    # Security
    SECURE_COOKIE: bool = os.getenv("ENVIRONMENT", "development") == "production"
    SECRET_KEY: str = secret_manager().get(
        "SECRET_KEY", "dev-secret-key-change-in-production"
    )
    WEBHOOK_SIGNING_SECRET: str = secret_manager().get(
        "WEBHOOK_SIGNING_SECRET", "dev-webhook-secret"
    )
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

    # Secret management
    SECRET_BACKEND: str = os.getenv("SECRET_BACKEND", "env")
    SECRET_NAMESPACE: str = os.getenv("SECRET_NAMESPACE", "mindvibe/")
    SECRET_CACHE_TTL_SECONDS: int = int(os.getenv("SECRET_CACHE_TTL_SECONDS", "300"))
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")

    # Data retention
    DATA_RETENTION_DAYS: int = int(os.getenv("DATA_RETENTION_DAYS", "365"))
    _RETENTION_ENABLED_RAW: str = os.getenv("DATA_RETENTION_ENABLED", "true")
    DATA_RETENTION_ENABLED: bool = _RETENTION_ENABLED_RAW.lower() in {
        "1",
        "true",
        "yes",
        "on",
    }

    # Observability
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")
    SENTRY_TRACES_SAMPLE_RATE: float = float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1"))
    PROMETHEUS_ENABLED: bool = os.getenv("PROMETHEUS_ENABLED", "true").lower() in {"1", "true", "yes", "on"}
    OTEL_EXPORTER_OTLP_ENDPOINT: str = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "")
    OTEL_SERVICE_NAME: str = os.getenv("OTEL_SERVICE_NAME", "mindvibe-api")

    # Email delivery
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() in {"1", "true", "yes", "on"}

    # Product analytics
    ANALYTICS_BUFFER_LIMIT: int = int(os.getenv("ANALYTICS_BUFFER_LIMIT", "250"))
    FRONTEND_BASE_URL: str = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")
    
    class Config:
        """Pydantic config."""
        env_file = ".env"
        case_sensitive = True


settings = Settings()
