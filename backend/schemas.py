from typing import Annotated

from pydantic import BaseModel, Field


class MoodIn(BaseModel):
    score: Annotated[int, Field(ge=-2, le=2)]
    tags: list[str] | None = None
    note: str | None = None


class MoodOut(MoodIn):
    id: int
    at: str


class BlobIn(BaseModel):
    blob_json: str


class BlobOut(BaseModel):
    id: int
    created_at: str
    blob_json: str
