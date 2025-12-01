from typing import Annotated

from pydantic import BaseModel, Field

from pydantic import BaseModel, Field, field_validator

class MoodIn(BaseModel):
    score: Annotated[int, Field(ge=-2, le=2)]
    tags: list[str] | None = None
    note: str | None = None

class UserAuth(BaseModel):
    username: Annotated[str, Field(max_length=150)]
    password: Annotated[str, Field(min_length=8)]

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one digit.")
        if not any(char.isalpha() for char in value):
            raise ValueError("Password must contain at least one letter.")
        return value


class JournalEntry(BaseModel):
    title: Annotated[str, Field(max_length=200)]
    content: str
    created_at: str


class ContentPack(BaseModel):
    name: Annotated[str, Field(max_length=100)]
    entries: list[JournalEntry]


class WisdomVerse(BaseModel):
    reference: Annotated[str, Field(max_length=100)]
    text: str
    theme: Annotated[str, Field(max_length=50)]  # e.g. "inspiration", "motivation"


class BlobIn(BaseModel):
    blob_json: str


class BlobOut(BaseModel):
    id: int
    created_at: str
    blob_json: str


class MoodOut(BaseModel):
    id: int
    score: int
    tags: list[str] | None
    note: str | None
    at: str


class JournalEntryIn(BaseModel):
    title: Annotated[str, Field(max_length=200)]
    content: str
    mood_score: Annotated[int | None, Field(ge=-5, le=5)] = None
    tags: list[str] | None = None
    attachments: list[dict] | None = None


class JournalEntryOut(BaseModel):
    id: int
    entry_uuid: str
    title: str
    content: str
    mood_score: int | None
    tags: list[str] | None
    attachments: list[dict] | None
    created_at: str
    updated_at: str | None
    crisis: dict | None = None


class JournalExport(BaseModel):
    entries: list[JournalEntryOut]
