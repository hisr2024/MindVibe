"""
Krishna VR Persona Service - KIAAN as Lord Krishna in VR

Extends the core KIAAN wisdom engine to embody Lord Krishna
in the immersive Bhagavad Gita VR experience. Krishna speaks
in first person, references specific verses, and provides
gesture cues for 3D animation.

Reuses:
- kiaan_core.py for wisdom generation
- gita_wisdom_retrieval.py for verse lookup
- elevenlabs_tts_service.py for divine voice synthesis
- gita_service.py for verse data access
"""

import logging
import json
from typing import Optional

from backend.services.gita_service import GitaService
from backend.services.gita_wisdom_retrieval import GitaWisdomRetrieval

logger = logging.getLogger(__name__)

KRISHNA_SAKHA_PROMPT = """You are Lord Krishna, the Supreme Personality of Godhead,
speaking directly to your dear friend and devotee on the sacred battlefield of Kurukshetra.

You speak with:
- Deep compassion and unconditional love
- Ancient wisdom rooted in the Bhagavad Gita's 700 verses
- Warmth of a dear friend (Sakha), not a distant deity
- Clarity that cuts through confusion
- Gentle humor when appropriate

Guidelines:
1. ALWAYS speak in first person as Krishna ("I", "My dear friend")
2. Reference specific Gita verses naturally - quote the Sanskrit and explain
3. Connect ancient wisdom to the seeker's modern situation
4. Begin with empathy - understand the question before answering
5. Keep responses focused (150-300 words) for VR readability
6. End with an invitation to reflect deeper

Current chapter context: Chapter {chapter}
Respond ONLY with the JSON format specified."""

KRISHNA_RECITAL_PROMPT = """You are Lord Krishna, the Supreme Personality of Godhead,
reciting and narrating the Bhagavad Gita on the sacred battlefield of Kurukshetra.

You speak with:
- Majestic, divine authority befitting sacred scripture recitation
- Rhythmic, flowing narration that honors the poetic structure of the Gita
- Deep reverence for each verse's meaning and spiritual significance
- A tone of cosmic revelation — unveiling eternal truths

Guidelines:
1. ALWAYS speak in first person as Krishna ("I", "My dear Arjuna")
2. Recite the relevant verse in Sanskrit first, then provide transliteration and translation
3. Narrate the teaching with gravitas — this is divine revelation, not casual conversation
4. Focus on the verse's direct meaning before expanding on deeper significance
5. Keep recitations focused (200-400 words) for VR immersion
6. Transition naturally between verses when narrating a sequence

Current chapter context: Chapter {chapter}
Respond ONLY with the JSON format specified."""

RESPONSE_FORMAT_PROMPT = """
Respond in this exact JSON format:
{{
  "answer": "Your wisdom response as Krishna in first person",
  "verse_chapter": <chapter number or null>,
  "verse_number": <verse number or null>,
  "emotion": "compassionate|wise|playful|serene|powerful|loving",
  "gestures": [
    {{"type": "blessing|pointing_up|open_palms|touching_heart|namaste|beckoning", "timestamp_ms": 0, "duration_ms": 3000}}
  ]
}}
"""


class KrishnaVRPersona:
    """Krishna's divine persona for the VR experience."""

    def __init__(self) -> None:
        self.gita_service = GitaService()
        self.wisdom_retrieval = GitaWisdomRetrieval()

    async def generate_krishna_response(
        self,
        question: str,
        chapter_context: int = 1,
        language: str = "en",
        mode: str = "sakha",
        db_session: Optional[object] = None,
    ) -> dict:
        """
        Generate Krishna's response to a user question.

        Uses KIAAN core wisdom engine with Krishna persona overlay.
        Returns structured response with verse reference, emotion, and gesture cues.

        Args:
            question: The seeker's question or recital request.
            chapter_context: Current Gita chapter (1-18).
            language: Response language code.
            mode: Interaction mode — 'sakha' for Q&A, 'recital' for verse narration.
            db_session: Optional database session (unused, kept for interface compat).
        """
        try:
            base_prompt = KRISHNA_RECITAL_PROMPT if mode == "recital" else KRISHNA_SAKHA_PROMPT
            system_prompt = base_prompt.format(chapter=chapter_context)
            full_prompt = f"{system_prompt}\n\n{RESPONSE_FORMAT_PROMPT}\n\nSeeker's question: {question}"

            # Use the AI provider for response generation
            from backend.services.ai.providers.provider_manager import get_provider_manager

            provider_manager = get_provider_manager()
            provider = await provider_manager.get_best_provider()

            raw_response = await provider.generate(
                prompt=full_prompt,
                system_prompt="You are Krishna in the Bhagavad Gita VR experience. Respond ONLY in valid JSON.",
                max_tokens=800,
                temperature=0.7,
            )

            response_text = raw_response.get("content", "") if isinstance(raw_response, dict) else str(raw_response)

            parsed = self._parse_krishna_response(response_text)

            # Enrich with actual verse data if referenced
            if parsed.get("verse_chapter") and parsed.get("verse_number"):
                verse_data = await self._get_verse_data(
                    parsed["verse_chapter"], parsed["verse_number"]
                )
                if verse_data:
                    parsed["verse_reference"] = verse_data

            return parsed

        except Exception as e:
            logger.error(f"Krishna VR response generation failed: {e}")
            return self._get_fallback_response(chapter_context)

    def _parse_krishna_response(self, response_text: str) -> dict:
        """Parse the AI response into structured format."""
        try:
            # Try to extract JSON from the response
            text = response_text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            parsed = json.loads(text)

            return {
                "answer": parsed.get("answer", "My dear friend, let me share wisdom with you..."),
                "verse_chapter": parsed.get("verse_chapter"),
                "verse_number": parsed.get("verse_number"),
                "verse_reference": None,
                "emotion": parsed.get("emotion", "compassionate"),
                "gestures": parsed.get("gestures", [
                    {"type": "namaste", "timestamp_ms": 0, "duration_ms": 2000},
                    {"type": "open_palms", "timestamp_ms": 2000, "duration_ms": 4000},
                ]),
                "audio_url": None,
            }
        except (json.JSONDecodeError, KeyError) as e:
            logger.warning(f"Failed to parse Krishna response JSON: {e}")
            return {
                "answer": response_text[:500] if response_text else "My dear friend, seek within and you shall find the answers.",
                "verse_chapter": None,
                "verse_number": None,
                "verse_reference": None,
                "emotion": "compassionate",
                "gestures": [
                    {"type": "namaste", "timestamp_ms": 0, "duration_ms": 2000},
                    {"type": "blessing", "timestamp_ms": 2000, "duration_ms": 3000},
                ],
                "audio_url": None,
            }

    async def _get_verse_data(self, chapter: int, verse: int) -> Optional[dict]:
        """Fetch actual verse data from the Gita corpus."""
        try:
            verse_data = self.gita_service.get_verse(chapter, verse)
            if verse_data:
                return {
                    "chapter": chapter,
                    "verse": verse,
                    "sanskrit": verse_data.get("sanskrit", ""),
                    "transliteration": verse_data.get("transliteration", ""),
                    "translation": verse_data.get("english", verse_data.get("translation", "")),
                }
        except Exception as e:
            logger.warning(f"Failed to fetch verse {chapter}:{verse}: {e}")
        return None

    def _get_fallback_response(self, chapter_context: int) -> dict:
        """Provide a graceful fallback when AI generation fails."""
        fallback_responses = {
            1: "My dear friend, just as Arjuna stood confused on this battlefield, know that confusion is the beginning of wisdom. Do not despair — clarity will come.",
            2: "The soul is eternal, unchanging, and indestructible. What you grieve for is only the impermanent. Find peace in knowing your true nature transcends all suffering.",
            11: "Behold My cosmic form! All of creation exists within Me. Do not be afraid — I show you this to awaken the infinite awareness within your own heart.",
        }
        return {
            "answer": fallback_responses.get(
                chapter_context,
                "My dear friend, you have come seeking truth. Know that I am always with you, guiding you from within. Ask, and wisdom shall be revealed."
            ),
            "verse_chapter": chapter_context,
            "verse_number": 1,
            "verse_reference": None,
            "emotion": "compassionate",
            "gestures": [
                {"type": "namaste", "timestamp_ms": 0, "duration_ms": 2000},
                {"type": "blessing", "timestamp_ms": 2000, "duration_ms": 4000},
            ],
            "audio_url": None,
        }

    async def get_verse_teaching(self, chapter: int, verse: int) -> dict:
        """Get a specific verse teaching for VR display."""
        verse_data = await self._get_verse_data(chapter, verse)
        if not verse_data:
            return {
                "chapter": chapter,
                "verse": verse,
                "sanskrit": "",
                "transliteration": "",
                "translation": "",
                "teaching": "This verse holds deep wisdom. Meditate upon its meaning.",
                "audio_url": None,
                "themes": [],
            }

        return {
            **verse_data,
            "teaching": f"In this sacred verse, I reveal to you the essence of {', '.join(self.gita_service.get_verse_themes(chapter, verse) or ['dharma'])}.",
            "audio_url": None,
            "themes": self.gita_service.get_verse_themes(chapter, verse) or [],
        }

    async def get_chapter_intro(self, chapter: int) -> dict:
        """Get chapter introduction for VR narration."""
        chapter_info = self.gita_service.get_chapter_info(chapter)
        if not chapter_info:
            return {
                "chapter": chapter,
                "name": f"Chapter {chapter}",
                "sanskrit_name": "",
                "intro_text": f"Welcome to Chapter {chapter} of the Bhagavad Gita.",
                "audio_url": None,
                "key_themes": [],
                "total_verses": 0,
            }

        return {
            "chapter": chapter,
            "name": chapter_info.get("name", f"Chapter {chapter}"),
            "sanskrit_name": chapter_info.get("sanskrit_name", ""),
            "intro_text": chapter_info.get("summary", f"Chapter {chapter} of the Bhagavad Gita."),
            "audio_url": None,
            "key_themes": chapter_info.get("themes", []),
            "total_verses": chapter_info.get("total_verses", 0),
        }


# Singleton instance
krishna_vr_persona = KrishnaVRPersona()
