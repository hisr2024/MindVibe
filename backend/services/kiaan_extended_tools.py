"""
KIAAN Extended Tools - Additional Autonomous Capabilities

This module extends KIAAN's tool framework with:
1. Pytest Runner - Execute and validate tests
2. Linter Checker - Run code quality checks
3. Database Query - Safe SQL execution
4. API Tester - REST API testing
5. Git Operations - Repository management
6. Docker Manager - Container operations
7. Terminal Emulator - Safe shell commands
"""

import asyncio
import json
import logging
import os
import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional

import aiohttp

from backend.services.kiaan_agent_tools import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class PytestRunnerTool(BaseTool):
    """
    Pytest Runner Tool - Execute Python tests.

    Capabilities:
    - Run pytest on specified files/directories
    - Capture test results and failures
    - Support for markers and filters
    - Code coverage reporting
    """

    name = "pytest_runner"
    description = """Run Python tests using pytest. Use this to validate code,
    check for regressions, and ensure code quality. Supports running specific
    tests, using markers, and generating coverage reports."""

    parameters_schema = {
        "type": "object",
        "properties": {
            "test_path": {
                "type": "string",
                "description": "Path to test file or directory"
            },
            "test_pattern": {
                "type": "string",
                "description": "Pattern to match test functions (e.g., 'test_login')",
                "default": None
            },
            "markers": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Pytest markers to filter tests (e.g., ['slow', 'integration'])",
                "default": []
            },
            "coverage": {
                "type": "boolean",
                "description": "Generate coverage report",
                "default": False
            },
            "verbose": {
                "type": "boolean",
                "description": "Verbose output",
                "default": True
            },
            "timeout_seconds": {
                "type": "integer",
                "description": "Maximum execution time",
                "default": 60
            }
        },
        "required": ["test_path"]
    }

    async def execute(
        self,
        test_path: str,
        test_pattern: Optional[str] = None,
        markers: list[str] = None,
        coverage: bool = False,
        verbose: bool = True,
        timeout_seconds: int = 60
    ) -> ToolResult:
        """Run pytest on the specified path."""
        import time
        start_time = time.time()

        # Build pytest command
        cmd = ["python", "-m", "pytest"]

        if verbose:
            cmd.append("-v")

        if test_pattern:
            cmd.extend(["-k", test_pattern])

        for marker in (markers or []):
            cmd.extend(["-m", marker])

        if coverage:
            cmd.extend(["--cov", "--cov-report=json"])

        cmd.append("--tb=short")
        cmd.append("-q")
        cmd.append(test_path)

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout_seconds
            )

            output = stdout.decode("utf-8")
            errors = stderr.decode("utf-8")

            # Parse results
            results = self._parse_pytest_output(output)
            results["raw_output"] = output
            results["errors"] = errors

            status = ToolStatus.SUCCESS if results["failed"] == 0 else ToolStatus.ERROR

            return ToolResult(
                tool_name=self.name,
                status=status,
                output=results,
                error=f"{results['failed']} tests failed" if results["failed"] > 0 else None,
                execution_time_ms=(time.time() - start_time) * 1000,
                metadata={"test_path": test_path, "coverage": coverage}
            )

        except asyncio.TimeoutError:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.TIMEOUT,
                output=None,
                error=f"Tests timed out after {timeout_seconds} seconds",
                execution_time_ms=(time.time() - start_time) * 1000
            )
        except Exception as e:
            logger.error(f"Pytest runner error: {e}")
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.ERROR,
                output=None,
                error=str(e),
                execution_time_ms=(time.time() - start_time) * 1000
            )

    def _parse_pytest_output(self, output: str) -> dict:
        """Parse pytest output to extract results."""
        results = {
            "passed": 0,
            "failed": 0,
            "skipped": 0,
            "errors": 0,
            "warnings": 0,
            "failures": []
        }

        # Match summary line: "X passed, Y failed, Z skipped"
        summary_pattern = r"(\d+) passed|(\d+) failed|(\d+) skipped|(\d+) error"
        for match in re.finditer(summary_pattern, output):
            if match.group(1):
                results["passed"] = int(match.group(1))
            elif match.group(2):
                results["failed"] = int(match.group(2))
            elif match.group(3):
                results["skipped"] = int(match.group(3))
            elif match.group(4):
                results["errors"] = int(match.group(4))

        # Extract failure details
        failure_pattern = r"FAILED ([^\s]+) - (.+)"
        for match in re.finditer(failure_pattern, output):
            results["failures"].append({
                "test": match.group(1),
                "reason": match.group(2)
            })

        return results


class LinterTool(BaseTool):
    """
    Linter Tool - Run code quality checks.

    Supported linters:
    - flake8 (style guide enforcement)
    - pylint (code analysis)
    - mypy (type checking)
    - black (formatting check)
    - isort (import sorting check)
    """

    name = "linter"
    description = """Run code quality checks using various Python linters.
    Use this to ensure code follows best practices, check for type errors,
    and maintain consistent formatting."""

    parameters_schema = {
        "type": "object",
        "properties": {
            "file_path": {
                "type": "string",
                "description": "Path to file or directory to lint"
            },
            "linter": {
                "type": "string",
                "enum": ["flake8", "pylint", "mypy", "black", "isort", "all"],
                "description": "Which linter to run",
                "default": "flake8"
            },
            "fix": {
                "type": "boolean",
                "description": "Attempt to auto-fix issues (where supported)",
                "default": False
            },
            "config": {
                "type": "object",
                "description": "Additional linter configuration",
                "default": {}
            }
        },
        "required": ["file_path"]
    }

    LINTER_COMMANDS = {
        "flake8": ["python", "-m", "flake8", "--max-line-length=100"],
        "pylint": ["python", "-m", "pylint", "--output-format=json"],
        "mypy": ["python", "-m", "mypy", "--ignore-missing-imports"],
        "black": ["python", "-m", "black", "--check", "--diff"],
        "isort": ["python", "-m", "isort", "--check-only", "--diff"]
    }

    async def execute(
        self,
        file_path: str,
        linter: str = "flake8",
        fix: bool = False,
        config: dict = None
    ) -> ToolResult:
        """Run linter on the specified path."""
        import time
        start_time = time.time()

        results = {}

        if linter == "all":
            linters = ["flake8", "pylint", "mypy"]
        else:
            linters = [linter]

        for lint in linters:
            results[lint] = await self._run_linter(file_path, lint, fix)

        # Aggregate status
        all_clean = all(r.get("issues", 0) == 0 for r in results.values())
        status = ToolStatus.SUCCESS if all_clean else ToolStatus.ERROR

        total_issues = sum(r.get("issues", 0) for r in results.values())

        return ToolResult(
            tool_name=self.name,
            status=status,
            output=results,
            error=f"Found {total_issues} issues" if total_issues > 0 else None,
            execution_time_ms=(time.time() - start_time) * 1000,
            metadata={"file_path": file_path, "linter": linter}
        )

    async def _run_linter(self, file_path: str, linter: str, fix: bool) -> dict:
        """Run a specific linter."""
        cmd = self.LINTER_COMMANDS.get(linter, [])
        if not cmd:
            return {"error": f"Unknown linter: {linter}"}

        cmd = cmd.copy()

        # Handle fix mode
        if fix and linter in ["black", "isort"]:
            cmd = [c for c in cmd if c not in ["--check", "--check-only", "--diff"]]

        cmd.append(file_path)

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=60
            )

            output = stdout.decode("utf-8")
            errors = stderr.decode("utf-8")

            # Parse output based on linter
            if linter == "pylint":
                try:
                    issues = json.loads(output)
                    return {
                        "issues": len(issues),
                        "details": issues[:20],  # Limit
                        "raw": output[:2000]
                    }
                except json.JSONDecodeError:
                    pass

            # Count issues (rough)
            issue_count = len([l for l in output.split("\n") if l.strip() and ":" in l])

            return {
                "issues": issue_count,
                "output": output[:3000],
                "errors": errors[:500] if errors else None,
                "exit_code": process.returncode
            }

        except asyncio.TimeoutError:
            return {"error": "Linter timed out", "issues": -1}
        except Exception as e:
            return {"error": str(e), "issues": -1}


class DatabaseQueryTool(BaseTool):
    """
    Database Query Tool - Execute safe SQL queries.

    Security features:
    - Read-only queries by default
    - Query timeout limits
    - Result size limits
    - SQL injection prevention
    """

    name = "database_query"
    description = """Execute SQL queries against a database. Use this to
    explore schema, query data, and analyze database contents. By default
    only SELECT queries are allowed for safety."""

    parameters_schema = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "SQL query to execute"
            },
            "database_url": {
                "type": "string",
                "description": "Database connection URL (optional, uses default if not provided)"
            },
            "params": {
                "type": "object",
                "description": "Query parameters for safe binding",
                "default": {}
            },
            "limit": {
                "type": "integer",
                "description": "Maximum rows to return",
                "default": 100
            },
            "allow_write": {
                "type": "boolean",
                "description": "Allow write operations (INSERT, UPDATE, DELETE)",
                "default": False
            }
        },
        "required": ["query"]
    }

    # Dangerous SQL patterns (blocked by default)
    WRITE_PATTERNS = [
        r"\bINSERT\b", r"\bUPDATE\b", r"\bDELETE\b",
        r"\bDROP\b", r"\bCREATE\b", r"\bALTER\b",
        r"\bTRUNCATE\b", r"\bGRANT\b", r"\bREVOKE\b"
    ]

    async def execute(
        self,
        query: str,
        database_url: Optional[str] = None,
        params: dict = None,
        limit: int = 100,
        allow_write: bool = False
    ) -> ToolResult:
        """Execute a SQL query."""
        import time
        start_time = time.time()

        # Security check
        if not allow_write:
            for pattern in self.WRITE_PATTERNS:
                if re.search(pattern, query, re.IGNORECASE):
                    return ToolResult(
                        tool_name=self.name,
                        status=ToolStatus.PERMISSION_DENIED,
                        output=None,
                        error=f"Write operations not allowed. Set allow_write=True to enable.",
                        execution_time_ms=(time.time() - start_time) * 1000
                    )

        # Add LIMIT if not present
        if "LIMIT" not in query.upper() and limit:
            query = f"{query.rstrip(';')} LIMIT {limit}"

        db_url = database_url or os.getenv("DATABASE_URL")
        if not db_url:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.ERROR,
                output=None,
                error="No database URL provided",
                execution_time_ms=(time.time() - start_time) * 1000
            )

        try:
            # Use asyncpg for PostgreSQL or aiosqlite for SQLite
            if "postgresql" in db_url or "postgres" in db_url:
                result = await self._query_postgres(db_url, query, params)
            elif "sqlite" in db_url:
                result = await self._query_sqlite(db_url, query, params)
            else:
                return ToolResult(
                    tool_name=self.name,
                    status=ToolStatus.ERROR,
                    output=None,
                    error="Unsupported database type",
                    execution_time_ms=(time.time() - start_time) * 1000
                )

            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.SUCCESS,
                output=result,
                execution_time_ms=(time.time() - start_time) * 1000,
                metadata={"query": query[:200], "row_count": len(result.get("rows", []))}
            )

        except Exception as e:
            logger.error(f"Database query error: {e}")
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.ERROR,
                output=None,
                error=str(e),
                execution_time_ms=(time.time() - start_time) * 1000
            )

    async def _query_postgres(self, db_url: str, query: str, params: dict) -> dict:
        """Execute query on PostgreSQL."""
        try:
            import asyncpg
        except ImportError:
            return {"error": "asyncpg not installed"}

        # Get SSL context for Render PostgreSQL compatibility
        from backend.deps import _get_ssl_connect_args
        ssl_args = _get_ssl_connect_args(db_url)
        ssl_ctx = ssl_args.get("ssl", False)
        conn = await asyncpg.connect(db_url, timeout=30, ssl=ssl_ctx)
        try:
            if params:
                rows = await conn.fetch(query, *params.values())
            else:
                rows = await conn.fetch(query)

            return {
                "rows": [dict(r) for r in rows],
                "columns": list(rows[0].keys()) if rows else []
            }
        finally:
            await conn.close()

    async def _query_sqlite(self, db_url: str, query: str, params: dict) -> dict:
        """Execute query on SQLite."""
        try:
            import aiosqlite
        except ImportError:
            return {"error": "aiosqlite not installed"}

        db_path = db_url.replace("sqlite:///", "").replace("sqlite://", "")

        async with aiosqlite.connect(db_path) as db:
            db.row_factory = aiosqlite.Row
            if params:
                cursor = await db.execute(query, list(params.values()))
            else:
                cursor = await db.execute(query)

            rows = await cursor.fetchall()
            columns = [d[0] for d in cursor.description] if cursor.description else []

            return {
                "rows": [dict(zip(columns, r)) for r in rows],
                "columns": columns
            }


class APITesterTool(BaseTool):
    """
    API Tester Tool - Test REST APIs.

    Capabilities:
    - Make HTTP requests (GET, POST, PUT, DELETE, PATCH)
    - Test response status and content
    - Support for authentication
    - Response validation
    """

    name = "api_tester"
    description = """Test REST APIs by making HTTP requests and validating responses.
    Use this to verify API endpoints, test authentication, and check response formats."""

    parameters_schema = {
        "type": "object",
        "properties": {
            "url": {
                "type": "string",
                "description": "API endpoint URL"
            },
            "method": {
                "type": "string",
                "enum": ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
                "description": "HTTP method",
                "default": "GET"
            },
            "headers": {
                "type": "object",
                "description": "Request headers",
                "default": {}
            },
            "body": {
                "type": "object",
                "description": "Request body (for POST, PUT, PATCH)",
                "default": None
            },
            "params": {
                "type": "object",
                "description": "Query parameters",
                "default": {}
            },
            "expected_status": {
                "type": "integer",
                "description": "Expected HTTP status code",
                "default": None
            },
            "timeout_seconds": {
                "type": "integer",
                "description": "Request timeout",
                "default": 30
            }
        },
        "required": ["url"]
    }

    async def execute(
        self,
        url: str,
        method: str = "GET",
        headers: dict = None,
        body: dict = None,
        params: dict = None,
        expected_status: Optional[int] = None,
        timeout_seconds: int = 30
    ) -> ToolResult:
        """Make an API request and return the response."""
        import time
        start_time = time.time()

        # Security: only allow certain domains or localhost
        allowed_domains = ["localhost", "127.0.0.1", "api.", "test.", "staging."]
        is_allowed = any(d in url for d in allowed_domains) or url.startswith("http://localhost")

        if not is_allowed and not os.getenv("KIAAN_ALLOW_EXTERNAL_API"):
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.PERMISSION_DENIED,
                output=None,
                error="External API calls not allowed. Set KIAAN_ALLOW_EXTERNAL_API=true to enable.",
                execution_time_ms=(time.time() - start_time) * 1000
            )

        try:
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=timeout_seconds)
            ) as session:
                request_kwargs = {
                    "headers": headers or {},
                    "params": params
                }

                if body and method in ["POST", "PUT", "PATCH"]:
                    request_kwargs["json"] = body

                async with session.request(method, url, **request_kwargs) as response:
                    response_body = await response.text()

                    # Try to parse as JSON
                    try:
                        json_body = json.loads(response_body)
                    except json.JSONDecodeError:
                        json_body = None

                    result = {
                        "status_code": response.status,
                        "headers": dict(response.headers),
                        "body": json_body or response_body[:5000],
                        "content_type": response.content_type,
                        "url": str(response.url)
                    }

                    # Check expected status
                    status_ok = expected_status is None or response.status == expected_status
                    status = ToolStatus.SUCCESS if status_ok else ToolStatus.ERROR

                    return ToolResult(
                        tool_name=self.name,
                        status=status,
                        output=result,
                        error=f"Expected status {expected_status}, got {response.status}" if not status_ok else None,
                        execution_time_ms=(time.time() - start_time) * 1000,
                        metadata={"method": method, "url": url}
                    )

        except asyncio.TimeoutError:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.TIMEOUT,
                output=None,
                error=f"Request timed out after {timeout_seconds} seconds",
                execution_time_ms=(time.time() - start_time) * 1000
            )
        except Exception as e:
            logger.error(f"API tester error: {e}")
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.ERROR,
                output=None,
                error=str(e),
                execution_time_ms=(time.time() - start_time) * 1000
            )


class GitOperationsTool(BaseTool):
    """
    Git Operations Tool - Repository management.

    Capabilities:
    - Check repository status
    - View commit history
    - Show diffs
    - List branches
    - Blame files
    """

    name = "git_operations"
    description = """Perform Git operations on repositories. Use this to check
    repository status, view history, compare changes, and understand code evolution."""

    parameters_schema = {
        "type": "object",
        "properties": {
            "operation": {
                "type": "string",
                "enum": ["status", "log", "diff", "branches", "blame", "show", "ls-files"],
                "description": "Git operation to perform"
            },
            "repo_path": {
                "type": "string",
                "description": "Path to repository",
                "default": "."
            },
            "args": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Additional arguments for the operation",
                "default": []
            },
            "limit": {
                "type": "integer",
                "description": "Limit output (for log, etc.)",
                "default": 20
            }
        },
        "required": ["operation"]
    }

    # Safe operations only (no push, reset, etc.)
    ALLOWED_OPERATIONS = ["status", "log", "diff", "branches", "blame", "show", "ls-files", "branch"]

    async def execute(
        self,
        operation: str,
        repo_path: str = ".",
        args: list[str] = None,
        limit: int = 20
    ) -> ToolResult:
        """Execute a git operation."""
        import time
        start_time = time.time()

        if operation not in self.ALLOWED_OPERATIONS:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.PERMISSION_DENIED,
                output=None,
                error=f"Operation not allowed: {operation}",
                execution_time_ms=(time.time() - start_time) * 1000
            )

        cmd = ["git", "-C", repo_path]

        if operation == "status":
            cmd.extend(["status", "--porcelain"])
        elif operation == "log":
            cmd.extend(["log", f"-{limit}", "--oneline", "--decorate"])
        elif operation == "diff":
            cmd.extend(["diff", "--stat"])
            if args:
                cmd.extend(args)
        elif operation == "branches":
            cmd.extend(["branch", "-a"])
        elif operation == "blame":
            cmd.append("blame")
            if args:
                cmd.extend(args)
        elif operation == "show":
            cmd.append("show")
            if args:
                cmd.extend(args)
            else:
                cmd.append("--stat")
        elif operation == "ls-files":
            cmd.append("ls-files")

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=30
            )

            output = stdout.decode("utf-8")
            errors = stderr.decode("utf-8")

            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.SUCCESS if process.returncode == 0 else ToolStatus.ERROR,
                output={
                    "result": output,
                    "errors": errors if errors else None
                },
                error=errors if process.returncode != 0 else None,
                execution_time_ms=(time.time() - start_time) * 1000,
                metadata={"operation": operation, "repo_path": repo_path}
            )

        except asyncio.TimeoutError:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.TIMEOUT,
                output=None,
                error="Git operation timed out",
                execution_time_ms=(time.time() - start_time) * 1000
            )
        except Exception as e:
            logger.error(f"Git operations error: {e}")
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.ERROR,
                output=None,
                error=str(e),
                execution_time_ms=(time.time() - start_time) * 1000
            )


class TerminalTool(BaseTool):
    """
    Terminal Tool - Execute safe shell commands.

    Security features:
    - Whitelist of allowed commands
    - No sudo/root operations
    - Timeout limits
    - Output sanitization
    """

    name = "terminal"
    description = """Execute shell commands in a controlled environment. Use this
    for system operations like checking disk space, listing processes, or running
    build commands. Only safe, whitelisted commands are allowed."""

    parameters_schema = {
        "type": "object",
        "properties": {
            "command": {
                "type": "string",
                "description": "Command to execute"
            },
            "working_dir": {
                "type": "string",
                "description": "Working directory",
                "default": "."
            },
            "timeout_seconds": {
                "type": "integer",
                "description": "Maximum execution time",
                "default": 30
            },
            "env": {
                "type": "object",
                "description": "Additional environment variables",
                "default": {}
            }
        },
        "required": ["command"]
    }

    # Whitelist of allowed command prefixes (security-hardened)
    # SECURITY NOTE: Removed dangerous commands:
    # - curl, wget: SSRF vulnerability
    # - docker, docker-compose: Container escape risk
    # - top: Interactive command
    # - awk: Code execution capability
    ALLOWED_COMMANDS = [
        "ls", "cat", "head", "tail", "grep", "find", "wc",
        "df", "du", "ps", "free", "uname", "whoami",
        "pwd", "echo", "date", "which", "file", "stat",
        "npm", "yarn", "pnpm", "pip", "python", "node",
        "make", "cargo", "go", "jq", "sort", "uniq", "cut"
    ]

    # Blocked patterns - expanded for better security
    BLOCKED_PATTERNS = [
        r"\bsudo\b", r"\brm\s+-rf", r"\bchmod\b", r"\bchown\b",
        r">\s*/", r"&>", r"\|.*sh\b", r"\beval\b",
        r"\bexec\b", r"\bkill\b", r"\bkillall\b", r"\bshutdown\b",
        r"\breboot\b", r"\bmkfs\b", r"\bdd\b", r"\bformat\b",
        r"\$\(", r"`",  # Command substitution
        r";\s*\w+",  # Command chaining
        r"&&\s*\w+",  # AND command chaining
        r"\|\|\s*\w+",  # OR command chaining
        r">\s*&",  # Redirect stderr
        r"2>&1",  # Redirect stderr to stdout
        r"<\(",  # Process substitution
    ]

    async def execute(
        self,
        command: str,
        working_dir: str = ".",
        timeout_seconds: int = 30,
        env: dict = None
    ) -> ToolResult:
        """Execute a shell command."""
        import time
        start_time = time.time()

        # Security checks
        cmd_base = command.split()[0] if command.split() else ""

        if cmd_base not in self.ALLOWED_COMMANDS:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.PERMISSION_DENIED,
                output=None,
                error=f"Command not allowed: {cmd_base}. Allowed: {', '.join(self.ALLOWED_COMMANDS[:10])}...",
                execution_time_ms=(time.time() - start_time) * 1000
            )

        for pattern in self.BLOCKED_PATTERNS:
            if re.search(pattern, command, re.IGNORECASE):
                return ToolResult(
                    tool_name=self.name,
                    status=ToolStatus.PERMISSION_DENIED,
                    output=None,
                    error=f"Blocked pattern detected in command",
                    execution_time_ms=(time.time() - start_time) * 1000
                )

        try:
            # Prepare environment
            run_env = os.environ.copy()
            if env:
                run_env.update(env)

            # SECURITY: Use create_subprocess_exec instead of shell to prevent injection
            # Split command into arguments safely using shlex
            import shlex
            try:
                cmd_args = shlex.split(command)
            except ValueError as e:
                return ToolResult(
                    tool_name=self.name,
                    status=ToolStatus.ERROR,
                    output=None,
                    error=f"Invalid command syntax: {e}",
                    execution_time_ms=(time.time() - start_time) * 1000
                )

            process = await asyncio.create_subprocess_exec(
                *cmd_args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=working_dir,
                env=run_env
            )

            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout_seconds
            )

            output = stdout.decode("utf-8")
            errors = stderr.decode("utf-8")

            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.SUCCESS if process.returncode == 0 else ToolStatus.ERROR,
                output={
                    "stdout": output[:10000],  # Limit output size
                    "stderr": errors[:2000] if errors else None,
                    "exit_code": process.returncode
                },
                error=errors if process.returncode != 0 else None,
                execution_time_ms=(time.time() - start_time) * 1000,
                metadata={"command": command[:100]}
            )

        except asyncio.TimeoutError:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.TIMEOUT,
                output=None,
                error=f"Command timed out after {timeout_seconds} seconds",
                execution_time_ms=(time.time() - start_time) * 1000
            )
        except Exception as e:
            logger.error(f"Terminal error: {e}")
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.ERROR,
                output=None,
                error=str(e),
                execution_time_ms=(time.time() - start_time) * 1000
            )


# Extended Tool Registry
KIAAN_EXTENDED_TOOLS: dict[str, BaseTool] = {
    "pytest_runner": PytestRunnerTool(),
    "linter": LinterTool(),
    "database_query": DatabaseQueryTool(),
    "api_tester": APITesterTool(),
    "git_operations": GitOperationsTool(),
    "terminal": TerminalTool(),
}


def get_extended_tool_schemas() -> list[dict]:
    """Get OpenAI function-calling schemas for extended tools."""
    return [tool.get_schema() for tool in KIAAN_EXTENDED_TOOLS.values()]


async def execute_extended_tool(tool_name: str, **kwargs) -> ToolResult:
    """Execute an extended tool by name."""
    from backend.services.kiaan_agent_tools import KIAAN_TOOLS, execute_tool

    # Check extended tools first
    if tool_name in KIAAN_EXTENDED_TOOLS:
        tool = KIAAN_EXTENDED_TOOLS[tool_name]
        return await tool.execute(**kwargs)

    # Fall back to base tools
    return await execute_tool(tool_name, **kwargs)


# Export
__all__ = [
    "PytestRunnerTool",
    "LinterTool",
    "DatabaseQueryTool",
    "APITesterTool",
    "GitOperationsTool",
    "TerminalTool",
    "KIAAN_EXTENDED_TOOLS",
    "get_extended_tool_schemas",
    "execute_extended_tool"
]
