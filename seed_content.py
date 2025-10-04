import asyncio, os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import insert, select
from app.models import Base, ContentPack

DATA_EN = {"version":1,"locale":"en","packs":[{"principle":"stable_center","cards":[
    {"title":"Act Without Attachment","copy":"Focus on doing your part with care; release fixation on the result. Let the outcome be separate from the effort — this reduces anxiety and steadies practice.","cta":"Try one small task","exercise_ref":"action_focus_5"},
    {"title":"Even Mind","copy":"Notice successes and setbacks with equal attention. Practice observing your reactions without judgment to build resilience and calm.","cta":"Reflect for 1 minute","exercise_ref":"even_mind_60"},
    {"title":"Steady Effort","copy":"Make a small, consistent commitment each day. Growth comes from steady practice rather than immediate outcomes.","cta":"Do for 5 days","exercise_ref":"micro_habit_5"
}]}]}

# Localized packs remain for DE/HI and others; keep originals for now.
DATA_DE = {"version":1,"locale":"de","packs":[{"principle":"stable_center","cards":[{"title":"Anker im Atem","copy":"Spüre eine volle Ein‑ und Ausatmung. Ruhe dort, wo die Luft die Nase berührt.","cta":"5 Zyklen","exercise_ref":"focus_breath_60"}]}]}
DATA_HI = {"version":1,"locale":"hi","packs":[{"principle":"stable_center","cards":[{"title":"सांस में टिकना","copy":"एक पूरा श्वास‑प्रश्वास महसूस करो। ध्यान नाक के पास ठहराओ।","cta":"5 चक्र","exercise_ref":"focus_breath_60"}]}]}

DATABASE_URL = os.getenv("DATABASE_URL","postgresql+asyncpg://navi:navi@db:5432/navi")