"""Data Protection and Encryption for MindVibe.

This module provides comprehensive data protection including:
- Field-level encryption for sensitive data
- Key rotation mechanism
- PII data masking in logs
- GDPR compliance utilities
"""

import base64
import hashlib
import os
import re
import secrets
from datetime import UTC, datetime
from re import Pattern
from typing import Any


class FieldEncryption:
    """Field-level encryption for sensitive data.

    Uses AES-256-GCM for authenticated encryption.
    Falls back to XOR-based encryption if cryptography is not available.
    """

    def __init__(self, key: str | None = None):
        """Initialize field encryption.

        Args:
            key: Encryption key (32 bytes for AES-256). If not provided,
                 uses SECRET_KEY from environment.
        """
        self._key_str = key or os.getenv("ENCRYPTION_KEY", os.getenv("SECRET_KEY", ""))
        if not self._key_str:
            raise ValueError("Encryption key must be provided")
        # Derive a 32-byte key from the provided key
        self._key = hashlib.sha256(self._key_str.encode()).digest()

    def _xor_encrypt(self, data: bytes) -> bytes:
        """Simple XOR encryption (fallback when cryptography unavailable)."""
        key_len = len(self._key)
        return bytes([data[i] ^ self._key[i % key_len] for i in range(len(data))])

    def encrypt(self, plaintext: str) -> str:
        """Encrypt a string value.

        Args:
            plaintext: The string to encrypt

        Returns:
            Base64-encoded encrypted data
        """
        if not plaintext:
            return ""

        try:
            from cryptography.hazmat.primitives.ciphers.aead import AESGCM

            # Generate a random nonce
            nonce = secrets.token_bytes(12)
            aesgcm = AESGCM(self._key)
            ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
            # Combine nonce and ciphertext
            encrypted = nonce + ciphertext
            return base64.b64encode(encrypted).decode()
        except ImportError:
            # Fallback to XOR encryption
            nonce = secrets.token_bytes(12)
            data = plaintext.encode()
            encrypted_data = self._xor_encrypt(data)
            return base64.b64encode(nonce + encrypted_data).decode()

    def decrypt(self, ciphertext: str) -> str:
        """Decrypt an encrypted string value.

        Args:
            ciphertext: Base64-encoded encrypted data

        Returns:
            Decrypted plaintext string
        """
        if not ciphertext:
            return ""

        try:
            from cryptography.hazmat.primitives.ciphers.aead import AESGCM

            encrypted = base64.b64decode(ciphertext)
            nonce = encrypted[:12]
            actual_ciphertext = encrypted[12:]
            aesgcm = AESGCM(self._key)
            plaintext = aesgcm.decrypt(nonce, actual_ciphertext, None)
            return plaintext.decode()
        except ImportError:
            # Fallback to XOR decryption
            encrypted = base64.b64decode(ciphertext)
            nonce = encrypted[:12]
            data = encrypted[12:]
            decrypted_data = self._xor_encrypt(data)
            return decrypted_data.decode()

    def encrypt_dict_field(self, data: dict[str, Any], field: str) -> dict[str, Any]:
        """Encrypt a specific field in a dictionary.

        Args:
            data: Dictionary containing the field
            field: Name of the field to encrypt

        Returns:
            Dictionary with the field encrypted
        """
        if field not in data or not isinstance(data[field], str):
            return data
        result = data.copy()
        result[field] = self.encrypt(data[field])
        return result

    def decrypt_dict_field(self, data: dict[str, Any], field: str) -> dict[str, Any]:
        """Decrypt a specific field in a dictionary.

        Args:
            data: Dictionary containing the encrypted field
            field: Name of the field to decrypt

        Returns:
            Dictionary with the field decrypted
        """
        if field not in data or not isinstance(data[field], str):
            return data
        result = data.copy()
        result[field] = self.decrypt(data[field])
        return result


class KeyRotation:
    """Key rotation management for encryption keys.

    Handles:
    - Key versioning
    - Gradual key rotation
    - Key derivation
    """

    def __init__(
        self,
        master_key: str | None = None,
        rotation_period_days: int = 90,
    ):
        """Initialize key rotation manager.

        Args:
            master_key: Master key for key derivation
            rotation_period_days: Days between key rotations
        """
        self._master_key = master_key or os.getenv(
            "MASTER_KEY", os.getenv("SECRET_KEY", "")
        )
        self.rotation_period_days = rotation_period_days

    def derive_key(self, purpose: str, version: int = 1) -> bytes:
        """Derive a key for a specific purpose.

        Args:
            purpose: The purpose of the key (e.g., "encryption", "signing")
            version: Key version number

        Returns:
            32-byte derived key
        """
        info = f"{purpose}:v{version}".encode()
        key_material = f"{self._master_key}:{info.decode()}".encode()
        return hashlib.sha256(key_material).digest()

    def get_current_key_version(self) -> int:
        """Get the current key version based on time.

        Returns:
            Current key version number
        """
        # Calculate version based on rotation period
        days_since_epoch = (datetime.now(UTC) - datetime(2024, 1, 1, tzinfo=UTC)).days
        return (days_since_epoch // self.rotation_period_days) + 1

    def create_versioned_encryption(self, purpose: str) -> FieldEncryption:
        """Create an encryption instance with versioned key.

        Args:
            purpose: The purpose of encryption

        Returns:
            FieldEncryption instance with derived key
        """
        version = self.get_current_key_version()
        key = self.derive_key(purpose, version)
        return FieldEncryption(base64.b64encode(key).decode())


class PIIMasker:
    """PII (Personally Identifiable Information) masking utility.

    Provides masking for:
    - Email addresses
    - Phone numbers
    - Credit card numbers
    - Social security numbers
    - IP addresses
    - Custom patterns
    """

    # Common PII patterns
    EMAIL_PATTERN: Pattern[str] = re.compile(
        r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
    )
    PHONE_PATTERN: Pattern[str] = re.compile(
        r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b"
    )
    SSN_PATTERN: Pattern[str] = re.compile(
        r"\b\d{3}[-]?\d{2}[-]?\d{4}\b"
    )
    CREDIT_CARD_PATTERN: Pattern[str] = re.compile(
        r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b"
    )
    IP_PATTERN: Pattern[str] = re.compile(
        r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"
    )

    def __init__(self, mask_char: str = "*", preserve_chars: int = 4):
        """Initialize PII masker.

        Args:
            mask_char: Character to use for masking
            preserve_chars: Number of characters to preserve at end
        """
        self.mask_char = mask_char
        self.preserve_chars = preserve_chars

    def mask_email(self, email: str) -> str:
        """Mask an email address.

        Args:
            email: Email address to mask

        Returns:
            Masked email (e.g., "j***@****.com")
        """
        if not email or "@" not in email:
            return email
        local, domain = email.rsplit("@", 1)
        domain_parts = domain.rsplit(".", 1)

        masked_local = local[0] + self.mask_char * min(3, len(local) - 1)
        masked_domain = (
            self.mask_char * min(4, len(domain_parts[0]))
            + "."
            + domain_parts[-1]
        )
        return f"{masked_local}@{masked_domain}"

    def mask_phone(self, phone: str) -> str:
        """Mask a phone number.

        Args:
            phone: Phone number to mask

        Returns:
            Masked phone (e.g., "***-***-1234")
        """
        if not phone:
            return phone
        digits = re.sub(r"[^\d]", "", phone)
        if len(digits) < self.preserve_chars:
            return self.mask_char * len(digits)
        masked = self.mask_char * (len(digits) - self.preserve_chars)
        preserved = digits[-self.preserve_chars:]
        return masked + preserved

    def mask_credit_card(self, card: str) -> str:
        """Mask a credit card number.

        Args:
            card: Credit card number to mask

        Returns:
            Masked card (e.g., "****-****-****-1234")
        """
        if not card:
            return card
        digits = re.sub(r"[^\d]", "", card)
        if len(digits) < 4:
            return self.mask_char * len(digits)
        return self.mask_char * (len(digits) - 4) + digits[-4:]

    def mask_ip(self, ip: str) -> str:
        """Mask an IP address.

        Args:
            ip: IP address to mask

        Returns:
            Masked IP (e.g., "***.***.***.123")
        """
        if not ip:
            return ip
        parts = ip.split(".")
        if len(parts) != 4:
            return ip
        return ".".join(
            [self.mask_char * 3 for _ in parts[:3]] + [parts[-1]]
        )

    def mask_string(self, text: str) -> str:
        """Mask all PII in a string.

        Args:
            text: Text to mask

        Returns:
            Text with all PII masked
        """
        if not text:
            return text

        result = text

        # Mask emails
        for match in self.EMAIL_PATTERN.finditer(text):
            result = result.replace(match.group(), self.mask_email(match.group()))

        # Mask phone numbers
        for match in self.PHONE_PATTERN.finditer(result):
            result = result.replace(match.group(), self.mask_phone(match.group()))

        # Mask SSNs
        for match in self.SSN_PATTERN.finditer(result):
            result = result.replace(
                match.group(),
                self.mask_char * (len(match.group()) - self.preserve_chars)
                + match.group()[-self.preserve_chars:],
            )

        # Mask credit cards
        for match in self.CREDIT_CARD_PATTERN.finditer(result):
            result = result.replace(match.group(), self.mask_credit_card(match.group()))

        # Mask IPs
        for match in self.IP_PATTERN.finditer(result):
            result = result.replace(match.group(), self.mask_ip(match.group()))

        return result

    def mask_dict(
        self, data: dict[str, Any], sensitive_fields: list[str] | None = None
    ) -> dict[str, Any]:
        """Mask PII in a dictionary.

        Args:
            data: Dictionary to mask
            sensitive_fields: Additional fields to fully mask

        Returns:
            Dictionary with PII masked
        """
        sensitive_fields = sensitive_fields or [
            "password",
            "secret",
            "token",
            "api_key",
            "credit_card",
            "ssn",
        ]

        result = {}
        for key, value in data.items():
            key_lower = key.lower()

            # Fully mask sensitive fields
            if any(sf in key_lower for sf in sensitive_fields):
                if isinstance(value, str):
                    result[key] = self.mask_char * min(8, len(value))
                else:
                    result[key] = "[REDACTED]"
            elif isinstance(value, str):
                result[key] = self.mask_string(value)
            elif isinstance(value, dict):
                result[key] = self.mask_dict(value, sensitive_fields)
            elif isinstance(value, list):
                result[key] = [
                    self.mask_dict(item, sensitive_fields)
                    if isinstance(item, dict)
                    else self.mask_string(item)
                    if isinstance(item, str)
                    else item
                    for item in value
                ]
            else:
                result[key] = value

        return result


class GDPRCompliance:
    """GDPR compliance utilities.

    Provides:
    - Data export functionality
    - Data deletion tracking
    - Consent management
    - Right to be forgotten
    """

    def __init__(self, pii_masker: PIIMasker | None = None):
        """Initialize GDPR compliance utilities.

        Args:
            pii_masker: PII masker instance
        """
        self.pii_masker = pii_masker or PIIMasker()

    def prepare_data_export(self, user_data: dict[str, Any]) -> dict[str, Any]:
        """Prepare user data for GDPR export.

        Args:
            user_data: User's data to export

        Returns:
            Sanitized data ready for export
        """
        export_data = {
            "exported_at": datetime.now(UTC).isoformat(),
            "data_types": list(user_data.keys()),
            "user_data": user_data,
        }
        return export_data

    def create_deletion_record(
        self, user_id: str, data_types: list[str]
    ) -> dict[str, Any]:
        """Create a record of data deletion for audit trail.

        Args:
            user_id: User's identifier (will be hashed)
            data_types: Types of data deleted

        Returns:
            Deletion record for audit
        """
        return {
            "user_id_hash": hashlib.sha256(user_id.encode()).hexdigest(),
            "deleted_at": datetime.now(UTC).isoformat(),
            "data_types_deleted": data_types,
            "deletion_reason": "user_request",
        }

    def anonymize_user_data(self, user_data: dict[str, Any]) -> dict[str, Any]:
        """Anonymize user data for analytics.

        Args:
            user_data: User data to anonymize

        Returns:
            Anonymized data safe for analytics
        """
        anonymized = {}
        exclude_fields = {
            "email",
            "name",
            "phone",
            "address",
            "ip_address",
            "user_agent",
        }

        for key, value in user_data.items():
            if key.lower() in exclude_fields:
                continue
            if isinstance(value, dict):
                anonymized[key] = self.anonymize_user_data(value)
            else:
                anonymized[key] = value

        return anonymized

    def create_consent_record(
        self,
        user_id: str,
        consent_type: str,
        granted: bool,
        version: str = "1.0",
    ) -> dict[str, Any]:
        """Create a consent record.

        Args:
            user_id: User identifier
            consent_type: Type of consent (e.g., "marketing", "analytics")
            granted: Whether consent was granted
            version: Version of consent terms

        Returns:
            Consent record
        """
        return {
            "user_id": user_id,
            "consent_type": consent_type,
            "granted": granted,
            "version": version,
            "timestamp": datetime.now(UTC).isoformat(),
            "ip_hash": None,  # Should be set by caller with hashed IP
        }


# Singleton instances
pii_masker = PIIMasker()
gdpr_compliance = GDPRCompliance(pii_masker)


def create_field_encryption(key: str | None = None) -> FieldEncryption:
    """Factory function to create FieldEncryption instance.

    Args:
        key: Optional encryption key

    Returns:
        FieldEncryption instance
    """
    return FieldEncryption(key)


def mask_pii_in_logs(log_data: Any) -> Any:
    """Mask PII in log data.

    Args:
        log_data: Log data (string or dict)

    Returns:
        Masked log data
    """
    if isinstance(log_data, str):
        return pii_masker.mask_string(log_data)
    elif isinstance(log_data, dict):
        return pii_masker.mask_dict(log_data)
    return log_data
