from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Integer, Text, JSON, TIMESTAMP, func, ForeignKey

class Base(DeclarativeBase): ...

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    auth_uid: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    locale: Mapped[str] = mapped_column(String(8), default="en")
    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

class Mood(Base):
    __tablename__ = "moods"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    score: Mapped[int] = mapped_column(Integer)
    tags: Mapped[dict | None] = mapped_column(JSON)
    note: Mapped[str | None] = mapped_column(Text)
    at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

class EncryptedBlob(Base):
    __tablename__ = "journal_blobs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    blob_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())

class ContentPack(Base):
    __tablename__ = "content_packs"
    id: Mapped[int] = mapped_column(primary_key=True)
    locale: Mapped[str] = mapped_column(String(8), index=True)
    data: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now())
