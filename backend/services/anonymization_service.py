"""
Anonymization Service for Community Wisdom Circles

Provides anonymous identity generation for users in community circles:
- HMAC-based anonymous ID generation (deterministic per circle)
- Friendly pseudonym generation (e.g., "Serene Lotus", "Peaceful River")
- Avatar color assignment
- Per-circle consistency (same user = same identity within a circle)
- Zero PII exposure

Quantum Enhancement #5: Community Wisdom Circles
"""

import hashlib
import hmac
import secrets
from typing import Dict, Optional
from datetime import datetime
from pydantic import BaseModel


# Friendly name components
ADJECTIVES = [
    "Serene", "Peaceful", "Gentle", "Calm", "Quiet", "Radiant", "Bright",
    "Tranquil", "Harmonious", "Balanced", "Mindful", "Centered", "Grounded",
    "Compassionate", "Kind", "Wise", "Thoughtful", "Resilient", "Strong",
    "Courageous", "Hopeful", "Joyful", "Content", "Patient", "Grateful",
    "Humble", "Open", "Clear", "Pure", "Steady", "Noble", "Blessed"
]

NOUNS = [
    "Lotus", "River", "Mountain", "Ocean", "Star", "Moon", "Sun", "Sky",
    "Tree", "Forest", "Garden", "Flower", "Bird", "Butterfly", "Breeze",
    "Dawn", "Dusk", "Light", "Path", "Journey", "Soul", "Heart", "Spirit",
    "Seeker", "Sage", "Pilgrim", "Wanderer", "Dreamer", "Phoenix", "Dragon",
    "Tiger", "Eagle", "Deer", "Crane", "Bamboo", "Willow", "Cedar"
]

AVATAR_COLORS = [
    "#F59E0B",  # Amber
    "#10B981",  # Emerald
    "#3B82F6",  # Blue
    "#8B5CF6",  # Violet
    "#EC4899",  # Pink
    "#EF4444",  # Red
    "#14B8A6",  # Teal
    "#6366F1",  # Indigo
    "#F97316",  # Orange
    "#A855F7",  # Purple
]


class AnonymousIdentity(BaseModel):
    """Anonymous identity for a user in a specific circle"""
    anonymous_id: str  # HMAC-based anonymous ID
    display_name: str  # Friendly pseudonym
    avatar_color: str  # Hex color for avatar
    circle_id: int
    created_at: datetime


class AnonymizationService:
    """Service for generating and managing anonymous identities in community circles"""

    def __init__(self, secret_key: Optional[str] = None):
        """
        Initialize anonymization service

        Args:
            secret_key: Secret key for HMAC generation. If None, generates a random one.
                       In production, load from secure environment variable.
        """
        self.secret_key = secret_key or secrets.token_hex(32)

    def generate_anonymous_identity(
        self, user_id: int, circle_id: int
    ) -> AnonymousIdentity:
        """
        Generate anonymous identity for a user in a specific circle

        The identity is deterministic (same user + circle = same identity) but
        different across circles (same user has different identities in different circles).

        Args:
            user_id: Real user ID
            circle_id: Circle ID where user wants to participate

        Returns:
            AnonymousIdentity with pseudonym, color, and anonymous ID
        """
        # Generate deterministic anonymous ID using HMAC
        anonymous_id = self._generate_anonymous_id(user_id, circle_id)

        # Generate deterministic display name
        display_name = self._generate_display_name(anonymous_id)

        # Generate deterministic avatar color
        avatar_color = self._generate_avatar_color(anonymous_id)

        return AnonymousIdentity(
            anonymous_id=anonymous_id,
            display_name=display_name,
            avatar_color=avatar_color,
            circle_id=circle_id,
            created_at=datetime.now()
        )

    def _generate_anonymous_id(self, user_id: int, circle_id: int) -> str:
        """
        Generate HMAC-based anonymous ID

        Uses HMAC-SHA256 to create a deterministic but irreversible anonymous ID.
        Same user + circle will always produce the same ID.

        Args:
            user_id: Real user ID
            circle_id: Circle ID

        Returns:
            Hex-encoded anonymous ID (64 characters)
        """
        # Combine user_id and circle_id
        message = f"{user_id}:{circle_id}".encode('utf-8')

        # Generate HMAC
        h = hmac.new(
            self.secret_key.encode('utf-8'),
            message,
            hashlib.sha256
        )

        return h.hexdigest()

    def _generate_display_name(self, anonymous_id: str) -> str:
        """
        Generate friendly pseudonym from anonymous ID

        Uses deterministic selection from adjective + noun lists.
        Examples: "Serene Lotus", "Peaceful River", "Gentle Mountain"

        Args:
            anonymous_id: Anonymous ID (hex string)

        Returns:
            Friendly display name
        """
        # Use first 8 bytes of anonymous_id for deterministic selection
        seed = int(anonymous_id[:8], 16)

        # Select adjective and noun
        adjective_idx = seed % len(ADJECTIVES)
        noun_idx = (seed // len(ADJECTIVES)) % len(NOUNS)

        adjective = ADJECTIVES[adjective_idx]
        noun = NOUNS[noun_idx]

        return f"{adjective} {noun}"

    def _generate_avatar_color(self, anonymous_id: str) -> str:
        """
        Generate avatar color from anonymous ID

        Args:
            anonymous_id: Anonymous ID (hex string)

        Returns:
            Hex color code
        """
        # Use middle 8 bytes of anonymous_id
        seed = int(anonymous_id[8:16], 16)
        color_idx = seed % len(AVATAR_COLORS)
        return AVATAR_COLORS[color_idx]

    def verify_anonymous_identity(
        self, user_id: int, circle_id: int, claimed_anonymous_id: str
    ) -> bool:
        """
        Verify that an anonymous ID belongs to a specific user in a circle

        Args:
            user_id: Real user ID
            circle_id: Circle ID
            claimed_anonymous_id: Anonymous ID to verify

        Returns:
            True if the anonymous ID is valid for this user/circle combination
        """
        expected_id = self._generate_anonymous_id(user_id, circle_id)
        return secrets.compare_digest(expected_id, claimed_anonymous_id)

    def get_identity_for_user_in_circle(
        self, user_id: int, circle_id: int
    ) -> AnonymousIdentity:
        """
        Get or create anonymous identity for user in a specific circle

        This is the main method to call when a user joins or posts to a circle.

        Args:
            user_id: Real user ID
            circle_id: Circle ID

        Returns:
            AnonymousIdentity for this user in this circle
        """
        return self.generate_anonymous_identity(user_id, circle_id)

    def strip_pii_from_content(self, content: str) -> Dict[str, any]:
        """
        Analyze content for potential PII (Personally Identifiable Information)

        Detects:
        - Email addresses
        - Phone numbers
        - URLs with personal domains
        - Social media handles

        Args:
            content: Text content to analyze

        Returns:
            Dict with:
                - contains_pii: bool
                - pii_types: List[str] of detected PII types
                - warnings: List[str] of specific warnings
        """
        import re

        pii_types = []
        warnings = []

        # Email pattern
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        if re.search(email_pattern, content):
            pii_types.append('email')
            warnings.append('Email address detected')

        # Phone number patterns (various formats)
        phone_patterns = [
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # US format
            r'\b\d{10}\b',  # 10 digits
            r'\+\d{1,3}\s?\d{6,14}\b'  # International format
        ]
        for pattern in phone_patterns:
            if re.search(pattern, content):
                pii_types.append('phone')
                warnings.append('Phone number detected')
                break

        # URL pattern
        url_pattern = r'https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b'
        if re.search(url_pattern, content):
            pii_types.append('url')
            warnings.append('URL detected (may contain personal information)')

        # Social media handle pattern
        handle_pattern = r'@[A-Za-z0-9_]{3,}'
        if re.search(handle_pattern, content):
            pii_types.append('social_handle')
            warnings.append('Social media handle detected')

        # Common name patterns (very basic - just flag "my name is")
        name_intro_patterns = [
            r"my name is [A-Z][a-z]+",
            r"I'm [A-Z][a-z]+",
            r"I am [A-Z][a-z]+",
            r"call me [A-Z][a-z]+"
        ]
        for pattern in name_intro_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                pii_types.append('possible_name')
                warnings.append('Possible name mention detected')
                break

        return {
            'contains_pii': len(pii_types) > 0,
            'pii_types': list(set(pii_types)),
            'warnings': warnings
        }

    def generate_anonymous_stats(self, anonymous_id: str) -> Dict[str, any]:
        """
        Generate anonymous statistics display

        Instead of showing real user stats, show circle-specific engagement stats
        that don't reveal identity.

        Args:
            anonymous_id: Anonymous ID

        Returns:
            Dict with anonymous stats (posts_in_circle, hearts_received_in_circle, etc.)
        """
        # This would connect to database in real implementation
        # For now, return structure
        return {
            'posts_in_this_circle': 0,
            'hearts_received_in_this_circle': 0,
            'compassion_badges_in_this_circle': [],
            'member_since': datetime.now(),
        }


# Singleton instance
_anonymization_service: Optional[AnonymizationService] = None


def get_anonymization_service() -> AnonymizationService:
    """Get or create singleton anonymization service instance"""
    global _anonymization_service
    if _anonymization_service is None:
        # In production, load secret from environment variable
        import os
        secret_key = os.getenv('ANONYMIZATION_SECRET_KEY')
        _anonymization_service = AnonymizationService(secret_key=secret_key)
    return _anonymization_service
