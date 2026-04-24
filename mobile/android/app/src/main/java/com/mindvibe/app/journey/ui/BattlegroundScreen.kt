package com.mindvibe.app.journey.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindvibe.app.journey.data.JourneyContent
import com.mindvibe.app.journey.model.Journey
import com.mindvibe.app.journey.model.Vice
import com.mindvibe.app.journey.ui.components.LinearProgressRail
import com.mindvibe.app.journey.ui.components.VSpace
import com.mindvibe.app.ui.theme.KiaanColors

/**
 * Battleground tab: the six inner adversaries laid out as a sacred
 * hexagonal mandala with 2-column progress cards below.
 */
@Composable
fun BattlegroundScreen(onOpenJourney: (String) -> Unit) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(2) }) {
            HexagonalMandala()
        }
        item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(2) }) {
            Spacer(Modifier.height(6.dp))
        }
        items(Vice.values().toList()) { vice ->
            ViceCard(vice = vice, onOpen = {
                val firstJourney = JourneyContent.journeys.firstOrNull { it.vice == vice }
                if (firstJourney != null) onOpenJourney(firstJourney.id)
            })
        }
    }
}

// ============================================================================
// Hexagonal mandala header (six vertex labels)
// ============================================================================

@Composable
private fun HexagonalMandala() {
    Box(
        Modifier
            .fillMaxWidth()
            .height(280.dp)
            .padding(horizontal = 6.dp),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(
            Modifier
                .fillMaxWidth()
                .height(260.dp),
        ) {
            val cx = size.width / 2f
            val cy = size.height / 2f
            val r = minOf(size.width, size.height) / 2.4f

            // Outer hex
            val outer = hexPoints(cx, cy, r)
            drawHex(outer, Color.White.copy(alpha = 0.10f))
            drawHex(hexPoints(cx, cy, r * 0.72f), Color.White.copy(alpha = 0.08f))
            drawHex(hexPoints(cx, cy, r * 0.45f), Color.White.copy(alpha = 0.06f))

            // Spokes
            outer.forEach { p ->
                drawLine(
                    color = Color.White.copy(alpha = 0.05f),
                    start = Offset(cx, cy),
                    end = p,
                    strokeWidth = 1f,
                )
            }

            // Central rainbow orb
            val orbR = r * 0.18f
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        Color(0xFFF0C040),
                        Color(0xFFEF4444),
                        Color(0xFFA78BFA),
                        Color(0xFF3B82F6),
                        Color(0xFF10B981),
                    ),
                    center = Offset(cx, cy),
                    radius = orbR * 1.1f,
                ),
                radius = orbR,
                center = Offset(cx, cy),
            )
        }
        // Vertex labels placed with Box alignment offsets
        HexLabel("मद", "Pride", Color(0xFF3B82F6), alignment = Alignment.TopStart)
        HexLabel("क्रोध", "Anger", Color(0xFFE7811F), alignment = Alignment.TopEnd)
        HexLabel("काम", "Desire", Color(0xFFEF4444), alignment = Alignment.CenterStart, yOffset = 0.dp)
        HexLabel("मात्सर्य", "Envy", Color(0xFFEC4899), alignment = Alignment.CenterEnd, yOffset = 0.dp)
        HexLabel("मोह", "Delusion", Color(0xFF8B5CF6), alignment = Alignment.BottomCenter, yOffset = (-6).dp)
        HexLabel("लोभ", "Greed", Color(0xFF10B981), alignment = Alignment.BottomEnd, yOffset = (-40).dp)
    }
}

@Composable
private fun HexLabel(
    dev: String,
    eng: String,
    color: Color,
    alignment: Alignment,
    yOffset: androidx.compose.ui.unit.Dp = 0.dp,
) {
    Box(Modifier.fillMaxWidth().height(280.dp)) {
        Column(
            Modifier
                .align(alignment)
                .padding(vertical = 12.dp, horizontal = 8.dp)
                .offset(y = yOffset),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                dev,
                style = MaterialTheme.typography.headlineMedium.copy(
                    color = color,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 18.sp,
                ),
            )
            Text(
                eng,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                    fontSize = 12.sp,
                ),
            )
        }
    }
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawHex(
    pts: List<Offset>,
    color: Color,
) {
    for (i in pts.indices) {
        val a = pts[i]
        val b = pts[(i + 1) % pts.size]
        drawLine(color = color, start = a, end = b, strokeWidth = 1.2f)
    }
}

private fun hexPoints(cx: Float, cy: Float, r: Float): List<Offset> =
    (0 until 6).map { i ->
        val angle = Math.PI / 3.0 * i - Math.PI / 2
        Offset(cx + (r * Math.cos(angle)).toFloat(), cy + (r * Math.sin(angle)).toFloat())
    }

// ============================================================================
// Vice card
// ============================================================================

@Composable
private fun ViceCard(vice: Vice, onOpen: () -> Unit) {
    // Aggregate progress across all journeys of this vice
    val journeys: List<Journey> = JourneyContent.journeys.filter { it.vice == vice }
    val anyActive = journeys.any { it.isActive }
    val representative = journeys.firstOrNull { it.isActive } ?: journeys.first()
    val totalDays = 30
    val progressed = representative.currentDay.coerceIn(0, totalDays)
    val progress = progressed.toFloat() / totalDays

    Column(
        Modifier
            .clip(RoundedCornerShape(18.dp))
            .background(vice.surface)
            .border(1.dp, vice.accent.copy(alpha = 0.4f), RoundedCornerShape(18.dp))
            .clickable { onOpen() }
            .padding(16.dp),
    ) {
        Row(verticalAlignment = Alignment.Top) {
            Text(
                vice.devanagari,
                style = MaterialTheme.typography.displayLarge.copy(
                    color = vice.accent,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 26.sp,
                ),
                modifier = Modifier.weight(1f),
            )
            Box(
                Modifier
                    .clip(RoundedCornerShape(50))
                    .background(vice.accent.copy(alpha = 0.15f))
                    .border(1.dp, vice.accent.copy(alpha = 0.5f), RoundedCornerShape(50))
                    .padding(horizontal = 10.dp, vertical = 4.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier
                            .size(6.dp)
                            .clip(RoundedCornerShape(50))
                            .background(vice.accent),
                    )
                    Spacer(Modifier.size(width = 4.dp, height = 0.dp))
                    Text(
                        if (anyActive) "ACTIVE" else "DORMANT",
                        style = MaterialTheme.typography.labelSmall.copy(
                            color = vice.accent,
                            fontSize = 9.sp,
                            letterSpacing = 1.sp,
                        ),
                    )
                }
            }
        }
        VSpace(4.dp)
        Text(
            vice.englishName,
            style = MaterialTheme.typography.headlineMedium.copy(
                color = KiaanColors.TextPrimary,
                fontStyle = FontStyle.Normal,
                fontWeight = FontWeight.SemiBold,
                fontSize = 20.sp,
            ),
        )
        VSpace(30.dp)
        LinearProgressRail(progress = progress, color = vice.accent)
        VSpace(6.dp)
        Row {
            Text(
                "Day $progressed of $totalDays",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                ),
            )
            Spacer(Modifier.weight(1f))
            Text(
                "${(progress * 100).toInt()}%",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = vice.accent,
                    fontWeight = FontWeight.SemiBold,
                ),
            )
        }
    }
}
