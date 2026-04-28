/**
 * WakeWordMatcher — pure phrase-matching helper for Sakha wake-word.
 *
 * Used by SakhaWakeWordDetector (Step 24) to decide whether a transcript
 * snippet from the always-on SpeechRecognizer loop contains one of the
 * configured wake phrases. Kept as a pure object with no Android
 * dependencies so it's JVM-unit-testable (Step 23).
 *
 * Match contract:
 *   - case-insensitive (Latin script — Devanagari has no case so this
 *     is a no-op for "हे सखा")
 *   - punctuation-tolerant: "Hey, Sakha!" matches "hey sakha", "हे सखा।"
 *     matches "हे सखा" (the Devanagari dandas U+0964 / U+0965 are
 *     treated as punctuation alongside ASCII !?.,;:—–•…)
 *   - whitespace-tolerant: "  HEY    sakha  " matches "hey sakha"
 *   - word-boundary aware: "sakha" matches "Hey, Sakha!" but NOT
 *     "Sasakhayan" — implemented by padding with spaces on both sides
 *     of the normalized haystack and the normalized phrase, so a
 *     successful contains() match implies the phrase begins and ends
 *     at a token boundary
 *
 * Returns the matched phrase (in normalized form) so the caller can
 * log it for telemetry without leaking the raw transcript. Returns
 * null when no phrase matches.
 *
 * Complexity: O(P × N) where P is the number of phrases and N is the
 * transcript length. Both are small in practice (≤ 6 phrases, ≤ 200
 * chars of transcript) so this comfortably fits the < 5ms scan budget
 * the always-on detector loop allows per partial result.
 */

package com.mindvibe.kiaan.voice.sakha

object WakeWordMatcher {

    // ASCII punctuation + the Devanagari danda (U+0964) and double-danda
    // (U+0965), plus a few common Unicode dashes / bullets that
    // SpeechRecognizer occasionally injects.
    private val PUNCTUATION_RE = Regex("[\\p{Punct}—–•…।॥]+")
    private val WHITESPACE_RE = Regex("\\s+")

    /**
     * Lowercase + strip punctuation + collapse whitespace. Idempotent —
     * normalize(normalize(x)) == normalize(x).
     */
    fun normalize(text: String): String {
        if (text.isEmpty()) return ""
        val lowered = text.lowercase()
        val unpunct = PUNCTUATION_RE.replace(lowered, " ")
        val collapsed = WHITESPACE_RE.replace(unpunct, " ")
        return collapsed.trim()
    }

    /**
     * Return the first phrase from [phrases] (in normalized form) that
     * appears as a complete word-aligned phrase in [transcript].
     * Returns null if none match.
     *
     * Phrases are tested in the order given, so the caller can rank
     * preferred phrases (e.g. multi-word "hey sakha" before single-word
     * "sakha") to disambiguate when both could match.
     */
    fun match(transcript: String, phrases: List<String>): String? {
        if (transcript.isBlank() || phrases.isEmpty()) return null
        // Pad both sides so contains() implies a word-boundary match.
        val haystack = " " + normalize(transcript) + " "
        for (phrase in phrases) {
            val needle = normalize(phrase)
            if (needle.isEmpty()) continue
            val padded = " $needle "
            if (haystack.contains(padded)) return needle
        }
        return null
    }
}
