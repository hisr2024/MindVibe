"""Guided Meditation routes: browse practices, start sessions, track progress.

Serves the MeditationPracticeDB content with interactive session
support (start, complete, timer metadata) and built-in guided programs.
"""

import logging
import uuid
from datetime import UTC, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.deps import get_current_user_optional, get_db
from backend.models.indian_wellness import MeditationPracticeDB

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/meditation", tags=["meditation"])


# ---------------------------------------------------------------------------
# Guided meditation programs (static, curated)
# ---------------------------------------------------------------------------

GUIDED_PROGRAMS = [
    {
        "id": "breath-awareness-5min",
        "title": "5-Minute Breath Awareness",
        "description": "A simple breath-focused meditation for beginners. Follow the guided steps to calm your mind.",
        "tradition": "Vedic",
        "duration_seconds": 300,
        "difficulty": "beginner",
        "phases": [
            {"label": "Settle In", "duration_seconds": 30, "instruction": "Find a comfortable seated position. Close your eyes gently. Let your body relax."},
            {"label": "Natural Breath", "duration_seconds": 60, "instruction": "Breathe naturally. Don't try to change anything. Simply notice the air flowing in and out."},
            {"label": "Deep Breath", "duration_seconds": 90, "instruction": "Breathe in slowly for 4 counts. Hold for 4 counts. Breathe out for 6 counts. Repeat."},
            {"label": "Awareness", "duration_seconds": 90, "instruction": "Return to natural breathing. If your mind wanders, gently bring attention back to the breath. No judgment."},
            {"label": "Return", "duration_seconds": 30, "instruction": "Slowly bring awareness back to the room. Wiggle your fingers and toes. Open your eyes when ready."},
        ],
    },
    {
        "id": "body-scan-10min",
        "title": "10-Minute Body Scan",
        "description": "A progressive body scan meditation. Release tension from head to toe.",
        "tradition": "Buddhist",
        "duration_seconds": 600,
        "difficulty": "beginner",
        "phases": [
            {"label": "Settle In", "duration_seconds": 30, "instruction": "Lie down or sit comfortably. Close your eyes. Take 3 deep breaths."},
            {"label": "Head & Face", "duration_seconds": 60, "instruction": "Bring awareness to the top of your head. Notice any tension in your forehead, eyes, jaw. Let it melt away."},
            {"label": "Neck & Shoulders", "duration_seconds": 60, "instruction": "Move attention to your neck and shoulders. These areas carry so much stress. Breathe into the tension and release."},
            {"label": "Chest & Abdomen", "duration_seconds": 90, "instruction": "Feel your chest rise and fall. Notice your heart beating. Let your belly soften completely."},
            {"label": "Arms & Hands", "duration_seconds": 60, "instruction": "Notice your arms, wrists, and fingertips. Let them feel heavy and warm. Release any grip."},
            {"label": "Hips & Legs", "duration_seconds": 90, "instruction": "Bring awareness to your hips, thighs, knees, calves, and feet. Let gravity hold you."},
            {"label": "Whole Body", "duration_seconds": 120, "instruction": "Now feel your entire body as one. Breathe into your wholeness. You are complete."},
            {"label": "Return", "duration_seconds": 90, "instruction": "Slowly begin to move. Rock your head gently. Stretch your arms. Open your eyes with gratitude."},
        ],
    },
    {
        "id": "so-hum-mantra-15min",
        "title": "15-Minute So Hum Mantra Meditation",
        "description": "An ancient Vedic mantra meditation. 'So Hum' means 'I am That' — connecting you to universal consciousness.",
        "tradition": "Vedic",
        "duration_seconds": 900,
        "difficulty": "intermediate",
        "phases": [
            {"label": "Settle In", "duration_seconds": 60, "instruction": "Sit with spine straight. Close your eyes. Take 5 deep breaths to center yourself."},
            {"label": "Introduction", "duration_seconds": 30, "instruction": "On each inhale, silently say 'So'. On each exhale, silently say 'Hum'. So = I, Hum = That (the universe)."},
            {"label": "Mantra Repetition", "duration_seconds": 600, "instruction": "Continue with So-Hum. When thoughts arise, gently return to the mantra. No effort. Let it flow naturally."},
            {"label": "Silent Awareness", "duration_seconds": 150, "instruction": "Release the mantra. Sit in the silence. Notice the stillness that remains after the words dissolve."},
            {"label": "Return", "duration_seconds": 60, "instruction": "Slowly return. Place your palms together at heart center. Thank yourself for this practice. Om Shanti."},
        ],
    },
    {
        "id": "gita-contemplation-10min",
        "title": "10-Minute Gita Verse Contemplation",
        "description": "Meditate on a Gita verse. Let the wisdom sink from your mind into your heart.",
        "tradition": "Vedic",
        "duration_seconds": 600,
        "difficulty": "beginner",
        "phases": [
            {"label": "Settle In", "duration_seconds": 60, "instruction": "Sit comfortably. Close your eyes. Let your breathing become natural and rhythmic."},
            {"label": "Verse Reading", "duration_seconds": 60, "instruction": "BG 2.14: 'The contacts of the senses with their objects, which give rise to feelings of heat and cold, pleasure and pain, are impermanent. Bear them patiently, O Arjuna.'"},
            {"label": "Contemplation", "duration_seconds": 300, "instruction": "Sit with this verse. What pleasures are you chasing? What pains are you running from? Both are temporary. Let this truth settle."},
            {"label": "Application", "duration_seconds": 120, "instruction": "Think of one situation in your life right now. Apply this verse to it. What shifts when you see it as temporary?"},
            {"label": "Gratitude", "duration_seconds": 60, "instruction": "Thank the ancient teachers who preserved this wisdom for you. Slowly open your eyes. Carry this equanimity with you."},
        ],
    },
    {
        "id": "loving-kindness-10min",
        "title": "10-Minute Metta (Loving Kindness)",
        "description": "Send compassion to yourself and others. Based on Buddhist metta practice from India.",
        "tradition": "Buddhist",
        "duration_seconds": 600,
        "difficulty": "beginner",
        "phases": [
            {"label": "Settle In", "duration_seconds": 60, "instruction": "Sit comfortably. Close your eyes. Place your hand on your heart if it feels right."},
            {"label": "Self", "duration_seconds": 120, "instruction": "Repeat silently: 'May I be happy. May I be healthy. May I be safe. May I live with ease.' Feel these wishes for yourself."},
            {"label": "Loved One", "duration_seconds": 120, "instruction": "Think of someone you love. Repeat: 'May you be happy. May you be healthy. May you be safe. May you live with ease.'"},
            {"label": "Neutral Person", "duration_seconds": 90, "instruction": "Think of someone you neither like nor dislike. The cashier, a neighbor. Send them the same wishes."},
            {"label": "Difficult Person", "duration_seconds": 90, "instruction": "Think of someone who frustrates you. This is the hard part. Try: 'May you be happy. May you find peace.' Even a little goodwill counts."},
            {"label": "All Beings", "duration_seconds": 90, "instruction": "Expand to all living beings everywhere: 'May all beings be happy. May all beings be free from suffering.' Feel the vastness."},
            {"label": "Return", "duration_seconds": 30, "instruction": "Return to yourself. Notice how you feel. Open your eyes gently."},
        ],
    },
]


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class MeditationPhase(BaseModel):
    label: str
    duration_seconds: int
    instruction: str


class GuidedProgramOut(BaseModel):
    id: str
    title: str
    description: str
    tradition: str
    duration_seconds: int
    difficulty: str
    phases: list[MeditationPhase]


class GuidedProgramListItem(BaseModel):
    id: str
    title: str
    description: str
    tradition: str
    duration_seconds: int
    difficulty: str
    phase_count: int


class GuidedProgramListOut(BaseModel):
    programs: list[GuidedProgramListItem]
    total: int


class MeditationPracticeOut(BaseModel):
    id: str
    sanskrit_name: str
    english_name: str
    hindi_name: str | None = None
    tradition: str | None = None
    description: str
    instructions: list[str] | None = None
    benefits: list[str] | None = None
    mental_benefits: list[str] | None = None
    duration_minutes: int
    difficulty: str


class MeditationPracticeListOut(BaseModel):
    practices: list[MeditationPracticeOut]
    total: int


class SessionStartOut(BaseModel):
    session_id: str
    program_id: str
    started_at: str
    message: str


class SessionCompleteOut(BaseModel):
    session_id: str
    duration_seconds: int
    message: str


# ---------------------------------------------------------------------------
# Routes: Guided Programs (static, curated)
# ---------------------------------------------------------------------------

@router.get("/programs", response_model=GuidedProgramListOut)
async def list_guided_programs(
    request: Request,
    difficulty: Optional[str] = None,
    user_id: Optional[str] = Depends(get_current_user_optional),
) -> GuidedProgramListOut:
    """List all available guided meditation programs.

    Free for all users — meditation should be accessible to everyone.
    """
    programs = GUIDED_PROGRAMS
    if difficulty:
        programs = [p for p in programs if p["difficulty"] == difficulty]

    items = [
        GuidedProgramListItem(
            id=p["id"],
            title=p["title"],
            description=p["description"],
            tradition=p["tradition"],
            duration_seconds=p["duration_seconds"],
            difficulty=p["difficulty"],
            phase_count=len(p["phases"]),
        )
        for p in programs
    ]

    return GuidedProgramListOut(programs=items, total=len(items))


@router.get("/programs/{program_id}", response_model=GuidedProgramOut)
async def get_guided_program(
    program_id: str,
    request: Request,
    user_id: Optional[str] = Depends(get_current_user_optional),
) -> GuidedProgramOut:
    """Get a specific guided meditation program with all phases and timer data."""
    program = next((p for p in GUIDED_PROGRAMS if p["id"] == program_id), None)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return GuidedProgramOut(**program)


# ---------------------------------------------------------------------------
# Routes: Database Practices (from MeditationPracticeDB)
# ---------------------------------------------------------------------------

@router.get("/practices", response_model=MeditationPracticeListOut)
async def list_practices(
    request: Request,
    difficulty: Optional[str] = None,
    tradition: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_optional),
) -> MeditationPracticeListOut:
    """List meditation practices from the database."""
    limit = min(limit, 100)

    conditions = [MeditationPracticeDB.deleted_at.is_(None)]
    if difficulty:
        conditions.append(MeditationPracticeDB.difficulty == difficulty)
    if tradition:
        conditions.append(MeditationPracticeDB.tradition == tradition)

    total = (await db.execute(
        select(func.count(MeditationPracticeDB.id)).where(*conditions)
    )).scalar() or 0

    stmt = (
        select(MeditationPracticeDB)
        .where(*conditions)
        .order_by(MeditationPracticeDB.english_name)
        .offset(offset)
        .limit(limit)
    )
    rows = (await db.execute(stmt)).scalars().all()

    practices = [
        MeditationPracticeOut(
            id=p.id,
            sanskrit_name=p.sanskrit_name,
            english_name=p.english_name,
            hindi_name=p.hindi_name,
            tradition=p.tradition,
            description=p.description,
            instructions=p.instructions,
            benefits=p.benefits,
            mental_benefits=p.mental_benefits,
            duration_minutes=p.duration_minutes,
            difficulty=p.difficulty,
        )
        for p in rows
    ]

    return MeditationPracticeListOut(practices=practices, total=total)


# ---------------------------------------------------------------------------
# Routes: Session tracking (start / complete)
# ---------------------------------------------------------------------------

@router.post("/sessions/start", response_model=SessionStartOut)
async def start_session(
    request: Request,
    program_id: str,
    user_id: Optional[str] = Depends(get_current_user_optional),
) -> SessionStartOut:
    """Start a meditation session.

    Returns a session_id for tracking completion. The frontend uses this
    to measure actual meditation time.
    """
    # Validate program exists
    program = next((p for p in GUIDED_PROGRAMS if p["id"] == program_id), None)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    session_id = str(uuid.uuid4())
    started_at = datetime.now(UTC).isoformat()

    logger.info(
        "Meditation session started: session=%s program=%s user=%s",
        session_id, program_id, user_id or "anonymous",
    )

    return SessionStartOut(
        session_id=session_id,
        program_id=program_id,
        started_at=started_at,
        message=f"Your {program['title']} session has begun. Find your stillness.",
    )


@router.post("/sessions/{session_id}/complete", response_model=SessionCompleteOut)
async def complete_session(
    session_id: str,
    request: Request,
    duration_seconds: int = 0,
    user_id: Optional[str] = Depends(get_current_user_optional),
) -> SessionCompleteOut:
    """Mark a meditation session as complete.

    The frontend reports actual duration (how long the user meditated).
    """
    logger.info(
        "Meditation session completed: session=%s duration=%ds user=%s",
        session_id, duration_seconds, user_id or "anonymous",
    )

    return SessionCompleteOut(
        session_id=session_id,
        duration_seconds=duration_seconds,
        message="Well done. Each moment of stillness is a gift to yourself.",
    )
