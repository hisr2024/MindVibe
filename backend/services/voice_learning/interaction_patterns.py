"""
Voice Interaction Patterns Service

Learns from how users interact with voice features:
- Preferred response lengths
- Time of day voice is used
- Topics discussed via voice vs text
- Interruption patterns (when users stop listening)
- Session flow patterns

Features:
- Automatic pattern detection
- Personalized interaction optimization
- Voice vs text preference learning
- Attention span modeling
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta, time as dt_time
from typing import Dict, List, Optional, Any, Tuple, Set
from enum import Enum
import asyncio
import logging
from collections import defaultdict
import statistics

logger = logging.getLogger(__name__)


class InteractionType(Enum):
    """Types of user interactions."""
    VOICE_INPUT = "voice_input"
    TEXT_INPUT = "text_input"
    VOICE_OUTPUT_PLAYED = "voice_output_played"
    VOICE_OUTPUT_SKIPPED = "voice_output_skipped"
    VOICE_OUTPUT_INTERRUPTED = "voice_output_interrupted"
    REPLAY_REQUESTED = "replay_requested"
    TRANSCRIPT_VIEWED = "transcript_viewed"
    FEEDBACK_GIVEN = "feedback_given"


class TimeOfDay(Enum):
    """Time of day categories."""
    EARLY_MORNING = "early_morning"  # 5-8
    MORNING = "morning"  # 8-12
    AFTERNOON = "afternoon"  # 12-17
    EVENING = "evening"  # 17-21
    NIGHT = "night"  # 21-5


class ContentCategory(Enum):
    """Categories of content."""
    MEDITATION = "meditation"
    VERSE = "verse"
    GUIDANCE = "guidance"
    REFLECTION = "reflection"
    GREETING = "greeting"
    EMOTIONAL_SUPPORT = "emotional_support"
    PRACTICAL_ADVICE = "practical_advice"


@dataclass
class InteractionEvent:
    """A single interaction event."""
    event_type: InteractionType
    timestamp: datetime
    duration_seconds: Optional[float] = None
    content_length_words: Optional[int] = None
    content_category: Optional[ContentCategory] = None
    completion_rate: Optional[float] = None  # 0-1, how much was consumed
    user_action_after: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ResponseLengthPreference:
    """User's preference for response length."""
    preferred_word_count: int
    tolerance_range: Tuple[int, int]  # (min, max) acceptable
    by_content_type: Dict[ContentCategory, int]
    by_time_of_day: Dict[TimeOfDay, int]
    confidence: float


@dataclass
class AttentionSpanProfile:
    """User's attention span characteristics."""
    average_listen_duration: float  # seconds
    completion_rate_average: float  # 0-1
    optimal_segment_length: float  # seconds
    interruption_patterns: List[Dict[str, Any]]
    fatigue_point: Optional[float]  # seconds until attention drops


@dataclass
class VoiceTextPreference:
    """User's preference for voice vs text input/output."""
    voice_input_preference: float  # 0-1, 1 = always voice
    voice_output_preference: float  # 0-1, 1 = always voice
    voice_preferred_categories: List[ContentCategory]
    text_preferred_categories: List[ContentCategory]
    context_preferences: Dict[str, str]  # context -> "voice" or "text"


@dataclass
class InteractionPattern:
    """Learned interaction pattern for a user."""
    user_id: str
    response_length_pref: ResponseLengthPreference
    attention_span: AttentionSpanProfile
    voice_text_pref: VoiceTextPreference
    active_hours: List[int]  # Hours when user is typically active (0-23)
    preferred_session_duration: float  # minutes
    topics_by_time: Dict[TimeOfDay, List[str]]
    interaction_frequency: Dict[str, float]  # day of week -> avg interactions
    last_updated: datetime = field(default_factory=datetime.utcnow)


class VoiceInteractionPatternsService:
    """
    Service for learning and applying voice interaction patterns.

    Observes how users interact with voice features to optimize
    the experience for each individual user.
    """

    def __init__(self):
        self._user_patterns: Dict[str, InteractionPattern] = {}
        self._interaction_history: Dict[str, List[InteractionEvent]] = defaultdict(list)
        self._session_data: Dict[str, Dict[str, Any]] = {}
        self._initialized = False

        # Default preferences
        self._default_response_length = 100  # words
        self._default_attention_span = 45.0  # seconds
        self._history_retention_days = 30

        logger.info("VoiceInteractionPatternsService initialized")

    async def initialize(self) -> None:
        """Initialize the service."""
        if self._initialized:
            return
        self._initialized = True
        logger.info("VoiceInteractionPatternsService initialized")

    # ==================== Event Recording ====================

    def record_interaction(
        self,
        user_id: str,
        event_type: InteractionType,
        duration_seconds: Optional[float] = None,
        content_length_words: Optional[int] = None,
        content_category: Optional[ContentCategory] = None,
        completion_rate: Optional[float] = None,
        user_action_after: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> InteractionEvent:
        """Record a user interaction event."""
        event = InteractionEvent(
            event_type=event_type,
            timestamp=datetime.utcnow(),
            duration_seconds=duration_seconds,
            content_length_words=content_length_words,
            content_category=content_category,
            completion_rate=completion_rate,
            user_action_after=user_action_after,
            metadata=metadata or {}
        )

        self._interaction_history[user_id].append(event)

        # Trim old history
        cutoff = datetime.utcnow() - timedelta(days=self._history_retention_days)
        self._interaction_history[user_id] = [
            e for e in self._interaction_history[user_id]
            if e.timestamp >= cutoff
        ]

        # Update patterns periodically
        if len(self._interaction_history[user_id]) % 10 == 0:
            self._update_patterns(user_id)

        return event

    def record_voice_playback(
        self,
        user_id: str,
        content_length_words: int,
        duration_seconds: float,
        played_duration: float,
        content_category: ContentCategory,
        was_interrupted: bool = False
    ) -> InteractionEvent:
        """Record a voice playback event with detailed metrics."""
        completion_rate = played_duration / duration_seconds if duration_seconds > 0 else 0

        if was_interrupted:
            event_type = InteractionType.VOICE_OUTPUT_INTERRUPTED
        elif completion_rate < 0.5:
            event_type = InteractionType.VOICE_OUTPUT_SKIPPED
        else:
            event_type = InteractionType.VOICE_OUTPUT_PLAYED

        return self.record_interaction(
            user_id=user_id,
            event_type=event_type,
            duration_seconds=played_duration,
            content_length_words=content_length_words,
            content_category=content_category,
            completion_rate=completion_rate,
            metadata={
                "total_duration": duration_seconds,
                "interrupt_point": played_duration if was_interrupted else None
            }
        )

    # ==================== Pattern Analysis ====================

    def _update_patterns(self, user_id: str) -> None:
        """Update learned patterns for a user."""
        history = self._interaction_history.get(user_id, [])

        if len(history) < 5:
            return

        # Learn response length preference
        response_length_pref = self._learn_response_length_preference(history)

        # Learn attention span
        attention_span = self._learn_attention_span(history)

        # Learn voice/text preference
        voice_text_pref = self._learn_voice_text_preference(history)

        # Learn active hours
        active_hours = self._learn_active_hours(history)

        # Learn topics by time
        topics_by_time = self._learn_topics_by_time(history)

        # Learn interaction frequency
        frequency = self._learn_interaction_frequency(history)

        # Calculate session duration preference
        session_duration = self._learn_session_duration(user_id)

        self._user_patterns[user_id] = InteractionPattern(
            user_id=user_id,
            response_length_pref=response_length_pref,
            attention_span=attention_span,
            voice_text_pref=voice_text_pref,
            active_hours=active_hours,
            preferred_session_duration=session_duration,
            topics_by_time=topics_by_time,
            interaction_frequency=frequency,
            last_updated=datetime.utcnow()
        )

    def _learn_response_length_preference(
        self,
        history: List[InteractionEvent]
    ) -> ResponseLengthPreference:
        """Learn preferred response length from history."""
        # Get completed voice outputs
        completed = [
            e for e in history
            if e.event_type == InteractionType.VOICE_OUTPUT_PLAYED
            and e.completion_rate and e.completion_rate > 0.8
            and e.content_length_words
        ]

        if not completed:
            return ResponseLengthPreference(
                preferred_word_count=self._default_response_length,
                tolerance_range=(50, 200),
                by_content_type={},
                by_time_of_day={},
                confidence=0.3
            )

        lengths = [e.content_length_words for e in completed if e.content_length_words]
        avg_length = int(statistics.mean(lengths))
        std_dev = statistics.stdev(lengths) if len(lengths) > 1 else 30

        # By content type
        by_content = {}
        for category in ContentCategory:
            cat_lengths = [
                e.content_length_words for e in completed
                if e.content_category == category and e.content_length_words
            ]
            if cat_lengths:
                by_content[category] = int(statistics.mean(cat_lengths))

        # By time of day
        by_time = {}
        for event in completed:
            tod = self._get_time_of_day(event.timestamp)
            if tod not in by_time:
                by_time[tod] = []
            if event.content_length_words:
                by_time[tod].append(event.content_length_words)

        by_time_avg = {
            tod: int(statistics.mean(lengths)) if lengths else avg_length
            for tod, lengths in by_time.items()
        }

        return ResponseLengthPreference(
            preferred_word_count=avg_length,
            tolerance_range=(max(30, int(avg_length - 2 * std_dev)), int(avg_length + 2 * std_dev)),
            by_content_type=by_content,
            by_time_of_day=by_time_avg,
            confidence=min(1.0, len(completed) / 20)
        )

    def _learn_attention_span(
        self,
        history: List[InteractionEvent]
    ) -> AttentionSpanProfile:
        """Learn user's attention span from listening behavior."""
        voice_events = [
            e for e in history
            if e.event_type in [
                InteractionType.VOICE_OUTPUT_PLAYED,
                InteractionType.VOICE_OUTPUT_INTERRUPTED,
                InteractionType.VOICE_OUTPUT_SKIPPED
            ]
            and e.duration_seconds is not None
        ]

        if not voice_events:
            return AttentionSpanProfile(
                average_listen_duration=self._default_attention_span,
                completion_rate_average=0.7,
                optimal_segment_length=30.0,
                interruption_patterns=[],
                fatigue_point=None
            )

        # Calculate average listen duration
        durations = [e.duration_seconds for e in voice_events if e.duration_seconds]
        avg_duration = statistics.mean(durations) if durations else self._default_attention_span

        # Calculate completion rate
        completions = [e.completion_rate for e in voice_events if e.completion_rate is not None]
        avg_completion = statistics.mean(completions) if completions else 0.7

        # Find interruption patterns
        interruptions = [
            e for e in voice_events
            if e.event_type == InteractionType.VOICE_OUTPUT_INTERRUPTED
        ]

        interruption_patterns = []
        if interruptions:
            interrupt_points = [
                e.metadata.get("interrupt_point", 0) for e in interruptions
                if e.metadata.get("interrupt_point")
            ]
            if interrupt_points:
                avg_interrupt = statistics.mean(interrupt_points)
                interruption_patterns.append({
                    "average_interrupt_point": avg_interrupt,
                    "count": len(interruptions)
                })

        # Find fatigue point (where completion starts dropping)
        sorted_by_duration = sorted(voice_events, key=lambda e: e.duration_seconds or 0)
        fatigue_point = None
        for i in range(len(sorted_by_duration) - 5):
            batch = sorted_by_duration[i:i+5]
            batch_completion = statistics.mean([
                e.completion_rate for e in batch if e.completion_rate
            ] or [1.0])
            if batch_completion < 0.6 and batch[0].duration_seconds:
                fatigue_point = batch[0].duration_seconds
                break

        return AttentionSpanProfile(
            average_listen_duration=avg_duration,
            completion_rate_average=avg_completion,
            optimal_segment_length=min(avg_duration * 0.8, 30.0),
            interruption_patterns=interruption_patterns,
            fatigue_point=fatigue_point
        )

    def _learn_voice_text_preference(
        self,
        history: List[InteractionEvent]
    ) -> VoiceTextPreference:
        """Learn user's preference for voice vs text."""
        voice_inputs = sum(
            1 for e in history if e.event_type == InteractionType.VOICE_INPUT
        )
        text_inputs = sum(
            1 for e in history if e.event_type == InteractionType.TEXT_INPUT
        )

        total_inputs = voice_inputs + text_inputs
        voice_input_pref = voice_inputs / total_inputs if total_inputs > 0 else 0.5

        # Output preference based on completion rates
        voice_outputs = [
            e for e in history
            if e.event_type in [
                InteractionType.VOICE_OUTPUT_PLAYED,
                InteractionType.VOICE_OUTPUT_INTERRUPTED,
                InteractionType.VOICE_OUTPUT_SKIPPED
            ]
        ]

        if voice_outputs:
            avg_completion = statistics.mean([
                e.completion_rate for e in voice_outputs if e.completion_rate
            ] or [0.5])
            voice_output_pref = avg_completion
        else:
            voice_output_pref = 0.5

        # Category preferences
        voice_preferred = []
        text_preferred = []

        for category in ContentCategory:
            cat_events = [
                e for e in voice_outputs
                if e.content_category == category and e.completion_rate
            ]
            if cat_events:
                avg_comp = statistics.mean([e.completion_rate for e in cat_events if e.completion_rate])
                if avg_comp > 0.7:
                    voice_preferred.append(category)
                elif avg_comp < 0.4:
                    text_preferred.append(category)

        return VoiceTextPreference(
            voice_input_preference=voice_input_pref,
            voice_output_preference=voice_output_pref,
            voice_preferred_categories=voice_preferred,
            text_preferred_categories=text_preferred,
            context_preferences={}
        )

    def _learn_active_hours(self, history: List[InteractionEvent]) -> List[int]:
        """Learn when user is typically active."""
        hour_counts = defaultdict(int)

        for event in history:
            hour_counts[event.timestamp.hour] += 1

        if not hour_counts:
            return list(range(8, 22))  # Default: 8 AM to 10 PM

        # Find hours with significant activity
        total = sum(hour_counts.values())
        threshold = total / 24 * 0.5  # Above average threshold

        active_hours = [h for h, count in hour_counts.items() if count > threshold]

        return sorted(active_hours) if active_hours else list(range(8, 22))

    def _learn_topics_by_time(
        self,
        history: List[InteractionEvent]
    ) -> Dict[TimeOfDay, List[str]]:
        """Learn what topics users prefer at different times."""
        topics_by_time: Dict[TimeOfDay, List[str]] = defaultdict(list)

        for event in history:
            if event.content_category:
                tod = self._get_time_of_day(event.timestamp)
                topics_by_time[tod].append(event.content_category.value)

        # Get most common topics for each time period
        result = {}
        for tod, topics in topics_by_time.items():
            if topics:
                # Count occurrences
                counts = defaultdict(int)
                for t in topics:
                    counts[t] += 1
                # Get top 3
                top_topics = sorted(counts.items(), key=lambda x: -x[1])[:3]
                result[tod] = [t for t, _ in top_topics]

        return result

    def _learn_interaction_frequency(
        self,
        history: List[InteractionEvent]
    ) -> Dict[str, float]:
        """Learn interaction frequency by day of week."""
        day_counts: Dict[str, List[int]] = defaultdict(list)
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        # Group by day
        by_date: Dict[str, int] = defaultdict(int)
        for event in history:
            date_key = event.timestamp.strftime("%Y-%m-%d")
            by_date[date_key] += 1

        # Aggregate by day of week
        for date_str, count in by_date.items():
            date = datetime.strptime(date_str, "%Y-%m-%d")
            day_name = day_names[date.weekday()]
            day_counts[day_name].append(count)

        # Calculate averages
        return {
            day: statistics.mean(counts) if counts else 0
            for day, counts in day_counts.items()
        }

    def _learn_session_duration(self, user_id: str) -> float:
        """Learn preferred session duration."""
        sessions = self._session_data.get(user_id, {}).get("sessions", [])

        if not sessions:
            return 15.0  # Default 15 minutes

        durations = [s.get("duration_minutes", 15) for s in sessions]
        return statistics.mean(durations)

    def _get_time_of_day(self, timestamp: datetime) -> TimeOfDay:
        """Get time of day category from timestamp."""
        hour = timestamp.hour

        if 5 <= hour < 8:
            return TimeOfDay.EARLY_MORNING
        elif 8 <= hour < 12:
            return TimeOfDay.MORNING
        elif 12 <= hour < 17:
            return TimeOfDay.AFTERNOON
        elif 17 <= hour < 21:
            return TimeOfDay.EVENING
        else:
            return TimeOfDay.NIGHT

    # ==================== Pattern Application ====================

    def get_user_pattern(self, user_id: str) -> Optional[InteractionPattern]:
        """Get learned interaction pattern for a user."""
        return self._user_patterns.get(user_id)

    def get_optimal_response_length(
        self,
        user_id: str,
        content_category: Optional[ContentCategory] = None,
        time_of_day: Optional[TimeOfDay] = None
    ) -> int:
        """Get optimal response length for user and context."""
        pattern = self._user_patterns.get(user_id)

        if not pattern:
            return self._default_response_length

        pref = pattern.response_length_pref

        # Check content-specific preference
        if content_category and content_category in pref.by_content_type:
            return pref.by_content_type[content_category]

        # Check time-specific preference
        if time_of_day and time_of_day in pref.by_time_of_day:
            return pref.by_time_of_day[time_of_day]

        return pref.preferred_word_count

    def should_use_voice_output(
        self,
        user_id: str,
        content_category: ContentCategory
    ) -> Tuple[bool, float]:
        """Determine if voice output should be used for this content."""
        pattern = self._user_patterns.get(user_id)

        if not pattern:
            return True, 0.5  # Default to voice with neutral confidence

        pref = pattern.voice_text_pref

        if content_category in pref.text_preferred_categories:
            return False, 0.7

        if content_category in pref.voice_preferred_categories:
            return True, 0.8

        return pref.voice_output_preference > 0.5, pref.voice_output_preference

    def get_optimal_audio_duration(self, user_id: str) -> float:
        """Get optimal audio segment duration for user."""
        pattern = self._user_patterns.get(user_id)

        if not pattern:
            return 30.0  # Default 30 seconds

        return pattern.attention_span.optimal_segment_length

    def is_good_time_to_engage(
        self,
        user_id: str,
        current_time: Optional[datetime] = None
    ) -> Tuple[bool, str]:
        """Check if current time is good for user engagement."""
        current_time = current_time or datetime.utcnow()
        current_hour = current_time.hour

        pattern = self._user_patterns.get(user_id)

        if not pattern:
            # Default: good during typical hours
            if 8 <= current_hour <= 22:
                return True, "Default active hours"
            return False, "Outside default active hours"

        if current_hour in pattern.active_hours:
            return True, "Within user's active hours"

        # Find closest active hour
        if pattern.active_hours:
            closest = min(pattern.active_hours, key=lambda h: min(abs(h - current_hour), 24 - abs(h - current_hour)))
            return False, f"User typically active around {closest}:00"

        return False, "No active hours learned yet"

    # ==================== Session Management ====================

    def start_session(self, user_id: str, session_id: str) -> None:
        """Start tracking a new session."""
        if user_id not in self._session_data:
            self._session_data[user_id] = {"sessions": []}

        self._session_data[user_id]["current_session"] = {
            "session_id": session_id,
            "start_time": datetime.utcnow(),
            "interactions": 0
        }

    def end_session(self, user_id: str, session_id: str) -> Optional[Dict[str, Any]]:
        """End a session and record metrics."""
        if user_id not in self._session_data:
            return None

        current = self._session_data[user_id].get("current_session")
        if not current or current.get("session_id") != session_id:
            return None

        end_time = datetime.utcnow()
        duration = (end_time - current["start_time"]).total_seconds() / 60

        session_summary = {
            "session_id": session_id,
            "duration_minutes": duration,
            "interactions": current["interactions"],
            "end_time": end_time
        }

        self._session_data[user_id]["sessions"].append(session_summary)
        self._session_data[user_id]["current_session"] = None

        # Keep only last 50 sessions
        self._session_data[user_id]["sessions"] = self._session_data[user_id]["sessions"][-50:]

        return session_summary

    def increment_session_interaction(self, user_id: str) -> None:
        """Increment interaction count for current session."""
        if user_id in self._session_data:
            current = self._session_data[user_id].get("current_session")
            if current:
                current["interactions"] = current.get("interactions", 0) + 1

    # ==================== Analytics ====================

    def get_interaction_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get analytics about user's interaction patterns."""
        pattern = self._user_patterns.get(user_id)
        history = self._interaction_history.get(user_id, [])

        if not pattern:
            return {"error": "No pattern data available"}

        return {
            "total_interactions": len(history),
            "response_length": {
                "preferred": pattern.response_length_pref.preferred_word_count,
                "tolerance": pattern.response_length_pref.tolerance_range,
                "confidence": pattern.response_length_pref.confidence
            },
            "attention_span": {
                "average_duration": pattern.attention_span.average_listen_duration,
                "completion_rate": pattern.attention_span.completion_rate_average,
                "optimal_segment": pattern.attention_span.optimal_segment_length,
                "fatigue_point": pattern.attention_span.fatigue_point
            },
            "voice_text_preference": {
                "voice_input": pattern.voice_text_pref.voice_input_preference,
                "voice_output": pattern.voice_text_pref.voice_output_preference,
                "voice_preferred_content": [c.value for c in pattern.voice_text_pref.voice_preferred_categories],
                "text_preferred_content": [c.value for c in pattern.voice_text_pref.text_preferred_categories]
            },
            "active_hours": pattern.active_hours,
            "preferred_session_duration": pattern.preferred_session_duration,
            "topics_by_time": {
                k.value: v for k, v in pattern.topics_by_time.items()
            },
            "interaction_frequency": pattern.interaction_frequency,
            "last_updated": pattern.last_updated.isoformat()
        }


# Singleton instance
_interaction_patterns_instance: Optional[VoiceInteractionPatternsService] = None


def get_interaction_patterns_service() -> VoiceInteractionPatternsService:
    """Get the singleton voice interaction patterns service instance."""
    global _interaction_patterns_instance
    if _interaction_patterns_instance is None:
        _interaction_patterns_instance = VoiceInteractionPatternsService()
    return _interaction_patterns_instance
