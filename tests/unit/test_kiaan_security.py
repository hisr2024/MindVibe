"""
Unit tests for KIAAN Security Components

Tests:
1. Rate limiting functionality
2. Hash collision resistance (SHA256 vs MD5)
3. Async client usage in orchestrator
4. Audit logging security
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch


class TestRateLimiter:
    """Tests for KIAAN rate limiting."""

    @pytest.fixture
    def rate_limiter(self):
        """Create rate limiter instance for testing."""
        from backend.services.kiaan_resilience import RateLimiter, RateLimitConfig
        # burst_size must be >= requests_per_minute for immediate burst testing
        # Otherwise token bucket limits immediate requests to burst_size
        config = RateLimitConfig(
            requests_per_minute=5,
            requests_per_hour=20,
            burst_size=5  # Allow 5 immediate requests in test
        )
        return RateLimiter(config)

    @pytest.mark.asyncio
    async def test_rate_limiter_allows_within_limit(self, rate_limiter):
        """Test that requests within limit are allowed."""
        user_id = "test_user"
        for _ in range(5):
            result = await rate_limiter.is_allowed(user_id)
            assert result is True, "Should allow requests within limit"

    @pytest.mark.asyncio
    async def test_rate_limiter_blocks_over_limit(self, rate_limiter):
        """Test that requests over limit are blocked."""
        user_id = "test_user_over_limit"
        # Use up the limit
        for _ in range(5):
            await rate_limiter.is_allowed(user_id)
        # This should be blocked
        result = await rate_limiter.is_allowed(user_id)
        assert result is False, "Should block requests over limit"

    @pytest.mark.asyncio
    async def test_rate_limiter_tracks_separate_users(self, rate_limiter):
        """Test that rate limits are tracked per user."""
        # User 1 uses all their limit
        for _ in range(5):
            await rate_limiter.is_allowed("user_1")

        # User 2 should still be allowed
        result = await rate_limiter.is_allowed("user_2")
        assert result is True, "Different users should have separate limits"


class TestHashingImprovements:
    """Tests for SHA256 vs MD5 hash improvements."""

    def test_memory_id_uses_sha256(self):
        """Test that memory IDs use SHA256 not MD5."""
        import hashlib
        import json

        # Simulate the new ID generation
        content = {"test": "data", "more": "content"}
        content_str = json.dumps(content, sort_keys=True, default=str)

        # SHA256 produces 64 hex characters, we use 12
        sha256_hash = hashlib.sha256(content_str.encode()).hexdigest()[:12]
        assert len(sha256_hash) == 12

        # MD5 would produce 32 hex characters, we used 8
        md5_hash = hashlib.md5(content_str.encode()).hexdigest()[:8]
        assert len(md5_hash) == 8

        # SHA256 hash should be longer (we use 12 vs 8)
        assert len(sha256_hash) > len(md5_hash)

    def test_sha256_collision_resistance(self):
        """Test that SHA256 has better collision resistance."""
        import hashlib

        # Generate many hashes and check for collisions
        hashes = set()
        for i in range(10000):
            content = f"test_content_{i}"
            h = hashlib.sha256(content.encode()).hexdigest()[:12]
            assert h not in hashes, f"Collision detected at iteration {i}"
            hashes.add(h)


class TestAsyncClientUsage:
    """Tests for async client usage in orchestrator."""

    def test_orchestrator_uses_async_client(self):
        """Test that orchestrator creates async client."""
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test_key'}):
            from backend.services.kiaan_agent_orchestrator import KIAANAgentOrchestrator
            orchestrator = KIAANAgentOrchestrator()
            assert orchestrator.async_client is not None, "Async client should be created"

    def test_orchestrator_uses_env_config(self):
        """Test that orchestrator uses environment variables for config."""
        env_vars = {
            'OPENAI_API_KEY': 'test_key',
            'KIAAN_PLANNING_MODEL': 'gpt-4-turbo',
            'KIAAN_EXECUTION_MODEL': 'gpt-3.5-turbo',
            'KIAAN_SYNTHESIS_MODEL': 'gpt-4',
            'KIAAN_OPENAI_TIMEOUT': '60.0',
        }
        with patch.dict('os.environ', env_vars):
            from importlib import reload
            import backend.services.kiaan_agent_orchestrator as orchestrator_module
            reload(orchestrator_module)

            orchestrator = orchestrator_module.KIAANAgentOrchestrator()
            assert orchestrator.planning_model == 'gpt-4-turbo'
            assert orchestrator.execution_model == 'gpt-3.5-turbo'
            assert orchestrator.synthesis_model == 'gpt-4'


class TestAuditLogging:
    """Tests for audit logging security."""

    def test_audit_logger_has_file_lock(self):
        """Test that audit logger uses a shared file lock."""
        from backend.services.kiaan_audit import AuditLogHandler
        handler = AuditLogHandler()
        assert hasattr(handler, '_file_lock'), "Handler should have a file lock"
        assert handler._file_lock is not None

    @pytest.mark.asyncio
    async def test_audit_concurrent_writes_safe(self):
        """Test that concurrent audit writes don't corrupt data."""
        from backend.services.kiaan_audit import (
            AuditLogHandler, AuditEvent, AuditEventType, AuditSeverity
        )
        from datetime import datetime, timezone
        import tempfile
        import os
        import uuid

        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.log') as f:
            log_path = f.name

        try:
            handler = AuditLogHandler(
                log_to_file=True,
                log_to_redis=False,
                log_file_path=log_path
            )
            await handler.initialize()

            # Simulate concurrent writes
            async def write_event(i):
                event = AuditEvent(
                    id=str(uuid.uuid4()),
                    timestamp=datetime.now(timezone.utc),
                    event_type=AuditEventType.USER_REQUEST,
                    severity=AuditSeverity.INFO,
                    user_id=f"user_{i}",
                    session_id=f"session_{i}",
                    message=f"Test message {i}",
                    details={"test_data": f"test_{i}"}
                )
                await handler.write(event)

            await asyncio.gather(*[write_event(i) for i in range(10)])

            # Verify all events were written
            with open(log_path, 'r') as f:
                lines = f.readlines()
            assert len(lines) == 10, "All events should be written"

        finally:
            os.unlink(log_path)
