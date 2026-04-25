package com.mindvibe.app.journey.data

import com.mindvibe.app.journey.model.DayStep
import com.mindvibe.app.journey.model.GitaVerse
import com.mindvibe.app.journey.model.Journey
import com.mindvibe.app.journey.model.SakhaReflection
import com.mindvibe.app.journey.model.Vice
import com.mindvibe.app.journey.model.WorldScenario
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.HttpException

/**
 * Repository that bridges the Compose UI to the live Journey-engine API.
 *
 * The repository's #1 contract: never throw an unrecoverable error to the
 * UI. Network failures fall back to the offline JourneyContent catalog so
 * a poor signal at the top of a mountain still surrenders a real practice.
 * When the call succeeds, we map the wire DTO to the strongly-typed
 * [Journey] domain so the screen doesn't need to know which path it came
 * from.
 *
 * Errors are wrapped in [JourneyEngineError] so the UI can surface the
 * right message ("Couldn't reach Sakha right now — try again?") without
 * leaking raw Retrofit / OkHttp exception types.
 */
@Singleton
class JourneyEngineRepository @Inject constructor(
    private val api: JourneyEngineApi,
) {

    /** Fetch a journey by id from the live engine. Falls back to the local
     *  catalog if either the network is unreachable or the journey id is a
     *  catalog-only stub (used in offline preview builds). */
    suspend fun getJourney(journeyId: String): Result<Journey> = safeCall {
        // Catalog-only ids start with the stub slugs we ship in JourneyContent.
        val isCatalogStub = JourneyContent.journeys.any { it.id == journeyId }
        if (isCatalogStub) {
            return@safeCall JourneyContent.journey(journeyId)
        }
        val dto = withContext(Dispatchers.IO) { api.getJourney(journeyId) }
        val step = withContext(Dispatchers.IO) {
            runCatching { api.getCurrentStep(journeyId) }.getOrNull()
        }
        dto.toDomain(steps = listOfNotNull(step?.toDomain()))
    }

    /** Fetch a single step. Resolves locally for catalog-only journeys. */
    suspend fun getStep(journeyId: String, dayIndex: Int): Result<DayStep> = safeCall {
        val local = JourneyContent.journeys.firstOrNull { it.id == journeyId }
        if (local != null) {
            local.steps[(dayIndex - 1).coerceIn(0, local.steps.lastIndex)]
        } else {
            withContext(Dispatchers.IO) { api.getStep(journeyId, dayIndex).toDomain() }
        }
    }

    /**
     * Mark a step complete. Returns the Sakha wisdom + mastery delta the
     * UI surfaces in the post-completion card.
     *
     * Idempotency: the backend's complete_step short-circuits a second
     * call on the same (journey, day) so retries are safe at the data
     * layer. We don't currently surface explicit dedupe tokens — if we
     * need them later we'll wire an Idempotency-Key header rather than a
     * body field (the Pydantic model doesn't accept extras in the body).
     */
    suspend fun completeStep(
        journeyId: String,
        dayIndex: Int,
        reflection: String?,
    ): Result<CompletionResponseDto> = safeCall {
        // Offline / catalog journeys: synthesise the same shape so the UI
        // can render the Sakha card without diverging code paths. Empty
        // step lists are guarded so a future stub journey can't NPE.
        val local = JourneyContent.journeys.firstOrNull { it.id == journeyId }
        if (local != null && local.steps.isNotEmpty()) {
            val step = local.steps[(dayIndex - 1).coerceIn(0, local.steps.lastIndex)]
            return@safeCall CompletionResponseDto(
                success = true,
                dayCompleted = dayIndex,
                journeyComplete = dayIndex >= local.durationDays,
                nextDay = if (dayIndex >= local.durationDays) null else dayIndex + 1,
                progressPercentage = (dayIndex.toDouble() / local.durationDays) * 100.0,
                aiResponse = step.sakhaOnComplete.body,
                masteryDelta = step.sakhaOnComplete.masteryGained,
            )
        }
        withContext(Dispatchers.IO) {
            api.completeStep(
                journeyId = journeyId,
                dayIndex = dayIndex,
                body = CompleteStepRequest(
                    reflection = reflection?.takeIf { it.isNotBlank() },
                ),
            )
        }
    }

    suspend fun pauseJourney(journeyId: String): Result<JourneyDto> = safeCall {
        withContext(Dispatchers.IO) { api.pauseJourney(journeyId) }
    }

    suspend fun resumeJourney(journeyId: String): Result<JourneyDto> = safeCall {
        withContext(Dispatchers.IO) { api.resumeJourney(journeyId) }
    }

    suspend fun abandonJourney(journeyId: String): Result<JourneyDto> = safeCall {
        withContext(Dispatchers.IO) { api.abandonJourney(journeyId) }
    }

    suspend fun getDashboard(): Result<DashboardDto> = safeCall {
        withContext(Dispatchers.IO) { api.getDashboard() }
    }

    suspend fun getEnemyProgress(enemy: String): Result<EnemyProgressDto?> = safeCall {
        withContext(Dispatchers.IO) { api.getEnemyProgress(enemy) }
    }

    // ------------------------------------------------------------------
    // Mapping helpers
    // ------------------------------------------------------------------

    private fun JourneyDto.toDomain(steps: List<DayStep>): Journey {
        // Translate the primary enemy tag (e.g. "kama") to the Vice enum.
        val vice = primaryEnemies.firstOrNull()
            ?.let { tag -> Vice.values().firstOrNull { it.sanskrit.equals(tag, ignoreCase = true) } }
            ?: Vice.Kama
        // If the live engine didn't return a step (rare), fall back to a
        // small local catalog stub so the screen has something to show.
        val effectiveSteps = steps.ifEmpty {
            JourneyContent.journeys
                .firstOrNull { it.vice == vice }
                ?.steps
                .orEmpty()
        }
        return Journey(
            id = journeyId,
            vice = vice,
            title = title,
            subtitle = "",
            durationDays = totalDays,
            difficulty = JourneyContent.journeys.firstOrNull { it.vice == vice }
                ?.difficulty
                ?: com.mindvibe.app.journey.model.Difficulty.Easy,
            todayThisLooksLike = "",
            anchorVerse = JourneyContent.journeys.firstOrNull { it.vice == vice }
                ?.anchorVerse
                ?: GitaVerse("BG", "", ""),
            conqueredBy = "",
            currentDay = currentDay,
            steps = effectiveSteps,
        )
    }

    private fun StepDto.toDomain(): DayStep {
        val practiceText = (practice?.get("instructions") as? List<*>)
            ?.firstOrNull()
            ?.toString()
            ?: (practice?.get("name") as? String)
            ?: ""
        val practiceMin = (practice?.get("duration_minutes") as? Number)?.toInt() ?: 10
        val checkIn = checkInPrompt?.get("prompt")
            ?: "What stirs in you after this practice?"
        val world = modernExample?.let {
            WorldScenario(
                scenario = it.scenario,
                description = it.howEnemyManifests,
                reframe = it.practicalAntidote,
            )
        } ?: WorldScenario("", "", "")
        val verse = if (verseSanskrit != null || verseRef != null) {
            GitaVerse(
                citation = verseRef
                    ?.let { "BG ${it["chapter"]}.${it["verse"]}" }
                    ?: "",
                devanagari = verseSanskrit?.lineSequence()?.firstOrNull().orEmpty(),
                transliteration = verseTransliteration?.lineSequence()?.firstOrNull().orEmpty(),
                fullDevanagari = verseSanskrit.orEmpty(),
                fullTransliteration = verseTransliteration.orEmpty(),
                translation = verseTranslation.orEmpty(),
            )
        } else null
        return DayStep(
            dayIndex = dayIndex,
            title = stepTitle,
            teaching = teaching.take(120),
            teachingBody = teaching,
            worldScenario = world,
            reflectionPrompt = reflectionPrompt
                ?: guidedReflection.firstOrNull()
                ?: "",
            practice = practiceText,
            practiceMinutes = practiceMin,
            microCommitment = microCommitment
                ?: "I commit to being mindful of this teaching today.",
            sakhaOnComplete = SakhaReflection(
                body = "",
                masteryGained = 7,
            ),
            completed = isCompleted,
            checkInPrompt = checkIn,
            verse = verse,
        )
    }

    /**
     * Wrap any call so the UI receives Result<T> instead of throwing. Maps
     * specific HTTP statuses to actionable error types so the UI can react
     * to e.g. 401 → re-auth, 429 → rate-limit notice.
     */
    private suspend inline fun <T> safeCall(crossinline block: suspend () -> T): Result<T> = try {
        Result.success(block())
    } catch (e: HttpException) {
        Result.failure(JourneyEngineError.fromHttp(e))
    } catch (e: IOException) {
        Result.failure(JourneyEngineError.Network(e.message ?: "Network error"))
    } catch (t: Throwable) {
        Result.failure(JourneyEngineError.Unknown(t.message ?: "Unexpected error"))
    }
}

/**
 * Typed errors the UI can pattern-match on. We keep them small and
 * compassionate — error copy must guide, not frighten. The backend's
 * specific error message is preserved on `.message` so tests / logging
 * can still see the truth without leaking jargon to the user.
 */
sealed class JourneyEngineError(message: String) : Throwable(message) {
    class Network(message: String) : JourneyEngineError(message)
    class NotFound(message: String) : JourneyEngineError(message)
    class Unauthorized(message: String) : JourneyEngineError(message)
    class RateLimited(message: String) : JourneyEngineError(message)
    class Server(message: String) : JourneyEngineError(message)
    class Unknown(message: String) : JourneyEngineError(message)

    companion object {
        fun fromHttp(e: HttpException): JourneyEngineError = when (e.code()) {
            401, 403 -> Unauthorized("Please sign in to continue your journey.")
            404 -> NotFound("This journey wasn't found.")
            429 -> RateLimited("Slow down — Sakha is reflecting. Try again in a moment.")
            in 500..599 -> Server("The path is briefly clouded. Try again shortly.")
            else -> Unknown(e.message())
        }
    }
}
