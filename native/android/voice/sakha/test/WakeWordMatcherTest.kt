/**
 * WakeWordMatcher unit tests — pure helper, no emulator needed.
 *
 * Pins the contract the always-on SpeechRecognizer loop in
 * SakhaWakeWordDetector (Step 24) depends on. Run with:
 *
 *   ./gradlew :sakha-voice-native:testDebugUnitTest
 */

package com.mindvibe.kiaan.voice.sakha.test

import com.mindvibe.kiaan.voice.sakha.WakeWordMatcher
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class WakeWordMatcherTest {

    private val phrases = listOf(
        "hey sakha",
        "namaste sakha",
        "ok sakha",
        "sakha",
        "हे सखा",
        "सखा",
    )

    // ------------------------------------------------------------------------
    // normalize()
    // ------------------------------------------------------------------------

    @Test
    fun `normalize lowercases ASCII`() {
        assertEquals("hey sakha", WakeWordMatcher.normalize("HEY Sakha"))
    }

    @Test
    fun `normalize strips ASCII punctuation`() {
        assertEquals("hey sakha", WakeWordMatcher.normalize("Hey, Sakha!"))
    }

    @Test
    fun `normalize strips Devanagari danda and double-danda`() {
        assertEquals("हे सखा", WakeWordMatcher.normalize("हे सखा।"))
        assertEquals("हे सखा", WakeWordMatcher.normalize("हे सखा॥"))
    }

    @Test
    fun `normalize collapses internal whitespace`() {
        assertEquals("hey sakha", WakeWordMatcher.normalize("  hey    sakha  "))
    }

    @Test
    fun `normalize is idempotent`() {
        val once = WakeWordMatcher.normalize("Hey, Sakha!  ")
        val twice = WakeWordMatcher.normalize(once)
        assertEquals(once, twice)
    }

    @Test
    fun `normalize on empty string returns empty`() {
        assertEquals("", WakeWordMatcher.normalize(""))
    }

    @Test
    fun `normalize on punctuation-only returns empty`() {
        assertEquals("", WakeWordMatcher.normalize("!!!,.?"))
    }

    // ------------------------------------------------------------------------
    // match() — happy paths
    // ------------------------------------------------------------------------

    @Test
    fun `match recognises bare phrase exactly`() {
        assertEquals("hey sakha", WakeWordMatcher.match("hey sakha", phrases))
    }

    @Test
    fun `match recognises phrase wrapped in punctuation`() {
        assertEquals("hey sakha", WakeWordMatcher.match("Hey, Sakha!", phrases))
    }

    @Test
    fun `match recognises phrase embedded in longer transcript`() {
        // The user said something casually ending in the wake phrase.
        assertEquals(
            "hey sakha",
            WakeWordMatcher.match("ok wait — hey Sakha, can you hear me?", phrases),
        )
    }

    @Test
    fun `match recognises Devanagari wake phrase`() {
        assertEquals("हे सखा", WakeWordMatcher.match("नमस्ते, हे सखा।", phrases))
    }

    @Test
    fun `match recognises bare Sakha word`() {
        assertEquals("sakha", WakeWordMatcher.match("Sakha?", phrases))
    }

    @Test
    fun `match recognises namaste sakha greeting`() {
        assertEquals("namaste sakha", WakeWordMatcher.match("Namaste, Sakha", phrases))
    }

    // ------------------------------------------------------------------------
    // match() — phrase ranking
    // ------------------------------------------------------------------------

    @Test
    fun `match prefers earlier phrase when multiple could fire`() {
        // "Hey Sakha" contains both "hey sakha" and "sakha". The list
        // ranks "hey sakha" first, so that's what we should get back —
        // important for telemetry quality (we know the user said the
        // multi-word form even though the single-word form would also
        // match).
        assertEquals("hey sakha", WakeWordMatcher.match("Hey Sakha", phrases))
    }

    // ------------------------------------------------------------------------
    // match() — word-boundary correctness (no false positives)
    // ------------------------------------------------------------------------

    @Test
    fun `match does NOT fire on Sakha embedded inside a larger token`() {
        // The space-padding trick keeps "sakha" from matching "Sasakhayan".
        // Without it, naive contains() would fire and the cooldown alone
        // would not save us.
        assertNull(WakeWordMatcher.match("Sasakhayanam is unrelated", phrases))
        assertNull(WakeWordMatcher.match("akshay sakhalin", phrases))
    }

    @Test
    fun `match does NOT fire when phrase tokens appear in wrong order`() {
        // "sakha hey" has both tokens but not as the contiguous phrase
        // "hey sakha". Should NOT match the multi-word phrase — though
        // the bare "sakha" phrase still fires.
        assertEquals("sakha", WakeWordMatcher.match("sakha, hey, what's up?", phrases))
    }

    @Test
    fun `match does NOT fire on unrelated text`() {
        assertNull(WakeWordMatcher.match("the weather is nice today", phrases))
        assertNull(WakeWordMatcher.match("मौसम अच्छा है", phrases))
    }

    // ------------------------------------------------------------------------
    // match() — degenerate inputs
    // ------------------------------------------------------------------------

    @Test
    fun `match returns null on empty transcript`() {
        assertNull(WakeWordMatcher.match("", phrases))
    }

    @Test
    fun `match returns null on whitespace-only transcript`() {
        assertNull(WakeWordMatcher.match("   \n  ", phrases))
    }

    @Test
    fun `match returns null on empty phrase list`() {
        assertNull(WakeWordMatcher.match("hey sakha", emptyList()))
    }

    @Test
    fun `match skips blank phrases without throwing`() {
        val withBlanks = listOf("", "   ", "hey sakha")
        assertEquals("hey sakha", WakeWordMatcher.match("Hey, Sakha!", withBlanks))
    }

    // ------------------------------------------------------------------------
    // match() — return value is normalized form (privacy + telemetry)
    // ------------------------------------------------------------------------

    @Test
    fun `match returns the phrase in normalized form, never the raw transcript`() {
        // Caller can log the return value safely — it never contains the
        // user's words around the phrase, only the phrase itself.
        val ret = WakeWordMatcher.match("Wait, please... HEY, SAKHA — listen!", phrases)
        assertNotNull(ret)
        assertEquals("hey sakha", ret)
    }
}
