package com.mindvibe.app.sadhana.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mindvibe.app.sadhana.model.SadhanaPhase
import com.mindvibe.app.sadhana.ui.components.SacredBackground
import com.mindvibe.app.sadhana.ui.phases.ArrivalScreen
import com.mindvibe.app.sadhana.ui.phases.BreathworkScreen
import com.mindvibe.app.sadhana.ui.phases.CompletionScreen
import com.mindvibe.app.sadhana.ui.phases.IntentionScreen
import com.mindvibe.app.sadhana.ui.phases.ReflectionScreen
import com.mindvibe.app.sadhana.ui.phases.VerseScreen
import com.mindvibe.app.sadhana.viewmodel.SadhanaViewModel
import com.mindvibe.app.ui.theme.KiaanColors

/**
 * Top-level Nitya Sadhana host. Composes the sacred background once, then
 * crossfades between phase screens driven by [SadhanaViewModel].
 */
@Composable
fun NityaSadhanaHost(
    modifier: Modifier = Modifier,
    viewModel: SadhanaViewModel = viewModel(factory = SadhanaViewModel.Factory()),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Box(modifier = modifier.fillMaxSize()) {
        SacredBackground(moodTint = state.mood?.color)

        AnimatedContent(
            targetState = state.phase,
            transitionSpec = {
                fadeIn(tween(500)) togetherWith fadeOut(tween(300))
            },
            label = "phaseTransition",
            modifier = Modifier.fillMaxSize(),
        ) { phase ->
            when (phase) {
                SadhanaPhase.Arrival -> ArrivalScreen(
                    onMoodSelect = viewModel::selectMood,
                    selectedMood = state.mood,
                    isComposing = state.isComposing,
                )

                SadhanaPhase.Breathwork -> state.composition?.let { comp ->
                    BreathworkScreen(
                        pattern = comp.breathingPattern,
                        onComplete = viewModel::onBreathworkDone,
                        onSkip = viewModel::onBreathworkDone,
                    )
                } ?: LoadingBeat()

                SadhanaPhase.Verse -> state.composition?.let { comp ->
                    VerseScreen(
                        verse = comp.verse,
                        onComplete = viewModel::onVerseDone,
                        onSkip = viewModel::onVerseDone,
                    )
                } ?: LoadingBeat()

                SadhanaPhase.Reflection -> state.composition?.let { comp ->
                    ReflectionScreen(
                        prompt = comp.reflectionPrompt,
                        reflectionText = state.reflectionText,
                        onReflectionChange = viewModel::updateReflection,
                        onComplete = viewModel::onReflectionDone,
                    )
                } ?: LoadingBeat()

                SadhanaPhase.Intention -> state.composition?.let { comp ->
                    IntentionScreen(
                        intention = comp.dharmaIntention,
                        intentionText = state.intentionText,
                        onIntentionChange = viewModel::updateIntention,
                        onSeal = viewModel::sealSankalpa,
                        sealed = state.sankalpaSealed,
                    )
                } ?: LoadingBeat()

                SadhanaPhase.Complete -> CompletionScreen(
                    result = state.result,
                    onWalkInDharma = viewModel::restart,
                    onViewJournal = { /* TODO: journal deep-link when journal screen lands */ },
                )
            }
        }
    }
}

@Composable
private fun LoadingBeat() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        CircularProgressIndicator(color = KiaanColors.SacredGold)
    }
}
