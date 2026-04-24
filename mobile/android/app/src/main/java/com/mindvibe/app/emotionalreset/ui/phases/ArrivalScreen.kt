package com.mindvibe.app.emotionalreset.ui.phases

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindvibe.app.ui.theme.KiaanColors
import com.mindvibe.app.ui.theme.KiaanFonts
import kotlinx.coroutines.delay

/**
 * Entry ritual. A sacred ripple expands outward from the center, the ॐ
 * glyph pulses, and after ~1.6 s the host advances to the Mandala phase.
 * Mirrors kiaanverse.com's emotional-reset arrival (SacredOMLoader).
 */
@Composable
fun EmotionalResetArrivalScreen(
    onArrivalComplete: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val transition = rememberInfiniteTransition(label = "arrivalRipple")
    val ripple by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2000),
            repeatMode = RepeatMode.Restart,
        ),
        label = "ripple",
    )
    val omPulse by transition.animateFloat(
        initialValue = 0.55f,
        targetValue = 0.95f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2000),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "omPulse",
    )

    LaunchedEffect(Unit) {
        delay(1600L)
        onArrivalComplete()
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .systemBarsPadding()
            .padding(horizontal = 32.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier.size(220.dp),
                contentAlignment = Alignment.Center,
            ) {
                Canvas(modifier = Modifier.size(220.dp)) {
                    val center = Offset(size.width / 2f, size.height / 2f)
                    val maxR = size.minDimension / 2f

                    // Two expanding ripples 180° out of phase.
                    listOf(0f, 0.5f).forEach { offsetFrac ->
                        val t = (ripple + offsetFrac) % 1f
                        val radius = maxR * (0.2f + 0.8f * t)
                        val alpha = (1f - t) * 0.55f
                        drawCircle(
                            color = KiaanColors.SacredGold.copy(alpha = alpha),
                            radius = radius,
                            center = center,
                            style = Stroke(width = 1.5f),
                        )
                    }

                    // Soft halo around Om.
                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(
                                KiaanColors.SacredGold.copy(alpha = 0.3f * omPulse),
                                Color.Transparent,
                            ),
                            center = center,
                            radius = maxR * 0.45f,
                        ),
                        radius = maxR * 0.45f,
                        center = center,
                    )
                }

                Text(
                    text = "ॐ",
                    style = TextStyle(
                        fontFamily = KiaanFonts.Serif,
                        fontSize = 72.sp,
                        color = KiaanColors.SacredGold.copy(alpha = 0.8f + 0.2f * omPulse),
                    ),
                )
            }

            Spacer(Modifier.height(28.dp))

            Text(
                text = "Entering sacred space…",
                style = MaterialTheme.typography.bodyLarge.copy(
                    color = KiaanColors.TextSecondary,
                    fontStyle = FontStyle.Italic,
                ),
            )
        }
    }
}
