from pydantic import BaseModel, conint
from typing import Optional, List

class MoodIn(BaseModel):
    score: conint(ge=-2, le=2)
    tags: Optional[List[str]] = None
    note: Optional[str] = None

class MoodOut(MoodIn):
    id: int
    at: str

class BlobIn(BaseModel):
    blob_json: str

class BlobOut(BaseModel):
    id: int
    created_at: str
    blob_json: str

class ChatMessage(BaseModel):
    query: str
    language: Optional[str] = "en"  # "en", "hi", or "sa"

class VerseReference(BaseModel):
    chapter: int
    verse: int
    sanskrit: str
    english: str
    hindi: str
    principle: str
    theme: str
    relevance_score: float

class ChatResponse(BaseModel):
    response: str
    verses: List[VerseReference]
    language: str
