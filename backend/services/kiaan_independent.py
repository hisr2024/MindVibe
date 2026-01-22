"""
KIAAN Independent - Unified Intelligence Engine

This module unifies KIAAN's capabilities into a single, independent AI system:
1. Wellness Companion - Original emotional support with Gita wisdom
2. Software Researcher - Expert at finding and synthesizing technical information
3. Python Specialist - Expert developer who can write and analyze code
4. Knowledge Synthesizer - Combines all sources into coherent, actionable insights

KIAAN Independence Philosophy:
- KIAAN should be able to handle any software-related query autonomously
- KIAAN should use tools proactively without needing explicit instructions
- KIAAN should maintain context and learn from interactions
- KIAAN should provide comprehensive, well-researched answers
"""

import asyncio
import json
import logging
from datetime import datetime
from enum import Enum
from typing import Any, AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from backend.services.kiaan_core import KIAANCore, kiaan_core
from backend.services.kiaan_agent_orchestrator import (
    KIAANAgentOrchestrator,
    AgentContext,
    AgentMode,
    kiaan_orchestrator
)
from backend.services.kiaan_agent_tools import KIAAN_TOOLS, execute_tool
from backend.services.kiaan_memory import kiaan_memory, MemoryType

logger = logging.getLogger(__name__)


class QueryIntent(str, Enum):
    """Detected intent of user query."""
    WELLNESS = "wellness"           # Emotional support, life guidance
    RESEARCH = "research"           # Find information about software/tech
    CODE = "code"                   # Write, debug, or analyze code
    ANALYSIS = "analysis"           # Understand systems or concepts
    GENERAL = "general"             # General questions


class KIAANIndependent:
    """
    KIAAN Independent - The unified intelligence engine.

    This class serves as the primary interface to KIAAN, automatically
    routing queries to the appropriate handler based on intent detection.

    Capabilities:
    - Automatic intent detection
    - Seamless mode switching between wellness and developer modes
    - Persistent memory across sessions
    - Tool-augmented responses
    - Multi-turn context awareness
    """

    # Keywords for intent detection
    INTENT_KEYWORDS = {
        QueryIntent.WELLNESS: [
            "feeling", "stressed", "anxious", "worried", "sad", "happy",
            "peace", "calm", "meditat", "breath", "emotion", "mental",
            "wellness", "guidance", "advice", "life", "dharma", "karma",
            "purpose", "meaning", "struggle", "overwhelm", "help me",
            "i feel", "i am", "i'm feeling", "support"
        ],
        QueryIntent.CODE: [
            "code", "program", "function", "class", "python", "javascript",
            "debug", "error", "fix", "write", "implement", "create",
            "script", "algorithm", "data structure", "api", "endpoint",
            "def ", "async ", "import ", "return ", "```", "syntax",
            "compile", "runtime", "exception", "traceback", "bug"
        ],
        QueryIntent.RESEARCH: [
            "how does", "what is", "explain", "documentation", "library",
            "framework", "package", "tutorial", "best practice", "compare",
            "difference between", "example", "use case", "when to use",
            "recommend", "alternative", "guide", "learn", "understand"
        ],
        QueryIntent.ANALYSIS: [
            "analyze", "review", "examine", "structure", "architecture",
            "dependency", "pattern", "design", "evaluate", "assess",
            "understand", "how it works", "codebase", "repository",
            "project", "system", "breakdown"
        ]
    }

    # System prompts for unified behavior
    UNIFIED_SYSTEM_PROMPT = """You are KIAAN, an advanced AI assistant with dual expertise:

1. WELLNESS COMPANION: You provide compassionate emotional support rooted in
   timeless wisdom. You help users find peace, clarity, and purpose.

2. SOFTWARE SPECIALIST: You are an expert researcher and Python developer who can:
   - Research any software topic thoroughly using web search and documentation
   - Write clean, efficient, well-documented code
   - Analyze and explain complex systems
   - Debug issues and suggest improvements

IMPORTANT BEHAVIORS:
- Detect what the user needs and respond appropriately
- For emotional/life questions: Be warm, compassionate, wise
- For technical questions: Be precise, thorough, use tools to verify
- Always be helpful, accurate, and thoughtful
- If unsure about facts, use research tools to verify
- For code questions, test your code when possible

You seamlessly switch between these modes based on what the user needs.
You are independent, capable, and always eager to help."""

    def __init__(self):
        """Initialize the unified KIAAN engine."""
        self.wellness_core = kiaan_core
        self.agent_orchestrator = kiaan_orchestrator
        self.memory = kiaan_memory
        self.ready = self.wellness_core.ready or self.agent_orchestrator.ready

    def detect_intent(self, message: str) -> QueryIntent:
        """
        Detect the intent of a user message.

        Uses keyword matching and context analysis to determine
        whether the query is wellness-related, code-related, etc.
        """
        message_lower = message.lower()

        # Score each intent
        scores = {intent: 0 for intent in QueryIntent}

        for intent, keywords in self.INTENT_KEYWORDS.items():
            for keyword in keywords:
                if keyword in message_lower:
                    scores[intent] += 1

        # Check for explicit code markers
        if "```" in message or message.strip().startswith(("def ", "class ", "import ")):
            scores[QueryIntent.CODE] += 5

        # Check for question patterns
        if any(message_lower.startswith(q) for q in ["how do i", "what is", "can you explain"]):
            scores[QueryIntent.RESEARCH] += 2

        # Get highest scoring intent
        max_intent = max(scores, key=scores.get)
        max_score = scores[max_intent]

        # Default to general if no strong signal
        if max_score < 2:
            return QueryIntent.GENERAL

        return max_intent

    async def process(
        self,
        message: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        db: Optional[AsyncSession] = None,
        stream: bool = True,
        force_mode: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Process a message through the unified KIAAN engine.

        This is the main entry point that:
        1. Detects intent (wellness vs technical)
        2. Routes to appropriate handler
        3. Maintains context via memory
        4. Returns streamed response

        Args:
            message: User message
            user_id: Optional user ID
            session_id: Session ID for continuity
            db: Database session for wellness queries
            stream: Whether to stream response
            force_mode: Force a specific mode (wellness, research, code, analysis)

        Yields:
            Response chunks
        """
        # Generate session ID if not provided
        session_id = session_id or f"kiaan_{int(datetime.now().timestamp())}"

        # Store user message in memory
        await self.memory.store_conversation_turn(
            session_id=session_id,
            role="user",
            content=message,
            user_id=user_id
        )

        # Detect or force intent
        if force_mode:
            intent = QueryIntent(force_mode)
        else:
            intent = self.detect_intent(message)

        logger.info(f"KIAAN Independent: Processing message with intent={intent.value}")

        # Route to appropriate handler
        full_response = []

        if intent == QueryIntent.WELLNESS and db is not None:
            # Use wellness core for emotional support
            async for chunk in self._handle_wellness(message, user_id, db, session_id):
                full_response.append(chunk)
                yield chunk
        else:
            # Use agent orchestrator for technical queries
            async for chunk in self._handle_technical(message, intent, session_id):
                full_response.append(chunk)
                yield chunk

        # Store assistant response
        await self.memory.store_conversation_turn(
            session_id=session_id,
            role="assistant",
            content="".join(full_response),
            user_id=user_id
        )

    async def _handle_wellness(
        self,
        message: str,
        user_id: Optional[str],
        db: AsyncSession,
        session_id: str
    ) -> AsyncGenerator[str, None]:
        """Handle wellness-related queries using the original KIAAN core."""
        try:
            # Use streaming for wellness responses
            async for chunk in self.wellness_core.get_kiaan_response_streaming(
                message=message,
                user_id=user_id,
                db=db,
                context="general"
            ):
                yield chunk
        except Exception as e:
            logger.error(f"Wellness handler error: {e}")
            yield "I'm here for you. Let me try to help...\n\n"
            # Fallback to agent for synthesis
            async for chunk in self._handle_technical(
                f"Please provide compassionate guidance for: {message}",
                QueryIntent.GENERAL,
                session_id
            ):
                yield chunk

    async def _handle_technical(
        self,
        message: str,
        intent: QueryIntent,
        session_id: str
    ) -> AsyncGenerator[str, None]:
        """Handle technical queries using the agent orchestrator."""
        # Map intent to agent mode
        mode_map = {
            QueryIntent.RESEARCH: AgentMode.RESEARCHER,
            QueryIntent.CODE: AgentMode.DEVELOPER,
            QueryIntent.ANALYSIS: AgentMode.ANALYST,
            QueryIntent.GENERAL: AgentMode.HYBRID
        }

        mode = mode_map.get(intent, AgentMode.HYBRID)

        # Create agent context
        context = AgentContext(
            session_id=session_id,
            mode=mode
        )

        # Load conversation history
        history = await self.memory.get_conversation_history(session_id, limit=5)
        context.conversation_history = [
            {"role": h.get("role", "user"), "content": h.get("content", "")}
            for h in history
        ]

        # Process through orchestrator
        try:
            async for chunk in self.agent_orchestrator.process_query(
                query=message,
                context=context,
                stream=True
            ):
                yield chunk
        except Exception as e:
            logger.error(f"Technical handler error: {e}")
            yield f"I encountered an issue while processing your request. Error: {str(e)}\n"
            yield "Let me try a simpler approach...\n\n"
            # Provide basic response
            yield self._get_fallback_response(message, intent)

    def _get_fallback_response(self, message: str, intent: QueryIntent) -> str:
        """Get a fallback response when processing fails."""
        fallbacks = {
            QueryIntent.CODE: """I can help you with code! Here are some things I can do:
- Write Python functions and classes
- Debug errors and issues
- Explain code and concepts
- Review and improve code

Please try rephrasing your request or provide more details.""",

            QueryIntent.RESEARCH: """I can help you research software topics! I can:
- Search documentation and tutorials
- Find code examples and best practices
- Explain libraries and frameworks
- Compare different approaches

Please let me know what you'd like to learn about.""",

            QueryIntent.ANALYSIS: """I can help analyze code and systems! I can:
- Review code structure and organization
- Identify patterns and dependencies
- Explain how systems work
- Suggest improvements

Please share what you'd like me to analyze.""",

            QueryIntent.GENERAL: """I'm KIAAN, your AI assistant. I can help with:
- Software research and documentation
- Python programming and code analysis
- Technical explanations and guidance
- Emotional support and wellness

How can I help you today?"""
        }
        return fallbacks.get(intent, fallbacks[QueryIntent.GENERAL])

    async def quick_search(self, query: str) -> dict:
        """Perform a quick web search for research."""
        result = await execute_tool("web_search", query=query, max_results=5)
        return result.to_dict()

    async def execute_code(self, code: str, timeout: int = 30) -> dict:
        """Execute Python code in sandbox."""
        result = await execute_tool(
            "python_execute",
            code=code,
            timeout_seconds=timeout
        )
        return result.to_dict()

    async def analyze_file(self, file_path: str, analysis_type: str = "read") -> dict:
        """Analyze a code file."""
        result = await execute_tool(
            "file_analyze",
            file_path=file_path,
            analysis_type=analysis_type
        )
        return result.to_dict()

    async def fetch_docs(self, package: str) -> dict:
        """Fetch documentation for a Python package."""
        result = await execute_tool(
            "fetch_documentation",
            package_name=package
        )
        return result.to_dict()

    async def analyze_repo(self, repo_url: str) -> dict:
        """Analyze a GitHub repository."""
        result = await execute_tool(
            "analyze_repository",
            repo_url=repo_url
        )
        return result.to_dict()

    def get_capabilities(self) -> dict:
        """Get KIAAN's current capabilities."""
        return {
            "version": "2.0.0-independent",
            "name": "KIAAN Independent",
            "ready": self.ready,
            "modes": {
                "wellness": {
                    "enabled": self.wellness_core.ready,
                    "description": "Emotional support with Gita wisdom"
                },
                "research": {
                    "enabled": self.agent_orchestrator.ready,
                    "description": "Software research and documentation"
                },
                "developer": {
                    "enabled": self.agent_orchestrator.ready,
                    "description": "Python code writing and analysis"
                },
                "analyst": {
                    "enabled": self.agent_orchestrator.ready,
                    "description": "System and code analysis"
                }
            },
            "tools": list(KIAAN_TOOLS.keys()),
            "features": [
                "Intent detection",
                "Automatic mode switching",
                "Tool-augmented responses",
                "Persistent memory",
                "Multi-turn conversations",
                "Code execution sandbox",
                "Web research",
                "Repository analysis"
            ]
        }


# Singleton instance
kiaan_independent = KIAANIndependent()


# Export
__all__ = [
    "KIAANIndependent",
    "QueryIntent",
    "kiaan_independent"
]
