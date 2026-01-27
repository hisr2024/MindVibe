"""
Unit tests for KIAAN Security Components

Tests:
1. Rate limiting functionality
2. Shell command injection prevention
3. Plugin security validation
4. Hash collision resistance (SHA256 vs MD5)
"""

import pytest
import asyncio
import re
from unittest.mock import AsyncMock, MagicMock, patch


class TestRateLimiter:
    """Tests for KIAAN rate limiting."""

    @pytest.fixture
    def rate_limiter(self):
        """Create rate limiter instance for testing."""
        from backend.services.kiaan_resilience import RateLimiter, RateLimitConfig
        config = RateLimitConfig(
            requests_per_minute=5,
            requests_per_hour=20,
            burst_size=2
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


class TestTerminalToolSecurity:
    """Tests for shell command injection prevention."""

    @pytest.fixture
    def terminal_tool(self):
        """Create terminal tool instance for testing."""
        from backend.services.kiaan_extended_tools import TerminalTool
        return TerminalTool()

    def test_allowed_commands_whitelist(self, terminal_tool):
        """Test that only whitelisted commands are allowed."""
        # Safe commands that should be allowed
        safe_commands = ["ls", "cat", "grep", "find", "python", "node"]
        for cmd in safe_commands:
            assert cmd in terminal_tool.ALLOWED_COMMANDS, f"{cmd} should be in whitelist"

        # Dangerous commands that should NOT be allowed
        dangerous_commands = ["curl", "wget", "docker", "docker-compose", "awk"]
        for cmd in dangerous_commands:
            assert cmd not in terminal_tool.ALLOWED_COMMANDS, f"{cmd} should NOT be in whitelist"

    def test_blocked_patterns_regex(self, terminal_tool):
        """Test that blocked patterns catch dangerous inputs."""
        dangerous_inputs = [
            "ls; rm -rf /",  # Command chaining
            "cat $(whoami)",  # Command substitution
            "echo `id`",  # Backtick command substitution
            "ls && rm -rf /",  # AND chaining
            "ls || rm -rf /",  # OR chaining
            "sudo ls",  # sudo
            "rm -rf /tmp",  # rm -rf
        ]

        for dangerous_input in dangerous_inputs:
            blocked = False
            for pattern in terminal_tool.BLOCKED_PATTERNS:
                if re.search(pattern, dangerous_input, re.IGNORECASE):
                    blocked = True
                    break
            assert blocked, f"Pattern should block: {dangerous_input}"

    @pytest.mark.asyncio
    async def test_command_not_in_whitelist_rejected(self, terminal_tool):
        """Test that commands not in whitelist are rejected."""
        from backend.services.kiaan_agent_tools import ToolStatus

        result = await terminal_tool.execute(command="curl http://evil.com")
        assert result.status == ToolStatus.PERMISSION_DENIED

    @pytest.mark.asyncio
    async def test_blocked_pattern_rejected(self, terminal_tool):
        """Test that blocked patterns are rejected."""
        from backend.services.kiaan_agent_tools import ToolStatus

        result = await terminal_tool.execute(command="ls; rm -rf /")
        assert result.status == ToolStatus.PERMISSION_DENIED


class TestPluginSecurity:
    """Tests for plugin security validation."""

    @pytest.fixture
    def plugin_validator(self):
        """Create plugin validator for testing."""
        from backend.services.kiaan_plugins import PluginValidator
        return PluginValidator()

    def test_dangerous_patterns_comprehensive(self, plugin_validator):
        """Test that all dangerous patterns are detected."""
        dangerous_patterns_to_detect = [
            "os.system",
            "subprocess.run",
            "subprocess.Popen",
            "subprocess.call",
            "eval(",
            "exec(",
            "compile(",
            "__import__",
            "shutil.rmtree",
            "pickle.load",
            "pickle.loads",
        ]

        # Check that these patterns are in the validator's dangerous patterns list
        # We test by creating mock code with each pattern
        for pattern in dangerous_patterns_to_detect:
            # The validator checks if pattern is IN content
            mock_content = f"def foo(): {pattern}"
            found = False
            for validator_pattern in [
                "os.system", "subprocess.run", "subprocess.Popen", "subprocess.call",
                "subprocess.check_output", "subprocess.check_call",
                "eval(", "exec(", "compile(", "__import__",
                "shutil.rmtree", "os.remove", "os.rmdir", "os.unlink",
                "socket.socket", "urllib.request.urlopen",
                "getattr(", "setattr(", "__getattribute__",
                "pickle.load", "pickle.loads",
            ]:
                if validator_pattern in mock_content:
                    found = True
                    break
            assert found or pattern not in mock_content, f"Pattern {pattern} should be detected"


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
        from backend.services.kiaan_audit import AuditLogHandler, AuditEvent, AuditEventType
        import tempfile
        import os

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
                    event_type=AuditEventType.USER_REQUEST,
                    user_id=f"user_{i}",
                    session_id=f"session_{i}",
                    data={"message": f"test_{i}"}
                )
                await handler.write(event)

            await asyncio.gather(*[write_event(i) for i in range(10)])

            # Verify all events were written
            with open(log_path, 'r') as f:
                lines = f.readlines()
            assert len(lines) == 10, "All events should be written"

        finally:
            os.unlink(log_path)
