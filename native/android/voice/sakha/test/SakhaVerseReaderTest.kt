/**
 * SakhaVerseReader unit tests — pure planner, no emulator needed.
 *
 * Run with:
 *   ./gradlew :sakha-voice-native:testDebugUnitTest
 */

package com.mindvibe.kiaan.voice.sakha.test

import com.mindvibe.kiaan.voice.sakha.PauseEvent
import com.mindvibe.kiaan.voice.sakha.SakhaLanguage
import com.mindvibe.kiaan.voice.sakha.SakhaVerseReader
import com.mindvibe.kiaan.voice.sakha.VerseRecitation
import com.mindvibe.kiaan.voice.sakha.VerseSegment
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

class SakhaVerseReaderTest {

    // BG 2.47 — the verse the persona leans on most. Used as the canonical
    // multi-language fixture across the tests that need real text.
    private val bg247 = VerseRecitation(
        chapter = 2,
        verse = 47,
        segments = listOf(
            VerseSegment(SakhaLanguage.SANSKRIT, "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन"),
            VerseSegment(SakhaLanguage.HINDI, "तुम्हारा अधिकार केवल कर्म पर है"),
            VerseSegment(SakhaLanguage.ENGLISH, "You have a right to the action alone"),
        ),
    )

    // ------------------------------------------------------------------------
    // Recitation plan: order + alternation
    // ------------------------------------------------------------------------

    @Test
    fun `SA HI EN recitation produces five events alternating Speak Pause`() {
        val plan = SakhaVerseReader.plan(bg247)
        assertEquals("3 segments → 5 events (3 Speak + 2 Pause)", 5, plan.size)
        assertTrue("event 0 Speak", plan[0] is PauseEvent.Speak)
        assertTrue("event 1 Pause", plan[1] is PauseEvent.Pause)
        assertTrue("event 2 Speak", plan[2] is PauseEvent.Speak)
        assertTrue("event 3 Pause", plan[3] is PauseEvent.Pause)
        assertTrue("event 4 Speak", plan[4] is PauseEvent.Speak)
    }

    @Test
    fun `plan never ends with a Pause`() {
        val plan = SakhaVerseReader.plan(bg247)
        assertTrue("last event is Speak", plan.last() is PauseEvent.Speak)
    }

    @Test
    fun `segment order is preserved`() {
        val plan = SakhaVerseReader.plan(bg247)
        val texts = plan.filterIsInstance<PauseEvent.Speak>().map { it.text }
        assertEquals(
            listOf(
                "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
                "तुम्हारा अधिकार केवल कर्म पर है",
                "You have a right to the action alone",
            ),
            texts,
        )
    }

    // ------------------------------------------------------------------------
    // Sanskrit voice routing
    // ------------------------------------------------------------------------

    @Test
    fun `Sanskrit segments mark isSanskrit true so player routes to reverent voice`() {
        val plan = SakhaVerseReader.plan(bg247)
        val speaks = plan.filterIsInstance<PauseEvent.Speak>()
        assertTrue("SA segment isSanskrit", speaks[0].isSanskrit)
        assertTrue("HI segment !isSanskrit", !speaks[1].isSanskrit)
        assertTrue("EN segment !isSanskrit", !speaks[2].isSanskrit)
    }

    @Test
    fun `non-Sanskrit Devanagari language (Hindi) does not get isSanskrit`() {
        // The reader keys off SakhaLanguage.SANSKRIT exactly, NOT off
        // Devanagari script presence — Hindi is also Devanagari but
        // belongs to the persona body voice (sakhaVoiceId), not the
        // reverent Sanskrit voice (sanskritVoiceId).
        val rec = VerseRecitation(
            chapter = 2,
            verse = 47,
            segments = listOf(
                VerseSegment(SakhaLanguage.HINDI, "तुम्हारा अधिकार केवल कर्म पर है"),
            ),
        )
        val plan = SakhaVerseReader.plan(rec)
        val speak = plan.single() as PauseEvent.Speak
        assertTrue("Hindi !isSanskrit", !speak.isSanskrit)
    }

    // ------------------------------------------------------------------------
    // Pause configuration
    // ------------------------------------------------------------------------

    @Test
    fun `single-segment recitation has no pause`() {
        val rec = VerseRecitation(
            chapter = 2,
            verse = 47,
            segments = listOf(
                VerseSegment(SakhaLanguage.SANSKRIT, "कर्मण्येवाधिकारस्ते"),
            ),
        )
        val plan = SakhaVerseReader.plan(rec)
        assertEquals(1, plan.size)
        assertTrue(plan[0] is PauseEvent.Speak)
    }

    @Test
    fun `two-segment recitation has exactly one inter-segment pause`() {
        val rec = VerseRecitation(
            chapter = 2,
            verse = 47,
            segments = listOf(
                VerseSegment(SakhaLanguage.SANSKRIT, "sa"),
                VerseSegment(SakhaLanguage.ENGLISH, "en"),
            ),
        )
        val plan = SakhaVerseReader.plan(rec)
        assertEquals(3, plan.size)
        assertEquals(1, plan.filterIsInstance<PauseEvent.Pause>().size)
    }

    @Test
    fun `default inter-segment pause is 700ms`() {
        val plan = SakhaVerseReader.plan(bg247)
        val pauses = plan.filterIsInstance<PauseEvent.Pause>().map { it.durationMs }
        assertEquals(listOf(700L, 700L), pauses)
    }

    @Test
    fun `custom inter-segment pause is honoured`() {
        val rec = bg247.copy(betweenSegmentsPauseMs = 1200L)
        val plan = SakhaVerseReader.plan(rec)
        val pauses = plan.filterIsInstance<PauseEvent.Pause>().map { it.durationMs }
        assertEquals(listOf(1200L, 1200L), pauses)
    }

    @Test
    fun `zero inter-segment pause emits no Pause events`() {
        val rec = bg247.copy(betweenSegmentsPauseMs = 0L)
        val plan = SakhaVerseReader.plan(rec)
        assertEquals("3 Speak, no Pause", 3, plan.size)
        assertTrue("no Pause events", plan.none { it is PauseEvent.Pause })
    }

    // ------------------------------------------------------------------------
    // VerseRecitation construction validation
    // ------------------------------------------------------------------------

    @Test
    fun `chapter 0 is rejected`() {
        try {
            VerseRecitation(
                chapter = 0, verse = 1,
                segments = listOf(VerseSegment(SakhaLanguage.ENGLISH, "x")),
            )
            fail("expected IllegalArgumentException for chapter 0")
        } catch (e: IllegalArgumentException) {
            assertTrue("message mentions chapter", e.message!!.contains("chapter"))
        }
    }

    @Test
    fun `chapter 19 is rejected (Gita has 18)`() {
        try {
            VerseRecitation(
                chapter = 19, verse = 1,
                segments = listOf(VerseSegment(SakhaLanguage.ENGLISH, "x")),
            )
            fail("expected IllegalArgumentException for chapter 19")
        } catch (e: IllegalArgumentException) {
            assertTrue("message mentions chapter", e.message!!.contains("chapter"))
        }
    }

    @Test
    fun `verse 79 is rejected (no chapter has more than 78 verses)`() {
        try {
            VerseRecitation(
                chapter = 2, verse = 79,
                segments = listOf(VerseSegment(SakhaLanguage.ENGLISH, "x")),
            )
            fail("expected IllegalArgumentException for verse 79")
        } catch (e: IllegalArgumentException) {
            assertTrue("message mentions verse", e.message!!.contains("verse"))
        }
    }

    @Test
    fun `empty segments list is rejected`() {
        try {
            VerseRecitation(
                chapter = 2, verse = 47,
                segments = emptyList(),
            )
            fail("expected IllegalArgumentException for empty segments")
        } catch (e: IllegalArgumentException) {
            assertTrue("message mentions segment", e.message!!.contains("segment"))
        }
    }

    @Test
    fun `negative inter-segment pause is rejected`() {
        try {
            VerseRecitation(
                chapter = 2, verse = 47,
                segments = listOf(VerseSegment(SakhaLanguage.ENGLISH, "x")),
                betweenSegmentsPauseMs = -1L,
            )
            fail("expected IllegalArgumentException for negative pause")
        } catch (e: IllegalArgumentException) {
            assertTrue("message mentions pause", e.message!!.contains("Pause"))
        }
    }

    @Test
    fun `citation property formats as BG chapter dot verse`() {
        assertEquals("BG 2.47", bg247.citation)
        val rec = VerseRecitation(
            chapter = 18, verse = 66,
            segments = listOf(VerseSegment(SakhaLanguage.ENGLISH, "x")),
        )
        assertEquals("BG 18.66", rec.citation)
    }
}
