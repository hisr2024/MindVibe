"""Real-time streaming helpers for WebSocket sessions."""
from __future__ import annotations

import asyncio
from typing import Dict, Set

from fastapi import WebSocket


class ConnectionManager:
    """Manage per-user WebSocket connections for live journaling."""

    def __init__(self) -> None:
        self._connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.setdefault(user_id, set()).add(websocket)

    async def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            if user_id in self._connections and websocket in self._connections[user_id]:
                self._connections[user_id].remove(websocket)
                if not self._connections[user_id]:
                    del self._connections[user_id]

    async def broadcast(self, user_id: str, message: dict) -> None:
        async with self._lock:
            recipients = list(self._connections.get(user_id, set()))
        for connection in recipients:
            await connection.send_json(message)

    async def active_count(self, user_id: str | None = None) -> int:
        async with self._lock:
            if user_id is None:
                return sum(len(conns) for conns in self._connections.values())
            return len(self._connections.get(user_id, set()))


manager = ConnectionManager()
