package com.mindvibe.app.sadhana.data

import com.mindvibe.app.sadhana.model.CompletionResult
import com.mindvibe.app.sadhana.model.SadhanaComposition
import com.mindvibe.app.sadhana.model.SadhanaMood
import com.mindvibe.app.sadhana.model.TimeOfDay
import kotlinx.coroutines.delay
import java.util.Calendar
import kotlin.math.max

/**
 * Repository that composes a Nitya Sadhana practice.
 *
 * Current implementation is purely local via [SadhanaContentProvider]. When
 * the /api/sadhana/compose and /api/sadhana/complete endpoints are wired up,
 * a network source can be added here with the local provider as a graceful
 * fallback — the ViewModel will not need to change.
 */
class SadhanaRepository {

    /**
     * Mimic the small "composing your sacred practice" moment from the web so
     * the transition feels intentional, not instant. Even offline, a short
     * contemplative beat sets the right tone.
     */
    suspend fun compose(mood: SadhanaMood): SadhanaComposition {
        delay(COMPOSE_DELAY_MS)
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val timeOfDay = TimeOfDay.now(hour)
        return SadhanaContentProvider.compose(mood, timeOfDay)
    }

    /**
     * Record the completion of a practice. Returns XP + streak data. The
     * offline implementation uses a simple deterministic rule until the
     * backend is wired: 25 XP for a full practice, -5 per minute under the
     * floor, never below 5.
     */
    suspend fun complete(
        durationSeconds: Long,
        hasReflection: Boolean,
        hasIntention: Boolean,
    ): CompletionResult {
        delay(COMPLETE_DELAY_MS)
        val base = 25
        val bonus = (if (hasReflection) 5 else 0) + (if (hasIntention) 5 else 0)
        val shortfallPenalty = if (durationSeconds < MIN_PRACTICE_SECONDS) 10 else 0
        val xp = max(5, base + bonus - shortfallPenalty)
        return CompletionResult(
            xpAwarded = xp,
            streakCount = 1,
            message = "Sankalpa sealed. Walk in dharma.",
        )
    }

    companion object {
        private const val COMPOSE_DELAY_MS = 900L
        private const val COMPLETE_DELAY_MS = 350L
        private const val MIN_PRACTICE_SECONDS = 60L
    }
}
