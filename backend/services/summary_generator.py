"""
Summary Generator Service - AI-Powered Response Summarization

This service generates concise, meaningful summaries of elaborate KIAAN responses.
The summary captures the essence of the wisdom, key insights, and practical guidance
in a to-the-point format suitable for quick viewing.

Features:
- AI-powered summarization using GPT-4o-mini
- Captures key wisdom, practical steps, and emotional support
- Maintains the sacred, warm tone of KIAAN
- Optimized for both speed and quality
- Caching support for repeated summaries
"""

import logging
from typing import Any, Optional

from backend.services.openai_optimizer import openai_optimizer
from backend.services.redis_cache_enhanced import redis_cache

logger = logging.getLogger(__name__)


class SummaryGenerator:
    """
    AI-powered summary generator for KIAAN responses.

    Creates concise, to-the-point summaries that capture:
    - Core wisdom/principle being shared
    - Key practical advice or action steps
    - Emotional support and encouragement
    """

    def __init__(self):
        self.optimizer = openai_optimizer
        self.ready = openai_optimizer.ready

        # Summary configuration
        self.target_length = 80  # Target ~80 words for summary
        self.max_tokens = 120   # Max tokens for generation

    async def generate_summary(
        self,
        full_response: str,
        user_message: str,
        language: str | None = None,
        context: str = "general"
    ) -> dict[str, Any]:
        """
        Generate a concise, meaningful summary of a KIAAN response.

        The summary captures the essence of the elaborate response in a
        to-the-point format that:
        - Highlights the core wisdom/insight
        - Includes key practical step(s)
        - Maintains warmth and encouragement
        - Ends with the signature blue heart

        Args:
            full_response: The complete KIAAN response to summarize
            user_message: The original user query (for context)
            language: Target language for summary (default: English)
            context: Context type (general, ardha_reframe, etc.)

        Returns:
            dict with summary, success status, and metadata
        """
        if not self.ready:
            logger.warning("Summary Generator: OpenAI not ready, using fallback")
            return self._create_fallback_summary(full_response)

        # Check cache first
        cache_key = self._get_cache_key(full_response)
        cached = redis_cache.get_cached_kiaan_response(cache_key, "summary")
        if cached:
            logger.info("Summary Generator: Cache HIT")
            return {
                "summary": cached,
                "success": True,
                "cached": True,
                "word_count": len(cached.split())
            }

        # Build the summarization prompt
        system_prompt = self._build_summary_prompt(language)

        try:
            response = await self.optimizer.create_completion_with_retry(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"User's concern: {user_message[:200]}\n\nFull KIAAN response to summarize:\n{full_response}"}
                ],
                model="gpt-4o-mini",
                temperature=0.5,  # Lower temperature for consistent summaries
                max_tokens=self.max_tokens
            )

            # Safe null check for OpenAI response
            summary_text = None
            if response and response.choices and len(response.choices) > 0:
                response_msg = response.choices[0].message
                if response_msg:
                    summary_text = response_msg.content
            if not summary_text:
                return self._create_fallback_summary(full_response)

            # Clean up the summary
            summary_text = summary_text.strip()

            # Ensure it ends with blue heart if not present
            if not summary_text.endswith("💙"):
                summary_text = f"{summary_text.rstrip('.')} 💙"

            # Cache the summary
            redis_cache.cache_kiaan_response(cache_key, "summary", summary_text)

            logger.info(f"Summary Generator: Generated {len(summary_text.split())} word summary")

            return {
                "summary": summary_text,
                "success": True,
                "cached": False,
                "word_count": len(summary_text.split()),
                "model": "gpt-4o-mini"
            }

        except Exception as e:
            logger.error(f"Summary Generator error: {type(e).__name__}: {e}")
            return self._create_fallback_summary(full_response)

    def _build_summary_prompt(self, language: str | None = None) -> str:
        """Build the system prompt for summary generation."""

        language_instruction = ""
        if language and language != "en":
            language_map = {
                "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "bn": "Bengali",
                "mr": "Marathi", "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam",
                "pa": "Punjabi", "sa": "Sanskrit", "es": "Spanish", "fr": "French",
                "de": "German", "pt": "Portuguese", "ja": "Japanese", "zh": "Chinese",
            }
            lang_name = language_map.get(language, language)
            language_instruction = f"\nGenerate the summary in {lang_name}."

        return f"""You are a sacred wisdom summarizer for KIAAN, a spiritual wellness companion.

YOUR TASK: Create a concise, to-the-point summary (60-80 words) of an elaborate KIAAN response.{language_instruction}

SUMMARY MUST CAPTURE:
1. The CORE INSIGHT or wisdom being shared (1-2 sentences)
2. The KEY PRACTICAL STEP to take (1 sentence)
3. A brief encouragement or blessing (1 short phrase)

SUMMARY RULES:
- Be direct and actionable - no filler words
- Preserve the warm, sacred tone
- Use simple, accessible language
- Include one Sanskrit term if relevant (dharma, karma, etc.)
- Always end with 💙
- Never mention "Gita", "Krishna", "Arjuna", or cite verses
- Never say "the response says" or "KIAAN suggests" - speak directly

SUMMARY FORMAT:
[Core insight in 1-2 clear sentences] [Key action in 1 sentence] [Brief encouragement] 💙

EXAMPLE INPUT (elaborate response):
"Take a gentle breath with me... I feel your worry about the job interview tomorrow. Let me share something profound about action and outcomes...

*... in this stillness, there is wisdom ...*

The ancient principle of karma yoga teaches us that your only right is to perform your actions - never to the fruits. This doesn't mean not caring about results, but rather pouring yourself fully into the preparation while releasing anxiety about what you cannot control...

For your interview tomorrow:
• Tonight, prepare your key points and then consciously release them
• Tomorrow morning, take 5 breaths and remind yourself: 'I offer my best effort'
• During the interview, be fully present - this is your dharma in that moment

Remember: The universe recognizes sincere effort. Whatever happens is exactly what needs to happen for your growth.

You are held by something greater. Trust the process. 💙"

EXAMPLE OUTPUT (summary):
Focus on your preparation and effort, not the outcome. Tonight, prepare your key points then release attachment to results. Your dharma is to show up fully present and offer your best - the rest is not yours to control. Trust the process 💙

Now summarize the given KIAAN response:"""

    def _create_fallback_summary(self, full_response: str) -> dict[str, Any]:
        """
        Create a fallback summary when AI generation fails.
        Uses intelligent text extraction rather than simple truncation.
        """
        # Extract key sentences
        sentences = full_response.replace('\n', ' ').replace('*', '').split('.')
        sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 20]

        if not sentences:
            return {
                "summary": "Find peace in the present moment. Take one small step forward with trust 💙",
                "success": True,
                "fallback": True,
                "word_count": 13
            }

        # Select sentences that contain wisdom markers
        wisdom_markers = ["dharma", "karma", "peace", "wisdom", "breath", "trust", "present", "heart", "soul"]
        action_markers = ["step", "practice", "try", "begin", "start", "remember", "focus", "let"]

        wisdom_sentence = ""
        action_sentence = ""

        for sentence in sentences:
            sentence_lower = sentence.lower()
            if not wisdom_sentence and any(marker in sentence_lower for marker in wisdom_markers):
                wisdom_sentence = sentence
            if not action_sentence and any(marker in sentence_lower for marker in action_markers):
                action_sentence = sentence

        # Build summary from extracted sentences
        if wisdom_sentence and action_sentence and wisdom_sentence != action_sentence:
            summary = f"{wisdom_sentence}. {action_sentence}"
        elif wisdom_sentence:
            summary = wisdom_sentence
        elif action_sentence:
            summary = action_sentence
        else:
            # Take first substantive sentence
            summary = sentences[0] if sentences else "Find peace in the present moment"

        # Truncate if too long
        words = summary.split()
        if len(words) > 80:
            summary = ' '.join(words[:75]) + '...'

        # Ensure blue heart ending
        if not summary.endswith("💙"):
            summary = f"{summary.rstrip('.')} 💙"

        return {
            "summary": summary,
            "success": True,
            "fallback": True,
            "word_count": len(summary.split())
        }

    def _get_cache_key(self, response: str) -> str:
        """Generate a cache key from response content."""
        import hashlib
        # SECURITY: Use sha256 instead of md5 for consistency
        return hashlib.sha256(response.encode()).hexdigest()[:16]

    async def generate_summary_streaming(
        self,
        full_response: str,
        user_message: str,
        language: str | None = None
    ):
        """
        Generate summary with streaming support for real-time display.

        Yields summary chunks as they are generated.
        """
        if not self.ready:
            fallback = self._create_fallback_summary(full_response)
            yield fallback["summary"]
            return

        system_prompt = self._build_summary_prompt(language)

        try:
            async for chunk in self.optimizer.create_streaming_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"User's concern: {user_message[:200]}\n\nFull KIAAN response to summarize:\n{full_response}"}
                ],
                model="gpt-4o-mini",
                temperature=0.5,
                max_tokens=self.max_tokens
            ):
                yield chunk

        except Exception as e:
            logger.error(f"Summary streaming error: {e}")
            fallback = self._create_fallback_summary(full_response)
            yield fallback["summary"]


# Global instance
summary_generator = SummaryGenerator()
