package com.mindvibe.app.emotionalreset.ui.components

import android.graphics.Paint
import android.graphics.Typeface
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindvibe.app.emotionalreset.model.FeelingState
import com.mindvibe.app.ui.theme.KiaanColors
import kotlin.math.PI
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.sin

/**
 * 12-petal sacred mandala — 8 primary feelings on the outer ring + 4
 * nuanced feelings on an inner ring. Tapping a petal selects it and the
 * gold center glow brightens. Mirrors kiaanverse.com's feeling mandala.
 *
 * Labels and petals are drawn directly onto one Canvas so geometry stays
 * in sync under every density and orientation.
 */
@Composable
fun FeelingMandala(
    selected: FeelingState?,
    onSelect: (FeelingState) -> Unit,
    modifier: Modifier = Modifier,
    size: Dp = 340.dp,
) {
    val transition = rememberInfiniteTransition(label = "mandalaPulse")
    val pulse by transition.animateFloat(
        initialValue = 0.9f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(
            animation = tween(3200),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "pulse",
    )

    val density = LocalDensity.current
    val labelPaintPrimary = remember(density) {
        Paint().apply {
            isAntiAlias = true
            color = Color.White.copy(alpha = 0.72f).toArgb()
            textSize = with(density) { 11.sp.toPx() }
            typeface = Typeface.SANS_SERIF
            textAlign = Paint.Align.CENTER
        }
    }
    val labelPaintSecondary = remember(density) {
        Paint().apply {
            isAntiAlias = true
            color = Color.White.copy(alpha = 0.55f).toArgb()
            textSize = with(density) { 9.sp.toPx() }
            typeface = Typeface.SANS_SERIF
            textAlign = Paint.Align.CENTER
        }
    }
    val sanskritPaintPrimary = remember(density) {
        Paint().apply {
            isAntiAlias = true
            color = KiaanColors.SacredGold.copy(alpha = 0.85f).toArgb()
            textSize = with(density) { 10.sp.toPx() }
            typeface = Typeface.SERIF
            textAlign = Paint.Align.CENTER
        }
    }

    BoxWithConstraints(
        modifier = modifier.fillMaxWidth(),
        contentAlignment = Alignment.Center,
    ) {
        val diameterDp: Dp = if (maxWidth < size) maxWidth else size

        Box(
            modifier = Modifier
                .size(diameterDp)
                .pointerInput(Unit) {
                    detectTapGestures { offset ->
                        val px = this.size.width.toFloat()
                        val py = this.size.height.toFloat()
                        val cx = px / 2f
                        val cy = py / 2f
                        val dx = offset.x - cx
                        val dy = offset.y - cy
                        val dist = hypot(dx, dy)
                        if (dist < px * 0.10f) return@detectTapGestures
                        val angle = ((Math.toDegrees(atan2(dy, dx).toDouble()) + 360) % 360).toFloat()
                        val ring = if (dist > px * 0.40f) 2 else 1
                        val hit = FeelingState.values()
                            .filter { it.ring == ring }
                            .minByOrNull { shortestAngle(it.angleDeg, angle) }
                        hit?.let(onSelect)
                    }
                }
                .drawBehind {
                    val cx = this.size.width / 2f
                    val cy = this.size.height / 2f
                    val outerR = this.size.minDimension * 0.50f
                    val innerR = this.size.minDimension * 0.36f

                    // Guide rings (very subtle).
                    drawCircle(
                        color = Color.White.copy(alpha = 0.04f),
                        radius = outerR,
                        center = Offset(cx, cy),
                        style = Stroke(width = 0.6f),
                    )
                    drawCircle(
                        color = Color.White.copy(alpha = 0.03f),
                        radius = innerR,
                        center = Offset(cx, cy),
                        style = Stroke(width = 0.6f),
                    )

                    // Center glow.
                    val centerAlpha = if (selected != null) 0.40f else 0.18f
                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(
                                KiaanColors.SacredGold.copy(alpha = centerAlpha),
                                Color.Transparent,
                            ),
                            center = Offset(cx, cy),
                            radius = this.size.minDimension * 0.20f * pulse,
                        ),
                        radius = this.size.minDimension * 0.20f * pulse,
                        center = Offset(cx, cy),
                    )

                    // Petals: draw ring 2 (nuanced, inner) first so ring 1 sits on top.
                    FeelingState.values()
                        .sortedBy { if (it.ring == 1) 1 else 0 }
                        .forEach { feeling ->
                            drawPetal(
                                center = Offset(cx, cy),
                                boxSize = this.size.minDimension,
                                feeling = feeling,
                                selected = selected?.id == feeling.id,
                                pulse = pulse,
                            )
                        }

                    // Labels: drawn with native canvas so the geometry matches.
                    val native = drawContext.canvas.nativeCanvas
                    FeelingState.values().forEach { feeling ->
                        val ringFactor = if (feeling.ring == 1) 0.42f else 0.565f
                        val r = this.size.minDimension * ringFactor
                        val theta = (feeling.angleDeg * PI / 180.0).toFloat()
                        val lx = cx + r * cos(theta)
                        val ly = cy + r * sin(theta)
                        val isSelected = selected?.id == feeling.id
                        val labelPaint = when {
                            isSelected -> Paint(labelPaintPrimary).apply {
                                color = feeling.glowColor.toArgb()
                            }
                            feeling.ring == 1 -> labelPaintPrimary
                            else -> labelPaintSecondary
                        }
                        native.drawText(feeling.label, lx, ly, labelPaint)
                        native.drawText(
                            feeling.sanskrit,
                            lx,
                            ly + labelPaint.textSize + 2f,
                            sanskritPaintPrimary,
                        )
                    }
                },
        )
    }
}

private fun DrawScope.drawPetal(
    center: Offset,
    boxSize: Float,
    feeling: FeelingState,
    selected: Boolean,
    pulse: Float,
) {
    val ringRadius = if (feeling.ring == 1) boxSize * 0.30f else boxSize * 0.18f
    val petalLen = if (feeling.ring == 1) boxSize * 0.13f else boxSize * 0.085f
    val petalWidth = if (feeling.ring == 1) boxSize * 0.055f else boxSize * 0.036f

    val rad = (feeling.angleDeg.toDouble() * PI / 180.0).toFloat()
    val tipX = center.x + ringRadius * cos(rad)
    val tipY = center.y + ringRadius * sin(rad)

    val baseR = ringRadius - petalLen
    val baseCx = center.x + baseR * cos(rad)
    val baseCy = center.y + baseR * sin(rad)

    val perpRad = rad + (PI / 2).toFloat()
    val widthFactor = if (selected) petalWidth * pulse else petalWidth
    val leftX = baseCx + widthFactor * cos(perpRad)
    val leftY = baseCy + widthFactor * sin(perpRad)
    val rightX = baseCx - widthFactor * cos(perpRad)
    val rightY = baseCy - widthFactor * sin(perpRad)

    val path = Path().apply {
        moveTo(baseCx, baseCy)
        quadraticBezierTo(leftX, leftY, tipX, tipY)
        quadraticBezierTo(rightX, rightY, baseCx, baseCy)
        close()
    }

    if (selected) {
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(
                    feeling.glowColor.copy(alpha = 0.45f),
                    Color.Transparent,
                ),
                center = Offset(tipX, tipY),
                radius = petalLen * 1.6f,
            ),
            radius = petalLen * 1.6f,
            center = Offset(tipX, tipY),
        )
    }

    drawPath(
        path = path,
        color = if (selected) feeling.glowColor.copy(alpha = 0.85f)
        else feeling.color.copy(alpha = 0.55f),
    )
    drawPath(
        path = path,
        color = if (selected) Color.White.copy(alpha = 0.55f)
        else Color.White.copy(alpha = 0.14f),
        style = Stroke(width = if (selected) 1.4f else 0.6f),
    )
}

private fun shortestAngle(a: Float, b: Float): Float {
    val diff = ((a - b + 540f) % 360f) - 180f
    return kotlin.math.abs(diff)
}
