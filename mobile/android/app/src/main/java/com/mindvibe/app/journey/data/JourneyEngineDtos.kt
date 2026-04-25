package com.mindvibe.app.journey.data

import com.google.gson.annotations.SerializedName

/**
 * Data Transfer Objects for the /api/journey-engine endpoints.
 *
 * The shapes mirror backend/routes/journey_engine.py Pydantic models 1:1
 * so the Android client never has to reach into a hand-written translation
 * layer. All fields are nullable where the backend marks them Optional —
 * the repository is responsible for mapping Dto → domain model and filling
 * sensible defaults so UI code can stay simple.
 *
 * Naming: Kotlin idiomatic camelCase with @SerializedName to keep the wire
 * format stable. snake_case keys come from the FastAPI/Pydantic side.
 */

// =============================================================================
// Journey
// =============================================================================

data class JourneyDto(
    @SerializedName("journey_id") val journeyId: String,
    @SerializedName("template_slug") val templateSlug: String,
    val title: String,
    val status: String,
    @SerializedName("current_day") val currentDay: Int,
    @SerializedName("total_days") val totalDays: Int,
    @SerializedName("progress_percentage") val progressPercentage: Double,
    @SerializedName("days_completed") val daysCompleted: Int,
    @SerializedName("started_at") val startedAt: String?,
    @SerializedName("last_activity") val lastActivity: String?,
    @SerializedName("primary_enemies") val primaryEnemies: List<String>,
    @SerializedName("streak_days") val streakDays: Int,
)

data class JourneyListDto(
    val journeys: List<JourneyDto>,
    val total: Int,
    val limit: Int,
    val offset: Int,
)

// =============================================================================
// Step
// =============================================================================

data class VerseRef(
    val chapter: Int,
    val verse: Int,
)

data class VerseContentDto(
    val chapter: Int,
    val verse: Int,
    val sanskrit: String?,
    val hindi: String?,
    val english: String,
    val transliteration: String?,
    val theme: String?,
)

data class ModernExampleDto(
    val category: String,
    val scenario: String,
    @SerializedName("how_enemy_manifests") val howEnemyManifests: String,
    @SerializedName("gita_verse_ref") val gitaVerseRef: Map<String, Int>?,
    @SerializedName("gita_wisdom") val gitaWisdom: String?,
    @SerializedName("practical_antidote") val practicalAntidote: String,
    @SerializedName("reflection_question") val reflectionQuestion: String?,
)

data class StepDto(
    @SerializedName("step_id") val stepId: String,
    @SerializedName("journey_id") val journeyId: String,
    @SerializedName("day_index") val dayIndex: Int,
    @SerializedName("step_title") val stepTitle: String,
    val teaching: String,
    @SerializedName("guided_reflection") val guidedReflection: List<String> = emptyList(),
    val practice: Map<String, Any?>? = null,
    @SerializedName("verse_refs") val verseRefs: List<Map<String, Int>> = emptyList(),
    val verses: List<VerseContentDto> = emptyList(),
    @SerializedName("micro_commitment") val microCommitment: String?,
    @SerializedName("check_in_prompt") val checkInPrompt: Map<String, String>?,
    @SerializedName("safety_note") val safetyNote: String?,
    @SerializedName("is_completed") val isCompleted: Boolean,
    @SerializedName("completed_at") val completedAt: String?,
    @SerializedName("available_to_complete") val availableToComplete: Boolean = true,
    @SerializedName("next_available_at") val nextAvailableAt: String? = null,
    // Flattened sacred fields populated by _step_to_response
    @SerializedName("verse_ref") val verseRef: Map<String, Int>? = null,
    @SerializedName("verse_sanskrit") val verseSanskrit: String? = null,
    @SerializedName("verse_transliteration") val verseTransliteration: String? = null,
    @SerializedName("verse_translation") val verseTranslation: String? = null,
    @SerializedName("reflection_prompt") val reflectionPrompt: String? = null,
    @SerializedName("modern_example") val modernExample: ModernExampleDto? = null,
)

// =============================================================================
// Completion
// =============================================================================

/**
 * Idempotent completion payload. The backend treats `client_token` as the
 * idempotency key — sending the same token twice is safe and yields the
 * same response (so a retry after a network blip never double-credits).
 */
data class CompleteStepRequest(
    val reflection: String? = null,
    @SerializedName("client_token") val clientToken: String? = null,
)

data class CompletionResponseDto(
    val success: Boolean,
    @SerializedName("day_completed") val dayCompleted: Int,
    @SerializedName("journey_complete") val journeyComplete: Boolean,
    @SerializedName("next_day") val nextDay: Int?,
    @SerializedName("progress_percentage") val progressPercentage: Double,
    @SerializedName("ai_response") val aiResponse: String = "",
    @SerializedName("mastery_delta") val masteryDelta: Int = 0,
)

// =============================================================================
// Templates / Dashboard
// =============================================================================

data class TemplateDto(
    @SerializedName("template_id") val templateId: String,
    val slug: String,
    val title: String,
    val description: String,
    @SerializedName("duration_days") val durationDays: Int,
    @SerializedName("difficulty_level") val difficultyLevel: String?,
    @SerializedName("category_tag") val categoryTag: String?,
    @SerializedName("primary_enemies") val primaryEnemies: List<String> = emptyList(),
    @SerializedName("is_premium") val isPremium: Boolean = false,
    @SerializedName("is_free") val isFree: Boolean = true,
    @SerializedName("icon_name") val iconName: String?,
    @SerializedName("color_theme") val colorTheme: String?,
    @SerializedName("gita_verse_ref") val gitaVerseRef: Map<String, Int>? = null,
    @SerializedName("gita_verse_text") val gitaVerseText: String? = null,
    @SerializedName("modern_context") val modernContext: String? = null,
    @SerializedName("transformation_promise") val transformationPromise: String? = null,
)

data class TemplateListDto(
    val templates: List<TemplateDto>,
    val total: Int,
    val limit: Int,
    val offset: Int,
)

data class EnemyProgressDto(
    val enemy: String,
    @SerializedName("enemy_label") val enemyLabel: String,
    @SerializedName("journeys_started") val journeysStarted: Int,
    @SerializedName("journeys_completed") val journeysCompleted: Int,
    @SerializedName("total_days_practiced") val totalDaysPracticed: Int,
    @SerializedName("current_streak") val currentStreak: Int,
    @SerializedName("best_streak") val bestStreak: Int,
    @SerializedName("last_practice") val lastPractice: String?,
    @SerializedName("mastery_level") val masteryLevel: Int,
    @SerializedName("active_journey_progress_pct") val activeJourneyProgressPct: Int = 0,
    @SerializedName("active_journey_id") val activeJourneyId: String? = null,
    @SerializedName("active_journey_day") val activeJourneyDay: Int = 0,
    @SerializedName("active_journey_total_days") val activeJourneyTotalDays: Int = 0,
)

data class DashboardDto(
    @SerializedName("active_journeys") val activeJourneys: List<JourneyDto>,
    @SerializedName("completed_journeys") val completedJourneys: Int,
    @SerializedName("total_days_practiced") val totalDaysPracticed: Int,
    @SerializedName("current_streak") val currentStreak: Int,
    @SerializedName("enemy_progress") val enemyProgress: List<EnemyProgressDto>,
    @SerializedName("recommended_templates") val recommendedTemplates: List<Map<String, Any?>> = emptyList(),
    @SerializedName("today_steps") val todaySteps: List<StepDto> = emptyList(),
    @SerializedName("active_count") val activeCount: Int = 0,
    @SerializedName("max_active") val maxActive: Int = 5,
)
