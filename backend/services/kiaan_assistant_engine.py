"""
KIAAN Assistant Engine — Task Scheduling & Ecosystem Control

Handles:
- Reminders and scheduled tasks
- Ecosystem tool execution with return handling
- Concise action summaries
- Multilingual interaction support

Reuses:
- ProactiveEngagementService for scheduled messages
- AgentOrchestrator for task planning
"""

import re
import uuid
import logging
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)


class ReminderStatus(str, Enum):
    PENDING = "pending"
    FIRED = "fired"
    CANCELLED = "cancelled"


class ToolExecutionStatus(str, Enum):
    SUCCESS = "success"
    FAILED = "failed"
    PENDING_CONFIRMATION = "pending_confirmation"
    CANCELLED = "cancelled"


@dataclass
class Reminder:
    """A scheduled reminder for a user."""
    id: str
    user_id: str
    text: str
    remind_at: datetime
    recurring: Optional[str] = None  # daily, weekly, or cron expression
    status: ReminderStatus = ReminderStatus.PENDING
    created_at: datetime = field(default_factory=datetime.utcnow)
    fired_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        """Serialize reminder to a dictionary for API responses."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "text": self.text,
            "remind_at": self.remind_at.isoformat(),
            "recurring": self.recurring,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "fired_at": self.fired_at.isoformat() if self.fired_at else None,
        }


@dataclass
class ToolResult:
    """Result from executing an ecosystem tool."""
    tool_name: str
    status: ToolExecutionStatus
    result: Optional[str] = None
    summary: str = ""
    next_steps: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize tool result to a dictionary for API responses."""
        return {
            "tool_name": self.tool_name,
            "status": self.status.value,
            "result": self.result,
            "summary": self.summary,
            "next_steps": self.next_steps,
        }


# Ecosystem tool registry — maps internal keys to tool metadata.
# "destructive" tools require user confirmation before execution.
ECOSYSTEM_TOOLS = {
    "kiaan_chat": {"name": "KIAAN Chat", "path": "/chat", "destructive": False},
    "companion": {"name": "Companion", "path": "/companion", "destructive": False},
    "viyoga": {"name": "Viyog (Letting Go)", "path": "/viyog", "destructive": False},
    "ardha": {"name": "Ardha (Reframing)", "path": "/ardha", "destructive": False},
    "emotional_reset": {"name": "Emotional Reset", "path": "/emotional-reset", "destructive": False},
    "karma_reset": {"name": "Karma Reset", "path": "/karma-reset", "destructive": False},
    "karmic_tree": {"name": "Karmic Tree", "path": "/karmic-tree", "destructive": False},
    "sacred_reflections": {"name": "Sacred Reflections", "path": "/sacred-reflections", "destructive": False},
    "mood_insights": {"name": "Mood Insights", "path": "/mood-insights", "destructive": False},
    "gita_library": {"name": "Gita Library", "path": "/gita", "destructive": False},
    "sadhana": {"name": "Sadhana", "path": "/sadhana", "destructive": False},
    "wisdom_rooms": {"name": "Wisdom Rooms", "path": "/wisdom-rooms", "destructive": False},
}


class AssistantEngine:
    """
    KIAAN Assistant Engine — handles tasks, reminders, and ecosystem control.

    Provides Siri/Alexa-grade task execution with spiritual wellness context.
    """

    def __init__(self):
        # In-memory reminder store (would use DB in production)
        self._reminders: Dict[str, List[Reminder]] = {}
        self._time_patterns = self._compile_time_patterns()

    def _compile_time_patterns(self) -> List[tuple]:
        """Compile regex patterns for time extraction from natural language."""
        return [
            (re.compile(r'(?:at|for)\s+(\d{1,2})\s*(?::(\d{2}))?\s*(am|pm|AM|PM)', re.I), 'absolute'),
            (re.compile(r'in\s+(\d+)\s*(minute|hour|min|hr|second|sec)s?', re.I), 'relative'),
            (re.compile(r'tomorrow\s+(?:at\s+)?(\d{1,2})\s*(?::(\d{2}))?\s*(am|pm)?', re.I), 'tomorrow'),
            (re.compile(r'(?:every|each)\s+(day|morning|evening|night|week)', re.I), 'recurring'),
        ]

    def parse_reminder_time(self, text: str) -> Optional[datetime]:
        """
        Extract a reminder time from natural language text.

        Supports:
        - Absolute times: "at 3pm", "at 10:30 AM"
        - Relative times: "in 5 minutes", "in 2 hours"
        - Tomorrow: "tomorrow at 9am", "tomorrow 6pm"

        Returns None if no time pattern is found.
        """
        now = datetime.utcnow()

        for pattern, ptype in self._time_patterns:
            match = pattern.search(text)
            if not match:
                continue

            if ptype == 'absolute':
                hour = int(match.group(1))
                minute = int(match.group(2) or 0)
                ampm = (match.group(3) or '').lower()
                if ampm == 'pm' and hour < 12:
                    hour += 12
                if ampm == 'am' and hour == 12:
                    hour = 0
                target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                # If the time has already passed today, schedule for tomorrow
                if target <= now:
                    target += timedelta(days=1)
                return target

            elif ptype == 'relative':
                amount = int(match.group(1))
                unit = match.group(2).lower()
                if unit.startswith('min'):
                    return now + timedelta(minutes=amount)
                elif unit.startswith('hour') or unit.startswith('hr'):
                    return now + timedelta(hours=amount)
                elif unit.startswith('sec'):
                    return now + timedelta(seconds=amount)

            elif ptype == 'tomorrow':
                hour = int(match.group(1))
                minute = int(match.group(2) or 0)
                ampm = (match.group(3) or '').lower()
                if ampm == 'pm' and hour < 12:
                    hour += 12
                if ampm == 'am' and hour == 12:
                    hour = 0
                tomorrow = now + timedelta(days=1)
                return tomorrow.replace(hour=hour, minute=minute, second=0, microsecond=0)

        return None

    def parse_recurring(self, text: str) -> Optional[str]:
        """Extract recurring schedule from text."""
        text_lower = text.lower()
        if 'every day' in text_lower or 'daily' in text_lower:
            return 'daily'
        if 'every morning' in text_lower:
            return 'daily_morning'
        if 'every evening' in text_lower or 'every night' in text_lower:
            return 'daily_evening'
        if 'every week' in text_lower or 'weekly' in text_lower:
            return 'weekly'
        return None

    async def set_reminder(
        self,
        user_id: str,
        text: str,
        remind_at: Optional[datetime] = None,
        recurring: Optional[str] = None,
    ) -> Reminder:
        """
        Create a new reminder for the user.

        If remind_at is not provided, the engine attempts to parse a time
        from the text. Falls back to 1 hour from now if no time is found.

        Args:
            user_id: The user creating the reminder.
            text: Reminder content / natural language input.
            remind_at: Explicit datetime, or None to auto-parse.
            recurring: Recurrence pattern (daily, weekly, etc.).

        Returns:
            The created Reminder instance.
        """
        if remind_at is None:
            remind_at = self.parse_reminder_time(text)
        if remind_at is None:
            # Default: 1 hour from now
            remind_at = datetime.utcnow() + timedelta(hours=1)

        if recurring is None:
            recurring = self.parse_recurring(text)

        reminder = Reminder(
            id=str(uuid.uuid4()),
            user_id=user_id,
            text=text,
            remind_at=remind_at,
            recurring=recurring,
        )

        if user_id not in self._reminders:
            self._reminders[user_id] = []
        self._reminders[user_id].append(reminder)

        logger.info("Reminder set for user %s at %s", user_id, remind_at)
        return reminder

    async def list_reminders(self, user_id: str) -> List[Reminder]:
        """List all active (pending) reminders for a user."""
        reminders = self._reminders.get(user_id, [])
        return [r for r in reminders if r.status == ReminderStatus.PENDING]

    async def cancel_reminder(self, user_id: str, reminder_id: str) -> bool:
        """
        Cancel a specific reminder.

        Returns True if the reminder was found and cancelled, False otherwise.
        """
        reminders = self._reminders.get(user_id, [])
        for r in reminders:
            if r.id == reminder_id and r.status == ReminderStatus.PENDING:
                r.status = ReminderStatus.CANCELLED
                logger.info("Reminder %s cancelled for user %s", reminder_id, user_id)
                return True
        return False

    async def fire_due_reminders(self) -> List[Reminder]:
        """
        Check and fire all due reminders. Called periodically by a scheduler.

        For recurring reminders, automatically creates the next occurrence
        after firing.

        Returns:
            List of reminders that were fired in this cycle.
        """
        now = datetime.utcnow()
        fired: List[Reminder] = []

        for user_id, reminders in self._reminders.items():
            for r in reminders:
                if r.status == ReminderStatus.PENDING and r.remind_at <= now:
                    r.status = ReminderStatus.FIRED
                    r.fired_at = now
                    fired.append(r)
                    logger.info("Reminder fired: %s for user %s", r.id, user_id)

                    # Handle recurring — create next occurrence
                    if r.recurring:
                        next_time = self._next_occurrence(r.remind_at, r.recurring)
                        if next_time:
                            new_reminder = Reminder(
                                id=str(uuid.uuid4()),
                                user_id=user_id,
                                text=r.text,
                                remind_at=next_time,
                                recurring=r.recurring,
                            )
                            self._reminders[user_id].append(new_reminder)
        return fired

    def _next_occurrence(self, current: datetime, recurring: str) -> Optional[datetime]:
        """Calculate the next occurrence for a recurring reminder."""
        if recurring in ('daily', 'daily_morning', 'daily_evening'):
            return current + timedelta(days=1)
        if recurring == 'weekly':
            return current + timedelta(weeks=1)
        return None

    async def execute_tool(
        self,
        user_id: str,
        tool_name: str,
        params: Optional[Dict[str, Any]] = None,
    ) -> ToolResult:
        """
        Execute an ecosystem tool and return the result.

        Destructive tools return PENDING_CONFIRMATION status and require
        explicit user confirmation before proceeding.

        Args:
            user_id: The user requesting the tool execution.
            tool_name: Name or key of the ecosystem tool.
            params: Optional parameters for the tool.

        Returns:
            ToolResult with execution status and summary.
        """
        tool_key = tool_name.lower().replace(' ', '_').replace('-', '_')
        tool = ECOSYSTEM_TOOLS.get(tool_key)

        if not tool:
            return ToolResult(
                tool_name=tool_name,
                status=ToolExecutionStatus.FAILED,
                summary=f"Tool '{tool_name}' not found in KIAAN ecosystem.",
                next_steps=["Try: " + ", ".join(ECOSYSTEM_TOOLS.keys())],
            )

        if tool.get("destructive", False):
            return ToolResult(
                tool_name=tool["name"],
                status=ToolExecutionStatus.PENDING_CONFIRMATION,
                summary=f"This action requires confirmation. Are you sure you want to proceed with {tool['name']}?",
                next_steps=["Confirm to proceed", "Cancel to abort"],
            )

        logger.info("Executing tool %s for user %s", tool['name'], user_id)
        return ToolResult(
            tool_name=tool["name"],
            status=ToolExecutionStatus.SUCCESS,
            result=tool["path"],
            summary=f"Opening {tool['name']}.",
            next_steps=[f"Navigate to {tool['path']}"],
        )

    def detect_task_intent(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Detect if a query contains a task/reminder/tool intent.

        Args:
            query: The raw user query.

        Returns:
            Parsed intent dict with type and parameters, or None if
            no task intent is detected.
        """
        query_lower = query.lower()

        # Reminder detection
        reminder_patterns = [
            r'(?:set|create|add)\s+(?:a\s+)?(?:reminder|alarm|timer)',
            r'remind\s+me',
            r'don\'t\s+(?:let\s+me\s+)?forget',
            r'wake\s+me\s+up',
        ]
        for pattern in reminder_patterns:
            if re.search(pattern, query_lower):
                remind_at = self.parse_reminder_time(query)
                recurring = self.parse_recurring(query)
                return {
                    "type": "reminder",
                    "text": query,
                    "remind_at": remind_at,
                    "recurring": recurring,
                }

        # Tool execution detection
        tool_patterns = [
            (r'open\s+(.+)', 'navigate'),
            (r'go\s+to\s+(.+)', 'navigate'),
            (r'start\s+(.+)', 'execute'),
            (r'show\s+(?:me\s+)?(.+)', 'navigate'),
        ]
        for pattern, action in tool_patterns:
            match = re.search(pattern, query_lower)
            if match:
                tool_query = match.group(1).strip()
                # Try to match tool name
                for key, tool in ECOSYSTEM_TOOLS.items():
                    if tool_query in key or tool_query in tool["name"].lower():
                        return {
                            "type": action,
                            "tool": key,
                            "tool_name": tool["name"],
                            "path": tool["path"],
                        }

        return None


# Singleton
_assistant_instance: Optional[AssistantEngine] = None


def get_assistant_engine() -> AssistantEngine:
    """Get the singleton AssistantEngine instance."""
    global _assistant_instance
    if _assistant_instance is None:
        _assistant_instance = AssistantEngine()
    return _assistant_instance
