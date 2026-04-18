"""Privacy model: unified GDPR request audit trail.

A single ``privacy_requests`` table captures the full lifecycle of both
**data export** (Art. 20) and **account deletion** (Art. 17) flows.
Keeping the two in one table — distinguished by ``request_type`` —
simplifies the privacy dashboard, the supervisory-authority audit
report, and the cron jobs that process scheduled work.

Status transitions:

* ``pending``            → initial write (both types)
* ``processing``         → export generation started
* ``ready``              → export uploaded, signed URL available
* ``pending_deletion``   → deletion scheduled for grace-period end
* ``cancelled``          → user cancelled deletion in the grace period
* ``completed``          → hard-deletion finished (export: URL used)
* ``failed``             → generation / deletion failed
* ``expired``            → signed URL TTL elapsed

KIAAN Impact: ✅ POSITIVE — trust infrastructure; no KIAAN coupling.
"""

from __future__ import annotations

import datetime
import uuid

from sqlalchemy import TIMESTAMP, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base


class PrivacyRequest(Base):
    """Unified audit trail for GDPR export + deletion requests."""

    __tablename__ = "privacy_requests"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(255),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    # "export" or "delete"
    request_type: Mapped[str] = mapped_column(String(16), index=True)
    # See module docstring for allowed values.
    status: Mapped[str] = mapped_column(
        String(32), default="pending", index=True
    )
    # SHA-256 truncated hash of the caller IP (non-reversible audit).
    ip_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # Populated when export finishes.
    download_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    url_expires_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    # Populated when deletion is initiated.
    scheduled_deletion_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()
    )
