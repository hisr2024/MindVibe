"""Sakha Wisdom Engine - Semantic Gita Verse Retrieval for KIAAN Divine Friend

ARCHITECTURE:
  Loads ALL 700 Bhagavad Gita verses from the complete corpus and provides
  contextual, semantic matching instead of random selection from a small pool.

  The engine:
  1. Loads verses with themes, mental_health_applications, and principles
  2. Builds a reverse index: emotion/theme → matching verses
  3. Selects the MOST relevant verse based on user context (mood, keywords, phase)
  4. Tracks verse history per user to avoid repetition
  5. Supports progressive wisdom paths (verse A → verse B → verse C)

  This is the BRAIN upgrade: from random.choice() to contextual intelligence.
"""

import json
import logging
import os
import random
import re
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


# ─── Mood → Theme Mapping ────────────────────────────────────────────────
# Maps detected moods to Gita themes and mental_health_applications
MOOD_THEME_MAP: dict[str, list[str]] = {
    "anxious": [
        "detachment", "equanimity", "self_mastery", "surrender",
        "emotional_regulation", "mind_control", "inner_peace",
        "stress_management", "mindfulness",
    ],
    "sad": [
        "impermanence", "resilience", "inner_strength", "self_awareness",
        "grief_processing", "emotional_healing", "hope",
        "acceptance", "self_compassion",
    ],
    "angry": [
        "emotional_regulation", "self_mastery", "equanimity",
        "anger_management", "desire_control", "mind_control",
        "patience", "forgiveness", "inner_peace",
    ],
    "confused": [
        "clarity", "self_awareness", "duty", "decision_making",
        "purpose", "discrimination", "knowledge", "wisdom",
        "moral_conflict", "ethical_dilemma",
    ],
    "lonely": [
        "connection", "universal_self", "devotion", "faith",
        "self_awareness", "inner_strength", "belonging",
        "oneness", "compassion",
    ],
    "hopeful": [
        "faith", "devotion", "purpose", "action",
        "positive_psychology", "growth", "potential",
        "divine_support", "self_efficacy",
    ],
    "peaceful": [
        "equanimity", "meditation", "inner_peace", "contentment",
        "mindfulness", "self_awareness", "stillness",
        "surrender", "acceptance",
    ],
    "grateful": [
        "devotion", "faith", "surrender", "offering",
        "positive_psychology", "appreciation", "service",
        "humility", "grace",
    ],
    "overwhelmed": [
        "detachment", "duty", "focused_action", "surrender",
        "stress_management", "emotional_regulation",
        "one_step_at_a_time", "prioritization",
    ],
    "excited": [
        "focused_action", "duty", "purpose", "equanimity",
        "sustainable_growth", "balanced_effort", "joy",
    ],
    "happy": [
        "contentment", "equanimity", "gratitude", "purpose",
        "joy", "positive_psychology", "balanced_living",
    ],
    "hurt": [
        "inner_strength", "resilience", "impermanence", "self_awareness",
        "emotional_healing", "self_compassion", "forgiveness",
        "letting_go", "acceptance",
    ],
    "jealous": [
        "equanimity", "self_awareness", "contentment", "detachment",
        "comparison", "abundance", "self_worth",
        "self_knowledge", "acceptance",
    ],
    "guilty": [
        "forgiveness", "duty", "accountability", "self_compassion",
        "action", "redemption", "growth", "letting_go",
        "moving_forward",
    ],
    "fearful": [
        "inner_strength", "courage", "faith", "impermanence",
        "self_mastery", "emotional_regulation", "resilience",
        "trust", "surrender",
    ],
    "frustrated": [
        "detachment", "focused_action", "equanimity", "patience",
        "perseverance", "duty", "emotional_regulation",
        "acceptance", "self_mastery",
    ],
    "stressed": [
        "inner_peace", "meditation", "equanimity", "surrender",
        "stress_management", "mindfulness", "self_care",
        "balance", "detachment",
    ],
    "neutral": [
        "self_awareness", "purpose", "duty", "knowledge",
        "growth", "wisdom", "action", "mindfulness",
    ],
}

# ─── Phase → Verse Selection Strategy ────────────────────────────────────
PHASE_VERSE_STRATEGY: dict[str, str] = {
    "connect": "comforting",      # Verses about acceptance, you're not alone
    "listen": "validating",       # Verses that validate emotions as natural
    "understand": "illuminating", # Verses that name hidden patterns
    "guide": "guiding",          # Verses with actionable wisdom
    "empower": "empowering",     # Verses about inner strength, self-efficacy
}


class SakhaWisdomEngine:
    """Semantic Gita verse retrieval engine for KIAAN's divine friendship.

    Replaces random.choice() with contextual intelligence:
    - Matches user's exact emotional state to the most relevant verse
    - Avoids repeating verses within a session
    - Builds progressive wisdom paths
    - Leverages full 700-verse corpus
    """

    def __init__(self):
        self._verses: list[dict[str, Any]] = []
        self._theme_index: dict[str, list[int]] = {}
        self._keyword_index: dict[str, list[int]] = {}
        self._loaded = False
        self._load_verses()

    def _load_verses(self) -> None:
        """Load all 700 verses from the complete corpus."""
        corpus_path = Path(__file__).parent.parent.parent / "data" / "gita" / "gita_verses_complete.json"

        if not corpus_path.exists():
            logger.warning(f"Gita corpus not found at {corpus_path}")
            return

        try:
            with open(corpus_path, "r", encoding="utf-8") as f:
                self._verses = json.load(f)

            # Build reverse indices for fast lookup
            for idx, verse in enumerate(self._verses):
                # Index by theme
                theme = verse.get("theme", "").lower().replace(" ", "_")
                if theme:
                    for theme_word in theme.split("_"):
                        self._theme_index.setdefault(theme_word, []).append(idx)
                    # Also index the full theme
                    self._theme_index.setdefault(theme, []).append(idx)

                # Index by spiritual wellness applications
                for app in verse.get("mental_health_applications", []):
                    app_key = app.lower().replace(" ", "_")
                    self._theme_index.setdefault(app_key, []).append(idx)

                # Index by principle keywords
                principle = verse.get("principle", "").lower()
                for word in re.findall(r'\b\w{4,}\b', principle):
                    self._keyword_index.setdefault(word, []).append(idx)

                # Index by English translation keywords (for semantic matching)
                english = verse.get("english", "").lower()
                for word in re.findall(r'\b\w{5,}\b', english):
                    if word not in {"which", "there", "their", "about", "would", "could", "should", "being", "those", "these", "other"}:
                        self._keyword_index.setdefault(word, []).append(idx)

            self._loaded = True
            logger.info(
                f"SakhaWisdomEngine: Loaded {len(self._verses)} verses, "
                f"{len(self._theme_index)} theme entries, "
                f"{len(self._keyword_index)} keyword entries"
            )

        except Exception as e:
            logger.error(f"Failed to load Gita corpus: {e}")

    def get_contextual_verse(
        self,
        mood: str,
        user_message: str,
        phase: str = "guide",
        verse_history: list[str] | None = None,
        mood_intensity: float = 0.5,
    ) -> dict[str, Any] | None:
        """Get the most contextually relevant verse for the user's situation.

        Scoring algorithm:
        1. Theme match (mood → theme mapping): +3 points per match
        2. Keyword match (user's words in verse): +2 points per match
        3. Phase alignment (verse tone matches conversation phase): +2 points
        4. Novelty bonus (verse not seen before): +3 points
        5. Intensity alignment: +1 point if verse matches emotional weight

        Returns the highest-scoring verse with full metadata.
        """
        if not self._loaded or not self._verses:
            return None

        verse_history = verse_history or []
        seen_refs = set(verse_history)

        # Get relevant themes for this mood
        mood_themes = MOOD_THEME_MAP.get(mood, MOOD_THEME_MAP["neutral"])

        # Extract keywords from user message
        user_words = set(re.findall(r'\b\w{4,}\b', user_message.lower()))
        # Remove common words
        stop_words = {"just", "like", "really", "very", "much", "that", "this", "with", "have", "been", "feel", "feeling", "what", "when", "where", "know", "think", "want", "need", "make", "going", "doing"}
        user_words -= stop_words

        # Score each verse
        scores: list[tuple[float, int]] = []

        for idx, verse in enumerate(self._verses):
            score = 0.0
            ref = f"{verse.get('chapter', 0)}.{verse.get('verse', 0)}"

            # 1. Theme matching (highest weight)
            verse_theme = verse.get("theme", "").lower().replace(" ", "_")
            verse_apps = [a.lower().replace(" ", "_") for a in verse.get("mental_health_applications", [])]
            all_verse_themes = set(verse_theme.split("_")) | set(verse_apps)

            theme_matches = sum(1 for t in mood_themes if t in all_verse_themes or any(t in vt for vt in all_verse_themes))
            score += theme_matches * 3.0

            # 2. Keyword matching from user message
            verse_text = (verse.get("english", "") + " " + verse.get("principle", "")).lower()
            keyword_matches = sum(1 for w in user_words if w in verse_text)
            score += keyword_matches * 2.0

            # 3. Phase alignment
            strategy = PHASE_VERSE_STRATEGY.get(phase, "guiding")
            phase_keywords = {
                "comforting": ["peace", "calm", "accept", "steady", "safe", "shelter"],
                "validating": ["natural", "human", "arise", "inevitable", "emotion"],
                "illuminating": ["know", "awareness", "realize", "understand", "truth", "wisdom"],
                "guiding": ["action", "duty", "practice", "discipline", "effort", "path"],
                "empowering": ["strength", "power", "overcome", "conquer", "victory", "self"],
            }
            for pk in phase_keywords.get(strategy, []):
                if pk in verse_text:
                    score += 2.0

            # 4. Novelty bonus (haven't shown this verse before)
            if ref not in seen_refs:
                score += 3.0

            # 5. Intensity alignment
            # High intensity → deeper, more impactful verses (later chapters)
            chapter = verse.get("chapter", 1)
            if mood_intensity > 0.7 and chapter in (2, 3, 6, 12, 18):
                score += 1.0
            elif mood_intensity < 0.3 and chapter in (1, 4, 9, 15):
                score += 1.0

            if score > 0:
                scores.append((score, idx))

        if not scores:
            # Fallback: return a verse from key chapters
            key_chapters = [2, 3, 6, 12, 18]
            candidates = [i for i, v in enumerate(self._verses) if v.get("chapter") in key_chapters]
            if candidates:
                idx = random.choice(candidates)
                return self._format_verse(self._verses[idx])
            return None

        # Sort by score descending, take top 5, pick randomly for variety
        scores.sort(key=lambda x: x[0], reverse=True)
        top_candidates = scores[:5]
        selected_score, selected_idx = random.choice(top_candidates)

        verse = self._verses[selected_idx]
        result = self._format_verse(verse)
        result["relevance_score"] = selected_score
        return result

    def _format_verse(self, verse: dict) -> dict[str, Any]:
        """Format a verse into the standard wisdom context format."""
        ref = f"{verse.get('chapter', '?')}.{verse.get('verse', '?')}"
        principle = verse.get("principle", verse.get("theme", "wisdom"))

        # Create a modern, secular wisdom framing from the verse
        english = verse.get("english", "")

        return {
            "verse_ref": ref,
            "principle": principle.replace(" ", "_").replace("-", "_"),
            "wisdom": english,
            "sanskrit": verse.get("sanskrit", ""),
            "transliteration": verse.get("transliteration", ""),
            "chapter": verse.get("chapter", 0),
            "chapter_name": verse.get("chapter_name", ""),
            "theme": verse.get("theme", ""),
            "mental_health_applications": verse.get("mental_health_applications", []),
        }

    def get_progressive_path(
        self,
        mood: str,
        current_verse_ref: str | None = None,
        verse_history: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        """Get a progressive wisdom path: 3 connected verses that build on each other.

        Used for deeper guidance sessions where multiple turns explore the same theme.
        """
        if not self._loaded:
            return []

        verse_history = verse_history or []

        # Find verses in the same chapter/theme as current
        if current_verse_ref:
            try:
                chapter = int(current_verse_ref.split(".")[0])
            except (ValueError, IndexError):
                chapter = 2
        else:
            # Default progressive chapters based on mood
            mood_chapters = {
                "anxious": 2, "sad": 2, "angry": 3, "confused": 3,
                "lonely": 12, "hopeful": 9, "peaceful": 6, "grateful": 9,
                "overwhelmed": 3, "fearful": 2, "frustrated": 3, "stressed": 6,
            }
            chapter = mood_chapters.get(mood, 2)

        # Get verses from this chapter, excluding seen ones
        chapter_verses = [
            v for v in self._verses
            if v.get("chapter") == chapter
            and f"{v.get('chapter')}.{v.get('verse')}" not in set(verse_history)
        ]

        if len(chapter_verses) < 3:
            # Not enough unseen verses, include adjacent chapters
            for adj in [chapter - 1, chapter + 1]:
                if 1 <= adj <= 18:
                    chapter_verses.extend(
                        v for v in self._verses
                        if v.get("chapter") == adj
                        and f"{v.get('chapter')}.{v.get('verse')}" not in set(verse_history)
                    )

        # Select 3 verses that form a progression
        selected = chapter_verses[:3] if len(chapter_verses) >= 3 else chapter_verses
        return [self._format_verse(v) for v in selected]

    def get_verse_count(self) -> int:
        """Return total number of loaded verses."""
        return len(self._verses)

    def get_verse_by_ref(self, ref: str) -> dict[str, Any] | None:
        """Get a specific verse by reference (e.g., '2.47')."""
        try:
            parts = ref.split(".")
            chapter = int(parts[0])
            verse_num = int(parts[1])
        except (ValueError, IndexError):
            return None

        for v in self._verses:
            if v.get("chapter") == chapter and v.get("verse") == verse_num:
                return self._format_verse(v)
        return None


# ─── Singleton ────────────────────────────────────────────────────────────

_sakha_engine: SakhaWisdomEngine | None = None


def get_sakha_wisdom_engine() -> SakhaWisdomEngine:
    """Get the singleton Sakha Wisdom Engine instance."""
    global _sakha_engine
    if _sakha_engine is None:
        _sakha_engine = SakhaWisdomEngine()
    return _sakha_engine
