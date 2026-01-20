"""
OpenAI API Optimizer - Quantum Coherence Module

This module provides optimized OpenAI API integration with:
- GPT-4o-mini for cost optimization
- Streaming support for real-time responses
- Automatic retries with exponential backoff
- Token optimization with tiktoken
- Enhanced error handling (RateLimit, Auth, Timeout)
- Prometheus metrics for cost monitoring
- 128K token guards with chunking

Quantum Analogy: This module maintains API coherence by preventing decoherence
(failures) through retry mechanisms and ensures optimal token state (cost efficiency).
"""

import logging
import os
import time
from typing import Any, AsyncGenerator, Optional

import tiktoken
from openai import (
    APIConnectionError,
    APITimeoutError,
    AuthenticationError,
    OpenAI,
    RateLimitError,
)
from prometheus_client import Counter, Histogram
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

logger = logging.getLogger(__name__)

# Prometheus Metrics for Cost Monitoring
openai_requests_total = Counter(
    'openai_requests_total',
    'Total OpenAI API requests',
    ['model', 'endpoint', 'status']
)

openai_tokens_total = Counter(
    'openai_tokens_total',
    'Total tokens used',
    ['model', 'type']  # type: prompt or completion
)

openai_cost_total = Counter(
    'openai_cost_usd_total',
    'Total cost in USD',
    ['model']
)

openai_request_duration = Histogram(
    'openai_request_duration_seconds',
    'OpenAI API request duration',
    ['model', 'endpoint']
)

# Cost per 1M tokens (GPT-4o-mini pricing as of 2024)
COST_PER_1M_PROMPT_TOKENS = 0.15  # $0.15 per 1M prompt tokens
COST_PER_1M_COMPLETION_TOKENS = 0.60  # $0.60 per 1M completion tokens

# Token limits for GPT-4o-mini
MAX_CONTEXT_TOKENS = 128000  # 128K context window
SAFE_MAX_TOKENS = 120000  # Leave buffer for safety
OPTIMIZED_MAX_COMPLETION_TOKENS = 250  # Reduced from 400 for faster spontaneous responses

# Encoding for token counting
TOKEN_ENCODING = "cl100k_base"  # GPT-4o uses cl100k_base encoding


class TokenLimitExceededError(Exception):
    """Raised when token limit is exceeded."""
    pass


class OpenAIOptimizer:
    """Optimized OpenAI API client with quantum coherence principles."""

    def __init__(self):
        """Initialize the optimizer with API key and metrics."""
        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        # Reduced timeout from 30s to 12s for faster failure detection and spontaneous responses
        self.client = OpenAI(api_key=api_key, timeout=12.0) if api_key else None
        self.ready = bool(api_key)

        # Initialize tiktoken encoding
        try:
            self.encoding = tiktoken.get_encoding(TOKEN_ENCODING)
            logger.info(f"✅ Tiktoken encoding loaded: {TOKEN_ENCODING}")
        except Exception as e:
            logger.error(f"❌ Failed to load tiktoken encoding: {e}")
            self.encoding = None

        # Model configuration
        self.default_model = "gpt-4o-mini"
        self.default_temperature = 0.7
        self.default_max_tokens = OPTIMIZED_MAX_COMPLETION_TOKENS

    def count_tokens(self, text: str) -> int:
        """
        Count tokens in text using tiktoken.

        Args:
            text: Input text

        Returns:
            Token count
        """
        if not self.encoding:
            # Fallback: rough estimate (1 token ≈ 4 characters)
            return len(text) // 4

        try:
            return len(self.encoding.encode(text))
        except Exception as e:
            logger.warning(f"Token counting failed: {e}, using estimate")
            return len(text) // 4

    def count_messages_tokens(self, messages: list[dict[str, str]]) -> int:
        """
        Count tokens in messages array.

        Args:
            messages: List of message dictionaries

        Returns:
            Total token count
        """
        total_tokens = 0

        # Add tokens for message formatting overhead
        total_tokens += 3  # Base overhead per message array

        for message in messages:
            # Add tokens for message structure
            total_tokens += 4  # Overhead per message (role, content delimiters)

            # Count role tokens
            role = message.get("role", "")
            total_tokens += self.count_tokens(role)

            # Count content tokens
            content = message.get("content", "")
            total_tokens += self.count_tokens(content)

        return total_tokens

    def chunk_text(self, text: str, max_chunk_tokens: int = 30000) -> list[str]:
        """
        Chunk text into smaller pieces if it exceeds token limits.

        Args:
            text: Input text
            max_chunk_tokens: Maximum tokens per chunk

        Returns:
            List of text chunks
        """
        total_tokens = self.count_tokens(text)

        if total_tokens <= max_chunk_tokens:
            return [text]

        # Split by paragraphs first
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = []
        current_tokens = 0

        for para in paragraphs:
            para_tokens = self.count_tokens(para)

            if current_tokens + para_tokens > max_chunk_tokens:
                # Save current chunk
                if current_chunk:
                    chunks.append("\n\n".join(current_chunk))
                current_chunk = [para]
                current_tokens = para_tokens
            else:
                current_chunk.append(para)
                current_tokens += para_tokens

        # Add remaining chunk
        if current_chunk:
            chunks.append("\n\n".join(current_chunk))

        logger.info(f"Chunked text into {len(chunks)} pieces ({total_tokens} total tokens)")
        return chunks

    def validate_token_limits(
        self,
        messages: list[dict[str, str]],
        max_completion_tokens: int = OPTIMIZED_MAX_COMPLETION_TOKENS
    ) -> None:
        """
        Validate that messages don't exceed token limits.

        Args:
            messages: List of message dictionaries
            max_completion_tokens: Maximum tokens for completion

        Raises:
            TokenLimitExceededError: If token limit exceeded
        """
        prompt_tokens = self.count_messages_tokens(messages)
        total_tokens = prompt_tokens + max_completion_tokens

        if total_tokens > SAFE_MAX_TOKENS:
            raise TokenLimitExceededError(
                f"Token limit exceeded: {total_tokens} tokens "
                f"(prompt: {prompt_tokens}, completion: {max_completion_tokens}) "
                f"exceeds safe limit of {SAFE_MAX_TOKENS}"
            )

        logger.debug(f"Token validation passed: {total_tokens} tokens (safe limit: {SAFE_MAX_TOKENS})")

    def calculate_cost(self, prompt_tokens: int, completion_tokens: int, model: str = "gpt-4o-mini") -> float:
        """
        Calculate cost of API call.

        Args:
            prompt_tokens: Number of prompt tokens
            completion_tokens: Number of completion tokens
            model: Model name

        Returns:
            Cost in USD
        """
        prompt_cost = (prompt_tokens / 1_000_000) * COST_PER_1M_PROMPT_TOKENS
        completion_cost = (completion_tokens / 1_000_000) * COST_PER_1M_COMPLETION_TOKENS
        total_cost = prompt_cost + completion_cost

        # Log cost for monitoring
        logger.info(
            f"💰 Cost: ${total_cost:.6f} "
            f"(prompt: {prompt_tokens} tokens, completion: {completion_tokens} tokens, model: {model})"
        )

        return total_cost

    @retry(
        retry=retry_if_exception_type((RateLimitError, APIConnectionError, APITimeoutError)),
        wait=wait_exponential(multiplier=1, min=1, max=8),  # Reduced from min=2, max=30 for faster retries
        stop=stop_after_attempt(2),  # Reduced from 4 to 2 for faster failure handling
        reraise=True
    )
    async def create_completion_with_retry(
        self,
        messages: list[dict[str, str]],
        model: str = "gpt-4o-mini",
        temperature: float = 0.7,
        max_tokens: int = OPTIMIZED_MAX_COMPLETION_TOKENS,
        stream: bool = False,
        **kwargs
    ) -> Any:
        """
        Create completion with automatic retries for transient failures.

        Uses tenacity for exponential backoff:
        - Retry on RateLimitError, APIConnectionError, APITimeoutError
        - Wait: 2s, 4s, 8s, 16s (exponential with max 30s)
        - Max 4 attempts

        Args:
            messages: List of message dictionaries
            model: Model name (default: gpt-4o-mini)
            temperature: Sampling temperature
            max_tokens: Maximum completion tokens
            stream: Enable streaming
            **kwargs: Additional arguments

        Returns:
            OpenAI response object or stream

        Raises:
            TokenLimitExceededError: If token limit exceeded
            AuthenticationError: If API key invalid
            RateLimitError: If rate limit exceeded after retries
        """
        if not self.ready or not self.client:
            raise ValueError("OpenAI client not initialized. Check OPENAI_API_KEY.")

        # Validate token limits before making request
        self.validate_token_limits(messages, max_tokens)

        start_time = time.time()

        try:
            # Create completion
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream,
                **kwargs
            )

            duration = time.time() - start_time

            # Record metrics for non-streaming requests
            if not stream:
                # Extract token usage
                usage = response.usage
                prompt_tokens = usage.prompt_tokens if usage else 0
                completion_tokens = usage.completion_tokens if usage else 0

                # Update Prometheus metrics
                openai_requests_total.labels(model=model, endpoint='chat', status='success').inc()
                openai_tokens_total.labels(model=model, type='prompt').inc(prompt_tokens)
                openai_tokens_total.labels(model=model, type='completion').inc(completion_tokens)
                openai_request_duration.labels(model=model, endpoint='chat').observe(duration)

                # Calculate and log cost
                cost = self.calculate_cost(prompt_tokens, completion_tokens, model)
                openai_cost_total.labels(model=model).inc(cost)

                logger.info(
                    f"✅ OpenAI completion successful: {model}, "
                    f"tokens: {prompt_tokens + completion_tokens}, "
                    f"duration: {duration:.2f}s, "
                    f"cost: ${cost:.6f}"
                )
            else:
                logger.info(f"✅ OpenAI streaming started: {model}, duration: {duration:.2f}s")

            return response

        except AuthenticationError as e:
            logger.error(f"❌ OpenAI Authentication Error: {e}")
            openai_requests_total.labels(model=model, endpoint='chat', status='auth_error').inc()
            raise

        except RateLimitError as e:
            logger.warning(f"⚠️ OpenAI Rate Limit Error (will retry): {e}")
            openai_requests_total.labels(model=model, endpoint='chat', status='rate_limit').inc()
            raise  # Let tenacity retry

        except APITimeoutError as e:
            logger.warning(f"⚠️ OpenAI Timeout Error (will retry): {e}")
            openai_requests_total.labels(model=model, endpoint='chat', status='timeout').inc()
            raise  # Let tenacity retry

        except APIConnectionError as e:
            logger.warning(f"⚠️ OpenAI Connection Error (will retry): {e}")
            openai_requests_total.labels(model=model, endpoint='chat', status='connection_error').inc()
            raise  # Let tenacity retry

        except Exception as e:
            logger.error(f"❌ OpenAI Unexpected Error: {type(e).__name__}: {e}")
            openai_requests_total.labels(model=model, endpoint='chat', status='error').inc()
            raise

    async def create_streaming_completion(
        self,
        messages: list[dict[str, str]],
        model: str = "gpt-4o-mini",
        temperature: float = 0.7,
        max_tokens: int = OPTIMIZED_MAX_COMPLETION_TOKENS,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """
        Create streaming completion with real-time token yielding.

        Args:
            messages: List of message dictionaries
            model: Model name
            temperature: Sampling temperature
            max_tokens: Maximum completion tokens
            **kwargs: Additional arguments

        Yields:
            Content chunks as they arrive
        """
        stream = await self.create_completion_with_retry(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
            **kwargs
        )

        # Track tokens for cost calculation
        completion_tokens = 0
        full_content = []

        try:
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_content.append(content)
                    yield content

            # Calculate cost after streaming completes
            full_text = "".join(full_content)
            completion_tokens = self.count_tokens(full_text)
            prompt_tokens = self.count_messages_tokens(messages)

            # Update metrics
            openai_tokens_total.labels(model=model, type='prompt').inc(prompt_tokens)
            openai_tokens_total.labels(model=model, type='completion').inc(completion_tokens)

            cost = self.calculate_cost(prompt_tokens, completion_tokens, model)
            openai_cost_total.labels(model=model).inc(cost)

            logger.info(
                f"✅ Streaming completed: {model}, "
                f"tokens: {prompt_tokens + completion_tokens}, "
                f"cost: ${cost:.6f}"
            )

        except Exception as e:
            logger.error(f"❌ Streaming error: {e}")
            raise

    def get_fallback_response(self, context: str = "general") -> str:
        """
        Get fallback response when API fails.

        Args:
            context: Context type

        Returns:
            Fallback message
        """
        fallbacks = {
            "general": "I'm here for you. Let's try again in a moment. 💙",
            "ardha_reframe": "Take a deep breath. Sometimes a pause helps us see things more clearly. Try again when you're ready. 💙",
            "viyoga_detachment": "Remember, peace comes from within. Let's reconnect in a moment. 💙",
            "emotional_reset": "Your feelings are valid. Take a moment to breathe, and we'll continue when you're ready. 💙",
            "karma_reset": "Healing takes time. Let's try again soon. 💙"
        }

        return fallbacks.get(context, fallbacks["general"])


# Global instance
openai_optimizer = OpenAIOptimizer()
