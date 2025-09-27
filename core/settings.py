from pydantic import BaseSettings

class Settings(BaseSettings):
    # Password policy
    PASSWORD_MIN_LENGTH: int = 10
    PASSWORD_REQUIRE_DIGIT: bool = True
    PASSWORD_REQUIRE_LETTER: bool = True

    # Password reset
    PASSWORD_RESET_TOKEN_MINUTES: int = 30  # Lifetime of reset tokens
    PASSWORD_RESET_TOKEN_LENGTH: int = 32   # Raw token length parameter (entropy size input)
    DEBUG_RETURN_RESET_TOKEN: bool = True   # Return raw token in API (disable in production!)

    # Hybrid session + access token auth (Step 4 additions)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15           # Access JWT lifetime (short-lived)
    SESSION_LIFETIME_MINUTES: int = 43200           # Session lifetime (30 days) -> 30 * 24 * 60 minutes
    JWT_ALGORITHM: str = "HS256"                    # Signing algorithm
    JWT_SECRET: str = "CHANGE_ME_DEV_SECRET"        # Override via environment in production
    SESSION_COOKIE_NAME: str = "session_id"         # Cookie name for opaque session id
    SECURE_COOKIE: bool = True                      # Set False only in local dev (http)
    REQUIRE_SESSION_CHECK_EACH_REQUEST: bool = True # Strict: verify session row every request initially

    class Config:
        env_file = ".env"

settings = Settings()