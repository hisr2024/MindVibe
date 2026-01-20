"""
Divine Consciousness API Routes

REST API endpoints for the divine consciousness system:
- Sacred breathing exercises
- Divine moments and micro-meditations
- Sacred mood responses
- Divine atmosphere generation
- Consciousness-touching content

"Every API call is an opportunity to touch a soul with peace."
"""

import logging
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.divine_consciousness_service import divine_consciousness
from backend.services.calming_mood_analytics import calming_mood_analytics
from backend.services.divine_micro_moments import divine_micro_moments
from backend.services.serenity_atmosphere_engine import serenity_engine
from backend.services.kiaan_divine_integration import kiaan_divine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/divine", tags=["Divine Consciousness"])


# Request/Response Models

class SacredAtmosphereRequest(BaseModel):
    """Request for generating sacred atmosphere."""
    emotion: Optional[str] = Field(None, description="Current emotional state")


class SacredAtmosphereResponse(BaseModel):
    """Complete sacred atmosphere experience."""
    serenity_moment: str
    sacred_opening: str
    divine_awareness: str
    sacred_practice: str
    divine_presence: str
    affirmation: str
    sacred_closing: str


class BreathingExerciseRequest(BaseModel):
    """Request for breathing exercise."""
    pattern: str = Field(default="peace_breath", description="Breathing pattern type")


class BreathingExerciseResponse(BaseModel):
    """Sacred breathing exercise details."""
    name: str
    pattern: str
    inhale: int
    hold: int
    exhale: int
    pause: Optional[int] = None
    instructions: list[str]
    divine_message: str
    closing: str


class MicroMeditationRequest(BaseModel):
    """Request for micro-meditation."""
    meditation_type: str = Field(default="instant_peace", description="Type of meditation")


class MicroMeditationResponse(BaseModel):
    """Micro-meditation content."""
    name: str
    duration_seconds: int
    guidance: str
    affirmation: str


class SacredMoodRequest(BaseModel):
    """Request for sacred mood response."""
    mood_score: int = Field(..., ge=1, le=10, description="Mood score 1-10")
    emotion: Optional[str] = Field(None, description="Primary emotion")
    include_practice: bool = Field(default=True)


class SacredMoodResponse(BaseModel):
    """Sacred response to mood check-in."""
    sacred_response: str
    divine_message: str
    affirmation: str
    sacred_practice: Optional[str] = None
    emotion_guidance: Optional[dict[str, str]] = None


class DivineReminderResponse(BaseModel):
    """Divine reminder content."""
    reminder: str


class DivineAffirmationResponse(BaseModel):
    """Divine affirmation content."""
    affirmation: str


class TimeGreetingResponse(BaseModel):
    """Time-appropriate greeting."""
    greeting: str
    time_of_day: str


class SacredPauseResponse(BaseModel):
    """Sacred pause content."""
    name: str
    guidance: str
    duration_seconds: int


class DivineCheckInResponse(BaseModel):
    """Divine check-in moment."""
    content: str


# API Endpoints

@router.get("/atmosphere", response_model=SacredAtmosphereResponse)
async def get_sacred_atmosphere(emotion: Optional[str] = None):
    """
    Get a complete sacred atmosphere experience.

    Returns all elements needed to create a divine atmosphere:
    - Serenity moment
    - Sacred opening
    - Divine awareness
    - Sacred practice
    - Divine presence phrase
    - Affirmation
    - Sacred closing
    """
    try:
        atmosphere = divine_consciousness.create_sacred_atmosphere(emotion)
        return SacredAtmosphereResponse(
            serenity_moment=atmosphere["serenity_moment"],
            sacred_opening=atmosphere["sacred_opening"],
            divine_awareness=atmosphere["divine_awareness"],
            sacred_practice=atmosphere["sacred_practice"],
            divine_presence=atmosphere["divine_presence"],
            affirmation=atmosphere["affirmation"],
            sacred_closing=atmosphere["sacred_closing"],
        )
    except Exception as e:
        logger.error(f"Error generating sacred atmosphere: {e}")
        raise HTTPException(status_code=500, detail="Could not generate sacred atmosphere")


@router.get("/breathing/{pattern}", response_model=BreathingExerciseResponse)
async def get_breathing_exercise(pattern: str = "peace_breath"):
    """
    Get a sacred breathing exercise.

    Available patterns:
    - peace_breath: 4-7-8 pattern for deep peace
    - heart_breath: 5-5-5 heart-centered breathing
    - grounding_breath: 4-4-4-4 box breathing for grounding
    - surrender_breath: 4-2-8 for letting go
    - ocean_breath: 6-0-6 continuous wave breathing
    """
    try:
        exercise = divine_micro_moments.get_breathing_exercise(pattern)
        return BreathingExerciseResponse(
            name=exercise["name"],
            pattern=exercise["pattern"],
            inhale=exercise["inhale"],
            hold=exercise["hold"],
            exhale=exercise["exhale"],
            pause=exercise.get("pause"),
            instructions=exercise["instructions"],
            divine_message=exercise["divine_message"],
            closing=exercise["closing"],
        )
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Breathing pattern '{pattern}' not found")
    except Exception as e:
        logger.error(f"Error getting breathing exercise: {e}")
        raise HTTPException(status_code=500, detail="Could not get breathing exercise")


@router.get("/breathing/random", response_model=BreathingExerciseResponse)
async def get_random_breathing_exercise():
    """Get a random sacred breathing exercise."""
    try:
        exercise = divine_micro_moments.get_random_breathing_exercise()
        return BreathingExerciseResponse(
            name=exercise["name"],
            pattern=exercise["pattern"],
            inhale=exercise["inhale"],
            hold=exercise["hold"],
            exhale=exercise["exhale"],
            pause=exercise.get("pause"),
            instructions=exercise["instructions"],
            divine_message=exercise["divine_message"],
            closing=exercise["closing"],
        )
    except Exception as e:
        logger.error(f"Error getting random breathing exercise: {e}")
        raise HTTPException(status_code=500, detail="Could not get breathing exercise")


@router.get("/meditation/{meditation_type}", response_model=MicroMeditationResponse)
async def get_micro_meditation(meditation_type: str = "instant_peace"):
    """
    Get a micro-meditation.

    Available types:
    - instant_peace: Quick peace portal
    - divine_presence: Divine presence awareness
    - inner_light: Inner light activation
    - love_expansion: Love expansion meditation
    - letting_go: Sacred release meditation
    """
    try:
        meditation = divine_micro_moments.get_micro_meditation(meditation_type)
        return MicroMeditationResponse(
            name=meditation["name"],
            duration_seconds=meditation["duration_seconds"],
            guidance=meditation["guidance"],
            affirmation=meditation["affirmation"],
        )
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Meditation type '{meditation_type}' not found")
    except Exception as e:
        logger.error(f"Error getting micro-meditation: {e}")
        raise HTTPException(status_code=500, detail="Could not get micro-meditation")


@router.post("/mood-response", response_model=SacredMoodResponse)
async def get_sacred_mood_response(request: SacredMoodRequest):
    """
    Get a sacred response to a mood check-in.

    Returns divine comfort and guidance based on mood score (1-10).
    """
    try:
        response = kiaan_divine.create_sacred_mood_response(
            mood_score=request.mood_score,
            emotion=request.emotion,
            include_practice=request.include_practice,
        )
        return SacredMoodResponse(
            sacred_response=response["sacred_response"],
            divine_message=response["divine_message"],
            affirmation=response["affirmation"],
            sacred_practice=response.get("sacred_practice"),
            emotion_guidance=response.get("emotion_guidance"),
        )
    except Exception as e:
        logger.error(f"Error generating sacred mood response: {e}")
        raise HTTPException(status_code=500, detail="Could not generate mood response")


@router.get("/reminder", response_model=DivineReminderResponse)
async def get_divine_reminder():
    """Get a divine reminder message."""
    try:
        reminder = divine_micro_moments.get_divine_reminder()
        return DivineReminderResponse(reminder=reminder)
    except Exception as e:
        logger.error(f"Error getting divine reminder: {e}")
        raise HTTPException(status_code=500, detail="Could not get divine reminder")


@router.get("/affirmation", response_model=DivineAffirmationResponse)
async def get_divine_affirmation():
    """Get a divine affirmation."""
    try:
        affirmation = divine_consciousness.get_divine_affirmation()
        return DivineAffirmationResponse(affirmation=affirmation)
    except Exception as e:
        logger.error(f"Error getting divine affirmation: {e}")
        raise HTTPException(status_code=500, detail="Could not get divine affirmation")


@router.get("/greeting", response_model=TimeGreetingResponse)
async def get_time_greeting():
    """Get a time-appropriate sacred greeting."""
    try:
        greeting = kiaan_divine.get_time_appropriate_greeting()
        atmosphere = serenity_engine.get_time_appropriate_atmosphere()
        return TimeGreetingResponse(
            greeting=greeting,
            time_of_day=atmosphere.get("essence", "peaceful moment"),
        )
    except Exception as e:
        logger.error(f"Error getting time greeting: {e}")
        raise HTTPException(status_code=500, detail="Could not get greeting")


@router.get("/sacred-pause", response_model=SacredPauseResponse)
async def get_sacred_pause(pause_type: str = "3_breath_reset"):
    """
    Get a sacred pause ritual.

    Available types:
    - 3_breath_reset: Three sacred breaths
    - body_scan_pause: Quick body blessing
    - gratitude_breath: Gratitude breathing
    - present_moment_pause: Present moment sanctuary
    - divine_connection_pause: Divine connection moment
    """
    try:
        pause = divine_micro_moments.get_sacred_pause(pause_type)
        return SacredPauseResponse(
            name=pause["name"],
            guidance=pause["guidance"],
            duration_seconds=pause["duration_seconds"],
        )
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Pause type '{pause_type}' not found")
    except Exception as e:
        logger.error(f"Error getting sacred pause: {e}")
        raise HTTPException(status_code=500, detail="Could not get sacred pause")


@router.get("/check-in", response_model=DivineCheckInResponse)
async def get_divine_check_in():
    """Get a complete divine check-in moment."""
    try:
        content = kiaan_divine.create_divine_check_in()
        return DivineCheckInResponse(content=content)
    except Exception as e:
        logger.error(f"Error creating divine check-in: {e}")
        raise HTTPException(status_code=500, detail="Could not create check-in")


@router.get("/breathing-moment/{user_state}")
async def get_breathing_moment(user_state: str = "general"):
    """
    Get a complete breathing moment for a specific emotional state.

    States: anxious, stressed, sad, angry, tired, overwhelmed, general
    """
    try:
        moment = kiaan_divine.create_breathing_moment(user_state)
        return {"breathing_moment": moment}
    except Exception as e:
        logger.error(f"Error creating breathing moment: {e}")
        raise HTTPException(status_code=500, detail="Could not create breathing moment")


@router.get("/emotion-comfort/{emotion}")
async def get_emotion_divine_comfort(emotion: str):
    """
    Get divine comfort for a specific emotion.

    Returns opening, awareness, practice, and closing for the emotion.
    """
    try:
        comfort = divine_consciousness.get_emotion_divine_comfort(emotion)
        return comfort
    except Exception as e:
        logger.error(f"Error getting emotion comfort: {e}")
        raise HTTPException(status_code=500, detail="Could not get emotion comfort")
