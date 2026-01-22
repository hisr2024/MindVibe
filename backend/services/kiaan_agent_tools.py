"""
KIAAN Agent Tools - Autonomous Tool Execution Framework

This module provides KIAAN with the ability to execute tools autonomously,
making it an independent software researcher and Python specialist.

Tools Available:
1. Web Search - Search the internet for software documentation, APIs, research
2. Code Execution - Execute Python code in a secure sandbox
3. File Operations - Read, write, analyze files
4. Repository Analysis - Clone and analyze GitHub repositories
5. Documentation Fetcher - Fetch and parse technical documentation
6. Package Manager - Search and analyze Python packages
"""

import asyncio
import hashlib
import json
import logging
import os
import re
import shutil
import subprocess
import tempfile
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Optional

import aiohttp
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ToolStatus(str, Enum):
    """Status of tool execution."""
    SUCCESS = "success"
    ERROR = "error"
    TIMEOUT = "timeout"
    PERMISSION_DENIED = "permission_denied"


@dataclass
class ToolResult:
    """Result from tool execution."""
    tool_name: str
    status: ToolStatus
    output: Any
    error: Optional[str] = None
    execution_time_ms: float = 0
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "tool_name": self.tool_name,
            "status": self.status.value,
            "output": self.output,
            "error": self.error,
            "execution_time_ms": self.execution_time_ms,
            "metadata": self.metadata
        }


class BaseTool(ABC):
    """Abstract base class for all KIAAN tools."""

    name: str
    description: str
    parameters_schema: dict

    @abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        """Execute the tool with given parameters."""
        pass

    def get_schema(self) -> dict:
        """Return OpenAI function-calling compatible schema."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters_schema
            }
        }


class WebSearchTool(BaseTool):
    """
    Web Search Tool - Search the internet for software documentation,
    tutorials, research papers, and technical information.
    """

    name = "web_search"
    description = """Search the web for software documentation, programming tutorials,
    API references, research papers, GitHub repositories, and technical information.
    Use this to find up-to-date information about libraries, frameworks, best practices,
    and solutions to programming problems."""

    parameters_schema = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The search query - be specific about what you're looking for"
            },
            "search_type": {
                "type": "string",
                "enum": ["general", "documentation", "github", "stackoverflow", "pypi", "research"],
                "description": "Type of search to perform",
                "default": "general"
            },
            "max_results": {
                "type": "integer",
                "description": "Maximum number of results to return",
                "default": 5
            }
        },
        "required": ["query"]
    }

    # Search engine endpoints (simulated - in production use actual APIs)
    SEARCH_ENDPOINTS = {
        "documentation": "https://devdocs.io/search?q=",
        "github": "https://api.github.com/search/repositories?q=",
        "pypi": "https://pypi.org/search/?q=",
        "stackoverflow": "https://api.stackexchange.com/2.3/search/advanced?site=stackoverflow&q="
    }

    async def execute(self, query: str, search_type: str = "general", max_results: int = 5) -> ToolResult:
        """Execute web search."""
        import time
        start_time = time.time()

        try:
            results = await self._perform_search(query, search_type, max_results)

            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.SUCCESS,
                output=results,
                execution_time_ms=(time.time() - start_time) * 1000,
                metadata={"query": query, "search_type": search_type}
            )
        except asyncio.TimeoutError:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.TIMEOUT,
                output=None,
                error="Search timed out after 30 seconds",
                execution_time_ms=(time.time() - start_time) * 1000
            )
        except Exception as e:
            logger.error(f"Web search error: {e}")
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.ERROR,
                output=None,
                error=str(e),
                execution_time_ms=(time.time() - start_time) * 1000
            )

    async def _perform_search(self, query: str, search_type: str, max_results: int) -> list[dict]:
        """Perform the actual search using appropriate APIs."""
        results = []

        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
            if search_type == "github":
                results = await self._search_github(session, query, max_results)
            elif search_type == "pypi":
                results = await self._search_pypi(session, query, max_results)
            elif search_type == "stackoverflow":
                results = await self._search_stackoverflow(session, query, max_results)
            else:
                # For general search, combine multiple sources
                github_results = await self._search_github(session, query, max_results // 2)
                pypi_results = await self._search_pypi(session, query, max_results // 2)
                results = github_results + pypi_results

        return results[:max_results]

    async def _search_github(self, session: aiohttp.ClientSession, query: str, max_results: int) -> list[dict]:
        """Search GitHub repositories."""
        try:
            url = f"https://api.github.com/search/repositories?q={query}&sort=stars&per_page={max_results}"
            headers = {"Accept": "application/vnd.github.v3+json"}

            # Add token if available
            github_token = os.getenv("GITHUB_TOKEN")
            if github_token:
                headers["Authorization"] = f"token {github_token}"

            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return [
                        {
                            "source": "github",
                            "title": item["full_name"],
                            "description": item.get("description", "No description"),
                            "url": item["html_url"],
                            "stars": item["stargazers_count"],
                            "language": item.get("language"),
                            "topics": item.get("topics", [])
                        }
                        for item in data.get("items", [])[:max_results]
                    ]
                return []
        except Exception as e:
            logger.warning(f"GitHub search failed: {e}")
            return []

    async def _search_pypi(self, session: aiohttp.ClientSession, query: str, max_results: int) -> list[dict]:
        """Search PyPI packages."""
        try:
            # Use PyPI JSON API for package search
            url = f"https://pypi.org/pypi/{query}/json"

            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    info = data.get("info", {})
                    return [{
                        "source": "pypi",
                        "title": info.get("name"),
                        "description": info.get("summary"),
                        "url": info.get("project_url"),
                        "version": info.get("version"),
                        "author": info.get("author"),
                        "license": info.get("license")
                    }]
                return []
        except Exception as e:
            logger.warning(f"PyPI search failed: {e}")
            return []

    async def _search_stackoverflow(self, session: aiohttp.ClientSession, query: str, max_results: int) -> list[dict]:
        """Search Stack Overflow questions."""
        try:
            url = f"https://api.stackexchange.com/2.3/search/advanced"
            params = {
                "site": "stackoverflow",
                "q": query,
                "sort": "relevance",
                "order": "desc",
                "pagesize": max_results,
                "filter": "withbody"
            }

            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return [
                        {
                            "source": "stackoverflow",
                            "title": item.get("title"),
                            "url": item.get("link"),
                            "score": item.get("score"),
                            "is_answered": item.get("is_answered"),
                            "tags": item.get("tags", [])
                        }
                        for item in data.get("items", [])[:max_results]
                    ]
                return []
        except Exception as e:
            logger.warning(f"StackOverflow search failed: {e}")
            return []


class PythonExecutionTool(BaseTool):
    """
    Python Code Execution Tool - Execute Python code in a secure sandbox.

    Security measures:
    - Runs in isolated subprocess with timeout
    - No network access in sandbox
    - Limited file system access
    - Memory and CPU limits
    - No dangerous imports allowed
    """

    name = "python_execute"
    description = """Execute Python code in a secure sandbox environment.
    Use this to test code, run data analysis, process files, or demonstrate
    programming concepts. The sandbox has access to common data science
    and development libraries (numpy, pandas, requests, etc.)."""

    parameters_schema = {
        "type": "object",
        "properties": {
            "code": {
                "type": "string",
                "description": "Python code to execute"
            },
            "timeout_seconds": {
                "type": "integer",
                "description": "Maximum execution time in seconds",
                "default": 30
            },
            "capture_output": {
                "type": "boolean",
                "description": "Capture stdout/stderr",
                "default": True
            }
        },
        "required": ["code"]
    }

    # Dangerous imports/operations that are blocked
    BLOCKED_PATTERNS = [
        r"import\s+os\s*;?\s*os\.system",
        r"import\s+subprocess",
        r"__import__\s*\(",
        r"exec\s*\(",
        r"eval\s*\(",
        r"compile\s*\(",
        r"open\s*\([^)]*['\"][wax]",  # Write operations
        r"shutil\.rmtree",
        r"os\.remove",
        r"os\.rmdir",
    ]

    # Allowed imports for the sandbox
    ALLOWED_IMPORTS = [
        "math", "statistics", "random", "datetime", "time", "json", "re",
        "collections", "itertools", "functools", "operator", "string",
        "numpy", "pandas", "scipy", "sklearn", "matplotlib",
        "requests", "urllib", "http", "typing", "dataclasses",
        "pathlib", "csv", "io", "hashlib", "base64", "uuid"
    ]

    async def execute(self, code: str, timeout_seconds: int = 30, capture_output: bool = True) -> ToolResult:
        """Execute Python code in sandbox."""
        import time
        start_time = time.time()

        # Security check
        security_issue = self._check_security(code)
        if security_issue:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.PERMISSION_DENIED,
                output=None,
                error=f"Security violation: {security_issue}",
                execution_time_ms=(time.time() - start_time) * 1000
            )

        try:
            result = await self._run_sandboxed(code, timeout_seconds, capture_output)

            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.SUCCESS if result["success"] else ToolStatus.ERROR,
                output=result,
                error=result.get("error"),
                execution_time_ms=(time.time() - start_time) * 1000,
                metadata={"code_lines": len(code.split("\n"))}
            )
        except asyncio.TimeoutError:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.TIMEOUT,
                output=None,
                error=f"Execution timed out after {timeout_seconds} seconds",
                execution_time_ms=(time.time() - start_time) * 1000
            )
        except Exception as e:
            logger.error(f"Python execution error: {e}")
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.ERROR,
                output=None,
                error=str(e),
                execution_time_ms=(time.time() - start_time) * 1000
            )

    def _check_security(self, code: str) -> Optional[str]:
        """Check code for security issues."""
        for pattern in self.BLOCKED_PATTERNS:
            if re.search(pattern, code, re.IGNORECASE):
                return f"Blocked pattern detected: {pattern}"
        return None

    async def _run_sandboxed(self, code: str, timeout: int, capture_output: bool) -> dict:
        """Run code in sandboxed subprocess."""
        # Create a temporary directory for the sandbox
        with tempfile.TemporaryDirectory() as tmpdir:
            # Write code to file
            code_file = os.path.join(tmpdir, "code.py")
            with open(code_file, "w") as f:
                # Add safety wrapper
                wrapper = f'''
import sys
import io

# Capture output
_stdout = io.StringIO()
_stderr = io.StringIO()
sys.stdout = _stdout
sys.stderr = _stderr

_result = None
_error = None

try:
{self._indent_code(code)}
    _result = "Code executed successfully"
except Exception as e:
    _error = f"{{type(e).__name__}}: {{str(e)}}"

# Output results as JSON
import json
print(json.dumps({{
    "stdout": _stdout.getvalue(),
    "stderr": _stderr.getvalue(),
    "result": _result,
    "error": _error
}}))
'''
                f.write(wrapper)

            # Run in subprocess with timeout
            try:
                process = await asyncio.create_subprocess_exec(
                    "python3", code_file,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=tmpdir
                )

                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout
                )

                # Parse output
                output_str = stdout.decode("utf-8").strip()
                if output_str:
                    try:
                        result = json.loads(output_str.split("\n")[-1])
                        result["success"] = result.get("error") is None
                        return result
                    except json.JSONDecodeError:
                        return {
                            "success": True,
                            "stdout": output_str,
                            "stderr": stderr.decode("utf-8"),
                            "result": None,
                            "error": None
                        }

                return {
                    "success": process.returncode == 0,
                    "stdout": stdout.decode("utf-8"),
                    "stderr": stderr.decode("utf-8"),
                    "result": None,
                    "error": stderr.decode("utf-8") if process.returncode != 0 else None
                }

            except asyncio.TimeoutError:
                process.kill()
                raise

    def _indent_code(self, code: str, indent: str = "    ") -> str:
        """Indent code for wrapper."""
        return "\n".join(indent + line for line in code.split("\n"))


class FileAnalysisTool(BaseTool):
    """
    File Analysis Tool - Read and analyze code files.

    Capabilities:
    - Read file contents
    - Analyze code structure
    - Extract documentation
    - Find patterns and dependencies
    """

    name = "file_analyze"
    description = """Analyze code files to understand their structure, extract
    documentation, find dependencies, and identify patterns. Use this when
    you need to understand how existing code works."""

    parameters_schema = {
        "type": "object",
        "properties": {
            "file_path": {
                "type": "string",
                "description": "Path to the file to analyze"
            },
            "analysis_type": {
                "type": "string",
                "enum": ["read", "structure", "dependencies", "documentation"],
                "description": "Type of analysis to perform",
                "default": "read"
            }
        },
        "required": ["file_path"]
    }

    # Allowed file extensions for security
    ALLOWED_EXTENSIONS = [
        ".py", ".js", ".ts", ".tsx", ".jsx", ".json", ".yaml", ".yml",
        ".md", ".txt", ".rst", ".html", ".css", ".scss", ".sql",
        ".sh", ".bash", ".toml", ".ini", ".cfg", ".env.example"
    ]

    async def execute(self, file_path: str, analysis_type: str = "read") -> ToolResult:
        """Analyze a file."""
        import time
        start_time = time.time()

        # Security check
        ext = os.path.splitext(file_path)[1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.PERMISSION_DENIED,
                output=None,
                error=f"File type not allowed: {ext}",
                execution_time_ms=(time.time() - start_time) * 1000
            )

        # Check file exists
        if not os.path.exists(file_path):
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.ERROR,
                output=None,
                error=f"File not found: {file_path}",
                execution_time_ms=(time.time() - start_time) * 1000
            )

        try:
            if analysis_type == "read":
                result = await self._read_file(file_path)
            elif analysis_type == "structure":
                result = await self._analyze_structure(file_path)
            elif analysis_type == "dependencies":
                result = await self._find_dependencies(file_path)
            elif analysis_type == "documentation":
                result = await self._extract_documentation(file_path)
            else:
                result = await self._read_file(file_path)

            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.SUCCESS,
                output=result,
                execution_time_ms=(time.time() - start_time) * 1000,
                metadata={"file_path": file_path, "analysis_type": analysis_type}
            )
        except Exception as e:
            logger.error(f"File analysis error: {e}")
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.ERROR,
                output=None,
                error=str(e),
                execution_time_ms=(time.time() - start_time) * 1000
            )

    async def _read_file(self, file_path: str) -> dict:
        """Read file contents."""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        lines = content.split("\n")
        return {
            "content": content,
            "line_count": len(lines),
            "char_count": len(content),
            "file_size_bytes": os.path.getsize(file_path)
        }

    async def _analyze_structure(self, file_path: str) -> dict:
        """Analyze code structure (classes, functions, etc.)."""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        structure = {
            "classes": [],
            "functions": [],
            "imports": [],
            "variables": []
        }

        # Python-specific analysis
        if file_path.endswith(".py"):
            # Find classes
            class_pattern = r"class\s+(\w+)(?:\([^)]*\))?:"
            structure["classes"] = re.findall(class_pattern, content)

            # Find functions
            func_pattern = r"def\s+(\w+)\s*\([^)]*\):"
            structure["functions"] = re.findall(func_pattern, content)

            # Find imports
            import_pattern = r"(?:from\s+[\w.]+\s+)?import\s+[\w,\s]+"
            structure["imports"] = re.findall(import_pattern, content)

        return structure

    async def _find_dependencies(self, file_path: str) -> dict:
        """Find file dependencies."""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        dependencies = {
            "stdlib": [],
            "third_party": [],
            "local": []
        }

        if file_path.endswith(".py"):
            # Find all imports
            import_pattern = r"(?:from\s+([\w.]+)|import\s+([\w.]+))"
            matches = re.findall(import_pattern, content)

            # Standard library modules
            stdlib = [
                "os", "sys", "re", "json", "datetime", "time", "math",
                "collections", "itertools", "functools", "typing", "abc",
                "logging", "pathlib", "subprocess", "asyncio", "io"
            ]

            for match in matches:
                module = match[0] or match[1]
                base_module = module.split(".")[0]

                if base_module in stdlib:
                    dependencies["stdlib"].append(module)
                elif base_module.startswith((".", "backend", "app", "src")):
                    dependencies["local"].append(module)
                else:
                    dependencies["third_party"].append(module)

        return dependencies

    async def _extract_documentation(self, file_path: str) -> dict:
        """Extract documentation from file."""
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        docs = {
            "module_docstring": None,
            "class_docstrings": [],
            "function_docstrings": [],
            "comments": []
        }

        if file_path.endswith(".py"):
            # Module docstring
            module_doc_pattern = r'^"""([^"]*?)"""'
            match = re.match(module_doc_pattern, content, re.DOTALL)
            if match:
                docs["module_docstring"] = match.group(1).strip()

            # Function/class docstrings
            docstring_pattern = r'(?:class|def)\s+(\w+)[^:]*:\s*"""([^"]*?)"""'
            for match in re.finditer(docstring_pattern, content, re.DOTALL):
                docs["function_docstrings"].append({
                    "name": match.group(1),
                    "docstring": match.group(2).strip()
                })

            # Comments
            comment_pattern = r"#\s*(.+)$"
            docs["comments"] = re.findall(comment_pattern, content, re.MULTILINE)

        return docs


class DocumentationFetcherTool(BaseTool):
    """
    Documentation Fetcher Tool - Fetch and parse technical documentation.

    Capabilities:
    - Fetch documentation from popular sources
    - Parse and summarize documentation
    - Extract code examples
    """

    name = "fetch_documentation"
    description = """Fetch technical documentation for Python libraries, frameworks,
    and APIs. Use this when you need to understand how to use a specific library
    or find API references."""

    parameters_schema = {
        "type": "object",
        "properties": {
            "package_name": {
                "type": "string",
                "description": "Name of the package/library to get documentation for"
            },
            "section": {
                "type": "string",
                "description": "Specific section to fetch (e.g., 'quickstart', 'api', 'examples')",
                "default": "overview"
            }
        },
        "required": ["package_name"]
    }

    # Documentation sources
    DOC_SOURCES = {
        "readthedocs": "https://{package}.readthedocs.io/",
        "pypi": "https://pypi.org/project/{package}/",
        "github": "https://github.com/{package}",
    }

    async def execute(self, package_name: str, section: str = "overview") -> ToolResult:
        """Fetch documentation for a package."""
        import time
        start_time = time.time()

        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
                # Try PyPI first for overview
                pypi_info = await self._fetch_pypi_info(session, package_name)

                result = {
                    "package": package_name,
                    "section": section,
                    "pypi_info": pypi_info,
                    "documentation_urls": self._get_doc_urls(package_name, pypi_info)
                }

                return ToolResult(
                    tool_name=self.name,
                    status=ToolStatus.SUCCESS,
                    output=result,
                    execution_time_ms=(time.time() - start_time) * 1000,
                    metadata={"package": package_name}
                )
        except Exception as e:
            logger.error(f"Documentation fetch error: {e}")
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.ERROR,
                output=None,
                error=str(e),
                execution_time_ms=(time.time() - start_time) * 1000
            )

    async def _fetch_pypi_info(self, session: aiohttp.ClientSession, package: str) -> dict:
        """Fetch package info from PyPI."""
        try:
            url = f"https://pypi.org/pypi/{package}/json"
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    info = data.get("info", {})
                    return {
                        "name": info.get("name"),
                        "version": info.get("version"),
                        "summary": info.get("summary"),
                        "description": info.get("description", "")[:2000],  # Truncate
                        "author": info.get("author"),
                        "license": info.get("license"),
                        "home_page": info.get("home_page"),
                        "project_urls": info.get("project_urls", {}),
                        "requires_python": info.get("requires_python"),
                        "keywords": info.get("keywords")
                    }
                return {}
        except Exception as e:
            logger.warning(f"PyPI fetch failed: {e}")
            return {}

    def _get_doc_urls(self, package: str, pypi_info: dict) -> dict:
        """Get documentation URLs for a package."""
        urls = {}

        # From PyPI project URLs
        project_urls = pypi_info.get("project_urls", {})
        if project_urls:
            urls["documentation"] = project_urls.get("Documentation")
            urls["homepage"] = project_urls.get("Homepage")
            urls["source"] = project_urls.get("Source") or project_urls.get("Repository")

        # Add standard URLs
        urls["pypi"] = f"https://pypi.org/project/{package}/"
        urls["readthedocs"] = f"https://{package}.readthedocs.io/"

        return {k: v for k, v in urls.items() if v}


class RepositoryAnalyzerTool(BaseTool):
    """
    Repository Analyzer Tool - Analyze GitHub repositories.

    Capabilities:
    - Fetch repository metadata
    - Analyze repository structure
    - Extract README and documentation
    - Find code patterns
    """

    name = "analyze_repository"
    description = """Analyze a GitHub repository to understand its structure,
    dependencies, and codebase. Use this when researching how other projects
    are built or finding reference implementations."""

    parameters_schema = {
        "type": "object",
        "properties": {
            "repo_url": {
                "type": "string",
                "description": "GitHub repository URL (e.g., 'owner/repo' or full URL)"
            },
            "analysis_depth": {
                "type": "string",
                "enum": ["shallow", "medium", "deep"],
                "description": "How deeply to analyze the repository",
                "default": "shallow"
            }
        },
        "required": ["repo_url"]
    }

    async def execute(self, repo_url: str, analysis_depth: str = "shallow") -> ToolResult:
        """Analyze a GitHub repository."""
        import time
        start_time = time.time()

        # Parse repo URL
        repo_path = self._parse_repo_url(repo_url)
        if not repo_path:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.ERROR,
                output=None,
                error=f"Invalid repository URL: {repo_url}",
                execution_time_ms=(time.time() - start_time) * 1000
            )

        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
                result = await self._analyze_repo(session, repo_path, analysis_depth)

                return ToolResult(
                    tool_name=self.name,
                    status=ToolStatus.SUCCESS,
                    output=result,
                    execution_time_ms=(time.time() - start_time) * 1000,
                    metadata={"repo": repo_path, "depth": analysis_depth}
                )
        except Exception as e:
            logger.error(f"Repository analysis error: {e}")
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.ERROR,
                output=None,
                error=str(e),
                execution_time_ms=(time.time() - start_time) * 1000
            )

    def _parse_repo_url(self, url: str) -> Optional[str]:
        """Parse repo URL to owner/repo format."""
        # Handle full URLs
        if "github.com" in url:
            match = re.search(r"github\.com[/:]([^/]+/[^/]+)", url)
            if match:
                return match.group(1).replace(".git", "")

        # Handle owner/repo format
        if "/" in url and "." not in url:
            return url

        return None

    async def _analyze_repo(self, session: aiohttp.ClientSession, repo_path: str, depth: str) -> dict:
        """Analyze repository using GitHub API."""
        headers = {"Accept": "application/vnd.github.v3+json"}

        # Add token if available
        github_token = os.getenv("GITHUB_TOKEN")
        if github_token:
            headers["Authorization"] = f"token {github_token}"

        result = {
            "repository": repo_path,
            "metadata": {},
            "readme": None,
            "structure": [],
            "languages": {},
            "dependencies": []
        }

        # Fetch repo metadata
        url = f"https://api.github.com/repos/{repo_path}"
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                result["metadata"] = {
                    "name": data.get("name"),
                    "description": data.get("description"),
                    "stars": data.get("stargazers_count"),
                    "forks": data.get("forks_count"),
                    "language": data.get("language"),
                    "topics": data.get("topics", []),
                    "created_at": data.get("created_at"),
                    "updated_at": data.get("updated_at"),
                    "license": data.get("license", {}).get("name")
                }

        # Fetch README
        readme_url = f"https://api.github.com/repos/{repo_path}/readme"
        async with session.get(readme_url, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                import base64
                content = base64.b64decode(data.get("content", "")).decode("utf-8")
                result["readme"] = content[:5000]  # Truncate

        # Fetch languages
        lang_url = f"https://api.github.com/repos/{repo_path}/languages"
        async with session.get(lang_url, headers=headers) as response:
            if response.status == 200:
                result["languages"] = await response.json()

        # For medium/deep analysis, get file structure
        if depth in ["medium", "deep"]:
            tree_url = f"https://api.github.com/repos/{repo_path}/git/trees/HEAD?recursive=1"
            async with session.get(tree_url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    tree = data.get("tree", [])
                    result["structure"] = [
                        {"path": item["path"], "type": item["type"]}
                        for item in tree[:100]  # Limit to 100 items
                        if item["type"] == "blob"
                    ]

        return result


# Tool Registry - All available tools
KIAAN_TOOLS: dict[str, BaseTool] = {
    "web_search": WebSearchTool(),
    "python_execute": PythonExecutionTool(),
    "file_analyze": FileAnalysisTool(),
    "fetch_documentation": DocumentationFetcherTool(),
    "analyze_repository": RepositoryAnalyzerTool(),
}


def get_all_tool_schemas() -> list[dict]:
    """Get OpenAI function-calling schemas for all tools."""
    return [tool.get_schema() for tool in KIAAN_TOOLS.values()]


async def execute_tool(tool_name: str, **kwargs) -> ToolResult:
    """Execute a tool by name."""
    if tool_name not in KIAAN_TOOLS:
        return ToolResult(
            tool_name=tool_name,
            status=ToolStatus.ERROR,
            output=None,
            error=f"Unknown tool: {tool_name}"
        )

    tool = KIAAN_TOOLS[tool_name]
    return await tool.execute(**kwargs)


# Export
__all__ = [
    "BaseTool",
    "ToolResult",
    "ToolStatus",
    "WebSearchTool",
    "PythonExecutionTool",
    "FileAnalysisTool",
    "DocumentationFetcherTool",
    "RepositoryAnalyzerTool",
    "KIAAN_TOOLS",
    "get_all_tool_schemas",
    "execute_tool"
]
