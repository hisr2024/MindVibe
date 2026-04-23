package com.mindvibe.app.sadhana.ui.phases

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import com.mindvibe.app.sadhana.model.SadhanaMood
import com.mindvibe.app.sadhana.ui.components.MoodSphere
import com.mindvibe.app.sadhana.ui.components.OmGlyph
import com.mindvibe.app.ui.theme.KiaanColors
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin

/**
 * Arrival / "How do you feel today?" phase.
 *
 * 6 mood spheres orbit a central OM glyph, echoing the kiaanverse.com layout.
 * One selection triggers composition of the full practice.
 */
@Composable
fun ArrivalScreen(
    onMoodSelect: (SadhanaMood) -> Unit,
    modifier: Modifier = Modifier,
    selectedMood: SadhanaMood? = null,
    isComposing: Boolean = false,
    contentPadding: PaddingValues = PaddingValues(horizontal = 20.dp),
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .systemBarsPadding()
            .padding(contentPadding),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(24.dp))
            Text(
                text = "OM saha nāvavatu",
                style = MaterialTheme.typography.headlineMedium.copy(
                    color = KiaanColors.SacredGold,
                ),
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = "प्रभात नमस्कार",
                style = MaterialTheme.typography.bodyLarge,
                color = KiaanColors.TextPrimary,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = "Good Morning, dear seeker",
                style = MaterialTheme.typography.bodyMedium,
                color = KiaanColors.TextSecondary,
                textAlign = TextAlign.Center,
            )

            Spacer(Modifier.height(28.dp))
            Text(
                text = "How do you feel today?",
                style = MaterialTheme.typography.headlineLarge,
                color = KiaanColors.TextPrimary,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = if (isComposing) "Composing your sacred practice…"
                else "Touch the sphere that speaks to you",
                style = MaterialTheme.typography.bodyMedium,
                color = KiaanColors.TextSecondary,
                textAlign = TextAlign.Center,
                modifier = Modifier.alpha(if (isComposing) 0.9f else 0.75f),
            )

            Spacer(Modifier.height(24.dp))

            MoodMandala(
                onSelect = onMoodSelect,
                selected = selectedMood,
                enabled = !isComposing,
            )

            Spacer(Modifier.height(24.dp))
        }
    }
}

/**
 * Hexagonal mood mandala: 6 spheres evenly placed around an OM glyph.
 * We use a custom [Layout] so the geometry is precise regardless of density.
 */
@Composable
private fun MoodMandala(
    onSelect: (SadhanaMood) -> Unit,
    selected: SadhanaMood?,
    enabled: Boolean,
) {
    val moodsInOrder = listOf(
        SadhanaMood.Peaceful,   // top
        SadhanaMood.Wounded,    // upper right
        SadhanaMood.Radiant,    // lower right
        SadhanaMood.Grateful,   // bottom
        SadhanaMood.Seeking,    // lower left
        SadhanaMood.Heavy,      // upper left
    )
    // Angles in degrees, 0° = +X axis, going clockwise with -90° at top.
    val angles = listOf(-90f, -30f, 30f, 90f, 150f, 210f)

    Layout(
        content = {
            // Center OM glyph
            OmGlyph(size = 80.dp, glowing = selected == null)
            // Then spheres in order
            moodsInOrder.forEach { mood ->
                MoodSphere(
                    mood = mood,
                    onClick = { if (enabled) onSelect(mood) },
                    diameter = 96.dp,
                    selected = selected == mood,
                    dimmed = selected != null && selected != mood,
                    enabled = enabled,
                )
            }
        },
    ) { measurables, constraints ->
        val width = constraints.maxWidth
        // In a scrollable column constraints.maxHeight is unbounded — fall back
        // to width for sizing so the mandala still has a sane geometry.
        val heightForSizing = if (constraints.hasBoundedHeight) constraints.maxHeight else width
        val ringRadius = min(width, heightForSizing) * 0.38f
        val canvasH = (ringRadius * 2.6f).toInt().coerceAtLeast(1)
        val centerX = width / 2f
        val centerY = canvasH / 2f

        val unconstrained = Constraints()
        val placeables = measurables.map { it.measure(unconstrained) }

        layout(width, canvasH) {
            // Place OM at center.
            val om = placeables.first()
            om.placeRelative(
                x = (centerX - om.width / 2f).toInt(),
                y = (centerY - om.height / 2f).toInt(),
            )
            // Place 6 spheres around the ring.
            placeables.drop(1).forEachIndexed { idx, p ->
                val angleRad = Math.toRadians(angles[idx].toDouble())
                val px = centerX + (ringRadius * cos(angleRad)).toFloat() - p.width / 2f
                val py = centerY + (ringRadius * sin(angleRad)).toFloat() - p.height / 2f
                p.placeRelative(px.toInt(), py.toInt())
            }
        }
    }
}
