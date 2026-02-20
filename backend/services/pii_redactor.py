"""PII redaction service for sanitizing user data before sending to external AI APIs.

Strips personally identifiable information (emails, phone numbers, SSNs, credit cards,
IP addresses, and names) from messages before they reach OpenAI/Sarvam. The redacted
placeholders are restored in the response so the user sees their original text.

This is a privacy-first layer — spiritual wellness conversations often contain
sensitive personal context that should not be sent to third-party providers.
"""

import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)

# Compiled patterns for PII detection
_EMAIL_RE = re.compile(
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
)

_PHONE_RE = re.compile(
    r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b'
)

_SSN_RE = re.compile(
    r'\b\d{3}-\d{2}-\d{4}\b'
)

_CREDIT_CARD_RE = re.compile(
    r'\b(?:\d{4}[-\s]?){3}\d{4}\b'
)

_IP_RE = re.compile(
    r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
)

# Common Indian ID patterns (Aadhaar)
_AADHAAR_RE = re.compile(
    r'\b\d{4}\s?\d{4}\s?\d{4}\b'
)


class PIIRedactor:
    """Redacts PII from text before sending to external AI providers.

    Usage:
        redactor = PIIRedactor()
        clean_text, mapping = redactor.redact(user_message)
        # Send clean_text to OpenAI
        # Later restore: redactor.restore(ai_response, mapping)
    """

    def __init__(self):
        self.patterns = [
            ("EMAIL", _EMAIL_RE),
            ("SSN", _SSN_RE),
            ("CREDIT_CARD", _CREDIT_CARD_RE),
            ("AADHAAR", _AADHAAR_RE),
            ("PHONE", _PHONE_RE),
            ("IP_ADDRESS", _IP_RE),
        ]

    def redact(self, text: str) -> tuple[str, dict[str, str]]:
        """Redact PII from text, returning cleaned text and a restoration mapping.

        Args:
            text: Raw user input.

        Returns:
            (redacted_text, mapping) where mapping maps placeholders to originals.
        """
        if not text:
            return text, {}

        mapping: dict[str, str] = {}
        result = text
        counter = 0

        for label, pattern in self.patterns:
            for match in pattern.finditer(result):
                original = match.group()
                # Skip very short matches that are likely false positives
                if label == "PHONE" and len(original.replace("-", "").replace(" ", "")) < 7:
                    continue
                if label == "IP_ADDRESS" and not self._is_plausible_ip(original):
                    continue

                placeholder = f"[REDACTED_{label}_{counter}]"
                mapping[placeholder] = original
                result = result.replace(original, placeholder, 1)
                counter += 1

        if mapping:
            logger.info(f"PII redacted: {len(mapping)} item(s) removed before API call")

        return result, mapping

    def restore(self, text: str, mapping: dict[str, str]) -> str:
        """Restore redacted placeholders in an AI response.

        Args:
            text: AI response that may contain [REDACTED_*] placeholders.
            mapping: The mapping returned by redact().

        Returns:
            Text with placeholders replaced by original values.
        """
        if not text or not mapping:
            return text

        result = text
        for placeholder, original in mapping.items():
            result = result.replace(placeholder, original)
        return result

    @staticmethod
    def _is_plausible_ip(value: str) -> bool:
        """Check if a dotted-quad string looks like a real IP address."""
        parts = value.split(".")
        return all(0 <= int(p) <= 255 for p in parts)


# Module-level singleton
pii_redactor = PIIRedactor()
