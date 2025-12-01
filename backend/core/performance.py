"""Request performance instrumentation for FastAPI."""
from __future__ import annotations

import asyncio
import statistics
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple


class PerformanceTracker:
    """Collect per-route latency metrics with bounded memory."""

    def __init__(self, window_size: int = 200) -> None:
        self.window_size = window_size
        self._latencies: dict[Tuple[str, str], Deque[float]] = defaultdict(
            lambda: deque(maxlen=self.window_size)
        )
        self._lock = asyncio.Lock()

    async def observe(self, path: str, method: str, duration_ms: float) -> None:
        async with self._lock:
            self._latencies[(path, method)].append(duration_ms)

    async def snapshot(self) -> Dict[str, Dict[str, float]]:
        async with self._lock:
            summary: Dict[str, Dict[str, float]] = {}
            for (path, method), samples in self._latencies.items():
                if not samples:
                    continue
                label = f"{method} {path}"
                summary[label] = {
                    "count": len(samples),
                    "p50_ms": statistics.median(samples),
                    "p95_ms": statistics.quantiles(samples, n=100)[94]
                    if len(samples) >= 2
                    else samples[0],
                    "max_ms": max(samples),
                }
            return summary


performance_tracker = PerformanceTracker()


async def performance_middleware(request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    await performance_tracker.observe(request.url.path, request.method, duration_ms)
    response.headers["X-Request-Duration-ms"] = f"{duration_ms:.2f}"
    return response
