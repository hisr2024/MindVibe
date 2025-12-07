import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime

import asyncpg
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")
active_connections: dict[str, set[WebSocket]] = {}
db_conn = None


async def setup_listeners():
    """Set up PostgreSQL LISTEN connections for real-time events"""
    global db_conn
    try:
        db_conn = await asyncpg.connect(DATABASE_URL)

        async def on_mood(_conn, _pid, _channel, payload):
            data = json.loads(payload)
            user_id = str(data.get("user_id"))
            if user_id in active_connections:
                dead_connections = set()
                for ws in active_connections[user_id]:
                    try:
                        await ws.send_json(
                            {
                                "type": "mood_update",
                                "data": data,
                                "timestamp": datetime.now().isoformat(),
                            }
                        )
                    except Exception as e:
                        logger.warning(
                            f"Failed to send mood event to user {user_id}: {e}"
                        )
                        dead_connections.add(ws)

                # Clean up dead connections
                for ws in dead_connections:
                    active_connections[user_id].discard(ws)
                if not active_connections[user_id]:
                    del active_connections[user_id]

        async def on_chat(_conn, _pid, _channel, payload):
            data = json.loads(payload)
            user_id = str(data.get("user_id"))
            if user_id in active_connections:
                dead_connections = set()
                for ws in active_connections[user_id]:
                    try:
                        await ws.send_json(
                            {
                                "type": "chat_message",
                                "data": data,
                                "timestamp": datetime.now().isoformat(),
                            }
                        )
                    except Exception as e:
                        logger.warning(
                            f"Failed to send chat event to user {user_id}: {e}"
                        )
                        dead_connections.add(ws)

                # Clean up dead connections
                for ws in dead_connections:
                    active_connections[user_id].discard(ws)
                if not active_connections[user_id]:
                    del active_connections[user_id]

        await db_conn.add_listener("mood_events", on_mood)
        await db_conn.add_listener("chat_events", on_chat)
        logger.info("✅ Database listeners active")
    except Exception as e:
        logger.error(f"❌ Listener setup failed: {e}")


async def cleanup_listeners():
    """Clean up database connections"""
    global db_conn
    if db_conn:
        try:
            await db_conn.close()
            logger.info("✅ Database connection closed")
        except Exception as e:
            logger.error(f"❌ Error closing database connection: {e}")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    await setup_listeners()
    yield
    # Shutdown
    await cleanup_listeners()


app = FastAPI(title="MindVibe Real-Time", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    logger.info(f"User {user_id} connected. Active users: {len(active_connections)}")

    try:
        await websocket.send_json(
            {
                "type": "connected",
                "user_id": user_id,
                "timestamp": datetime.now().isoformat(),
            }
        )
        while True:
            message = await websocket.receive_text()
            # Validate message format - expect simple ping messages
            if message.strip().lower() in ["ping", "heartbeat"]:
                await websocket.send_json(
                    {"type": "pong", "timestamp": datetime.now().isoformat()}
                )
            else:
                # Log unexpected messages but still respond
                logger.debug(f"Unexpected message from user {user_id}: {message}")
                await websocket.send_json(
                    {"type": "pong", "timestamp": datetime.now().isoformat()}
                )
    except WebSocketDisconnect:
        if user_id in active_connections:
            active_connections[user_id].discard(websocket)
            if not active_connections[user_id]:
                del active_connections[user_id]
        logger.info(
            f"User {user_id} disconnected. Active users: {len(active_connections)}"
        )
