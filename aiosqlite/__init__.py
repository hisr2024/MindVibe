"""Lightweight fallback implementation of aiosqlite for offline environments.

This stub mirrors the small subset of the ``aiosqlite`` API that SQLAlchemy
relies on when using the ``sqlite+aiosqlite`` dialect. It uses ``asyncio``
thread executors to wrap the standard ``sqlite3`` connection and cursor
objects so that calls remain non-blocking from the perspective of async
frameworks.

The real aiosqlite package should be preferred in production. This module is
only intended as a safe fallback when network access prevents installing the
upstream dependency, ensuring imports like ``create_async_engine`` do not fail
with ``ModuleNotFoundError``.
"""
from __future__ import annotations

import asyncio
import sqlite3
from types import TracebackType
from typing import Any, Iterable, Optional, Type

Row = sqlite3.Row
ConnectionType = sqlite3.Connection
CursorType = sqlite3.Cursor


async def _to_thread(func, *args, **kwargs):
    return await asyncio.to_thread(func, *args, **kwargs)


class Cursor:
    """Async wrapper around ``sqlite3.Cursor``."""

    def __init__(self, cursor: CursorType):
        self._cursor = cursor

    @property
    def rowcount(self) -> int:
        return self._cursor.rowcount

    @property
    def lastrowid(self) -> int:
        return self._cursor.lastrowid

    async def execute(self, sql: str, parameters: Iterable[Any] | None = None) -> "Cursor":
        await _to_thread(self._cursor.execute, sql, tuple(parameters or ()))
        return self

    async def executemany(self, sql: str, seq_of_parameters: Iterable[Iterable[Any]]) -> "Cursor":
        await _to_thread(self._cursor.executemany, sql, seq_of_parameters)
        return self

    async def fetchone(self) -> Any:
        return await _to_thread(self._cursor.fetchone)

    async def fetchmany(self, size: int | None = None) -> list[Any]:
        if size is None:
            return await _to_thread(self._cursor.fetchmany)
        return await _to_thread(self._cursor.fetchmany, size)

    async def fetchall(self) -> list[Any]:
        return await _to_thread(self._cursor.fetchall)

    def __aiter__(self):
        return self

    async def __anext__(self):
        row = await self.fetchone()
        if row is None:
            raise StopAsyncIteration
        return row

    async def close(self) -> None:
        await _to_thread(self._cursor.close)


class Connection:
    """Async wrapper around ``sqlite3.Connection`` with aiosqlite-like API."""

    def __init__(self, conn: ConnectionType):
        self._conn = conn

    @property
    def total_changes(self) -> int:
        return self._conn.total_changes

    @property
    def row_factory(self):
        return self._conn.row_factory

    @row_factory.setter
    def row_factory(self, factory):
        self._conn.row_factory = factory

    async def cursor(self) -> Cursor:
        cursor = await _to_thread(self._conn.cursor)
        return Cursor(cursor)

    async def execute(self, sql: str, parameters: Iterable[Any] | None = None) -> Cursor:
        cur = await self.cursor()
        await cur.execute(sql, parameters)
        return cur

    async def executemany(self, sql: str, seq_of_parameters: Iterable[Iterable[Any]]) -> Cursor:
        cur = await self.cursor()
        await cur.executemany(sql, seq_of_parameters)
        return cur

    async def executescript(self, script: str) -> Cursor:
        cur = await self.cursor()
        await _to_thread(cur._cursor.executescript, script)
        return cur

    async def commit(self) -> None:
        await _to_thread(self._conn.commit)

    async def rollback(self) -> None:
        await _to_thread(self._conn.rollback)

    async def close(self) -> None:
        await _to_thread(self._conn.close)

    async def __aenter__(self) -> "Connection":
        return self

    async def __aexit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc: Optional[BaseException],
        tb: Optional[TracebackType],
    ) -> None:
        if exc:
            await self.rollback()
        else:
            await self.commit()
        await self.close()


async def connect(*args, **kwargs) -> Connection:
    """Create a new async connection using ``sqlite3.connect`` under the hood."""

    conn = await _to_thread(sqlite3.connect, *args, **kwargs)
    return Connection(conn)


__all__ = [
    "Connection",
    "Cursor",
    "Row",
    "connect",
]
# DB-API 2.0 compatibility attributes expected by SQLAlchemy's dialect
apilevel = "2.0"
threadsafety = 1
paramstyle = "qmark"

# Expose sqlite3 exceptions so dialect attribute lookups succeed
Error = sqlite3.Error
Warning = sqlite3.Warning
InterfaceError = sqlite3.InterfaceError
DatabaseError = sqlite3.DatabaseError
DataError = sqlite3.DataError
OperationalError = sqlite3.OperationalError
IntegrityError = sqlite3.IntegrityError
InternalError = sqlite3.InternalError
ProgrammingError = sqlite3.ProgrammingError
NotSupportedError = sqlite3.NotSupportedError
sqlite_version = sqlite3.sqlite_version
sqlite_version_info = sqlite3.sqlite_version_info
version = sqlite3.version
version_info = sqlite3.version_info
