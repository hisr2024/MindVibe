"""
Unit tests for OpenAI Optimizer Service
Tests token counting, retry logic, cost calculation, and error handling
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch, call
from backend.services.openai_optimizer import (
    openai_optimizer,
    TokenLimitExceededError,
    OPTIMIZED_MAX_COMPLETION_TOKENS,
    MAX_CONTEXT_TOKENS,
    SAFE_MAX_TOKENS,
)


class TestOpenAIOptimizer:
    """Test suite for OpenAI Optimizer."""

    def test_token_counting(self):
        """Test that token counting works correctly."""
        text = "This is a test message for token counting."
        count = openai_optimizer.count_tokens(text)

        # Should return a positive integer
        assert isinstance(count, int)
        assert count > 0

        # Longer text should have more tokens
        longer_text = text * 10
        longer_count = openai_optimizer.count_tokens(longer_text)
        assert longer_count > count

    def test_token_counting_empty_string(self):
        """Test token counting with empty string."""
        count = openai_optimizer.count_tokens("")
        assert isinstance(count, int)
        assert count >= 0

    def test_token_counting_special_characters(self):
        """Test token counting with special characters."""
        text = "Hello! 🎉 Special chars: @#$%^&*()"
        count = openai_optimizer.count_tokens(text)
        assert isinstance(count, int)
        assert count > 0

    def test_message_token_counting(self):
        """Test token counting for message arrays."""
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello, how are you?"},
        ]

        count = openai_optimizer.count_messages_tokens(messages)
        assert isinstance(count, int)
        assert count > 0

        # Should be greater than just the content tokens
        content_only = sum(
            openai_optimizer.count_tokens(msg["content"]) for msg in messages
        )
        assert count > content_only

    def test_message_token_counting_empty_messages(self):
        """Test token counting with empty message array."""
        count = openai_optimizer.count_messages_tokens([])
        assert isinstance(count, int)
        assert count >= 0

    def test_token_limit_validation_pass(self):
        """Test that valid token counts pass validation."""
        messages = [
            {"role": "user", "content": "Short message"}
        ]

        # Should not raise exception
        try:
            openai_optimizer.validate_token_limits(
                messages=messages,
                max_completion_tokens=OPTIMIZED_MAX_COMPLETION_TOKENS
            )
        except TokenLimitExceededError:
            pytest.fail("Valid token count raised TokenLimitExceededError")

    def test_token_limit_validation_fail(self):
        """Test that excessive tokens raise exception."""
        # Create a very long message (estimate: 4 chars ≈ 1 token)
        long_text = "word " * 30000  # ~30k tokens
        messages = [
            {"role": "user", "content": long_text}
        ]

        with pytest.raises(TokenLimitExceededError):
            openai_optimizer.validate_token_limits(
                messages=messages,
                max_completion_tokens=OPTIMIZED_MAX_COMPLETION_TOKENS
            )

    def test_token_limit_edge_case(self):
        """Test token limit at the boundary."""
        # Create message close to limit
        # Safe max is 120k, let's use ~119k for prompt
        target_tokens = SAFE_MAX_TOKENS - OPTIMIZED_MAX_COMPLETION_TOKENS - 100
        text = "x" * (target_tokens * 4)  # Rough estimate
        messages = [{"role": "user", "content": text}]

        # This might pass or fail depending on exact token count
        # We're just testing it doesn't crash
        try:
            openai_optimizer.validate_token_limits(
                messages=messages,
                max_completion_tokens=OPTIMIZED_MAX_COMPLETION_TOKENS
            )
        except TokenLimitExceededError:
            pass  # Expected if too large

    def test_cost_calculation(self):
        """Test cost calculation for API calls."""
        prompt_tokens = 1000
        completion_tokens = 500

        cost = openai_optimizer.calculate_cost(
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            model="gpt-4o-mini"
        )

        # Cost should be positive and reasonable
        assert isinstance(cost, float)
        assert cost > 0
        assert cost < 1.0  # Should be less than $1 for these token counts

    def test_cost_calculation_zero_tokens(self):
        """Test cost calculation with zero tokens."""
        cost = openai_optimizer.calculate_cost(
            prompt_tokens=0,
            completion_tokens=0,
            model="gpt-4o-mini"
        )
        assert cost == 0.0

    def test_cost_calculation_large_tokens(self):
        """Test cost calculation with large token counts."""
        prompt_tokens = 100000
        completion_tokens = 50000

        cost = openai_optimizer.calculate_cost(
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            model="gpt-4o-mini"
        )

        # Should be a reasonable cost
        assert isinstance(cost, float)
        assert cost > 0
        assert cost < 100  # Should be under $100 for these counts

    def test_text_chunking_small_text(self):
        """Test that small text is not chunked."""
        short_text = "This is a short text."
        chunks = openai_optimizer.chunk_text(short_text, max_chunk_tokens=1000)

        assert isinstance(chunks, list)
        assert len(chunks) == 1
        assert chunks[0] == short_text

    def test_text_chunking_large_text(self):
        """Test that long text is chunked correctly."""
        # Create text with multiple paragraphs
        long_text = "\n\n".join([f"Paragraph {i} with some content." for i in range(1000)])

        chunks = openai_optimizer.chunk_text(long_text, max_chunk_tokens=1000)

        assert isinstance(chunks, list)
        assert len(chunks) > 1

        # Each chunk should be within token limit (with some tolerance)
        for chunk in chunks:
            token_count = openai_optimizer.count_tokens(chunk)
            # Allow some tolerance for overhead
            assert token_count <= 1200

    def test_text_chunking_preserves_content(self):
        """Test that chunking preserves all content."""
        text = "\n\n".join([f"Paragraph {i}" for i in range(100)])
        chunks = openai_optimizer.chunk_text(text, max_chunk_tokens=500)

        # Rejoin chunks and verify content
        rejoined = "\n\n".join(chunks)
        assert rejoined == text

    @pytest.mark.asyncio
    async def test_create_completion_not_ready(self):
        """Test that completion fails if client not initialized."""
        # Temporarily set ready to False
        original_ready = openai_optimizer.ready
        original_client = openai_optimizer.client

        try:
            openai_optimizer.ready = False
            openai_optimizer.client = None

            with pytest.raises(ValueError, match="OpenAI client not initialized"):
                await openai_optimizer.create_completion_with_retry(
                    messages=[{"role": "user", "content": "test"}]
                )
        finally:
            openai_optimizer.ready = original_ready
            openai_optimizer.client = original_client

    @pytest.mark.asyncio
    async def test_retry_on_rate_limit(self):
        """Test that retry logic works for rate limit errors."""
        from openai import RateLimitError

        # Skip if client not initialized
        if not openai_optimizer.ready or not openai_optimizer.client:
            pytest.skip("OpenAI client not initialized")

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Test response"
        mock_response.usage = MagicMock()
        mock_response.usage.prompt_tokens = 10
        mock_response.usage.completion_tokens = 20

        mock_error_response = MagicMock()
        mock_error_response.status_code = 429

        # Create mock that fails twice, then succeeds
        mock_create = MagicMock()
        mock_create.side_effect = [
            RateLimitError("Rate limit", response=mock_error_response, body={}),
            RateLimitError("Rate limit", response=mock_error_response, body={}),
            mock_response,
        ]

        with patch.object(openai_optimizer.client.chat.completions, 'create', mock_create):
            response = await openai_optimizer.create_completion_with_retry(
                messages=[{"role": "user", "content": "test"}],
                model="gpt-4o-mini",
            )

        # Should eventually succeed after retries
        assert response == mock_response
        assert mock_create.call_count == 3

    @pytest.mark.asyncio
    async def test_streaming_completion(self):
        """Test streaming completion works correctly."""
        # Skip if client not initialized
        if not openai_optimizer.ready or not openai_optimizer.client:
            pytest.skip("OpenAI client not initialized")

        # Create mock chunks
        mock_chunk1 = MagicMock()
        mock_chunk1.choices = [MagicMock()]
        mock_chunk1.choices[0].delta.content = "Hello"

        mock_chunk2 = MagicMock()
        mock_chunk2.choices = [MagicMock()]
        mock_chunk2.choices[0].delta.content = " world"

        mock_chunk3 = MagicMock()
        mock_chunk3.choices = [MagicMock()]
        mock_chunk3.choices[0].delta.content = "!"

        mock_stream = [mock_chunk1, mock_chunk2, mock_chunk3]

        with patch.object(
            openai_optimizer.client.chat.completions,
            'create',
            return_value=iter(mock_stream)
        ):
            chunks = []
            async for chunk in openai_optimizer.create_streaming_completion(
                messages=[{"role": "user", "content": "test"}],
                model="gpt-4o-mini",
            ):
                chunks.append(chunk)

        assert chunks == ["Hello", " world", "!"]

    def test_fallback_response_general(self):
        """Test that fallback responses are returned correctly."""
        fallback = openai_optimizer.get_fallback_response("general")

        assert isinstance(fallback, str)
        assert len(fallback) > 0
        assert "💙" in fallback  # Should have heart emoji

    def test_fallback_response_all_contexts(self):
        """Test fallback responses for all contexts."""
        contexts = [
            "general",
            "ardha_reframe",
            "viyoga_detachment",
            "emotional_reset",
            "karma_reset",
            "unknown_context"
        ]

        for context in contexts:
            fallback = openai_optimizer.get_fallback_response(context)
            assert isinstance(fallback, str)
            assert len(fallback) > 0
            assert "💙" in fallback

    def test_encoding_initialization(self):
        """Test that encoding is properly initialized or falls back gracefully."""
        # The encoding might be None if tiktoken failed to load
        # The optimizer should still work with fallback
        if openai_optimizer.encoding:
            assert hasattr(openai_optimizer.encoding, 'encode')
        else:
            # Test that fallback works
            count = openai_optimizer.count_tokens("test text")
            assert isinstance(count, int)
            assert count > 0

    def test_model_configuration(self):
        """Test that model configuration is set correctly."""
        assert openai_optimizer.default_model == "gpt-4o-mini"
        assert openai_optimizer.default_temperature == 0.7
        assert openai_optimizer.default_max_tokens == OPTIMIZED_MAX_COMPLETION_TOKENS

    def test_constants(self):
        """Test that constants are set correctly."""
        assert MAX_CONTEXT_TOKENS == 128000
        assert SAFE_MAX_TOKENS == 120000
        assert OPTIMIZED_MAX_COMPLETION_TOKENS == 400
        assert SAFE_MAX_TOKENS < MAX_CONTEXT_TOKENS


class TestTokenLimitExceededError:
    """Test suite for TokenLimitExceededError exception."""

    def test_exception_creation(self):
        """Test that exception can be created and raised."""
        with pytest.raises(TokenLimitExceededError):
            raise TokenLimitExceededError("Token limit exceeded")

    def test_exception_message(self):
        """Test that exception message is preserved."""
        message = "Custom error message"
        try:
            raise TokenLimitExceededError(message)
        except TokenLimitExceededError as e:
            assert str(e) == message
