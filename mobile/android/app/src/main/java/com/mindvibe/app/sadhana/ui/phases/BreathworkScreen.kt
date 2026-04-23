package com.mindvibe.app.sadhana.ui.phases

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.mindvibe.app.sadhana.model.BreathPhase
import com.mindvibe.app.sadhana.model.BreathingPattern
import com.mindvibe.app.sadhana.ui.components.LotusBreath
import com.mindvibe.app.ui.theme.KiaanColors
import kotlinx.coroutines.delay

/** Murmured companion lines that rotate with each breath phase, like the web. */
private val phaseMurmurs = mapOf(
    BreathPhase.Inhale to listOf(
        "Feel your chest rise with the breath of life…",
        "The Atman breathes through you — you are not the breather…",
        "Your breath is your first mantra…",
    ),
    BreathPhase.HoldIn to listOf(
        "Prana flows through you as it flows through all creation…",
        "Hold the gift gently — do not clutch it…",
    ),
    BreathPhase.Exhale to listOf(
        "Each exhale releases what no longer serves…",
        "Breathe as the ocean — full, complete, returning…",
        "Let the breath carry the weight away…",
    ),
    BreathPhase.HoldOut to listOf(
        "Rest in the stillness between the waves…",
        "Here, between two breaths, the Self remembers itself…",
    ),
)

@Composable
fun BreathworkScreen(
    pattern: BreathingPattern,
    onComplete: () -> Unit,
    onSkip: () -> Unit,
    modifier: Modifier = Modifier,
) {
    // Each tick cycles through 4 phases × N cycles.
    var cycleIndex by remember { mutableIntStateOf(0) }
    var phaseIndex by remember { mutableIntStateOf(0) }

    val phases = remember(pattern) {
        buildList {
            if (pattern.inhale > 0) add(BreathPhase.Inhale to pattern.inhale)
            if (pattern.holdIn > 0) add(BreathPhase.HoldIn to pattern.holdIn)
            if (pattern.exhale > 0) add(BreathPhase.Exhale to pattern.exhale)
            if (pattern.holdOut > 0) add(BreathPhase.HoldOut to pattern.holdOut)
        }
    }

    val (currentPhase, currentSeconds) = phases[phaseIndex]

    // Drive the phase timer.
    LaunchedEffect(cycleIndex, phaseIndex) {
        delay(currentSeconds * 1000L)
        val nextPhaseIndex = phaseIndex + 1
        if (nextPhaseIndex >= phases.size) {
            val nextCycle = cycleIndex + 1
            if (nextCycle >= pattern.cycles) {
                onComplete()
            } else {
                phaseIndex = 0
                cycleIndex = nextCycle
            }
        } else {
            phaseIndex = nextPhaseIndex
        }
    }

    // Rotate murmur line in a stable way per phase beat.
    val murmur = remember(cycleIndex, phaseIndex) {
        val pool = phaseMurmurs[currentPhase].orEmpty()
        if (pool.isEmpty()) "" else pool[(cycleIndex + phaseIndex) % pool.size]
    }

    val color = when (currentPhase) {
        BreathPhase.Inhale -> KiaanColors.BreathInhale
        BreathPhase.HoldIn -> KiaanColors.BreathHold
        BreathPhase.Exhale -> KiaanColors.BreathExhale
        BreathPhase.HoldOut -> KiaanColors.BreathRest
    }

    val target = when (currentPhase) {
        BreathPhase.Inhale -> 1f
        BreathPhase.HoldIn -> 1f
        BreathPhase.Exhale -> 0.15f
        BreathPhase.HoldOut -> 0.15f
    }
    val bloom by animateFloatAsState(
        targetValue = target,
        animationSpec = tween(durationMillis = currentSeconds * 1000, easing = LinearEasing),
        label = "bloom",
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .systemBarsPadding()
            .padding(horizontal = 24.dp),
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(24.dp))
            Text(
                text = pattern.name.uppercase(),
                style = MaterialTheme.typography.labelLarge.copy(
                    color = KiaanColors.SacredGold,
                    fontWeight = FontWeight.SemiBold,
                ),
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = pattern.description,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                ),
                textAlign = TextAlign.Center,
            )

            Spacer(Modifier.height(28.dp))

            Box(modifier = Modifier.weight(1f, fill = true), contentAlignment = Alignment.Center) {
                LotusBreath(
                    progress = bloom,
                    color = color,
                    ringColor = KiaanColors.DeepGold,
                    size = 300.dp,
                )
            }

            Text(
                text = when (currentPhase) {
                    BreathPhase.Inhale -> "श्वास लो"
                    BreathPhase.HoldIn -> "रोको"
                    BreathPhase.Exhale -> "छोड़ो"
                    BreathPhase.HoldOut -> "विश्राम"
                },
                style = MaterialTheme.typography.headlineMedium.copy(color = color),
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = currentPhase.labelEn,
                style = MaterialTheme.typography.bodyLarge,
                color = KiaanColors.TextPrimary,
                textAlign = TextAlign.Center,
            )

            Spacer(Modifier.height(16.dp))
            CycleDots(total = pattern.cycles, current = cycleIndex)

            Spacer(Modifier.height(16.dp))
            Text(
                text = murmur,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                ),
                textAlign = TextAlign.Center,
            )

            Spacer(Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = androidx.compose.foundation.layout.Arrangement.End,
            ) {
                Text(
                    text = "Skip →",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = KiaanColors.TextMuted,
                    ),
                    modifier = Modifier
                        .clickable(onClick = onSkip)
                        .padding(8.dp),
                )
            }
        }
    }
}

@Composable
private fun CycleDots(total: Int, current: Int) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        for (i in 0 until total) {
            val color = when {
                i < current -> KiaanColors.SacredGold
                i == current -> KiaanColors.BreathInhale
                else -> KiaanColors.TextMuted.copy(alpha = 0.5f)
            }
            Box(
                modifier = Modifier
                    .padding(horizontal = 4.dp)
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(color),
            )
        }
    }
}
