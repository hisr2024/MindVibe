from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from .models import Base
import os

DATABASE_URL = os.getenv("DATABASE_URL","postgresql+asyncpg://navi:navi@db:5432/navi")
engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

app = FastAPI(title="MindVibe API", version="1.0.0")

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

from .routes.moods import router as moods_router
from .routes.content import router as content_router
from .routes.journal import router as journal_router
from .routes.wisdom_guide import router as wisdom_router
from .routes.chat import router as chat_router

app.include_router(moods_router)
app.include_router(content_router)
app.include_router(journal_router)
app.include_router(wisdom_router)
app.include_router(chat_router)
