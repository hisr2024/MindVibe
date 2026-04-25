package com.mindvibe.app.journey.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mindvibe.app.journey.data.JourneyEngineError
import com.mindvibe.app.journey.data.JourneyEngineRepository
import com.mindvibe.app.journey.model.DayStep
import com.mindvibe.app.journey.model.Journey
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * Drives the JourneyDetailScreen state machine end-to-end:
 *   load → render → completeStep → showSakhaCard → returnToJourneys
 *
 * Why a ViewModel and not a direct call from the screen? Because three
 * things must survive a configuration change (or a brief tab switch):
 *   1. The "completing now" optimistic state, so a rotation mid-call
 *      doesn't fire the request twice.
 *   2. The Sakha wisdom card returned by the backend, so the user keeps
 *      seeing it after a screen rotation.
 *   3. The currently selected day, so the day pill row doesn't reset.
 *
 * State is exposed as a single [StateFlow] so the Compose screen can
 * collect it with `collectAsStateWithLifecycle()`.
 */
data class JourneyDetailUiState(
    val loading: Boolean = false,
    val journey: Journey? = null,
    val selectedStep: DayStep? = null,
    val selectedDay: Int = 1,
    val isCompleting: Boolean = false,
    val error: String? = null,
    val sakhaResponse: String? = null,
    val masteryDelta: Int? = null,
    val showCompletion: Boolean = false,
    val journeyComplete: Boolean = false,
)

@HiltViewModel
class JourneyDetailViewModel @Inject constructor(
    private val repository: JourneyEngineRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(JourneyDetailUiState())
    val state: StateFlow<JourneyDetailUiState> = _state.asStateFlow()

    private var journeyId: String = ""

    /** Bind the screen to a journey id. Re-entry with the same id is a no-op. */
    fun bind(journeyId: String) {
        if (this.journeyId == journeyId && _state.value.journey != null) return
        this.journeyId = journeyId
        load()
    }

    fun load() {
        if (journeyId.isBlank()) return
        _state.update { it.copy(loading = true, error = null) }
        viewModelScope.launch {
            repository.getJourney(journeyId).fold(
                onSuccess = { journey ->
                    val day = journey.currentDay.coerceAtLeast(1)
                    val step = journey.steps.getOrNull((day - 1).coerceAtLeast(0))
                    _state.update {
                        it.copy(
                            loading = false,
                            journey = journey,
                            selectedDay = day,
                            selectedStep = step,
                            error = null,
                        )
                    }
                },
                onFailure = { t ->
                    _state.update {
                        it.copy(loading = false, error = friendly(t))
                    }
                },
            )
        }
    }

    /** Switch the rendered day. Tries the network first, falls back to local. */
    fun selectDay(day: Int) {
        val current = _state.value.journey ?: return
        val clamped = day.coerceIn(1, current.durationDays)
        // Optimistic update from the in-memory journey so the UI never blanks.
        val localStep = current.steps.getOrNull((clamped - 1).coerceAtLeast(0))
        _state.update { it.copy(selectedDay = clamped, selectedStep = localStep) }
        viewModelScope.launch {
            repository.getStep(journeyId, clamped).onSuccess { step ->
                if (_state.value.selectedDay == clamped) {
                    _state.update { it.copy(selectedStep = step) }
                }
            }
        }
    }

    /** Reflection text isn't kept in the VM — the screen owns it because it's
     *  the textbox value. This entry-point only carries it through to the
     *  completeStep call. */
    fun completeStep(reflection: String?) {
        val current = _state.value
        val journey = current.journey ?: return
        if (current.isCompleting) return
        val day = current.selectedDay
        if (day != journey.currentDay || !journey.isActive) return

        _state.update { it.copy(isCompleting = true, error = null) }
        viewModelScope.launch {
            repository.completeStep(
                journeyId = journeyId,
                dayIndex = day,
                reflection = reflection,
            ).fold(
                onSuccess = { result ->
                    _state.update {
                        it.copy(
                            isCompleting = false,
                            sakhaResponse = result.aiResponse.ifBlank { null },
                            masteryDelta = result.masteryDelta.takeIf { d -> d > 0 },
                            showCompletion = true,
                            journeyComplete = result.journeyComplete,
                        )
                    }
                },
                onFailure = { t ->
                    _state.update {
                        it.copy(isCompleting = false, error = friendly(t))
                    }
                },
            )
        }
    }

    fun pause() = mutate { repository.pauseJourney(journeyId) }
    fun resume() = mutate { repository.resumeJourney(journeyId) }
    fun abandon() = mutate { repository.abandonJourney(journeyId) }

    fun dismissError() = _state.update { it.copy(error = null) }

    private fun mutate(call: suspend () -> Result<*>) {
        viewModelScope.launch {
            call().fold(
                onSuccess = { load() },
                onFailure = { t -> _state.update { it.copy(error = friendly(t)) } },
            )
        }
    }

    private fun friendly(t: Throwable): String = when (t) {
        is JourneyEngineError.Network -> "You're offline. Try again when connected."
        is JourneyEngineError.NotFound -> "We couldn't find this journey."
        is JourneyEngineError.Unauthorized -> "Please sign in to continue your journey."
        is JourneyEngineError.RateLimited -> "Slow down — try again in a moment."
        is JourneyEngineError.Server -> "The path is briefly clouded. Try again shortly."
        is JourneyEngineError -> t.message ?: "Something went sideways."
        else -> t.message ?: "Something went sideways."
    }
}
