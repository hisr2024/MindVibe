"""
KIAAN Agent Orchestrator - Autonomous Task Planning and Execution

This module transforms KIAAN into an independent AI researcher and software developer
by orchestrating autonomous task planning, tool execution, and iterative refinement.

Key Capabilities:
1. Autonomous Task Planning - Breaks down complex queries into actionable steps
2. Tool Orchestration - Intelligently selects and chains tools
3. Iterative Refinement - Learns from results and adjusts strategy
4. Context Management - Maintains state across multi-turn interactions
5. Research Synthesis - Combines multiple sources into coherent responses
"""

import asyncio
import json
import logging
import re
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, AsyncGenerator, Optional

from openai import OpenAI, AsyncOpenAI
import os

from backend.services.kiaan_agent_tools import (
    KIAAN_TOOLS,
    ToolResult,
    ToolStatus,
    execute_tool,
    get_all_tool_schemas
)

logger = logging.getLogger(__name__)


class AgentMode(str, Enum):
    """Operating modes for KIAAN Agent."""
    RESEARCHER = "researcher"  # Focus on finding information
    DEVELOPER = "developer"    # Focus on writing/analyzing code
    ANALYST = "analyst"        # Focus on analyzing and explaining
    HYBRID = "hybrid"          # Combines all modes


class TaskStatus(str, Enum):
    """Status of a task in the execution plan."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class Task:
    """A single task in the execution plan."""
    id: str
    description: str
    tool_name: Optional[str] = None
    tool_params: dict = field(default_factory=dict)
    status: TaskStatus = TaskStatus.PENDING
    result: Optional[ToolResult] = None
    dependencies: list[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


@dataclass
class ExecutionPlan:
    """Plan for executing a complex query."""
    query: str
    mode: AgentMode
    tasks: list[Task] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    status: str = "planning"
    final_response: Optional[str] = None


@dataclass
class AgentContext:
    """Context maintained across agent interactions."""
    session_id: str
    user_id: Optional[str] = None
    conversation_history: list[dict] = field(default_factory=list)
    tool_results: list[ToolResult] = field(default_factory=list)
    current_plan: Optional[ExecutionPlan] = None
    knowledge_base: dict = field(default_factory=dict)
    mode: AgentMode = AgentMode.HYBRID
    max_iterations: int = 10
    current_iteration: int = 0


class KIAANAgentOrchestrator:
    """
    Main orchestrator for KIAAN's autonomous capabilities.

    This transforms KIAAN into an independent AI that can:
    - Research software topics thoroughly
    - Write and analyze Python code
    - Understand and explain complex systems
    - Plan and execute multi-step tasks
    """

    # System prompts for different modes
    SYSTEM_PROMPTS = {
        AgentMode.RESEARCHER: """You are KIAAN, an expert software researcher with deep knowledge of:
- Python programming and its ecosystem (PyPI, popular libraries)
- Software architecture and design patterns
- API design and documentation
- Open source projects and best practices
- Technical documentation analysis

Your goal is to thoroughly research topics, find authoritative sources, and synthesize
comprehensive, accurate answers. Always cite sources and provide actionable insights.

You have access to tools for:
- Web search (documentation, GitHub, StackOverflow, PyPI)
- Repository analysis (structure, dependencies, patterns)
- Documentation fetching (API references, tutorials)

IMPORTANT: Use tools proactively to find accurate, up-to-date information.
Never guess - always verify through research.""",

        AgentMode.DEVELOPER: """You are KIAAN, an expert Python software developer with skills in:
- Python 3.x (type hints, async/await, dataclasses, protocols)
- Popular frameworks (FastAPI, Django, Flask, SQLAlchemy)
- Data science (numpy, pandas, scikit-learn, matplotlib)
- Testing (pytest, unittest, mocking)
- Code quality (linting, formatting, documentation)

Your goal is to write clean, efficient, well-documented code that follows best practices.
When analyzing code, provide detailed explanations and suggestions for improvement.

You have access to tools for:
- Python code execution (sandboxed environment)
- File analysis (read, structure, dependencies)
- Documentation lookup

IMPORTANT: Test your code when possible. Explain your reasoning.
Follow PEP 8 and Python best practices.""",

        AgentMode.ANALYST: """You are KIAAN, an expert software analyst who can:
- Explain complex technical concepts clearly
- Analyze code architecture and design decisions
- Identify potential issues and improvements
- Compare different approaches and technologies
- Create documentation and technical guides

Your goal is to provide clear, insightful analysis that helps users understand
complex systems and make informed decisions.

You have access to tools for:
- File analysis (structure, documentation, dependencies)
- Repository analysis (patterns, architecture)
- Documentation fetching

IMPORTANT: Be thorough in your analysis. Provide concrete examples.
Balance technical depth with accessibility.""",

        AgentMode.HYBRID: """You are KIAAN, an independent AI research assistant and Python specialist.
You combine the skills of a researcher, developer, and analyst to provide comprehensive help.

Your capabilities:
1. RESEARCH - Find and synthesize information from documentation, code, and the web
2. DEVELOP - Write, analyze, and debug Python code with best practices
3. ANALYZE - Explain complex systems and provide architectural insights

You have access to powerful tools:
- web_search: Search the internet for documentation, code, and solutions
- python_execute: Run Python code in a secure sandbox
- file_analyze: Read and analyze code files
- fetch_documentation: Get library documentation
- analyze_repository: Analyze GitHub repositories

IMPORTANT RULES:
1. Always use tools to verify information - never guess
2. Break complex tasks into steps and execute them methodically
3. Test code before presenting it
4. Cite sources for research findings
5. Explain your reasoning clearly

You are autonomous and capable. Plan your approach, use tools strategically,
and deliver comprehensive, accurate results."""
    }

    # Planning prompt for breaking down queries
    PLANNING_PROMPT = """Analyze the following user query and create an execution plan.

User Query: {query}

Available Tools:
{tools}

Create a JSON plan with this structure:
{{
    "mode": "researcher|developer|analyst|hybrid",
    "reasoning": "Brief explanation of your approach",
    "tasks": [
        {{
            "id": "task_1",
            "description": "What this task accomplishes",
            "tool_name": "tool_to_use",  // or null for thinking/synthesis tasks
            "tool_params": {{}},  // parameters for the tool
            "dependencies": []  // list of task IDs this depends on
        }}
    ]
}}

Guidelines:
- For research queries: Include web_search, fetch_documentation, analyze_repository as needed
- For coding queries: Include python_execute for testing, file_analyze for context
- For analysis queries: Include file_analyze, analyze_repository
- Always end with a synthesis task (no tool) to combine findings
- Maximum 5-7 tasks for efficiency
- Order tasks by dependencies

Return ONLY the JSON plan, no other text."""

    def __init__(self):
        """Initialize the orchestrator."""
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.client = OpenAI(api_key=api_key, timeout=30.0) if api_key else None
        self.async_client = AsyncOpenAI(api_key=api_key, timeout=30.0) if api_key else None
        self.ready = bool(api_key)
        self.tool_schemas = get_all_tool_schemas()

        # Model configuration
        self.planning_model = "gpt-4o"  # Use GPT-4o for planning
        self.execution_model = "gpt-4o-mini"  # Use mini for execution
        self.synthesis_model = "gpt-4o"  # Use GPT-4o for final synthesis

    async def process_query(
        self,
        query: str,
        context: Optional[AgentContext] = None,
        stream: bool = False
    ) -> AsyncGenerator[str, None] | dict:
        """
        Process a user query autonomously.

        Args:
            query: The user's question or request
            context: Optional context from previous interactions
            stream: Whether to stream the response

        Returns:
            Complete response or async generator for streaming
        """
        if not self.ready:
            yield "I apologize, but I'm not properly configured. Please ensure the OPENAI_API_KEY is set."
            return

        # Create or update context
        if context is None:
            context = AgentContext(
                session_id=f"session_{int(time.time())}",
                mode=AgentMode.HYBRID
            )

        # Add query to conversation history
        context.conversation_history.append({
            "role": "user",
            "content": query,
            "timestamp": datetime.now().isoformat()
        })

        try:
            # Step 1: Plan the execution
            yield "Analyzing your query and planning approach...\n\n"
            plan = await self._create_plan(query, context)
            context.current_plan = plan

            if not plan.tasks:
                # Simple query - direct response
                yield "Let me help you with that directly.\n\n"
                async for chunk in self._generate_direct_response(query, context):
                    yield chunk
                return

            # Step 2: Execute the plan
            yield f"I'll approach this as a {plan.mode.value}. Here's my plan:\n"
            for task in plan.tasks:
                yield f"  - {task.description}\n"
            yield "\n"

            # Execute tasks
            for task in plan.tasks:
                # Check dependencies
                deps_met = all(
                    any(t.id == dep and t.status == TaskStatus.COMPLETED for t in plan.tasks)
                    for dep in task.dependencies
                )

                if not deps_met:
                    task.status = TaskStatus.SKIPPED
                    continue

                task.status = TaskStatus.IN_PROGRESS

                if task.tool_name:
                    yield f"Executing: {task.description}...\n"

                    # Execute tool
                    result = await execute_tool(task.tool_name, **task.tool_params)
                    task.result = result
                    context.tool_results.append(result)

                    if result.status == ToolStatus.SUCCESS:
                        task.status = TaskStatus.COMPLETED
                        yield f"  Completed in {result.execution_time_ms:.0f}ms\n"
                    else:
                        task.status = TaskStatus.FAILED
                        yield f"  Issue: {result.error}\n"

                else:
                    # Synthesis task - no tool
                    task.status = TaskStatus.COMPLETED

                task.completed_at = datetime.now()

            # Step 3: Synthesize results
            yield "\nSynthesizing findings...\n\n"
            yield "---\n\n"

            async for chunk in self._synthesize_results(query, context):
                yield chunk

        except Exception as e:
            logger.error(f"Agent orchestrator error: {e}")
            yield f"\nI encountered an issue: {str(e)}\n"
            yield "Let me try to provide a direct response instead.\n\n"
            async for chunk in self._generate_direct_response(query, context):
                yield chunk

    async def _create_plan(self, query: str, context: AgentContext) -> ExecutionPlan:
        """Create an execution plan for the query."""
        # Format tools for the prompt
        tools_desc = "\n".join([
            f"- {name}: {tool.description[:100]}..."
            for name, tool in KIAAN_TOOLS.items()
        ])

        prompt = self.PLANNING_PROMPT.format(query=query, tools=tools_desc)

        try:
            response = self.client.chat.completions.create(
                model=self.planning_model,
                messages=[
                    {"role": "system", "content": "You are a planning assistant. Output only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000,
                response_format={"type": "json_object"}
            )

            # Safe null check for OpenAI response
            plan_text = None
            if response and response.choices and len(response.choices) > 0:
                message = response.choices[0].message
                if message:
                    plan_text = message.content
            if not plan_text:
                raise ValueError("Empty response from OpenAI")
            plan_data = json.loads(plan_text)

            # Create execution plan
            mode = AgentMode(plan_data.get("mode", "hybrid"))
            tasks = []

            for task_data in plan_data.get("tasks", []):
                task = Task(
                    id=task_data.get("id", f"task_{len(tasks) + 1}"),
                    description=task_data.get("description", ""),
                    tool_name=task_data.get("tool_name"),
                    tool_params=task_data.get("tool_params", {}),
                    dependencies=task_data.get("dependencies", [])
                )
                tasks.append(task)

            return ExecutionPlan(
                query=query,
                mode=mode,
                tasks=tasks
            )

        except Exception as e:
            logger.error(f"Planning failed: {e}")
            # Return empty plan for direct response
            return ExecutionPlan(query=query, mode=AgentMode.HYBRID)

    async def _synthesize_results(
        self,
        query: str,
        context: AgentContext
    ) -> AsyncGenerator[str, None]:
        """Synthesize tool results into a comprehensive response."""
        # Build context from tool results
        results_context = []
        for result in context.tool_results:
            if result.status == ToolStatus.SUCCESS:
                results_context.append({
                    "tool": result.tool_name,
                    "output": self._truncate_result(result.output),
                    "metadata": result.metadata
                })

        # Build synthesis prompt
        synthesis_prompt = f"""Based on my research and analysis, here are the findings:

QUERY: {query}

TOOL RESULTS:
{json.dumps(results_context, indent=2, default=str)[:8000]}

Provide a comprehensive, well-structured response that:
1. Directly answers the user's question
2. Synthesizes information from all tool results
3. Provides code examples where appropriate
4. Cites sources and provides links
5. Offers practical recommendations

Use markdown formatting for readability. Be thorough but concise."""

        # Stream the synthesis
        try:
            stream = self.client.chat.completions.create(
                model=self.synthesis_model,
                messages=[
                    {"role": "system", "content": self.SYSTEM_PROMPTS[context.mode]},
                    {"role": "user", "content": synthesis_prompt}
                ],
                temperature=0.7,
                max_tokens=2000,
                stream=True
            )

            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            logger.error(f"Synthesis failed: {e}")
            yield f"Error synthesizing results: {str(e)}"

    async def _generate_direct_response(
        self,
        query: str,
        context: AgentContext
    ) -> AsyncGenerator[str, None]:
        """Generate a direct response without tool execution."""
        try:
            # Build conversation context
            messages = [
                {"role": "system", "content": self.SYSTEM_PROMPTS[context.mode]}
            ]

            # Add recent conversation history
            for msg in context.conversation_history[-5:]:
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

            stream = self.client.chat.completions.create(
                model=self.execution_model,
                messages=messages,
                temperature=0.7,
                max_tokens=1500,
                stream=True
            )

            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            logger.error(f"Direct response failed: {e}")
            yield f"I apologize, but I encountered an error: {str(e)}"

    def _truncate_result(self, output: Any, max_length: int = 2000) -> Any:
        """Truncate long results while preserving structure."""
        if isinstance(output, str):
            return output[:max_length] + "..." if len(output) > max_length else output
        elif isinstance(output, dict):
            return {k: self._truncate_result(v, max_length // 2) for k, v in list(output.items())[:20]}
        elif isinstance(output, list):
            return [self._truncate_result(item, max_length // 5) for item in output[:10]]
        return output

    async def execute_single_tool(
        self,
        tool_name: str,
        params: dict,
        context: Optional[AgentContext] = None
    ) -> ToolResult:
        """Execute a single tool directly."""
        result = await execute_tool(tool_name, **params)

        if context:
            context.tool_results.append(result)

        return result

    def get_available_tools(self) -> list[dict]:
        """Get list of available tools with their schemas."""
        return [
            {
                "name": name,
                "description": tool.description,
                "parameters": tool.parameters_schema
            }
            for name, tool in KIAAN_TOOLS.items()
        ]


# Singleton instance
kiaan_orchestrator = KIAANAgentOrchestrator()


# Export
__all__ = [
    "KIAANAgentOrchestrator",
    "AgentContext",
    "AgentMode",
    "ExecutionPlan",
    "Task",
    "TaskStatus",
    "kiaan_orchestrator"
]
