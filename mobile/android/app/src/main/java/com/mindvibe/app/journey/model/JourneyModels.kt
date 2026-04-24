package com.mindvibe.app.journey.model

import androidx.compose.ui.graphics.Color

/**
 * Domain model for the षड्रिपु (Shadripu) Journeys experience — a 1:1
 * adaptation of kiaanverse.com mobile. Models are intentionally immutable
 * so the Compose screens can rely on structural equality for recomposition.
 */

/** One of the six inner adversaries — each with its sacred color signature. */
enum class Vice(
    val devanagari: String,
    val sanskrit: String,
    val englishName: String,
    val accent: Color,
    val accentSoft: Color,
    val surface: Color,
) {
    Kama(
        devanagari = "काम",
        sanskrit = "Kama",
        englishName = "Desire",
        accent = Color(0xFFEF4444),
        accentSoft = Color(0xFFF87171),
        surface = Color(0xFF2A0A10),
    ),
    Krodha(
        devanagari = "क्रोध",
        sanskrit = "Krodha",
        englishName = "Anger",
        accent = Color(0xFFE7811F),
        accentSoft = Color(0xFFF59E4A),
        surface = Color(0xFF2A1508),
    ),
    Lobha(
        devanagari = "लोभ",
        sanskrit = "Lobha",
        englishName = "Greed",
        accent = Color(0xFF10B981),
        accentSoft = Color(0xFF34D399),
        surface = Color(0xFF06201A),
    ),
    Moha(
        devanagari = "मोह",
        sanskrit = "Moha",
        englishName = "Delusion",
        accent = Color(0xFF8B5CF6),
        accentSoft = Color(0xFFA78BFA),
        surface = Color(0xFF1A0E30),
    ),
    Mada(
        devanagari = "मद",
        sanskrit = "Mada",
        englishName = "Pride",
        accent = Color(0xFF3B82F6),
        accentSoft = Color(0xFF60A5FA),
        surface = Color(0xFF0A1430),
    ),
    Matsarya(
        devanagari = "मात्सर्य",
        sanskrit = "Matsarya",
        englishName = "Envy",
        accent = Color(0xFFEC4899),
        accentSoft = Color(0xFFF472B6),
        surface = Color(0xFF2A0A1C),
    ),
}

enum class Difficulty(val label: String) {
    Easy("Easy"),
    Moderate("Moderate"),
    Challenging("Challenging"),
}

/** "In Today's World" block — a contemporary scenario + reflection. */
data class WorldScenario(
    val scenario: String,
    val description: String,
    val reframe: String,
)

/** One Bhagavad Gita verse referenced by a day. */
data class GitaVerse(
    val citation: String,         // e.g. "BG 16.4"
    val devanagari: String,       // short fragment shown on cards
    val transliteration: String,
)

/** The SAKHA companion reflection that appears after day completion. */
data class SakhaReflection(
    val body: String,
    val masteryGained: Int = 7,
)

/** One day of a journey — the full anatomy per the detail screenshots. */
data class DayStep(
    val dayIndex: Int,
    val title: String,            // e.g. "Recognizing Desire's Pull"
    val teaching: String,         // short italic line under header
    val teachingBody: String,     // longer teaching paragraph
    val worldScenario: WorldScenario,
    val reflectionPrompt: String,
    val practice: String,
    val practiceMinutes: Int = 10,
    val microCommitment: String = "I commit to being mindful of this teaching today.",
    val sakhaOnComplete: SakhaReflection,
    val completed: Boolean = false,
)

data class Journey(
    val id: String,
    val vice: Vice,
    val title: String,
    val subtitle: String,         // "A 14-day practice to transform anger..."
    val durationDays: Int,
    val difficulty: Difficulty,
    val isFree: Boolean = true,
    val todayThisLooksLike: String,
    val anchorVerse: GitaVerse,
    val conqueredBy: String,      // "Viveka — the pause..."
    val currentDay: Int = 0,      // 0 = not started
    val steps: List<DayStep>,
) {
    val isActive: Boolean get() = currentDay in 1..durationDays
    val isCompleted: Boolean get() = currentDay > durationDays
    val progressPercent: Int
        get() = if (durationDays == 0) 0 else (((currentDay.coerceAtLeast(0)).toFloat() / durationDays) * 100).toInt()
}

/** Today-tab quick stats (top 4 pill row). */
data class HomeStats(
    val active: Int,
    val activeMax: Int,
    val completed: Int,
    val streak: Int,
    val totalDays: Int,
)

/** A short "micro practice" card shown on Today. */
data class MicroPractice(
    val label: String,              // "Releasing what is held"
    val principle: String,          // "Vairagya (Non-attachment)"
    val body: String,
    val accent: Color,
)

/** Wisdom-tab daily teaching. */
data class WisdomTeaching(
    val verse: GitaVerse,
    val translation: String,
    val reflection: String,
    val sitWithQuestion: String,
)

/** One tile on the "This Week's Teachings" row. */
data class WeeklyTeaching(
    val dayOfWeekShort: String,
    val dayOfMonth: Int,
    val status: WeeklyStatus,
)

enum class WeeklyStatus { Past, Today, Upcoming }

/** The four primary tabs mirroring the bottom nav of the website. */
enum class BottomTab(val label: String) {
    Today("Today"),
    Journeys("Journeys"),
    Battleground("Battleground"),
    Wisdom("Wisdom"),
}
