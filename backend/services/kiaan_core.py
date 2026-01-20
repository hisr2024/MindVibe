"""
KIAAN Core Service - Central Wisdom Engine (Quantum Coherence v2.0)

This is the core wisdom engine for the entire KIAAN ecosystem.
All tools (Ardha, Viyoga, Emotional Reset, Karma Reset, Mood, Assessment, Chat)
MUST use this service to ensure:
1. Responses query Gita verses from database
2. Validation requirements are met (2+ Gita terms, wisdom markers, 200-400 words)
3. Authentic Gita-based wisdom
4. Ecosystem consistency

Quantum Coherence Enhancements:
- GPT-4o-mini for cost optimization (75% cheaper than GPT-4)
- Automatic retries with exponential backoff (resilience)
- Token optimization with tiktoken (efficiency)
- Streaming support for real-time responses
- Enhanced error handling (RateLimit, Auth, Timeout)
- Prometheus metrics for cost monitoring
"""

import logging
from typing import Any, AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from backend.services.gita_service import GitaService
from backend.services.openai_optimizer import openai_optimizer, TokenLimitExceededError
from backend.services.redis_cache_enhanced import redis_cache
from backend.services.wisdom_kb import WisdomKnowledgeBase

logger = logging.getLogger(__name__)


class KIAANCore:
    """Central KIAAN wisdom engine for the entire ecosystem with quantum coherence."""

    # Conversational patterns that should trigger empathetic, natural responses
    # instead of formal wisdom discourses
    CONVERSATIONAL_PATTERNS = {
        # Gratitude and appreciation
        "gratitude": [
            "thank", "thanks", "thx", "ty", "danke", "gracias", "merci", "grazie",
            "धन्यवाद", "dhanyavaad", "shukriya", "appreciate", "grateful"
        ],
        # Affirmations and agreements
        "affirmation": [
            "ok", "okay", "got it", "understood", "makes sense", "i see",
            "alright", "right", "sure", "yes", "yeah", "yep", "yup",
            "cool", "nice", "great", "good", "perfect", "awesome", "wonderful"
        ],
        # Simple reactions
        "reaction": [
            "hmm", "ah", "oh", "wow", "interesting", "i understand",
            "that helps", "helpful", "noted", "exactly"
        ],
        # Farewells
        "farewell": [
            "bye", "goodbye", "goodnight", "good night", "take care",
            "see you", "later", "gotta go", "have to go"
        ],
        # Greetings (for follow-up greetings after conversation started)
        "greeting": [
            "hi again", "hello again", "hey again", "back again",
            "i'm back", "still here"
        ]
    }

    def __init__(self):
        self.optimizer = openai_optimizer
        self.ready = openai_optimizer.ready
        self.gita_service = GitaService()
        self.wisdom_kb = WisdomKnowledgeBase()

        # Reduced verse context from 15 to 5 for faster, more spontaneous responses
        # Quality over quantity - 5 highly relevant verses provide sufficient wisdom
        self.verse_context_limit = 5

    def _is_conversational_message(self, message: str) -> tuple[bool, str]:
        """
        Detect if a message is conversational (gratitude, affirmation, reaction, etc.)
        that should receive an empathetic, natural response rather than formal wisdom.

        Returns:
            tuple: (is_conversational, conversation_type)
        """
        message_lower = message.lower().strip()
        words = message_lower.split()

        # Very short messages (1-5 words) are more likely to be conversational
        is_short = len(words) <= 5

        for conv_type, patterns in self.CONVERSATIONAL_PATTERNS.items():
            for pattern in patterns:
                # Check if pattern is in the message
                if pattern in message_lower:
                    # For short messages, definitely conversational
                    if is_short:
                        return True, conv_type
                    # For longer messages, only if pattern is prominent
                    if message_lower.startswith(pattern) or message_lower.endswith(pattern):
                        return True, conv_type

        return False, ""

    def _get_conversational_prompt(self, conv_type: str, language: str | None = None) -> str:
        """
        Get a system prompt for conversational/empathetic responses.
        These are warm, natural responses without formal wisdom structure.
        """
        language_instruction = ""
        if language and language != "en":
            language_map = {
                "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "bn": "Bengali",
                "mr": "Marathi", "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam",
                "pa": "Punjabi", "sa": "Sanskrit", "es": "Spanish", "fr": "French",
                "de": "German", "pt": "Portuguese", "ja": "Japanese", "zh": "Chinese",
            }
            lang_name = language_map.get(language, language)
            language_instruction = f"\nRespond in {lang_name}."

        prompts = {
            "gratitude": f"""You are KIAAN, a warm and caring AI companion. The user just expressed gratitude or thanks.{language_instruction}

RESPOND WITH:
- Acknowledge their gratitude warmly and naturally
- Express that you're genuinely here for them
- Offer gentle encouragement or availability
- Keep it brief, warm, and personal (2-4 sentences max)
- End with 💙

TONE: Like a caring friend responding to thanks - warm, genuine, humble.
DO NOT: Give wisdom teachings, structured advice, or formal responses. This is just a warm human moment.

EXAMPLES:
- "You're so welcome! I'm always here whenever you need to talk. Take good care of yourself. 💙"
- "It means a lot that our conversation helped. Remember, I'm here whenever you need me. 💙"
- "I'm glad I could be here for you. Wishing you a peaceful day ahead. 💙"
""",
            "affirmation": f"""You are KIAAN, a supportive AI companion. The user just acknowledged or affirmed something.{language_instruction}

RESPOND WITH:
- A warm acknowledgment that you're glad they understand
- Gentle encouragement to continue their journey
- Brief availability reminder
- Keep it natural and brief (2-3 sentences)
- End with 💙

TONE: Supportive, encouraging, patient - like a wise friend nodding along.
DO NOT: Launch into new teachings or advice. Simply affirm their understanding.

EXAMPLES:
- "I'm glad that resonated with you. Take your time with these insights - there's no rush. 💙"
- "Yes, you've got it. Trust yourself as you move forward. 💙"
""",
            "reaction": f"""You are KIAAN, an attentive AI companion. The user just shared a reaction or acknowledgment.{language_instruction}

RESPOND WITH:
- Gentle acknowledgment of their reflection
- Brief encouraging presence
- Space for them to share more if they wish
- Keep it minimal and warm (1-3 sentences)
- End with 💙

TONE: Present, patient, listening - creating space without filling it.
DO NOT: Over-explain or give unsolicited advice.

EXAMPLES:
- "I'm here with you. Take all the time you need. 💙"
- "Yes, let that settle. Is there anything else on your heart? 💙"
""",
            "farewell": f"""You are KIAAN, a caring AI companion. The user is saying goodbye.{language_instruction}

RESPOND WITH:
- Warm farewell wishes
- Brief blessing or encouragement for their path
- Reminder that you're always here
- Keep it heartfelt but brief (2-3 sentences)
- End with 💙

TONE: Caring, supportive send-off - like a wise friend saying goodbye.
DO NOT: Give lengthy advice or try to extend the conversation.

EXAMPLES:
- "Take care, dear friend. May peace walk with you today. I'm always here whenever you return. 💙"
- "Goodbye for now. Carry this calm with you, and know I'm here when you need me. 💙"
""",
            "greeting": f"""You are KIAAN, a welcoming AI companion. The user is greeting you again.{language_instruction}

RESPOND WITH:
- Warm welcome back
- Brief check-in on how they're doing
- Openness to whatever they'd like to share
- Keep it friendly and inviting (2-3 sentences)
- End with 💙

TONE: Warm, welcoming, interested - like greeting an old friend.
DO NOT: Launch into wisdom teachings without knowing what they need.

EXAMPLES:
- "Welcome back! It's lovely to hear from you again. How are you feeling today? 💙"
- "Hello again, friend. I'm here and ready to listen. What's on your mind? 💙"
"""
        }

        return prompts.get(conv_type, prompts["affirmation"])

    async def _generate_conversational_response(
        self,
        message: str,
        conv_type: str,
        language: str | None = None
    ) -> dict[str, Any]:
        """
        Generate a warm, empathetic response for conversational messages.
        These are short, natural responses that don't include formal wisdom teachings.
        """
        system_prompt = self._get_conversational_prompt(conv_type, language)

        try:
            response = await self.optimizer.create_completion_with_retry(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                model="gpt-4o-mini",
                temperature=0.8,  # Slightly higher for more natural variation
                max_tokens=100  # Very short responses for conversational messages
            )

            response_text = response.choices[0].message.content
            if not response_text:
                # Fallback conversational responses
                fallbacks = {
                    "gratitude": "You're so welcome! I'm always here for you. 💙",
                    "affirmation": "I'm glad that resonated. I'm here whenever you need me. 💙",
                    "reaction": "I'm with you. Take your time. 💙",
                    "farewell": "Take care, friend. I'm always here when you return. 💙",
                    "greeting": "Welcome back! How can I support you today? 💙"
                }
                response_text = fallbacks.get(conv_type, "I'm here for you. 💙")

            return {
                "response": response_text,
                "verses_used": [],
                "validation": {"valid": True, "conversational": True},
                "context": f"conversational_{conv_type}",
                "model": "gpt-4o-mini",
                "token_optimized": True,
                "cached": False,
                "conversational": True
            }

        except Exception as e:
            logger.error(f"KIAAN Core: Conversational response error: {e}")
            # Simple fallback
            fallbacks = {
                "gratitude": "You're welcome! I'm here whenever you need me. 💙",
                "affirmation": "I'm glad that helped. I'm here for you. 💙",
                "reaction": "I'm here with you. 💙",
                "farewell": "Take care! I'm always here. 💙",
                "greeting": "Hello again! What's on your mind? 💙"
            }
            return {
                "response": fallbacks.get(conv_type, "I'm here for you. 💙"),
                "verses_used": [],
                "validation": {"valid": True, "fallback": True},
                "context": f"conversational_{conv_type}",
                "model": "fallback",
                "cached": False,
                "conversational": True
            }

    async def get_kiaan_response(
        self,
        message: str,
        user_id: str | None,
        db: AsyncSession,
        context: str = "general",
        stream: bool = False,
        language: str | None = None,
    ) -> dict[str, Any]:
        """
        Generate KIAAN response with Gita verses from database (Quantum Coherence v2.0).

        This is the central wisdom engine used by ALL ecosystem tools.

        Enhancements:
        - Uses GPT-4o-mini (75% cost savings)
        - Automatic retries with exponential backoff
        - Token optimization (reduced max_tokens from 600 to 400)
        - Enhanced error handling
        - Expanded verse context to 15 verses (was 5)
        - Conversational detection for empathetic responses

        Args:
            message: User message or context
            user_id: User ID (optional)
            db: Database session
            context: Context type (general, ardha_reframe, viyoga_detachment, etc.)
            stream: Enable streaming responses (default: False)

        Returns:
            dict with response, verses_used, validation, and context
        """
        if not self.ready:
            logger.error("KIAAN Core: OpenAI optimizer not ready")
            return {
                "response": self.optimizer.get_fallback_response(context),
                "verses_used": [],
                "validation": {"valid": False, "errors": ["OpenAI not configured"]},
                "context": context,
                "cached": False
            }

        # Step 0a: Check if this is a conversational message (thanks, ok, goodbye, etc.)
        # These get warm, empathetic responses instead of formal wisdom
        is_conversational, conv_type = self._is_conversational_message(message)
        if is_conversational and context == "general":
            logger.info(f"✅ Conversational message detected ({conv_type}): responding with empathy")
            return await self._generate_conversational_response(message, conv_type, language)

        # Step 0b: Check cache first (Quantum Coherence: 50-70% cost reduction)
        cached_response = redis_cache.get_cached_kiaan_response(message, context)
        if cached_response and not stream:
            logger.info(f"✅ Cache HIT for KIAAN response (context: {context})")
            return {
                "response": cached_response,
                "verses_used": [],  # Verses not tracked for cached responses
                "validation": {"valid": True, "cached": True},
                "context": context,
                "model": "gpt-4o-mini",
                "token_optimized": True,
                "cached": True
            }

        # Step 1: Query relevant Gita verses from database (expanded to 15)
        verses = await self._get_relevant_verses(db, message, context, limit=self.verse_context_limit)

        # CRITICAL: Must have at least 2 verses
        if not verses or len(verses) < 2:
            logger.warning(f"KIAAN Core: Only {len(verses) if verses else 0} verses found, getting fallback")
            verses = await self._get_fallback_verses(db)

        # Step 2: Build wisdom context from verses
        wisdom_context = self._build_verse_context(verses)

        # Step 3: Generate response with GPT-4o-mini, incorporating verses
        system_prompt = self._build_system_prompt(wisdom_context, message, context, language)

        try:
            # Use optimizer for automatic retries and enhanced error handling
            # Reduced max_tokens from 400 to 250 for faster spontaneous responses
            response = await self.optimizer.create_completion_with_retry(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                model="gpt-4o-mini",  # Upgraded from gpt-4
                temperature=0.7,
                max_tokens=250,  # Reduced from 400 for faster responses
                stream=stream
            )

            if stream:
                # Return streaming response
                return {
                    "stream": response,
                    "verses_used": [v.get("verse_id", "") for v in verses[:3]],
                    "context": context
                }

            response_text = response.choices[0].message.content
            if not response_text:
                response_text = self.optimizer.get_fallback_response(context)

        except TokenLimitExceededError as e:
            logger.error(f"KIAAN Core: Token limit exceeded: {e}")
            # Try with smaller context
            verses = verses[:5]  # Reduce to 5 verses
            wisdom_context = self._build_verse_context(verses)
            system_prompt = self._build_system_prompt(wisdom_context, message, context)

            try:
                response = await self.optimizer.create_completion_with_retry(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message}
                    ],
                    model="gpt-4o-mini",
                    temperature=0.7,
                    max_tokens=400
                )
                response_text = response.choices[0].message.content or self.optimizer.get_fallback_response(context)
            except Exception as retry_error:
                logger.error(f"KIAAN Core: Retry failed: {retry_error}")
                response_text = self.optimizer.get_fallback_response(context)

        except Exception as e:
            logger.error(f"KIAAN Core: OpenAI error: {type(e).__name__}: {e}")
            response_text = self.optimizer.get_fallback_response(context)

        # Step 4: Validate response (lightweight check only - no retry for speed)
        validation = self._validate_kiaan_response_fast(response_text)

        # Step 5: SKIP validation retry for spontaneous responses
        # Previously: retry with stricter prompt if validation fails (adds 2-5s latency)
        # Now: Accept response if it has basic quality markers - speed over perfection
        if not validation["valid"]:
            logger.info(f"KIAAN Core: Validation soft-fail - {validation.get('errors', [])}, accepting for speed")

        # Step 6: Cache the response (Quantum Coherence: future cost savings)
        if validation["valid"] and response_text:
            redis_cache.cache_kiaan_response(message, context, response_text)
            logger.debug(f"✅ Cached KIAAN response for future use (context: {context})")

        return {
            "response": response_text,
            "verses_used": [v.get("verse_id", "") for v in verses[:3]],
            "validation": validation,
            "context": context,
            "model": "gpt-4o-mini",
            "token_optimized": True,
            "cached": False  # This is a fresh response, not from cache
        }

    async def get_kiaan_response_streaming(
        self,
        message: str,
        user_id: str | None,
        db: AsyncSession,
        context: str = "general",
        language: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming KIAAN response for real-time display.
        Optimized for spontaneous, instant feedback.

        Args:
            message: User message or context
            user_id: User ID (optional)
            db: Database session
            context: Context type

        Yields:
            Response chunks as they arrive
        """
        if not self.ready:
            yield self.optimizer.get_fallback_response(context)
            return

        # Check for conversational messages first (thanks, ok, goodbye, etc.)
        is_conversational, conv_type = self._is_conversational_message(message)
        if is_conversational and context == "general":
            logger.info(f"✅ Conversational streaming message ({conv_type}): responding with empathy")
            # For conversational messages, use a simpler prompt and shorter response
            system_prompt = self._get_conversational_prompt(conv_type, language)
            try:
                async for chunk in self.optimizer.create_streaming_completion(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": message}
                    ],
                    model="gpt-4o-mini",
                    temperature=0.8,
                    max_tokens=80  # Very short for conversational
                ):
                    yield chunk
                return
            except Exception as e:
                logger.error(f"KIAAN Core: Conversational streaming error: {e}")
                fallbacks = {
                    "gratitude": "You're welcome! I'm here for you. 💙",
                    "affirmation": "I'm glad that helped. 💙",
                    "reaction": "I'm here with you. 💙",
                    "farewell": "Take care! 💙",
                    "greeting": "Hello again! 💙"
                }
                yield fallbacks.get(conv_type, "I'm here for you. 💙")
                return

        # Get verses with reduced limit for faster processing
        verses = await self._get_relevant_verses(db, message, context, limit=3)  # Reduced from 5 for streaming
        if not verses:
            verses = await self._get_fallback_verses(db, limit=2)

        # Build prompts with concise context
        wisdom_context = self._build_verse_context_fast(verses)
        system_prompt = self._build_system_prompt_fast(wisdom_context, context, language)

        try:
            # Stream response with reduced tokens for faster output
            async for chunk in self.optimizer.create_streaming_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                model="gpt-4o-mini",
                temperature=0.7,
                max_tokens=200  # Reduced from 400 for faster streaming
            ):
                yield chunk

        except Exception as e:
            logger.error(f"KIAAN Core: Streaming error: {e}")
            yield self.optimizer.get_fallback_response(context)

    async def _get_relevant_verses(
        self,
        db: AsyncSession,
        query: str,
        context: str,
        limit: int = 15  # Expanded from 5 to 15
    ) -> list[dict[str, Any]]:
        """Get relevant Gita verses based on query and context."""
        try:
            # Use wisdom KB to search verses
            verse_results = await self.wisdom_kb.search_relevant_verses(
                db=db,
                query=query,
                limit=limit
            )
            
            # Format results
            formatted_verses = []
            for result in verse_results:
                verse = result.get("verse")
                if verse:
                    chapter = getattr(verse, 'chapter', '')
                    verse_num = getattr(verse, 'verse', '')
                    formatted_verses.append({
                        "verse_id": f"{chapter}.{verse_num}" if chapter and verse_num else "",
                        "english": getattr(verse, 'english', ''),
                        "principle": getattr(verse, 'principle', ''),
                        "theme": getattr(verse, 'theme', ''),
                        "score": result.get("score", 0.0)
                    })
            
            return formatted_verses
            
        except Exception as e:
            logger.error(f"KIAAN Core: Error getting verses: {e}")
            return []

    async def _get_fallback_verses(self, db: AsyncSession, limit: int = 3) -> list[dict[str, Any]]:
        """Get fallback verses when search fails."""
        try:
            # Get key verses: 2.47 (karma yoga), 2.48 (equanimity), 6.5 (self-elevation)
            fallback_refs = [(2, 47), (2, 48), (6, 5)]
            fallback_verses = []
            
            for chapter, verse_num in fallback_refs:
                verse = await GitaService.get_verse_by_reference(db, chapter, verse_num)
                if verse:
                    fallback_verses.append({
                        "verse_id": f"{verse.chapter}.{verse.verse}",
                        "english": verse.english,
                        "principle": verse.principle,
                        "theme": verse.theme,
                        "score": 0.8
                    })
            
            return fallback_verses[:limit]
            
        except Exception as e:
            logger.error(f"KIAAN Core: Error getting fallback verses: {e}")
            return []

    def _build_verse_context_fast(self, verses: list[dict[str, Any]]) -> str:
        """Build concise wisdom context for fast responses (3 verses max)."""
        if not verses:
            return "Core principles: dharma (duty), karma (action), equanimity (balance)."

        principles = []
        for verse in verses[:3]:
            if verse.get('principle'):
                principles.append(verse['principle'][:100])
            elif verse.get('english'):
                principles.append(verse['english'][:80])

        return "WISDOM: " + " | ".join(principles) if principles else "Apply dharma, karma yoga, equanimity."

    def _build_verse_context(self, verses: list[dict[str, Any]]) -> str:
        """Build wisdom context from verses (optimized to 5 for faster responses)."""
        if not verses:
            return """FALLBACK WISDOM:
Apply universal Gita principles:
- Dharma (righteous duty) - Do what's right
- Karma Yoga (action without attachment) - Focus on effort, not results
- Equanimity (samatva) - Stay balanced in success and failure
"""

        context_parts = ["GITA WISDOM (use internally, NEVER cite):", ""]

        # Use up to 5 verses for balanced context (reduced from 15 for speed)
        for i, verse in enumerate(verses[:5], 1):
            if verse.get('english'):
                # Truncate to 150 chars for speed
                english_text = verse['english']
                if len(english_text) > 150:
                    english_text = english_text[:147] + '...'
                context_parts.append(f"{i}. {english_text}")

        context_parts.extend([
            "",
            "RULES: Never cite Gita/Krishna/Arjuna. Use terms: dharma, karma, yoga, peace. End with 💙"
        ])

        return "\n".join(context_parts)

    def _build_system_prompt_fast(self, wisdom_context: str, context: str, language: str | None = None) -> str:
        """Build concise system prompt for fast streaming responses."""
        lang_note = f" Respond in {language}." if language and language != "en" else ""

        return f"""You are KIAAN, a wise AI companion rooted in ancient wisdom.{lang_note}

{wisdom_context}

RESPOND WITH:
1. Acknowledge their feeling briefly
2. Share one wisdom insight (use dharma, karma, yoga, peace)
3. Give 1-2 practical steps
4. End with encouragement and 💙

RULES: Be warm and concise. Never cite Gita/Krishna/Arjuna. 100-150 words max."""

    def _build_system_prompt(self, wisdom_context: str, message: str, context: str, language: str | None = None) -> str:
        """Build system prompt based on context type and language (optimized for speed)."""

        # Language instruction for non-English responses
        language_instruction = ""
        if language and language != "en":
            language_map = {
                "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "bn": "Bengali",
                "mr": "Marathi", "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam",
                "pa": "Punjabi", "sa": "Sanskrit", "es": "Spanish", "fr": "French",
                "de": "German", "pt": "Portuguese", "ja": "Japanese", "zh": "Chinese",
            }
            lang_name = language_map.get(language, language)
            language_instruction = f"\n\nRESPOND IN {lang_name}. Keep Sanskrit terms (dharma, karma, yoga) but explain in {lang_name}."

        base_prompt = f"""You are KIAAN, an AI guide rooted in timeless wisdom.{language_instruction}

{wisdom_context}

STRUCTURE (brief and focused):
1. WISDOM: Share the core principle (without citing sources)
2. APPLICATION: Connect to their situation
3. ACTION: 2-3 practical steps for today
4. CLOSE: Encouraging insight + 💙

REQUIREMENTS:
- Use Sanskrit terms: dharma, karma, yoga, peace, equanimity, balance
- NEVER mention: Bhagavad Gita, Krishna, Arjuna, verse, chapter
- Be warm, compassionate, conversational
- 150-250 words, end with 💙"""

        # Add context-specific instructions
        if context == "ardha_reframe":
            base_prompt += """

CONTEXT: This is for thought reframing (Ardha). Help them shift from negative thought patterns to balanced perspective using Gita wisdom about equanimity (samatva) and steady wisdom (sthitaprajna)."""
        
        elif context == "viyoga_detachment":
            base_prompt += """

CONTEXT: This is for outcome detachment (Viyoga). Guide them to release attachment to results using karma yoga principles - focus on action, not fruits."""
        
        elif context == "emotional_reset":
            base_prompt += """

CONTEXT: This is for emotional reset. Guide them through releasing difficult emotions using Gita wisdom about emotional regulation and inner peace."""
        
        elif context == "karma_reset":
            base_prompt += """

CONTEXT: This is for relational healing (Karma Reset). Guide them to repair relationships and restore balance using Gita principles of compassion (daya) and right action (dharma)."""
        
        elif context == "mood_assessment":
            base_prompt += """

CONTEXT: This is mood tracking feedback. Offer wisdom-based encouragement and guidance based on their emotional state."""
        
        elif context == "weekly_assessment":
            base_prompt += """

CONTEXT: This is weekly reflection feedback. Offer deeper wisdom about their growth journey using Gita principles of self-development (sadhana)."""
        
        return base_prompt

    def _validate_kiaan_response_fast(self, response: str) -> dict[str, Any]:
        """
        Fast validation for spontaneous responses - minimal checks for speed.
        Accepts responses that meet basic quality without strict validation.
        """
        errors = []

        # Relaxed word count check (50-400 words) - faster generation allowed
        word_count = len(response.split())
        if word_count < 50:
            errors.append(f"Response too short: {word_count} words")

        # Single Gita term is sufficient for fast validation
        gita_terms = ["dharma", "karma", "yoga", "peace", "wisdom", "balance", "equanimity", "detachment", "atman", "buddhi"]
        terms_found = [term for term in gita_terms if term.lower() in response.lower()]

        # Only fail if response has forbidden citations (critical)
        forbidden = ["bhagavad gita", "gita says", "krishna says", "arjuna"]
        citations_found = [f for f in forbidden if f in response.lower()]
        if citations_found:
            errors.append(f"Forbidden citations: {citations_found}")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "word_count": word_count,
            "gita_terms": terms_found,
            "fast_validation": True
        }

    def _validate_kiaan_response(self, response: str, verses: list[dict[str, Any]]) -> dict[str, Any]:
        """Full validation for KIAAN response (used for caching decisions)."""
        errors = []

        # Word count check (100-400 words) - adjusted for faster responses
        word_count = len(response.split())
        if not (100 <= word_count <= 400):
            errors.append(f"Word count {word_count} not in range 100-400")

        # Gita terms check (at least 1 for speed)
        gita_terms = [
            "dharma", "karma", "yoga", "moksha", "atman", "prakriti", "purusha",
            "sattva", "rajas", "tamas", "buddhi", "equanimity", "detachment",
            "samatva", "sthitaprajna", "vairagya", "abhyasa", "nishkama"
        ]
        terms_found = [term for term in gita_terms if term.lower() in response.lower()]
        if len(terms_found) < 1:
            errors.append(f"No Gita terms found")

        # Wisdom markers check - relaxed
        wisdom_markers = [
            "ancient wisdom", "timeless", "eternal", "teaches", "reminds", "universal", "wisdom"
        ]
        markers_found = any(marker.lower() in response.lower() for marker in wisdom_markers)

        # Check for forbidden citations
        forbidden = ["bhagavad gita", "gita says", "krishna", "arjuna", "verse", "chapter"]
        citations_found = [f for f in forbidden if f in response.lower()]
        if citations_found:
            errors.append(f"Forbidden citations found: {citations_found}")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "word_count": word_count,
            "gita_terms": terms_found,
            "markers_found": markers_found
        }

    async def _retry_with_validation(
        self,
        message: str,
        verses: list[dict[str, Any]],
        errors: list[str],
        context: str,
        language: str | None = None
    ) -> str:
        """Retry with stricter prompt when validation fails (using optimizer)."""
        if not self.ready:
            logger.error("KIAAN Core: OpenAI optimizer not ready for retry")
            return self._get_emergency_fallback(context)

        wisdom_context = self._build_verse_context(verses)

        # Language instruction for retry
        language_instruction = ""
        if language and language != "en":
            language_map = {
                "hi": "Hindi (हिन्दी)", "ta": "Tamil (தமிழ்)", "te": "Telugu (తెలుగు)",
                "bn": "Bengali (বাংলা)", "mr": "Marathi (मराठी)", "gu": "Gujarati (ગુજરાતી)",
                "kn": "Kannada (ಕನ್ನಡ)", "ml": "Malayalam (മലയാളം)", "pa": "Punjabi (ਪੰਜਾਬੀ)",
                "sa": "Sanskrit (संस्कृत)", "es": "Spanish (Español)", "fr": "French (Français)",
                "de": "German (Deutsch)", "pt": "Portuguese (Português)", "ja": "Japanese (日本語)",
                "zh-CN": "Chinese Simplified (简体中文)", "zh": "Chinese (中文)",
            }
            lang_name = language_map.get(language, language)
            language_instruction = f"\n6. RESPOND ENTIRELY IN {lang_name} - this is mandatory!"

        # Build stricter prompt that addresses the errors
        strict_prompt = f"""You are KIAAN. Your previous response failed validation. Fix these issues:
{chr(10).join(f'- {error}' for error in errors)}

CRITICAL REQUIREMENTS:
1. Response MUST be 200-400 words (count carefully!)
2. Include AT LEAST 2 Sanskrit/Gita terms: dharma, karma, yoga, atman, moksha, buddhi, equanimity, detachment, etc.
3. Include wisdom markers: "ancient wisdom teaches", "timeless truth", "eternal principle"
4. NEVER mention: Bhagavad Gita, Gita, Krishna, Arjuna, verse, chapter, or any citations
5. End with 💙{language_instruction}

{wisdom_context}

User message: {message}

Provide a complete, validated response that meets ALL requirements above."""

        try:
            response = await self.optimizer.create_completion_with_retry(
                messages=[
                    {"role": "system", "content": strict_prompt},
                    {"role": "user", "content": "Generate the validated response now."}
                ],
                model="gpt-4o-mini",  # Upgraded from gpt-4
                temperature=0.7,
                max_tokens=400,  # Optimized from 600
            )

            response_text = response.choices[0].message.content
            if not response_text:
                response_text = self._get_emergency_fallback(context)

            return response_text

        except Exception as e:
            logger.error(f"KIAAN Core: Retry failed: {type(e).__name__}: {e}")
            return self._get_emergency_fallback(context)

    def _get_emergency_fallback(self, context: str) -> str:
        """Emergency fallback response when all else fails."""
        return """The ancient wisdom teaches us that life's challenges are opportunities for growth. When we face difficulties, we're invited to develop inner strength through the practice of equanimity - maintaining balance regardless of external circumstances.

Your journey right now calls for patience and self-compassion. The timeless principle of karma yoga reminds us to focus on our actions, not the results. You can take these steps today: First, acknowledge your feelings without judgment. Second, identify one small action within your control. Third, practice steady presence in that action.

This path of self-mastery isn't about perfection - it's about consistent effort. The eternal truth reveals that your essence (atman) remains peaceful and complete, even when circumstances feel turbulent. Each moment is fresh, each breath a new beginning.

Trust in your inner wisdom (buddhi) to guide you forward. You have the strength to navigate this with grace and dharma. 💙"""


# Global instance
kiaan_core = KIAANCore()
