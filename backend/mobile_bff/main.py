import asyncio
import os
from datetime import datetime

import httpx
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MindVibe Mobile BFF", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

KIAAN_API_BASE = os.getenv("KIAAN_API_URL", "http://localhost:8000")

@app.get("/mobile/health")
async def health_check():
    return {"status": "healthy", "service": "mobile-bff", "timestamp": datetime.now().isoformat()}

@app.get("/mobile/v1/chat/history")
async def get_chat_history(authorization: str | None = Header(None), limit: int = 50):
    if not authorization:
        raise HTTPException(401, "Authorization required")
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            r = await client.get(f"{KIAAN_API_BASE}/api/chat/history", headers={"Authorization": authorization})
            r.raise_for_status()
            data = r.json()
            messages = data.get("messages", [])
            return {"messages": messages[-limit:], "total_count": len(messages), "has_more": len(messages) > limit}
        except httpx.HTTPStatusError as e:
            raise HTTPException(e.response.status_code, str(e)) from e

@app.get("/mobile/v1/dashboard")
async def get_dashboard(authorization: str | None = Header(None)):
    if not authorization:
        raise HTTPException(401, "Authorization required")
    async with httpx.AsyncClient(timeout=30.0) as client:
        headers = {"Authorization": authorization}
        tasks = [
            client.get(f"{KIAAN_API_BASE}/api/moods", headers=headers),
            client.get(f"{KIAAN_API_BASE}/api/journal", headers=headers),
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        # Safely extract data from responses, handling both exceptions and failed responses
        moods = []
        journal = []

        if not isinstance(results[0], Exception):
            try:
                results[0].raise_for_status()
                moods = results[0].json().get("moods", [])[:7]
            except (httpx.HTTPStatusError, ValueError):
                pass  # Return empty array on error

        if not isinstance(results[1], Exception):
            try:
                results[1].raise_for_status()
                journal = results[1].json().get("entries", [])[:5]
            except (httpx.HTTPStatusError, ValueError):
                pass  # Return empty array on error

        return {"moods": moods, "journal": journal, "synced_at": datetime.now().isoformat()}

@app.post("/mobile/v1/chat")
async def send_chat(message: dict, authorization: str | None = Header(None)):
    if not authorization:
        raise HTTPException(401, "Authorization required")
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            r = await client.post(f"{KIAAN_API_BASE}/api/chat", headers={"Authorization": authorization}, json=message)
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(e.response.status_code, str(e)) from e
        except httpx.RequestError as e:
            raise HTTPException(503, f"Service unavailable: {str(e)}") from e
