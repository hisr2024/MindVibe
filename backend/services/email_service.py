"""Email service for transactional emails (verification, password reset).

Supports multiple providers via a clean abstraction:
- Resend (production — sends via Resend HTTP API, recommended)
- SMTP (production — sends real emails via any SMTP provider)
- Console (development — prints to logs instead of sending)

The provider is selected via the EMAIL_PROVIDER env var.
When EMAIL_PROVIDER is not configured for real delivery, callers should
check can_send_email() to decide whether email-dependent flows (like
mandatory verification) should be enforced.
"""

import logging
import os
import smtplib
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

# Configuration from environment
EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "console")  # console | resend | smtp
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
SMTP_HOST = os.getenv("SMTP_HOST", "localhost")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
EMAIL_FROM_ADDRESS = os.getenv("EMAIL_FROM_ADDRESS", "noreply@kiaanverse.com")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "Kiaanverse")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Retry configuration for transient SMTP failures (network blips, greylisting)
_SMTP_MAX_RETRIES = int(os.getenv("SMTP_MAX_RETRIES", "3"))
_SMTP_RETRY_DELAY = float(os.getenv("SMTP_RETRY_DELAY", "2"))  # seconds


def can_send_email() -> bool:
    """Return True if the email provider is configured to actually deliver emails.

    When this returns False, callers should not enforce email-dependent flows
    (e.g. mandatory email verification before login) because the user will
    never receive the email.
    """
    if EMAIL_PROVIDER == "resend":
        return bool(RESEND_API_KEY)
    if EMAIL_PROVIDER == "smtp":
        return bool(SMTP_HOST and SMTP_HOST != "localhost")
    return False


def validate_email_config() -> list[str]:
    """Validate email configuration and return a list of warnings.

    Called during startup to surface misconfiguration early instead of
    failing silently when the first email is sent.
    """
    warnings: list[str] = []
    _is_prod = os.getenv("ENVIRONMENT", "development").lower() == "production"

    _verification_required = os.getenv(
        "REQUIRE_EMAIL_VERIFICATION", "true"
    ).lower() in ("true", "1")

    if EMAIL_PROVIDER == "console":
        msg = (
            "EMAIL_PROVIDER=console — emails will be logged, NOT sent. "
            "Users will NOT receive verification or password reset emails."
        )
        if _is_prod and _verification_required:
            # Truly critical: verification required but emails can't be sent
            warnings.append(f"CRITICAL: {msg} Set EMAIL_PROVIDER=smtp for production.")
        elif _is_prod:
            # Important but not critical: verification is disabled, users auto-verified
            warnings.append(
                f"WARNING: {msg} "
                "Email verification is disabled, so users can still sign up. "
                "Set EMAIL_PROVIDER=smtp when ready to enable email delivery."
            )
        else:
            warnings.append(msg)
    elif EMAIL_PROVIDER == "resend":
        if not RESEND_API_KEY:
            warnings.append(
                "EMAIL_PROVIDER=resend but RESEND_API_KEY is not set. "
                "Get your API key from https://resend.com/api-keys"
            )
        if not EMAIL_FROM_ADDRESS or EMAIL_FROM_ADDRESS == "noreply@kiaanverse.com":
            warnings.append(
                "EMAIL_FROM_ADDRESS should use a domain verified in your Resend dashboard. "
                "See https://resend.com/domains"
            )
    elif EMAIL_PROVIDER == "smtp":
        if not SMTP_HOST or SMTP_HOST == "localhost":
            warnings.append(
                "SMTP_HOST is not configured (or set to localhost). "
                "Emails will fail in production."
            )
        if not SMTP_USER or not SMTP_PASSWORD:
            warnings.append(
                "SMTP_USER or SMTP_PASSWORD is empty. "
                "Most SMTP providers require authentication."
            )
    else:
        warnings.append(f"Unknown EMAIL_PROVIDER '{EMAIL_PROVIDER}'. Use 'resend', 'smtp', or 'console'.")

    return warnings


async def send_email(to: str, subject: str, html_body: str, text_body: str | None = None) -> bool:
    """Send an email using the configured provider.

    Returns True if sent successfully, False otherwise.
    Never raises — failures are logged but don't break the caller.
    """
    if EMAIL_PROVIDER == "console":
        return _send_console(to, subject, html_body, text_body)
    elif EMAIL_PROVIDER == "resend":
        return await _send_resend(to, subject, html_body, text_body)
    elif EMAIL_PROVIDER == "smtp":
        return _send_smtp(to, subject, html_body, text_body)
    else:
        logger.error("Unknown EMAIL_PROVIDER: %s — email to %s not sent", EMAIL_PROVIDER, to)
        return False


def _send_console(to: str, subject: str, html_body: str, text_body: str | None) -> bool:
    """Development provider: logs the email instead of sending it."""
    logger.info(
        "EMAIL [console mode — NOT delivered] To: %s | Subject: %s | Body preview: %s",
        to,
        subject,
        (text_body or html_body)[:200],
    )
    # Return False so callers know the email was NOT actually delivered.
    # This prevents misleading "verification email sent" responses.
    return False


async def _send_resend(to: str, subject: str, html_body: str, text_body: str | None) -> bool:
    """Production provider: sends via Resend HTTP API with retry on transient failures."""
    import asyncio

    import httpx

    payload: dict = {
        "from": f"{EMAIL_FROM_NAME} <{EMAIL_FROM_ADDRESS}>",
        "to": [to],
        "subject": subject,
        "html": html_body,
    }
    if text_body:
        payload["text"] = text_body

    last_error: Exception | None = None
    for attempt in range(1, _SMTP_MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {RESEND_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                if response.status_code == 200:
                    data = response.json()
                    logger.info("Email sent via Resend to %s: %s (id=%s)", to, subject, data.get("id"))
                    return True
                elif response.status_code == 429:
                    last_error = Exception(f"Resend rate limit: {response.text}")
                    logger.warning(
                        "Resend rate limited sending to %s (attempt %d/%d)",
                        to, attempt, _SMTP_MAX_RETRIES,
                    )
                elif 500 <= response.status_code < 600:
                    last_error = Exception(f"Resend server error: {response.status_code} {response.text}")
                    logger.warning(
                        "Resend server error sending to %s (attempt %d/%d): %d %s",
                        to, attempt, _SMTP_MAX_RETRIES, response.status_code, response.text,
                    )
                else:
                    # 4xx client error (bad request, auth failure) — don't retry
                    logger.error(
                        "Resend client error sending to %s: %d %s",
                        to, response.status_code, response.text,
                    )
                    return False
        except httpx.TimeoutException as e:
            last_error = e
            logger.warning(
                "Resend timeout sending to %s (attempt %d/%d): %s",
                to, attempt, _SMTP_MAX_RETRIES, e,
            )
        except httpx.HTTPError as e:
            last_error = e
            logger.warning(
                "Resend HTTP error sending to %s (attempt %d/%d): %s",
                to, attempt, _SMTP_MAX_RETRIES, e,
            )
        except Exception as e:
            logger.error("Unexpected error sending email via Resend to %s: %s", to, e)
            return False

        if attempt < _SMTP_MAX_RETRIES:
            wait = _SMTP_RETRY_DELAY * (2 ** (attempt - 1))
            await asyncio.sleep(wait)

    logger.error(
        "Failed to send email via Resend to %s after %d attempts. Last error: %s",
        to, _SMTP_MAX_RETRIES, last_error,
    )
    return False


def _send_smtp(to: str, subject: str, html_body: str, text_body: str | None) -> bool:
    """Production provider: sends via SMTP with retry on transient failures."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{EMAIL_FROM_NAME} <{EMAIL_FROM_ADDRESS}>"
    msg["To"] = to

    if text_body:
        msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    last_error: Exception | None = None
    for attempt in range(1, _SMTP_MAX_RETRIES + 1):
        try:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
                if SMTP_USE_TLS:
                    server.starttls()
                if SMTP_USER and SMTP_PASSWORD:
                    server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(EMAIL_FROM_ADDRESS, to, msg.as_string())

            logger.info("Email sent to %s: %s", to, subject)
            return True
        except smtplib.SMTPServerDisconnected as e:
            last_error = e
            logger.warning(
                "SMTP disconnected sending to %s (attempt %d/%d): %s",
                to, attempt, _SMTP_MAX_RETRIES, e,
            )
        except smtplib.SMTPResponseException as e:
            last_error = e
            # Don't retry on permanent failures (4xx = transient, 5xx = permanent)
            if 500 <= e.smtp_code < 600:
                logger.error("SMTP permanent error sending to %s: %d %s", to, e.smtp_code, e.smtp_error)
                return False
            logger.warning(
                "SMTP transient error sending to %s (attempt %d/%d): %d %s",
                to, attempt, _SMTP_MAX_RETRIES, e.smtp_code, e.smtp_error,
            )
        except (OSError, smtplib.SMTPException) as e:
            last_error = e
            logger.warning(
                "SMTP error sending to %s (attempt %d/%d): %s",
                to, attempt, _SMTP_MAX_RETRIES, e,
            )
        except Exception as e:
            logger.error("Unexpected error sending email to %s: %s", to, e)
            return False

        if attempt < _SMTP_MAX_RETRIES:
            wait = _SMTP_RETRY_DELAY * (2 ** (attempt - 1))  # exponential backoff
            time.sleep(wait)

    logger.error(
        "Failed to send email to %s after %d attempts. Last error: %s",
        to, _SMTP_MAX_RETRIES, last_error,
    )
    return False


async def send_password_reset_email(to: str, reset_token: str) -> bool:
    """Send a password reset email with the reset link.

    The link points to the frontend reset page which will call the
    POST /api/auth/reset-password endpoint with the token.
    """
    reset_url = f"{FRONTEND_URL}/m/auth/reset-password?token={reset_token}"

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


async def send_email_verification(to: str, verification_token: str) -> bool:
    """Send an email verification link after signup.

    The link points to the frontend verification page which will call
    POST /api/auth/verify-email with the token.
    """
    verify_url = f"{FRONTEND_URL}/m/auth/verify?token={verification_token}"

    subject = "Verify your MindVibe email address"

    html_body = f"""
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #0b0b0f; color: #f5e6d3; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #ffb347; font-size: 28px; margin: 0;">MindVibe</h1>
            <p style="color: #f5e6d3aa; font-size: 14px; margin-top: 8px;">Your spiritual wellness companion</p>
        </div>

        <h2 style="color: #f5e6d3; font-size: 20px;">Verify Your Email Address</h2>

        <p style="line-height: 1.7; color: #f5e6d3cc;">
            Welcome to MindVibe! Please verify your email address by clicking the
            button below. This link expires in <strong>24 hours</strong>.
        </p>

        <div style="text-align: center; margin: 32px 0;">
            <a href="{verify_url}"
               style="background: linear-gradient(135deg, #ff9933, #ffb347);
                      color: #0b0b0f;
                      padding: 14px 32px;
                      border-radius: 12px;
                      text-decoration: none;
                      font-weight: 600;
                      font-size: 16px;
                      display: inline-block;">
                Verify Email
            </a>
        </div>

        <p style="line-height: 1.7; color: #f5e6d3aa; font-size: 13px;">
            If you didn't create a MindVibe account, you can safely ignore this email.
        </p>

        <hr style="border: none; border-top: 1px solid #ffffff15; margin: 32px 0;" />

        <p style="color: #f5e6d3aa; font-size: 12px; text-align: center;">
            If the button doesn't work, copy this link into your browser:<br/>
            <a href="{verify_url}" style="color: #ffb347; word-break: break-all;">{verify_url}</a>
        </p>
    </div>
    """

    text_body = (
        f"MindVibe - Email Verification\n\n"
        f"Welcome to MindVibe! Please verify your email address.\n"
        f"Visit this link (expires in 24 hours):\n\n"
        f"{verify_url}\n\n"
        f"If you didn't create a MindVibe account, ignore this email."
    )

    return await send_email(to, subject, html_body, text_body)


