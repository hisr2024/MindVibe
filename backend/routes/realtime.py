"""WebSocket endpoints for live journaling and mood streaming."""
from __future__ import annotations

import datetime
from typing import Any, Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.services.realtime import manager

router = APIRouter(prefix="/live", tags=["realtime"])


@router.websocket("/journal/{user_id}")
async def journal_stream(websocket: WebSocket, user_id: str) -> None:
    await manager.connect(user_id, websocket)
    try:
        await manager.broadcast(
            user_id,
            {
                "type": "presence",
                "at": datetime.datetime.utcnow().isoformat(),
                "message": "connected",
            },
        )
        while True:
            payload = await websocket.receive_json()
            await manager.broadcast(
                user_id,
                {
                    "type": payload.get("type", "journal"),
                    "data": payload.get("data", {}),
                    "at": datetime.datetime.utcnow().isoformat(),
                },
            )
    except WebSocketDisconnect:
        await manager.disconnect(user_id, websocket)
        await manager.broadcast(
            user_id,
            {
                "type": "presence",
                "at": datetime.datetime.utcnow().isoformat(),
                "message": "disconnected",
            },
        )


@router.get("/status/{user_id}")
async def live_status(user_id: str) -> Dict[str, Any]:
    connections = await manager.active_count(user_id)
    return {"user_id": user_id, "active_connections": connections}
