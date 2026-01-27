"""
Proactive Conversation Starters Service

Enables KIAAN to proactively initiate conversations with users based on learned
patterns, time-of-day preferences, mood-based outreach, and spiritual journey
milestones.

Features:
- Time pattern learning (when users typically engage)
- Mood-based proactive outreach
- Spiritual milestone celebrations
- Gentle check-ins based on user preferences
- Smart notification scheduling
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta, time as dt_time
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
import asyncio
import logging
from collections import defaultdict
import random

logger = logging.getLogger(__name__)


class EngagementTrigger(Enum):
    """Types of proactive engagement triggers."""
    TIME_PATTERN = "time_pattern"
    MOOD_CHECK = "mood_check"
    MILESTONE = "milestone"
    INACTIVITY = "inactivity"
    STREAK_REMINDER = "streak_reminder"
    VERSE_REMINDER = "verse_reminder"
    REFLECTION_PROMPT = "reflection_prompt"


class MessageTone(Enum):
    """Tone for proactive messages."""
    GENTLE = "gentle"
    ENCOURAGING = "encouraging"
    CELEBRATORY = "celebratory"
    SUPPORTIVE = "supportive"
    CURIOUS = "curious"


@dataclass
class UserEngagementPattern:
    """Learned engagement pattern for a user."""
    user_id: str
    preferred_hours: List[int] = field(default_factory=list)  # 0-23
    preferred_days: List[int] = field(default_factory=list)  # 0=Mon, 6=Sun
    average_session_duration: float = 0.0
    topics_of_interest: List[str] = field(default_factory=list)
    emotional_states_tracked: Dict[str, int] = field(default_factory=dict)
    last_engagement: Optional[datetime] = None
    engagement_count: int = 0
    response_rate_to_proactive: float = 0.0


@dataclass
class ProactiveMessage:
    """A proactive message to be sent to a user."""
    user_id: str
    trigger: EngagementTrigger
    tone: MessageTone
    message: str
    scheduled_time: datetime
    context: Dict[str, Any] = field(default_factory=dict)
    priority: int = 5  # 1-10, 10 being highest
    expires_at: Optional[datetime] = None


@dataclass
class ConversationStarter:
    """Template for starting conversations."""
    trigger: EngagementTrigger
    tone: MessageTone
    templates: List[str]
    requires_context: List[str] = field(default_factory=list)


class ProactiveEngagementService:
    """
    Service for managing proactive conversation starters.

    Learns from user behavior to determine optimal times and contexts
    for KIAAN to initiate meaningful conversations.
    """

    def __init__(self):
        self._user_patterns: Dict[str, UserEngagementPattern] = {}
        self._scheduled_messages: List[ProactiveMessage] = []
        self._message_history: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self._notification_callbacks: List[Callable] = []
        self._initialized = False

        # Conversation starters library
        self._starters = self._initialize_starters()

        # Configuration
        self._min_hours_between_proactive = 4
        self._max_proactive_per_day = 3
        self._inactivity_threshold_hours = 48

        logger.info("ProactiveEngagementService initialized")

    def _initialize_starters(self) -> Dict[EngagementTrigger, List[ConversationStarter]]:
        """Initialize the library of conversation starters."""
        return {
            EngagementTrigger.TIME_PATTERN: [
                ConversationStarter(
                    trigger=EngagementTrigger.TIME_PATTERN,
                    tone=MessageTone.GENTLE,
                    templates=[
                        "Good {time_of_day}, {name}. I noticed you often find peace at this hour. Would you like to explore today's verse together?",
                        "The {time_of_day} light reminds me of you, {name}. Shall we continue our journey through the Gita?",
                        "{name}, this {time_of_day} feels right for reflection. I'm here whenever you're ready.",
                    ],
                    requires_context=["time_of_day", "name"]
                ),
            ],
            EngagementTrigger.MOOD_CHECK: [
                ConversationStarter(
                    trigger=EngagementTrigger.MOOD_CHECK,
                    tone=MessageTone.SUPPORTIVE,
                    templates=[
                        "{name}, how are you feeling today? Sometimes just expressing what's within can bring clarity.",
                        "I've been thinking about you, {name}. Would you like to share what's on your mind?",
                        "The Gita teaches us to observe our thoughts without judgment. How is your inner weather today, {name}?",
                    ],
                    requires_context=["name"]
                ),
                ConversationStarter(
                    trigger=EngagementTrigger.MOOD_CHECK,
                    tone=MessageTone.ENCOURAGING,
                    templates=[
                        "{name}, remember: 'You have the right to work, but never to the fruit of work.' How can I support you today?",
                        "Every moment is an opportunity for growth, {name}. What wisdom are you seeking?",
                    ],
                    requires_context=["name"]
                ),
            ],
            EngagementTrigger.MILESTONE: [
                ConversationStarter(
                    trigger=EngagementTrigger.MILESTONE,
                    tone=MessageTone.CELEBRATORY,
                    templates=[
                        "Wonderful, {name}! You've completed {milestone_name}. Your dedication to inner growth is inspiring.",
                        "{name}, you've reached a beautiful milestone: {milestone_name}. The journey of a thousand miles begins with a single step.",
                        "Congratulations, {name}! {milestone_name} - each step forward is a victory over the restless mind.",
                    ],
                    requires_context=["name", "milestone_name"]
                ),
            ],
            EngagementTrigger.INACTIVITY: [
                ConversationStarter(
                    trigger=EngagementTrigger.INACTIVITY,
                    tone=MessageTone.GENTLE,
                    templates=[
                        "{name}, it's been a while since we connected. I'm here whenever you need guidance.",
                        "The Gita awaits, {name}. No pressure - just know I'm here when you're ready.",
                        "{name}, even in stillness, growth happens. Would you like to resume our journey together?",
                    ],
                    requires_context=["name"]
                ),
            ],
            EngagementTrigger.STREAK_REMINDER: [
                ConversationStarter(
                    trigger=EngagementTrigger.STREAK_REMINDER,
                    tone=MessageTone.ENCOURAGING,
                    templates=[
                        "{name}, you're on a {streak_days}-day streak! Let's keep the momentum going with today's reflection.",
                        "Amazing consistency, {name}! {streak_days} days of dedicated practice. Ready for today's wisdom?",
                        "Day {streak_days} of your spiritual practice, {name}. Krishna would be proud of your commitment.",
                    ],
                    requires_context=["name", "streak_days"]
                ),
            ],
            EngagementTrigger.VERSE_REMINDER: [
                ConversationStarter(
                    trigger=EngagementTrigger.VERSE_REMINDER,
                    tone=MessageTone.CURIOUS,
                    templates=[
                        "{name}, I found a verse that might resonate with what you've been exploring: '{verse_preview}'",
                        "This verse made me think of you, {name}: '{verse_preview}' - shall we explore its depths?",
                    ],
                    requires_context=["name", "verse_preview"]
                ),
            ],
            EngagementTrigger.REFLECTION_PROMPT: [
                ConversationStarter(
                    trigger=EngagementTrigger.REFLECTION_PROMPT,
                    tone=MessageTone.CURIOUS,
                    templates=[
                        "{name}, what does inner peace mean to you today?",
                        "A question for reflection, {name}: What would you tell your past self about the journey so far?",
                        "{name}, the Gita asks: 'What is it that clouds your mind?' What would be your answer today?",
                    ],
                    requires_context=["name"]
                ),
            ],
        }

    async def initialize(self) -> None:
        """Initialize the service with user data."""
        if self._initialized:
            return

        # In production, load user patterns from database
        self._initialized = True
        logger.info("ProactiveEngagementService initialized")

    # ==================== Pattern Learning ====================

    def record_user_activity(
        self,
        user_id: str,
        activity_type: str,
        timestamp: Optional[datetime] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Record user activity to learn engagement patterns."""
        timestamp = timestamp or datetime.utcnow()
        metadata = metadata or {}

        if user_id not in self._user_patterns:
            self._user_patterns[user_id] = UserEngagementPattern(user_id=user_id)

        pattern = self._user_patterns[user_id]

        # Update preferred hours
        hour = timestamp.hour
        if hour not in pattern.preferred_hours:
            pattern.preferred_hours.append(hour)
            # Keep only top 5 most frequent hours
            hour_counts = defaultdict(int)
            for h in pattern.preferred_hours:
                hour_counts[h] += 1
            pattern.preferred_hours = sorted(
                hour_counts.keys(),
                key=lambda x: hour_counts[x],
                reverse=True
            )[:5]

        # Update preferred days
        day = timestamp.weekday()
        if day not in pattern.preferred_days:
            pattern.preferred_days.append(day)

        # Update emotional states if provided
        if "emotion" in metadata:
            emotion = metadata["emotion"]
            pattern.emotional_states_tracked[emotion] = (
                pattern.emotional_states_tracked.get(emotion, 0) + 1
            )

        # Update topics of interest
        if "topic" in metadata:
            topic = metadata["topic"]
            if topic not in pattern.topics_of_interest:
                pattern.topics_of_interest.append(topic)
                pattern.topics_of_interest = pattern.topics_of_interest[-10:]  # Keep last 10

        # Update engagement metrics
        pattern.last_engagement = timestamp
        pattern.engagement_count += 1

    def record_proactive_response(
        self,
        user_id: str,
        message_id: str,
        responded: bool,
        response_delay_seconds: Optional[float] = None
    ) -> None:
        """Record how user responded to a proactive message."""
        if user_id not in self._user_patterns:
            return

        pattern = self._user_patterns[user_id]

        # Update response rate with exponential moving average
        alpha = 0.1  # Learning rate
        response_value = 1.0 if responded else 0.0
        pattern.response_rate_to_proactive = (
            alpha * response_value +
            (1 - alpha) * pattern.response_rate_to_proactive
        )

        # Record in history
        self._message_history[user_id].append({
            "message_id": message_id,
            "responded": responded,
            "response_delay": response_delay_seconds,
            "timestamp": datetime.utcnow()
        })

    # ==================== Message Generation ====================

    def get_optimal_engagement_time(
        self,
        user_id: str,
        within_hours: int = 24
    ) -> Optional[datetime]:
        """Determine the optimal time to engage with a user."""
        if user_id not in self._user_patterns:
            return None

        pattern = self._user_patterns[user_id]

        if not pattern.preferred_hours:
            return None

        now = datetime.utcnow()
        current_hour = now.hour

        # Find the next preferred hour
        for hours_ahead in range(1, within_hours + 1):
            check_hour = (current_hour + hours_ahead) % 24
            if check_hour in pattern.preferred_hours:
                optimal_time = now + timedelta(hours=hours_ahead)
                # Set to the start of that hour
                optimal_time = optimal_time.replace(minute=0, second=0, microsecond=0)
                # Add some randomness (0-30 minutes)
                optimal_time += timedelta(minutes=random.randint(0, 30))
                return optimal_time

        return None

    def generate_proactive_message(
        self,
        user_id: str,
        trigger: EngagementTrigger,
        context: Dict[str, Any]
    ) -> Optional[ProactiveMessage]:
        """Generate a proactive message for a user."""
        # Check rate limits
        if not self._can_send_proactive(user_id):
            logger.debug(f"Rate limit reached for user {user_id}")
            return None

        # Get user pattern for personalization
        pattern = self._user_patterns.get(user_id)

        # Select appropriate starters
        starters = self._starters.get(trigger, [])
        if not starters:
            return None

        # Choose starter based on user's emotional history
        if pattern and pattern.emotional_states_tracked:
            # Prefer tones that match recent emotional states
            dominant_emotion = max(
                pattern.emotional_states_tracked.items(),
                key=lambda x: x[1]
            )[0]

            # Map emotions to tones
            emotion_tone_map = {
                "anxiety": MessageTone.SUPPORTIVE,
                "sadness": MessageTone.GENTLE,
                "gratitude": MessageTone.CELEBRATORY,
                "serenity": MessageTone.CURIOUS,
                "anger": MessageTone.GENTLE,
            }
            preferred_tone = emotion_tone_map.get(dominant_emotion, MessageTone.GENTLE)

            # Filter starters by tone
            matching_starters = [s for s in starters if s.tone == preferred_tone]
            if matching_starters:
                starters = matching_starters

        # Select a starter
        starter = random.choice(starters)

        # Check if we have required context
        for required in starter.requires_context:
            if required not in context:
                # Try to provide defaults
                if required == "time_of_day":
                    hour = datetime.utcnow().hour
                    if 5 <= hour < 12:
                        context["time_of_day"] = "morning"
                    elif 12 <= hour < 17:
                        context["time_of_day"] = "afternoon"
                    elif 17 <= hour < 21:
                        context["time_of_day"] = "evening"
                    else:
                        context["time_of_day"] = "night"
                elif required == "name":
                    context["name"] = "friend"
                else:
                    logger.warning(f"Missing required context: {required}")
                    return None

        # Generate message
        template = random.choice(starter.templates)
        try:
            message_text = template.format(**context)
        except KeyError as e:
            logger.error(f"Missing context key in template: {e}")
            return None

        # Determine scheduled time
        scheduled_time = self.get_optimal_engagement_time(user_id) or (
            datetime.utcnow() + timedelta(minutes=5)
        )

        # Create message
        message = ProactiveMessage(
            user_id=user_id,
            trigger=trigger,
            tone=starter.tone,
            message=message_text,
            scheduled_time=scheduled_time,
            context=context,
            priority=self._calculate_priority(trigger, pattern),
            expires_at=scheduled_time + timedelta(hours=4)
        )

        # Add to scheduled messages
        self._scheduled_messages.append(message)

        return message

    def _can_send_proactive(self, user_id: str) -> bool:
        """Check if we can send another proactive message to this user."""
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Count messages sent today
        today_messages = [
            m for m in self._scheduled_messages
            if m.user_id == user_id and m.scheduled_time >= today_start
        ]

        if len(today_messages) >= self._max_proactive_per_day:
            return False

        # Check time since last message
        if today_messages:
            last_message = max(today_messages, key=lambda m: m.scheduled_time)
            hours_since = (now - last_message.scheduled_time).total_seconds() / 3600
            if hours_since < self._min_hours_between_proactive:
                return False

        return True

    def _calculate_priority(
        self,
        trigger: EngagementTrigger,
        pattern: Optional[UserEngagementPattern]
    ) -> int:
        """Calculate message priority (1-10)."""
        # Base priority by trigger type
        base_priority = {
            EngagementTrigger.MILESTONE: 9,
            EngagementTrigger.STREAK_REMINDER: 8,
            EngagementTrigger.INACTIVITY: 7,
            EngagementTrigger.MOOD_CHECK: 6,
            EngagementTrigger.TIME_PATTERN: 5,
            EngagementTrigger.VERSE_REMINDER: 5,
            EngagementTrigger.REFLECTION_PROMPT: 4,
        }.get(trigger, 5)

        # Adjust based on user's response rate
        if pattern and pattern.response_rate_to_proactive > 0:
            # Higher response rate = higher priority
            priority_boost = int(pattern.response_rate_to_proactive * 2)
            base_priority = min(10, base_priority + priority_boost)

        return base_priority

    # ==================== Scheduled Message Management ====================

    def get_pending_messages(
        self,
        user_id: Optional[str] = None
    ) -> List[ProactiveMessage]:
        """Get pending scheduled messages."""
        now = datetime.utcnow()

        messages = [
            m for m in self._scheduled_messages
            if m.scheduled_time <= now
            and (m.expires_at is None or m.expires_at > now)
        ]

        if user_id:
            messages = [m for m in messages if m.user_id == user_id]

        return sorted(messages, key=lambda m: m.priority, reverse=True)

    def mark_message_delivered(self, message: ProactiveMessage) -> None:
        """Mark a message as delivered."""
        if message in self._scheduled_messages:
            self._scheduled_messages.remove(message)

    def cancel_scheduled_messages(
        self,
        user_id: str,
        trigger: Optional[EngagementTrigger] = None
    ) -> int:
        """Cancel scheduled messages for a user."""
        before_count = len(self._scheduled_messages)

        self._scheduled_messages = [
            m for m in self._scheduled_messages
            if not (
                m.user_id == user_id
                and (trigger is None or m.trigger == trigger)
            )
        ]

        cancelled = before_count - len(self._scheduled_messages)
        logger.info(f"Cancelled {cancelled} scheduled messages for user {user_id}")
        return cancelled

    # ==================== Trigger Detection ====================

    async def check_inactivity_triggers(self) -> List[ProactiveMessage]:
        """Check for users who might need an inactivity message."""
        messages = []
        now = datetime.utcnow()
        threshold = timedelta(hours=self._inactivity_threshold_hours)

        for user_id, pattern in self._user_patterns.items():
            if pattern.last_engagement:
                inactive_duration = now - pattern.last_engagement

                if inactive_duration > threshold:
                    # Generate inactivity message
                    message = self.generate_proactive_message(
                        user_id,
                        EngagementTrigger.INACTIVITY,
                        {"name": "friend"}  # Would be replaced with actual name
                    )
                    if message:
                        messages.append(message)

        return messages

    async def check_streak_reminders(
        self,
        active_streaks: Dict[str, int]
    ) -> List[ProactiveMessage]:
        """Generate streak reminder messages."""
        messages = []

        for user_id, streak_days in active_streaks.items():
            # Remind at significant milestones
            if streak_days in [3, 7, 14, 21, 30, 50, 100, 365]:
                message = self.generate_proactive_message(
                    user_id,
                    EngagementTrigger.STREAK_REMINDER,
                    {"name": "friend", "streak_days": streak_days}
                )
                if message:
                    messages.append(message)

        return messages

    def get_user_pattern(self, user_id: str) -> Optional[UserEngagementPattern]:
        """Get the engagement pattern for a user."""
        return self._user_patterns.get(user_id)

    def register_notification_callback(self, callback: Callable) -> None:
        """Register a callback for when messages should be delivered."""
        self._notification_callbacks.append(callback)


# Singleton instance
_engagement_instance: Optional[ProactiveEngagementService] = None


def get_proactive_engagement_service() -> ProactiveEngagementService:
    """Get the singleton proactive engagement service instance."""
    global _engagement_instance
    if _engagement_instance is None:
        _engagement_instance = ProactiveEngagementService()
    return _engagement_instance
