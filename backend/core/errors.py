"""Centralized structured error responses."""
from __future__ import annotations

import json
import logging
import traceback
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.core.logging import request_id_ctx


def _request_id(request: Request) -> str:
    request_id = getattr(request.state, "request_id", None) or request.headers.get("x-request-id")
    if not request_id:
        request_id = uuid4().hex
    request.state.request_id = request_id
    request_id_ctx.set(request_id)
    return request_id


def _serialize_detail(detail: Any) -> dict[str, Any]:
    if isinstance(detail, dict):
        return detail
    return {"message": str(detail)}


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    request_id = _request_id(request)
    detail = _serialize_detail(getattr(exc, "detail", None))
    payload = {
        "error": {
            "code": exc.status_code,
            "message": detail.get("message") or "Request failed",
            "details": detail,
        },
        "request_id": request_id,
    }
    return JSONResponse(status_code=exc.status_code, content=payload)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = _request_id(request)
    payload = {
        "error": {
            "code": 422,
            "message": "Validation failed",
            "details": exc.errors(),
        },
        "request_id": request_id,
    }
    return JSONResponse(status_code=422, content=payload)


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = _request_id(request)
    logging.getLogger("mindvibe").error(
        json.dumps(
            {
                "event": "unhandled_exception",
                "request_id": request_id,
                "error": str(exc),
                "trace": traceback.format_exc(),
            }
        )
    )
    payload = {
        "error": {
            "code": 500,
            "message": "Unexpected server error",
        },
        "request_id": request_id,
    }
    return JSONResponse(status_code=500, content=payload)


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)


__all__ = [
    "register_exception_handlers",
    "http_exception_handler",
    "validation_exception_handler",
    "unhandled_exception_handler",
]
