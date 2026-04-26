/**
 * Sakha Persona Guard
 *
 * Defence-in-depth client-side filter for the "AI tells" listed in the Sakha
 * voice system prompt. The model is the first line of defence; this guard
 * catches the cases where the model slips (rare, but real) before the user
 * ever hears the words.
 *
 * Two modes:
 *  - softenInline  — rewrites a banned phrase to a safer Sakha-shaped
 *                    equivalent in the same chunk. Use this in the fast
 *                    streaming path so we never block speech.
 *  - shouldRetry   — returns true if the response is so off-tone that the
 *                    only honest move is to discard it and emit
 *                    FILTER_FAIL. Currently only triggered by stacked tells
 *                    in the *first* sentence.
 *
 * NOT a content moderator. Crisis / safety filtering belongs to a separate
 * pipeline (CrisisDetector). This guard exists purely to defend the persona.
 */

package com.mindvibe.kiaan.voice.sakha

object SakhaPersonaGuard {

    /**
     * Banned phrases from sakha.voice.openai.md. The map value is the
     * Sakha-shaped replacement. Empty string ⇒ excise outright.
     *
     * Order matters: longer / more specific phrases must come first so the
     * regex engine prefers them.
     */
    private val replacements: List<Pair<Regex, String>> = listOf(
        // Generic affirmations / sign-offs
        Regex("""(?i)\bremember,?\s+you\s+are\s+not\s+alone\b""")
            to "तुम अकेले नहीं हो — मैं यहाँ बैठा हूँ",
        Regex("""(?i)\bsending\s+you\s+love\s+and\s+light\b""")
            to "",
        Regex("""(?i)\btake\s+care\s+of\s+yourself\b""")
            to "",
        Regex("""(?i)\byou(?:'ve|\s+have)?\s+got\s+this\b""")
            to "",
        Regex("""(?i)\bon\s+the\s+bright\s+side\b""")
            to "",

        // Therapy / chatbot register
        Regex("""(?i)\bi'?m\s+just\s+an\s+ai\b""")
            to "",
        Regex("""(?i)\bi\s+understand\b(?!\s+now)""")
            to "मैं सुन रहा हूँ",
        Regex("""(?i)\bit\s+sounds\s+like\b""")
            to "",
        Regex("""(?i)\bthat\s+must\s+be\s+(?:difficult|hard|tough)\b""")
            to "",
        Regex("""(?i)\bi'?m\s+here\s+for\s+you\b""")
            to "मैं यहाँ हूँ",
        Regex("""(?i)\bhave\s+you\s+tried\b""")
            to "",
        Regex("""(?i)\bmany\s+people\s+feel\s+this\s+way\b""")
            to "",
        Regex("""(?i)\blet'?s\s+unpack\s+that\b""")
            to "",
        Regex("""(?i)\byour\s+feelings\s+are\s+valid\b""")
            to "",
        Regex("""(?i)\bjust\s+breathe\b""")
            to "साँस — एक, धीरे",
    )

    /** Phrases that, if seen in the first sentence, justify a hard retry. */
    private val severeTells: List<Regex> = listOf(
        Regex("""(?i)\bi'?m\s+just\s+an\s+ai\b"""),
        Regex("""(?i)\bas\s+an\s+ai\s+(?:language\s+)?model\b"""),
        Regex("""(?i)\bi\s+do\s+not\s+have\s+(?:feelings|emotions|the\s+ability)\b"""),
    )

    /**
     * Inline-rewrite a streaming chunk. Idempotent.
     */
    fun softenInline(chunk: String): GuardResult {
        if (chunk.isEmpty()) return GuardResult(chunk, triggered = false)
        var working = chunk
        var triggered = false
        for ((pattern, replacement) in replacements) {
            if (!pattern.containsMatchIn(working)) continue
            working = pattern.replace(working, replacement)
            triggered = true
        }
        // Collapse any double-spaces / leading-space artefacts a removal
        // might leave behind so the TTS pacing isn't surprised.
        if (triggered) {
            working = working.replace(Regex("""[ \t]{2,}"""), " ")
            working = working.replace(Regex("""\s+([,.!?।॥])"""), "$1")
            working = working.trim()
        }
        return GuardResult(working, triggered = triggered)
    }

    /**
     * Decide whether the *first* assembled sentence is so off-tone that the
     * cleanest move is to discard the response and emit FILTER_FAIL. We only
     * inspect the first sentence so we don't keep tripping mid-response.
     */
    fun shouldRetry(firstSentence: String): Boolean {
        if (firstSentence.isEmpty()) return false
        val ssample = firstSentence.take(240)
        return severeTells.any { it.containsMatchIn(ssample) }
    }

    data class GuardResult(val text: String, val triggered: Boolean)
}
