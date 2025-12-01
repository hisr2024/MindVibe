"""Structured logging helpers."""
from __future__ import annotations

import json
import logging
import time
from typing import Callable

from fastapi import Request


def configure_logging(level: int = logging.INFO) -> None:
    logging.basicConfig(
        level=level,
        format="%(message)s",
    )


async def log_request(request: Request, call_next: Callable):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    payload = {
        "event": "http_request",
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "duration_ms": int(duration * 1000),
    }
    logging.getLogger("mindvibe").info(json.dumps(payload))
    return response
