package com.mindvibe.app.journey.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mindvibe.app.journey.data.EnemyProgressDto
import com.mindvibe.app.journey.data.JourneyEngineRepository
import com.mindvibe.app.journey.model.Vice
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * Per-vice progress for the Battleground tab. Pulled from
 * /api/journey-engine/dashboard.enemy_progress so the radar mandala +
 * 6 vice cards reflect the same data the web shows.
 *
 * The map key is a [Vice] enum so the screen can look up by vice without
 * worrying about string casing of the backend tag.
 */
data class EnemyProgress(
    val vice: Vice,
    val activeJourneyDay: Int,
    val activeJourneyTotalDays: Int,
    val activeJourneyProgressPct: Int,
    val activeJourneyId: String?,
    val masteryLevel: Int,
    val currentStreak: Int,
) {
    val hasActiveJourney: Boolean get() = activeJourneyId != null
}

data class BattlegroundUiState(
    val loading: Boolean = false,
    val error: String? = null,
    val byVice: Map<Vice, EnemyProgress> = emptyMap(),
)

@HiltViewModel
class BattlegroundViewModel @Inject constructor(
    private val repository: JourneyEngineRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(BattlegroundUiState())
    val state: StateFlow<BattlegroundUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            repository.getDashboard().fold(
                onSuccess = { dashboard ->
                    val byVice = dashboard.enemyProgress
                        .mapNotNull { it.toEnemyProgress() }
                        .associateBy { it.vice }
                    _state.update { it.copy(loading = false, byVice = byVice) }
                },
                onFailure = { t ->
                    // Soft failure — keep whatever we have so the radar
                    // still renders for offline / unauthenticated users.
                    _state.update {
                        it.copy(
                            loading = false,
                            error = t.message ?: "Couldn't load progress.",
                        )
                    }
                },
            )
        }
    }

    private fun EnemyProgressDto.toEnemyProgress(): EnemyProgress? {
        val vice = Vice.values().firstOrNull { it.sanskrit.equals(enemy, ignoreCase = true) }
            ?: return null
        return EnemyProgress(
            vice = vice,
            activeJourneyDay = activeJourneyDay,
            activeJourneyTotalDays = activeJourneyTotalDays,
            activeJourneyProgressPct = activeJourneyProgressPct,
            activeJourneyId = activeJourneyId,
            masteryLevel = masteryLevel,
            currentStreak = currentStreak,
        )
    }
}
