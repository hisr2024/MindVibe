package com.mindvibe.app.emotionalreset.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindvibe.app.emotionalreset.model.BreathBeat
import com.mindvibe.app.emotionalreset.model.BreathPattern
import com.mindvibe.app.ui.theme.KiaanColors
import kotlinx.coroutines.delay

/**
 * Pranayama mandala — a single sacred circle that expands on inhale,
 * holds, contracts on exhale, and rests. The circumference color cycles
 * through the four phases of the breath.
 *
 * Runs [rounds] full cycles then invokes [onComplete]. Matches the web's
 * MobileBreathMandala behavior.
 */
@Composable
fun PranayamaMandala(
    pattern: BreathPattern,
    onComplete: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var beat by remember { mutableStateOf(BreathBeat.Inhale) }
    var round by remember { mutableIntStateOf(1) }
    var target by remember { mutableStateOf(0.4f) } // 0.4 min .. 1.0 max

    val scale by animateFloatAsState(
        targetValue = target,
        animationSpec = tween(
            durationMillis = when (beat) {
                BreathBeat.Inhale -> pattern.inhale * 1000
                BreathBeat.HoldIn -> pattern.holdIn * 1000
                BreathBeat.Exhale -> pattern.exhale * 1000
                BreathBeat.HoldOut -> pattern.holdOut * 1000
            },
            easing = LinearEasing,
        ),
        label = "breathScale",
    )

    LaunchedEffect(pattern) {
        round = 1
        while (round <= pattern.rounds) {
            // Inhale (expand)
            beat = BreathBeat.Inhale; target = 1.0f
            delay(pattern.inhale * 1000L)
            // Hold in
            beat = BreathBeat.HoldIn; target = 1.0f
            delay(pattern.holdIn * 1000L)
            // Exhale (contract)
            beat = BreathBeat.Exhale; target = 0.4f
            delay(pattern.exhale * 1000L)
            // Hold out
            beat = BreathBeat.HoldOut; target = 0.4f
            delay(pattern.holdOut * 1000L)
            round += 1
        }
        onComplete()
    }

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "Round ${round.coerceAtMost(pattern.rounds)} of ${pattern.rounds}",
                style = MaterialTheme.typography.labelSmall.copy(
                    color = KiaanColors.TextMuted,
                    letterSpacing = 2.sp,
                ),
            )
            Spacer(Modifier.height(16.dp))

            Box(
                modifier = Modifier.size(260.dp),
                contentAlignment = Alignment.Center,
            ) {
                Canvas(modifier = Modifier.size(260.dp)) {
                    val center = Offset(size.width / 2f, size.height / 2f)
                    val r = size.minDimension / 2f * scale

                    val color = when (beat) {
                        BreathBeat.Inhale -> KiaanColors.BreathInhale
                        BreathBeat.HoldIn -> KiaanColors.BreathHold
                        BreathBeat.Exhale -> KiaanColors.BreathExhale
                        BreathBeat.HoldOut -> KiaanColors.BreathRest
                    }

                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(
                                color.copy(alpha = 0.55f),
                                color.copy(alpha = 0.15f),
                                Color.Transparent,
                            ),
                            center = center,
                            radius = r * 1.35f,
                        ),
                        radius = r * 1.35f,
                        center = center,
                    )
                    drawCircle(
                        color = color.copy(alpha = 0.85f),
                        radius = r,
                        center = center,
                        style = Stroke(width = 2.5f),
                    )
                    drawCircle(
                        color = color.copy(alpha = 0.18f),
                        radius = r,
                        center = center,
                    )
                }

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        text = beat.labelEn,
                        style = MaterialTheme.typography.headlineMedium.copy(
                            color = Color.White,
                            fontWeight = FontWeight.Medium,
                        ),
                        textAlign = TextAlign.Center,
                    )
                    Text(
                        text = beat.labelHi,
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = KiaanColors.SacredGold,
                            fontStyle = FontStyle.Italic,
                        ),
                    )
                }
            }
        }
    }
}
