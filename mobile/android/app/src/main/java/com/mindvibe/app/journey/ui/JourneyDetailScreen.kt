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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.GpsFixed
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindvibe.app.journey.data.JourneyContent
import com.mindvibe.app.journey.model.DayStep
import com.mindvibe.app.journey.model.Journey
import com.mindvibe.app.journey.ui.components.AccentCard
import com.mindvibe.app.journey.ui.components.AccentCardVariant
import com.mindvibe.app.journey.ui.components.LinearProgressRail
import com.mindvibe.app.journey.ui.components.SectionEyebrow
import com.mindvibe.app.journey.ui.components.SerifItalic
import com.mindvibe.app.journey.ui.components.VSpace
import com.mindvibe.app.ui.theme.KiaanColors

@Composable
fun JourneyDetailScreen(
    journeyId: String,
    onBack: () -> Unit,
) {
    val journey = remember(journeyId) { JourneyContent.journey(journeyId) }
    var selectedDay by remember(journeyId) { mutableIntStateOf(journey.currentDay.coerceAtLeast(1)) }
    var showCompletion by remember(journeyId, selectedDay) { androidx.compose.runtime.mutableStateOf(false) }
    val step = journey.steps[(selectedDay - 1).coerceIn(0, journey.steps.lastIndex)]

    Column(Modifier.fillMaxWidth()) {
        DetailTopBar(journey = journey, onBack = onBack)
        Column(
            Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(top = 12.dp, bottom = 32.dp),
        ) {
            ProgressHeader(journey = journey, selectedDay = selectedDay)
            VSpace(14.dp)
            DaySelector(
                totalDays = journey.durationDays,
                currentDay = journey.currentDay,
                selectedDay = selectedDay,
                accent = journey.vice.accent,
                onSelect = { selectedDay = it },
            )
            VSpace(20.dp)
            TeachingCard(step = step, accent = journey.vice.accent)
            VSpace(14.dp)
            InTodaysWorldCard(step = step, accent = journey.vice.accent)
            VSpace(14.dp)
            ReflectionCard(step = step)
            VSpace(14.dp)
            PracticeCard(step = step)
            VSpace(14.dp)
            MicroCommitmentCard(step = step)
            VSpace(20.dp)
            if (showCompletion) {
                SakhaReflectsCard(journey = journey, step = step)
                VSpace(14.dp)
                ReturnToJourneysButton(onBack = onBack)
            } else {
                AddReflectionField()
                VSpace(12.dp)
                CompleteStepButton(
                    accent = journey.vice.accent,
                    onClick = { showCompletion = true },
                )
            }
            VSpace(12.dp)
        }
    }
}

// ============================================================================
// Top bar + progress header
// ============================================================================

@Composable
private fun DetailTopBar(journey: Journey, onBack: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconButton(onClick = onBack) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Back",
                tint = KiaanColors.TextPrimary,
            )
        }
        Spacer(Modifier.weight(1f))
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier
                        .size(8.dp)
                        .clip(RoundedCornerShape(50))
                        .background(journey.vice.accent),
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    journey.vice.sanskrit,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = journey.vice.accent,
                    ),
                )
            }
            Text(
                journey.title,
                style = MaterialTheme.typography.headlineMedium.copy(
                    color = KiaanColors.TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                    fontStyle = FontStyle.Normal,
                    fontSize = 20.sp,
                ),
                textAlign = TextAlign.Center,
            )
        }
        Spacer(Modifier.weight(1f))
        IconButton(onClick = { /* menu */ }) {
            Icon(
                Icons.Default.MoreVert,
                contentDescription = "Menu",
                tint = KiaanColors.TextPrimary,
            )
        }
    }
}

@Composable
private fun ProgressHeader(journey: Journey, selectedDay: Int) {
    val progress = (selectedDay.toFloat() / journey.durationDays).coerceIn(0f, 1f)
    val percent = (progress * 100).toInt()
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(
            "Day $selectedDay of ${journey.durationDays}",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = KiaanColors.TextSecondary,
            ),
        )
        Spacer(Modifier.weight(1f))
        Text(
            "$percent% complete",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = KiaanColors.TextSecondary,
            ),
        )
    }
    VSpace(6.dp)
    LinearProgressRail(progress = progress, color = journey.vice.accent, height = 3.dp)
}

// ============================================================================
// Day selector pills
// ============================================================================

@Composable
private fun DaySelector(
    totalDays: Int,
    currentDay: Int,
    selectedDay: Int,
    accent: Color,
    onSelect: (Int) -> Unit,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        (1..totalDays).forEach { day ->
            val completed = day < currentDay
            val isSelected = day == selectedDay
            val tint = when {
                completed -> Color(0xFF10B981)
                isSelected -> Color(0xFFB98824)
                else -> Color.White.copy(alpha = 0.06f)
            }
            val contentColor = when {
                completed -> Color(0xFF10B981)
                isSelected -> Color.Black
                else -> KiaanColors.TextSecondary
            }
            Box(
                Modifier
                    .size(52.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(if (completed) Color(0xFF0B2E22) else tint)
                    .border(
                        1.dp,
                        if (completed) Color(0xFF10B981).copy(alpha = 0.5f) else Color.Transparent,
                        RoundedCornerShape(12.dp),
                    )
                    .clickable { onSelect(day) },
                contentAlignment = Alignment.Center,
            ) {
                if (completed) {
                    Box(
                        Modifier
                            .size(24.dp)
                            .clip(RoundedCornerShape(50))
                            .border(1.dp, Color(0xFF10B981), RoundedCornerShape(50)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            Icons.Default.Check,
                            contentDescription = null,
                            tint = Color(0xFF10B981),
                            modifier = Modifier.size(14.dp),
                        )
                    }
                } else {
                    Text(
                        day.toString(),
                        style = MaterialTheme.typography.headlineMedium.copy(
                            color = contentColor,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 18.sp,
                        ),
                    )
                }
            }
        }
    }
}

// ============================================================================
// Content cards
// ============================================================================

@Composable
private fun TeachingCard(step: DayStep, accent: Color) {
    AccentCard(
        accent = KiaanColors.SacredGold,
        variant = AccentCardVariant.LeftRail,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                Icons.AutoMirrored.Filled.MenuBook,
                contentDescription = null,
                tint = KiaanColors.SacredGold,
                modifier = Modifier.size(18.dp),
            )
            Spacer(Modifier.width(8.dp))
            SectionEyebrow("Teaching", color = KiaanColors.SacredGold)
        }
        VSpace(12.dp)
        Text(
            step.teachingBody,
            style = MaterialTheme.typography.bodyLarge.copy(
                color = KiaanColors.TextPrimary,
                lineHeight = 26.sp,
                fontSize = 17.sp,
            ),
        )
    }
}

@Composable
private fun InTodaysWorldCard(step: DayStep, accent: Color) {
    AccentCard(
        accent = accent,
        variant = AccentCardVariant.LeftRail,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("✦", color = accent, fontSize = 14.sp)
            Spacer(Modifier.width(6.dp))
            SectionEyebrow("In Today's World", color = accent)
        }
        VSpace(10.dp)
        SerifItalic(
            step.worldScenario.scenario,
            fontSize = 15.sp,
            color = KiaanColors.TextPrimary,
        )
        VSpace(10.dp)
        SerifItalic(
            step.worldScenario.description,
            fontSize = 14.sp,
            color = KiaanColors.TextSecondary,
        )
        VSpace(14.dp)
        SerifItalic(
            step.worldScenario.reframe,
            fontSize = 14.sp,
            color = KiaanColors.TextPrimary,
        )
    }
}

@Composable
private fun ReflectionCard(step: DayStep) {
    val accent = Color(0xFFA78BFA)
    AccentCard(
        accent = accent,
        variant = AccentCardVariant.LeftRail,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                Icons.Default.Chat,
                contentDescription = null,
                tint = accent,
                modifier = Modifier.size(16.dp),
            )
            Spacer(Modifier.width(8.dp))
            SectionEyebrow("Reflection", color = accent)
        }
        VSpace(12.dp)
        Row(verticalAlignment = Alignment.Top) {
            Box(
                Modifier
                    .size(22.dp)
                    .clip(RoundedCornerShape(50))
                    .background(accent.copy(alpha = 0.18f))
                    .border(1.dp, accent.copy(alpha = 0.5f), RoundedCornerShape(50)),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    "1",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = accent,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                    ),
                )
            }
            Spacer(Modifier.width(10.dp))
            Text(
                step.reflectionPrompt,
                style = MaterialTheme.typography.bodyLarge.copy(
                    color = KiaanColors.TextPrimary,
                    lineHeight = 24.sp,
                ),
            )
        }
    }
}

@Composable
private fun PracticeCard(step: DayStep) {
    val accent = Color(0xFF10B981)
    AccentCard(accent = accent, variant = AccentCardVariant.LeftRail) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                Icons.Default.GpsFixed,
                contentDescription = null,
                tint = accent,
                modifier = Modifier.size(16.dp),
            )
            Spacer(Modifier.width(8.dp))
            SectionEyebrow("Practice", color = accent, modifier = Modifier.weight(1f))
            Box(
                Modifier
                    .clip(RoundedCornerShape(50))
                    .border(1.dp, accent.copy(alpha = 0.4f), RoundedCornerShape(50))
                    .padding(horizontal = 10.dp, vertical = 4.dp),
            ) {
                Text(
                    "${step.practiceMinutes} min",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = accent,
                        fontSize = 11.sp,
                    ),
                )
            }
        }
        VSpace(12.dp)
        Text(
            "Daily Practice",
            style = MaterialTheme.typography.headlineMedium.copy(
                color = KiaanColors.TextPrimary,
                fontStyle = FontStyle.Normal,
                fontWeight = FontWeight.SemiBold,
                fontSize = 20.sp,
            ),
        )
        VSpace(10.dp)
        Row(verticalAlignment = Alignment.Top) {
            Box(
                Modifier
                    .size(22.dp)
                    .clip(RoundedCornerShape(50))
                    .background(accent.copy(alpha = 0.18f))
                    .border(1.dp, accent.copy(alpha = 0.5f), RoundedCornerShape(50)),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    "1",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = accent,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                    ),
                )
            }
            Spacer(Modifier.width(10.dp))
            Text(
                step.practice,
                style = MaterialTheme.typography.bodyLarge.copy(
                    color = KiaanColors.TextPrimary,
                    lineHeight = 24.sp,
                ),
            )
        }
    }
}

@Composable
private fun MicroCommitmentCard(step: DayStep) {
    val accent = Color(0xFF67E8F9)
    AccentCard(accent = accent, variant = AccentCardVariant.Glow) {
        SectionEyebrow("Micro Commitment", color = accent)
        VSpace(8.dp)
        Text(
            "“${step.microCommitment}”",
            style = MaterialTheme.typography.bodyLarge.copy(
                color = KiaanColors.TextPrimary,
                fontStyle = FontStyle.Italic,
                lineHeight = 24.sp,
            ),
        )
    }
}

// ============================================================================
// Footer: reflection input + primary CTA
// ============================================================================

@Composable
private fun AddReflectionField() {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .border(1.dp, KiaanColors.TextSecondary.copy(alpha = 0.2f), RoundedCornerShape(14.dp))
            .background(KiaanColors.CosmosBlack.copy(alpha = 0.5f))
            .padding(horizontal = 18.dp, vertical = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            "Add Reflection (Optional)",
            style = MaterialTheme.typography.bodyLarge.copy(
                color = KiaanColors.TextSecondary,
            ),
            modifier = Modifier.weight(1f),
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.width(12.dp))
        KiaanInsightBadge()
    }
}

@Composable
private fun KiaanInsightBadge() {
    Box(
        Modifier
            .size(44.dp)
            .clip(RoundedCornerShape(50))
            .background(Color(0xFF1E40AF))
            .border(1.5.dp, KiaanColors.SacredGold, RoundedCornerShape(50)),
        contentAlignment = Alignment.Center,
    ) {
        Text("💡", fontSize = 18.sp)
    }
}

@Composable
private fun CompleteStepButton(accent: Color, onClick: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(28.dp))
            .background(accent)
            .clickable { onClick() }
            .padding(vertical = 18.dp),
        horizontalArrangement = Arrangement.Center,
    ) {
        Text(
            "Complete Today's Step",
            style = MaterialTheme.typography.titleLarge.copy(
                color = Color.Black,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp,
                fontSize = 18.sp,
            ),
        )
    }
}

// ============================================================================
// Sakha Reflects completion card
// ============================================================================

@Composable
private fun SakhaReflectsCard(journey: Journey, step: DayStep) {
    AccentCard(
        accent = KiaanColors.SacredGold,
        variant = AccentCardVariant.FullBorder,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(50))
                    .background(Color(0xFF1E40AF))
                    .border(1.5.dp, KiaanColors.SacredGold, RoundedCornerShape(50)),
                contentAlignment = Alignment.Center,
            ) {
                Text("ॐ", color = KiaanColors.SacredGold, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    "SAKHA REFLECTS",
                    style = MaterialTheme.typography.labelLarge.copy(
                        color = KiaanColors.SacredGold,
                        letterSpacing = 2.sp,
                        fontSize = 12.sp,
                    ),
                )
                Text(
                    "Your KIAAN companion responds",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = KiaanColors.TextSecondary,
                        fontStyle = FontStyle.Italic,
                        fontSize = 12.sp,
                    ),
                )
            }
            Box(
                Modifier
                    .clip(RoundedCornerShape(50))
                    .background(Color(0xFF0B2E22))
                    .border(1.dp, Color(0xFF10B981).copy(alpha = 0.5f), RoundedCornerShape(50))
                    .padding(horizontal = 10.dp, vertical = 4.dp),
            ) {
                Text(
                    "+${step.sakhaOnComplete.masteryGained} mastery",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = Color(0xFF10B981),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                    ),
                )
            }
        }
        VSpace(14.dp)
        SerifItalic(
            text = step.sakhaOnComplete.body,
            color = KiaanColors.TextPrimary,
            fontSize = 16.sp,
        )
    }
}

@Composable
private fun ReturnToJourneysButton(onBack: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .border(1.dp, KiaanColors.TextSecondary.copy(alpha = 0.25f), RoundedCornerShape(14.dp))
            .clickable { onBack() }
            .padding(vertical = 16.dp),
        horizontalArrangement = Arrangement.Center,
    ) {
        Text(
            "Return to Journeys",
            style = MaterialTheme.typography.bodyLarge.copy(
                color = KiaanColors.TextPrimary,
            ),
        )
    }
}
