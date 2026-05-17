"""``backend.services.wisdom`` — unified Wisdom Core retrieval.

Single data path that both the chat / sacred-tool stack and the voice
companion stack consume. See ``retrieve.py`` for the long-form rationale.
"""

from backend.services.wisdom.retrieve import (
    WisdomBundle,
    WisdomVerse,
    detect_mood,
    retrieve_wisdom,
)

__all__ = [
    "WisdomBundle",
    "WisdomVerse",
    "detect_mood",
    "retrieve_wisdom",
]
