"""
Gita AI Analyzer - OpenAI-Powered Pattern Analysis Using Core Wisdom Database.

This service replaces hardcoded regex/keyword matching with intelligent AI analysis
that uses the 701 Bhagavad Gita verses from the Core Wisdom repository.

REPLACES:
- Attachment pattern analysis (regex/keyword matching) -> AI-powered Gita wisdom analysis
- Communication pattern analysis (regex/keyword matching) -> AI-powered sacred speech analysis
- Emotion recognition (hardcoded categories) -> AI-powered Gita-grounded emotion mapping
- Relationship type detection (keyword matching) -> AI-powered Dharma relationship analysis

ARCHITECTURE:
1. Load 701 Gita verses from Core Wisdom repository
2. Use OpenAI API to analyze user input with Gita context
3. Return structured analysis grounded in actual verses
4. Graceful fallback to enhanced keyword matching when AI unavailable

SECURITY:
- No sensitive data logged
- Rate limiting handled by provider_manager
- Cached responses to reduce API calls
"""

from __future__ import annotations

import json
import logging
import hashlib
from pathlib import Path
from typing import Any
from dataclasses import dataclass, field

from backend.services.ai.providers.provider_manager import (
    get_provider_manager,
    AIProviderError,
    ProviderResponse,
)
from backend.services.redis_cache_enhanced import redis_cache

logger = logging.getLogger(__name__)


# =============================================================================
# DATA STRUCTURES
# =============================================================================

@dataclass
class AttachmentAnalysis:
    """AI-analyzed attachment pattern grounded in Gita wisdom."""
    attachment_type: str  # control, future_worry, outcome_dependency, perfectionism, approval_seeking, outcome_anxiety
    description: str  # Human-readable description
    gita_teaching: str  # Core teaching from Gita
    primary_verse: str  # Primary verse reference (e.g., "BG 2.47")
    verse_text: str  # Actual verse text
    remedy: str  # Gita-grounded remedy
    confidence: float  # 0.0-1.0 confidence score
    secondary_patterns: list[str] = field(default_factory=list)  # Additional patterns detected


@dataclass
class EmotionAnalysis:
    """AI-analyzed emotion grounded in Gita wisdom."""
    primary_emotion: str  # calm, energized, melancholic, anxious, balanced
    gita_mapping: str  # Gita concept (e.g., "sthitaprajna", "krodha", "shanti")
    intensity: float  # 0.0-1.0 intensity score
    description: str  # Contextual description
    recommended_verse: str  # Verse reference for this emotion
    verse_text: str  # Actual verse text
    healing_path: str  # Gita-grounded path to healing/balance
    activities: list[str] = field(default_factory=list)  # Recommended activities


@dataclass
class RelationshipAnalysis:
    """AI-analyzed relationship dynamics grounded in Gita wisdom."""
    relationship_type: str  # family, romantic, friendship, workplace, self
    dominant_emotion: str  # anger, hurt, fear, guilt, jealousy, resentment, grief, love
    dharma_lens: str  # How Gita views this relationship dynamic
    primary_verse: str  # Primary verse reference
    verse_text: str  # Actual verse text
    core_principle: str  # Core Gita principle (e.g., "kshama", "daya", "ahimsa")
    healing_insight: str  # Gita-grounded insight for healing
    action_steps: list[str] = field(default_factory=list)  # Dharmic action steps


@dataclass
class CommunicationAnalysis:
    """AI-analyzed communication pattern grounded in Gita wisdom."""
    communication_style: str  # assertive, passive, aggressive, passive_aggressive, dharmic
    emotional_tone: str  # Detected emotional undertone
    gita_guidance: str  # Gita guidance for sacred speech
    primary_verse: str  # Primary verse reference
    verse_text: str  # Actual verse text
    sacred_speech_principle: str  # E.g., "Satyam vada" (speak truth)
    improvement_suggestion: str  # Specific suggestion for improvement


# =============================================================================
# CORE WISDOM LOADER
# =============================================================================

class GitaWisdomCore:
    """
    Core Wisdom database manager - loads and provides access to 701 Gita verses.
    """

    _instance: "GitaWisdomCore | None" = None
    _verses: list[dict[str, Any]] = []
    _verses_by_ref: dict[str, dict[str, Any]] = {}

    def __new__(cls) -> "GitaWisdomCore":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_verses()
        return cls._instance

    def _load_verses(self) -> None:
        """Load all 701 verses from Core Wisdom repository."""
        gita_path = Path(__file__).parent.parent.parent / "data" / "gita" / "gita_verses_complete.json"

        try:
            if gita_path.exists():
                with open(gita_path, "r", encoding="utf-8") as f:
                    self._verses = json.load(f)

                # Build reference lookup
                for verse in self._verses:
                    chapter = verse.get("chapter", 0)
                    verse_num = verse.get("verse", 0)
                    ref = f"BG {chapter}.{verse_num}"
                    self._verses_by_ref[ref] = verse

                logger.info(f"GitaWisdomCore: Loaded {len(self._verses)} verses from Core Wisdom")
            else:
                logger.warning(f"GitaWisdomCore: Verses file not found at {gita_path}")
        except Exception as e:
            logger.error(f"GitaWisdomCore: Failed to load verses: {e}")

    @property
    def verses(self) -> list[dict[str, Any]]:
        return self._verses

    @property
    def verses_count(self) -> int:
        return len(self._verses)

    def get_verse(self, reference: str) -> dict[str, Any] | None:
        """Get verse by reference (e.g., 'BG 2.47')."""
        return self._verses_by_ref.get(reference)

    def get_verses_for_theme(self, theme: str, limit: int = 5) -> list[dict[str, Any]]:
        """Get verses matching a theme."""
        matching = []
        theme_lower = theme.lower()

        for verse in self._verses:
            verse_theme = verse.get("theme", "").lower()
            mh_apps = [app.lower() for app in verse.get("mental_health_applications", [])]
            principle = verse.get("principle", "").lower()

            if (theme_lower in verse_theme or
                any(theme_lower in app for app in mh_apps) or
                theme_lower in principle):
                matching.append(verse)

        return matching[:limit]

    def build_wisdom_context(self, verses: list[dict[str, Any]], max_verses: int = 6) -> str:
        """Build context string from verses for AI prompt."""
        lines = ["[CORE_WISDOM_GITA_CONTEXT]"]
        lines.append(f"Relevant verses from the Bhagavad Gita ({len(self._verses)} total in repository):\n")

        for verse in verses[:max_verses]:
            chapter = verse.get("chapter", 0)
            verse_num = verse.get("verse", 0)
            ref = f"BG {chapter}.{verse_num}"

            english = verse.get("english", "")
            principle = verse.get("principle", "")
            theme = verse.get("theme", "")
            mh_apps = verse.get("mental_health_applications", [])

            lines.append(f"- {ref}: {english}")
            if principle:
                lines.append(f"  Principle: {principle}")
            if theme:
                lines.append(f"  Theme: {theme.replace('_', ' ').title()}")
            if mh_apps:
                lines.append(f"  Applications: {', '.join(mh_apps[:3])}")
            lines.append("")

        lines.append("[/CORE_WISDOM_GITA_CONTEXT]")
        return "\n".join(lines)


# =============================================================================
# AI-POWERED ANALYZERS
# =============================================================================

class GitaAIAnalyzer:
    """
    OpenAI-powered analyzer that uses Core Wisdom Gita database for intelligent analysis.

    Replaces all hardcoded pattern matching with AI-powered analysis grounded in actual
    Bhagavad Gita verses from the 701-verse repository.
    """

    def __init__(self):
        self._provider_manager = get_provider_manager()
        self._wisdom_core = GitaWisdomCore()
        self._cache_ttl = 3600  # 1 hour cache

    # -------------------------------------------------------------------------
    # ATTACHMENT PATTERN ANALYSIS (Replaces regex/keyword matching in viyoga.py)
    # -------------------------------------------------------------------------

    async def analyze_attachment_pattern(
        self,
        user_input: str,
        use_cache: bool = True,
    ) -> AttachmentAnalysis:
        """
        Analyze attachment patterns using OpenAI + Core Wisdom Gita database.

        REPLACES: viyoga.py _analyze_attachment_pattern() keyword matching

        Args:
            user_input: User's outcome worry or concern
            use_cache: Whether to use cached results

        Returns:
            AttachmentAnalysis with AI-generated insights grounded in Gita verses
        """
        # Check cache
        cache_key = f"attachment_analysis:{hashlib.md5(user_input.encode()).hexdigest()[:16]}"
        if use_cache:
            cached = await redis_cache.get(cache_key)
            if cached:
                logger.debug(f"AttachmentAnalysis cache hit: {cache_key}")
                return AttachmentAnalysis(**cached)

        # Get relevant Karma Yoga verses from Core Wisdom
        karma_yoga_themes = ["karma", "action", "detachment", "outcome", "fruits", "equanimity"]
        relevant_verses = []
        for theme in karma_yoga_themes:
            relevant_verses.extend(self._wisdom_core.get_verses_for_theme(theme, limit=3))

        # De-duplicate and limit
        seen_refs = set()
        unique_verses = []
        for v in relevant_verses:
            ref = f"BG {v.get('chapter', 0)}.{v.get('verse', 0)}"
            if ref not in seen_refs:
                seen_refs.add(ref)
                unique_verses.append(v)
        unique_verses = unique_verses[:8]

        # Build Gita context
        gita_context = self._wisdom_core.build_wisdom_context(unique_verses)

        # Build AI prompt
        system_prompt = """You are an expert analyzer of attachment patterns based on Bhagavad Gita wisdom.

Your task is to analyze the user's concern and identify their attachment pattern using ONLY the Gita wisdom provided.

ATTACHMENT TYPES (use exactly one):
- "control": Attachment to controlling outcomes (keywords: control, manage, guarantee, ensure)
- "future_worry": Attachment to imagined future scenarios (keywords: future, what if, might happen)
- "outcome_dependency": Identity/worth tied to specific outcome (keywords: need, must have, can't live without)
- "perfectionism": Attachment to perfect outcomes (keywords: perfect, flawless, no mistakes)
- "approval_seeking": Attachment to others' approval (keywords: approve, think of me, judge, opinion)
- "outcome_anxiety": General anxiety about results (default if no specific pattern)

IMPORTANT: Base your analysis on the actual Gita verses provided. Quote the most relevant verse.

OUTPUT FORMAT (JSON):
{
    "attachment_type": "one of the 6 types above",
    "description": "1-2 sentence description of their specific attachment pattern",
    "gita_teaching": "Core Gita teaching that addresses this pattern",
    "primary_verse": "BG X.Y format",
    "verse_text": "Actual verse text from context",
    "remedy": "Practical Gita-grounded remedy",
    "confidence": 0.0-1.0,
    "secondary_patterns": ["optional additional patterns detected"]
}"""

        user_prompt = f"""Analyze this person's attachment pattern:

USER'S CONCERN:
{user_input}

{gita_context}

Provide your analysis as JSON."""

        try:
            response = await self._provider_manager.chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=600,
                response_format={"type": "json_object"},
            )

            # Parse AI response
            result = json.loads(response.content)

            analysis = AttachmentAnalysis(
                attachment_type=result.get("attachment_type", "outcome_anxiety"),
                description=result.get("description", "Anxiety about outcomes"),
                gita_teaching=result.get("gita_teaching", "Karmanye vadhikaraste"),
                primary_verse=result.get("primary_verse", "BG 2.47"),
                verse_text=result.get("verse_text", "You have the right to action, not to its fruits."),
                remedy=result.get("remedy", "Focus on effort, release grip on results"),
                confidence=float(result.get("confidence", 0.8)),
                secondary_patterns=result.get("secondary_patterns", []),
            )

            # Cache result
            if use_cache:
                await redis_cache.set(cache_key, analysis.__dict__, ttl=self._cache_ttl)

            logger.info(f"AI AttachmentAnalysis: type={analysis.attachment_type}, confidence={analysis.confidence}")
            return analysis

        except (AIProviderError, json.JSONDecodeError) as e:
            logger.warning(f"AI attachment analysis failed, using enhanced fallback: {e}")
            return self._fallback_attachment_analysis(user_input, unique_verses)

    def _fallback_attachment_analysis(
        self,
        user_input: str,
        verses: list[dict[str, Any]],
    ) -> AttachmentAnalysis:
        """Enhanced fallback when AI is unavailable - still uses Core Wisdom."""
        worry_lower = user_input.lower()

        # Enhanced pattern detection (more comprehensive than original)
        patterns = {
            "control": {
                "keywords": ["control", "manage", "guarantee", "make sure", "ensure", "handle", "plan"],
                "teaching": "Karmanye vadhikaraste - Your right is to action alone, never to its fruits",
                "verse": "BG 2.47",
            },
            "future_worry": {
                "keywords": ["future", "what if", "might happen", "could go wrong", "worried about", "fear", "scared"],
                "teaching": "The anxious mind projects into futures that don't exist",
                "verse": "BG 6.35",
            },
            "outcome_dependency": {
                "keywords": ["need", "must have", "can't live without", "desperate", "dependent", "require"],
                "teaching": "Atma-tripti - You are already complete within yourself",
                "verse": "BG 2.14",
            },
            "perfectionism": {
                "keywords": ["perfect", "flawless", "no mistakes", "exactly right", "must be", "should be"],
                "teaching": "Samatva - Equanimity in success and failure",
                "verse": "BG 2.48",
            },
            "approval_seeking": {
                "keywords": ["approve", "think of me", "judge", "opinion", "impression", "perception", "reputation"],
                "teaching": "Sthitaprajna - Unmoved by praise or blame",
                "verse": "BG 2.57",
            },
        }

        # Find matching pattern
        detected_type = "outcome_anxiety"
        detected_pattern = None
        for pattern_type, pattern_data in patterns.items():
            if any(kw in worry_lower for kw in pattern_data["keywords"]):
                detected_type = pattern_type
                detected_pattern = pattern_data
                break

        # Get verse text from Core Wisdom
        if detected_pattern:
            verse_ref = detected_pattern["verse"]
            verse = self._wisdom_core.get_verse(verse_ref)
            verse_text = verse.get("english", "") if verse else "Focus on action, release attachment to results."
            teaching = detected_pattern["teaching"]
        else:
            verse_ref = "BG 2.47"
            verse = self._wisdom_core.get_verse(verse_ref)
            verse_text = verse.get("english", "") if verse else "You have the right to action, not to its fruits."
            teaching = "Nishkama karma - Desireless action"

        return AttachmentAnalysis(
            attachment_type=detected_type,
            description=f"Pattern of {detected_type.replace('_', ' ')} detected in your concern",
            gita_teaching=teaching,
            primary_verse=verse_ref,
            verse_text=verse_text[:200],
            remedy=f"Apply {teaching.split('-')[0].strip()} practice",
            confidence=0.6,  # Lower confidence for fallback
            secondary_patterns=[],
        )

    # -------------------------------------------------------------------------
    # EMOTION RECOGNITION (Replaces hardcoded categories in emotionClassifier.ts)
    # -------------------------------------------------------------------------

    async def analyze_emotion(
        self,
        mood_score: int,
        tags: list[str] | None = None,
        note: str | None = None,
        use_cache: bool = True,
    ) -> EmotionAnalysis:
        """
        Analyze emotional state using OpenAI + Core Wisdom Gita database.

        REPLACES: lib/emotionClassifier.ts classifyEmotion() hardcoded logic

        Args:
            mood_score: 1-10 mood score
            tags: Optional mood tags
            note: Optional mood note
            use_cache: Whether to use cached results

        Returns:
            EmotionAnalysis with AI-generated insights grounded in Gita wisdom
        """
        tags = tags or []
        note = note or ""

        # Build input key for caching
        input_str = f"{mood_score}:{','.join(sorted(tags))}:{note}"
        cache_key = f"emotion_analysis:{hashlib.md5(input_str.encode()).hexdigest()[:16]}"

        if use_cache:
            cached = await redis_cache.get(cache_key)
            if cached:
                logger.debug(f"EmotionAnalysis cache hit: {cache_key}")
                return EmotionAnalysis(**cached)

        # Get emotion-related verses from Core Wisdom
        emotion_themes = ["peace", "calm", "anxiety", "grief", "joy", "balance", "mind", "equanimity"]
        relevant_verses = []
        for theme in emotion_themes:
            relevant_verses.extend(self._wisdom_core.get_verses_for_theme(theme, limit=2))

        # De-duplicate
        seen_refs = set()
        unique_verses = []
        for v in relevant_verses:
            ref = f"BG {v.get('chapter', 0)}.{v.get('verse', 0)}"
            if ref not in seen_refs:
                seen_refs.add(ref)
                unique_verses.append(v)
        unique_verses = unique_verses[:8]

        gita_context = self._wisdom_core.build_wisdom_context(unique_verses)

        system_prompt = """You are an expert in emotional analysis based on Bhagavad Gita wisdom.

Analyze the user's emotional state and map it to both modern emotion categories and Gita concepts.

EMOTION CATEGORIES (use exactly one):
- "calm": Peaceful, serene, content (Gita: shanti, prasanna)
- "energized": Motivated, excited, active (Gita: utsaha, virya)
- "melancholic": Sad, reflective, low energy (Gita: vishada, shoka)
- "anxious": Worried, stressed, nervous (Gita: chinta, bhaya)
- "balanced": Neutral, stable, equanimous (Gita: samatvam, sthira)

GITA EMOTION CONCEPTS:
- Shanti (peace), Sukha (happiness), Dukha (sorrow)
- Krodha (anger), Bhaya (fear), Chinta (worry)
- Rajas (restlessness), Tamas (lethargy), Sattva (clarity)
- Samatvam (equanimity), Prasanna (serenity)

OUTPUT FORMAT (JSON):
{
    "primary_emotion": "one of 5 categories",
    "gita_mapping": "Corresponding Gita concept",
    "intensity": 0.0-1.0,
    "description": "Contextual description of their state",
    "recommended_verse": "BG X.Y format",
    "verse_text": "Relevant verse text",
    "healing_path": "Gita-grounded path to balance",
    "activities": ["3 recommended activities based on Gita wisdom"]
}"""

        user_prompt = f"""Analyze this emotional state:

MOOD SCORE: {mood_score}/10
TAGS: {', '.join(tags) if tags else 'None provided'}
NOTE: {note if note else 'No additional note'}

{gita_context}

Provide your analysis as JSON."""

        try:
            response = await self._provider_manager.chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=600,
                response_format={"type": "json_object"},
            )

            result = json.loads(response.content)

            analysis = EmotionAnalysis(
                primary_emotion=result.get("primary_emotion", "balanced"),
                gita_mapping=result.get("gita_mapping", "samatvam"),
                intensity=float(result.get("intensity", 0.5)),
                description=result.get("description", "A balanced emotional state"),
                recommended_verse=result.get("recommended_verse", "BG 2.48"),
                verse_text=result.get("verse_text", "Equanimity is called yoga."),
                healing_path=result.get("healing_path", "Practice witness consciousness"),
                activities=result.get("activities", ["Meditation", "Read verses", "Journal"]),
            )

            if use_cache:
                await redis_cache.set(cache_key, analysis.__dict__, ttl=self._cache_ttl)

            logger.info(f"AI EmotionAnalysis: emotion={analysis.primary_emotion}, gita={analysis.gita_mapping}")
            return analysis

        except (AIProviderError, json.JSONDecodeError) as e:
            logger.warning(f"AI emotion analysis failed, using enhanced fallback: {e}")
            return self._fallback_emotion_analysis(mood_score, tags, note, unique_verses)

    def _fallback_emotion_analysis(
        self,
        mood_score: int,
        tags: list[str],
        note: str,
        verses: list[dict[str, Any]],
    ) -> EmotionAnalysis:
        """Enhanced fallback when AI unavailable - still grounded in Core Wisdom."""
        normalized_tags = [t.lower() for t in tags]

        # Enhanced emotion detection with Gita mapping
        emotion_map = {
            "anxious": {
                "tags": ["anxious", "stressed", "worried", "nervous", "overwhelmed", "stress"],
                "gita_mapping": "chinta",
                "verse": "BG 6.35",
                "healing": "Practice abhyasa (consistent practice) and vairagya (detachment)",
                "activities": ["Breathing exercises", "Grounding meditation", "Recite calming verses"],
            },
            "melancholic": {
                "tags": ["sad", "low", "tired", "empty", "down", "grief"],
                "gita_mapping": "vishada",
                "verse": "BG 2.11",
                "healing": "Remember your eternal nature (atman) is untouched by temporary emotions",
                "activities": ["Read comforting verses", "Gentle movement", "Express in journal"],
            },
            "energized": {
                "tags": ["energetic", "excited", "motivated", "active", "productive", "happy"],
                "gita_mapping": "utsaha",
                "verse": "BG 18.26",
                "healing": "Channel energy into dharmic action without attachment",
                "activities": ["Set meaningful goals", "Seva (service)", "Study challenging verses"],
            },
            "calm": {
                "tags": ["calm", "peaceful", "relaxed", "gratitude", "grateful", "content"],
                "gita_mapping": "shanti",
                "verse": "BG 2.66",
                "healing": "Maintain this state through regular practice",
                "activities": ["Continue meditation", "Share peace with others", "Gratitude journaling"],
            },
        }

        # Detect emotion from tags
        detected_emotion = "balanced"
        detected_data = None
        for emotion, data in emotion_map.items():
            if any(tag in normalized_tags for tag in data["tags"]):
                detected_emotion = emotion
                detected_data = data
                break

        # Score-based fallback if no tag match
        if not detected_data:
            if mood_score <= 3:
                detected_emotion = "melancholic"
                detected_data = emotion_map["melancholic"]
            elif mood_score >= 8:
                detected_emotion = "energized" if any(t in normalized_tags for t in ["energetic", "excited"]) else "calm"
                detected_data = emotion_map.get(detected_emotion, emotion_map["calm"])
            elif mood_score >= 7:
                detected_emotion = "calm"
                detected_data = emotion_map["calm"]
            elif mood_score <= 5:
                detected_emotion = "melancholic"
                detected_data = emotion_map["melancholic"]
            else:
                detected_emotion = "balanced"
                detected_data = {
                    "gita_mapping": "samatvam",
                    "verse": "BG 2.48",
                    "healing": "Maintain equanimity through steady practice",
                    "activities": ["Explore wisdom library", "Reflect on journey", "Continue practices"],
                }

        # Get verse text from Core Wisdom
        verse_ref = detected_data["verse"]
        verse = self._wisdom_core.get_verse(verse_ref)
        verse_text = verse.get("english", "Equanimity is the art of all work.") if verse else ""

        return EmotionAnalysis(
            primary_emotion=detected_emotion,
            gita_mapping=detected_data["gita_mapping"],
            intensity=min(max((10 - mood_score if detected_emotion in ["anxious", "melancholic"] else mood_score) / 10, 0.1), 1.0),
            description=f"Emotional state indicating {detected_data['gita_mapping']} ({detected_emotion})",
            recommended_verse=verse_ref,
            verse_text=verse_text[:200],
            healing_path=detected_data["healing"],
            activities=detected_data["activities"],
        )

    # -------------------------------------------------------------------------
    # RELATIONSHIP TYPE DETECTION (Replaces keyword matching in gita_wisdom_retrieval.py)
    # -------------------------------------------------------------------------

    async def analyze_relationship(
        self,
        user_input: str,
        use_cache: bool = True,
    ) -> RelationshipAnalysis:
        """
        Analyze relationship dynamics using OpenAI + Core Wisdom Gita database.

        REPLACES: gita_wisdom_retrieval.py RELATIONSHIP_KEYWORDS dictionary matching

        Args:
            user_input: User's relationship concern
            use_cache: Whether to use cached results

        Returns:
            RelationshipAnalysis with AI-generated insights grounded in Gita wisdom
        """
        cache_key = f"relationship_analysis:{hashlib.md5(user_input.encode()).hexdigest()[:16]}"

        if use_cache:
            cached = await redis_cache.get(cache_key)
            if cached:
                logger.debug(f"RelationshipAnalysis cache hit: {cache_key}")
                return RelationshipAnalysis(**cached)

        # Get relationship-focused verses
        relationship_themes = ["compassion", "forgiveness", "anger", "love", "duty", "dharma", "ego", "peace"]
        relevant_verses = []
        for theme in relationship_themes:
            relevant_verses.extend(self._wisdom_core.get_verses_for_theme(theme, limit=2))

        seen_refs = set()
        unique_verses = []
        for v in relevant_verses:
            ref = f"BG {v.get('chapter', 0)}.{v.get('verse', 0)}"
            if ref not in seen_refs:
                seen_refs.add(ref)
                unique_verses.append(v)
        unique_verses = unique_verses[:10]

        gita_context = self._wisdom_core.build_wisdom_context(unique_verses)

        system_prompt = """You are an expert in relationship dynamics based on Bhagavad Gita wisdom.

Analyze the user's relationship situation and provide insights grounded in Gita teachings.

RELATIONSHIP TYPES:
- "family": Parent, sibling, child relationships
- "romantic": Partner, spouse relationships
- "friendship": Friend, companion relationships
- "workplace": Colleague, boss, professional relationships
- "self": Relationship with oneself

DOMINANT EMOTIONS:
- anger, hurt, fear, guilt, jealousy, resentment, grief, love, confusion

GITA PRINCIPLES FOR RELATIONSHIPS:
- Kshama (forgiveness): Liberates the forgiver first
- Daya (compassion): Seeing divine in all beings
- Ahimsa (non-harm): In thought, word, and deed
- Sama-darshana (equal vision): Seeing all beings equally
- Svadharma (one's duty): Acting from dharma, not desire
- Atma-tripti (self-contentment): Not needing others for completeness

OUTPUT FORMAT (JSON):
{
    "relationship_type": "one of 5 types",
    "dominant_emotion": "primary emotion detected",
    "dharma_lens": "How Gita views this situation",
    "primary_verse": "BG X.Y format",
    "verse_text": "Relevant verse text",
    "core_principle": "Key Gita principle",
    "healing_insight": "Gita-grounded insight",
    "action_steps": ["3 dharmic action steps"]
}"""

        user_prompt = f"""Analyze this relationship situation:

{user_input}

{gita_context}

Provide your analysis as JSON."""

        try:
            response = await self._provider_manager.chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=700,
                response_format={"type": "json_object"},
            )

            result = json.loads(response.content)

            analysis = RelationshipAnalysis(
                relationship_type=result.get("relationship_type", "other"),
                dominant_emotion=result.get("dominant_emotion", "confusion"),
                dharma_lens=result.get("dharma_lens", "This is an opportunity for growth"),
                primary_verse=result.get("primary_verse", "BG 6.32"),
                verse_text=result.get("verse_text", "One who sees equality everywhere is the highest yogi."),
                core_principle=result.get("core_principle", "sama-darshana"),
                healing_insight=result.get("healing_insight", "See the divine struggling in the other person"),
                action_steps=result.get("action_steps", ["Practice witness consciousness", "Speak with truth and kindness", "Release attachment to their response"]),
            )

            if use_cache:
                await redis_cache.set(cache_key, analysis.__dict__, ttl=self._cache_ttl)

            logger.info(f"AI RelationshipAnalysis: type={analysis.relationship_type}, emotion={analysis.dominant_emotion}")
            return analysis

        except (AIProviderError, json.JSONDecodeError) as e:
            logger.warning(f"AI relationship analysis failed, using enhanced fallback: {e}")
            return self._fallback_relationship_analysis(user_input, unique_verses)

    def _fallback_relationship_analysis(
        self,
        user_input: str,
        verses: list[dict[str, Any]],
    ) -> RelationshipAnalysis:
        """Enhanced fallback for relationship analysis."""
        input_lower = user_input.lower()

        # Relationship type detection
        type_keywords = {
            "family": ["family", "parent", "mother", "father", "sibling", "child", "son", "daughter", "brother", "sister"],
            "romantic": ["partner", "spouse", "husband", "wife", "boyfriend", "girlfriend", "love", "romantic", "marriage"],
            "friendship": ["friend", "friendship", "companion", "buddy", "pal"],
            "workplace": ["colleague", "boss", "coworker", "work", "office", "professional", "manager", "employee"],
            "self": ["myself", "self", "my own", "i am", "i feel"],
        }

        detected_type = "other"
        for rel_type, keywords in type_keywords.items():
            if any(kw in input_lower for kw in keywords):
                detected_type = rel_type
                break

        # Emotion detection
        emotion_keywords = {
            "anger": ["angry", "anger", "rage", "furious", "irritated", "frustrated", "mad"],
            "hurt": ["hurt", "pain", "wounded", "betrayed", "abandoned", "rejected"],
            "fear": ["fear", "afraid", "scared", "anxious", "worried", "insecure"],
            "guilt": ["guilt", "guilty", "shame", "ashamed", "regret", "sorry"],
            "jealousy": ["jealous", "jealousy", "envy", "envious", "possessive"],
            "grief": ["grief", "loss", "mourning", "sad", "sorrow", "missing"],
            "love": ["love", "care", "affection", "appreciate", "grateful"],
        }

        detected_emotion = "confusion"
        for emotion, keywords in emotion_keywords.items():
            if any(kw in input_lower for kw in keywords):
                detected_emotion = emotion
                break

        # Get relevant verse from Core Wisdom
        verse = verses[0] if verses else self._wisdom_core.get_verse("BG 6.32")
        verse_ref = f"BG {verse.get('chapter', 6)}.{verse.get('verse', 32)}" if verse else "BG 6.32"
        verse_text = verse.get("english", "One who sees equality everywhere is the highest yogi.") if verse else ""

        return RelationshipAnalysis(
            relationship_type=detected_type,
            dominant_emotion=detected_emotion,
            dharma_lens="Every relationship is an opportunity to practice Gita wisdom",
            primary_verse=verse_ref,
            verse_text=verse_text[:200],
            core_principle="sama-darshana",
            healing_insight="See the divine struggling in the other person; they too act from their conditioning",
            action_steps=[
                "Practice witness consciousness before responding",
                "Speak truth with kindness (satyam priyam)",
                "Release attachment to their response",
            ],
        )

    # -------------------------------------------------------------------------
    # COMMUNICATION PATTERN ANALYSIS (Replaces sacred_conversation_patterns.py)
    # -------------------------------------------------------------------------

    async def analyze_communication(
        self,
        message: str,
        context: str | None = None,
        use_cache: bool = True,
    ) -> CommunicationAnalysis:
        """
        Analyze communication patterns using OpenAI + Core Wisdom Gita database.

        REPLACES: sacred_conversation_patterns.py hardcoded templates

        Args:
            message: The message/communication to analyze
            context: Optional context about the situation
            use_cache: Whether to use cached results

        Returns:
            CommunicationAnalysis with AI-generated insights for sacred speech
        """
        cache_key = f"communication_analysis:{hashlib.md5(message.encode()).hexdigest()[:16]}"

        if use_cache:
            cached = await redis_cache.get(cache_key)
            if cached:
                return CommunicationAnalysis(**cached)

        # Get speech-related verses
        speech_themes = ["speech", "words", "truth", "peace", "anger", "dharma"]
        relevant_verses = []
        for theme in speech_themes:
            relevant_verses.extend(self._wisdom_core.get_verses_for_theme(theme, limit=2))

        seen_refs = set()
        unique_verses = []
        for v in relevant_verses:
            ref = f"BG {v.get('chapter', 0)}.{v.get('verse', 0)}"
            if ref not in seen_refs:
                seen_refs.add(ref)
                unique_verses.append(v)
        unique_verses = unique_verses[:6]

        gita_context = self._wisdom_core.build_wisdom_context(unique_verses)

        system_prompt = """You are an expert in communication analysis based on Bhagavad Gita wisdom.

Analyze the communication pattern and provide guidance for sacred speech (vak).

COMMUNICATION STYLES:
- "dharmic": Truthful, beneficial, kind - aligned with Gita principles
- "assertive": Clear and respectful, good boundaries
- "passive": Avoiding conflict, suppressing needs
- "aggressive": Harsh, blaming, reactive
- "passive_aggressive": Indirect, resentful expression

GITA SPEECH PRINCIPLES:
- Satyam (truth): Speaking what is true
- Priyam (pleasant): Speaking what is kind
- Hitam (beneficial): Speaking what helps
- BG 17.15 - Speech that causes no disturbance, truthful, pleasing, beneficial

OUTPUT FORMAT (JSON):
{
    "communication_style": "one of 5 styles",
    "emotional_tone": "underlying emotion",
    "gita_guidance": "Specific Gita guidance for this communication",
    "primary_verse": "BG X.Y format",
    "verse_text": "Relevant verse text",
    "sacred_speech_principle": "Key principle (e.g., satyam priyam hitam)",
    "improvement_suggestion": "Specific suggestion for more dharmic communication"
}"""

        user_prompt = f"""Analyze this communication:

MESSAGE: {message}
{f'CONTEXT: {context}' if context else ''}

{gita_context}

Provide your analysis as JSON."""

        try:
            response = await self._provider_manager.chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=500,
                response_format={"type": "json_object"},
            )

            result = json.loads(response.content)

            analysis = CommunicationAnalysis(
                communication_style=result.get("communication_style", "assertive"),
                emotional_tone=result.get("emotional_tone", "neutral"),
                gita_guidance=result.get("gita_guidance", "Speak truth with kindness"),
                primary_verse=result.get("primary_verse", "BG 17.15"),
                verse_text=result.get("verse_text", "Speech that causes no disturbance is austerity of speech."),
                sacred_speech_principle=result.get("sacred_speech_principle", "satyam priyam hitam"),
                improvement_suggestion=result.get("improvement_suggestion", "Consider both truth and kindness in expression"),
            )

            if use_cache:
                await redis_cache.set(cache_key, analysis.__dict__, ttl=self._cache_ttl)

            logger.info(f"AI CommunicationAnalysis: style={analysis.communication_style}")
            return analysis

        except (AIProviderError, json.JSONDecodeError) as e:
            logger.warning(f"AI communication analysis failed, using fallback: {e}")
            return self._fallback_communication_analysis(message, unique_verses)

    def _fallback_communication_analysis(
        self,
        message: str,
        verses: list[dict[str, Any]],
    ) -> CommunicationAnalysis:
        """Fallback for communication analysis."""
        verse = verses[0] if verses else self._wisdom_core.get_verse("BG 17.15")
        verse_ref = f"BG {verse.get('chapter', 17)}.{verse.get('verse', 15)}" if verse else "BG 17.15"
        verse_text = verse.get("english", "Speech that causes no disturbance is austerity of speech.") if verse else ""

        return CommunicationAnalysis(
            communication_style="assertive",
            emotional_tone="neutral",
            gita_guidance="The Gita teaches us to speak truth (satyam), pleasantly (priyam), and beneficially (hitam)",
            primary_verse=verse_ref,
            verse_text=verse_text[:200],
            sacred_speech_principle="satyam priyam hitam",
            improvement_suggestion="Before speaking, ask: Is it true? Is it kind? Is it necessary?",
        )


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

_analyzer_instance: GitaAIAnalyzer | None = None


def get_gita_ai_analyzer() -> GitaAIAnalyzer:
    """Get the singleton GitaAIAnalyzer instance."""
    global _analyzer_instance
    if _analyzer_instance is None:
        _analyzer_instance = GitaAIAnalyzer()
    return _analyzer_instance


# Convenience export
gita_ai_analyzer = get_gita_ai_analyzer()
