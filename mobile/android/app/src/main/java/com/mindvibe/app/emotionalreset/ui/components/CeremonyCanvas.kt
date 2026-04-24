package com.mindvibe.app.emotionalreset.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.util.lerp
import com.mindvibe.app.ui.theme.KiaanColors
import com.mindvibe.app.ui.theme.KiaanFonts
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

/**
 * The central ceremony visual — mirrors kiaanverse.com emotional-reset
 * release phase. A cosmic starfield with a cluster of sacred particles
 * (gold for offering, blue for peace) orbiting the ॐ at the center.
 *
 * The canvas breathes at three paces:
 *   1. Starfield:   60 deep-field stars twinkling over 6 s
 *   2. Cloud:       Near-center particles on elliptic orbits, each with its
 *                   own period so they cluster, scatter, and recluster —
 *                   exactly like the web's framer-motion rig.
 *   3. Om:          Gentle gold pulse at 2.4 s, matching OmGlyph.
 *
 * [convergeProgress] 0..1 smoothly pulls every particle toward the center
 * and fades them out. Drive it from the host when the user taps "Complete
 * Sacred Reset" to collapse the mandala into the ॐ before the result card
 * blooms.
 */
@Composable
fun CeremonyCanvas(
    modifier: Modifier = Modifier,
    convergeProgress: Float = 0f,
    moodTint: Color? = null,
    omSize: Dp = 84.dp,
    particleCount: Int = 14,
    starCount: Int = 70,
    goldColor: Color = KiaanColors.SacredGold,
    peaceColor: Color = KiaanColors.MoodPeaceful,
) {
    val particles = remember(particleCount) {
        val rng = Random(42)
        List(particleCount) { idx ->
            CeremonyParticle(
                orbitRadius = 0.08f + rng.nextFloat() * 0.22f,
                orbitEllipse = 0.6f + rng.nextFloat() * 0.5f,
                phase = rng.nextFloat(),
                periodSec = 8f + rng.nextFloat() * 10f,
                direction = if (rng.nextFloat() < 0.5f) -1f else 1f,
                radiusPx = 2.5f + rng.nextFloat() * 4f,
                isGold = idx % 3 != 0, // 2/3 gold (offering), 1/3 peace-blue
                driftX = (rng.nextFloat() - 0.5f) * 0.08f,
                driftY = (rng.nextFloat() - 0.5f) * 0.08f,
            )
        }
    }

    val stars = remember(starCount) {
        val rng = Random(17)
        List(starCount) {
            CeremonyStar(
                x = rng.nextFloat(),
                y = rng.nextFloat(),
                baseRadius = 0.5f + rng.nextFloat() * 1.6f,
                twinkleOffset = rng.nextFloat(),
                isGold = rng.nextFloat() < 0.2f,
            )
        }
    }

    val transition = rememberInfiniteTransition(label = "ceremonyCanvas")
    val phase by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 20_000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "phase",
    )
    val starPhase by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 6_000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "starPhase",
    )
    val omPulse by transition.animateFloat(
        initialValue = 0.55f,
        targetValue = 0.95f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2400),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "omPulse",
    )

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            // Deep-cosmos radial gradient (matches SacredBackground).
            val bg = Brush.radialGradient(
                colors = listOf(
                    KiaanColors.VioletNight,
                    KiaanColors.DeepIndigo,
                    KiaanColors.CosmosBlack,
                ),
                center = Offset(size.width / 2f, size.height * 0.5f),
                radius = size.maxDimension * 0.9f,
            )
            drawRect(bg)

            moodTint?.let { tint ->
                drawRect(
                    Brush.radialGradient(
                        colors = listOf(tint.copy(alpha = 0.06f), Color.Transparent),
                        center = Offset(size.width / 2f, size.height / 2f),
                        radius = size.minDimension * 0.75f,
                    ),
                )
            }

            // Starfield.
            stars.forEach { s ->
                val t = ((starPhase + s.twinkleOffset) % 1f)
                val alpha = 0.25f + 0.6f * (0.5f + 0.5f * sin(t * TWO_PI))
                val r = s.baseRadius * (0.85f + 0.3f * cos(t * TWO_PI))
                val hue = if (s.isGold) goldColor else Color.White
                drawCircle(
                    color = hue.copy(alpha = alpha * (1f - 0.6f * convergeProgress)),
                    radius = r,
                    center = Offset(s.x * size.width, s.y * size.height),
                )
            }

            // Ceremony particle cloud around the Om.
            val center = Offset(size.width / 2f, size.height * 0.5f)
            val baseRadius = size.minDimension * 0.5f
            particles.forEach { p ->
                val localT = ((phase * 20f / p.periodSec) + p.phase) % 1f
                val theta = localT * TWO_PI * p.direction
                val orbitR = baseRadius * p.orbitRadius * (1f - convergeProgress)
                val orbitY = orbitR * p.orbitEllipse
                val px = center.x + orbitR * cos(theta) + baseRadius * p.driftX * (1f - convergeProgress)
                val py = center.y + orbitY * sin(theta) + baseRadius * p.driftY * (1f - convergeProgress)

                // Converge: pull toward center, fade out.
                val converged = Offset(
                    lerp(px, center.x, convergeProgress),
                    lerp(py, center.y, convergeProgress),
                )
                val alpha = (0.55f + 0.45f * sin(theta)) * (1f - convergeProgress * 0.9f)
                val radius = p.radiusPx * (1f - 0.6f * convergeProgress)
                val color = if (p.isGold) goldColor else peaceColor

                // Halo.
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            color.copy(alpha = alpha * 0.55f),
                            Color.Transparent,
                        ),
                        center = converged,
                        radius = radius * 4f,
                    ),
                    radius = radius * 4f,
                    center = converged,
                )
                // Core.
                drawCircle(
                    color = color.copy(alpha = alpha.coerceIn(0f, 1f)),
                    radius = radius,
                    center = converged,
                )
            }

            // Om halo that brightens as particles converge.
            val haloStrength = omPulse * (0.35f + 0.65f * convergeProgress)
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        goldColor.copy(alpha = haloStrength * 0.45f),
                        Color.Transparent,
                    ),
                    center = center,
                    radius = omSize.toPx() * (1.4f + 0.8f * convergeProgress),
                ),
                radius = omSize.toPx() * (1.4f + 0.8f * convergeProgress),
                center = center,
            )

            // Gold ring around Om.
            drawCircle(
                color = goldColor.copy(alpha = omPulse),
                radius = omSize.toPx() * 0.55f,
                center = center,
                style = Stroke(width = 2f),
            )
        }

        // Om glyph drawn as text for clean Devanagari rendering.
        Box(
            modifier = Modifier.size(omSize),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "ॐ",
                style = TextStyle(
                    fontFamily = KiaanFonts.Serif,
                    fontSize = (omSize.value * 0.6f).sp,
                    color = goldColor.copy(alpha = 0.85f + 0.15f * omPulse),
                ),
            )
        }
    }
}

private data class CeremonyParticle(
    val orbitRadius: Float,
    val orbitEllipse: Float,
    val phase: Float,
    val periodSec: Float,
    val direction: Float,
    val radiusPx: Float,
    val isGold: Boolean,
    val driftX: Float,
    val driftY: Float,
)

private data class CeremonyStar(
    val x: Float,
    val y: Float,
    val baseRadius: Float,
    val twinkleOffset: Float,
    val isGold: Boolean,
)

private val TWO_PI = (2.0 * Math.PI).toFloat()

/**
 * Convenience: drive [CeremonyCanvas] through a one-shot converge animation.
 * Use when the host just wants "play the burst, then show result".
 */
@Composable
fun rememberConvergeProgress(trigger: Boolean, durationMs: Int = 2_200): Float {
    var progress by remember { mutableStateOf(0f) }
    LaunchedEffect(trigger) {
        if (!trigger) {
            progress = 0f
            return@LaunchedEffect
        }
        val start = System.currentTimeMillis()
        while (progress < 1f) {
            val elapsed = (System.currentTimeMillis() - start).toFloat()
            progress = (elapsed / durationMs).coerceIn(0f, 1f)
            kotlinx.coroutines.delay(16)
        }
    }
    return progress
}
