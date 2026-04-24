package com.mindvibe.app.emotionalreset.ui.phases

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindvibe.app.emotionalreset.model.BreathPattern
import com.mindvibe.app.emotionalreset.ui.components.PranayamaMandala
import com.mindvibe.app.ui.theme.KiaanColors
import kotlinx.coroutines.delay

/**
 * Phase 3 — The Breath Ritual. An adaptive pranayama mandala runs four
 * rounds of the intensity-appropriate pattern. "Skip breathing" appears
 * after ~5 s in case the user needs to move on.
 */
@Composable
fun BreathScreen(
    pattern: BreathPattern,
    onComplete: () -> Unit,
    onSkip: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var showSkip by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        delay(5_000L)
        showSkip = true
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .systemBarsPadding()
            .padding(horizontal = 24.dp, vertical = 32.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "SACRED BREATH PURIFICATION",
                style = MaterialTheme.typography.labelSmall.copy(
                    color = KiaanColors.TextMuted,
                    letterSpacing = 3.sp,
                ),
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = "${pattern.inhale}-${pattern.holdIn}-${pattern.exhale}-${pattern.holdOut}",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.SacredGold,
                ),
            )

            Spacer(Modifier.height(20.dp))

            PranayamaMandala(
                pattern = pattern,
                onComplete = onComplete,
            )

            Spacer(Modifier.height(12.dp))

            AnimatedVisibility(visible = showSkip, enter = fadeIn()) {
                TextButton(onClick = onSkip) {
                    Text(
                        text = "Skip breathing",
                        color = KiaanColors.TextMuted,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
        }
    }
}
