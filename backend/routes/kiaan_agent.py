"""
KIAAN Agent API Routes - Independent Research & Development Endpoints

This module exposes KIAAN's autonomous capabilities through REST API endpoints:
1. /agent/query - Process complex queries with autonomous planning
2. /agent/research - Research mode for software documentation
3. /agent/code - Developer mode for code tasks
4. /agent/analyze - Analysis mode for understanding systems
5. /agent/tools - Direct tool execution

SECURITY:
- All endpoints require authentication (get_current_user_flexible)
- Rate limiting applied per-user (60 req/min for queries, 10 req/min for tools)
- Audit logging for all operations
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.deps import get_current_user_flexible
from backend.services.kiaan_agent_orchestrator import (
    KIAANAgentOrchestrator,
    AgentContext,
    AgentMode,
    kiaan_orchestrator
)
from backend.services.kiaan_agent_tools import (
    KIAAN_TOOLS,
    execute_tool,
    get_all_tool_schemas
)
from backend.services.kiaan_memory import (
    kiaan_memory,
    MemoryType
)
from backend.services.kiaan_resilience import RateLimiter, RateLimitConfig
from backend.services.kiaan_audit import kiaan_audit, AuditEventType

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/kiaan/agent", tags=["KIAAN Agent"])

# Rate limiters for different operation types
_query_rate_limiter = RateLimiter(RateLimitConfig(
    requests_per_minute=60,  # 60 queries/min
    requests_per_hour=500,
    burst_size=10
))

_tool_rate_limiter = RateLimiter(RateLimitConfig(
    requests_per_minute=10,  # 10 tool executions/min (more restrictive)
    requests_per_hour=100,
    burst_size=3
))


async def _check_rate_limit(limiter: RateLimiter, user_id: str) -> None:
    """Check rate limit and raise exception if exceeded."""
    if not await limiter.is_allowed(user_id):
        limits = limiter.get_limits(user_id)
        await kiaan_audit.log_security_event(
            event_type=AuditEventType.RATE_LIMIT_EXCEEDED,
            message=f"Rate limit exceeded for user {user_id}",
            user_id=user_id,
            details={"limits": limits}
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Please wait before making more requests. "
                   f"Remaining: minute={limits['minute_remaining']}, hour={limits['hour_remaining']}"
        )


# Request/Response Models
class AgentQueryRequest(BaseModel):
    """Request for agent query processing."""
    query: str = Field(..., min_length=1, max_length=5000, description="The query to process")
    mode: Optional[str] = Field(None, description="Agent mode: researcher, developer, analyst, hybrid")
    session_id: Optional[str] = Field(None, description="Session ID for context continuity")
    stream: bool = Field(True, description="Whether to stream the response")


class ToolExecuteRequest(BaseModel):
    """Request for direct tool execution."""
    tool_name: str = Field(..., description="Name of the tool to execute")
    parameters: dict = Field(default_factory=dict, description="Tool parameters")


class ResearchRequest(BaseModel):
    """Request for research mode."""
    topic: str = Field(..., min_length=1, max_length=1000, description="Topic to research")
    depth: str = Field("standard", description="Research depth: quick, standard, thorough")
    sources: list[str] = Field(
        default=["documentation", "github", "stackoverflow"],
        description="Sources to search"
    )


class CodeRequest(BaseModel):
    """Request for code-related tasks."""
    task: str = Field(..., min_length=1, max_length=2000, description="Code task description")
    code: Optional[str] = Field(None, description="Code to analyze or test")
    language: str = Field("python", description="Programming language")


class AnalyzeRequest(BaseModel):
    """Request for analysis tasks."""
    target: str = Field(..., description="What to analyze (file path, repo URL, concept)")
    analysis_type: str = Field(
        "comprehensive",
        description="Type: comprehensive, structure, dependencies, security"
    )


# API Endpoints

@router.post("/query")
async def process_agent_query(
    request: AgentQueryRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible)
):
    """
    Process a query using KIAAN's autonomous agent capabilities.

    This endpoint allows KIAAN to:
    - Plan and execute multi-step tasks
    - Use research tools to find information
    - Execute and analyze code
    - Synthesize comprehensive responses

    Returns a streaming response with real-time updates.

    Requires authentication. Rate limited to 60 requests/minute.
    """
    # Rate limit check
    await _check_rate_limit(_query_rate_limiter, user_id)

    # Audit log the request
    await kiaan_audit.log_request(
        user_id=user_id,
        session_id=request.session_id or "unknown",
        query=request.query,
        intent="agent_query"
    )

    # Get or create session
    session_id = request.session_id or f"session_{int(datetime.now().timestamp())}"

    # Determine mode
    mode = AgentMode.HYBRID
    if request.mode:
        try:
            mode = AgentMode(request.mode)
        except ValueError:
            pass

    # Create context
    context = AgentContext(
        session_id=session_id,
        mode=mode
    )

    # Load conversation history from memory
    history = await kiaan_memory.get_conversation_history(session_id, limit=10)
    context.conversation_history = history

    # Store the user query
    await kiaan_memory.store_conversation_turn(
        session_id=session_id,
        role="user",
        content=request.query
    )

    if request.stream:
        async def generate():
            full_response = []
            async for chunk in kiaan_orchestrator.process_query(
                query=request.query,
                context=context,
                stream=True
            ):
                full_response.append(chunk)
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"

            # Store assistant response
            response_text = "".join(full_response)
            await kiaan_memory.store_conversation_turn(
                session_id=session_id,
                role="assistant",
                content=response_text
            )

            yield f"data: {json.dumps({'done': True, 'session_id': session_id})}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Session-ID": session_id
            }
        )
    else:
        # Non-streaming - collect full response
        full_response = []
        async for chunk in kiaan_orchestrator.process_query(
            query=request.query,
            context=context,
            stream=False
        ):
            full_response.append(chunk)

        response_text = "".join(full_response)

        # Store assistant response
        await kiaan_memory.store_conversation_turn(
            session_id=session_id,
            role="assistant",
            content=response_text
        )

        return {
            "status": "success",
            "response": response_text,
            "session_id": session_id,
            "mode": mode.value,
            "tools_used": [r.tool_name for r in context.tool_results]
        }


@router.post("/research")
async def research_topic(
    request: ResearchRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible)
):
    """
    Research a software topic using KIAAN's research capabilities.

    Specialized endpoint for:
    - Finding documentation
    - Searching code repositories
    - Analyzing libraries and frameworks
    - Synthesizing research findings

    Requires authentication. Rate limited to 60 requests/minute.
    """
    # Rate limit check
    await _check_rate_limit(_query_rate_limiter, user_id)

    # Build research query
    research_query = f"""Research the following topic thoroughly:

Topic: {request.topic}

Research Depth: {request.depth}
Sources to prioritize: {', '.join(request.sources)}

Please:
1. Find authoritative documentation and sources
2. Search for relevant code examples
3. Identify best practices and common patterns
4. Synthesize findings into a comprehensive summary
5. Provide links to sources"""

    context = AgentContext(
        session_id=f"research_{int(datetime.now().timestamp())}",
        mode=AgentMode.RESEARCHER
    )

    async def generate():
        findings = []
        async for chunk in kiaan_orchestrator.process_query(
            query=research_query,
            context=context,
            stream=True
        ):
            findings.append(chunk)
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"

        # Store research findings
        await kiaan_memory.store_research_finding(
            query=request.topic,
            findings=[{"content": "".join(findings)}],
            sources=request.sources
        )

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )


@router.post("/code")
async def process_code_task(
    request: CodeRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible)
):
    """
    Process a code-related task using KIAAN's developer capabilities.

    Specialized endpoint for:
    - Writing code from specifications
    - Analyzing and explaining code
    - Debugging and fixing issues
    - Code review and suggestions

    Requires authentication. Rate limited to 60 requests/minute.
    """
    # Rate limit check
    await _check_rate_limit(_query_rate_limiter, user_id)

    # Build code task query
    code_context = ""
    if request.code:
        code_context = f"\n\nCode to work with:\n```{request.language}\n{request.code}\n```"

    code_query = f"""As an expert {request.language} developer, help with this task:

Task: {request.task}
{code_context}

Please:
1. Understand the requirements thoroughly
2. Write clean, efficient, documented code
3. Follow best practices for {request.language}
4. Test the code if applicable
5. Explain your implementation"""

    context = AgentContext(
        session_id=f"code_{int(datetime.now().timestamp())}",
        mode=AgentMode.DEVELOPER
    )

    async def generate():
        async for chunk in kiaan_orchestrator.process_query(
            query=code_query,
            context=context,
            stream=True
        ):
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )


@router.post("/analyze")
async def analyze_target(
    request: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible)
):
    """
    Analyze code, repositories, or concepts using KIAAN's analysis capabilities.

    Specialized endpoint for:
    - Code architecture analysis
    - Repository structure analysis
    - Dependency analysis
    - Security analysis

    Requires authentication. Rate limited to 60 requests/minute.
    """
    # Rate limit check
    await _check_rate_limit(_query_rate_limiter, user_id)

    # Build analysis query
    analysis_query = f"""Perform a {request.analysis_type} analysis of:

Target: {request.target}

Please provide:
1. Overview and purpose
2. Structure and organization
3. Key patterns and design decisions
4. Dependencies and integrations
5. Potential improvements or concerns
6. Summary and recommendations"""

    context = AgentContext(
        session_id=f"analyze_{int(datetime.now().timestamp())}",
        mode=AgentMode.ANALYST
    )

    async def generate():
        async for chunk in kiaan_orchestrator.process_query(
            query=analysis_query,
            context=context,
            stream=True
        ):
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )


@router.post("/tools/execute")
async def execute_tool_directly(
    request: ToolExecuteRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_flexible)
):
    """
    Execute a specific tool directly.

    Useful for:
    - Quick searches
    - Code execution
    - File analysis
    - Documentation lookups

    Requires authentication. Rate limited to 10 requests/minute (stricter).
    """
    # Stricter rate limit for direct tool execution
    await _check_rate_limit(_tool_rate_limiter, user_id)

    # Audit log tool execution
    await kiaan_audit.log_tool_execution(
        tool_name=request.tool_name,
        status="started",
        user_id=user_id,
        params=request.parameters
    )

    if request.tool_name not in KIAAN_TOOLS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown tool: {request.tool_name}. Available: {list(KIAAN_TOOLS.keys())}"
        )

    result = await execute_tool(request.tool_name, **request.parameters)

    return {
        "status": result.status.value,
        "tool": request.tool_name,
        "output": result.output,
        "error": result.error,
        "execution_time_ms": result.execution_time_ms,
        "metadata": result.metadata
    }


@router.get("/tools")
async def list_available_tools(
    user_id: str = Depends(get_current_user_flexible)
):
    """
    List all available KIAAN agent tools.

    Returns tool names, descriptions, and parameter schemas.

    Requires authentication.
    """
    # No rate limit for this read-only endpoint, but auth required
    tools = []
    for name, tool in KIAAN_TOOLS.items():
        tools.append({
            "name": name,
            "description": tool.description,
            "parameters": tool.parameters_schema
        })

    return {
        "status": "success",
        "tools": tools,
        "count": len(tools)
    }


@router.get("/memory/stats")
async def get_memory_stats(
    user_id: str = Depends(get_current_user_flexible)
):
    """Get KIAAN memory statistics. Requires authentication."""
    stats = await kiaan_memory.get_stats()
    return {
        "status": "success",
        "stats": stats
    }


@router.get("/memory/search")
async def search_memories(
    query: str = Query(..., min_length=1),
    memory_type: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    user_id: str = Depends(get_current_user_flexible)
):
    """Search KIAAN's memory. Requires authentication."""
    m_type = None
    if memory_type:
        try:
            m_type = MemoryType(memory_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid memory type: {memory_type}"
            )

    results = await kiaan_memory.search(
        query=query,
        memory_type=m_type,
        limit=limit
    )

    return {
        "status": "success",
        "results": [r.to_dict() for r in results],
        "count": len(results)
    }


@router.get("/health")
async def agent_health_check():
    """Health check for KIAAN Agent services."""
    orchestrator_ready = kiaan_orchestrator.ready
    memory_stats = await kiaan_memory.get_stats()

    return {
        "status": "healthy" if orchestrator_ready else "degraded",
        "orchestrator_ready": orchestrator_ready,
        "tools_available": len(KIAAN_TOOLS),
        "memory_entries": memory_stats["total_entries"],
        "timestamp": datetime.now().isoformat()
    }


@router.get("/capabilities")
async def get_agent_capabilities(
    user_id: str = Depends(get_current_user_flexible)
):
    """
    Get detailed information about KIAAN Agent's capabilities.

    Returns comprehensive documentation of what KIAAN can do.

    Requires authentication.
    """
    return {
        "status": "success",
        "agent": "KIAAN Independent Agent",
        "version": "1.0.0",
        "capabilities": {
            "research": {
                "description": "Research software topics, libraries, and best practices",
                "features": [
                    "Web search across documentation, GitHub, StackOverflow, PyPI",
                    "Repository analysis and pattern identification",
                    "Documentation fetching and parsing",
                    "Research synthesis and summarization"
                ]
            },
            "development": {
                "description": "Write, analyze, and debug code",
                "features": [
                    "Python code execution in secure sandbox",
                    "Code generation from specifications",
                    "Code analysis and explanation",
                    "Bug identification and fixes",
                    "Best practices recommendations"
                ]
            },
            "analysis": {
                "description": "Analyze code, systems, and architectures",
                "features": [
                    "File structure analysis",
                    "Dependency mapping",
                    "Documentation extraction",
                    "Pattern recognition",
                    "Security review (basic)"
                ]
            },
            "memory": {
                "description": "Persistent context and knowledge management",
                "features": [
                    "Conversation history",
                    "Knowledge base",
                    "Research findings cache",
                    "User preferences"
                ]
            }
        },
        "tools": list(KIAAN_TOOLS.keys()),
        "modes": [mode.value for mode in AgentMode]
    }
