from pydantic import BaseModel, constr, conint, validator

class UserAuth(BaseModel):
    username: constr(max_length=150)
    password: constr(min_length=8)

    @validator('password')
    def password_strength(cls, value):
        if not any(char.isdigit() for char in value):
            raise ValueError('Password must contain at least one digit.')
        if not any(char.isalpha() for char in value):
            raise ValueError('Password must contain at least one letter.')
        return value

class JournalEntry(BaseModel):
    title: constr(max_length=200)
    content: str
    created_at: str

class ContentPack(BaseModel):
    name: constr(max_length=100)
    entries: list[JournalEntry]

class WisdomVerse(BaseModel):
    reference: constr(max_length=100)
    text: str
    theme: constr(max_length=50) # e.g. "inspiration", "motivation"

class BlobIn(BaseModel):
    blob_json: str

class BlobOut(BaseModel):
    id: int
    created_at: str
    blob_json: str

class MoodIn(BaseModel):
    score: conint(ge=1, le=10)
    tags: list[str] | None = None
    note: str | None = None

class MoodOut(BaseModel):
    id: int
    score: int
    tags: list[str] | None
    note: str | None
    at: str
