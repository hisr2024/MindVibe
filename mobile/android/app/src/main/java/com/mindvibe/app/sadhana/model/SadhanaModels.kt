package com.mindvibe.app.sadhana.model

import androidx.compose.ui.graphics.Color
import com.mindvibe.app.ui.theme.KiaanColors

/**
 * Nitya Sadhana domain models.
 * Mirrors [types/sadhana.types.ts] so the Android app can stay in lock-step
 * with the web experience when the backend /api/sadhana endpoints go live.
 */

enum class SadhanaPhase { Arrival, Breathwork, Verse, Reflection, Intention, Complete }

enum class SadhanaMood(
    val id: String,
    val sanskrit: String,
    val label: String,
    val color: Color,
    val description: String,
) {
    Peaceful(
        id = "peaceful",
        sanskrit = "शान्त",
        label = "Peaceful",
        color = KiaanColors.MoodPeaceful,
        description = "Your heart rests in stillness",
    ),
    Radiant(
        id = "radiant",
        sanskrit = "तेजस्वी",
        label = "Radiant",
        color = KiaanColors.MoodRadiant,
        description = "Your light shines with quiet power",
    ),
    Grateful(
        id = "grateful",
        sanskrit = "कृतज्ञ",
        label = "Grateful",
        color = KiaanColors.MoodGrateful,
        description = "Your heart overflows with thanks",
    ),
    Seeking(
        id = "seeking",
        sanskrit = "जिज्ञासु",
        label = "Seeking",
        color = KiaanColors.MoodSeeking,
        description = "Your soul reaches toward truth",
    ),
    Heavy(
        id = "heavy",
        sanskrit = "भारग्रस्त",
        label = "Heavy",
        color = KiaanColors.MoodHeavy,
        description = "Your heart carries weight today",
    ),
    Wounded(
        id = "wounded",
        sanskrit = "आहत",
        label = "Wounded",
        color = KiaanColors.MoodWounded,
        description = "A tender ache lives within",
    ),
}

enum class TimeOfDay(val greetingEn: String, val greetingHi: String, val transliteration: String) {
    Morning("Good Morning, dear seeker", "प्रभात नमस्कार", "OM saha nāvavatu"),
    Afternoon("Welcome back, dear seeker", "मध्याह्न नमस्कार", "OM sahanau bhunaktu"),
    Evening("Peaceful evening, dear seeker", "सायं नमस्कार", "OM sahavīryaṃ karavāvahai"),
    Night("Sacred night, dear seeker", "रात्रि नमस्कार", "OM śāntiḥ śāntiḥ śāntiḥ");

    companion object {
        fun now(hour: Int): TimeOfDay = when (hour) {
            in 4..11 -> Morning
            in 12..16 -> Afternoon
            in 17..20 -> Evening
            else -> Night
        }
    }
}

/** A 4-part pranayama rhythm (seconds per phase). */
data class BreathingPattern(
    val name: String,
    val inhale: Int,
    val holdIn: Int,
    val exhale: Int,
    val holdOut: Int,
    val cycles: Int,
    val description: String,
)

data class SadhanaVerse(
    val chapter: Int,
    val verse: Int,
    val chapterName: String,
    val sanskrit: String,
    val transliteration: String,
    val english: String,
    val modernInsight: String,
    val kiaanInsight: String,
) {
    val verseId: String get() = "bg$chapter.$verse"
}

data class ReflectionPrompt(
    val prompt: String,
    val guidingQuestion: String,
    val placeholder: String = "What stirs in you after this verse?",
)

data class DharmaIntention(
    val suggestion: String,
    val category: String,
)

data class SadhanaComposition(
    val greeting: String,
    val breathingPattern: BreathingPattern,
    val verse: SadhanaVerse,
    val reflectionPrompt: ReflectionPrompt,
    val dharmaIntention: DharmaIntention,
    val durationEstimateMinutes: Int,
    val timeOfDay: TimeOfDay,
)

data class CompletionResult(
    val xpAwarded: Int,
    val streakCount: Int,
    val message: String,
)

/** One beat of the pranayama cycle. */
enum class BreathPhase(val labelEn: String, val labelHi: String) {
    Inhale("Breathe In", "श्वास लो"),
    HoldIn("Hold", "रोको"),
    Exhale("Release", "छोड़ो"),
    HoldOut("Rest", "विश्राम"),
}
