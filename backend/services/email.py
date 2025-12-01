"""Simple transactional email sender with SMTP transport."""

from __future__ import annotations

from datetime import UTC, datetime
from email.message import EmailMessage
import logging
from typing import Any

import aiosmtplib
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.settings import settings
from backend.models import EmailNotification

logger = logging.getLogger("mindvibe.email")


class EmailClient:
    """Send transactional emails and persist send attempts."""

    def __init__(self) -> None:
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME
        self.password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.use_tls = settings.SMTP_USE_TLS

    @property
    def enabled(self) -> bool:
        return bool(self.host and self.from_email)

    def _build_message(self, *, to: str, subject: str, body: str) -> EmailMessage:
        message = EmailMessage()
        message["From"] = self.from_email
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)
        return message

    async def send_email(
        self,
        *,
        to: str,
        subject: str,
        body: str,
        template: str = "generic",
        metadata: dict[str, Any] | None = None,
        db: AsyncSession | None = None,
    ) -> dict[str, Any]:
        """Send an email with optional persistence of the attempt."""

        notification: EmailNotification | None = None
        if db:
            notification = EmailNotification(
                recipient=to,
                template=template,
                subject=subject,
                payload=metadata or {},
                status="queued",
            )
            db.add(notification)
            await db.commit()
            await db.refresh(notification)

        if not self.enabled:
            if notification and db:
                notification.status = "disabled"
                await db.commit()
            logger.warning("email_disabled", extra={"to": to, "template": template})
            return {"status": "disabled", "notification_id": getattr(notification, "id", None)}

        message = self._build_message(to=to, subject=subject, body=body)
        try:
            await aiosmtplib.send(
                message,
                hostname=self.host,
                port=self.port,
                username=self.username or None,
                password=self.password or None,
                start_tls=self.use_tls,
            )
            if notification and db:
                notification.status = "sent"
                notification.sent_at = datetime.now(UTC)
                await db.commit()
            logger.info("email_sent", extra={"to": to, "template": template})
            return {"status": "sent", "notification_id": getattr(notification, "id", None)}
        except Exception as exc:  # pragma: no cover - transport failures
            if notification and db:
                notification.status = "failed"
                notification.error = str(exc)
                await db.commit()
            logger.exception("email_failed", extra={"to": to, "error": str(exc)})
            return {
                "status": "failed",
                "error": str(exc),
                "notification_id": getattr(notification, "id", None),
            }

    def verification_link(self, token: str) -> str:
        base = settings.FRONTEND_BASE_URL.rstrip("/")
        return f"{base}/verify-email?token={token}"

    def magic_link(self, token: str) -> str:
        base = settings.FRONTEND_BASE_URL.rstrip("/")
        return f"{base}/magic-login?token={token}"

    async def send_verification_email(self, *, to: str, token: str, db: AsyncSession | None = None) -> dict[str, Any]:
        subject = "Verify your MindVibe email"
        link = self.verification_link(token)
        body = (
            "Welcome to MindVibe!\n\n"
            "Tap the link below to confirm your email and activate your secure account.\n\n"
            f"Verification link: {link}\n\n"
            "If you did not request this, you can safely ignore it."
        )
        return await self.send_email(
            to=to,
            subject=subject,
            body=body,
            template="verify_email",
            metadata={"token": token, "link": link},
            db=db,
        )

    async def send_magic_link(self, *, to: str, token: str, expires_at: datetime, db: AsyncSession | None = None) -> dict[str, Any]:
        subject = "Your secure MindVibe login link"
        link = self.magic_link(token)
        body = (
            "Here is your one-time login link. It expires soon, so use it promptly.\n\n"
            f"Login link: {link}\n"
            f"Expires at: {expires_at.isoformat()}\n\n"
            "If you did not request this link, please ignore this email."
        )
        return await self.send_email(
            to=to,
            subject=subject,
            body=body,
            template="magic_link",
            metadata={"token": token, "link": link, "expires_at": expires_at.isoformat()},
            db=db,
        )

email_client = EmailClient()
