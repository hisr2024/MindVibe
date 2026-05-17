"""Local storage for Relationship Compass session history."""
from __future__ import annotations

import json
import threading
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Literal

DATA_DIR = Path("data") / "relationship_compass"
STORE_PATH = DATA_DIR / "store.json"

# Guard all file I/O against concurrent access
_store_lock = threading.Lock()

# Maximum messages retained in storage to prevent unbounded growth
MAX_STORED_MESSAGES = 500


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
    try:
        raw = STORE_PATH.read_text(encoding="utf-8")
        parsed = json.loads(raw)
    except (json.JSONDecodeError, OSError):
        parsed = {}
    return {
        "sessions": parsed.get("sessions", []),
        "messages": parsed.get("messages", []),
    }


def _write_store(store: dict) -> None:
    try:
        STORE_PATH.write_text(json.dumps(store, indent=2))
    except OSError:
        pass


def ensure_session(session_id: str) -> None:
    with _store_lock:
        store = _read_store()
        if not any(session.get("sessionId") == session_id for session in store["sessions"]):
            store["sessions"].append({"sessionId": session_id, "createdAt": datetime.utcnow().isoformat()})
            _write_store(store)


def append_message(message: CompassMessage) -> None:
    with _store_lock:
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
        # Trim to prevent unbounded growth
        if len(store["messages"]) > MAX_STORED_MESSAGES:
            store["messages"] = store["messages"][-MAX_STORED_MESSAGES:]
        _write_store(store)


def get_recent_messages(session_id: str, limit: int = 20) -> list[dict]:
    with _store_lock:
        store = _read_store()
    messages = [msg for msg in store["messages"] if msg.get("sessionId") == session_id]
    return messages[-limit:]
