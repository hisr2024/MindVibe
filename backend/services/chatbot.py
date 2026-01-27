"""
AI Chatbot Service with wisdom verse integration.

Provides conversational AI capabilities with mental health support.
Implements complete MindVibe AI Mental-Wellness Coach with 4-phase framework:
- Phase 1: Core Response Engine (6-step framework)
- Phase 2: Knowledge Domain Integration (9 psychological domains)
- Phase 3: Safety & Quality Control
- Phase 4: Evidence-Based Psychology Integration
"""

import datetime
from collections import OrderedDict
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from backend.services.action_plan_generator import ActionPlanGenerator
from backend.services.domain_mapper import DomainMapper
from backend.services.psychology_patterns import PsychologyPatterns
from backend.services.response_engine import ResponseEngine
from backend.services.safety_validator import SafetyValidator
from backend.services.wisdom_kb import WisdomKnowledgeBase


class BoundedConversationStore:
    """Memory-safe conversation storage with LRU eviction and TTL.

    Architecture Decision: In-Memory Session Storage
    ------------------------------------------------
    This store is intentionally in-memory (not persisted to database/Redis) because:

    1. Stateless Scaling: Allows horizontal scaling without session affinity
    2. Privacy: Conversation history is ephemeral, not stored permanently
    3. Performance: No database round-trips for conversation context
    4. Simplicity: No external dependencies for basic chat functionality

    Trade-offs:
    - Session data is lost on server restart
    - Users lose context if routed to different server instances
    - Not suitable for conversation analytics (use audit logs instead)

    Future Enhancement:
    For production environments needing persistence, implement a Redis-backed
    store by subclassing this and overriding get/append methods:

        class RedisConversationStore(BoundedConversationStore):
            def __init__(self, redis_url: str):
                self.redis = Redis.from_url(redis_url)
            def get(self, session_id: str) -> list[dict]:
                return json.loads(self.redis.get(f"chat:{session_id}") or "[]")
            # etc.

    The current in-memory implementation is appropriate for MindVibe's mental
    health context where users typically have short, self-contained sessions.
    """

    # Memory limits
    MAX_SESSIONS = 10000  # Maximum concurrent sessions
    MAX_MESSAGES_PER_SESSION = 50  # Maximum messages per session
    SESSION_TTL_HOURS = 24  # Session expiration time

    def __init__(self) -> None:
        """Initialize the bounded conversation store."""
        # OrderedDict for LRU eviction
        self._sessions: OrderedDict[str, dict[str, Any]] = OrderedDict()

    def _cleanup_expired_sessions(self) -> None:
        """Remove sessions older than TTL."""
        now = datetime.datetime.now(datetime.UTC)
        cutoff = now - datetime.timedelta(hours=self.SESSION_TTL_HOURS)

        # Collect expired session IDs
        expired = [
            sid for sid, data in self._sessions.items()
            if data.get("last_activity", now) < cutoff
        ]

        # Remove expired sessions
        for sid in expired:
            del self._sessions[sid]

    def _evict_if_needed(self) -> None:
        """Evict oldest sessions if over limit."""
        while len(self._sessions) > self.MAX_SESSIONS:
            # Remove oldest (first) entry
            self._sessions.popitem(last=False)

    def get(self, session_id: str) -> list[dict]:
        """Get conversation history for a session."""
        if session_id not in self._sessions:
            return []

        # Move to end (most recently used)
        self._sessions.move_to_end(session_id)
        return self._sessions[session_id].get("messages", [])

    def append(self, session_id: str, message: dict) -> None:
        """Add a message to a session's history."""
        now = datetime.datetime.now(datetime.UTC)

        if session_id not in self._sessions:
            # Periodic cleanup before adding new session
            if len(self._sessions) % 100 == 0:
                self._cleanup_expired_sessions()

            self._evict_if_needed()
            self._sessions[session_id] = {"messages": [], "last_activity": now}

        # Move to end (most recently used)
        self._sessions.move_to_end(session_id)
        self._sessions[session_id]["last_activity"] = now

        messages = self._sessions[session_id]["messages"]
        messages.append(message)

        # Trim to max messages (keep most recent)
        if len(messages) > self.MAX_MESSAGES_PER_SESSION:
            self._sessions[session_id]["messages"] = messages[-self.MAX_MESSAGES_PER_SESSION:]

    def clear(self, session_id: str) -> bool:
        """Clear a session's history."""
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

    def exists(self, session_id: str) -> bool:
        """Check if a session exists."""
        return session_id in self._sessions

    def session_count(self) -> int:
        """Get current number of active sessions."""
        return len(self._sessions)

    def keys(self) -> list[str]:
        """Get all session IDs."""
        return list(self._sessions.keys())


class ChatbotService:
    """Enhanced chatbot service with wisdom knowledge base integration."""

    def __init__(self) -> None:
        """Initialize the chatbot service."""
        self.kb = WisdomKnowledgeBase()
        # Use bounded conversation store instead of unbounded dict
        self._conversation_store = BoundedConversationStore()
        # Phase 1: Core Response Engine
        self.response_engine = ResponseEngine()
        self.action_generator = ActionPlanGenerator()
        # Phase 2: Domain Integration
        self.domain_mapper = DomainMapper()
        # Phase 3: Safety & Quality
        self.safety_validator = SafetyValidator()
        # Phase 4: Evidence-Based Psychology
        self.psychology_patterns = PsychologyPatterns()

    @property
    def conversation_histories(self) -> dict:
        """Backward compatibility: return dict-like access to conversations.

        Note: This is deprecated. Use get_conversation_history() instead.
        """
        # Return a view that mimics dict access for backward compatibility
        return {sid: self._conversation_store.get(sid) for sid in self._conversation_store.keys()}

    def get_conversation_history(self, session_id: str) -> list[dict]:
        """
        Get conversation history for a session.

        Args:
            session_id: Session identifier

        Returns:
            List of conversation messages or empty list if session doesn't exist
        """
        return self._conversation_store.get(session_id)

    def clear_conversation(self, session_id: str) -> bool:
        """
        Clear conversation history for a session.

        Args:
            session_id: Session identifier

        Returns:
            True if session existed and was cleared, False otherwise
        """
        return self._conversation_store.clear(session_id)

    def get_active_sessions(self) -> list[str]:
        """
        Get list of active session IDs.

        Returns:
            List of session IDs
        """
        return self._conversation_store.keys()

    def _generate_template_chat_response(
        self,
        message: str,
        verses: list[dict],
        language: str = "english",
    ) -> str:
        """
        Generate a template-based chat response.

        Args:
            message: User's message
            verses: List of verse dictionaries with 'verse' and 'score' keys
            language: Response language

        Returns:
            Generated response text
        """
        # Template responses based on themes
        theme_templates = {
            "action_without_attachment": [
                "I understand you're seeking guidance on taking action while managing expectations.",
                "Focus on your effort and process, rather than worrying about outcomes.",
                "Remember that you can control your actions, but not always the results.",
            ],
            "equanimity_in_adversity": [
                "Maintaining stability and calm during difficult times is a valuable practice.",
                "Finding peace within yourself, regardless of external circumstances, brings true strength.",
                "Balance in both success and failure leads to greater emotional resilience.",
            ],
            "control_of_mind": [
                "Awareness of your thought patterns is the first step toward managing them.",
                "Observing your thoughts without judgment can help create mental space.",
                "Practice brings gradual mastery over the fluctuations of the mind.",
            ],
            "self_empowerment": [
                "You have the power to create change in your life.",
                "Taking control starts with recognizing your own agency and capability.",
                "Small steps toward empowerment build lasting confidence.",
            ],
            "mastering_the_mind": [
                "Cultivating mental mastery is a journey that requires patience and practice.",
                "The mind can be your greatest ally when properly understood and trained.",
                "Regular practice and persistence lead to greater mental clarity.",
            ],
        }

        # If we have verses, use theme-specific response
        if verses and len(verses) > 0:
            verse = verses[0]["verse"]
            theme = verse.theme
            templates = theme_templates.get(
                theme,
                [
                    "I hear what you're sharing. Let me offer some wisdom that might help.",
                    "Thank you for sharing. Here's some guidance that may resonate with you.",
                ],
            )
            base_response = (
                templates[0] if templates else "Let me share some wisdom with you."
            )
        else:
            # Generic supportive response when no verses found
            base_response = "I understand what you're going through. While I don't have specific guidance at this moment, know that seeking inner peace and clarity is a valuable journey."

        return base_response

    def _generate_chat_response(
        self,
        message: str,
        conversation_history: list[dict],
        verses: list[dict],
        language: str = "english",
    ) -> str:
        """
        Generate a chat response using the complete 4-phase framework.

        Phase 1: Core Response Engine (6-step framework)
        Phase 2: Domain-aware response
        Phase 3: Safety validation
        Phase 4: Evidence-based psychology patterns

        Args:
            message: User's message
            conversation_history: Previous conversation messages
            verses: Relevant verses found
            language: Response language

        Returns:
            Generated response text
        """
        # PHASE 3: Check for crisis first
        crisis_info = self.safety_validator.detect_crisis(message)
        if crisis_info["crisis_detected"]:
            # Return crisis response immediately
            crisis_response = self.safety_validator.generate_crisis_response(crisis_info)
            return crisis_response

        # PHASE 2: Determine psychological domain from query
        domain = self.domain_mapper.route_query_to_domain(message)

        # If verses available, use verse domain
        if verses and len(verses) > 0:
            verse = verses[0]["verse"]
            if hasattr(verse, "primary_domain") and verse.primary_domain:
                domain = verse.primary_domain

        # PHASE 1: Generate response using 6-step framework
        response_data = self.response_engine.generate_response(
            user_message=message,
            domain=domain,
            verses=verses,
        )

        response_text = response_data["response"]

        # PHASE 3: Sanitize religious terms
        response_text = self.safety_validator.sanitize_religious_terms(response_text)

        # PHASE 3: Validate response quality
        validation = self.safety_validator.validate_response_quality(response_text)

        # If validation fails, use template fallback
        if not validation["valid"]:
            return self._generate_template_chat_response(message, verses, language)

        return response_text

    async def chat(
        self,
        message: str,
        session_id: str,
        db: AsyncSession,
        language: str = "english",
        theme: str | None = None,
        include_sanskrit: bool = False,
    ) -> dict:
        """
        Process a chat message and generate a response.

        Args:
            message: User's message
            session_id: Session identifier
            db: Database session
            language: Response language preference
            theme: Optional theme filter
            include_sanskrit: Whether to include Sanskrit in verses

        Returns:
            Dictionary with response, verses, and metadata
        """
        # Add user message to history (bounded store handles session creation)
        timestamp = datetime.datetime.now(datetime.UTC).isoformat()
        self._conversation_store.append(
            session_id,
            {
                "role": "user",
                "content": message,
                "timestamp": timestamp,
            }
        )

        # Search for relevant verses
        verse_results = await self.kb.search_relevant_verses(
            db=db,
            query=message,
            theme=theme,
        )

        # Get conversation history (limit to last 6 messages for context)
        history = self._conversation_store.get(session_id)[-6:]

        # Generate response
        response_text = self._generate_chat_response(
            message=message,
            conversation_history=history,
            verses=verse_results,
            language=language,
        )

        # Add assistant response to history
        self._conversation_store.append(
            session_id,
            {
                "role": "assistant",
                "content": response_text,
                "timestamp": datetime.datetime.now(datetime.UTC).isoformat(),
            }
        )

        # Format verses for response
        formatted_verses = []
        for verse_result in verse_results[:3]:  # Return top 3 verses
            verse = verse_result["verse"]
            formatted_verse = self.kb.format_verse_response(
                verse=verse,
                language=language,
                include_sanskrit=include_sanskrit,
            )
            formatted_verse["relevance_score"] = verse_result["score"]
            formatted_verses.append(formatted_verse)

        return {
            "session_id": session_id,
            "response": response_text,
            "verses": formatted_verses,
            "language": language,
            "conversation_length": len(self._conversation_store.get(session_id)),
        }


# Backward compatibility aliases
Chatbot = ChatbotService
EnhancedChatbot = ChatbotService
