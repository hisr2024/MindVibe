package com.mindvibe.app.sadhana.ui.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindvibe.app.ui.theme.KiaanColors
import com.mindvibe.app.ui.theme.KiaanFonts

/**
 * The sacred ॐ glyph in its golden ring. A gentle pulse animation hints at
 * living prana — matches the center of the mood-sphere mandala on the web.
 */
@Composable
fun OmGlyph(
    modifier: Modifier = Modifier,
    size: Dp = 72.dp,
    glowing: Boolean = true,
    ringColor: Color = KiaanColors.SacredGold,
    glyphColor: Color = KiaanColors.SacredGold,
) {
    val transition = rememberInfiniteTransition(label = "omPulse")
    val pulse by transition.animateFloat(
        initialValue = if (glowing) 0.55f else 0.35f,
        targetValue = if (glowing) 0.95f else 0.55f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2400),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "pulse",
    )

    Box(
        modifier = modifier
            .size(size)
            .drawBehind {
                val radius = this.size.minDimension / 2f
                val center = Offset(this.size.width / 2f, this.size.height / 2f)

                // Outer halo
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            ringColor.copy(alpha = pulse * 0.35f),
                            Color.Transparent,
                        ),
                        center = center,
                        radius = radius * 1.4f,
                    ),
                    radius = radius * 1.4f,
                    center = center,
                )

                // Gold ring
                drawCircle(
                    color = ringColor.copy(alpha = pulse),
                    radius = radius * 0.9f,
                    center = center,
                    style = Stroke(width = 2f),
                )
            },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = "ॐ",
            style = TextStyle(
                fontFamily = KiaanFonts.Serif,
                fontWeight = FontWeight.Normal,
                fontSize = (size.value * 0.55f).sp,
                color = glyphColor,
            ),
        )
    }
}
