"""Shared database utility functions for scripts.

This module provides SSL-safe database connection utilities for all scripts.
It handles Render PostgreSQL self-signed certificates automatically.

Usage:
    from db_utils import create_ssl_engine, get_ssl_connect_args, get_asyncpg_ssl_context

    # For SQLAlchemy async engines
    engine = create_ssl_engine(database_url)

    # For direct asyncpg connections
    ssl_ctx = get_asyncpg_ssl_context()
    conn = await asyncpg.connect(db_url, ssl=ssl_ctx)
"""

import os
import ssl as ssl_module
from typing import Any, Dict, Optional
from urllib.parse import parse_qs, urlparse

from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine


def get_ssl_connect_args(db_url: str) -> Dict[str, Any]:
    """Build SSL connect args for asyncpg.

    Render PostgreSQL uses self-signed certificates, so we need to
    disable certificate verification while still using SSL encryption.

    IMPORTANT: On Render, we ALWAYS disable certificate verification
    because Render uses self-signed certificates that fail verification.

    Args:
        db_url: Database URL to parse for SSL settings

    Returns:
        Dictionary with SSL configuration for connect_args
    """
    parsed = urlparse(db_url)
    query_params = parse_qs(parsed.query)

    ssl_pref = (
        os.getenv("DB_SSL_MODE") or
        query_params.get("sslmode", [None])[0] or
        query_params.get("ssl", [None])[0]
    )

    # Auto-detect Render environment (Render sets RENDER=true)
    is_render = os.getenv("RENDER", "").lower() == "true"

    # CRITICAL: On Render, ALWAYS disable certificate verification
    # Render uses self-signed certificates that will fail verification
    if is_render:
        ssl_context = ssl_module.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl_module.CERT_NONE
        return {"ssl": ssl_context}

    # Default to 'require' (SSL without cert verification) for compatibility
    if not ssl_pref:
        ssl_pref = "require"

    ssl_pref = ssl_pref.lower()

    # Full verification (only for non-Render environments with proper certs)
    if ssl_pref in {"verify-ca", "verify-full"}:
        return {"ssl": ssl_module.create_default_context()}

    # Require SSL but skip certificate verification (for self-signed certs)
    if ssl_pref in {"require", "required", "require-no-verify", "true", "1"}:
        ssl_context = ssl_module.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl_module.CERT_NONE
        return {"ssl": ssl_context}

    # Disable SSL
    if ssl_pref in {"disable", "false", "0"}:
        return {"ssl": False}

    # Default: SSL without verification for compatibility
    ssl_context = ssl_module.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl_module.CERT_NONE
    return {"ssl": ssl_context}


def get_asyncpg_ssl_context(db_url: Optional[str] = None) -> Any:
    """Get SSL context for direct asyncpg connections.

    Args:
        db_url: Optional database URL to parse for SSL settings

    Returns:
        SSL context or False for asyncpg ssl parameter
    """
    ssl_args = get_ssl_connect_args(db_url or "")
    return ssl_args.get("ssl", False)


def normalize_database_url(db_url: str) -> str:
    """Normalize database URL for asyncpg compatibility.

    Converts postgres:// or postgresql:// to postgresql+asyncpg://

    Args:
        db_url: Original database URL

    Returns:
        Normalized URL for asyncpg
    """
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgresql://") and "asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return db_url


def create_ssl_engine(db_url: str, echo: bool = False, **kwargs) -> AsyncEngine:
    """Create an async SQLAlchemy engine with proper SSL configuration.

    This is the recommended way to create database engines in scripts.
    Automatically handles:
    - URL normalization (postgres:// -> postgresql+asyncpg://)
    - SSL configuration for Render self-signed certificates

    Args:
        db_url: Database URL
        echo: Whether to echo SQL statements
        **kwargs: Additional arguments passed to create_async_engine

    Returns:
        Configured AsyncEngine
    """
    normalized_url = normalize_database_url(db_url)

    return create_async_engine(
        normalized_url,
        echo=echo,
        connect_args=get_ssl_connect_args(normalized_url),
        **kwargs
    )


def get_sync_ssl_connect_args(db_url: str) -> Dict[str, Any]:
    """Build SSL connect args for synchronous psycopg2 connections.

    Args:
        db_url: Database URL to parse for SSL settings

    Returns:
        Dictionary with SSL configuration for connect_args
    """
    parsed = urlparse(db_url)
    query_params = parse_qs(parsed.query)

    ssl_pref = (
        os.getenv("DB_SSL_MODE") or
        query_params.get("sslmode", [None])[0] or
        query_params.get("ssl", [None])[0]
    )

    # Default to 'require' for Render compatibility
    if not ssl_pref:
        ssl_pref = "require"

    ssl_pref = ssl_pref.lower()

    # For psycopg2, we use sslmode parameter
    if ssl_pref in {"verify-ca", "verify-full"}:
        return {"sslmode": ssl_pref}

    if ssl_pref in {"require", "required", "require-no-verify", "true", "1"}:
        return {"sslmode": "require"}

    if ssl_pref in {"disable", "false", "0"}:
        return {"sslmode": "disable"}

    return {"sslmode": "require"}
