/**
 * Sakha Pause Parser
 *
 * Streaming parser for the Sakha persona's text protocol. Sakha emits prose
 * with three pause markers — <pause:short>, <pause:medium>, <pause:long> —
 * and an inline FILTER_FAIL sentinel when the Wisdom Core cannot retrieve a
 * verse honestly tied to what the user said.
 *
 * Design constraints:
 * - Must accept partial chunks. The SSE stream may split a marker across
 *   frames (e.g. "<pau" + "se:short>"). The parser buffers an incomplete
 *   tail and re-tries on the next chunk.
 * - Must emit speakable segments greedily so the TTS player can start
 *   speaking as soon as the first natural break (sentence end, comma, or
 *   pause marker) arrives. This is the latency win over "wait for full
 *   response then synthesize."
 * - Must distinguish Sanskrit segments (Devanagari script) from prose so
 *   the player can route them to a slower, reverent voice.
 *
 * Output:
 * - [PauseEvent.Speak]    — text ready to be sent to TTS
 * - [PauseEvent.Pause]    — honour a quiet beat
 * - [PauseEvent.Filter]   — FILTER_FAIL detected; abort speakable output
 *
 * The parser is deliberately stateful and single-threaded. Wrap calls in a
 * mutex if you share an instance across threads.
 */

package com.mindvibe.kiaan.voice.sakha

sealed class PauseEvent {
    data class Speak(val text: String, val isSanskrit: Boolean) : PauseEvent()
    data class Pause(val durationMs: Long) : PauseEvent()
    object Filter : PauseEvent()
}

class SakhaPauseParser {

    companion object {
        private const val PAUSE_SHORT_MS = 300L
        private const val PAUSE_MEDIUM_MS = 600L
        private const val PAUSE_LONG_MS = 1200L

        // Conservative Devanagari Unicode range. Covers Sanskrit + Hindi
        // verses; we treat any segment that contains Devanagari as Sanskrit
        // for TTS routing purposes (Sarvam handles Hindi via the same voice
        // family but with prose prosody, which is fine).
        private val DEVANAGARI_REGEX = Regex("""[ऀ-ॿ]""")

        // The longest token a partial chunk could *not* yet form. We use
        // this to decide when to flush vs keep buffering.
        private const val LONGEST_PARTIAL_MARKER = "<pause:medium>".length

        // Natural sentence-end characters across English + Indian scripts.
        // We add Devanagari danda (।) and double-danda (॥) for Sanskrit
        // verse halves.
        private const val SENTENCE_ENDS = ".!?।॥"

        // FILTER_FAIL sentinel — must match the persona spec exactly.
        private const val FILTER_FAIL_TOKEN = "FILTER_FAIL: no_retrieval"
    }

    private val buffer = StringBuilder()
    private var filterFailEmitted = false

    /**
     * Feed a streaming text chunk. Returns the events that can be safely
     * emitted right now; any incomplete tail stays buffered.
     */
    fun feed(chunk: String): List<PauseEvent> {
        if (filterFailEmitted) return emptyList()
        if (chunk.isEmpty()) return emptyList()
        buffer.append(chunk)
        return drain(force = false)
    }

    /**
     * Signal end-of-stream. Flushes any buffered prose as a final Speak event
     * (without waiting for a sentence boundary).
     */
    fun finish(): List<PauseEvent> {
        if (filterFailEmitted) return emptyList()
        return drain(force = true)
    }

    /** Reset for the next turn. */
    fun reset() {
        buffer.setLength(0)
        filterFailEmitted = false
    }

    // ------------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------------

    private fun drain(force: Boolean): List<PauseEvent> {
        val events = mutableListOf<PauseEvent>()

        // Detect FILTER_FAIL anywhere in the buffer — this is a hard stop.
        val ffIdx = buffer.indexOf(FILTER_FAIL_TOKEN)
        if (ffIdx >= 0) {
            // Drop anything before and after; the persona spec says the
            // server falls back to a template tier on this signal, so we
            // do NOT speak whatever leaked before the sentinel.
            buffer.setLength(0)
            filterFailEmitted = true
            events.add(PauseEvent.Filter)
            return events
        }

        while (true) {
            // Look for the next pause marker.
            val markerStart = buffer.indexOf('<')

            if (markerStart < 0) {
                // No marker in sight. Flush a speakable slice if we can.
                val flushed = flushSpeakable(force) ?: break
                events.add(flushed)
                continue
            }

            // There's a '<' somewhere. Try to parse a marker starting there.
            val parsed = parsePauseMarker(markerStart)
            if (parsed == null) {
                // No valid pause marker at this position. Two cases:
                //
                // 1) The `<` could be the start of an *incomplete* marker
                //    that the next chunk will complete (e.g. "<pau"). We
                //    detect this by: not forcing AND no `>` yet AND the
                //    tail is short enough to plausibly become a marker.
                //    In that case, flush prose before the `<` and keep the
                //    tail buffered for the next feed.
                //
                // 2) Otherwise the `<` is part of a different (unknown)
                //    tag, e.g. "<not-a-pause>". The model is only supposed
                //    to emit pause markers, so any other tag is dropped
                //    cleanly: we keep the prose around it and skip past
                //    the `>`. We do NOT speak "<", "not-a-pause", or ">"
                //    as literal text — that would mangle TTS prosody.
                val closeIdx = buffer.indexOf('>', markerStart)
                if (!force && closeIdx < 0 && (buffer.length - markerStart) <= LONGEST_PARTIAL_MARKER) {
                    if (markerStart > 0) {
                        val pre = buffer.substring(0, markerStart)
                        buffer.delete(0, markerStart)
                        emitSpeakable(events, pre)
                    }
                    break
                }

                // Drop the unknown tag inline; preserve surrounding prose.
                if (closeIdx < 0) {
                    // Forced flush with no closer ever arrived — treat the
                    // `<` and trailing junk as literal text rather than
                    // dropping it silently.
                    val pre = buffer.toString()
                    buffer.setLength(0)
                    emitSpeakable(events, pre)
                    break
                }
                // Splice prose around the unknown tag together.
                val before = buffer.substring(0, markerStart)
                val after = buffer.substring(closeIdx + 1)
                buffer.setLength(0)
                buffer.append(before)
                buffer.append(after)
                continue
            }

            val (durationMs, markerEnd) = parsed
            // Flush prose before the marker first…
            if (markerStart > 0) {
                val pre = buffer.substring(0, markerStart)
                buffer.delete(0, markerStart)
                emitSpeakable(events, pre)
                // After the delete, the marker now sits at index 0.
                val newEnd = markerEnd - markerStart
                buffer.delete(0, newEnd)
            } else {
                buffer.delete(0, markerEnd)
            }
            events.add(PauseEvent.Pause(durationMs))
        }

        return events
    }

    /**
     * Try to parse a pause marker starting at [start]. Returns
     * (durationMs, indexAfterMarker) on success, null if the marker is
     * incomplete or malformed.
     */
    private fun parsePauseMarker(start: Int): Pair<Long, Int>? {
        val close = buffer.indexOf('>', start)
        if (close < 0) return null
        val token = buffer.substring(start, close + 1)
        val durationMs = when (token.lowercase()) {
            "<pause:short>" -> PAUSE_SHORT_MS
            "<pause:medium>" -> PAUSE_MEDIUM_MS
            "<pause:long>" -> PAUSE_LONG_MS
            else -> return null  // Some other tag — treat as literal in caller.
        }
        return durationMs to (close + 1)
    }

    /**
     * Try to flush a speakable slice from the head of the buffer.
     *
     * Strategy:
     *  - If [force]: flush whatever is buffered as one final segment.
     *  - Otherwise: only flush up to the last sentence-ending punctuation,
     *    because Sarvam pacing is dramatically better with whole sentences
     *    than with mid-sentence fragments.
     */
    private fun flushSpeakable(force: Boolean): PauseEvent.Speak? {
        if (buffer.isEmpty()) return null

        val sliceEnd: Int = if (force) {
            buffer.length
        } else {
            findLastSentenceBoundary() ?: return null
        }

        val raw = buffer.substring(0, sliceEnd)
        buffer.delete(0, sliceEnd)
        val cleaned = raw.trim()
        if (cleaned.isEmpty()) return null
        return PauseEvent.Speak(cleaned, containsDevanagari(cleaned))
    }

    private fun findLastSentenceBoundary(): Int? {
        var lastBoundary = -1
        for (i in buffer.indices) {
            if (SENTENCE_ENDS.indexOf(buffer[i]) >= 0) {
                lastBoundary = i
            }
        }
        return if (lastBoundary >= 0) lastBoundary + 1 else null
    }

    private fun emitSpeakable(events: MutableList<PauseEvent>, raw: String) {
        val cleaned = raw.trim()
        if (cleaned.isEmpty()) return
        events.add(PauseEvent.Speak(cleaned, containsDevanagari(cleaned)))
    }

    private fun containsDevanagari(text: String): Boolean {
        return DEVANAGARI_REGEX.containsMatchIn(text)
    }
}
