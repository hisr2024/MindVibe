from pydantic import BaseSettings
import secrets

class Settings(BaseSettings):
    # Password policy
    PASSWORD_MIN_LENGTH: int = 10
    PASSWORD_REQUIRE_DIGIT: bool = True
    PASSWORD_REQUIRE_LETTER: bool = True

    # Password reset
    PASSWORD_RESET_TOKEN_MINUTES: int = 30
    PASSWORD_RESET_TOKEN_LENGTH: int = 32
    DEBUG_RETURN_RESET_TOKEN: bool = True  # Disable in production

    # Access / Session
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    SESSION_LIFETIME_MINUTES: int = 43200  # 30 days
    JWT_ALGORITHM: str = "HS256"
    JWT_SECRET: str = "CHANGE_ME_DEV_SECRET"  # Override in environment
    SESSION_COOKIE_NAME: str = "session_id"
    SECURE_COOKIE: bool = True
    REQUIRE_SESSION_CHECK_EACH_REQUEST: bool = True

    # Refresh tokens
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14
    REFRESH_TOKEN_LENGTH: int = 32          # Raw random bytes length (token_urlsafe)
    REFRESH_TOKEN_ENABLE_BODY_RETURN: bool = False  # If True, also return refresh token in JSON (less secure)
    # Deterministic lookup pepper (HMAC secret). Must be kept secret & rotated via ops procedure.
    # When rotating: deploy new value as REFRESH_TOKEN_PEPPER_NEXT, dual-write both hashes, then phase out old.
    REFRESH_TOKEN_PEPPER: str = "DEV_REFRESH_PEPPER_CHANGE_ME"  # Override in env
    REFRESH_TOKEN_PEPPER_NEXT: str | None = None  # Optional staged rotation pepper

    class Config:
        env_file = ".env"

settings = Settings()