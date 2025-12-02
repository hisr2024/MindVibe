"""Security module for authentication and authorization."""

from backend.security.advanced_auth import (
    AccountLockoutManager,
    DeviceFingerprintManager,
    SecureTokenManager,
    SessionManager,
    TOTPManager,
    generate_email_verification_token,
    generate_secure_password_reset_token,
    lockout_manager,
    session_manager,
    token_manager,
    totp_manager,
    validate_password_strength,
)
from backend.security.encryption import (
    FieldEncryption,
    GDPRCompliance,
    KeyRotation,
    PIIMasker,
    create_field_encryption,
    gdpr_compliance,
    mask_pii_in_logs,
    pii_masker,
)

__all__ = [
    # Advanced Auth
    "AccountLockoutManager",
    "DeviceFingerprintManager",
    "SecureTokenManager",
    "SessionManager",
    "TOTPManager",
    "generate_email_verification_token",
    "generate_secure_password_reset_token",
    "lockout_manager",
    "session_manager",
    "token_manager",
    "totp_manager",
    "validate_password_strength",
    # Encryption
    "FieldEncryption",
    "GDPRCompliance",
    "KeyRotation",
    "PIIMasker",
    "create_field_encryption",
    "gdpr_compliance",
    "mask_pii_in_logs",
    "pii_masker",
]
