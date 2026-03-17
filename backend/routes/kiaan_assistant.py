"""
KIAAN Assistant Engine API Routes

Endpoints for task execution, reminders, and ecosystem control.
"""

import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.kiaan_assistant_engine import get_assistant_engine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/kiaan/assistant", tags=["kiaan-assistant"])


class ReminderRequest(BaseModel):
    """Request to create a reminder."""
    text: str = Field(..., min_length=1, max_length=500, description="Reminder content")
    remind_at: Optional[str] = Field(None, description="ISO 8601 datetime, or parsed from text")
    recurring: Optional[str] = Field(None, description="daily, weekly, or cron expression")
    user_id: str = Field(default="anonymous", description="User identifier")


class ReminderResponse(BaseModel):
    """Response after creating a reminder."""
    success: bool
    reminder_id: str
    text: str
    remind_at: str
    recurring: Optional[str]
    message: str


class ToolExecuteRequest(BaseModel):
    """Request to execute an ecosystem tool."""
    tool_name: str = Field(..., min_length=1, max_length=100)
    params: Optional[dict] = None
    user_id: str = Field(default="anonymous")


class ToolExecuteResponse(BaseModel):
    """Response after executing a tool."""
    success: bool
    tool_name: str
    status: str
    summary: str
    result: Optional[str] = None
    next_steps: list = []


@router.post("/reminder", response_model=ReminderResponse)
async def create_reminder(request: ReminderRequest):
    """
    Create a new reminder.

    Accepts either an explicit ISO 8601 datetime in remind_at, or
    parses natural language time from the text field (e.g. "in 5 minutes",
    "at 3pm", "tomorrow at 9am").
    """
    engine = get_assistant_engine()

    remind_at = None
    if request.remind_at:
        try:
            remind_at = datetime.fromisoformat(request.remind_at)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid remind_at format. Use ISO 8601.")

    reminder = await engine.set_reminder(
        user_id=request.user_id,
        text=request.text,
        remind_at=remind_at,
        recurring=request.recurring,
    )

    return ReminderResponse(
        success=True,
        reminder_id=reminder.id,
        text=reminder.text,
        remind_at=reminder.remind_at.isoformat(),
        recurring=reminder.recurring,
        message=f"Reminder set for {reminder.remind_at.strftime('%I:%M %p on %b %d')}.",
    )


@router.get("/reminders")
async def list_reminders(user_id: str = "anonymous"):
    """List all active reminders for a user."""
    engine = get_assistant_engine()
    reminders = await engine.list_reminders(user_id)
    return {
        "success": True,
        "reminders": [r.to_dict() for r in reminders],
        "count": len(reminders),
    }


@router.delete("/reminder/{reminder_id}")
async def cancel_reminder(reminder_id: str, user_id: str = "anonymous"):
    """Cancel a specific reminder."""
    engine = get_assistant_engine()
    cancelled = await engine.cancel_reminder(user_id, reminder_id)

    if not cancelled:
        raise HTTPException(status_code=404, detail="Reminder not found or already cancelled.")

    return {
        "success": True,
        "message": "Reminder cancelled.",
        "reminder_id": reminder_id,
    }


@router.post("/execute", response_model=ToolExecuteResponse)
async def execute_tool(request: ToolExecuteRequest):
    """Execute an ecosystem tool by name."""
    engine = get_assistant_engine()
    result = await engine.execute_tool(
        user_id=request.user_id,
        tool_name=request.tool_name,
        params=request.params,
    )

    return ToolExecuteResponse(
        success=result.status.value == "success",
        tool_name=result.tool_name,
        status=result.status.value,
        summary=result.summary,
        result=result.result,
        next_steps=result.next_steps,
    )
