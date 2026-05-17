"""Per-sentence script + language detection for TTS routing.

Implements ``IMPROVEMENT_ROADMAP.md`` P1 §8 — Hindi-English
code-switching support. The LLM frequently emits Hinglish responses
(95 % of urban Indian users speak this way); routing every sentence
through the same ``lang_hint`` from the start of the turn picks one
voice and reads the wrong-script half in a mismatched accent.

This module is a pure-Python, dependency-free script detector. The
TTS pipeline calls :func:`pick_tts_lang` once per sentence to choose
which language profile (and therefore which TTS provider + voice ID)
synthesises that sentence.

Detection rules
---------------
Two Unicode signals are counted:

* **Devanagari** (Hindi / Sanskrit script) — code points U+0900–U+097F.
* **Latin alphabet** — ASCII letters [a-z A-Z].

Whitespace, digits, and punctuation are not counted in either bucket
(they appear in any language and don't help the decision).

Ratios:

* ``hi_ratio ≥ 0.80`` → ``"hi"``  (clean Hindi sentence)
* ``en_ratio ≥ 0.80`` → ``"en"``  (clean English sentence)
* Otherwise            → ``"mixed"`` (Hinglish — both scripts present)
* No scripted characters at all → ``"unknown"`` (empty, digits-only, etc.)

The 0.80 threshold tolerates the natural minority: an English sentence
that quotes a Sanskrit verse ("Krishna says धर्म comes first") is
still classified ``"en"``; a Hindi sentence with one English brand
name stays ``"hi"``. Sentences below either threshold are ``"mixed"``
and routed to Sarvam Hindi (which handles Devanagari + Latin script
seamlessly — ElevenLabs Aria does not).

:func:`pick_tts_lang` maps the script verdict to a TTS ``lang_hint``
the rest of the voice pipeline already understands:

  ``"hi"``    → ``"hi"``   (Sarvam Hindi voice)
  ``"en"``    → ``"en"``   (ElevenLabs English voice)
  ``"mixed"`` → ``"hi-en"`` (Sarvam Hindi voice — handles Hinglish)
  ``"unknown"`` → ``fallback`` (turn-level ``ctx.lang_hint``)

The TTS cache key already includes ``lang_hint`` + ``voice_id``
(``backend/services/voice/tts_router.py:AudioCache.build_key``), so
per-sentence routing is cache-coherent without any extra plumbing —
the same English sentence under an English-leading turn and a
Hindi-leading turn share the cache entry; a Hindi sentence within a
mixed turn is its own cache entry.
"""

from __future__ import annotations

from typing import Literal

ScriptLabel = Literal["hi", "en", "mixed", "unknown"]


# Devanagari block boundary, inclusive on both ends. Includes the
# extended block (vocalic R, Vedic accents, Sanskrit signs) we routinely
# see in Gita verses.
_DEVANAGARI_START = "ऀ"
_DEVANAGARI_END = "ॿ"

# Threshold below which a script no longer "owns" the sentence.
_MAJORITY_THRESHOLD = 0.80


def detect_script(text: str) -> ScriptLabel:
    """Classify the dominant script of a sentence.

    Pure function — same input always yields the same output, no
    network, no DB, no global state. Safe to call inside a streaming
    inner loop (~1 μs for typical sentence lengths).
    """
    if not text or not text.strip():
        return "unknown"

    hi_count = 0
    en_count = 0
    for ch in text:
        if _DEVANAGARI_START <= ch <= _DEVANAGARI_END:
            hi_count += 1
        elif "a" <= ch <= "z" or "A" <= ch <= "Z":
            en_count += 1

    total = hi_count + en_count
    if total == 0:
        return "unknown"

    hi_ratio = hi_count / total
    en_ratio = en_count / total

    if hi_ratio >= _MAJORITY_THRESHOLD:
        return "hi"
    if en_ratio >= _MAJORITY_THRESHOLD:
        return "en"
    return "mixed"


def pick_tts_lang(text: str, *, fallback: str = "en") -> str:
    """Pick the TTS ``lang_hint`` for a sentence.

    See module docstring for the mapping rationale. ``fallback`` is the
    turn-level hint to use when the sentence carries no scripted
    characters (digits-only, punctuation-only, empty).
    """
    label = detect_script(text)
    if label == "hi":
        return "hi"
    if label == "en":
        return "en"
    if label == "mixed":
        # Sarvam Hindi handles Devanagari + Latin text without the
        # accent break ElevenLabs would produce on the Hindi half.
        return "hi-en"
    return fallback


__all__ = ["ScriptLabel", "detect_script", "pick_tts_lang"]
