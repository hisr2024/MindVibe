import json
import os
from datetime import datetime

import asyncpg
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MindVibe Real-Time", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL")
active_connections: dict[str, set[WebSocket]] = {}
db_conn = None


async def setup_listeners():
    global db_conn
    try:
        db_conn = await asyncpg.connect(DATABASE_URL)

        async def on_mood(_conn, _pid, _channel, payload):
            data = json.loads(payload)
            user_id = str(data.get("user_id"))
            if user_id in active_connections:
                for ws in active_connections[user_id]:
                    try:
                        await ws.send_json(
                            {
                                "type": "mood_update",
                                "data": data,
                                "timestamp": datetime.now().isoformat(),
                            }
                        )
                    except Exception:
                        pass

        async def on_chat(_conn, _pid, _channel, payload):
            data = json.loads(payload)
            user_id = str(data.get("user_id"))
            if user_id in active_connections:
                for ws in active_connections[user_id]:
                    try:
                        await ws.send_json(
                            {
                                "type": "chat_message",
                                "data": data,
                                "timestamp": datetime.now().isoformat(),
                            }
                        )
                    except Exception:
                        pass

        await db_conn.add_listener("mood_events", on_mood)
        await db_conn.add_listener("chat_events", on_chat)
        print("✅ Database listeners active")
    except Exception as e:
        print(f"❌ Listener setup failed: {e}")


@app.on_event("startup")
async def startup():
    await setup_listeners()


@app.on_event("shutdown")
async def shutdown():
    if db_conn:
        await db_conn.close()


@app.get("/realtime/health")
async def health():
    return {
        "status": "healthy",
        "service": "realtime",
        "active_users": len(active_connections),
        "timestamp": datetime.now().isoformat(),
    }


@app.websocket("/realtime/ws")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    if user_id not in active_connections:
        active_connections[user_id] = set()
    active_connections[user_id].add(websocket)

    try:
        await websocket.send_json(
            {
                "type": "connected",
                "user_id": user_id,
                "timestamp": datetime.now().isoformat(),
            }
        )
        while True:
            _ = await websocket.receive_text()
            await websocket.send_json(
                {"type": "pong", "timestamp": datetime.now().isoformat()}
            )
    except WebSocketDisconnect:
        if user_id in active_connections:
            active_connections[user_id].discard(websocket)
            if not active_connections[user_id]:
                del active_connections[user_id]
