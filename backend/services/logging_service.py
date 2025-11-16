"""backend/services/logging_service.py"""

from datetime import datetime
from enum import Enum
from typing import Any


class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class LoggingService:
    """Comprehensive logging for compliance and debugging"""

    def __init__(self):
        self.logs: list[dict[str, Any]] = []
        self.audit_trail: list[dict[str, Any]] = []
        self.security_events: list[dict[str, Any]] = []

    def log(
        self,
        level: LogLevel,
        message: str,
        user_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Log an event"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level.value,
            "message": message,
            "user_id": user_id,
            "metadata": metadata or {},
        }
        self.logs.append(log_entry)
        self.audit_trail.append(log_entry)

    def log_user_action(
        self, user_id: str, action: str, resource: str | None = None
    ) -> None:
        """Log user action for audit trail"""
        self.log(
            LogLevel.INFO,
            f"User action: {action}",
            user_id=user_id,
            metadata={"action": action, "resource": resource},
        )

    def log_security_event(
        self,
        event_type: str,
        user_id: str | None,
        description: str,
        severity: str = "medium",
    ) -> None:
        """Log security event"""
        security_log = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "user_id": user_id,
            "description": description,
            "severity": severity,
        }
        self.security_events.append(security_log)

    def log_error(
        self, error_type: str, error_message: str, user_id: str | None = None
    ) -> None:
        """Log error"""
        self.log(
            LogLevel.ERROR,
            error_message,
            user_id=user_id,
            metadata={"error_type": error_type},
        )

    def get_audit_trail(
        self, user_id: str | None = None, days: int = 30  # noqa: ARG002
    ) -> list[dict[str, Any]]:
        """Get audit trail"""
        trail = self.audit_trail
        if user_id:
            trail = [log for log in trail if log.get("user_id") == user_id]
        return trail

    def get_security_events(self) -> list[dict[str, Any]]:
        """Get security events"""
        return self.security_events


logging_service = LoggingService()
