package com.mindvibe.app.emotionalreset.ui.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.mindvibe.app.ui.theme.KiaanColors

/**
 * The twin-sparkle ✦✦ icon shown on the Emotional Reset completion card,
 * drawn geometrically so it renders identically on every device.
 */
@Composable
fun SparkleIcon(
    modifier: Modifier = Modifier,
    size: Dp = 96.dp,
    ringColor: Color = KiaanColors.SacredGold,
    sparkleColor: Color = KiaanColors.SacredGold,
) {
    val transition = rememberInfiniteTransition(label = "sparkle")
    val pulse by transition.animateFloat(
        initialValue = 0.75f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2200),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "sparklePulse",
    )

    Box(
        modifier = modifier.size(size),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(modifier = Modifier.size(size)) {
            val center = Offset(this.size.width / 2f, this.size.height / 2f)
            val r = this.size.minDimension / 2f

            // Halo
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        sparkleColor.copy(alpha = 0.25f * pulse),
                        Color.Transparent,
                    ),
                    center = center,
                    radius = r,
                ),
                radius = r,
                center = center,
            )
            // Gold ring
            drawCircle(
                color = ringColor.copy(alpha = 0.8f),
                radius = r * 0.74f,
                center = center,
                style = Stroke(width = 1.5f),
            )

            // Large sparkle (upper-right)
            drawSparkle(
                center = Offset(center.x + r * 0.10f, center.y - r * 0.12f),
                armLen = r * 0.30f * pulse,
                armWidth = r * 0.07f,
                color = sparkleColor,
            )
            // Small sparkle (lower-left)
            drawSparkle(
                center = Offset(center.x - r * 0.18f, center.y + r * 0.18f),
                armLen = r * 0.20f * pulse,
                armWidth = r * 0.05f,
                color = sparkleColor.copy(alpha = 0.85f),
            )
        }
    }
}

/** Draws a 4-pointed sparkle (like the ✦ glyph) centered at [center]. */
private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawSparkle(
    center: Offset,
    armLen: Float,
    armWidth: Float,
    color: Color,
) {
    val path = Path().apply {
        // Vertical arm
        moveTo(center.x, center.y - armLen)
        lineTo(center.x + armWidth, center.y)
        lineTo(center.x, center.y + armLen)
        lineTo(center.x - armWidth, center.y)
        close()
        // Horizontal arm
        moveTo(center.x - armLen, center.y)
        lineTo(center.x, center.y - armWidth)
        lineTo(center.x + armLen, center.y)
        lineTo(center.x, center.y + armWidth)
        close()
    }
    drawPath(path = path, color = color)
}
