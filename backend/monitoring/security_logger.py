"""Security Monitoring and Logging for MindVibe.

This module provides comprehensive security monitoring including:
- Real-time threat detection
- Anomaly detection for unusual patterns
- Security event logging
- Audit trail for all sensitive operations
"""

import json
import logging
import os
import time
from collections import defaultdict
from collections.abc import Callable
from datetime import UTC, datetime
from enum import Enum
from typing import Any


class SecurityEventType(str, Enum):
    """Types of security events."""

    # Authentication events
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILURE = "login_failure"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    PASSWORD_RESET_REQUEST = "password_reset_request"
    MFA_ENABLED = "mfa_enabled"
    MFA_DISABLED = "mfa_disabled"
    MFA_CHALLENGE_SUCCESS = "mfa_challenge_success"
    MFA_CHALLENGE_FAILURE = "mfa_challenge_failure"

    # Authorization events
    ACCESS_DENIED = "access_denied"
    PERMISSION_ESCALATION = "permission_escalation"
    ROLE_CHANGE = "role_change"

    # Threat detection
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    SQL_INJECTION_ATTEMPT = "sql_injection_attempt"
    XSS_ATTEMPT = "xss_attempt"
    CSRF_VIOLATION = "csrf_violation"
    SUSPICIOUS_IP = "suspicious_ip"
    BRUTE_FORCE_DETECTED = "brute_force_detected"
    ACCOUNT_LOCKOUT = "account_lockout"

    # Data events
    DATA_EXPORT = "data_export"
    DATA_DELETION = "data_deletion"
    SENSITIVE_DATA_ACCESS = "sensitive_data_access"

    # Session events
    SESSION_CREATED = "session_created"
    SESSION_EXPIRED = "session_expired"
    SESSION_INVALIDATED = "session_invalidated"
    TOKEN_REFRESH = "token_refresh"

    # System events
    CONFIG_CHANGE = "config_change"
    ADMIN_ACTION = "admin_action"


class SecuritySeverity(str, Enum):
    """Severity levels for security events."""

    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SecurityEvent:
    """Represents a security event."""

    def __init__(
        self,
        event_type: SecurityEventType,
        severity: SecuritySeverity,
        message: str,
        user_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        resource: str | None = None,
        metadata: dict[str, Any] | None = None,
    ):
        """Initialize security event.

        Args:
            event_type: Type of security event
            severity: Severity level
            message: Human-readable message
            user_id: Associated user ID (if any)
            ip_address: Client IP address
            user_agent: Client user agent
            resource: Affected resource
            metadata: Additional event data
        """
        self.event_type = event_type
        self.severity = severity
        self.message = message
        self.user_id = user_id
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.resource = resource
        self.metadata = metadata or {}
        self.timestamp = datetime.now(UTC)
        self.event_id = f"{int(time.time() * 1000)}-{os.urandom(4).hex()}"

    def to_dict(self) -> dict[str, Any]:
        """Convert event to dictionary for logging/storage."""
        return {
            "event_id": self.event_id,
            "event_type": self.event_type.value,
            "severity": self.severity.value,
            "message": self.message,
            "user_id": self.user_id,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "resource": self.resource,
            "metadata": self.metadata,
            "timestamp": self.timestamp.isoformat(),
        }

    def to_json(self) -> str:
        """Convert event to JSON string."""
        return json.dumps(self.to_dict())


class SecurityLogger:
    """Security event logger with threat detection.

    Provides centralized logging for all security-related events
    with pattern detection and alerting capabilities.
    """

    def __init__(
        self,
        log_file: str | None = None,
        alert_callback: Callable[[SecurityEvent], None] | None = None,
    ):
        """Initialize security logger.

        Args:
            log_file: Optional file path for security logs
            alert_callback: Optional callback for high-severity alerts
        """
        self._logger = logging.getLogger("security")
        self._logger.setLevel(logging.DEBUG)

        # Configure JSON formatter
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": %(message)s}'
        )

        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        self._logger.addHandler(console_handler)

        # File handler (if specified)
        if log_file:
            file_handler = logging.FileHandler(log_file)
            file_handler.setFormatter(formatter)
            self._logger.addHandler(file_handler)

        self._alert_callback = alert_callback

        # Anomaly detection state
        self._event_counts: dict[str, list[float]] = defaultdict(list)
        self._alert_thresholds = {
            SecurityEventType.LOGIN_FAILURE: (10, 300),  # 10 failures in 5 min
            SecurityEventType.RATE_LIMIT_EXCEEDED: (5, 60),  # 5 rate limits in 1 min
            SecurityEventType.SQL_INJECTION_ATTEMPT: (3, 300),  # 3 attempts in 5 min
            SecurityEventType.XSS_ATTEMPT: (3, 300),  # 3 attempts in 5 min
        }

    def log_event(self, event: SecurityEvent) -> None:
        """Log a security event.

        Args:
            event: The security event to log
        """
        event_dict = event.to_dict()

        # Log based on severity
        if event.severity == SecuritySeverity.CRITICAL:
            self._logger.critical(json.dumps(event_dict))
        elif event.severity == SecuritySeverity.HIGH:
            self._logger.error(json.dumps(event_dict))
        elif event.severity == SecuritySeverity.MEDIUM:
            self._logger.warning(json.dumps(event_dict))
        else:
            self._logger.info(json.dumps(event_dict))

        # Check for anomalies
        self._check_anomaly(event)

        # Trigger alert callback for high/critical events
        if event.severity in [
            SecuritySeverity.HIGH,
            SecuritySeverity.CRITICAL,
        ] and self._alert_callback:
            self._alert_callback(event)

    def _check_anomaly(self, event: SecurityEvent) -> None:
        """Check if event pattern indicates an anomaly."""
        if event.event_type not in self._alert_thresholds:
            return

        threshold_count, window_seconds = self._alert_thresholds[event.event_type]
        key = f"{event.event_type.value}:{event.ip_address or 'unknown'}"
        current_time = time.time()

        # Clean old events
        self._event_counts[key] = [
            ts for ts in self._event_counts[key] if ts > current_time - window_seconds
        ]

        # Add current event
        self._event_counts[key].append(current_time)

        # Check threshold
        if len(self._event_counts[key]) >= threshold_count:
            anomaly_event = SecurityEvent(
                event_type=SecurityEventType.BRUTE_FORCE_DETECTED,
                severity=SecuritySeverity.HIGH,
                message=f"Anomaly detected: {event.event_type.value} threshold exceeded",
                ip_address=event.ip_address,
                user_id=event.user_id,
                metadata={
                    "trigger_event": event.event_type.value,
                    "count": len(self._event_counts[key]),
                    "window_seconds": window_seconds,
                },
            )
            self._logger.critical(json.dumps(anomaly_event.to_dict()))

    # Convenience methods for common events
    def log_login_success(
        self,
        user_id: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        """Log successful login."""
        self.log_event(
            SecurityEvent(
                event_type=SecurityEventType.LOGIN_SUCCESS,
                severity=SecuritySeverity.INFO,
                message=f"User {user_id} logged in successfully",
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
            )
        )

    def log_login_failure(
        self,
        user_id: str | None,
        ip_address: str | None = None,
        reason: str = "Invalid credentials",
    ) -> None:
        """Log failed login attempt."""
        self.log_event(
            SecurityEvent(
                event_type=SecurityEventType.LOGIN_FAILURE,
                severity=SecuritySeverity.MEDIUM,
                message=f"Login failed for {user_id or 'unknown user'}: {reason}",
                user_id=user_id,
                ip_address=ip_address,
                metadata={"reason": reason},
            )
        )

    def log_access_denied(
        self,
        user_id: str | None,
        resource: str,
        ip_address: str | None = None,
    ) -> None:
        """Log access denied event."""
        self.log_event(
            SecurityEvent(
                event_type=SecurityEventType.ACCESS_DENIED,
                severity=SecuritySeverity.MEDIUM,
                message=f"Access denied to {resource}",
                user_id=user_id,
                ip_address=ip_address,
                resource=resource,
            )
        )

    def log_rate_limit(
        self,
        ip_address: str | None,
        endpoint: str,
    ) -> None:
        """Log rate limit exceeded event."""
        self.log_event(
            SecurityEvent(
                event_type=SecurityEventType.RATE_LIMIT_EXCEEDED,
                severity=SecuritySeverity.LOW,
                message=f"Rate limit exceeded for {endpoint}",
                ip_address=ip_address,
                resource=endpoint,
            )
        )

    def log_security_threat(
        self,
        threat_type: SecurityEventType,
        ip_address: str | None,
        details: str,
        user_id: str | None = None,
    ) -> None:
        """Log a security threat detection."""
        self.log_event(
            SecurityEvent(
                event_type=threat_type,
                severity=SecuritySeverity.HIGH,
                message=f"Security threat detected: {details}",
                user_id=user_id,
                ip_address=ip_address,
                metadata={"threat_details": details},
            )
        )

    def log_account_lockout(
        self,
        user_id: str,
        ip_address: str | None = None,
        duration_minutes: int = 30,
    ) -> None:
        """Log account lockout event."""
        self.log_event(
            SecurityEvent(
                event_type=SecurityEventType.ACCOUNT_LOCKOUT,
                severity=SecuritySeverity.HIGH,
                message=f"Account {user_id} locked out for {duration_minutes} minutes",
                user_id=user_id,
                ip_address=ip_address,
                metadata={"duration_minutes": duration_minutes},
            )
        )

    def log_data_export(
        self,
        user_id: str,
        data_types: list[str],
        ip_address: str | None = None,
    ) -> None:
        """Log data export request (GDPR)."""
        self.log_event(
            SecurityEvent(
                event_type=SecurityEventType.DATA_EXPORT,
                severity=SecuritySeverity.INFO,
                message=f"Data export requested for user {user_id}",
                user_id=user_id,
                ip_address=ip_address,
                metadata={"data_types": data_types},
            )
        )

    def log_data_deletion(
        self,
        user_id: str,
        data_types: list[str],
        ip_address: str | None = None,
    ) -> None:
        """Log data deletion request (GDPR)."""
        self.log_event(
            SecurityEvent(
                event_type=SecurityEventType.DATA_DELETION,
                severity=SecuritySeverity.MEDIUM,
                message=f"Data deletion requested for user {user_id}",
                user_id=user_id,
                ip_address=ip_address,
                metadata={"data_types": data_types},
            )
        )


class AuditTrail:
    """Audit trail for sensitive operations.

    Maintains an immutable log of all sensitive operations
    for compliance and forensics purposes.
    """

    def __init__(self, logger: SecurityLogger | None = None):
        """Initialize audit trail.

        Args:
            logger: Optional security logger instance
        """
        self._logger = logger or security_logger
        self._audit_log: list[dict[str, Any]] = []

    def record(
        self,
        action: str,
        user_id: str,
        resource_type: str,
        resource_id: str,
        changes: dict[str, Any] | None = None,
        ip_address: str | None = None,
    ) -> str:
        """Record an audit entry.

        Args:
            action: Action performed (e.g., "create", "update", "delete")
            user_id: User who performed the action
            resource_type: Type of resource affected
            resource_id: ID of the resource affected
            changes: Dictionary of changes made
            ip_address: Client IP address

        Returns:
            Audit entry ID
        """
        entry = {
            "audit_id": f"audit-{int(time.time() * 1000)}-{os.urandom(4).hex()}",
            "timestamp": datetime.now(UTC).isoformat(),
            "action": action,
            "user_id": user_id,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "changes": changes,
            "ip_address": ip_address,
        }

        self._audit_log.append(entry)

        # Also log to security logger
        self._logger.log_event(
            SecurityEvent(
                event_type=SecurityEventType.ADMIN_ACTION,
                severity=SecuritySeverity.INFO,
                message=f"Audit: {action} on {resource_type}/{resource_id}",
                user_id=user_id,
                ip_address=ip_address,
                resource=f"{resource_type}/{resource_id}",
                metadata={"changes": changes},
            )
        )

        return entry["audit_id"]

    def get_user_audit_trail(
        self, user_id: str, limit: int = 100
    ) -> list[dict[str, Any]]:
        """Get audit trail for a specific user.

        Args:
            user_id: User ID to filter by
            limit: Maximum number of entries to return

        Returns:
            List of audit entries
        """
        return [
            entry for entry in self._audit_log if entry["user_id"] == user_id
        ][:limit]

    def get_resource_audit_trail(
        self, resource_type: str, resource_id: str, limit: int = 100
    ) -> list[dict[str, Any]]:
        """Get audit trail for a specific resource.

        Args:
            resource_type: Resource type to filter by
            resource_id: Resource ID to filter by
            limit: Maximum number of entries to return

        Returns:
            List of audit entries
        """
        return [
            entry
            for entry in self._audit_log
            if entry["resource_type"] == resource_type
            and entry["resource_id"] == resource_id
        ][:limit]


# Singleton instances
security_logger = SecurityLogger()
audit_trail = AuditTrail(security_logger)


def get_security_logger() -> SecurityLogger:
    """Get the singleton security logger instance."""
    return security_logger


def get_audit_trail() -> AuditTrail:
    """Get the singleton audit trail instance."""
    return audit_trail
