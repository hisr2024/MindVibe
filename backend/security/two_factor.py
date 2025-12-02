"""Two-Factor Authentication (2FA) utilities.

Implements TOTP-based 2FA that is compatible with Google Authenticator,
Authy, and other TOTP apps.

KIAAN Impact: ✅ POSITIVE - Enhanced security without affecting KIAAN functionality.
"""

import base64
import io
import secrets
from typing import Optional

import pyotp


def generate_2fa_secret() -> str:
    """
    Generate a new 2FA secret for a user.
    
    Returns a base32-encoded secret that can be used with TOTP apps.
    """
    return pyotp.random_base32()


def generate_backup_codes(count: int = 8) -> list[str]:
    """
    Generate backup codes for account recovery.
    
    Each code is a 10-character alphanumeric string.
    These should be hashed before storage and shown to the user only once.
    
    Args:
        count: Number of backup codes to generate (default: 8)
        
    Returns:
        List of backup codes
    """
    codes = []
    for _ in range(count):
        # Generate a code like "XXXX-XXXX-XXXX"
        code_parts = [secrets.token_hex(2).upper() for _ in range(3)]
        codes.append("-".join(code_parts))
    return codes


def get_totp_uri(secret: str, email: str, issuer: str = "MindVibe") -> str:
    """
    Generate a TOTP URI for QR code generation.
    
    This URI can be converted to a QR code that users scan with their
    authenticator app.
    
    Args:
        secret: The 2FA secret
        email: User's email address
        issuer: Name of the service (default: "MindVibe")
        
    Returns:
        otpauth:// URI string
    """
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=issuer)


def generate_qr_code_base64(uri: str) -> str:
    """
    Generate a QR code image as a base64-encoded PNG.
    
    Args:
        uri: The TOTP URI to encode
        
    Returns:
        Base64-encoded PNG image data
        
    Note:
        Requires qrcode and pillow packages. If not available,
        returns an empty string (frontend can use URI directly).
    """
    try:
        import qrcode
        from PIL import Image
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        
        return base64.b64encode(buffer.read()).decode("utf-8")
    except ImportError:
        # QR code libraries not available
        return ""


def verify_totp_code(secret: str, code: str, valid_window: int = 1) -> bool:
    """
    Verify a TOTP code.
    
    Args:
        secret: The user's 2FA secret
        code: The code entered by the user
        valid_window: Number of 30-second windows to check (default: 1)
                     This allows for clock drift between client and server
        
    Returns:
        True if the code is valid, False otherwise
    """
    if not secret or not code:
        return False
    
    # Remove any spaces or dashes from the code
    code = code.replace(" ", "").replace("-", "")
    
    # Verify the code must be 6 digits
    if not code.isdigit() or len(code) != 6:
        return False
    
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=valid_window)


def verify_backup_code(provided_code: str, stored_codes: list[str]) -> Optional[int]:
    """
    Verify a backup code and return its index if valid.
    
    Args:
        provided_code: The backup code entered by the user
        stored_codes: List of hashed backup codes (or plaintext for simple impl)
        
    Returns:
        Index of the matched code (for removal), or None if not found
        
    Note:
        In production, backup codes should be hashed. This simple implementation
        uses plaintext comparison. Enhance with bcrypt for production use.
    """
    # Normalize the code
    provided_code = provided_code.upper().replace(" ", "")
    
    for i, stored_code in enumerate(stored_codes):
        # Normalize stored code for comparison
        normalized_stored = stored_code.upper().replace(" ", "")
        
        if secrets.compare_digest(provided_code, normalized_stored):
            return i
    
    return None


def get_current_totp_code(secret: str) -> str:
    """
    Get the current TOTP code for testing/debugging purposes.
    
    WARNING: This should only be used in development/testing.
    Never expose this in production APIs.
    
    Args:
        secret: The 2FA secret
        
    Returns:
        Current 6-digit TOTP code
    """
    totp = pyotp.TOTP(secret)
    return totp.now()


class TwoFactorAuth:
    """
    High-level 2FA management class.
    
    Usage:
        # Setup 2FA for a user
        tfa = TwoFactorAuth()
        setup_data = tfa.setup_2fa("user@example.com")
        # Show QR code and secret to user
        
        # Later, verify a code
        is_valid = tfa.verify_code(user.two_factor_secret, "123456")
    """
    
    def __init__(self, issuer: str = "MindVibe"):
        self.issuer = issuer
    
    def setup_2fa(self, email: str) -> dict:
        """
        Initialize 2FA setup for a user.
        
        Returns setup data including:
        - secret: Store this securely for the user
        - uri: TOTP URI for QR codes
        - qr_code: Base64-encoded QR code image (if available)
        - backup_codes: List of backup codes (show once, then hash and store)
        """
        secret = generate_2fa_secret()
        uri = get_totp_uri(secret, email, self.issuer)
        qr_code = generate_qr_code_base64(uri)
        backup_codes = generate_backup_codes()
        
        return {
            "secret": secret,
            "uri": uri,
            "qr_code": qr_code,
            "backup_codes": backup_codes,
        }
    
    def verify_code(self, secret: str, code: str) -> bool:
        """Verify a TOTP code."""
        return verify_totp_code(secret, code)
    
    def verify_backup(self, code: str, stored_codes: list[str]) -> Optional[int]:
        """Verify a backup code and return its index for removal."""
        return verify_backup_code(code, stored_codes)
