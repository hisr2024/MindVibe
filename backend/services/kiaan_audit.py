"""
KIAAN Audit Logging System - Comprehensive Activity Tracking

This module provides KIAAN with audit logging capabilities:
1. Request Logging - Track all user requests and AI responses
2. Tool Execution Logging - Record tool usage and results
3. Security Events - Log authentication, authorization, and anomalies
4. Performance Metrics - Track latency, tokens, and costs
5. Compliance Support - GDPR, SOC2, and audit trail requirements
"""

import asyncio
import json
import logging
import os
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Optional
from collections import defaultdict

# Optional Redis support
try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

# Optional aiofiles for async file I/O
try:
    import aiofiles
    AIOFILES_AVAILABLE = True
except ImportError:
    AIOFILES_AVAILABLE = False

logger = logging.getLogger(__name__)


class AuditEventType(str, Enum):
    """Types of audit events."""
    # User Events
    USER_REQUEST = "user_request"
    USER_FEEDBACK = "user_feedback"
    USER_SESSION_START = "user_session_start"
    USER_SESSION_END = "user_session_end"

    # AI Events
    AI_RESPONSE = "ai_response"
    AI_ERROR = "ai_error"
    AI_FALLBACK = "ai_fallback"

    # Tool Events
    TOOL_EXECUTION = "tool_execution"
    TOOL_SUCCESS = "tool_success"
    TOOL_FAILURE = "tool_failure"
    TOOL_TIMEOUT = "tool_timeout"
    TOOL_BLOCKED = "tool_blocked"

    # Security Events
    AUTH_SUCCESS = "auth_success"
    AUTH_FAILURE = "auth_failure"
    PERMISSION_DENIED = "permission_denied"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"

    # System Events
    SYSTEM_ERROR = "system_error"
    CONFIG_CHANGE = "config_change"
    MODEL_SWITCH = "model_switch"
    MEMORY_CLEANUP = "memory_cleanup"

    # Crisis Events (Spiritual Wellness Compliance)
    CRISIS_DETECTED = "crisis_detected"
    CRISIS_RESPONSE_SENT = "crisis_response_sent"


class AuditSeverity(str, Enum):
    """Severity levels for audit events."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class AuditEvent:
    """A single audit event."""
    id: str
    timestamp: datetime
    event_type: AuditEventType
    severity: AuditSeverity
    user_id: Optional[str]
    session_id: Optional[str]
    message: str
    details: dict = field(default_factory=dict)
    metadata: dict = field(default_factory=dict)
    duration_ms: Optional[float] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "event_type": self.event_type.value,
            "severity": self.severity.value,
            "user_id": self.user_id,
            "session_id": self.session_id,
            "message": self.message,
            "details": self.details,
            "metadata": self.metadata,
            "duration_ms": self.duration_ms,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), default=str)

    @classmethod
    def from_dict(cls, data: dict) -> "AuditEvent":
        return cls(
            id=data["id"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            event_type=AuditEventType(data["event_type"]),
            severity=AuditSeverity(data["severity"]),
            user_id=data.get("user_id"),
            session_id=data.get("session_id"),
            message=data["message"],
            details=data.get("details", {}),
            metadata=data.get("metadata", {}),
            duration_ms=data.get("duration_ms"),
            ip_address=data.get("ip_address"),
            user_agent=data.get("user_agent")
        )


@dataclass
class AuditMetrics:
    """Aggregated metrics from audit events."""
    total_requests: int = 0
    total_responses: int = 0
    total_errors: int = 0
    total_tool_executions: int = 0
    total_tool_failures: int = 0
    total_tokens_used: int = 0
    total_cost_usd: float = 0.0
    avg_latency_ms: float = 0.0
    unique_users: int = 0
    requests_by_type: dict = field(default_factory=dict)
    errors_by_type: dict = field(default_factory=dict)
    tools_by_name: dict = field(default_factory=dict)


class AuditLogHandler:
    """Handler for writing audit logs to various destinations."""

    def __init__(
        self,
        log_to_file: bool = True,
        log_to_redis: bool = True,
        log_to_stdout: bool = False,
        log_file_path: Optional[str] = None
    ):
        self.log_to_file = log_to_file
        self.log_to_redis = log_to_redis
        self.log_to_stdout = log_to_stdout
        self.log_file_path = log_file_path or os.getenv(
            "KIAAN_AUDIT_LOG_PATH",
            "logs/kiaan_audit.log"
        )
        self.redis_client: Optional[Any] = None
        self._file_handle = None
        self._file_lock = asyncio.Lock()  # Shared lock for file writes

    async def initialize(self) -> None:
        """Initialize log handlers."""
        # Create log directory
        if self.log_to_file:
            log_dir = os.path.dirname(self.log_file_path)
            if log_dir:
                os.makedirs(log_dir, exist_ok=True)

        # Initialize Redis
        if self.log_to_redis and REDIS_AVAILABLE:
            redis_url = os.getenv("REDIS_URL")
            if redis_url:
                try:
                    self.redis_client = await aioredis.from_url(redis_url)
                    logger.info("Audit logging: Redis connected")
                except Exception as e:
                    logger.warning(f"Audit logging: Redis connection failed: {e}")

    async def write(self, event: AuditEvent) -> None:
        """Write an audit event to all configured destinations."""
        event_json = event.to_json()

        # Write to file
        if self.log_to_file:
            await self._write_to_file(event_json)

        # Write to Redis
        if self.log_to_redis and self.redis_client:
            await self._write_to_redis(event)

        # Write to stdout
        if self.log_to_stdout:
            print(f"[AUDIT] {event_json}")

    async def _write_to_file(self, event_json: str) -> None:
        """Write event to log file using async I/O."""
        try:
            async with self._file_lock:
                if AIOFILES_AVAILABLE:
                    # Use async file I/O for better performance
                    async with aiofiles.open(self.log_file_path, "a") as f:
                        await f.write(event_json + "\n")
                else:
                    # Fallback to sync I/O in thread pool to avoid blocking
                    loop = asyncio.get_event_loop()
                    await loop.run_in_executor(
                        None,
                        self._sync_write_to_file,
                        event_json
                    )
        except Exception as e:
            logger.error(f"Failed to write audit log to file: {e}")

    def _sync_write_to_file(self, event_json: str) -> None:
        """Sync file write helper for fallback."""
        with open(self.log_file_path, "a") as f:
            f.write(event_json + "\n")

    async def _write_to_redis(self, event: AuditEvent) -> None:
        """Write event to Redis."""
        try:
            # Store in sorted set by timestamp for efficient querying
            key = f"kiaan_audit:{event.event_type.value}"
            score = event.timestamp.timestamp()

            await self.redis_client.zadd(key, {event.to_json(): score})

            # Also store by session for session-based queries
            if event.session_id:
                session_key = f"kiaan_audit:session:{event.session_id}"
                await self.redis_client.zadd(session_key, {event.to_json(): score})
                await self.redis_client.expire(session_key, 86400 * 7)  # 7 days

            # Store by user for user-based queries
            if event.user_id:
                user_key = f"kiaan_audit:user:{event.user_id}"
                await self.redis_client.zadd(user_key, {event.to_json(): score})
                await self.redis_client.expire(user_key, 86400 * 30)  # 30 days

            # Trim old entries (keep last 100k per event type)
            await self.redis_client.zremrangebyrank(key, 0, -100001)

        except Exception as e:
            logger.error(f"Failed to write audit log to Redis: {e}")

    async def close(self) -> None:
        """Close handlers."""
        if self.redis_client:
            await self.redis_client.close()


class KIAANAuditLogger:
    """
    Main audit logging service for KIAAN.

    Provides:
    - Structured event logging
    - Metrics aggregation
    - Query capabilities
    - Retention management
    - Compliance support
    """

    def __init__(self):
        self.handler = AuditLogHandler()
        self._metrics = AuditMetrics()
        self._latencies: list[float] = []
        self._unique_users: set[str] = set()
        self._lock = asyncio.Lock()
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize the audit logger."""
        if not self._initialized:
            await self.handler.initialize()
            self._initialized = True
            logger.info("KIAAN Audit Logger initialized")

    async def log(
        self,
        event_type: AuditEventType,
        message: str,
        severity: AuditSeverity = AuditSeverity.INFO,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        details: Optional[dict] = None,
        metadata: Optional[dict] = None,
        duration_ms: Optional[float] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> str:
        """
        Log an audit event.

        Args:
            event_type: Type of event
            message: Human-readable message
            severity: Event severity
            user_id: User identifier
            session_id: Session identifier
            details: Event-specific details
            metadata: Additional metadata
            duration_ms: Operation duration
            ip_address: Client IP
            user_agent: Client user agent

        Returns:
            Event ID
        """
        if not self._initialized:
            await self.initialize()

        event = AuditEvent(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            event_type=event_type,
            severity=severity,
            user_id=user_id,
            session_id=session_id,
            message=message,
            details=details or {},
            metadata=metadata or {},
            duration_ms=duration_ms,
            ip_address=ip_address,
            user_agent=user_agent
        )

        # Write to handlers
        await self.handler.write(event)

        # Update metrics
        await self._update_metrics(event)

        return event.id

    # Convenience methods for common events

    async def log_request(
        self,
        user_id: str,
        session_id: str,
        query: str,
        intent: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> str:
        """Log a user request."""
        return await self.log(
            event_type=AuditEventType.USER_REQUEST,
            message=f"User request: {query[:100]}...",
            user_id=user_id,
            session_id=session_id,
            details={
                "query": query[:1000],  # Truncate for storage
                "intent": intent,
                "query_length": len(query)
            },
            ip_address=ip_address,
            user_agent=user_agent
        )

    async def log_response(
        self,
        user_id: str,
        session_id: str,
        response_length: int,
        model: str,
        tokens_used: dict,
        duration_ms: float,
        cost_usd: Optional[float] = None
    ) -> str:
        """Log an AI response."""
        return await self.log(
            event_type=AuditEventType.AI_RESPONSE,
            message=f"AI response generated ({response_length} chars, {duration_ms:.0f}ms)",
            user_id=user_id,
            session_id=session_id,
            details={
                "response_length": response_length,
                "model": model,
                "tokens_used": tokens_used,
                "cost_usd": cost_usd
            },
            duration_ms=duration_ms
        )

    async def log_tool_execution(
        self,
        tool_name: str,
        status: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        duration_ms: Optional[float] = None,
        params: Optional[dict] = None,
        result_summary: Optional[str] = None,
        error: Optional[str] = None
    ) -> str:
        """Log a tool execution."""
        if status == "success":
            event_type = AuditEventType.TOOL_SUCCESS
            severity = AuditSeverity.INFO
        elif status == "timeout":
            event_type = AuditEventType.TOOL_TIMEOUT
            severity = AuditSeverity.WARNING
        elif status == "blocked":
            event_type = AuditEventType.TOOL_BLOCKED
            severity = AuditSeverity.WARNING
        else:
            event_type = AuditEventType.TOOL_FAILURE
            severity = AuditSeverity.ERROR

        return await self.log(
            event_type=event_type,
            message=f"Tool '{tool_name}' {status}",
            severity=severity,
            user_id=user_id,
            session_id=session_id,
            details={
                "tool_name": tool_name,
                "status": status,
                "params": self._sanitize_params(params),
                "result_summary": result_summary,
                "error": error
            },
            duration_ms=duration_ms
        )

    async def log_security_event(
        self,
        event_type: AuditEventType,
        message: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        details: Optional[dict] = None
    ) -> str:
        """Log a security-related event."""
        severity = AuditSeverity.WARNING
        if event_type in [AuditEventType.AUTH_FAILURE, AuditEventType.SUSPICIOUS_ACTIVITY]:
            severity = AuditSeverity.ERROR

        return await self.log(
            event_type=event_type,
            message=message,
            severity=severity,
            user_id=user_id,
            session_id=session_id,
            details=details or {},
            ip_address=ip_address
        )

    async def log_error(
        self,
        error: Exception,
        context: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> str:
        """Log an error."""
        return await self.log(
            event_type=AuditEventType.SYSTEM_ERROR,
            message=f"Error in {context}: {str(error)}",
            severity=AuditSeverity.ERROR,
            user_id=user_id,
            session_id=session_id,
            details={
                "error_type": type(error).__name__,
                "error_message": str(error),
                "context": context
            }
        )

    async def log_crisis_event(
        self,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        triggered_keywords: Optional[list[str]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> str:
        """
        Log a crisis detection event for compliance and safety monitoring.

        This is a critical compliance requirement for spiritual wellness applications.
        All crisis events must be logged for:
        - Regulatory compliance (HIPAA, SOC2)
        - Safety monitoring and follow-up
        - Service quality assurance
        - Legal documentation

        Note: User message content is NOT logged to protect privacy.
        Only the fact that crisis keywords were detected is recorded.
        """
        event_id = await self.log(
            event_type=AuditEventType.CRISIS_DETECTED,
            message="Crisis keywords detected - escalation response provided",
            severity=AuditSeverity.CRITICAL,
            user_id=user_id,
            session_id=session_id,
            details={
                "triggered_keywords_count": len(triggered_keywords) if triggered_keywords else 0,
                "response_type": "immediate_escalation",
                "resources_provided": ["988_suicide_lifeline", "crisis_text_line", "findahelpline"]
            },
            ip_address=ip_address,
            user_agent=user_agent
        )

        # Also log the response was sent
        await self.log(
            event_type=AuditEventType.CRISIS_RESPONSE_SENT,
            message="Crisis escalation resources sent to user",
            severity=AuditSeverity.INFO,
            user_id=user_id,
            session_id=session_id,
            details={
                "parent_event_id": event_id,
                "resources_included": True
            }
        )

        return event_id

    # Query methods

    async def get_events(
        self,
        event_type: Optional[AuditEventType] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> list[AuditEvent]:
        """Query audit events."""
        if not self.handler.redis_client:
            return []

        # Determine which key to query
        if session_id:
            key = f"kiaan_audit:session:{session_id}"
        elif user_id:
            key = f"kiaan_audit:user:{user_id}"
        elif event_type:
            key = f"kiaan_audit:{event_type.value}"
        else:
            # Query all event types
            return []

        try:
            start_score = start_time.timestamp() if start_time else "-inf"
            end_score = end_time.timestamp() if end_time else "+inf"

            events_json = await self.handler.redis_client.zrangebyscore(
                key,
                start_score,
                end_score,
                start=0,
                num=limit
            )

            events = []
            for event_json in events_json:
                try:
                    data = json.loads(event_json)
                    events.append(AuditEvent.from_dict(data))
                except (json.JSONDecodeError, KeyError):
                    continue

            return events

        except Exception as e:
            logger.error(f"Failed to query audit events: {e}")
            return []

    async def get_metrics(self) -> dict:
        """Get current metrics."""
        return {
            "total_requests": self._metrics.total_requests,
            "total_responses": self._metrics.total_responses,
            "total_errors": self._metrics.total_errors,
            "total_tool_executions": self._metrics.total_tool_executions,
            "total_tool_failures": self._metrics.total_tool_failures,
            "total_tokens_used": self._metrics.total_tokens_used,
            "total_cost_usd": round(self._metrics.total_cost_usd, 4),
            "avg_latency_ms": round(self._metrics.avg_latency_ms, 2),
            "unique_users": len(self._unique_users),
            "requests_by_type": dict(self._metrics.requests_by_type),
            "errors_by_type": dict(self._metrics.errors_by_type),
            "tools_by_name": dict(self._metrics.tools_by_name)
        }

    async def get_user_activity(
        self,
        user_id: str,
        days: int = 7
    ) -> dict:
        """Get activity summary for a user."""
        start_time = datetime.now() - timedelta(days=days)
        events = await self.get_events(
            user_id=user_id,
            start_time=start_time,
            limit=1000
        )

        activity = {
            "user_id": user_id,
            "period_days": days,
            "total_events": len(events),
            "requests": 0,
            "tool_uses": 0,
            "errors": 0,
            "sessions": set(),
            "most_used_tools": defaultdict(int)
        }

        for event in events:
            if event.event_type == AuditEventType.USER_REQUEST:
                activity["requests"] += 1
            elif event.event_type in [AuditEventType.TOOL_SUCCESS, AuditEventType.TOOL_FAILURE]:
                activity["tool_uses"] += 1
                tool_name = event.details.get("tool_name", "unknown")
                activity["most_used_tools"][tool_name] += 1
            elif event.severity in [AuditSeverity.ERROR, AuditSeverity.CRITICAL]:
                activity["errors"] += 1

            if event.session_id:
                activity["sessions"].add(event.session_id)

        activity["sessions"] = len(activity["sessions"])
        activity["most_used_tools"] = dict(activity["most_used_tools"])

        return activity

    # Private methods

    async def _update_metrics(self, event: AuditEvent) -> None:
        """Update aggregated metrics."""
        async with self._lock:
            # Update counters
            if event.event_type == AuditEventType.USER_REQUEST:
                self._metrics.total_requests += 1
                intent = event.details.get("intent", "unknown")
                self._metrics.requests_by_type[intent] = \
                    self._metrics.requests_by_type.get(intent, 0) + 1

            elif event.event_type == AuditEventType.AI_RESPONSE:
                self._metrics.total_responses += 1
                tokens = event.details.get("tokens_used", {})
                self._metrics.total_tokens_used += \
                    tokens.get("input", 0) + tokens.get("output", 0)
                self._metrics.total_cost_usd += event.details.get("cost_usd", 0) or 0

            elif event.event_type in [AuditEventType.TOOL_SUCCESS, AuditEventType.TOOL_EXECUTION]:
                self._metrics.total_tool_executions += 1
                tool = event.details.get("tool_name", "unknown")
                self._metrics.tools_by_name[tool] = \
                    self._metrics.tools_by_name.get(tool, 0) + 1

            elif event.event_type == AuditEventType.TOOL_FAILURE:
                self._metrics.total_tool_failures += 1

            elif event.severity in [AuditSeverity.ERROR, AuditSeverity.CRITICAL]:
                self._metrics.total_errors += 1
                error_type = event.details.get("error_type", "unknown")
                self._metrics.errors_by_type[error_type] = \
                    self._metrics.errors_by_type.get(error_type, 0) + 1

            # Track latency
            if event.duration_ms:
                self._latencies.append(event.duration_ms)
                # Keep only last 1000 for rolling average
                if len(self._latencies) > 1000:
                    self._latencies = self._latencies[-1000:]
                self._metrics.avg_latency_ms = sum(self._latencies) / len(self._latencies)

            # Track unique users
            if event.user_id:
                self._unique_users.add(event.user_id)

    def _sanitize_params(self, params: Optional[dict]) -> Optional[dict]:
        """Sanitize parameters to remove sensitive data."""
        if not params:
            return None

        sensitive_keys = ["password", "token", "secret", "api_key", "auth", "credential"]
        sanitized = {}

        for key, value in params.items():
            if any(s in key.lower() for s in sensitive_keys):
                sanitized[key] = "[REDACTED]"
            elif isinstance(value, str) and len(value) > 500:
                sanitized[key] = value[:500] + "...[truncated]"
            else:
                sanitized[key] = value

        return sanitized

    async def close(self) -> None:
        """Close the audit logger."""
        await self.handler.close()


# Singleton instance
kiaan_audit = KIAANAuditLogger()


# Export
__all__ = [
    "KIAANAuditLogger",
    "AuditEvent",
    "AuditEventType",
    "AuditSeverity",
    "AuditMetrics",
    "kiaan_audit"
]
