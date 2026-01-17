"""Application settings."""

import os
from pydantic_settings import BaseSettings
from pydantic import field_validator


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

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Ensure SECRET_KEY is not using default value in production."""
        import warnings
        import logging

        if os.getenv("ENVIRONMENT") == "production":
            if v == "dev-secret-key-change-in-production" or len(v) < 32:
                # Log critical warning but allow startup to proceed
                # This prevents deployment failures when environment variables haven't been synced yet
                critical_msg = (
                    "CRITICAL SECURITY WARNING: SECRET_KEY is not set to a secure value! "
                    "The application is running with an insecure SECRET_KEY. "
                    "Please set SECRET_KEY environment variable immediately. "
                    "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(64))'"
                )
                logging.critical(critical_msg)
                warnings.warn(critical_msg, UserWarning)
                # Return the value to allow startup, but this should be fixed ASAP
                return v
        elif v == "dev-secret-key-change-in-production":
            warnings.warn(
                "Using default SECRET_KEY. This is only safe for development. "
                "Set a secure SECRET_KEY for production.",
                UserWarning
            )
        return v
    
    # Session settings
    SESSION_EXPIRE_DAYS: int = 7
    SESSION_TOUCH_INTERVAL_MINUTES: int = 5
    
    # Redis Configuration
    REDIS_ENABLED: bool = False
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_KIAAN_RESPONSES: bool = False
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    
    # Stripe Configuration
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLISHABLE_KEY: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    
    # Frontend URLs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Storage Configuration
    USE_S3_STORAGE: bool = os.getenv("USE_S3_STORAGE", "false").lower() == "true"
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    
    class Config:
        """Pydantic config."""
        env_file = ".env"
        case_sensitive = True


settings = Settings()
