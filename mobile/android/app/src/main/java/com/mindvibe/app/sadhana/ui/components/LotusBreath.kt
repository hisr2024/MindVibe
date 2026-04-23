package com.mindvibe.app.sadhana.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Animated lotus flower used throughout the Breathwork phase.
 *
 * The flower has eight petals. [progress] drives the bloom (0 = tight bud,
 * 1 = fully opened). [color] is the current phase color (cyan for inhale,
 * amber for exhale, etc.). The enclosing gold ring breathes in sync.
 */
@Composable
fun LotusBreath(
    progress: Float,
    color: Color,
    ringColor: Color,
    modifier: Modifier = Modifier,
    size: Dp = 280.dp,
) {
    val p = progress.coerceIn(0f, 1f)

    Box(modifier = modifier.size(size)) {
        Canvas(modifier = Modifier.size(size)) {
            val radius = this.size.minDimension / 2f
            val center = Offset(this.size.width / 2f, this.size.height / 2f)

            // Guide ring
            drawCircle(
                color = ringColor.copy(alpha = 0.55f),
                radius = radius * 0.96f,
                center = center,
                style = Stroke(width = 1.5f),
            )

            // Outer petal layer — 8 petals
            val outerPetalLen = radius * (0.45f + 0.55f * p)
            drawPetalLayer(
                center = center,
                petalCount = 8,
                petalLengthPx = outerPetalLen,
                petalWidthPx = radius * 0.26f,
                color = color.copy(alpha = 0.85f),
                rotationOffsetDeg = 0f,
            )

            // Mid petal layer — 8 petals rotated 22.5°
            val midPetalLen = radius * (0.3f + 0.5f * p)
            drawPetalLayer(
                center = center,
                petalCount = 8,
                petalLengthPx = midPetalLen,
                petalWidthPx = radius * 0.22f,
                color = color.copy(alpha = 0.6f),
                rotationOffsetDeg = 22.5f,
            )

            // Inner petal layer — subtle
            val innerPetalLen = radius * (0.2f + 0.35f * p)
            drawPetalLayer(
                center = center,
                petalCount = 8,
                petalLengthPx = innerPetalLen,
                petalWidthPx = radius * 0.16f,
                color = color.copy(alpha = 0.4f),
                rotationOffsetDeg = 45f,
            )

            // Golden bindu (center dot) — the self-luminous core.
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        Color(0xFFF7CF4A),
                        Color(0xFFB98824),
                    ),
                    center = center,
                    radius = radius * 0.12f,
                ),
                radius = radius * 0.11f,
                center = center,
            )
        }
    }
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawPetalLayer(
    center: Offset,
    petalCount: Int,
    petalLengthPx: Float,
    petalWidthPx: Float,
    color: Color,
    rotationOffsetDeg: Float,
) {
    val degStep = 360f / petalCount
    for (i in 0 until petalCount) {
        rotate(degrees = rotationOffsetDeg + i * degStep, pivot = center) {
            val path = Path().apply {
                moveTo(center.x, center.y)
                cubicTo(
                    center.x - petalWidthPx, center.y - petalLengthPx * 0.35f,
                    center.x - petalWidthPx * 0.5f, center.y - petalLengthPx * 0.9f,
                    center.x, center.y - petalLengthPx,
                )
                cubicTo(
                    center.x + petalWidthPx * 0.5f, center.y - petalLengthPx * 0.9f,
                    center.x + petalWidthPx, center.y - petalLengthPx * 0.35f,
                    center.x, center.y,
                )
                close()
            }
            drawPath(path = path, color = color)
        }
    }
}

