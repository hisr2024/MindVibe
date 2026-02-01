"""Local storage for Relationship Compass session history."""
from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Literal

DATA_DIR = Path("data") / "relationship_compass"
STORE_PATH = DATA_DIR / "store.json"


Role = Literal["user", "assistant"]


@dataclass
class CompassMessage:
    session_id: str
    role: Role
    content: str
    created_at: str
    citations: list[dict] | None = None


def _ensure_store() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not STORE_PATH.exists():
        STORE_PATH.write_text(json.dumps({"sessions": [], "messages": []}, indent=2))


def _read_store() -> dict:
    _ensure_store()
    raw = STORE_PATH.read_text(encoding="utf-8")
    parsed = json.loads(raw)
    return {
        "sessions": parsed.get("sessions", []),
        "messages": parsed.get("messages", []),
    }


def _write_store(store: dict) -> None:
    STORE_PATH.write_text(json.dumps(store, indent=2))


def ensure_session(session_id: str) -> None:
    store = _read_store()
    if not any(session.get("sessionId") == session_id for session in store["sessions"]):
        store["sessions"].append({"sessionId": session_id, "createdAt": datetime.utcnow().isoformat()})
        _write_store(store)


def append_message(message: CompassMessage) -> None:
    store = _read_store()
    store["messages"].append(
        {
            "sessionId": message.session_id,
            "role": message.role,
            "content": message.content,
            "createdAt": message.created_at,
            "citations": message.citations or [],
        }
    )
    _write_store(store)


def get_recent_messages(session_id: str, limit: int = 20) -> list[dict]:
    store = _read_store()
    messages = [msg for msg in store["messages"] if msg.get("sessionId") == session_id]
    return messages[-limit:]
