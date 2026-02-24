"""WebAuthn credential model for biometric authentication.

Stores FIDO2/WebAuthn public key credentials that allow users to authenticate
using biometrics (fingerprint, Face ID) or device PIN.

Security: Credential public keys are stored server-side. No biometric data
ever leaves the user's device — only cryptographic proofs are exchanged.
"""

from __future__ import annotations

import datetime

from sqlalchemy import (
    JSON,
    Integer,
    LargeBinary,
    String,
    TIMESTAMP,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, SoftDeleteMixin


class WebAuthnCredential(SoftDeleteMixin, Base):
    """A registered WebAuthn credential (public key) for a user.

    Each row represents one authenticator (e.g., one device's fingerprint sensor).
    A user may have multiple credentials across different devices.
    """

    __tablename__ = "webauthn_credentials"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    credential_id: Mapped[str] = mapped_column(
        Text, unique=True, index=True
    )
    public_key: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    sign_count: Mapped[int] = mapped_column(Integer, default=0)
    attestation_format: Mapped[str] = mapped_column(
        String(32), default="none"
    )
    transports: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    last_used_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
