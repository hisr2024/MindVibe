package com.mindvibe.app.sadhana.ui.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.mindvibe.app.sadhana.model.SadhanaMood

/**
 * A glowing, selectable mood sphere.
 * - Sanskrit label top, English below — matches the web exactly.
 * - Pulses gently to invite touch.
 * - When the parent signals [selected], the sphere brightens; during [dimmed]
 *   the others fade back so the selected one can take the stage.
 */
@Composable
fun MoodSphere(
    mood: SadhanaMood,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    diameter: Dp = 104.dp,
    selected: Boolean = false,
    dimmed: Boolean = false,
    enabled: Boolean = true,
) {
    val transition = rememberInfiniteTransition(label = "sphere_${mood.id}")
    val pulse by transition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2800),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "pulse",
    )

    val alphaFactor = when {
        dimmed -> 0.18f
        selected -> 1f
        else -> 0.95f
    }

    Box(
        modifier = modifier
            .size(diameter)
            .then(if (enabled) Modifier.clickable(onClick = onClick) else Modifier)
            .drawBehind {
                val r = this.size.minDimension / 2f
                val center = Offset(this.size.width / 2f, this.size.height / 2f)

                // Soft halo extending past the sphere.
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            mood.color.copy(alpha = 0.45f * alphaFactor),
                            Color.Transparent,
                        ),
                        center = center,
                        radius = r * 1.9f * pulse,
                    ),
                    radius = r * 1.9f * pulse,
                    center = center,
                )

                // Sphere body with glass-like vertical gradient.
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            mood.color.copy(alpha = 0.95f * alphaFactor),
                            mood.color.copy(alpha = 0.55f * alphaFactor),
                            mood.color.copy(alpha = 0.15f * alphaFactor),
                        ),
                        center = Offset(center.x - r * 0.25f, center.y - r * 0.25f),
                        radius = r,
                    ),
                    radius = r * 0.92f,
                    center = center,
                )

                // Highlight
                drawCircle(
                    color = Color.White.copy(alpha = 0.25f * alphaFactor),
                    radius = r * 0.18f,
                    center = Offset(center.x - r * 0.3f, center.y - r * 0.35f),
                )
            },
        contentAlignment = Alignment.Center,
    ) {
        androidx.compose.foundation.layout.Column(
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = mood.sanskrit,
                style = MaterialTheme.typography.bodyLarge.copy(
                    fontWeight = FontWeight.Medium,
                ),
                color = Color.White.copy(alpha = 0.95f * alphaFactor),
                textAlign = TextAlign.Center,
            )
            Text(
                text = mood.label,
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.85f * alphaFactor),
                textAlign = TextAlign.Center,
            )
        }
    }
}
