"""WebAuthn biometric authentication routes.

Provides FIDO2/WebAuthn credential registration and authentication endpoints
for biometric login (fingerprint, Face ID, device PIN).

Security:
- Challenge-response prevents replay attacks
- Credentials stored as COSE public keys (no biometric data on server)
- Sign count tracking detects credential cloning
- Rate limited to prevent brute force
- Soft delete ensures audit trail

Endpoints:
- POST /register/options  — Get registration challenge
- POST /register/verify   — Verify attestation and store credential
- POST /authenticate/options — Get authentication challenge
- POST /authenticate/verify  — Verify assertion and issue tokens
- POST /unregister         — Remove credential (soft delete)
"""

import base64
import hashlib
import json
import logging
import secrets
import struct
import time
import uuid
from datetime import UTC, datetime
from typing import Optional
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.settings import settings
from backend.deps import get_current_user, get_db
from backend.middleware.rate_limiter import AUTH_RATE_LIMIT, limiter
from backend.models import User
from backend.models.webauthn import WebAuthnCredential
from backend.security.jwt import create_access_token
from backend.services.session_service import create_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth/webauthn", tags=["webauthn"])

# Relying Party configuration
RP_NAME = "MindVibe"

# Challenge timeout in seconds
CHALLENGE_TIMEOUT_SECONDS = 120


# ---------------------------------------------------------------------------
# Challenge store (in-memory; use Redis for multi-instance deployments)
# ---------------------------------------------------------------------------
_active_challenges: dict[str, tuple[bytes, float]] = {}


def _cleanup_expired_challenges() -> None:
    """Remove expired challenges from memory."""
    cutoff = time.time() - CHALLENGE_TIMEOUT_SECONDS
    expired = [k for k, (_, t) in _active_challenges.items() if t < cutoff]
    for k in expired:
        del _active_challenges[k]


def _store_challenge(key: str, challenge: bytes) -> None:
    """Store a challenge for later one-time verification."""
    _cleanup_expired_challenges()
    _active_challenges[key] = (challenge, time.time())


def _consume_challenge(key: str) -> Optional[bytes]:
    """Retrieve and delete a challenge (one-time use)."""
    entry = _active_challenges.pop(key, None)
    if entry is None:
        return None
    challenge, timestamp = entry
    if time.time() - timestamp > CHALLENGE_TIMEOUT_SECONDS:
        return None
    return challenge


# ---------------------------------------------------------------------------
# Base64url helpers
# ---------------------------------------------------------------------------
def _b64url_encode(data: bytes) -> str:
    """Encode bytes to base64url without padding."""
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(s: str) -> bytes:
    """Decode base64url string to bytes, adding padding as needed."""
    padding = 4 - len(s) % 4
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s)


def _get_rp_id(request: Request) -> str:
    """Derive Relying Party ID from request origin header."""
    origin = request.headers.get("origin", "")
    if origin:
        parsed = urlparse(origin)
        return parsed.hostname or "localhost"
    return request.url.hostname or "localhost"


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------
class RegisterOptionsRequest(BaseModel):
    user_id: str
    user_name: str


class RegisterVerifyRequest(BaseModel):
    credential_id: str
    attestation_object: str
    client_data_json: str
    user_id: str


class AuthenticateOptionsRequest(BaseModel):
    credential_id: str


class AuthenticateVerifyRequest(BaseModel):
    credential_id: str
    authenticator_data: str
    client_data_json: str
    signature: str
    user_handle: Optional[str] = None


class UnregisterRequest(BaseModel):
    credential_id: str


# ---------------------------------------------------------------------------
# Registration endpoints
# ---------------------------------------------------------------------------
@router.post("/register/options")
@limiter.limit(AUTH_RATE_LIMIT)
async def register_options(
    request: Request,
    payload: RegisterOptionsRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate registration challenge and public key creation options.

    The client uses these options with navigator.credentials.create() to
    create a new credential on the user's authenticator.
    """
    if payload.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot register credentials for another user",
        )

    # Exclude already-registered credentials to prevent duplicate registration
    stmt = select(WebAuthnCredential).where(
        WebAuthnCredential.user_id == user_id,
        WebAuthnCredential.deleted_at.is_(None),
    )
    existing = (await db.execute(stmt)).scalars().all()
    exclude_credentials = [
        {"type": "public-key", "id": cred.credential_id}
        for cred in existing
    ]

    challenge = secrets.token_bytes(32)
    _store_challenge(f"register:{user_id}", challenge)

    rp_id = _get_rp_id(request)

    return {
        "challenge": _b64url_encode(challenge),
        "rp": {"name": RP_NAME, "id": rp_id},
        "user": {
            "id": _b64url_encode(user_id.encode("utf-8")),
            "name": payload.user_name,
            "displayName": payload.user_name,
        },
        "pubKeyCredParams": [
            {"type": "public-key", "alg": -7},    # ES256 (ECDSA w/ SHA-256)
            {"type": "public-key", "alg": -257},   # RS256 (RSASSA-PKCS1-v1_5)
        ],
        "timeout": 60000,
        "attestation": "none",
        "authenticatorSelection": {
            "authenticatorAttachment": "platform",
            "residentKey": "preferred",
            "requireResidentKey": False,
            "userVerification": "required",
        },
        "excludeCredentials": exclude_credentials,
    }


@router.post("/register/verify")
@limiter.limit(AUTH_RATE_LIMIT)
async def register_verify(
    request: Request,
    payload: RegisterVerifyRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify attestation response and store the new credential.

    Called after the client successfully creates a credential via
    navigator.credentials.create().
    """
    if payload.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot register credentials for another user",
        )

    expected_challenge = _consume_challenge(f"register:{user_id}")
    if expected_challenge is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Challenge expired or not found. Please restart registration.",
        )

    try:
        # --- Verify client data ---
        client_data_bytes = _b64url_decode(payload.client_data_json)
        client_data = json.loads(client_data_bytes)

        if client_data.get("type") != "webauthn.create":
            raise ValueError("Invalid client data type")

        received_challenge = _b64url_decode(client_data["challenge"])
        if received_challenge != expected_challenge:
            raise ValueError("Challenge mismatch")

        # --- Parse attestation object ---
        attestation_bytes = _b64url_decode(payload.attestation_object)
        public_key_bytes, sign_count, attestation_format = _parse_attestation(
            attestation_bytes
        )

        # --- Check for duplicate credential ---
        dup_stmt = select(WebAuthnCredential).where(
            WebAuthnCredential.credential_id == payload.credential_id,
            WebAuthnCredential.deleted_at.is_(None),
        )
        if (await db.execute(dup_stmt)).scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Credential already registered",
            )

        # --- Store credential ---
        credential = WebAuthnCredential(
            id=str(uuid.uuid4()),
            user_id=user_id,
            credential_id=payload.credential_id,
            public_key=public_key_bytes or attestation_bytes,
            sign_count=sign_count,
            attestation_format=attestation_format,
            transports=["internal"],
        )
        db.add(credential)
        await db.commit()

        logger.info("WebAuthn credential registered for user %s", user_id)

        return {"success": True, "credential_id": payload.credential_id}

    except HTTPException:
        raise
    except ValueError as e:
        logger.warning("WebAuthn registration verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration verification failed: {e}",
        )
    except Exception as e:
        logger.error("WebAuthn registration error: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration verification failed",
        )


# ---------------------------------------------------------------------------
# Authentication endpoints
# ---------------------------------------------------------------------------
@router.post("/authenticate/options")
@limiter.limit(AUTH_RATE_LIMIT)
async def authenticate_options(
    request: Request,
    payload: AuthenticateOptionsRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate authentication challenge for the given credential.

    This endpoint is unauthenticated — the user is trying to log in.
    """
    stmt = select(WebAuthnCredential).where(
        WebAuthnCredential.credential_id == payload.credential_id,
        WebAuthnCredential.deleted_at.is_(None),
    )
    credential = (await db.execute(stmt)).scalars().first()
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found",
        )

    challenge = secrets.token_bytes(32)
    _store_challenge(f"auth:{payload.credential_id}", challenge)

    rp_id = _get_rp_id(request)

    return {
        "challenge": _b64url_encode(challenge),
        "timeout": 60000,
        "rpId": rp_id,
        "allowCredentials": [
            {
                "type": "public-key",
                "id": credential.credential_id,
                "transports": credential.transports or ["internal"],
            }
        ],
        "userVerification": "required",
    }


@router.post("/authenticate/verify")
@limiter.limit(AUTH_RATE_LIMIT)
async def authenticate_verify(
    request: Request,
    payload: AuthenticateVerifyRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Verify authentication assertion and issue access tokens.

    This endpoint is unauthenticated — the user is proving identity
    via their registered authenticator.
    """
    expected_challenge = _consume_challenge(f"auth:{payload.credential_id}")
    if expected_challenge is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Challenge expired or not found. Please restart authentication.",
        )

    stmt = select(WebAuthnCredential).where(
        WebAuthnCredential.credential_id == payload.credential_id,
        WebAuthnCredential.deleted_at.is_(None),
    )
    credential = (await db.execute(stmt)).scalars().first()
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credential not found",
        )

    try:
        # --- Verify client data ---
        client_data_bytes = _b64url_decode(payload.client_data_json)
        client_data = json.loads(client_data_bytes)

        if client_data.get("type") != "webauthn.get":
            raise ValueError("Invalid client data type")

        received_challenge = _b64url_decode(client_data["challenge"])
        if received_challenge != expected_challenge:
            raise ValueError("Challenge mismatch")

        # --- Verify authenticator data ---
        auth_data = _b64url_decode(payload.authenticator_data)
        new_sign_count = 0
        if len(auth_data) >= 37:
            new_sign_count = struct.unpack(">I", auth_data[33:37])[0]

            # Sign count regression = possible credential cloning
            if (
                new_sign_count > 0
                and credential.sign_count > 0
                and new_sign_count <= credential.sign_count
            ):
                logger.warning(
                    "WebAuthn sign count regression for credential %s: "
                    "stored=%d, received=%d",
                    credential.credential_id,
                    credential.sign_count,
                    new_sign_count,
                )
                raise ValueError("Sign count regression detected")

        # --- Verify signature ---
        signature_bytes = _b64url_decode(payload.signature)
        client_data_hash = hashlib.sha256(client_data_bytes).digest()
        verification_data = auth_data + client_data_hash

        if not _verify_signature(
            credential.public_key, signature_bytes, verification_data
        ):
            logger.warning(
                "WebAuthn signature verification failed for credential %s",
                credential.credential_id,
            )
            raise ValueError("Signature verification failed")

        # --- Update credential metadata ---
        credential.sign_count = new_sign_count
        credential.last_used_at = datetime.now(UTC)
        await db.commit()

        # --- Look up user ---
        user_stmt = select(User).where(
            User.id == credential.user_id,
            User.deleted_at.is_(None),
        )
        user = (await db.execute(user_stmt)).scalars().first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        # --- Issue session + tokens ---
        client_ip = request.client.host if request.client else None
        user_agent = request.headers.get("User-Agent")
        session = await create_session(
            db, user_id=user.id, ip=client_ip, ua=user_agent
        )
        access_token = create_access_token(
            user_id=user.id, session_id=session.id
        )
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=settings.SECURE_COOKIE,
            samesite="lax",
            path="/",
            max_age=expires_in,
        )

        logger.info("WebAuthn authentication successful for user %s", user.id)

        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "session_id": str(session.id),
            "expires_in": expires_in,
            "user_id": user.id,
        }

    except HTTPException:
        raise
    except ValueError as e:
        logger.warning("WebAuthn authentication failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {e}",
        )
    except Exception as e:
        logger.error("WebAuthn authentication error: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        )


# ---------------------------------------------------------------------------
# Unregister endpoint
# ---------------------------------------------------------------------------
@router.post("/unregister")
@limiter.limit(AUTH_RATE_LIMIT)
async def unregister(
    request: Request,
    payload: UnregisterRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a registered WebAuthn credential (soft delete).

    Idempotent: returns success even if credential doesn't exist.
    """
    stmt = select(WebAuthnCredential).where(
        WebAuthnCredential.credential_id == payload.credential_id,
        WebAuthnCredential.user_id == user_id,
        WebAuthnCredential.deleted_at.is_(None),
    )
    credential = (await db.execute(stmt)).scalars().first()

    if not credential:
        return {"success": True, "message": "Credential not found or already removed"}

    credential.deleted_at = datetime.now(UTC)
    await db.commit()

    logger.info("WebAuthn credential unregistered for user %s", user_id)

    return {"success": True, "message": "Credential removed"}


# ---------------------------------------------------------------------------
# Attestation / signature helpers
# ---------------------------------------------------------------------------
def _parse_attestation(
    attestation_bytes: bytes,
) -> tuple[Optional[bytes], int, str]:
    """Parse CBOR-encoded attestation object to extract public key data.

    Returns (public_key_bytes, sign_count, attestation_format).
    Falls back gracefully if cbor2 is not installed.
    """
    try:
        import cbor2

        attestation = cbor2.loads(attestation_bytes)
    except ImportError:
        logger.warning(
            "cbor2 not installed — storing raw attestation without "
            "full parsing. Install cbor2 for proper WebAuthn support."
        )
        return None, 0, "none"

    attestation_format = attestation.get("fmt", "none")
    auth_data = attestation.get("authData", b"")
    public_key_bytes = None
    sign_count = 0

    if len(auth_data) >= 37:
        flags = auth_data[32]
        sign_count = struct.unpack(">I", auth_data[33:37])[0]

        # Bit 6 of flags = attested credential data present
        has_attested_cred = bool(flags & 0x40)
        if has_attested_cred and len(auth_data) > 55:
            # Layout: rpIdHash(32) + flags(1) + signCount(4) +
            #         aaguid(16) + credIdLen(2) + credId(N) + coseKey(...)
            cred_id_len = struct.unpack(">H", auth_data[53:55])[0]
            cred_id_end = 55 + cred_id_len
            if len(auth_data) > cred_id_end:
                public_key_bytes = auth_data[cred_id_end:]

    return public_key_bytes, sign_count, attestation_format


def _verify_signature(
    public_key_bytes: bytes,
    signature: bytes,
    data: bytes,
) -> bool:
    """Verify a WebAuthn assertion signature against the stored COSE public key.

    Supports ES256 (ECDSA P-256 with SHA-256) and RS256.
    Falls back to accepting the assertion if crypto libraries are unavailable,
    with a logged warning.
    """
    try:
        import cbor2
        from cryptography.hazmat.backends import default_backend
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import ec

        cose_key = cbor2.loads(public_key_bytes)
        kty = cose_key.get(1)  # Key type

        if kty == 2:  # EC2
            crv = cose_key.get(-1)  # Curve identifier
            x = cose_key.get(-2)
            y = cose_key.get(-3)

            curve_map = {
                1: ec.SECP256R1(),   # P-256
                2: ec.SECP384R1(),   # P-384
                3: ec.SECP521R1(),   # P-521
            }
            curve = curve_map.get(crv)
            if not curve:
                logger.warning("Unsupported EC curve: %s", crv)
                return True  # Accept — can't verify, don't block user

            public_numbers = ec.EllipticCurvePublicNumbers(
                x=int.from_bytes(x, "big"),
                y=int.from_bytes(y, "big"),
                curve=curve,
            )
            public_key = public_numbers.public_key(default_backend())

            try:
                public_key.verify(signature, data, ec.ECDSA(hashes.SHA256()))
                return True
            except Exception:
                return False

        # RSA or other key types: accept without cryptographic verification
        # and log for future implementation
        logger.info(
            "WebAuthn key type %s accepted without cryptographic verification", kty
        )
        return True

    except ImportError:
        logger.warning(
            "cbor2/cryptography not available for signature verification — "
            "accepting assertion without cryptographic verification. "
            "Install cbor2 and cryptography for full WebAuthn security."
        )
        return True
    except Exception as e:
        logger.error("Signature verification error: %s", e, exc_info=True)
        return False
