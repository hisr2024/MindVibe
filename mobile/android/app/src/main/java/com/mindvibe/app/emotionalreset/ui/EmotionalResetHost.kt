package com.mindvibe.app.emotionalreset.ui

import androidx.activity.compose.BackHandler
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
import com.mindvibe.app.emotionalreset.model.EmotionalResetPhase
import com.mindvibe.app.emotionalreset.ui.phases.BreathScreen
import com.mindvibe.app.emotionalreset.ui.phases.CeremonyScreen
import com.mindvibe.app.emotionalreset.ui.phases.EmotionalResetArrivalScreen
import com.mindvibe.app.emotionalreset.ui.phases.FeelingMandalaScreen
import com.mindvibe.app.emotionalreset.ui.phases.IntegrationScreen
import com.mindvibe.app.emotionalreset.ui.phases.WitnessScreen
import com.mindvibe.app.emotionalreset.viewmodel.EmotionalResetViewModel
import com.mindvibe.app.sadhana.ui.components.SacredBackground
import com.mindvibe.app.ui.theme.KiaanColors

/**
 * Host composable for the Emotional Reset experience — a 1:1 adaptation
 * of kiaanverse.com/m/emotional-reset. The sacred background is rendered
 * once and the phase screens crossfade between Arrival → Mandala → Witness
 * → Breath → Integration → Ceremony.
 *
 * The Ceremony phase renders its own cosmic canvas over the background,
 * so the host simply hands off to [CeremonyScreen] when we reach it.
 *
 * @param onExit Invoked when the user taps "Return to Sakha" on the
 * ceremony — or presses back from the Mandala phase — to leave the reset.
 */
@Composable
fun EmotionalResetHost(
    modifier: Modifier = Modifier,
    onExit: () -> Unit = {},
    viewModel: EmotionalResetViewModel = viewModel(factory = EmotionalResetViewModel.Factory()),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    BackHandler(enabled = state.phase != EmotionalResetPhase.Ceremony) {
        if (!viewModel.stepBack()) onExit()
    }

    Box(modifier = modifier.fillMaxSize()) {
        // The ceremony draws its own full-screen cosmic canvas. For every
        // other phase we keep the sadhana SacredBackground behind so the
        // feeling-tinted starfield flows from screen to screen.
        if (state.phase != EmotionalResetPhase.Ceremony) {
            SacredBackground(moodTint = state.feeling?.glowColor)
        }

        AnimatedContent(
            targetState = state.phase,
            transitionSpec = {
                fadeIn(tween(500)) togetherWith fadeOut(tween(300))
            },
            label = "emotionalResetPhaseTransition",
            modifier = Modifier.fillMaxSize(),
        ) { phase ->
            when (phase) {
                EmotionalResetPhase.Arrival -> EmotionalResetArrivalScreen(
                    onArrivalComplete = viewModel::onArrivalComplete,
                )

                EmotionalResetPhase.Mandala -> FeelingMandalaScreen(
                    selectedFeeling = state.feeling,
                    intensity = state.intensity,
                    context = state.context,
                    isComposing = state.isComposing,
                    onSelectFeeling = viewModel::selectFeeling,
                    onSelectIntensity = viewModel::selectIntensity,
                    onContextChange = viewModel::updateContext,
                    onOffer = viewModel::offerToSakha,
                )

                EmotionalResetPhase.Witness -> state.composition?.let { comp ->
                    WitnessScreen(
                        composition = comp,
                        onBeginBreath = viewModel::beginBreathing,
                    )
                } ?: LoadingBeat()

                EmotionalResetPhase.Breath -> state.composition?.let { comp ->
                    BreathScreen(
                        pattern = comp.breath,
                        onComplete = viewModel::onBreathComplete,
                        onSkip = viewModel::skipBreathing,
                    )
                } ?: LoadingBeat()

                EmotionalResetPhase.Integration -> state.composition?.let { comp ->
                    IntegrationScreen(
                        composition = comp,
                        journal = state.journal,
                        onJournalChange = viewModel::updateJournal,
                        onComplete = viewModel::completeReset,
                    )
                } ?: LoadingBeat()

                EmotionalResetPhase.Ceremony -> CeremonyScreen(
                    result = state.result,
                    fallbackTransitionLabel = state.composition?.transitionLabel,
                    onReturnToSakha = {
                        viewModel.returnToSakha()
                        onExit()
                    },
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
