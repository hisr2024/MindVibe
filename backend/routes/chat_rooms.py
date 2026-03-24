from __future__ import annotations

import asyncio
import html
import json
import logging
import re
import time
from collections import defaultdict
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.settings import settings
from backend.deps import SessionLocal, get_current_user, get_db
from backend.middleware.rate_limiter import CHAT_RATE_LIMIT, limiter
from backend.models import ChatMessage, ChatRoom, RoomParticipant, User
from backend.security.jwt import decode_access_token

ws_logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/rooms", tags=["rooms"])

DEFAULT_ROOMS: list[dict[str, str]] = [
    {
        "slug": "grounding",
        "name": "Calm Grounding",
        "theme": "Gentle check-ins and deep breaths",
    },
    {
        "slug": "gratitude",
        "name": "Gratitude Garden",
        "theme": "Sharing what is going well today",
    },
    {
        "slug": "courage",
        "name": "Courage Circle",
        "theme": "Encouragement for challenging moments",
    },
    {"slug": "clarity", "name": "Clarity Corner", "theme": "Finding mental stillness"},
    {
        "slug": "compassion",
        "name": "Compassion Cave",
        "theme": "Self-kindness and acceptance",
    },
]

PROHIBITED_PATTERNS = [
    re.compile(pattern, re.IGNORECASE)
    for pattern in [
        r"\b(?:fuck|shit|bitch|bastard|asshole|dick|cunt)\b",
        r"\b(?:kill|harm|violence)\b",
        r"\b(?:idiot|stupid|dumb|hate)\b",
    ]
]


def sanitize_message(text: str) -> str:
    cleaned = html.escape(text or "").strip()
    return cleaned[:2000]


class DistributedConnectionManager:
    """WebSocket connection manager with Redis Pub/Sub for multi-instance broadcast.

    In a single-instance deployment (or when Redis is unavailable), this behaves
    identically to the original in-memory ConnectionManager. When Redis is
    connected, messages are published to a per-room channel so that all instances
    can relay them to their local WebSocket connections.
    """

    def __init__(self) -> None:
        self.rooms: dict[str, set[WebSocket]] = defaultdict(set)
        self.user_lookup: dict[WebSocket, str] = {}
        self._instance_id: str = settings.INSTANCE_ID or "default"
        # Background tasks listening on Redis Pub/Sub per room
        self._listeners: dict[str, asyncio.Task] = {}

    async def _get_redis(self) -> Any:
        """Lazy-load the Redis cache singleton."""
        try:
            from backend.cache.redis_cache import get_redis_cache

            cache = await get_redis_cache()
            return cache if cache.is_connected else None
        except Exception:
            return None

    async def connect(self, room_id: str, websocket: WebSocket, user_id: str) -> None:
        await websocket.accept()
        self.rooms[room_id].add(websocket)
        self.user_lookup[websocket] = user_id

        # Start a Redis Pub/Sub listener for this room if not already running
        if room_id not in self._listeners or self._listeners[room_id].done():
            redis = await self._get_redis()
            if redis:
                self._listeners[room_id] = asyncio.create_task(
                    self._subscribe_to_room(room_id, redis)
                )

    def disconnect(self, room_id: str, websocket: WebSocket) -> None:
        self.rooms[room_id].discard(websocket)
        self.user_lookup.pop(websocket, None)

        # If no more local connections for this room, cancel the listener
        if not self.rooms.get(room_id):
            listener = self._listeners.pop(room_id, None)
            if listener and not listener.done():
                listener.cancel()

    async def broadcast(self, room_id: str, payload: dict[str, Any]) -> None:
        """Broadcast a message to all local connections AND publish to Redis."""
        # Always send to local connections first (low latency)
        await self._send_to_local(room_id, payload)

        # Publish to Redis so other instances can relay
        redis = await self._get_redis()
        if redis:
            envelope = json.dumps(
                {
                    "instance_id": self._instance_id,
                    "payload": payload,
                }
            )
            await redis.publish(f"chat:room:{room_id}", envelope)

    async def _send_to_local(self, room_id: str, payload: dict[str, Any]) -> None:
        """Send payload to all WebSocket connections on THIS instance."""
        websockets = list(self.rooms.get(room_id, set()))
        for connection in websockets:
            try:
                await connection.send_json(payload)
            except Exception:
                self.disconnect(room_id, connection)

    async def _subscribe_to_room(self, room_id: str, redis: Any) -> None:
        """Background task: listen on Redis Pub/Sub channel for a room.

        Messages from OTHER instances are relayed to local WebSocket connections.
        Messages from THIS instance are skipped (already sent locally).
        """
        channel = f"chat:room:{room_id}"
        pubsub = None
        try:
            pubsub = await redis.subscribe(channel)
            if pubsub is None:
                return

            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                try:
                    envelope = json.loads(message["data"])
                    # Skip messages from this instance (already broadcast locally)
                    if envelope.get("instance_id") == self._instance_id:
                        continue
                    await self._send_to_local(room_id, envelope["payload"])
                except (json.JSONDecodeError, KeyError):
                    ws_logger.warning(
                        "Malformed Pub/Sub message on channel %s", channel
                    )
        except asyncio.CancelledError:
            pass
        except Exception as e:
            ws_logger.warning(
                "Redis Pub/Sub listener error for room %s: %s", room_id, e
            )
        finally:
            if pubsub:
                try:
                    await pubsub.unsubscribe(channel)
                    await pubsub.aclose()
                except Exception:
                    pass


manager = DistributedConnectionManager()


async def _ensure_rate_limit(user_id: str) -> None:
    """Rate-limit WebSocket messages per user using Redis (distributed) or in-memory fallback."""
    window = 60
    limit = 30

    # Try Redis-backed rate limiting for cross-instance consistency
    try:
        from backend.cache.redis_cache import get_redis_cache

        redis = await get_redis_cache()
        if redis.is_connected:
            count = await redis.incr(f"ws_rate:{user_id}", expire_seconds=window)
            if count is not None and count > limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded",
                )
            if count is not None:
                return  # Redis handled it
    except HTTPException:
        raise
    except Exception:
        pass  # Fall through to in-memory

    # In-memory fallback (single-instance only)
    now = time.time()
    _user_message_timestamps[user_id] = [
        t for t in _user_message_timestamps[user_id] if now - t < window
    ]
    if len(_user_message_timestamps[user_id]) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded"
        )
    _user_message_timestamps[user_id].append(now)


# In-memory fallback for WebSocket rate limiting when Redis is unavailable
_user_message_timestamps: dict[str, list[float]] = defaultdict(list)


async def _get_user(db: AsyncSession, user_id: str) -> User | None:
    stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def _get_room(db: AsyncSession, room_id: str) -> ChatRoom | None:
    stmt = select(ChatRoom).where(ChatRoom.id == room_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def _participants(db: AsyncSession, room_id: str) -> list[dict[str, str]]:
    stmt = (
        select(RoomParticipant.user_id, User.email)
        .join(User, User.id == RoomParticipant.user_id)
        .where(RoomParticipant.room_id == room_id, RoomParticipant.left_at.is_(None))
    )
    result = await db.execute(stmt)
    participants = []
    for user_id, email in result.all():
        participants.append({"id": user_id, "label": email or "member"})
    return participants


async def _persist_participant(db: AsyncSession, room_id: str, user_id: str) -> None:
    stmt = select(RoomParticipant).where(
        RoomParticipant.room_id == room_id, RoomParticipant.user_id == user_id
    )
    result = await db.execute(stmt)
    participant = result.scalar_one_or_none()
    if participant:
        await db.execute(
            update(RoomParticipant)
            .where(RoomParticipant.id == participant.id)
            .values(left_at=None)
        )
    else:
        db.add(RoomParticipant(room_id=room_id, user_id=user_id))
    await db.commit()


async def _mark_left(db: AsyncSession, room_id: str, user_id: str) -> None:
    await db.execute(
        update(RoomParticipant)
        .where(RoomParticipant.room_id == room_id, RoomParticipant.user_id == user_id)
        .values(left_at=func.now())
    )
    await db.commit()


@router.get("", response_model=list[dict[str, Any]])
async def list_rooms(db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    existing_rooms = await db.execute(select(ChatRoom))
    if not existing_rooms.scalars().first():
        for room in DEFAULT_ROOMS:
            db.add(ChatRoom(name=room["name"], theme=room["theme"], slug=room["slug"]))
        await db.commit()

    stmt = (
        select(ChatRoom, func.count(RoomParticipant.id))
        .join(RoomParticipant, RoomParticipant.room_id == ChatRoom.id, isouter=True)
        .group_by(ChatRoom.id)
    )
    result = await db.execute(stmt)
    rooms: list[dict[str, Any]] = []
    for room, count in result.all():
        rooms.append(
            {
                "id": room.id,
                "slug": room.slug,
                "name": room.name,
                "theme": room.theme,
                "active_count": count,
            }
        )
    return rooms


@router.post("", status_code=status.HTTP_201_CREATED)
@limiter.limit(CHAT_RATE_LIMIT)
async def create_room(
    request: Request,
    payload: dict[str, str],
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    name = payload.get("name", "").strip()
    theme = payload.get("theme", "").strip()
    slug = payload.get("slug", "").strip().lower().replace(" ", "-")

    if not name or not theme:
        raise HTTPException(status_code=400, detail="Name and theme are required")
    if not slug:
        slug = re.sub(r"[^a-z0-9-]", "", name.lower().replace(" ", "-")) or str(
            int(time.time())
        )

    existing = await db.execute(select(ChatRoom).where(ChatRoom.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Room already exists")

    room = ChatRoom(name=name, theme=theme, slug=slug, created_by=user_id)
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return {"id": room.id, "slug": room.slug, "name": room.name, "theme": room.theme}


@router.post("/{room_id}/join")
@limiter.limit(CHAT_RATE_LIMIT)
async def join_room(
    request: Request,
    room_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    room = await _get_room(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    await _persist_participant(db, room_id, user_id)
    return {"status": "joined"}


@router.post("/{room_id}/leave")
@limiter.limit(CHAT_RATE_LIMIT)
async def leave_room(
    request: Request,
    room_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    await _mark_left(db, room_id, user_id)
    return {"status": "left"}


@router.get("/{room_id}/messages")
async def recent_messages(
    room_id: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user_id: str | None = Depends(get_current_user),
) -> list[dict[str, Any]]:
    room = await _get_room(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    stmt = (
        select(ChatMessage)
        .where(ChatMessage.room_id == room_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(min(limit, 200))
    )
    result = await db.execute(stmt)
    rows = list(reversed(result.scalars().all()))
    return [
        {
            "id": message.id,
            "room_id": message.room_id,
            "user_id": message.user_id,
            "content": message.content,
            "created_at": message.created_at.isoformat(),
            "flagged": message.flagged,
        }
        for message in rows
    ]


@router.websocket("/{room_id}/ws")
async def websocket_endpoint(websocket: WebSocket, room_id: str) -> None:
    """WebSocket endpoint for real-time chat.

    Security Note: Token authentication supports two methods:
    1. Sec-WebSocket-Protocol header (PREFERRED) - Token not logged
    2. Query parameter (DEPRECATED) - Token may appear in server logs

    Clients should migrate to header-based auth by sending token via
    Sec-WebSocket-Protocol: "access_token, <token_value>"
    """
    import logging

    ws_logger = logging.getLogger(__name__)

    token: str | None = None
    auth_method = "unknown"

    # PREFERRED: Try to get token from Sec-WebSocket-Protocol header first
    # Format: "access_token, <actual_token>"
    protocols = websocket.headers.get("sec-websocket-protocol", "")
    if protocols and "access_token" in protocols:
        # Parse protocol header: "access_token, eyJhbG..."
        parts = [p.strip() for p in protocols.split(",")]
        if len(parts) >= 2 and parts[0] == "access_token":
            token = parts[1]
            auth_method = "header"

    # Query parameter auth removed for security (tokens in URLs are logged)
    # Use Sec-WebSocket-Protocol header exclusively

    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        ws_logger.debug(f"WebSocket auth success via {auth_method}")
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    async with SessionLocal() as db:
        room = await _get_room(db, room_id)
        if not room:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user = await _get_user(db, user_id)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        await _persist_participant(db, room_id, user_id)
        await manager.connect(room_id, websocket, user_id)
        participants = await _participants(db, room_id)
        await manager.broadcast(
            room_id, {"type": "participants", "participants": participants}
        )
        await websocket.send_json(
            {"type": "participants", "participants": participants}
        )

        history = await recent_messages(room_id, db=db, limit=50, user_id=user_id)
        await websocket.send_json({"type": "history", "messages": history})

        try:
            while True:
                data = await websocket.receive_json()
                content = sanitize_message(data.get("content", ""))
                if not content:
                    await websocket.send_json(
                        {"type": "error", "message": "Message cannot be empty"}
                    )
                    continue
                if any(pattern.search(content) for pattern in PROHIBITED_PATTERNS):
                    await websocket.send_json(
                        {"type": "error", "message": "Message blocked for moderation"}
                    )
                    continue

                await _ensure_rate_limit(user_id)

                message = ChatMessage(room_id=room_id, user_id=user_id, content=content)
                db.add(message)
                await db.commit()
                await db.refresh(message)

                payload = {
                    "type": "message",
                    "id": message.id,
                    "room_id": room_id,
                    "user_id": user_id,
                    "content": message.content,
                    "created_at": message.created_at.isoformat(),
                }
                await manager.broadcast(room_id, payload)
        except WebSocketDisconnect:
            pass
        finally:
            await _mark_left(db, room_id, user_id)
            manager.disconnect(room_id, websocket)
            await manager.broadcast(
                room_id,
                {
                    "type": "participants",
                    "participants": await _participants(db, room_id),
                },
            )
