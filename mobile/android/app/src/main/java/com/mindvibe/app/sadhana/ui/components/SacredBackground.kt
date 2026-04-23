package com.mindvibe.app.sadhana.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.mindvibe.app.ui.theme.KiaanColors
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

/**
 * Deep-cosmos backdrop. A radial gradient plus a sparse field of drifting
 * twinkles approximates the "night sky over Varanasi" feel of kiaanverse.com.
 *
 * [moodTint] is optional — when a mood is selected the canvas is gently
 * tinted toward that mood's color, exactly as the web does.
 */
@Composable
fun SacredBackground(
    modifier: Modifier = Modifier,
    moodTint: Color? = null,
) {
    // Stable random star positions across recompositions.
    val stars = remember {
        val rng = Random(17)
        List(60) {
            Star(
                x = rng.nextFloat(),
                y = rng.nextFloat(),
                baseRadius = rng.nextFloat() * 1.6f + 0.6f,
                twinkleOffset = rng.nextFloat(),
                hue = if (rng.nextFloat() < 0.2f) KiaanColors.SacredGold else Color.White,
            )
        }
    }

    val transition = rememberInfiniteTransition(label = "starsTwinkle")
    val phase by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 6_000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "phase",
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(KiaanColors.CosmosBlack),
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            // Deep-cosmos radial gradient centered high, like the web.
            val radialBrush = Brush.radialGradient(
                colors = listOf(
                    KiaanColors.VioletNight,
                    KiaanColors.DeepIndigo,
                    KiaanColors.CosmosBlack,
                ),
                center = Offset(size.width / 2f, size.height * 0.35f),
                radius = size.maxDimension * 0.85f,
            )
            drawRect(radialBrush)

            // Optional mood tint — soft, never more than 8% opacity.
            moodTint?.let { tint ->
                drawRect(
                    Brush.radialGradient(
                        colors = listOf(tint.copy(alpha = 0.08f), Color.Transparent),
                        center = Offset(size.width / 2f, size.height / 2f),
                        radius = size.minDimension * 0.7f,
                    ),
                )
            }

            // Twinkling stars.
            stars.forEach { star ->
                val t = ((phase + star.twinkleOffset) % 1f)
                val alpha = 0.25f + 0.6f * (0.5f + 0.5f * sin(t * 2 * Math.PI.toFloat()))
                val r = star.baseRadius * (0.85f + 0.3f * cos(t * 2 * Math.PI.toFloat()))
                drawCircle(
                    color = star.hue.copy(alpha = alpha),
                    radius = r,
                    center = Offset(star.x * size.width, star.y * size.height),
                )
            }
        }
    }
}

private data class Star(
    val x: Float,
    val y: Float,
    val baseRadius: Float,
    val twinkleOffset: Float,
    val hue: Color,
)
