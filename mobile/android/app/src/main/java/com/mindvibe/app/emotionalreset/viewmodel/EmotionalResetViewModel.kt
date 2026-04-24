package com.mindvibe.app.emotionalreset.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.mindvibe.app.emotionalreset.data.EmotionalResetRepository
import com.mindvibe.app.emotionalreset.model.EmotionalResetComposition
import com.mindvibe.app.emotionalreset.model.EmotionalResetPhase
import com.mindvibe.app.emotionalreset.model.EmotionalResetResult
import com.mindvibe.app.emotionalreset.model.FeelingState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * State machine for the Emotional Reset ritual.
 *
 * Phase flow is identical to the web:
 *   Arrival → Mandala → Witness → Breath → Integration → Ceremony
 *
 * The ViewModel is UI-agnostic so the same state machine could back a Wear
 * OS or TV surface later without change.
 */
data class EmotionalResetUiState(
    val phase: EmotionalResetPhase = EmotionalResetPhase.Arrival,
    val feeling: FeelingState? = null,
    val intensity: Int = 0,
    val context: String = "",
    val journal: String = "",
    val composition: EmotionalResetComposition? = null,
    val result: EmotionalResetResult? = null,
    val isComposing: Boolean = false,
    val isSealing: Boolean = false,
    val startedAtMs: Long? = null,
    val error: String? = null,
)

class EmotionalResetViewModel(
    private val repository: EmotionalResetRepository = EmotionalResetRepository(),
    private val nowMs: () -> Long = { System.currentTimeMillis() },
) : ViewModel() {

    private val _state = MutableStateFlow(EmotionalResetUiState())
    val state: StateFlow<EmotionalResetUiState> = _state.asStateFlow()

    /** Called after the arrival ripple completes. */
    fun onArrivalComplete() {
        _state.update {
            if (it.phase == EmotionalResetPhase.Arrival) {
                it.copy(phase = EmotionalResetPhase.Mandala, startedAtMs = nowMs())
            } else it
        }
    }

    fun selectFeeling(feeling: FeelingState) {
        _state.update { it.copy(feeling = feeling, intensity = 0) }
    }

    fun selectIntensity(intensity: Int) {
        _state.update { it.copy(intensity = intensity.coerceIn(1, 5)) }
    }

    fun updateContext(text: String) {
        _state.update { it.copy(context = text.take(CONTEXT_MAX_CHARS)) }
    }

    /** User taps "Offer to Sakha" — compose the response and advance. */
    fun offerToSakha() {
        val current = _state.value
        val feeling = current.feeling ?: return
        if (current.intensity < 1) return
        if (current.isComposing) return

        _state.update { it.copy(isComposing = true, error = null) }
        viewModelScope.launch {
            try {
                val composition = repository.compose(feeling, current.intensity)
                _state.update {
                    it.copy(
                        composition = composition,
                        isComposing = false,
                        phase = EmotionalResetPhase.Witness,
                    )
                }
            } catch (t: Throwable) {
                _state.update {
                    it.copy(
                        isComposing = false,
                        error = t.message ?: "Could not receive your offering.",
                    )
                }
            }
        }
    }

    fun beginBreathing() = advanceTo(EmotionalResetPhase.Breath)

    fun onBreathComplete() = advanceTo(EmotionalResetPhase.Integration)

    fun skipBreathing() = advanceTo(EmotionalResetPhase.Integration)

    fun updateJournal(text: String) {
        _state.update { it.copy(journal = text.take(JOURNAL_MAX_CHARS)) }
    }

    /** Seal — moves to ceremony, awards XP, stores result. */
    fun completeReset() {
        val current = _state.value
        val feeling = current.feeling ?: return
        if (current.isSealing) return

        _state.update {
            it.copy(isSealing = true, phase = EmotionalResetPhase.Ceremony)
        }
        viewModelScope.launch {
            val started = current.startedAtMs ?: nowMs()
            val durationSec = ((nowMs() - started) / 1000L).coerceAtLeast(0L)
            val result = repository.seal(
                feeling = feeling,
                durationSeconds = durationSec,
                hasReflection = current.journal.isNotBlank(),
            )
            _state.update { it.copy(isSealing = false, result = result) }
        }
    }

    /** User taps "Return to Sakha" — reset the whole state machine. */
    fun returnToSakha() {
        _state.value = EmotionalResetUiState()
    }

    /**
     * Go one phase back — used by the header back button. Cannot leave the
     * Ceremony (sealed) or the Arrival phases via back.
     */
    fun stepBack(): Boolean {
        val current = _state.value
        val prev = when (current.phase) {
            EmotionalResetPhase.Mandala -> null
            EmotionalResetPhase.Witness -> EmotionalResetPhase.Mandala
            EmotionalResetPhase.Breath -> EmotionalResetPhase.Witness
            EmotionalResetPhase.Integration -> EmotionalResetPhase.Breath
            EmotionalResetPhase.Arrival, EmotionalResetPhase.Ceremony -> null
        } ?: return false
        _state.update { it.copy(phase = prev) }
        return true
    }

    private fun advanceTo(next: EmotionalResetPhase) {
        _state.update { it.copy(phase = next) }
    }

    class Factory(
        private val repository: EmotionalResetRepository = EmotionalResetRepository(),
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(EmotionalResetViewModel::class.java)) {
                return EmotionalResetViewModel(repository) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        }
    }

    private companion object {
        const val CONTEXT_MAX_CHARS = 500
        const val JOURNAL_MAX_CHARS = 2000
    }
}
