/**
 * SakhaPersonaGuard unit tests.
 *
 * Defends the persona by catching the AI-tells listed in sakha.voice.openai.md.
 * The guard is the second line of defence — the model is the first — so we
 * test both inline rewriting and the harder retry signal.
 */

package com.mindvibe.kiaan.voice.sakha.test

import com.mindvibe.kiaan.voice.sakha.SakhaPersonaGuard
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SakhaPersonaGuardTest {

    @Test
    fun `clean prose passes through unchanged`() {
        val input = "Stay with me. One breath."
        val out = SakhaPersonaGuard.softenInline(input)
        assertEquals(input, out.text)
        assertFalse(out.triggered)
    }

    @Test
    fun `i understand is rewritten`() {
        val out = SakhaPersonaGuard.softenInline("I understand. That sounds painful.")
        assertTrue("triggered=${out.triggered}, text=${out.text}", out.triggered)
        assertFalse(out.text.contains("I understand"))
    }

    @Test
    fun `you've got this is excised`() {
        val out = SakhaPersonaGuard.softenInline("Trust your dharma. You've got this!")
        assertTrue(out.triggered)
        assertFalse(out.text.contains("You've got this"))
        assertTrue("kept the dharma sentence: ${out.text}", out.text.contains("Trust your dharma"))
    }

    @Test
    fun `just breathe is rewritten not removed`() {
        val out = SakhaPersonaGuard.softenInline("Just breathe.")
        assertTrue(out.triggered)
        assertFalse(out.text.contains("Just breathe"))
    }

    @Test
    fun `your feelings are valid is excised`() {
        val out = SakhaPersonaGuard.softenInline("Your feelings are valid.")
        assertTrue(out.triggered)
        assertFalse(out.text.lowercase().contains("feelings are valid"))
    }

    @Test
    fun `sending you love and light removed cleanly`() {
        val out = SakhaPersonaGuard.softenInline("Sending you love and light.")
        assertTrue(out.triggered)
        // After excision and whitespace collapse the period should still
        // sit flush against the previous token, never floating alone.
        val cleaned = out.text.trim()
        assertFalse("leftover floating punctuation: '$cleaned'", cleaned == ".")
    }

    @Test
    fun `idempotent on second pass`() {
        val once = SakhaPersonaGuard.softenInline("I understand. Have you tried meditation?")
        val twice = SakhaPersonaGuard.softenInline(once.text)
        assertEquals(once.text, twice.text)
    }

    // ------------------------------------------------------------------------
    // Severe tells → request a retry
    // ------------------------------------------------------------------------

    @Test
    fun `as an AI language model triggers retry`() {
        assertTrue(SakhaPersonaGuard.shouldRetry("As an AI language model, I cannot feel grief."))
    }

    @Test
    fun `i'm just an ai triggers retry`() {
        assertTrue(SakhaPersonaGuard.shouldRetry("I'm just an AI, but..."))
    }

    @Test
    fun `clean opening does not trigger retry`() {
        assertFalse(
            SakhaPersonaGuard.shouldRetry(
                "उद्धरेदात्मनात्मानम् — lift yourself by yourself, the Gita says."
            )
        )
    }

    // ------------------------------------------------------------------------
    // Multi-language safety: Devanagari content must not be touched
    // ------------------------------------------------------------------------

    @Test
    fun `devanagari verses are not modified`() {
        val verse = "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।"
        val out = SakhaPersonaGuard.softenInline(verse)
        assertEquals(verse, out.text)
        assertFalse(out.triggered)
    }

    @Test
    fun `mixed english tell with verse rewrites only the english`() {
        val input = "I understand. कर्मण्येवाधिकारस्ते — your work is yours."
        val out = SakhaPersonaGuard.softenInline(input)
        assertTrue(out.triggered)
        assertTrue(
            "verse must survive: ${out.text}",
            out.text.contains("कर्मण्येवाधिकारस्ते"),
        )
        assertFalse(out.text.contains("I understand"))
        assertNotEquals(input, out.text)
    }
}
