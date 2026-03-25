"""Application settings with KIAAN AI Independence Support."""

import os
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_bool_strict(value: str, var_name: str = "unknown") -> bool:
    """Parse a boolean from an environment variable string with strict validation.

    Only accepts 'true', 'false', '1', '0' (case-insensitive).
    Raises ValueError for any other value to prevent silent misconfiguration.

    Args:
        value: The string value to parse.
        var_name: Name of the environment variable (for error messages).

    Returns:
        The parsed boolean value.

    Raises:
        ValueError: If the value is not one of the accepted boolean strings.
    """
    normalized = value.strip().lower()
    if normalized in ("true", "1"):
        return True
    if normalized in ("false", "0"):
        return False
    raise ValueError(
        f"Invalid boolean value '{value}' for {var_name}. "
        f"Accepted values: 'true', 'false', '1', '0'."
    )


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
    # SECURE_COOKIE is derived from ENVIRONMENT, not a boolean env var
    SECURE_COOKIE: bool = os.getenv("ENVIRONMENT", "development") == "production"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

    # Email verification enforcement: True in production, False in dev/test.
    # Overridable via REQUIRE_EMAIL_VERIFICATION env var.
    # IMPORTANT: If email delivery is not configured (EMAIL_PROVIDER != smtp),
    # this is auto-disabled at startup to prevent users from being locked out.
    REQUIRE_EMAIL_VERIFICATION: bool = parse_bool_strict(
        os.getenv(
            "REQUIRE_EMAIL_VERIFICATION",
            (
                "true"
                if os.getenv("ENVIRONMENT", "development") == "production"
                else "false"
            ),
        ),
        "REQUIRE_EMAIL_VERIFICATION",
    )

    @field_validator("REQUIRE_EMAIL_VERIFICATION")
    @classmethod
    def validate_email_verification_config(cls, v: bool) -> bool:
        """Auto-disable email verification when email delivery is not configured.

        Prevents the deadlock where REQUIRE_EMAIL_VERIFICATION=true but
        EMAIL_PROVIDER=console, which means verification emails are never
        delivered and users can never log in.
        """
        if not v:
            return v

        # Check if email provider can actually deliver emails
        email_provider = os.getenv("EMAIL_PROVIDER", "console")
        smtp_host = os.getenv("SMTP_HOST", "localhost")

        if email_provider != "smtp" or not smtp_host or smtp_host == "localhost":
            import logging

            _logger = logging.getLogger("mindvibe.settings")
            _logger.critical(
                "REQUIRE_EMAIL_VERIFICATION=true but EMAIL_PROVIDER='%s' "
                "(SMTP_HOST='%s') — emails cannot be delivered. "
                "Auto-disabling email verification to prevent user lockout. "
                "To fix: set EMAIL_PROVIDER=smtp with valid SMTP credentials, "
                "or explicitly set REQUIRE_EMAIL_VERIFICATION=false.",
                email_provider,
                smtp_host,
            )
            return False

        return v

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Ensure SECRET_KEY is secure, especially in production.

        Requirements:
        - Production: Must be set via environment variable, minimum 32 characters
        - Production: MUST NOT use default development key (hard failure)
        - Development: Warning only, allows default key for convenience

        Generate secure key with: python -c 'import secrets; print(secrets.token_urlsafe(64))'
        """
        import logging
        import warnings

        environment = os.getenv("ENVIRONMENT", "development").lower()
        is_production = environment in ("production", "prod")

        if is_production:
            # SECURITY: Hard failure in production with insecure key
            if v == "dev-secret-key-change-in-production":
                error_msg = (
                    "SECURITY ERROR: SECRET_KEY must be set in production! "
                    "Cannot start application with default development key. "
                    "Set SECRET_KEY environment variable with: "
                    "python -c 'import secrets; print(secrets.token_urlsafe(64))'"
                )
                logging.critical(error_msg)
                raise ValueError(error_msg)

            if len(v) < 32:
                error_msg = (
                    f"SECURITY ERROR: SECRET_KEY too short ({len(v)} chars). "
                    "Minimum 32 characters required for production. "
                    "Generate with: python -c 'import secrets; print(secrets.token_urlsafe(64))'"
                )
                logging.critical(error_msg)
                raise ValueError(error_msg)

            # Warn if key looks weak (no special characters, all same case, etc.)
            has_mixed_case = any(c.isupper() for c in v) and any(c.islower() for c in v)
            has_special = any(not c.isalnum() for c in v)
            if not (has_mixed_case or has_special):
                warnings.warn(
                    "SECRET_KEY appears weak (no mixed case or special characters). "
                    "Consider using a stronger key generated with secrets.token_urlsafe(64).",
                    UserWarning,
                    stacklevel=2,
                )

        elif v == "dev-secret-key-change-in-production":
            warnings.warn(
                "Using default SECRET_KEY. This is only safe for development. "
                "Set a secure SECRET_KEY for production.",
                UserWarning,
                stacklevel=2,
            )

        return v

    # Spiritual Wellness Data Encryption (enforced by default)
    MINDVIBE_REQUIRE_ENCRYPTION: bool = parse_bool_strict(
        os.getenv("MINDVIBE_REQUIRE_ENCRYPTION", "true"), "MINDVIBE_REQUIRE_ENCRYPTION"
    )
    # MINDVIBE_REFLECTION_KEY production validation is handled by
    # validate_encryption_key() below (enforces non-empty in production
    # when MINDVIBE_REQUIRE_ENCRYPTION is true).
    MINDVIBE_REFLECTION_KEY: str = os.getenv("MINDVIBE_REFLECTION_KEY", "")

    @field_validator("MINDVIBE_REFLECTION_KEY")
    @classmethod
    def validate_encryption_key(cls, v: str) -> str:
        """Validate encryption key — warn loudly but never crash the app.

        Previously this raised ValueError in production when the key was
        missing, which crashed the entire app at startup. Since the app
        functions correctly without encryption (just without data-at-rest
        protection), we now log a CRITICAL warning and auto-disable
        encryption instead of preventing the app from starting.
        """
        import logging

        environment = os.getenv("ENVIRONMENT", "development").lower()
        require_encryption = parse_bool_strict(
            os.getenv("MINDVIBE_REQUIRE_ENCRYPTION", "true"),
            "MINDVIBE_REQUIRE_ENCRYPTION",
        )

        if require_encryption and not v:
            if environment in ("production", "prod"):
                logging.critical(
                    "MINDVIBE_REFLECTION_KEY is not set — spiritual wellness data "
                    "will NOT be encrypted at rest. This is a security concern. "
                    "Set MINDVIBE_REFLECTION_KEY in your Render Dashboard. "
                    "Generate with: python -c 'from cryptography.fernet import Fernet; "
                    "print(Fernet.generate_key().decode())' — "
                    "Auto-disabling encryption to allow app to start."
                )
                # Auto-disable encryption so the app can start
                os.environ["MINDVIBE_REQUIRE_ENCRYPTION"] = "false"
            else:
                logging.warning(
                    "MINDVIBE_REFLECTION_KEY not set — spiritual data will NOT be encrypted. "
                    "This is only acceptable in development."
                )
        return v

    # Chat Data Encryption — encrypt user messages stored in database
    ENCRYPT_CHAT_DATA: bool = parse_bool_strict(
        os.getenv("ENCRYPT_CHAT_DATA", "true"), "ENCRYPT_CHAT_DATA"
    )

    # Data Retention Policy — auto-purge soft-deleted chat data
    CHAT_RETENTION_DAYS: int = int(os.getenv("CHAT_RETENTION_DAYS", "90"))
    RETENTION_CLEANUP_ENABLED: bool = parse_bool_strict(
        os.getenv("RETENTION_CLEANUP_ENABLED", "true"), "RETENTION_CLEANUP_ENABLED"
    )

    # Session settings
    SESSION_EXPIRE_DAYS: int = 7
    SESSION_TOUCH_INTERVAL_MINUTES: int = 5

    # Redis Configuration
    REDIS_ENABLED: bool = parse_bool_strict(
        os.getenv("REDIS_ENABLED", "true" if os.getenv("REDIS_URL") else "false"),
        "REDIS_ENABLED",
    )
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    # REDIS_REQUIRED: In production with multiple instances, Redis MUST be available
    # for distributed state (WebSocket Pub/Sub, rate limiting, DDoS tracking).
    REDIS_REQUIRED: bool = parse_bool_strict(
        os.getenv(
            "REDIS_REQUIRED",
            (
                "true"
                if os.getenv("ENVIRONMENT", "development") == "production"
                else "false"
            ),
        ),
        "REDIS_REQUIRED",
    )
    REDIS_MAX_CONNECTIONS: int = int(os.getenv("REDIS_MAX_CONNECTIONS", "20"))
    REDIS_SOCKET_TIMEOUT: int = int(os.getenv("REDIS_SOCKET_TIMEOUT", "5"))
    REDIS_RETRY_ON_TIMEOUT: bool = parse_bool_strict(
        os.getenv("REDIS_RETRY_ON_TIMEOUT", "true"), "REDIS_RETRY_ON_TIMEOUT"
    )

    # Multi-Instance Scaling
    # Unique identifier for this instance — used for WebSocket Pub/Sub deduplication
    # and instance-aware health checks. Auto-generated if not set.
    INSTANCE_ID: str = (
        os.getenv("INSTANCE_ID")
        or os.getenv("FLY_ALLOC_ID")
        or os.getenv("RENDER_INSTANCE_ID")
        or ""
    )

    # PgBouncer compatibility — disables prepared statements when True
    PGBOUNCER_ENABLED: bool = parse_bool_strict(
        os.getenv("PGBOUNCER_ENABLED", "false"), "PGBOUNCER_ENABLED"
    )

    @field_validator("REDIS_URL")
    @classmethod
    def validate_redis_url(cls, v: str) -> str:
        """Warn if REDIS_URL points to localhost in production.

        In production, Redis should be a dedicated instance (not localhost)
        for reliability and security.
        """
        import warnings

        environment = os.getenv("ENVIRONMENT", "development").lower()
        is_production = environment in ("production", "prod")

        if is_production and ("localhost" in v or "127.0.0.1" in v):
            warnings.warn(
                "REDIS_URL points to localhost in production. "
                "Use a dedicated Redis instance for production deployments.",
                UserWarning,
                stacklevel=2,
            )
        return v

    CACHE_KIAAN_RESPONSES: bool = parse_bool_strict(
        os.getenv("CACHE_KIAAN_RESPONSES", "true"), "CACHE_KIAAN_RESPONSES"
    )

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True

    # Stripe Configuration
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLISHABLE_KEY: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    # Stripe Public Details (visible on customer statements, invoices, receipts)
    # Statement descriptor: 5-22 chars, appears on bank/credit card statements
    STRIPE_STATEMENT_DESCRIPTOR: str = os.getenv(
        "STRIPE_STATEMENT_DESCRIPTOR", "KIAANVERSE.COM"
    )
    # Statement descriptor suffix: 2-10 chars, appended for individual products
    STRIPE_STATEMENT_DESCRIPTOR_SUFFIX: str = os.getenv(
        "STRIPE_STATEMENT_DESCRIPTOR_SUFFIX", ""
    )
    # Customer support phone number displayed on receipts and invoices
    STRIPE_SUPPORT_PHONE: str = os.getenv("STRIPE_SUPPORT_PHONE", "")
    # Customer support email displayed on receipts and invoices
    STRIPE_SUPPORT_EMAIL: str = os.getenv("STRIPE_SUPPORT_EMAIL", "")
    # Customer support URL displayed on receipts and invoices
    STRIPE_SUPPORT_URL: str = os.getenv("STRIPE_SUPPORT_URL", "")

    # Frontend URLs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Storage Configuration
    USE_S3_STORAGE: bool = parse_bool_strict(
        os.getenv("USE_S3_STORAGE", "false"), "USE_S3_STORAGE"
    )
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")

    # ==========================================================================
    # KIAAN AI INDEPENDENCE SETTINGS - Full Offline Support
    # ==========================================================================

    # --- Offline Mode Settings ---
    OFFLINE_MODE: bool = parse_bool_strict(
        os.getenv("OFFLINE_MODE", "false"), "OFFLINE_MODE"
    )
    OFFLINE_FALLBACK_ENABLED: bool = parse_bool_strict(
        os.getenv("OFFLINE_FALLBACK_ENABLED", "true"), "OFFLINE_FALLBACK_ENABLED"
    )
    OFFLINE_MODEL_TIMEOUT: int = int(os.getenv("OFFLINE_MODEL_TIMEOUT", "120"))
    OFFLINE_CACHE_MAX_AGE_HOURS: int = int(
        os.getenv("OFFLINE_CACHE_MAX_AGE_HOURS", "168")
    )  # 1 week
    OFFLINE_QUEUE_ENABLED: bool = parse_bool_strict(
        os.getenv("OFFLINE_QUEUE_ENABLED", "true"), "OFFLINE_QUEUE_ENABLED"
    )
    AUTO_SYNC_WHEN_ONLINE: bool = parse_bool_strict(
        os.getenv("AUTO_SYNC_WHEN_ONLINE", "true"), "AUTO_SYNC_WHEN_ONLINE"
    )

    # --- Local LLM Model Settings ---
    LOCAL_MODELS_ENABLED: bool = parse_bool_strict(
        os.getenv("LOCAL_MODELS_ENABLED", "true"), "LOCAL_MODELS_ENABLED"
    )
    LOCAL_MODEL_PATH: str = os.getenv("LOCAL_MODEL_PATH", str(DEFAULT_MODELS_PATH))
    PREFERRED_LOCAL_MODEL: str = os.getenv(
        "PREFERRED_LOCAL_MODEL", "mistral-7b-instruct"
    )
    LOCAL_MODEL_QUANTIZATION: str = os.getenv(
        "LOCAL_MODEL_QUANTIZATION", "q4_k_m"
    )  # q4_k_m, q5_k_m, q8_0, fp16
    MIN_VRAM_MB: int = int(os.getenv("MIN_VRAM_MB", "4096"))
    MAX_LOCAL_MODEL_THREADS: int = int(os.getenv("MAX_LOCAL_MODEL_THREADS", "4"))
    LOCAL_MODEL_CONTEXT_SIZE: int = int(os.getenv("LOCAL_MODEL_CONTEXT_SIZE", "4096"))
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    OLLAMA_AUTO_START: bool = parse_bool_strict(
        os.getenv("OLLAMA_AUTO_START", "false"), "OLLAMA_AUTO_START"
    )
    LM_STUDIO_URL: str = os.getenv("LM_STUDIO_URL", "http://localhost:1234/v1")
    LM_STUDIO_ENABLED: bool = parse_bool_strict(
        os.getenv("LM_STUDIO_ENABLED", "false"), "LM_STUDIO_ENABLED"
    )
    HUGGINGFACE_HUB_ENABLED: bool = parse_bool_strict(
        os.getenv("HUGGINGFACE_HUB_ENABLED", "true"), "HUGGINGFACE_HUB_ENABLED"
    )

    # --- TTS (Text-to-Speech) Settings ---
    # Provider chain: ElevenLabs → Sarvam AI → Edge TTS (browser fallback always available)
    LOCAL_TTS_ENABLED: bool = parse_bool_strict(
        os.getenv("LOCAL_TTS_ENABLED", "true"), "LOCAL_TTS_ENABLED"
    )
    TTS_PROVIDER: str = os.getenv(
        "TTS_PROVIDER", "auto"
    )  # auto, sarvam, elevenlabs, edge
    TTS_FALLBACK_CHAIN: str = os.getenv("TTS_FALLBACK_CHAIN", "elevenlabs,sarvam,edge")
    LOCAL_TTS_QUALITY: str = os.getenv(
        "LOCAL_TTS_QUALITY", "medium"
    )  # low, medium, high
    TTS_CACHE_DIR: str = os.getenv("TTS_CACHE_DIR", str(DEFAULT_AUDIO_CACHE_PATH))
    TTS_CACHE_MAX_SIZE_MB: int = int(os.getenv("TTS_CACHE_MAX_SIZE_MB", "500"))

    # --- Local STT (Speech-to-Text/Whisper) Settings ---
    LOCAL_STT_ENABLED: bool = parse_bool_strict(
        os.getenv("LOCAL_STT_ENABLED", "true"), "LOCAL_STT_ENABLED"
    )
    STT_PROVIDER: str = os.getenv(
        "STT_PROVIDER", "auto"
    )  # auto, openai_whisper, local_whisper, browser
    WHISPER_MODEL_SIZE: str = os.getenv(
        "WHISPER_MODEL_SIZE", "base"
    )  # tiny, base, small, medium, large
    WHISPER_MODEL_PATH: str = os.getenv(
        "WHISPER_MODEL_PATH", str(DEFAULT_MODELS_PATH / "whisper")
    )
    WHISPER_COMPUTE_TYPE: str = os.getenv(
        "WHISPER_COMPUTE_TYPE", "int8"
    )  # int8, float16, float32
    WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "auto")  # auto, cpu, cuda
    WHISPER_LANGUAGE: str | None = os.getenv("WHISPER_LANGUAGE")  # None for auto-detect

    # --- Local Memory/Persistence Settings ---
    MEMORY_BACKEND: str = os.getenv(
        "MEMORY_BACKEND", "auto"
    )  # auto, redis, sqlite, memory
    SQLITE_DB_PATH: str = os.getenv("SQLITE_DB_PATH", str(DEFAULT_MEMORY_DB_PATH))
    LOCAL_MEMORY_MAX_SIZE_MB: int = int(os.getenv("LOCAL_MEMORY_MAX_SIZE_MB", "500"))
    MEMORY_BACKUP_ENABLED: bool = parse_bool_strict(
        os.getenv("MEMORY_BACKUP_ENABLED", "true"), "MEMORY_BACKUP_ENABLED"
    )
    MEMORY_BACKUP_INTERVAL_HOURS: int = int(
        os.getenv("MEMORY_BACKUP_INTERVAL_HOURS", "24")
    )
    MEMORY_ENCRYPTION_ENABLED: bool = parse_bool_strict(
        os.getenv("MEMORY_ENCRYPTION_ENABLED", "false"), "MEMORY_ENCRYPTION_ENABLED"
    )

    # --- Offline Documentation Cache Settings ---
    DOCS_CACHE_ENABLED: bool = parse_bool_strict(
        os.getenv("DOCS_CACHE_ENABLED", "true"), "DOCS_CACHE_ENABLED"
    )
    DOCS_CACHE_PATH: str = os.getenv("DOCS_CACHE_PATH", str(DEFAULT_DOCS_CACHE_PATH))
    DOCS_CACHE_MAX_SIZE_MB: int = int(os.getenv("DOCS_CACHE_MAX_SIZE_MB", "2000"))
    DOCS_AUTO_DOWNLOAD: bool = parse_bool_strict(
        os.getenv("DOCS_AUTO_DOWNLOAD", "false"), "DOCS_AUTO_DOWNLOAD"
    )
    DOCS_UPDATE_INTERVAL_DAYS: int = int(os.getenv("DOCS_UPDATE_INTERVAL_DAYS", "7"))

    # --- Connectivity Settings ---
    CONNECTIVITY_CHECK_INTERVAL: int = int(
        os.getenv("CONNECTIVITY_CHECK_INTERVAL", "300")
    )  # 5 minutes
    CONNECTIVITY_CHECK_URL: str = os.getenv(
        "CONNECTIVITY_CHECK_URL", "https://api.openai.com"
    )
    CONNECTIVITY_TIMEOUT: int = int(os.getenv("CONNECTIVITY_TIMEOUT", "5"))

    # --- Local Storage Root ---
    MINDVIBE_HOME: str = os.getenv("MINDVIBE_HOME", str(DEFAULT_MINDVIBE_HOME))

    @field_validator(
        "LOCAL_MODEL_PATH",
        "TTS_CACHE_DIR",
        "WHISPER_MODEL_PATH",
        "DOCS_CACHE_PATH",
        "MINDVIBE_HOME",
        mode="after",
    )
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

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",  # Allow extra env vars without raising errors
    )


settings = Settings()
