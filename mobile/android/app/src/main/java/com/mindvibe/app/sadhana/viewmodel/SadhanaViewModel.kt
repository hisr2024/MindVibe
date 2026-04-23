package com.mindvibe.app.sadhana.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.mindvibe.app.sadhana.data.SadhanaRepository
import com.mindvibe.app.sadhana.model.CompletionResult
import com.mindvibe.app.sadhana.model.SadhanaComposition
import com.mindvibe.app.sadhana.model.SadhanaMood
import com.mindvibe.app.sadhana.model.SadhanaPhase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * State machine that drives the Nitya Sadhana experience.
 *
 * Phase flow matches the web app exactly:
 *   Arrival → Breathwork → Verse → Reflection → Intention → Complete
 *
 * The ViewModel is intentionally UI-agnostic so the same state machine could
 * back a TV or Wear OS surface later.
 */
data class SadhanaUiState(
    val phase: SadhanaPhase = SadhanaPhase.Arrival,
    val mood: SadhanaMood? = null,
    val composition: SadhanaComposition? = null,
    val reflectionText: String = "",
    val intentionText: String = "",
    val sankalpaSealed: Boolean = false,
    val isComposing: Boolean = false,
    val startedAtMs: Long? = null,
    val result: CompletionResult? = null,
    val error: String? = null,
)

class SadhanaViewModel(
    private val repository: SadhanaRepository = SadhanaRepository(),
    private val nowMs: () -> Long = { System.currentTimeMillis() },
) : ViewModel() {

    private val _state = MutableStateFlow(SadhanaUiState())
    val state: StateFlow<SadhanaUiState> = _state.asStateFlow()

    /** Mood selected on Arrival screen — triggers composition. */
    fun selectMood(mood: SadhanaMood) {
        if (_state.value.isComposing) return
        _state.update {
            it.copy(mood = mood, isComposing = true, error = null, startedAtMs = nowMs())
        }
        viewModelScope.launch {
            try {
                val composition = repository.compose(mood)
                _state.update {
                    it.copy(
                        composition = composition,
                        intentionText = composition.dharmaIntention.suggestion,
                        isComposing = false,
                        phase = SadhanaPhase.Breathwork,
                    )
                }
            } catch (t: Throwable) {
                _state.update {
                    it.copy(
                        isComposing = false,
                        error = t.message ?: "Could not compose your practice.",
                    )
                }
            }
        }
    }

    fun onBreathworkDone() = advanceTo(SadhanaPhase.Verse)
    fun onVerseDone() = advanceTo(SadhanaPhase.Reflection)
    fun onReflectionDone() = advanceTo(SadhanaPhase.Intention)

    fun updateReflection(text: String) {
        _state.update { it.copy(reflectionText = text) }
    }

    fun updateIntention(text: String) {
        _state.update { it.copy(intentionText = text) }
    }

    /** Seal the Sankalpa and finalise the practice. */
    fun sealSankalpa() {
        if (_state.value.sankalpaSealed) return
        _state.update { it.copy(sankalpaSealed = true) }
        viewModelScope.launch {
            val started = _state.value.startedAtMs ?: nowMs()
            val durationSec = ((nowMs() - started) / 1000L).coerceAtLeast(0L)
            val result = repository.complete(
                durationSeconds = durationSec,
                hasReflection = _state.value.reflectionText.isNotBlank(),
                hasIntention = _state.value.intentionText.isNotBlank(),
            )
            _state.update {
                it.copy(result = result, phase = SadhanaPhase.Complete)
            }
        }
    }

    /** User taps "Walk in Dharma" on completion screen — reset for another session. */
    fun restart() {
        _state.value = SadhanaUiState()
    }

    private fun advanceTo(next: SadhanaPhase) {
        _state.update { it.copy(phase = next) }
    }

    class Factory(
        private val repository: SadhanaRepository = SadhanaRepository(),
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(SadhanaViewModel::class.java)) {
                return SadhanaViewModel(repository) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}
