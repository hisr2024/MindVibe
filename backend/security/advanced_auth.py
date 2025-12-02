"""Advanced Authentication for MindVibe.

This module provides comprehensive authentication features including:
- Refresh token rotation with secure storage
- Multi-factor authentication (TOTP)
- Account lockout after failed attempts
- Device fingerprinting utilities
- Session management
"""

import hashlib
import hmac
import secrets
import time
from datetime import UTC, datetime, timedelta
from typing import Any

import pyotp

# Account lockout configuration
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 30
FAILED_ATTEMPT_WINDOW_MINUTES = 15

# In-memory storage for failed attempts (use Redis in production)
_failed_attempts: dict[str, list[float]] = {}
_locked_accounts: dict[str, float] = {}


class TOTPManager:
    """TOTP (Time-based One-Time Password) Manager for MFA.

    Provides functionality for:
    - Generating TOTP secrets
    - Generating provisioning URIs for authenticator apps
    - Verifying TOTP codes
    """

    def __init__(self, issuer: str = "MindVibe", digits: int = 6, interval: int = 30):
        """Initialize TOTP manager.

        Args:
            issuer: The name of the issuer (shown in authenticator apps)
            digits: Number of digits in the TOTP code
            interval: Time interval in seconds
        """
        self.issuer = issuer
        self.digits = digits
        self.interval = interval

    def generate_secret(self) -> str:
        """Generate a new TOTP secret.

        Returns:
            Base32-encoded secret string
        """
        return pyotp.random_base32()

    def get_provisioning_uri(self, secret: str, email: str) -> str:
        """Generate a provisioning URI for authenticator apps.

        Args:
            secret: The TOTP secret
            email: User's email address

        Returns:
            otpauth:// URI for QR code generation
        """
        totp = pyotp.TOTP(secret, digits=self.digits, interval=self.interval)
        return totp.provisioning_uri(name=email, issuer_name=self.issuer)

    def verify_code(self, secret: str, code: str, valid_window: int = 1) -> bool:
        """Verify a TOTP code.

        Args:
            secret: The TOTP secret
            code: The code to verify
            valid_window: Number of intervals before/after current to accept

        Returns:
            True if code is valid, False otherwise
        """
        try:
            totp = pyotp.TOTP(secret, digits=self.digits, interval=self.interval)
            return totp.verify(code, valid_window=valid_window)
        except Exception:
            return False

    def get_current_code(self, secret: str) -> str:
        """Get the current TOTP code (for testing purposes).

        Args:
            secret: The TOTP secret

        Returns:
            Current TOTP code
        """
        totp = pyotp.TOTP(secret, digits=self.digits, interval=self.interval)
        return totp.now()


class AccountLockoutManager:
    """Manager for account lockout after failed login attempts.

    Implements progressive lockout strategy to prevent brute force attacks.
    """

    def __init__(
        self,
        max_attempts: int = MAX_FAILED_ATTEMPTS,
        lockout_duration: int = LOCKOUT_DURATION_MINUTES,
        attempt_window: int = FAILED_ATTEMPT_WINDOW_MINUTES,
    ):
        """Initialize lockout manager.

        Args:
            max_attempts: Maximum failed attempts before lockout
            lockout_duration: Lockout duration in minutes
            attempt_window: Window in minutes to count attempts
        """
        self.max_attempts = max_attempts
        self.lockout_duration = lockout_duration
        self.attempt_window = attempt_window

    def _get_account_key(self, identifier: str) -> str:
        """Get normalized account key."""
        return identifier.lower().strip()

    def record_failed_attempt(self, identifier: str) -> tuple[bool, int]:
        """Record a failed login attempt.

        Args:
            identifier: User identifier (email or IP)

        Returns:
            Tuple of (is_locked, attempts_remaining)
        """
        key = self._get_account_key(identifier)
        current_time = time.time()
        window_start = current_time - (self.attempt_window * 60)

        # Clean old attempts
        if key in _failed_attempts:
            _failed_attempts[key] = [
                ts for ts in _failed_attempts[key] if ts > window_start
            ]
        else:
            _failed_attempts[key] = []

        # Add this attempt
        _failed_attempts[key].append(current_time)

        # Check if should lock
        attempt_count = len(_failed_attempts[key])
        if attempt_count >= self.max_attempts:
            self._lock_account(key)
            return True, 0

        return False, self.max_attempts - attempt_count

    def _lock_account(self, key: str) -> None:
        """Lock an account."""
        _locked_accounts[key] = time.time() + (self.lockout_duration * 60)

    def is_locked(self, identifier: str) -> tuple[bool, int]:
        """Check if an account is locked.

        Args:
            identifier: User identifier

        Returns:
            Tuple of (is_locked, seconds_until_unlock)
        """
        key = self._get_account_key(identifier)

        if key in _locked_accounts:
            unlock_time = _locked_accounts[key]
            if time.time() < unlock_time:
                return True, int(unlock_time - time.time())
            # Expired lock - clean up
            del _locked_accounts[key]
            if key in _failed_attempts:
                del _failed_attempts[key]

        return False, 0

    def clear_failed_attempts(self, identifier: str) -> None:
        """Clear failed attempts after successful login.

        Args:
            identifier: User identifier
        """
        key = self._get_account_key(identifier)
        if key in _failed_attempts:
            del _failed_attempts[key]

    def get_attempts_remaining(self, identifier: str) -> int:
        """Get remaining attempts before lockout.

        Args:
            identifier: User identifier

        Returns:
            Number of attempts remaining
        """
        key = self._get_account_key(identifier)
        current_time = time.time()
        window_start = current_time - (self.attempt_window * 60)

        if key not in _failed_attempts:
            return self.max_attempts

        valid_attempts = [
            ts for ts in _failed_attempts[key] if ts > window_start
        ]
        return max(0, self.max_attempts - len(valid_attempts))


class SecureTokenManager:
    """Manager for secure token generation and validation.

    Handles:
    - Refresh token generation and rotation
    - Token hashing for storage
    - Token validation
    """

    def __init__(self, token_bytes: int = 32):
        """Initialize token manager.

        Args:
            token_bytes: Number of bytes for token generation
        """
        self.token_bytes = token_bytes

    def generate_token(self) -> str:
        """Generate a cryptographically secure random token.

        Returns:
            URL-safe base64 encoded token
        """
        return secrets.token_urlsafe(self.token_bytes)

    def hash_token(self, token: str) -> str:
        """Hash a token for secure storage.

        Args:
            token: The token to hash

        Returns:
            SHA-256 hash of the token
        """
        return hashlib.sha256(token.encode()).hexdigest()

    def generate_token_with_hash(self) -> tuple[str, str]:
        """Generate a token and its hash.

        Returns:
            Tuple of (plain_token, hashed_token)
        """
        token = self.generate_token()
        return token, self.hash_token(token)

    def verify_token(self, token: str, stored_hash: str) -> bool:
        """Verify a token against its stored hash.

        Args:
            token: The token to verify
            stored_hash: The stored hash to compare against

        Returns:
            True if token matches hash, False otherwise
        """
        return hmac.compare_digest(self.hash_token(token), stored_hash)


class DeviceFingerprintManager:
    """Manager for device fingerprinting.

    Creates and validates device fingerprints for session security.
    """

    def generate_fingerprint(
        self,
        user_agent: str,
        ip_address: str,
        accept_language: str | None = None,
    ) -> str:
        """Generate a device fingerprint.

        Args:
            user_agent: Browser user agent string
            ip_address: Client IP address
            accept_language: Accept-Language header value

        Returns:
            Device fingerprint hash
        """
        # Only use stable components for fingerprint
        components = [
            user_agent or "",
            accept_language or "",
            # Note: IP is excluded from fingerprint to allow for network changes
        ]
        fingerprint_data = "|".join(components)
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()

    def generate_ip_hash(self, ip_address: str) -> str:
        """Generate a hash of the IP address.

        Args:
            ip_address: Client IP address

        Returns:
            Hashed IP address
        """
        return hashlib.sha256(ip_address.encode()).hexdigest()[:16]


class SessionManager:
    """Manager for secure session handling.

    Provides:
    - Session creation and validation
    - Session expiration management
    - Session data encryption
    """

    def __init__(
        self,
        session_duration_hours: int = 24,
        max_sessions_per_user: int = 5,
    ):
        """Initialize session manager.

        Args:
            session_duration_hours: Session duration in hours
            max_sessions_per_user: Maximum concurrent sessions per user
        """
        self.session_duration = timedelta(hours=session_duration_hours)
        self.max_sessions = max_sessions_per_user
        self._token_manager = SecureTokenManager()

    def create_session_id(self) -> str:
        """Create a new session ID.

        Returns:
            Unique session identifier
        """
        return self._token_manager.generate_token()

    def calculate_expiration(self) -> datetime:
        """Calculate session expiration time.

        Returns:
            Expiration datetime
        """
        return datetime.now(UTC) + self.session_duration

    def is_session_expired(self, expires_at: datetime) -> bool:
        """Check if a session has expired.

        Args:
            expires_at: Session expiration datetime

        Returns:
            True if expired, False otherwise
        """
        now = datetime.now(UTC)
        # Handle both naive and aware datetimes
        if expires_at.tzinfo is None:
            # If expires_at is naive, compare with naive now
            now = now.replace(tzinfo=None)
        return now > expires_at


# Singleton instances for use throughout the application
totp_manager = TOTPManager()
lockout_manager = AccountLockoutManager()
token_manager = SecureTokenManager()
device_fingerprint_manager = DeviceFingerprintManager()
session_manager = SessionManager()


# Utility functions
def generate_secure_password_reset_token() -> tuple[str, str, datetime]:
    """Generate a secure password reset token.

    Returns:
        Tuple of (plain_token, hashed_token, expiration_datetime)
    """
    token, hashed = token_manager.generate_token_with_hash()
    expires = datetime.now(UTC) + timedelta(hours=1)
    return token, hashed, expires


def generate_email_verification_token() -> tuple[str, str, datetime]:
    """Generate a secure email verification token.

    Returns:
        Tuple of (plain_token, hashed_token, expiration_datetime)
    """
    token, hashed = token_manager.generate_token_with_hash()
    expires = datetime.now(UTC) + timedelta(hours=24)
    return token, hashed, expires


def validate_password_strength(password: str) -> dict[str, Any]:
    """Validate password strength and return detailed feedback.

    Args:
        password: Password to validate

    Returns:
        Dictionary with validation result and feedback
    """
    errors = []
    warnings = []
    score = 0

    # Length check
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    elif len(password) >= 12:
        score += 2
    else:
        score += 1

    # Uppercase check
    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")
    else:
        score += 1

    # Lowercase check
    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")
    else:
        score += 1

    # Digit check
    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one number")
    else:
        score += 1

    # Special character check
    special_chars = set("!@#$%^&*()_+-=[]{}|;:,.<>?")
    if not any(c in special_chars for c in password):
        warnings.append("Consider adding special characters for stronger security")
    else:
        score += 1

    # Common password patterns
    common_patterns = ["password", "123456", "qwerty", "admin", "letmein"]
    if any(pattern in password.lower() for pattern in common_patterns):
        errors.append("Password contains common patterns and is too weak")
        score = max(0, score - 2)

    strength = "weak"
    if score >= 5:
        strength = "strong"
    elif score >= 3:
        strength = "medium"

    return {
        "valid": len(errors) == 0,
        "strength": strength,
        "score": score,
        "errors": errors,
        "warnings": warnings,
    }
