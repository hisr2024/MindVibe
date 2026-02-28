"""
KIAAN Distillation Pipeline — Module 2 of 4 Self-Sufficiency Modules

Extracts reusable "wisdom atoms" from every successful LLM response,
so the system grows smarter with every interaction.

How it works:
    1. After each LLM response, the pipeline analyzes the text
    2. Segments the response into functional parts (validation, reframe, action, etc.)
    3. Classifies each segment by category, mood, topic, and phase
    4. Deduplicates against existing atoms (SHA-256 content hash)
    5. Stores new atoms in the wisdom_atoms table
    6. Links atoms to verse references if Gita content is detected

Growth model:
    Day 1:   ~0 atoms (cold start — all LLM)
    Week 1:  ~200 atoms (from ~50 conversations × 4 atoms each)
    Month 1: ~2,000 atoms (self-sufficiency threshold for common queries)
    Month 3: ~8,000 atoms (deep coverage across moods × topics × phases)
    Month 6: ~15,000 atoms (most conversations handled without LLM)

The pipeline runs asynchronously after each LLM response, so it never
adds latency to the user's experience.
"""

from __future__ import annotations

import hashlib
import logging
import re
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.self_sufficiency import WisdomAtom

logger = logging.getLogger(__name__)


# =============================================================================
# SEGMENT CLASSIFICATION PATTERNS
# =============================================================================

# Patterns that indicate which category a text segment belongs to
CATEGORY_SIGNALS = {
    "validation": [
        r"\bi hear\b", r"\bi understand\b", r"\bthat'?s? (?:valid|real|understandable)\b",
        r"\byour feelings?\b", r"\bit makes sense\b", r"\bthat'?s? (?:hard|tough|difficult)\b",
        r"\byou'?re? (?:not alone|right to feel)\b", r"\bcourage to\b",
        r"\bwhat you'?re? (?:going through|experiencing|feeling)\b",
    ],
    "reframe": [
        r"\banother way to (?:see|look at|think about)\b", r"\bwhat if\b",
        r"\bperspective\b", r"\breframe\b", r"\bconsider (?:that|this)\b",
        r"\bthe pattern (?:here|is)\b", r"\bthe mechanism\b",
        r"\bnotice (?:that|how|what)\b", r"\bwhen you (?:step back|observe)\b",
        r"\byour brain is\b", r"\bnervous system\b", r"\bcortisol\b",
        r"\bcognitive\b", r"\bneural\b", r"\bamygdala\b",
    ],
    "action": [
        r"\btry this\b", r"\bone (?:small |concrete )?(?:step|action|thing)\b",
        r"\bstart (?:by|with)\b", r"\bpractice\b", r"\bexercise\b",
        r"\bbreathe?\b", r"\bfor (?:\d+|five|ten|thirty) (?:seconds|minutes)\b",
        r"\bset a timer\b", r"\bwrite down\b", r"\blist\b",
        r"\bschedule\b", r"\b(?:5|10|15)-minute\b",
    ],
    "wisdom": [
        r"\bgita\b", r"\bverse\b", r"\bchapter\b", r"\bkrishna\b",
        r"\bdharma\b", r"\bkarma\b", r"\bequanimity\b", r"\bdetachment\b",
        r"\bsurrender\b", r"\bself-knowledge\b", r"\binner peace\b",
        r"\bthe principle\b", r"\bwisdom (?:says|teaches|shows)\b",
        r"\bBG \d+\.\d+\b", r"\b\d+\.\d+\b",
    ],
    "encouragement": [
        r"\byou (?:have|already|can|'ve)\b.*\b(?:capacity|strength|ability|power)\b",
        r"\byou'?re? (?:capable|stronger|resilient|not alone)\b",
        r"\btrust (?:yourself|your|the process)\b", r"\bprogress\b",
        r"\bsmall steps?\b", r"\bmomentum\b", r"\bkeep going\b",
        r"\byou'?ve? (?:overcome|survived|handled|navigated)\b",
    ],
    "grounding": [
        r"\b5-4-3-2-1\b", r"\bgrounding\b", r"\bpresent moment\b",
        r"\bslow breath\b", r"\bbody scan\b", r"\bfeet on the (?:floor|ground)\b",
        r"\bnotice (?:what you|your|the)\b.*\b(?:see|hear|feel|touch|smell)\b",
        r"\binhale.*exhale\b", r"\bvagus nerve\b",
    ],
    "reflection": [
        r"\bwhat (?:do you|would|does|matters|comes)\b.*\?",
        r"\bhow (?:does|would|do you|long)\b.*\?",
        r"\bwhen (?:was|did|do you)\b.*\?",
        r"\bwhat if\b.*\?", r"\bcan you\b.*\?",
    ],
}

# Mood signals found in response text
MOOD_SIGNALS = {
    "anxious": [r"\banxiety\b", r"\banxious\b", r"\bworr(?:y|ied)\b", r"\bthreat\b", r"\bfear\b"],
    "sad": [r"\bsad(?:ness)?\b", r"\bgrief\b", r"\bloss\b", r"\bdepression\b", r"\bheavy\b"],
    "angry": [r"\banger\b", r"\bangry\b", r"\bfrustrat\b", r"\brage\b", r"\bboundary\b"],
    "confused": [r"\bconfus(?:ed|ion)\b", r"\buncertain\b", r"\btorn\b", r"\bclar(?:ity|ify)\b"],
    "lonely": [r"\blonely\b", r"\bisolat\b", r"\balone\b", r"\bconnection\b"],
    "overwhelmed": [r"\boverwhelm\b", r"\bcognitive (?:load|overload)\b", r"\btoo much\b"],
    "stressed": [r"\bstress\b", r"\bcortisol\b", r"\bHPA\b", r"\bpressure\b"],
    "happy": [r"\bjoy\b", r"\bhappy\b", r"\bpositive\b", r"\bcelebrat\b"],
    "hopeful": [r"\bhope(?:ful)?\b", r"\boptimis\b", r"\bforward\b", r"\bgrowth\b"],
}

# Topic signals
TOPIC_SIGNALS = {
    "family": [r"\bfamily\b", r"\bparent\b", r"\bmother\b", r"\bfather\b", r"\bchild\b"],
    "relationship": [r"\brelationship\b", r"\bpartner\b", r"\battachment\b", r"\blove\b"],
    "work": [r"\bwork\b", r"\bjob\b", r"\bcareer\b", r"\bboss\b", r"\boffice\b"],
    "academic": [r"\bexam\b", r"\bstudy\b", r"\bschool\b", r"\bcollege\b", r"\bgrade\b"],
    "health": [r"\bhealth\b", r"\bsick\b", r"\bhospital\b", r"\bsleep\b", r"\bbody\b"],
    "spiritual": [r"\bmeditat\b", r"\bspiritual\b", r"\bsoul\b", r"\bpurpose\b", r"\bmeaning\b"],
}

# Verse reference pattern
VERSE_REF_PATTERN = re.compile(r"\b(?:BG\s*)?(\d{1,2})\.(\d{1,3})\b")


class DistillationPipeline:
    """
    Extracts reusable wisdom atoms from LLM responses.

    Call distill() after every successful LLM response to grow the
    self-sufficiency corpus.
    """

    async def distill(
        self,
        db: AsyncSession,
        llm_response: str,
        user_message: str,
        detected_mood: str,
        detected_topic: str,
        detected_intent: str,
        detected_phase: str,
        source_message_id: Optional[str] = None,
    ) -> list[WisdomAtom]:
        """
        Extract and store wisdom atoms from an LLM response.

        Args:
            db: Database session
            llm_response: The full LLM-generated response text
            user_message: The user's original message (for context)
            detected_mood: Mood detected from user message
            detected_topic: Topic detected from user message
            detected_intent: Intent detected from user message
            detected_phase: Conversation phase
            source_message_id: KiaanChatMessage.id for traceability

        Returns:
            List of newly created WisdomAtom objects
        """
        # Step 1: Segment the response into functional parts
        segments = self._segment_response(llm_response)

        if not segments:
            logger.debug("[Distillation] No segments extracted from response")
            return []

        # Step 2: Classify and store each segment
        created_atoms: list[WisdomAtom] = []

        for segment_text, segment_category in segments:
            # Clean and validate the segment
            cleaned = self._clean_segment(segment_text)
            if not cleaned or len(cleaned.split()) < 5:
                continue  # Skip tiny fragments

            # Detect context tags
            mood_tags = self._detect_mood_tags(cleaned, detected_mood)
            topic_tags = self._detect_topic_tags(cleaned, detected_topic)
            phase_tags = self._detect_phase_tags(segment_category, detected_phase)
            verse_ref = self._extract_verse_ref(cleaned)
            psychology_frame = self._detect_psychology_frame(cleaned)

            # Deduplicate via content hash
            content_hash = hashlib.sha256(cleaned.encode("utf-8")).hexdigest()

            existing = await db.execute(
                select(WisdomAtom).where(WisdomAtom.content_hash == content_hash)
            )
            if existing.scalar_one_or_none():
                continue  # Skip duplicate

            # Create new atom
            atom = WisdomAtom(
                content=cleaned,
                content_hash=content_hash,
                category=segment_category,
                mood_tags=mood_tags,
                topic_tags=topic_tags,
                intent_tags=[detected_intent] if detected_intent else [],
                phase_tags=phase_tags,
                verse_ref=verse_ref,
                psychology_frame=psychology_frame,
                effectiveness_score=0.5,  # Neutral starting score
                source_llm_response_id=source_message_id,
                source_type="llm_distillation",
            )

            try:
                db.add(atom)
                await db.flush()
                created_atoms.append(atom)
            except IntegrityError:
                await db.rollback()
                continue

        if created_atoms:
            await db.commit()
            logger.info(
                f"[Distillation] Extracted {len(created_atoms)} atoms "
                f"from response (mood={detected_mood}, topic={detected_topic})"
            )

        return created_atoms

    # =========================================================================
    # SEGMENTATION
    # =========================================================================

    def _segment_response(self, response: str) -> list[tuple[str, str]]:
        """
        Segment a response into functional parts with category labels.

        Uses a combination of:
        1. Paragraph splitting (double newlines)
        2. Sentence-level classification
        3. Pattern matching for category assignment
        """
        segments: list[tuple[str, str]] = []

        # Split by paragraphs first
        paragraphs = re.split(r"\n\n+", response.strip())

        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph or len(paragraph) < 20:
                continue

            # Classify the paragraph
            category = self._classify_segment(paragraph)
            segments.append((paragraph, category))

        # If only one big paragraph, try sentence-level splitting
        if len(segments) <= 1 and response.strip():
            sentences = re.split(r"(?<=[.!?])\s+", response.strip())

            # Group consecutive sentences with same category
            if len(sentences) >= 3:
                segments = []
                current_group: list[str] = []
                current_category = ""

                for sentence in sentences:
                    category = self._classify_segment(sentence)
                    if category != current_category and current_group:
                        segments.append((" ".join(current_group), current_category))
                        current_group = []
                    current_category = category
                    current_group.append(sentence)

                if current_group:
                    segments.append((" ".join(current_group), current_category))

        return segments

    def _classify_segment(self, text: str) -> str:
        """Classify a text segment into a category based on pattern matching."""
        text_lower = text.lower()
        scores: dict[str, int] = {}

        for category, patterns in CATEGORY_SIGNALS.items():
            count = 0
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    count += 1
            if count > 0:
                scores[category] = count

        if not scores:
            # Default classification based on position heuristics
            if text.endswith("?"):
                return "reflection"
            return "reframe"  # Most general category

        return max(scores, key=scores.get)

    # =========================================================================
    # CONTEXT DETECTION
    # =========================================================================

    def _detect_mood_tags(self, text: str, primary_mood: str) -> list[str]:
        """Detect which moods this atom is relevant for."""
        tags = {primary_mood} if primary_mood and primary_mood != "neutral" else set()
        text_lower = text.lower()

        for mood, patterns in MOOD_SIGNALS.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    tags.add(mood)
                    break

        return list(tags)

    def _detect_topic_tags(self, text: str, primary_topic: str) -> list[str]:
        """Detect which topics this atom is relevant for."""
        tags = {primary_topic} if primary_topic and primary_topic != "general" else set()
        text_lower = text.lower()

        for topic, patterns in TOPIC_SIGNALS.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    tags.add(topic)
                    break

        return list(tags)

    def _detect_phase_tags(self, category: str, primary_phase: str) -> list[str]:
        """Determine which conversation phases this atom fits."""
        tags = {primary_phase}

        # Category → phase mapping (atoms can span multiple phases)
        category_phases = {
            "validation": {"connect", "listen"},
            "reframe": {"listen", "understand", "guide"},
            "action": {"guide", "empower"},
            "wisdom": {"guide", "empower"},
            "encouragement": {"guide", "empower"},
            "grounding": {"connect", "listen"},
            "reflection": {"listen", "understand"},
        }

        if category in category_phases:
            tags.update(category_phases[category])

        return list(tags)

    def _extract_verse_ref(self, text: str) -> Optional[str]:
        """Extract Gita verse reference from text (e.g., '2.47', 'BG 6.5')."""
        match = VERSE_REF_PATTERN.search(text)
        if match:
            chapter = int(match.group(1))
            verse = int(match.group(2))
            if 1 <= chapter <= 18 and 1 <= verse <= 78:
                return f"{chapter}.{verse}"
        return None

    def _detect_psychology_frame(self, text: str) -> Optional[str]:
        """Detect which psychology framework this atom references."""
        text_lower = text.lower()

        frames = {
            "cognitive_defusion": [r"\bdefusion\b", r"\bseparating.*thought\b"],
            "behavioral_activation": [r"\bbehavioral activation\b", r"\baction.*motivation\b"],
            "emotional_regulation": [r"\bemotional regulation\b", r"\baffect regulation\b"],
            "mindfulness": [r"\bpresent.moment\b", r"\bmindful\b"],
            "acceptance": [r"\bacceptance\b", r"\bACT\b", r"\bpsychological flexibility\b"],
            "cognitive_reappraisal": [r"\breapprais\b", r"\breframe\b", r"\bnew perspective\b"],
            "polyvagal": [r"\bvagus\b", r"\bpolyvagal\b", r"\bparasympathetic\b"],
            "attachment_theory": [r"\battachment\b.*\b(?:style|pattern|theory)\b"],
            "self_compassion": [r"\bself.compassion\b", r"\bself.kindness\b"],
            "neuroplasticity": [r"\bneuroplastic\b", r"\bneural pathway\b", r"\bbrain.*reorganiz\b"],
            "window_of_tolerance": [r"\bwindow of tolerance\b", r"\barousal\b.*\brange\b"],
            "distress_tolerance": [r"\bdistress tolerance\b", r"\bendure.*difficult\b"],
        }

        for frame, patterns in frames.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    return frame

        return None

    # =========================================================================
    # TEXT CLEANING
    # =========================================================================

    def _clean_segment(self, text: str) -> str:
        """Clean a segment for storage as an atom."""
        # Remove markdown formatting
        text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
        text = re.sub(r"\*(.+?)\*", r"\1", text)
        text = re.sub(r"^#+\s+", "", text, flags=re.MULTILINE)
        text = re.sub(r"^\d+\.\s+", "", text, flags=re.MULTILINE)
        text = re.sub(r"^[-•]\s+", "", text, flags=re.MULTILINE)

        # Normalize whitespace
        text = re.sub(r"\s+", " ", text).strip()

        return text


# Singleton
_pipeline: Optional[DistillationPipeline] = None


def get_distillation_pipeline() -> DistillationPipeline:
    """Get the singleton DistillationPipeline instance."""
    global _pipeline
    if _pipeline is None:
        _pipeline = DistillationPipeline()
    return _pipeline
