package com.mindvibe.app.journey.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindvibe.app.journey.data.DailyWisdomContent
import com.mindvibe.app.journey.data.JourneyContent
import com.mindvibe.app.journey.model.WeeklyStatus
import com.mindvibe.app.journey.model.WeeklyTeaching
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale
import com.mindvibe.app.journey.ui.components.GoldDivider
import com.mindvibe.app.journey.ui.components.SectionEyebrow
import com.mindvibe.app.journey.ui.components.SerifItalic
import com.mindvibe.app.journey.ui.components.VSpace
import com.mindvibe.app.ui.theme.KiaanColors

@Composable
fun WisdomScreen() {
    Column(
        Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp)
            .padding(top = 16.dp, bottom = 24.dp),
    ) {
        WisdomHeroHeader()
        VSpace(20.dp)
        SakhaReflectionCard()
        VSpace(28.dp)
        ThisWeeksTeachingsSection()
        VSpace(28.dp)
        FooterShloka()
    }
}

/** Date-stamped hero header — "आज का ज्ञान" + "Today's Divine Wisdom". */
@Composable
private fun WisdomHeroHeader() {
    val today = LocalDate.now()
    val dateLine = today.format(
        DateTimeFormatter.ofPattern("EEEE, d MMMM yyyy", Locale.ENGLISH),
    )
    Column(
        Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            "आज का ज्ञान",
            style = MaterialTheme.typography.headlineMedium.copy(
                color = KiaanColors.SacredGold,
                fontStyle = FontStyle.Italic,
                fontSize = 22.sp,
            ),
        )
        VSpace(4.dp)
        Text(
            "Today's Divine Wisdom",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = KiaanColors.TextSecondary,
                fontSize = 12.sp,
            ),
        )
        VSpace(2.dp)
        Text(
            dateLine,
            style = MaterialTheme.typography.labelSmall.copy(
                color = KiaanColors.TextMuted,
                fontSize = 10.sp,
            ),
        )
    }
}

// ============================================================================
// Sakha Reflection (hero)
// ============================================================================

@Composable
private fun SakhaReflectionCard() {
    // Daily rotation. The catalog `JourneyContent.wisdomTeaching` is the
    // anchor "ultimate teaching" used as fallback if the rotation list is
    // ever empty. In practice DailyWisdomContent ships 25 curated verses.
    val verse = DailyWisdomContent.forDate()
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF0F1336),
                        Color(0xFF0A0D1F),
                    ),
                ),
            )
            .border(1.dp, KiaanColors.SacredGold.copy(alpha = 0.3f), RoundedCornerShape(24.dp))
            .padding(horizontal = 22.dp, vertical = 28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            verse.citation,
            style = MaterialTheme.typography.labelSmall.copy(
                color = KiaanColors.SacredGold,
                letterSpacing = 2.sp,
                fontSize = 12.sp,
            ),
        )
        VSpace(8.dp)
        // Sanskrit transliteration on its own line, italic
        Text(
            verse.sanskrit,
            style = MaterialTheme.typography.bodyMedium.copy(
                color = KiaanColors.SacredGold.copy(alpha = 0.85f),
                fontStyle = FontStyle.Italic,
                fontSize = 13.sp,
                lineHeight = 22.sp,
            ),
            textAlign = TextAlign.Center,
        )
        VSpace(12.dp)
        GoldDivider()
        VSpace(18.dp)
        Text(
            verse.translation,
            style = MaterialTheme.typography.bodyLarge.copy(
                color = KiaanColors.TextSecondary,
                lineHeight = 26.sp,
                fontSize = 17.sp,
            ),
            textAlign = TextAlign.Center,
        )
        VSpace(18.dp)
        GoldDivider()
        VSpace(20.dp)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("✦", color = KiaanColors.SacredGold, fontSize = 14.sp)
            Spacer(Modifier.width(6.dp))
            SectionEyebrow("Sakha's Reflection", color = KiaanColors.SacredGold)
        }
        VSpace(14.dp)
        Row {
            Box(
                Modifier
                    .width(2.dp)
                    .height(120.dp)
                    .background(KiaanColors.SacredGold.copy(alpha = 0.5f)),
            )
            Spacer(Modifier.width(12.dp))
            SerifItalic(
                text = verse.kiaanReflection,
                fontSize = 17.sp,
                color = KiaanColors.TextPrimary,
            )
        }
        VSpace(20.dp)
        Column(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(KiaanColors.CosmosBlack.copy(alpha = 0.6f))
                .border(1.dp, KiaanColors.TextSecondary.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
                .padding(18.dp),
        ) {
            Text(
                "Sit with this question:",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                ),
            )
            VSpace(8.dp)
            SerifItalic(
                text = verse.contemplation,
                fontSize = 19.sp,
                color = KiaanColors.TextPrimary,
            )
        }
        VSpace(16.dp)
        Icon(
            Icons.AutoMirrored.Filled.VolumeUp,
            contentDescription = "Play audio",
            tint = KiaanColors.SacredGold,
            modifier = Modifier.size(26.dp),
        )
    }
}

// ============================================================================
// This Week's Teachings (horizontal day cards)
// ============================================================================

@Composable
private fun ThisWeeksTeachingsSection() {
    SectionEyebrow("This Week's Teachings")
    VSpace(12.dp)
    val today = LocalDate.now()
    Row(
        Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        DailyWisdomContent.lastSevenDays(today).forEach { (date, _verse) ->
            val short = date.dayOfWeek
                .getDisplayName(java.time.format.TextStyle.SHORT, Locale.ENGLISH)
            val status = when {
                date.isEqual(today) -> WeeklyStatus.Today
                date.isBefore(today) -> WeeklyStatus.Past
                else -> WeeklyStatus.Upcoming
            }
            WeekTile(
                tile = WeeklyTeaching(
                    dayOfWeekShort = short,
                    dayOfMonth = date.dayOfMonth,
                    status = status,
                ),
            )
        }
    }
}

@Composable
private fun WeekTile(tile: WeeklyTeaching) {
    val isToday = tile.status == WeeklyStatus.Today
    val border = if (isToday) KiaanColors.SacredGold else KiaanColors.TextSecondary.copy(alpha = 0.15f)
    Column(
        Modifier
            .width(120.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(KiaanColors.CosmosBlack.copy(alpha = 0.5f))
            .border(1.dp, border, RoundedCornerShape(16.dp))
            .padding(vertical = 18.dp, horizontal = 14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            tile.dayOfWeekShort,
            style = MaterialTheme.typography.bodyMedium.copy(
                color = KiaanColors.TextSecondary,
            ),
        )
        VSpace(6.dp)
        Text(
            tile.dayOfMonth.toString(),
            style = MaterialTheme.typography.displayMedium.copy(
                color = KiaanColors.TextPrimary,
                fontWeight = FontWeight.Light,
                fontSize = 28.sp,
            ),
        )
        VSpace(6.dp)
        Text(
            when (tile.status) {
                WeeklyStatus.Past -> "Past"
                WeeklyStatus.Today -> "Today"
                WeeklyStatus.Upcoming -> "Soon"
            },
            style = MaterialTheme.typography.bodyMedium.copy(
                color = when (tile.status) {
                    WeeklyStatus.Today -> KiaanColors.SacredGold
                    else -> KiaanColors.TextMuted
                },
                fontStyle = FontStyle.Italic,
                fontSize = 13.sp,
            ),
        )
    }
}

// ============================================================================
// Footer shloka
// ============================================================================

@Composable
private fun FooterShloka() {
    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            JourneyContent.FOOTER_SHLOKA_DEVANAGARI,
            style = MaterialTheme.typography.bodyLarge.copy(
                color = KiaanColors.DeepGold.copy(alpha = 0.85f),
                fontStyle = FontStyle.Italic,
                fontSize = 15.sp,
            ),
            textAlign = TextAlign.Center,
        )
        VSpace(6.dp)
        Text(
            JourneyContent.FOOTER_SHLOKA_TRANSLATION,
            style = MaterialTheme.typography.bodyMedium.copy(
                color = KiaanColors.TextMuted,
                fontSize = 12.sp,
            ),
            textAlign = TextAlign.Center,
        )
    }
}
