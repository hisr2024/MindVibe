/**
 * SakhaPauseParser unit tests.
 *
 * The parser is the most subtle piece of the voice pipeline — it must
 * tolerate every way a network can split a UTF-8 stream while never speaking
 * pause markers aloud and never leaking text after FILTER_FAIL.
 *
 * Run with the standard android-library test target:
 *   ./gradlew :sakha-voice:testDebugUnitTest
 */

package com.mindvibe.kiaan.voice.sakha.test

import com.mindvibe.kiaan.voice.sakha.PauseEvent
import com.mindvibe.kiaan.voice.sakha.SakhaPauseParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SakhaPauseParserTest {

    // ------------------------------------------------------------------------
    // Marker handling
    // ------------------------------------------------------------------------

    @Test
    fun `recognises all three pause durations`() {
        val parser = SakhaPauseParser()
        val events = parser.feed("first.<pause:short>second.<pause:medium>third.<pause:long>")
        val pauses = events.filterIsInstance<PauseEvent.Pause>().map { it.durationMs }
        assertEquals(listOf(300L, 600L, 1200L), pauses)
    }

    @Test
    fun `pause marker is excised from the spoken segment`() {
        val parser = SakhaPauseParser()
        val events = parser.feed("Stay with me.<pause:short>One breath.")
        val speakables = events.filterIsInstance<PauseEvent.Speak>().map { it.text }
        assertTrue("no marker leaks: $speakables", speakables.none { it.contains("<pause") })
        assertEquals("Stay with me.", speakables[0])
    }

    // ------------------------------------------------------------------------
    // Streaming partial chunks
    // ------------------------------------------------------------------------

    @Test
    fun `marker split across chunk boundary is buffered until complete`() {
        val parser = SakhaPauseParser()
        val first = parser.feed("first.<pau")
        val firstSpoken = first.filterIsInstance<PauseEvent.Speak>().joinToString("|") { it.text }
        assertEquals("first.", firstSpoken)
        assertTrue("no pause yet", first.filterIsInstance<PauseEvent.Pause>().isEmpty())

        val second = parser.feed("se:short>second.")
        val pauses = second.filterIsInstance<PauseEvent.Pause>()
        assertEquals(1, pauses.size)
        assertEquals(300L, pauses[0].durationMs)
        assertTrue(
            "marker leaked into spoken text",
            second.filterIsInstance<PauseEvent.Speak>().none { it.text.contains("<pau") },
        )
    }

    @Test
    fun `unknown angle-tag is treated as literal text`() {
        val parser = SakhaPauseParser()
        val events = parser.feed("hello <not-a-pause> there.")
        val text = events.filterIsInstance<PauseEvent.Speak>().joinToString(" ") { it.text }
        assertTrue("got: $text", text.contains("hello") && text.contains("there"))
    }

    // ------------------------------------------------------------------------
    // Sanskrit detection
    // ------------------------------------------------------------------------

    @Test
    fun `devanagari segments are flagged as Sanskrit`() {
        val parser = SakhaPauseParser()
        val events = parser.feed("कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।<pause:medium>")
        val speakables = events.filterIsInstance<PauseEvent.Speak>()
        assertTrue("expected sanskrit speakable, got: $speakables", speakables.any { it.isSanskrit })
    }

    @Test
    fun `english segments are not flagged as Sanskrit`() {
        val parser = SakhaPauseParser()
        val events = parser.feed("You have a right to action.<pause:short>")
        val speakables = events.filterIsInstance<PauseEvent.Speak>()
        assertTrue(speakables.all { !it.isSanskrit })
    }

    // ------------------------------------------------------------------------
    // FILTER_FAIL
    // ------------------------------------------------------------------------

    @Test
    fun `FILTER_FAIL aborts speakable output`() {
        val parser = SakhaPauseParser()
        val events = parser.feed("FILTER_FAIL: no_retrieval")
        assertEquals(1, events.size)
        assertTrue(events[0] is PauseEvent.Filter)
    }

    @Test
    fun `FILTER_FAIL discards prior leaked tokens`() {
        val parser = SakhaPauseParser()
        // Server fall-through can race — the model might emit a half-sentence
        // before deciding to FILTER_FAIL. We must NOT speak that fragment.
        val events = parser.feed("I understand. FILTER_FAIL: no_retrieval")
        assertEquals(1, events.size)
        assertTrue(events[0] is PauseEvent.Filter)
    }

    @Test
    fun `subsequent feeds after FILTER_FAIL are ignored`() {
        val parser = SakhaPauseParser()
        parser.feed("FILTER_FAIL: no_retrieval")
        val later = parser.feed("Stay with me.")
        assertTrue(later.isEmpty())
    }

    // ------------------------------------------------------------------------
    // Sentence boundary flushing
    // ------------------------------------------------------------------------

    @Test
    fun `mid-sentence chunk does not flush until punctuation arrives`() {
        val parser = SakhaPauseParser()
        val first = parser.feed("Stay with ")
        assertTrue(
            "no flush yet, got: ${first.filterIsInstance<PauseEvent.Speak>()}",
            first.filterIsInstance<PauseEvent.Speak>().isEmpty(),
        )
        val second = parser.feed("me.")
        val sp = second.filterIsInstance<PauseEvent.Speak>()
        assertEquals(1, sp.size)
        assertEquals("Stay with me.", sp[0].text)
    }

    @Test
    fun `finish flushes any buffered prose`() {
        val parser = SakhaPauseParser()
        parser.feed("Tail without punctuation")
        val tail = parser.finish()
        val sp = tail.filterIsInstance<PauseEvent.Speak>()
        assertEquals(1, sp.size)
        assertEquals("Tail without punctuation", sp[0].text)
    }

    @Test
    fun `Devanagari danda is treated as sentence end`() {
        val parser = SakhaPauseParser()
        val events = parser.feed("उद्धरेदात्मनात्मानम्।")
        val sp = events.filterIsInstance<PauseEvent.Speak>()
        assertEquals(1, sp.size)
        assertTrue(sp[0].isSanskrit)
    }
}
