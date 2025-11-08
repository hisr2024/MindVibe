from pydantic import BaseModel, conint


class MoodIn(BaseModel):
    score: conint(ge=-2, le=2)
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
