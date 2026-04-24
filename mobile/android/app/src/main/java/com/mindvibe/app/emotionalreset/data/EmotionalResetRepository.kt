package com.mindvibe.app.emotionalreset.data

import com.mindvibe.app.emotionalreset.model.EmotionalResetComposition
import com.mindvibe.app.emotionalreset.model.EmotionalResetResult
import com.mindvibe.app.emotionalreset.model.FeelingState
import kotlinx.coroutines.delay
import kotlin.math.max

/**
 * Repository for the Emotional Reset experience.
 *
 * Current implementation is fully offline via [EmotionalResetContentProvider].
 * When the KIAAN backend is wired up, a network source can be added here
 * with the local provider kept as a graceful fallback — the ViewModel will
 * not need to change.
 */
class EmotionalResetRepository {

    /**
     * Compose Sakha's response to the user's feeling. A short contemplative
     * beat is intentional: the web does the same so the transition from the
     * mandala to the witness feels like being received, not processed.
     */
    suspend fun compose(feeling: FeelingState, intensity: Int): EmotionalResetComposition {
        delay(COMPOSE_DELAY_MS)
        return EmotionalResetContentProvider.compose(feeling, intensity.coerceIn(1, 5))
    }

    /**
     * Seal the session and compute the offering metrics. XP is deterministic
     * so the experience feels like an offering, never like a leaderboard.
     */
    suspend fun seal(
        feeling: FeelingState,
        durationSeconds: Long,
        hasReflection: Boolean,
    ): EmotionalResetResult {
        delay(SEAL_DELAY_MS)
        val minutes = max(1, (durationSeconds / 60L).toInt())
        val xp = 15 + (if (hasReflection) 10 else 0)
        return EmotionalResetResult(
            durationMinutes = minutes,
            feelingLabel = feeling.label,
            transitionLabel = "${feeling.label} → Peace",
            xpAwarded = xp,
        )
    }

    companion object {
        private const val COMPOSE_DELAY_MS = 900L
        private const val SEAL_DELAY_MS = 350L
    }
}
