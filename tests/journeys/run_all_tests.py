#!/usr/bin/env python3
"""
MindVibe Wisdom Journeys - Enterprise Test Runner

A comprehensive, parallel-safe test runner for all Journeys functionality.
Supports concurrent execution by multiple users/CI pipelines.

Usage:
    python -m tests.journeys.run_all_tests [options]

Options:
    --parallel    Run tests in parallel (default)
    --sequential  Run tests sequentially
    --verbose     Show detailed output
    --category    Run specific category (api|service|data|security|perf|integration)
    --report      Generate HTML report
"""

import sys
import os
import time
import json
import uuid
import traceback
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable, Any
from dataclasses import dataclass, field

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


# ===========================================================================
# TEST FRAMEWORK
# ===========================================================================

@dataclass
class TestResult:
    """Result of a single test execution."""
    name: str
    category: str
    passed: bool
    duration_ms: float
    error: str | None = None
    details: dict = field(default_factory=dict)


@dataclass
class TestSuiteResult:
    """Result of a complete test suite execution."""
    suite_id: str
    started_at: datetime
    completed_at: datetime | None = None
    total_tests: int = 0
    passed: int = 0
    failed: int = 0
    skipped: int = 0
    results: list[TestResult] = field(default_factory=list)

    @property
    def pass_rate(self) -> float:
        if self.total_tests == 0:
            return 0.0
        return (self.passed / self.total_tests) * 100

    @property
    def duration_seconds(self) -> float:
        if not self.completed_at:
            return 0.0
        return (self.completed_at - self.started_at).total_seconds()


class TestRegistry:
    """Registry for all tests with parallel-safe execution."""

    def __init__(self):
        self.tests: dict[str, list[tuple[str, Callable]]] = {
            "api": [],
            "service": [],
            "data": [],
            "security": [],
            "performance": [],
            "integration": [],
            "concurrency": [],
            "edge_cases": [],
        }
        self.setup_hooks: list[Callable] = []
        self.teardown_hooks: list[Callable] = []

    def register(self, category: str, name: str):
        """Decorator to register a test function."""
        def decorator(func: Callable):
            self.tests[category].append((name, func))
            return func
        return decorator

    def setup(self, func: Callable):
        """Decorator to register a setup hook."""
        self.setup_hooks.append(func)
        return func

    def teardown(self, func: Callable):
        """Decorator to register a teardown hook."""
        self.teardown_hooks.append(func)
        return func

    def run_all(self, parallel: bool = True, categories: list[str] | None = None) -> TestSuiteResult:
        """Run all registered tests."""
        suite_id = f"journeys-test-{uuid.uuid4().hex[:8]}"
        result = TestSuiteResult(
            suite_id=suite_id,
            started_at=datetime.now()
        )

        # Run setup hooks
        for hook in self.setup_hooks:
            try:
                hook()
            except Exception as e:
                print(f"Setup hook failed: {e}")

        # Collect tests to run
        tests_to_run: list[tuple[str, str, Callable]] = []
        for category, test_list in self.tests.items():
            if categories and category not in categories:
                continue
            for name, func in test_list:
                tests_to_run.append((category, name, func))

        result.total_tests = len(tests_to_run)

        if parallel:
            results = self._run_parallel(tests_to_run)
        else:
            results = self._run_sequential(tests_to_run)

        result.results = results
        result.passed = sum(1 for r in results if r.passed)
        result.failed = sum(1 for r in results if not r.passed)
        result.completed_at = datetime.now()

        # Run teardown hooks
        for hook in self.teardown_hooks:
            try:
                hook()
            except Exception as e:
                print(f"Teardown hook failed: {e}")

        return result

    def _run_parallel(self, tests: list[tuple[str, str, Callable]]) -> list[TestResult]:
        """Run tests in parallel using thread pool."""
        results: list[TestResult] = []

        with ThreadPoolExecutor(max_workers=min(8, len(tests) or 1)) as executor:
            futures = {
                executor.submit(self._execute_test, cat, name, func): (cat, name)
                for cat, name, func in tests
            }

            for future in as_completed(futures):
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    cat, name = futures[future]
                    results.append(TestResult(
                        name=name,
                        category=cat,
                        passed=False,
                        duration_ms=0,
                        error=str(e)
                    ))

        return results

    def _run_sequential(self, tests: list[tuple[str, str, Callable]]) -> list[TestResult]:
        """Run tests sequentially."""
        results: list[TestResult] = []
        for cat, name, func in tests:
            result = self._execute_test(cat, name, func)
            results.append(result)
        return results

    def _execute_test(self, category: str, name: str, func: Callable) -> TestResult:
        """Execute a single test and capture result."""
        start_time = time.perf_counter()
        try:
            details = func() or {}
            duration_ms = (time.perf_counter() - start_time) * 1000
            return TestResult(
                name=name,
                category=category,
                passed=True,
                duration_ms=duration_ms,
                details=details if isinstance(details, dict) else {}
            )
        except AssertionError as e:
            duration_ms = (time.perf_counter() - start_time) * 1000
            return TestResult(
                name=name,
                category=category,
                passed=False,
                duration_ms=duration_ms,
                error=str(e)
            )
        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000
            return TestResult(
                name=name,
                category=category,
                passed=False,
                duration_ms=duration_ms,
                error=f"{type(e).__name__}: {e}\n{traceback.format_exc()}"
            )


# Global test registry - use singleton pattern to ensure same instance
# when module is run as __main__ vs imported as tests.journeys.run_all_tests
import sys

_REGISTRY_KEY = "tests.journeys._registry"

if _REGISTRY_KEY in sys.modules:
    registry = sys.modules[_REGISTRY_KEY]
else:
    registry = TestRegistry()
    sys.modules[_REGISTRY_KEY] = registry


# ===========================================================================
# TEST UTILITIES
# ===========================================================================

class TestContext:
    """Isolated context for each test to ensure parallel safety."""

    def __init__(self):
        self.test_id = uuid.uuid4().hex[:8]
        self.created_resources: list[tuple[str, Any]] = []

    def create_test_user_id(self) -> str:
        """Create a unique test user ID."""
        return f"test-user-{self.test_id}-{uuid.uuid4().hex[:4]}"

    def create_test_journey_id(self) -> str:
        """Create a unique test journey ID."""
        return f"test-journey-{self.test_id}-{uuid.uuid4().hex[:4]}"

    def track_resource(self, resource_type: str, resource_id: Any):
        """Track a created resource for cleanup."""
        self.created_resources.append((resource_type, resource_id))

    def cleanup(self):
        """Cleanup all tracked resources."""
        # In a real implementation, this would delete test data
        self.created_resources.clear()


def assert_equal(actual: Any, expected: Any, msg: str = ""):
    """Assert two values are equal with detailed error message."""
    if actual != expected:
        raise AssertionError(
            f"{msg}\nExpected: {expected!r}\nActual: {actual!r}"
        )


def assert_true(condition: bool, msg: str = ""):
    """Assert condition is true."""
    if not condition:
        raise AssertionError(msg or "Condition was False")


def assert_false(condition: bool, msg: str = ""):
    """Assert condition is false."""
    if condition:
        raise AssertionError(msg or "Condition was True")


def assert_in(item: Any, container: Any, msg: str = ""):
    """Assert item is in container."""
    if item not in container:
        raise AssertionError(
            f"{msg}\n{item!r} not found in {container!r}"
        )


def assert_not_in(item: Any, container: Any, msg: str = ""):
    """Assert item is not in container."""
    if item in container:
        raise AssertionError(
            f"{msg}\n{item!r} unexpectedly found in {container!r}"
        )


def assert_raises(exception_type: type, func: Callable, *args, **kwargs):
    """Assert that function raises expected exception."""
    try:
        func(*args, **kwargs)
        raise AssertionError(f"Expected {exception_type.__name__} to be raised")
    except exception_type:
        pass  # Expected


def assert_length(container: Any, expected_length: int, msg: str = ""):
    """Assert container has expected length."""
    actual_length = len(container)
    if actual_length != expected_length:
        raise AssertionError(
            f"{msg}\nExpected length: {expected_length}\nActual length: {actual_length}"
        )


def assert_range(value: float | int, min_val: float | int, max_val: float | int, msg: str = ""):
    """Assert value is within range (inclusive)."""
    if not (min_val <= value <= max_val):
        raise AssertionError(
            f"{msg}\nValue {value} not in range [{min_val}, {max_val}]"
        )


# ===========================================================================
# IMPORT ALL TEST MODULES
# ===========================================================================

def import_test_modules():
    """Import all test modules to register tests."""
    import importlib

    module_names = [
        "tests.journeys.test_api_endpoints",
        "tests.journeys.test_service_layer",
        "tests.journeys.test_data_integrity",
        "tests.journeys.test_security",
        "tests.journeys.test_performance",
        "tests.journeys.test_integration",
        "tests.journeys.test_concurrency",
        "tests.journeys.test_edge_cases",
    ]

    for name in module_names:
        try:
            importlib.import_module(name)
        except Exception as e:
            print(f"Failed to import {name}: {e}")


# ===========================================================================
# REPORT GENERATION
# ===========================================================================

def generate_report(result: TestSuiteResult, output_dir: Path) -> Path:
    """Generate HTML test report."""
    output_dir.mkdir(parents=True, exist_ok=True)
    report_path = output_dir / f"test-report-{result.suite_id}.html"

    # Group results by category
    by_category: dict[str, list[TestResult]] = {}
    for r in result.results:
        if r.category not in by_category:
            by_category[r.category] = []
        by_category[r.category].append(r)

    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>MindVibe Journeys Test Report - {result.suite_id}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #0d1117; color: #c9d1d9; }}
        h1 {{ color: #58a6ff; }}
        h2 {{ color: #8b949e; border-bottom: 1px solid #30363d; padding-bottom: 8px; }}
        .summary {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }}
        .stat {{ background: #161b22; padding: 20px; border-radius: 8px; text-align: center; }}
        .stat-value {{ font-size: 36px; font-weight: bold; }}
        .stat-label {{ color: #8b949e; margin-top: 8px; }}
        .passed {{ color: #3fb950; }}
        .failed {{ color: #f85149; }}
        .category {{ margin: 30px 0; }}
        .test {{ padding: 12px; margin: 8px 0; border-radius: 6px; background: #161b22; display: flex; justify-content: space-between; align-items: center; }}
        .test.pass {{ border-left: 4px solid #3fb950; }}
        .test.fail {{ border-left: 4px solid #f85149; }}
        .test-name {{ font-weight: 500; }}
        .test-duration {{ color: #8b949e; font-size: 14px; }}
        .error {{ background: #3d1f1f; padding: 12px; margin-top: 8px; border-radius: 4px; font-family: monospace; font-size: 12px; white-space: pre-wrap; }}
        .progress {{ height: 8px; background: #30363d; border-radius: 4px; overflow: hidden; margin: 20px 0; }}
        .progress-bar {{ height: 100%; background: linear-gradient(90deg, #3fb950 0%, #3fb950 var(--pass), #f85149 var(--pass)); }}
    </style>
</head>
<body>
    <h1>MindVibe Wisdom Journeys Test Report</h1>
    <p>Suite ID: {result.suite_id} | Generated: {result.completed_at.isoformat() if result.completed_at else 'N/A'}</p>

    <div class="summary">
        <div class="stat">
            <div class="stat-value">{result.total_tests}</div>
            <div class="stat-label">Total Tests</div>
        </div>
        <div class="stat">
            <div class="stat-value passed">{result.passed}</div>
            <div class="stat-label">Passed</div>
        </div>
        <div class="stat">
            <div class="stat-value failed">{result.failed}</div>
            <div class="stat-label">Failed</div>
        </div>
        <div class="stat">
            <div class="stat-value">{result.pass_rate:.1f}%</div>
            <div class="stat-label">Pass Rate</div>
        </div>
    </div>

    <div class="progress">
        <div class="progress-bar" style="--pass: {result.pass_rate}%"></div>
    </div>

    <p>Duration: {result.duration_seconds:.2f} seconds</p>
"""

    for category, tests in sorted(by_category.items()):
        passed_in_cat = sum(1 for t in tests if t.passed)
        html += f"""
    <div class="category">
        <h2>{category.upper()} ({passed_in_cat}/{len(tests)} passed)</h2>
"""
        for test in tests:
            status_class = "pass" if test.passed else "fail"
            status_icon = "✅" if test.passed else "❌"
            html += f"""
        <div class="test {status_class}">
            <div>
                <span class="test-name">{status_icon} {test.name}</span>
            </div>
            <div class="test-duration">{test.duration_ms:.2f}ms</div>
        </div>
"""
            if test.error:
                html += f'        <div class="error">{test.error}</div>\n'

        html += "    </div>\n"

    html += """
</body>
</html>
"""

    with open(report_path, "w") as f:
        f.write(html)

    return report_path


def print_results(result: TestSuiteResult, verbose: bool = False):
    """Print test results to console."""
    print("\n" + "=" * 70)
    print(f"  MINDVIBE WISDOM JOURNEYS - ENTERPRISE TEST SUITE")
    print(f"  Suite ID: {result.suite_id}")
    print("=" * 70)

    # Group by category
    by_category: dict[str, list[TestResult]] = {}
    for r in result.results:
        if r.category not in by_category:
            by_category[r.category] = []
        by_category[r.category].append(r)

    for category, tests in sorted(by_category.items()):
        passed = sum(1 for t in tests if t.passed)
        print(f"\n  [{category.upper()}] {passed}/{len(tests)} passed")

        if verbose:
            for test in tests:
                icon = "✅" if test.passed else "❌"
                print(f"    {icon} {test.name} ({test.duration_ms:.2f}ms)")
                if test.error and not test.passed:
                    for line in test.error.split("\n")[:3]:
                        print(f"       {line}")

    print("\n" + "-" * 70)
    print(f"  TOTAL: {result.passed}/{result.total_tests} passed ({result.pass_rate:.1f}%)")
    print(f"  DURATION: {result.duration_seconds:.2f} seconds")
    print("-" * 70)

    if result.failed > 0:
        print(f"\n  ❌ {result.failed} TEST(S) FAILED\n")
        for r in result.results:
            if not r.passed:
                print(f"    - [{r.category}] {r.name}")
                if r.error:
                    print(f"      Error: {r.error.split(chr(10))[0]}")
    else:
        print(f"\n  ✅ ALL {result.total_tests} TESTS PASSED!\n")


# ===========================================================================
# MAIN ENTRY POINT
# ===========================================================================

def main():
    """Main entry point for test runner."""
    import argparse

    parser = argparse.ArgumentParser(description="MindVibe Journeys Test Runner")
    parser.add_argument("--parallel", action="store_true", default=True, help="Run tests in parallel")
    parser.add_argument("--sequential", action="store_true", help="Run tests sequentially")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument("--category", "-c", action="append", help="Run specific category")
    parser.add_argument("--report", action="store_true", help="Generate HTML report")
    parser.add_argument("--output", "-o", default="test-reports", help="Report output directory")

    args = parser.parse_args()

    # Import test modules
    print("Loading test modules...")
    import_test_modules()
    total_tests = sum(len(v) for v in registry.tests.values())
    print(f"Loaded {total_tests} tests")

    # Run tests
    parallel = not args.sequential
    print(f"Running tests {'in parallel' if parallel else 'sequentially'}...")

    result = registry.run_all(
        parallel=parallel,
        categories=args.category
    )

    # Print results
    print_results(result, verbose=args.verbose)

    # Generate report if requested
    if args.report:
        report_path = generate_report(result, Path(args.output))
        print(f"Report generated: {report_path}")

    # Exit with appropriate code
    sys.exit(0 if result.failed == 0 else 1)


if __name__ == "__main__":
    main()
