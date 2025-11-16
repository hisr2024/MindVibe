"""
AI Chatbot Service with wisdom verse integration.

Provides conversational AI capabilities with mental health support.
"""

import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from backend.services.wisdom_kb import WisdomKnowledgeBase


class ChatbotService:
    """Enhanced chatbot service with wisdom knowledge base integration."""

    def __init__(self) -> None:
        """Initialize the chatbot service."""
        self.kb = WisdomKnowledgeBase()
        self.conversation_histories: dict[str, list[dict]] = {}

    def get_conversation_history(self, session_id: str) -> list[dict]:
        """
        Get conversation history for a session.

        Args:
            session_id: Session identifier

        Returns:
            List of conversation messages or empty list if session doesn't exist
        """
        return self.conversation_histories.get(session_id, [])

    def clear_conversation(self, session_id: str) -> bool:
        """
        Clear conversation history for a session.

        Args:
            session_id: Session identifier

        Returns:
            True if session existed and was cleared, False otherwise
        """
        if session_id in self.conversation_histories:
            del self.conversation_histories[session_id]
            return True
        return False

    def get_active_sessions(self) -> list[str]:
        """
        Get list of active session IDs.

        Returns:
            List of session IDs
        """
        return list(self.conversation_histories.keys())

    def _generate_template_chat_response(
        self,
        message: str,  # noqa: ARG002
        verses: list[dict],
        language: str = "english",  # noqa: ARG002
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
        conversation_history: list[dict],  # noqa: ARG002
        verses: list[dict],
        language: str = "english",
    ) -> str:
        """
        Generate a chat response (can be template or AI-based).

        For now, uses template responses. Can be extended with OpenAI integration.

        Args:
            message: User's message
            conversation_history: Previous conversation messages
            verses: Relevant verses found
            language: Response language

        Returns:
            Generated response text
        """
        # Use template response for now
        return self._generate_template_chat_response(message, verses, language)

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
        # Initialize session if it doesn't exist
        if session_id not in self.conversation_histories:
            self.conversation_histories[session_id] = []

        # Add user message to history
        timestamp = datetime.datetime.now(datetime.UTC).isoformat()
        self.conversation_histories[session_id].append(
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
        history = self.conversation_histories[session_id][-6:]

        # Generate response
        response_text = self._generate_chat_response(
            message=message,
            conversation_history=history,
            verses=verse_results,
            language=language,
        )

        # Add assistant response to history
        self.conversation_histories[session_id].append(
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
            "conversation_length": len(self.conversation_histories[session_id]),
        }


# Backward compatibility aliases
Chatbot = ChatbotService
EnhancedChatbot = ChatbotService
