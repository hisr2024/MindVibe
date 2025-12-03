from __future__ import annotations

import html
import re
import time
from collections import defaultdict
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import SessionLocal, get_current_user, get_db
from backend.middleware.rate_limiter import limiter, CHAT_RATE_LIMIT
from backend.models import ChatMessage, ChatRoom, RoomParticipant, User
from backend.security.jwt import decode_access_token

router = APIRouter(prefix="/api/rooms", tags=["rooms"])

DEFAULT_ROOMS: list[dict[str, str]] = [
    {"slug": "grounding", "name": "Calm Grounding", "theme": "Gentle check-ins and deep breaths"},
    {"slug": "gratitude", "name": "Gratitude Garden", "theme": "Sharing what is going well today"},
    {"slug": "courage", "name": "Courage Circle", "theme": "Encouragement for challenging moments"},
    {"slug": "clarity", "name": "Clarity Corner", "theme": "Finding mental stillness"},
    {"slug": "compassion", "name": "Compassion Cave", "theme": "Self-kindness and acceptance"},
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


class ConnectionManager:
    def __init__(self) -> None:
        self.rooms: dict[str, set[WebSocket]] = defaultdict(set)
        self.user_lookup: dict[WebSocket, str] = {}

    async def connect(self, room_id: str, websocket: WebSocket, user_id: str) -> None:
        await websocket.accept()
        self.rooms[room_id].add(websocket)
        self.user_lookup[websocket] = user_id

    def disconnect(self, room_id: str, websocket: WebSocket) -> None:
        self.rooms[room_id].discard(websocket)
        self.user_lookup.pop(websocket, None)

    async def broadcast(self, room_id: str, payload: dict[str, Any]) -> None:
        websockets = list(self.rooms.get(room_id, set()))
        for connection in websockets:
            try:
                await connection.send_json(payload)
            except Exception:
                self.disconnect(room_id, connection)


manager = ConnectionManager()
user_message_timestamps: dict[str, list[float]] = defaultdict(list)


async def _ensure_rate_limit(user_id: str) -> None:
    now = time.time()
    window = 60
    user_message_timestamps[user_id] = [t for t in user_message_timestamps[user_id] if now - t < window]
    if len(user_message_timestamps[user_id]) >= 30:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded")
    user_message_timestamps[user_id].append(now)


async def _get_user(db: AsyncSession, user_id: str) -> Optional[User]:
    stmt = select(User).where(User.id == user_id, User.deleted_at.is_(None))
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def _get_room(db: AsyncSession, room_id: str) -> Optional[ChatRoom]:
    stmt = select(ChatRoom).where(ChatRoom.id == room_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def _participants(db: AsyncSession, room_id: str) -> List[dict[str, str]]:
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
    payload: Dict[str, str],
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    name = payload.get("name", "").strip()
    theme = payload.get("theme", "").strip()
    slug = payload.get("slug", "").strip().lower().replace(" ", "-")

    if not name or not theme:
        raise HTTPException(status_code=400, detail="Name and theme are required")
    if not slug:
        slug = re.sub(r"[^a-z0-9-]", "", name.lower().replace(" ", "-")) or str(int(time.time()))

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
    user_id: Optional[str] = Depends(get_current_user),
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
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
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
        await manager.broadcast(room_id, {"type": "participants", "participants": participants})
        await websocket.send_json({"type": "participants", "participants": participants})

        history = await recent_messages(room_id, db=db, limit=50, user_id=user_id)
        await websocket.send_json({"type": "history", "messages": history})

        try:
            while True:
                data = await websocket.receive_json()
                content = sanitize_message(data.get("content", ""))
                if not content:
                    await websocket.send_json({"type": "error", "message": "Message cannot be empty"})
                    continue
                if any(pattern.search(content) for pattern in PROHIBITED_PATTERNS):
                    await websocket.send_json({"type": "error", "message": "Message blocked for moderation"})
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
                {"type": "participants", "participants": await _participants(db, room_id)},
            )
