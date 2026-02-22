"""Email service for transactional emails (password reset, etc).

Supports multiple providers via a clean abstraction:
- SMTP (default, works with any email provider)
- Console (development — prints to logs instead of sending)

The provider is selected via the EMAIL_PROVIDER env var.
"""

import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

# Configuration from environment
EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "console")  # console | smtp
SMTP_HOST = os.getenv("SMTP_HOST", "localhost")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
EMAIL_FROM_ADDRESS = os.getenv("EMAIL_FROM_ADDRESS", "noreply@mindvibe.app")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "MindVibe")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


async def send_email(to: str, subject: str, html_body: str, text_body: str | None = None) -> bool:
    """Send an email using the configured provider.

    Returns True if sent successfully, False otherwise.
    Never raises — failures are logged but don't break the caller.
    """
    if EMAIL_PROVIDER == "console":
        return _send_console(to, subject, html_body, text_body)
    elif EMAIL_PROVIDER == "smtp":
        return _send_smtp(to, subject, html_body, text_body)
    else:
        logger.error("Unknown EMAIL_PROVIDER: %s", EMAIL_PROVIDER)
        return False


def _send_console(to: str, subject: str, html_body: str, text_body: str | None) -> bool:
    """Development provider: logs the email instead of sending it."""
    logger.info(
        "EMAIL [console mode] To: %s | Subject: %s | Body preview: %s",
        to,
        subject,
        (text_body or html_body)[:200],
    )
    return True


def _send_smtp(to: str, subject: str, html_body: str, text_body: str | None) -> bool:
    """Production provider: sends via SMTP."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{EMAIL_FROM_NAME} <{EMAIL_FROM_ADDRESS}>"
        msg["To"] = to

        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            if SMTP_USE_TLS:
                server.starttls()
            if SMTP_USER and SMTP_PASSWORD:
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(EMAIL_FROM_ADDRESS, to, msg.as_string())

        logger.info("Email sent to %s: %s", to, subject)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, e)
        return False


async def send_password_reset_email(to: str, reset_token: str) -> bool:
    """Send a password reset email with the reset link.

    The link points to the frontend reset page which will call the
    POST /api/auth/reset-password endpoint with the token.
    """
    reset_url = f"{FRONTEND_URL}/auth/reset-password?token={reset_token}"

    subject = "Reset your MindVibe password"

    html_body = f"""
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #0b0b0f; color: #f5e6d3; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #ffb347; font-size: 28px; margin: 0;">MindVibe</h1>
            <p style="color: #f5e6d3aa; font-size: 14px; margin-top: 8px;">Your spiritual wellness companion</p>
        </div>

        <h2 style="color: #f5e6d3; font-size: 20px;">Password Reset Request</h2>

        <p style="line-height: 1.7; color: #f5e6d3cc;">
            We received a request to reset your password. Click the button below
            to choose a new password. This link expires in <strong>1 hour</strong>.
        </p>

        <div style="text-align: center; margin: 32px 0;">
            <a href="{reset_url}"
               style="background: linear-gradient(135deg, #ff9933, #ffb347);
                      color: #0b0b0f;
                      padding: 14px 32px;
                      border-radius: 12px;
                      text-decoration: none;
                      font-weight: 600;
                      font-size: 16px;
                      display: inline-block;">
                Reset Password
            </a>
        </div>

        <p style="line-height: 1.7; color: #f5e6d3aa; font-size: 13px;">
            If you didn't request this, you can safely ignore this email.
            Your password will remain unchanged.
        </p>

        <hr style="border: none; border-top: 1px solid #ffffff15; margin: 32px 0;" />

        <p style="color: #f5e6d3aa; font-size: 12px; text-align: center;">
            If the button doesn't work, copy this link into your browser:<br/>
            <a href="{reset_url}" style="color: #ffb347; word-break: break-all;">{reset_url}</a>
        </p>
    </div>
    """

    text_body = (
        f"MindVibe - Password Reset\n\n"
        f"We received a request to reset your password.\n"
        f"Visit this link to choose a new password (expires in 1 hour):\n\n"
        f"{reset_url}\n\n"
        f"If you didn't request this, ignore this email."
    )

    return await send_email(to, subject, html_body, text_body)
