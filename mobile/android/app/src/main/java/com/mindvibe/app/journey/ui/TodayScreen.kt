package com.mindvibe.app.journey.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.outlined.Circle
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindvibe.app.journey.data.JourneyContent
import com.mindvibe.app.journey.data.TodayPracticeItem
import com.mindvibe.app.journey.model.Journey
import com.mindvibe.app.journey.model.Vice
import com.mindvibe.app.journey.ui.components.AccentCard
import com.mindvibe.app.journey.ui.components.AccentCardVariant
import com.mindvibe.app.journey.ui.components.LinearProgressRail
import com.mindvibe.app.journey.ui.components.ProgressRing
import com.mindvibe.app.journey.ui.components.SectionEyebrow
import com.mindvibe.app.journey.ui.components.SerifItalic
import com.mindvibe.app.journey.ui.components.VSpace
import com.mindvibe.app.ui.theme.KiaanColors
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun TodayScreen(
    onOpenJourney: (String) -> Unit,
    onStartJourney: (String) -> Unit,
) {
    val scroll = rememberScrollState()
    Column(
        Modifier
            .fillMaxWidth()
            .verticalScroll(scroll)
            .padding(horizontal = 20.dp)
            .padding(top = 12.dp, bottom = 24.dp),
    ) {
        HeaderBlock()
        VSpace(24.dp)
        StatsRow()
        VSpace(28.dp)
        TodaysPracticeSection(onOpenJourney = onOpenJourney)
        VSpace(20.dp)
        MicroPracticeCard()
        VSpace(20.dp)
        DayStreakCard()
        VSpace(24.dp)
        ContinueYourJourneySection(onOpenJourney = onOpenJourney)
        VSpace(24.dp)
        RecommendedForYouSection(onStart = onStartJourney)
        VSpace(20.dp)
    }
}

// ============================================================================
// Header
// ============================================================================

@Composable
private fun HeaderBlock() {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "षड्रिपु",
                style = MaterialTheme.typography.headlineMedium.copy(
                    color = KiaanColors.TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                ),
            )
            Text(
                text = "  Journeys",
                style = MaterialTheme.typography.headlineMedium.copy(
                    color = KiaanColors.TextPrimary,
                    fontStyle = FontStyle.Italic,
                    fontWeight = FontWeight.Light,
                ),
            )
        }
        VSpace(4.dp)
        Text(
            "THE INNER BATTLEFIELD",
            style = MaterialTheme.typography.labelSmall.copy(
                color = KiaanColors.TextSecondary,
                letterSpacing = 3.sp,
            ),
        )
    }
    VSpace(22.dp)
    Column(Modifier.fillMaxWidth()) {
        Text(
            text = "नमस्कार",
            style = MaterialTheme.typography.displayMedium.copy(
                color = KiaanColors.SacredGold,
                fontWeight = FontWeight.SemiBold,
            ),
        )
        VSpace(2.dp)
        Text(
            text = "Your practice awaits",
            style = MaterialTheme.typography.headlineMedium.copy(
                color = KiaanColors.TextPrimary,
                fontWeight = FontWeight.SemiBold,
            ),
        )
        VSpace(4.dp)
        val today = LocalDate.now()
            .format(DateTimeFormatter.ofPattern("EEEE, d MMMM", Locale.ENGLISH))
        Text(
            text = today,
            style = MaterialTheme.typography.bodyMedium.copy(
                color = KiaanColors.TextSecondary,
            ),
        )
        VSpace(18.dp)
        Text(
            text = "अभ्यासेन तु कौन्तेय वैराग्येण",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = KiaanColors.DeepGold.copy(alpha = 0.8f),
                fontStyle = FontStyle.Italic,
            ),
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.End,
        )
    }
}

// ============================================================================
// Stats
// ============================================================================

@Composable
private fun StatsRow() {
    val stats = JourneyContent.homeStats
    Row(
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        StatTile(
            modifier = Modifier.weight(1f),
            accent = Color(0xFF6B5BE6),
            icon = "⚔",
            valueMain = stats.active.toString(),
            valueAux = "/${stats.activeMax}",
            label = "Active",
        )
        StatTile(
            modifier = Modifier.weight(1f),
            accent = Color(0xFF10B981),
            icon = "✅",
            valueMain = stats.completed.toString(),
            label = "Completed",
        )
        StatTile(
            modifier = Modifier.weight(1f),
            accent = Color(0xFFE7811F),
            icon = "🔥",
            valueMain = stats.streak.toString(),
            label = "Streak",
        )
        StatTile(
            modifier = Modifier.weight(1f),
            accent = Color(0xFFEC4899),
            icon = "📿",
            valueMain = stats.totalDays.toString(),
            label = "Days",
        )
    }
}

@Composable
private fun StatTile(
    modifier: Modifier,
    accent: Color,
    icon: String,
    valueMain: String,
    valueAux: String? = null,
    label: String,
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .background(accent.copy(alpha = 0.12f))
            .border(1.dp, accent.copy(alpha = 0.25f), RoundedCornerShape(18.dp))
            .padding(vertical = 14.dp, horizontal = 10.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(icon, fontSize = 20.sp)
        VSpace(6.dp)
        Row(verticalAlignment = Alignment.Bottom) {
            Text(
                valueMain,
                style = MaterialTheme.typography.displayMedium.copy(
                    color = accent,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 28.sp,
                ),
            )
            if (valueAux != null) {
                Text(
                    valueAux,
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = accent.copy(alpha = 0.7f),
                        fontSize = 13.sp,
                    ),
                )
            }
        }
        Text(
            label,
            style = MaterialTheme.typography.labelSmall.copy(
                color = KiaanColors.TextSecondary,
                fontSize = 11.sp,
            ),
        )
    }
}

// ============================================================================
// Today's Practice
// ============================================================================

@Composable
private fun TodaysPracticeSection(onOpenJourney: (String) -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        SectionEyebrow("Today's Practice", modifier = Modifier.weight(1f))
        Box(
            Modifier
                .clip(RoundedCornerShape(50))
                .background(KiaanColors.SacredGold.copy(alpha = 0.12f))
                .padding(horizontal = 12.dp, vertical = 4.dp),
        ) {
            Text(
                "${JourneyContent.todaysPractice.size} steps",
                style = MaterialTheme.typography.labelSmall.copy(
                    color = KiaanColors.SacredGold,
                ),
            )
        }
    }
    VSpace(14.dp)
    JourneyContent.todaysPractice.forEach { item ->
        TodayPracticeCard(item = item, onClick = { onOpenJourney(item.journeyId) })
        VSpace(12.dp)
    }
}

@Composable
private fun TodayPracticeCard(
    item: TodayPracticeItem,
    onClick: () -> Unit,
) {
    AccentCard(
        accent = item.vice.accent,
        variant = AccentCardVariant.FullBorder,
        modifier = Modifier.clickable { onClick() },
    ) {
        Text(
            item.vice.devanagari,
            style = MaterialTheme.typography.bodyMedium.copy(
                color = item.vice.accent,
                fontWeight = FontWeight.SemiBold,
            ),
        )
        VSpace(6.dp)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(
                    item.title,
                    style = MaterialTheme.typography.headlineMedium.copy(
                        color = KiaanColors.TextPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontStyle = FontStyle.Normal,
                        fontSize = 19.sp,
                        lineHeight = 26.sp,
                    ),
                )
                VSpace(6.dp)
                SerifItalic(
                    text = item.teaching,
                    color = KiaanColors.TextSecondary,
                    fontSize = 14.sp,
                )
                VSpace(6.dp)
                Text(
                    "Day ${item.dayIndex}",
                    style = MaterialTheme.typography.labelLarge.copy(
                        color = item.vice.accent,
                        fontSize = 13.sp,
                        letterSpacing = 0.sp,
                    ),
                )
            }
            Spacer(Modifier.width(12.dp))
            PrimaryPillButton(
                label = "Practice",
                color = item.vice.accent,
                onClick = onClick,
            )
        }
    }
}

@Composable
private fun PrimaryPillButton(
    label: String,
    color: Color,
    onClick: () -> Unit,
) {
    Row(
        Modifier
            .clip(RoundedCornerShape(14.dp))
            .background(color)
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            label,
            style = MaterialTheme.typography.labelLarge.copy(
                color = Color.Black,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.sp,
                fontSize = 14.sp,
            ),
        )
        Spacer(Modifier.width(6.dp))
        Icon(
            Icons.Default.ArrowForward,
            contentDescription = null,
            tint = Color.Black,
            modifier = Modifier.size(14.dp),
        )
    }
}

// ============================================================================
// Micro Practice
// ============================================================================

@Composable
private fun MicroPracticeCard() {
    val mp = JourneyContent.microPractice
    AccentCard(accent = mp.accent, variant = AccentCardVariant.LeftRail) {
        SectionEyebrow("Micro Practice", color = mp.accent)
        VSpace(8.dp)
        SerifItalic(
            text = mp.label,
            fontSize = 22.sp,
            color = KiaanColors.TextPrimary,
        )
        VSpace(6.dp)
        Text(
            mp.principle,
            style = MaterialTheme.typography.bodyMedium.copy(
                color = KiaanColors.TextSecondary,
            ),
        )
        VSpace(10.dp)
        Text(
            mp.body,
            style = MaterialTheme.typography.bodyLarge.copy(
                color = KiaanColors.TextPrimary,
                lineHeight = 24.sp,
            ),
        )
    }
}

// ============================================================================
// Day Streak
// ============================================================================

@Composable
private fun DayStreakCard() {
    Box(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .border(1.dp, KiaanColors.TextSecondary.copy(alpha = 0.15f), RoundedCornerShape(20.dp))
            .background(KiaanColors.CosmosBlack.copy(alpha = 0.6f))
            .padding(horizontal = 18.dp, vertical = 18.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Filled.LocalFireDepartment,
                        contentDescription = null,
                        tint = Color(0xFFE7811F),
                        modifier = Modifier.size(28.dp),
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        JourneyContent.homeStats.streak.toString(),
                        style = MaterialTheme.typography.displayMedium.copy(
                            color = Color(0xFFE7811F),
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 28.sp,
                        ),
                    )
                }
                VSpace(2.dp)
                Text(
                    "Day streak",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = KiaanColors.TextSecondary,
                    ),
                )
            }
            Spacer(Modifier.width(16.dp))
            StreakGrid(modifier = Modifier.weight(1f))
        }
    }
}

@Composable
private fun StreakGrid(modifier: Modifier = Modifier) {
    val tiles = JourneyContent.weekStreak
    Column(modifier = modifier, horizontalAlignment = Alignment.End) {
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            tiles.forEach { t ->
                Text(
                    t.label,
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = KiaanColors.TextSecondary,
                        fontSize = 11.sp,
                    ),
                    modifier = Modifier
                        .width(28.dp)
                        .padding(bottom = 4.dp),
                    textAlign = TextAlign.Center,
                )
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            tiles.forEach { t ->
                StreakCell(completed = t.completed, isToday = t.isToday, dotted = false)
            }
        }
        Spacer(Modifier.height(6.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            tiles.forEachIndexed { i, _ ->
                StreakCell(
                    completed = i == 2,   // replicate the second-row active tile on W
                    isToday = i == 6,
                    dotted = false,
                )
            }
        }
    }
}

@Composable
private fun StreakCell(completed: Boolean, isToday: Boolean, dotted: Boolean) {
    val fill = when {
        completed -> Color(0xFFB98824).copy(alpha = 0.85f)
        else -> Color.White.copy(alpha = 0.04f)
    }
    val border = when {
        isToday -> Color(0xFFE7811F)
        else -> Color.White.copy(alpha = 0.12f)
    }
    Box(
        Modifier
            .size(28.dp)
            .clip(RoundedCornerShape(6.dp))
            .background(fill)
            .border(1.5.dp, border, RoundedCornerShape(6.dp)),
    )
}

// ============================================================================
// Continue Your Journey
// ============================================================================

@Composable
private fun ContinueYourJourneySection(onOpenJourney: (String) -> Unit) {
    SectionEyebrow("Continue Your Journey")
    VSpace(12.dp)
    Row(
        Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        JourneyContent.journeys.filter { it.isActive }.forEach { j ->
            ContinueJourneyCard(j = j, onClick = { onOpenJourney(j.id) })
        }
    }
}

@Composable
private fun ContinueJourneyCard(j: Journey, onClick: () -> Unit) {
    Column(
        Modifier
            .width(280.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(j.vice.surface)
            .border(1.dp, j.vice.accent.copy(alpha = 0.35f), RoundedCornerShape(18.dp))
            .clickable { onClick() }
            .padding(16.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                j.vice.devanagari,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = j.vice.accent,
                    fontWeight = FontWeight.SemiBold,
                ),
            )
            Spacer(Modifier.width(8.dp))
            Text(
                j.vice.englishName,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = j.vice.accent,
                ),
            )
            Spacer(Modifier.weight(1f))
            Box(
                Modifier
                    .clip(RoundedCornerShape(50))
                    .background(KiaanColors.CosmosBlack.copy(alpha = 0.6f))
                    .padding(horizontal = 10.dp, vertical = 4.dp),
            ) {
                Text(
                    "Active",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = KiaanColors.TextPrimary,
                        fontSize = 10.sp,
                    ),
                )
            }
        }
        VSpace(14.dp)
        Text(
            j.title,
            style = MaterialTheme.typography.headlineMedium.copy(
                color = KiaanColors.TextPrimary,
                fontWeight = FontWeight.SemiBold,
                fontStyle = FontStyle.Normal,
                fontSize = 20.sp,
            ),
        )
        VSpace(18.dp)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                LinearProgressRail(
                    progress = j.progressPercent / 100f,
                    color = j.vice.accent,
                )
                VSpace(8.dp)
                Row {
                    Text(
                        "Day ${j.currentDay} of ${j.durationDays}",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = KiaanColors.TextSecondary,
                        ),
                    )
                    Spacer(Modifier.weight(1f))
                    Text(
                        "${j.progressPercent}%",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = j.vice.accent,
                            fontWeight = FontWeight.SemiBold,
                        ),
                    )
                }
            }
            Spacer(Modifier.width(12.dp))
            ProgressRing(
                progress = j.progressPercent / 100f,
                color = j.vice.accent,
                centerLabel = "${j.progressPercent}%",
                size = 56.dp,
            )
        }
    }
}

// ============================================================================
// Recommended
// ============================================================================

@Composable
private fun RecommendedForYouSection(onStart: (String) -> Unit) {
    SectionEyebrow("Recommended For You")
    VSpace(12.dp)
    Row(
        Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        JourneyContent.recommended.forEach { j ->
            RecommendedCard(j = j, onClick = { onStart(j.id) })
        }
    }
}

@Composable
private fun RecommendedCard(j: Journey, onClick: () -> Unit) {
    Column(
        Modifier
            .width(240.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(KiaanColors.CosmosBlack.copy(alpha = 0.7f))
            .border(1.dp, j.vice.accent.copy(alpha = 0.3f), RoundedCornerShape(18.dp))
            .padding(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                j.vice.devanagari,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = j.vice.accent,
                    fontSize = 13.sp,
                    fontStyle = FontStyle.Italic,
                ),
            )
            Spacer(Modifier.width(6.dp))
            Text(
                j.vice.englishName,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = j.vice.accent,
                    fontSize = 12.sp,
                    fontStyle = FontStyle.Italic,
                ),
            )
        }
        VSpace(10.dp)
        Text(
            j.title,
            style = MaterialTheme.typography.headlineMedium.copy(
                color = KiaanColors.TextPrimary,
                fontStyle = FontStyle.Normal,
                fontWeight = FontWeight.SemiBold,
                fontSize = 18.sp,
            ),
        )
        VSpace(4.dp)
        Text(
            "${j.durationDays} days",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = KiaanColors.TextSecondary,
            ),
        )
        VSpace(14.dp)
        Row(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(j.vice.accent)
                .clickable { onClick() }
                .padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.Center,
        ) {
            Text(
                "Start",
                style = MaterialTheme.typography.labelLarge.copy(
                    color = Color.Black,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.sp,
                    fontSize = 14.sp,
                ),
            )
            Spacer(Modifier.width(6.dp))
            Icon(
                Icons.Default.ArrowForward,
                contentDescription = null,
                tint = Color.Black,
                modifier = Modifier.size(14.dp),
            )
        }
    }
}
