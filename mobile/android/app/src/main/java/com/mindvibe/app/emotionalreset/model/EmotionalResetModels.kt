package com.mindvibe.app.emotionalreset.model

import androidx.compose.ui.graphics.Color

/**
 * Domain models for the Emotional Reset experience — a 1:1 adaptation of
 * kiaanverse.com/m/emotional-reset. The flow mirrors the web exactly:
 *
 *   Arrival → Mandala → Witness → Breath → Integration → Ceremony
 *
 * Each feeling carries its sanskrit name, a glow color for the mandala petal,
 * and ring placement (primary 8-petal ring vs nuanced 4-petal inner ring).
 */

enum class EmotionalResetPhase {
    Arrival,
    Mandala,
    Witness,
    Breath,
    Integration,
    Ceremony,
}

/**
 * The 12 sacred emotional states. IDs match the web types so analytics and
 * API payloads are identical across platforms.
 */
enum class FeelingState(
    val id: String,
    val label: String,
    val sanskrit: String,
    val color: Color,
    val glowColor: Color,
    val angleDeg: Float,
    val ring: Int,
) {
    Grief("grief", "Grief", "शोक", Color(0xFF4A5568), Color(0xFF718096), 0f, 1),
    Fear("fear", "Fear", "भय", Color(0xFF2D3748), Color(0xFF4A5568), 45f, 1),
    Anger("anger", "Anger", "क्रोध", Color(0xFF742A2A), Color(0xFFFC8181), 90f, 1),
    Confusion("confusion", "Confusion", "मोह", Color(0xFF2A4365), Color(0xFF63B3ED), 135f, 1),
    Loneliness("loneliness", "Loneliness", "एकाकी", Color(0xFF1A365D), Color(0xFF4299E1), 180f, 1),
    Anxiety("anxiety", "Anxiety", "चिंता", Color(0xFF553C9A), Color(0xFFB794F4), 225f, 1),
    Shame("shame", "Shame", "लज्जा", Color(0xFF521B41), Color(0xFFD53F8C), 270f, 1),
    Exhaustion("exhaustion", "Exhaustion", "थकान", Color(0xFF2D3748), Color(0xFFA0AEC0), 315f, 1),
    Overwhelm("overwhelm", "Overwhelm", "अभिभूत", Color(0xFF44337A), Color(0xFF9F7AEA), 22f, 2),
    Guilt("guilt", "Guilt", "अपराध", Color(0xFF63171B), Color(0xFFFEB2B2), 112f, 2),
    Sadness("sadness", "Sadness", "दुःख", Color(0xFF1A3A5C), Color(0xFF90CDF4), 202f, 2),
    Doubt("doubt", "Doubt", "संशय", Color(0xFF3C366B), Color(0xFFA3BFFA), 292f, 2);

    companion object {
        fun byId(id: String): FeelingState? = values().firstOrNull { it.id == id }
    }
}

/** Five sanskrit-named intensity levels (1 = whisper, 5 = all-consuming). */
data class IntensityLevel(
    val value: Int,
    val label: String,
    val sanskrit: String,
) {
    companion object {
        val All = listOf(
            IntensityLevel(1, "A whisper", "स्पर्श"),
            IntensityLevel(2, "Present", "उपस्थित"),
            IntensityLevel(3, "Strong", "प्रबल"),
            IntensityLevel(4, "Overwhelming", "अभिभूत"),
            IntensityLevel(5, "All-consuming", "सर्वव्यापी"),
        )
    }
}

/**
 * A Bhagavad Gita shloka that Sakha offers in response to the user's feeling.
 * Kept small and sourced entirely offline so the experience works without a
 * network — the online path swaps this in from the KIAAN backend later.
 */
data class Shloka(
    val sanskrit: String,
    val transliteration: String,
    val translation: String,
    val reference: String,
)

/** Pranayama rhythm (seconds per beat) — intensity-adaptive. */
data class BreathPattern(
    val inhale: Int,
    val holdIn: Int,
    val exhale: Int,
    val holdOut: Int,
    val rounds: Int,
) {
    val cycleSeconds: Int get() = inhale + holdIn + exhale + holdOut
}

/**
 * Sakha's witnessing of the user's emotion — the full composed response the
 * user sees on the Witness screen.
 */
data class WitnessResponse(
    val witness: String,
    val shloka: Shloka,
    val reflection: String,
    val affirmation: String,
)

/**
 * The full offline-composed Emotional Reset practice for the selected
 * feeling + intensity. Mirrors [EmotionalResetSession] on the web.
 */
data class EmotionalResetComposition(
    val feeling: FeelingState,
    val intensity: Int,
    val witness: WitnessResponse,
    val breath: BreathPattern,
    val transitionLabel: String,
)

/** Result returned when the ceremony seals the session. */
data class EmotionalResetResult(
    val durationMinutes: Int,
    val feelingLabel: String,
    val transitionLabel: String,
    val xpAwarded: Int,
)

/** A single pranayama beat for UI rendering. */
enum class BreathBeat(val labelEn: String, val labelHi: String) {
    Inhale("Breathe In", "श्वास लो"),
    HoldIn("Hold", "रोको"),
    Exhale("Release", "छोड़ो"),
    HoldOut("Rest", "विश्राम"),
}
