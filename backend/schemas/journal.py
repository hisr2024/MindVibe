from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class EncryptedPayload(BaseModel):
    ciphertext: str = Field(..., description="Base64 ciphertext")
    iv: str = Field(..., description="Base64 IV")
    salt: str = Field(..., description="Base64 PBKDF2 salt")
    auth_tag: Optional[str] = Field(None, description="Optional auth tag for AES-GCM")
    algorithm: str = Field("AES-GCM", description="Symmetric cipher")
    key_version: Optional[str] = Field(None, description="Client-managed key version")


class JournalEntryCreate(BaseModel):
    entry_id: Optional[str] = Field(None, description="Client provided id for idempotency")
    title: Optional[EncryptedPayload] = None
    content: EncryptedPayload
    moods: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    search_tokens: Optional[List[str]] = Field(None, description="Hashed tokens for zero-knowledge search")
    client_updated_at: datetime


class JournalEntryUpdate(BaseModel):
    title: Optional[EncryptedPayload] = None
    content: Optional[EncryptedPayload] = None
    moods: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    search_tokens: Optional[List[str]] = None
    client_updated_at: datetime


class JournalEntryOut(BaseModel):
    id: str
    encrypted_title: Optional[EncryptedPayload | dict]
    encrypted_content: EncryptedPayload | dict
    moods: Optional[List[str]]
    tags: Optional[List[str]]
    client_updated_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class JournalSearchRequest(BaseModel):
    token_hashes: List[str] = Field(..., description="Client-supplied hashed tokens")
    limit: int = Field(20, ge=1, le=100)


class JournalAnalytics(BaseModel):
    total_entries: int
    last_entry_at: Optional[datetime]
    current_streak_days: int
    longest_streak_days: int


class SyncRequest(BaseModel):
    since: datetime = Field(..., description="Return entries updated since this timestamp")
    limit: int = Field(100, ge=1, le=250)


class SyncResponse(BaseModel):
    entries: List[JournalEntryOut]
    deleted: List[str]
    server_timestamp: datetime
