"""JWT token utilities with EdDSA support.

Supports two signing algorithms:
- HS256 (symmetric, default): Uses SECRET_KEY for both signing and verification
- EdDSA (asymmetric, recommended): Uses private key for signing, public key for verification

To enable EdDSA:
1. Set EDDSA_ENABLED=true in environment
2. Place private.pem and public.pem in EDDSA_KEYSET_DIR (default: ./keyset_eddsa/)
"""

import os
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import jwt

from backend.core.settings import settings

logger = logging.getLogger(__name__)

# EdDSA configuration
EDDSA_ENABLED = os.getenv("EDDSA_ENABLED", "false").lower() == "true"
EDDSA_KEYSET_DIR = Path(os.getenv("EDDSA_KEYSET_DIR", "./keyset_eddsa"))

_eddsa_private_key = None
_eddsa_public_key = None


def _load_eddsa_keys():
    """Load EdDSA keys from the keyset directory (lazy, once)."""
    global _eddsa_private_key, _eddsa_public_key

    if _eddsa_private_key is not None:
        return

    private_key_path = EDDSA_KEYSET_DIR / "private.pem"
    public_key_path = EDDSA_KEYSET_DIR / "public.pem"

    if not private_key_path.exists() or not public_key_path.exists():
        logger.error(
            f"EdDSA keys not found at {EDDSA_KEYSET_DIR}. "
            "Generate keys or set EDDSA_ENABLED=false."
        )
        return

    _eddsa_private_key = private_key_path.read_bytes()
    _eddsa_public_key = public_key_path.read_bytes()
    logger.info("EdDSA keys loaded successfully")


def create_access_token(user_id: str, session_id: str) -> str:
    """Create a new access token."""
    payload = {
        "sub": user_id,
        "sid": session_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }

    if EDDSA_ENABLED:
        _load_eddsa_keys()
        if _eddsa_private_key:
            return jwt.encode(payload, _eddsa_private_key, algorithm="EdDSA")
        logger.warning("EdDSA enabled but keys not available, falling back to HS256")

    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate an access token.

    During EdDSA migration, accepts both EdDSA and HS256 tokens.
    """
    if EDDSA_ENABLED:
        _load_eddsa_keys()
        if _eddsa_public_key:
            try:
                return jwt.decode(token, _eddsa_public_key, algorithms=["EdDSA"])
            except (jwt.InvalidAlgorithmError, jwt.DecodeError):
                pass  # Token signed with HS256, fall through

    return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
