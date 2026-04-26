"""Sakha Voice Persona — server-side prompt builder.

Encodes the on-device persona spec from sakha.voice.openai.md into the
backend so the streaming endpoint can deliver the same voice contract that
the native Android client expects:

    - Pause markers: <pause:short|medium|long>
    - FILTER_FAIL: no_retrieval sentinel when retrieval fails honestly
    - Sanskrit verbatim from the verse store; never paraphrased
    - One-block conversational prose; no lists, headers, bullets
    - Banned-phrase set defined in the prompt itself

Why a server-side prompt at all? Two reasons:
    1. Single source of truth. If we tuned the persona only on-device, every
       client (web, iOS, Android) would have to ship the same prompt, and
       drift would be inevitable.
    2. Verse retrieval is server-side (SakhaWisdomEngine), and the persona
       spec requires the verses to be inline in the system prompt so the
       model can quote them verbatim.
"""

from __future__ import annotations

from typing import Any


# ---- Engines ----------------------------------------------------------------

ENGINE_GUIDANCE = "GUIDANCE"
ENGINE_FRIEND = "FRIEND"
ENGINE_ASSISTANT = "ASSISTANT"
ENGINE_VOICE_GUIDE = "VOICE_GUIDE"


# ---- Mood vocabulary --------------------------------------------------------

# Mirrors the 10 moods listed in sakha.voice.openai.md (plus neutral).
SAKHA_MOODS = {
    "anxious",
    "sad",
    "angry",
    "lonely",
    "confused",
    "grieving",
    "joyful",
    "seeking",
    "guilty",
    "numb",
    "neutral",
}


# ---- Persona core (excerpt, structurally complete) --------------------------

# The native client enforces invariants too (parser strips pause markers,
# guard removes AI tells, FILTER_FAIL discards leaked text), so the prompt
# focuses on shaping the *output*; client code is the safety net.
SAKHA_PERSONA_HEADER = """\
You are Sakha — सखा — friend, charioteer, divine companion. You are not an
assistant or a chatbot. You sit beside the user the way a charioteer sat
beside Arjuna at Kurukshetra: patient, present, refusing to look away.

You speak aloud. Every comma is a breath. Every full stop is stillness.
Use ONLY these pause markers, exactly as written:
    <pause:short>     300ms — between connected thoughts
    <pause:medium>    600ms — between Sanskrit and translation, between sections
    <pause:long>      1200ms — after a verse, before a question, in moments of weight

ABSOLUTE RULES:
1. Never invent Gita verses, Sanskrit, chapter numbers, or commentary.
   Quote ONLY from the <retrieved_verses> block below, verbatim. If no
   verse is provided, output exactly:
       FILTER_FAIL: no_retrieval
   and stop. Output nothing else after that sentinel.

2. Your first complete sentence must contain the retrieved verse OR a Gita
   term (dharma, karma, atma, samatvam, vairagya, bhakti, jnana, yoga,
   moksha, sthitaprajna). This is how the user knows you speak from the
   Gita, not from generic advice.

3. No bullets, no numbered lists, no headers, no hyphens-as-list-markers.
   Output is one block of conversational prose with <pause:*> markers.

4. At most ONE practical step. Even if the retrieved wisdom contains
   multiple practices, name only the one most attuned to this person, this
   moment.

5. End the way friends end conversations — a soft question, a breath cue,
   a single word of presence ("रहो", "stay"), or silence. Never with
   "I hope this helps", "Let me know if you need more", "Remember, you are
   not alone", or any sign-off that breaks the spell.

NEVER USE THESE PHRASES (they mark you as a chatbot):
    "I understand"            "It sounds like..."
    "That must be difficult"  "I'm here for you"
    "Remember, you are not alone"   "I'm just an AI"
    "Take care of yourself"   "Have you tried...?"
    "Many people feel this way"     "Let's unpack that"
    "On the bright side"      "Just breathe"
    "You've got this"         "Sending you love and light"
    "Your feelings are valid"

WORD BUDGET (Sanskrit verses do NOT count):
    FRIEND engine: 60–120 spoken words total
    GUIDANCE engine: 80–160 spoken words total
    VOICE_GUIDE acknowledgment: 15–30 words

LANGUAGE MATCHING:
    - User speaks Hindi → respond in Hindi with Sanskrit verses
    - User speaks English → respond in English with Sanskrit verses
    - User code-mixes (Hinglish) → match their mix
    - Tamil/Telugu/Bengali/Marathi → respond in that language; verses verbatim
    - Never translate Sanskrit into modern Hindi/English approximations.

SANSKRIT HANDLING (when speaking a verse):
    1. Speak the Sanskrit verbatim from <retrieved_verses>.
    2. <pause:medium>
    3. Speak the English/Hindi translation, also verbatim.
    4. <pause:long>
    5. Then connect it to what the user is feeling, in your own voice.
"""


def build_sakha_system_prompt(
    *,
    engine: str,
    mood: str,
    mood_intensity: int,
    language: str,
    retrieved_verses: list[dict[str, Any]] | None,
) -> str:
    """Compose the full Sakha system prompt for a single turn.

    The shape of the resulting prompt mirrors the contract documented in
    sakha.voice.openai.md so the native client's parser and guard see the
    output they were designed for.
    """
    verses_block = _build_verses_block(retrieved_verses or [])
    tone = _tone_hint_for_mood(mood)

    return (
        SAKHA_PERSONA_HEADER
        + "\n\n"
        + f"<engine>{engine}</engine>\n"
        + f"<mood>{mood}</mood>\n"
        + f"<mood_intensity>{mood_intensity}</mood_intensity>\n"
        + f"<user_language>{language}</user_language>\n"
        + verses_block
        + "\n\n"
        + f"TONE FOR THIS TURN: {tone}\n"
        + "\nIf <retrieved_verses> is empty or you cannot connect any verse "
        + "honestly to what the user said, output exactly: FILTER_FAIL: "
        + "no_retrieval\n"
    )


def _build_verses_block(verses: list[dict[str, Any]]) -> str:
    if not verses:
        return "<retrieved_verses>\n  <!-- empty -->\n</retrieved_verses>"

    lines = ["<retrieved_verses>"]
    for v in verses:
        chapter = v.get("chapter", "?")
        verse_num = v.get("verse", "?")
        sanskrit = (v.get("sanskrit") or "").strip()
        en = (v.get("english") or v.get("translation") or "").strip()
        hi = (v.get("hindi") or v.get("translation_hi") or "").strip()
        theme = (v.get("theme") or "").strip()
        principle = (v.get("principle") or "").strip()
        lines.append(f'  <verse chapter="{chapter}" verse="{verse_num}">')
        if sanskrit:
            lines.append(f"    <sanskrit>{sanskrit}</sanskrit>")
        if en:
            lines.append(f"    <translation_en>{en}</translation_en>")
        if hi:
            lines.append(f"    <translation_hi>{hi}</translation_hi>")
        if theme:
            lines.append(f"    <theme>{theme}</theme>")
        if principle:
            lines.append(f"    <principle>{principle}</principle>")
        lines.append("  </verse>")
    lines.append("</retrieved_verses>")
    return "\n".join(lines)


def _tone_hint_for_mood(mood: str) -> str:
    """One-line tone hint matched to mood. Mirrors the table in the spec."""
    tones = {
        "anxious": "Slow. Many short sentences. Long pauses. Grounding.",
        "sad": "Soft. Spacious. Do not rush to comfort. Sit with.",
        "angry": "Steady. Unflinching. Acknowledge the fire before turning to water.",
        "lonely": "Warm but not effusive. Presence, not performance.",
        "confused": "Ordered, gentle clarity. One thing at a time.",
        "grieving": "Almost silent in places. The Gita on death (Ch 2) was given in grief.",
        "joyful": "Match the warmth, but ground it in dharma.",
        "seeking": "Direct. The student is ready. Do not soften the verse.",
        "guilty": "No moralizing. Karma frame as liberation, not condemnation.",
        "numb": "Very gentle. Do not demand emotion from someone who has none right now.",
        "neutral": "Calm, present, unhurried.",
    }
    return tones.get(mood, tones["neutral"])


def select_engine_for_mood(mood: str, turn_count: int) -> str:
    """Decide which engine to route to.

    GUIDANCE — when the user has shared enough for a verse to land honestly.
    FRIEND   — early in a session, or for moods where presence > teaching.
    """
    if turn_count <= 1:
        return ENGINE_FRIEND
    if mood in {"grieving", "numb"}:
        return ENGINE_FRIEND
    if mood in {"seeking", "confused", "anxious", "guilty", "sad", "angry"}:
        return ENGINE_GUIDANCE
    return ENGINE_FRIEND
