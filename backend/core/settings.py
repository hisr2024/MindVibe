"""Application settings with KIAAN AI Independence Support."""

import os
from pathlib import Path
from typing import Optional, Literal
from pydantic_settings import BaseSettings
from pydantic import field_validator


# Default paths for KIAAN local storage
DEFAULT_MINDVIBE_HOME = Path.home() / ".mindvibe"
DEFAULT_MODELS_PATH = DEFAULT_MINDVIBE_HOME / "models"
DEFAULT_AUDIO_CACHE_PATH = DEFAULT_MINDVIBE_HOME / "audio"
DEFAULT_DOCS_CACHE_PATH = DEFAULT_MINDVIBE_HOME / "docs"
DEFAULT_MEMORY_DB_PATH = DEFAULT_MINDVIBE_HOME / "memory.db"


class Settings(BaseSettings):
    """Application settings with full offline/independence support."""

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

    # ==========================================================================
    # KIAAN AI INDEPENDENCE SETTINGS - Full Offline Support
    # ==========================================================================

    # --- Offline Mode Settings ---
    OFFLINE_MODE: bool = os.getenv("OFFLINE_MODE", "false").lower() == "true"
    OFFLINE_FALLBACK_ENABLED: bool = os.getenv("OFFLINE_FALLBACK_ENABLED", "true").lower() == "true"
    OFFLINE_MODEL_TIMEOUT: int = int(os.getenv("OFFLINE_MODEL_TIMEOUT", "120"))
    OFFLINE_CACHE_MAX_AGE_HOURS: int = int(os.getenv("OFFLINE_CACHE_MAX_AGE_HOURS", "168"))  # 1 week
    OFFLINE_QUEUE_ENABLED: bool = os.getenv("OFFLINE_QUEUE_ENABLED", "true").lower() == "true"
    AUTO_SYNC_WHEN_ONLINE: bool = os.getenv("AUTO_SYNC_WHEN_ONLINE", "true").lower() == "true"

    # --- Local LLM Model Settings ---
    LOCAL_MODELS_ENABLED: bool = os.getenv("LOCAL_MODELS_ENABLED", "true").lower() == "true"
    LOCAL_MODEL_PATH: str = os.getenv("LOCAL_MODEL_PATH", str(DEFAULT_MODELS_PATH))
    PREFERRED_LOCAL_MODEL: str = os.getenv("PREFERRED_LOCAL_MODEL", "mistral-7b-instruct")
    LOCAL_MODEL_QUANTIZATION: str = os.getenv("LOCAL_MODEL_QUANTIZATION", "q4_k_m")  # q4_k_m, q5_k_m, q8_0, fp16
    MIN_VRAM_MB: int = int(os.getenv("MIN_VRAM_MB", "4096"))
    MAX_LOCAL_MODEL_THREADS: int = int(os.getenv("MAX_LOCAL_MODEL_THREADS", "4"))
    LOCAL_MODEL_CONTEXT_SIZE: int = int(os.getenv("LOCAL_MODEL_CONTEXT_SIZE", "4096"))
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    OLLAMA_AUTO_START: bool = os.getenv("OLLAMA_AUTO_START", "false").lower() == "true"
    LM_STUDIO_URL: str = os.getenv("LM_STUDIO_URL", "http://localhost:1234/v1")
    LM_STUDIO_ENABLED: bool = os.getenv("LM_STUDIO_ENABLED", "false").lower() == "true"
    HUGGINGFACE_HUB_ENABLED: bool = os.getenv("HUGGINGFACE_HUB_ENABLED", "true").lower() == "true"

    # --- Local TTS (Text-to-Speech) Settings ---
    LOCAL_TTS_ENABLED: bool = os.getenv("LOCAL_TTS_ENABLED", "true").lower() == "true"
    TTS_PROVIDER: str = os.getenv("TTS_PROVIDER", "auto")  # auto, google, edge, pyttsx3, coqui
    TTS_FALLBACK_CHAIN: str = os.getenv("TTS_FALLBACK_CHAIN", "google,edge,pyttsx3")
    LOCAL_TTS_QUALITY: str = os.getenv("LOCAL_TTS_QUALITY", "medium")  # low, medium, high
    TTS_CACHE_DIR: str = os.getenv("TTS_CACHE_DIR", str(DEFAULT_AUDIO_CACHE_PATH))
    TTS_CACHE_MAX_SIZE_MB: int = int(os.getenv("TTS_CACHE_MAX_SIZE_MB", "500"))
    PYTTSX3_VOICE_ID: Optional[str] = os.getenv("PYTTSX3_VOICE_ID")
    EDGE_TTS_VOICE: str = os.getenv("EDGE_TTS_VOICE", "en-US-AriaNeural")
    COQUI_MODEL: str = os.getenv("COQUI_MODEL", "tts_models/en/ljspeech/tacotron2-DDC")

    # --- Local STT (Speech-to-Text/Whisper) Settings ---
    LOCAL_STT_ENABLED: bool = os.getenv("LOCAL_STT_ENABLED", "true").lower() == "true"
    STT_PROVIDER: str = os.getenv("STT_PROVIDER", "auto")  # auto, openai_whisper, local_whisper, browser
    WHISPER_MODEL_SIZE: str = os.getenv("WHISPER_MODEL_SIZE", "base")  # tiny, base, small, medium, large
    WHISPER_MODEL_PATH: str = os.getenv("WHISPER_MODEL_PATH", str(DEFAULT_MODELS_PATH / "whisper"))
    WHISPER_COMPUTE_TYPE: str = os.getenv("WHISPER_COMPUTE_TYPE", "int8")  # int8, float16, float32
    WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "auto")  # auto, cpu, cuda
    WHISPER_LANGUAGE: Optional[str] = os.getenv("WHISPER_LANGUAGE")  # None for auto-detect

    # --- Local Memory/Persistence Settings ---
    MEMORY_BACKEND: str = os.getenv("MEMORY_BACKEND", "auto")  # auto, redis, sqlite, memory
    SQLITE_DB_PATH: str = os.getenv("SQLITE_DB_PATH", str(DEFAULT_MEMORY_DB_PATH))
    LOCAL_MEMORY_MAX_SIZE_MB: int = int(os.getenv("LOCAL_MEMORY_MAX_SIZE_MB", "500"))
    MEMORY_BACKUP_ENABLED: bool = os.getenv("MEMORY_BACKUP_ENABLED", "true").lower() == "true"
    MEMORY_BACKUP_INTERVAL_HOURS: int = int(os.getenv("MEMORY_BACKUP_INTERVAL_HOURS", "24"))
    MEMORY_ENCRYPTION_ENABLED: bool = os.getenv("MEMORY_ENCRYPTION_ENABLED", "false").lower() == "true"

    # --- Offline Documentation Cache Settings ---
    DOCS_CACHE_ENABLED: bool = os.getenv("DOCS_CACHE_ENABLED", "true").lower() == "true"
    DOCS_CACHE_PATH: str = os.getenv("DOCS_CACHE_PATH", str(DEFAULT_DOCS_CACHE_PATH))
    DOCS_CACHE_MAX_SIZE_MB: int = int(os.getenv("DOCS_CACHE_MAX_SIZE_MB", "2000"))
    DOCS_AUTO_DOWNLOAD: bool = os.getenv("DOCS_AUTO_DOWNLOAD", "false").lower() == "true"
    DOCS_UPDATE_INTERVAL_DAYS: int = int(os.getenv("DOCS_UPDATE_INTERVAL_DAYS", "7"))

    # --- Connectivity Settings ---
    CONNECTIVITY_CHECK_INTERVAL: int = int(os.getenv("CONNECTIVITY_CHECK_INTERVAL", "300"))  # 5 minutes
    CONNECTIVITY_CHECK_URL: str = os.getenv("CONNECTIVITY_CHECK_URL", "https://api.openai.com")
    CONNECTIVITY_TIMEOUT: int = int(os.getenv("CONNECTIVITY_TIMEOUT", "5"))

    # --- Local Storage Root ---
    MINDVIBE_HOME: str = os.getenv("MINDVIBE_HOME", str(DEFAULT_MINDVIBE_HOME))

    @field_validator("LOCAL_MODEL_PATH", "TTS_CACHE_DIR", "WHISPER_MODEL_PATH",
                    "DOCS_CACHE_PATH", "MINDVIBE_HOME", mode="after")
    @classmethod
    def ensure_directory_exists(cls, v: str) -> str:
        """Ensure storage directories exist."""
        path = Path(v)
        try:
            path.mkdir(parents=True, exist_ok=True)
        except PermissionError:
            import logging
            logging.warning(f"Cannot create directory {v}, using default")
        return str(path)

    @field_validator("SQLITE_DB_PATH", mode="after")
    @classmethod
    def ensure_sqlite_parent_exists(cls, v: str) -> str:
        """Ensure SQLite database parent directory exists."""
        path = Path(v)
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
        except PermissionError:
            import logging
            logging.warning(f"Cannot create directory for SQLite DB {v}")
        return str(path)

    def get_offline_settings(self) -> dict:
        """Get all offline-related settings as a dictionary."""
        return {
            "offline_mode": self.OFFLINE_MODE,
            "offline_fallback_enabled": self.OFFLINE_FALLBACK_ENABLED,
            "local_models_enabled": self.LOCAL_MODELS_ENABLED,
            "local_tts_enabled": self.LOCAL_TTS_ENABLED,
            "local_stt_enabled": self.LOCAL_STT_ENABLED,
            "memory_backend": self.MEMORY_BACKEND,
            "docs_cache_enabled": self.DOCS_CACHE_ENABLED,
            "preferred_local_model": self.PREFERRED_LOCAL_MODEL,
            "whisper_model_size": self.WHISPER_MODEL_SIZE,
            "tts_provider": self.TTS_PROVIDER,
        }

    def is_fully_offline_capable(self) -> bool:
        """Check if the system has all components for full offline operation."""
        from pathlib import Path

        checks = [
            self.LOCAL_MODELS_ENABLED,
            self.LOCAL_TTS_ENABLED,
            self.LOCAL_STT_ENABLED,
            Path(self.LOCAL_MODEL_PATH).exists(),
        ]
        return all(checks)

    class Config:
        """Pydantic config."""
        env_file = ".env"
        case_sensitive = True


settings = Settings()
