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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.GpsFixed
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LocalTextStyle
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
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
import kotlinx.coroutines.launch

@Composable
fun JourneyDetailScreen(
    journeyId: String,
    onBack: () -> Unit,
) {
    val journey = remember(journeyId) { JourneyContent.journey(journeyId) }
    var selectedDay by remember(journeyId) {
        mutableIntStateOf(journey.currentDay.coerceAtLeast(1))
    }
    val step = journey.steps[(selectedDay - 1).coerceIn(0, journey.steps.lastIndex)]

    // Step interaction state — kept hoisted so navigation between days resets.
    var showCompletion by remember(journeyId, selectedDay) {
        androidx.compose.runtime.mutableStateOf(false)
    }
    var showReflection by remember(journeyId, selectedDay) {
        androidx.compose.runtime.mutableStateOf(false)
    }
    var reflection by remember(journeyId, selectedDay) {
        androidx.compose.runtime.mutableStateOf("")
    }
    var isCompleting by remember { androidx.compose.runtime.mutableStateOf(false) }
    var errorMessage by remember { androidx.compose.runtime.mutableStateOf<String?>(null) }
    val scope = androidx.compose.runtime.rememberCoroutineScope()

    // Step is "completable" only on the actual current day of an active journey.
    // When the journey has not started yet (currentDay == 0) we fall back to
    // a "Begin Journey" CTA so the page is never a dead-end.
    val isToday = journey.isActive && selectedDay == journey.currentDay
    val notStarted = !journey.isActive && journey.currentDay == 0
    val accent = journey.vice.accent

    Column(Modifier.fillMaxWidth()) {
        DetailTopBar(journey = journey, onBack = onBack, onMore = { /* TODO actions sheet */ })
        Column(
            Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(top = 12.dp, bottom = 32.dp),
        ) {
            ProgressHeader(journey = journey)
            VSpace(14.dp)
            DaySelector(
                totalDays = journey.durationDays,
                currentDay = journey.currentDay,
                selectedDay = selectedDay,
                accent = accent,
                onSelect = { selectedDay = it },
            )
            VSpace(24.dp)
            DayHeadline(step = step, accent = accent)
            VSpace(18.dp)
            VerseAnchorCard(verse = step.verse ?: journey.anchorVerse)
            VSpace(14.dp)
            TeachingCard(step = step, accent = accent)
            VSpace(14.dp)
            InTodaysWorldCard(step = step, accent = accent)
            VSpace(14.dp)
            ReflectionCard(step = step)
            VSpace(14.dp)
            PracticeCard(step = step)
            VSpace(14.dp)
            MicroCommitmentCard(step = step)
            VSpace(20.dp)

            // Inline error banner — non-blocking, dismissable. Mirrors web.
            errorMessage?.let { msg ->
                ErrorBanner(message = msg, onDismiss = { errorMessage = null })
                VSpace(12.dp)
            }

            if (showCompletion) {
                SakhaReflectsCard(
                    journey = journey,
                    step = step,
                    onReturn = onBack,
                )
            } else {
                // Sakha asks (check-in prompt) — shown only on completable today.
                if (isToday) {
                    SakhaAsksHeader(prompt = step.checkInPrompt, accent = accent)
                    VSpace(10.dp)
                }
                ReflectionToggleAndField(
                    expanded = showReflection,
                    reflection = reflection,
                    accent = accent,
                    onToggle = { showReflection = !showReflection },
                    onChange = { reflection = it },
                )
                VSpace(12.dp)
                CompleteStepButton(
                    accent = accent,
                    isCompleting = isCompleting,
                    enabled = (isToday || notStarted) && !isCompleting,
                    label = when {
                        notStarted -> "Begin ${journey.durationDays}-Day Journey"
                        !isToday && selectedDay < journey.currentDay ->
                            "Day $selectedDay Already Completed"
                        !isToday -> "Come Back on Day ${journey.currentDay}"
                        showReflection && reflection.trim().isNotEmpty() ->
                            "Complete & Receive Sakha's Wisdom"
                        else -> "Complete Today's Step"
                    },
                    onClick = onClick@{
                        val canRun = (isToday || notStarted) && !isCompleting
                        if (!canRun) return@onClick
                        isCompleting = true
                        errorMessage = null
                        // Simulate the completion call. In production this is
                        // backed by journeyEngineService.completeStep. We keep
                        // it idempotent and reveal the Sakha card on success.
                        scope.launch {
                            try {
                                kotlinx.coroutines.delay(450)
                                showCompletion = true
                            } catch (t: Throwable) {
                                errorMessage =
                                    "Couldn't complete this step. Please try again."
                            } finally {
                                isCompleting = false
                            }
                        }
                    },
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
private fun DetailTopBar(journey: Journey, onBack: () -> Unit, onMore: () -> Unit) {
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
                    style = MaterialTheme.typography.labelLarge.copy(
                        color = journey.vice.accent,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 0.sp,
                        fontSize = 13.sp,
                    ),
                )
            }
            Spacer(Modifier.height(2.dp))
            Text(
                journey.title,
                style = MaterialTheme.typography.headlineMedium.copy(
                    color = KiaanColors.TextPrimary,
                    fontWeight = FontWeight.Normal,
                    fontStyle = FontStyle.Normal,
                    fontSize = 18.sp,
                ),
                textAlign = TextAlign.Center,
                maxLines = 1,
            )
        }
        Spacer(Modifier.weight(1f))
        IconButton(onClick = onMore) {
            Icon(
                Icons.Default.MoreVert,
                contentDescription = "Menu",
                tint = KiaanColors.TextPrimary,
            )
        }
    }
}

@Composable
private fun ProgressHeader(journey: Journey) {
    // Web parity: progress is days_completed / total_days. We mark the day
    // BEFORE current_day as the most recently completed. This gives the
    // "Day 3 of 30 — 7%" reading the screenshot shows (2/30 ≈ 7%).
    val daysCompleted = (journey.currentDay - 1).coerceIn(0, journey.durationDays)
    val progress = if (journey.durationDays == 0) 0f
        else daysCompleted.toFloat() / journey.durationDays
    val percent = (progress * 100).toInt()
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(
            "Day ${journey.currentDay.coerceAtLeast(1)} of ${journey.durationDays}",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = KiaanColors.TextSecondary,
                fontSize = 13.sp,
            ),
        )
        Spacer(Modifier.weight(1f))
        Text(
            "$percent% complete",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = KiaanColors.TextSecondary,
                fontSize = 13.sp,
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
// Day headline + Gita verse anchor (the cards above Teaching)
// ============================================================================

@Composable
private fun DayHeadline(step: DayStep, accent: Color) {
    Column(
        Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        // "● Day N" pill
        Row(
            Modifier
                .clip(RoundedCornerShape(50))
                .border(
                    width = 1.dp,
                    color = accent.copy(alpha = 0.35f),
                    shape = RoundedCornerShape(50),
                )
                .background(accent.copy(alpha = 0.10f))
                .padding(horizontal = 14.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                Modifier
                    .size(6.dp)
                    .clip(RoundedCornerShape(50))
                    .background(accent),
            )
            Spacer(Modifier.width(8.dp))
            Text(
                "Day ${step.dayIndex}",
                style = MaterialTheme.typography.labelLarge.copy(
                    color = accent,
                    fontWeight = FontWeight.Medium,
                    fontSize = 12.sp,
                    letterSpacing = 0.sp,
                ),
            )
        }
        VSpace(14.dp)
        Text(
            text = "Day ${step.dayIndex}: ${step.title}",
            style = MaterialTheme.typography.headlineMedium.copy(
                color = KiaanColors.TextPrimary,
                fontWeight = FontWeight.Normal,
                fontStyle = FontStyle.Normal,
                fontSize = 22.sp,
                lineHeight = 30.sp,
            ),
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun VerseAnchorCard(verse: com.mindvibe.app.journey.model.GitaVerse) {
    val gold = KiaanColors.SacredGold
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        gold.copy(alpha = 0.10f),
                        Color(0xFF111435).copy(alpha = 0.98f),
                    ),
                ),
            )
            .border(
                width = 1.dp,
                color = gold.copy(alpha = 0.35f),
                shape = RoundedCornerShape(20.dp),
            )
            .padding(horizontal = 18.dp, vertical = 18.dp),
    ) {
        // BG citation chip
        Row(
            Modifier
                .clip(RoundedCornerShape(8.dp))
                .background(gold.copy(alpha = 0.10f))
                .border(1.dp, gold.copy(alpha = 0.4f), RoundedCornerShape(8.dp))
                .padding(horizontal = 10.dp, vertical = 5.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("✦", color = gold, fontSize = 11.sp)
            Spacer(Modifier.width(6.dp))
            Text(
                verse.citation,
                style = MaterialTheme.typography.labelLarge.copy(
                    color = gold,
                    fontSize = 11.sp,
                    letterSpacing = 1.sp,
                    fontWeight = FontWeight.Medium,
                ),
            )
        }
        VSpace(14.dp)
        // Devanagari (full)
        Text(
            text = verse.fullDevanagari.ifBlank { verse.devanagari },
            style = MaterialTheme.typography.headlineMedium.copy(
                color = Color(0xFFF0C040),
                fontWeight = FontWeight.SemiBold,
                fontSize = 18.sp,
                lineHeight = 30.sp,
            ),
        )
        if (verse.fullTransliteration.isNotBlank() || verse.transliteration.isNotBlank()) {
            VSpace(10.dp)
            ThinGoldDivider()
            VSpace(10.dp)
            Text(
                text = verse.fullTransliteration.ifBlank { verse.transliteration },
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = Color(0xFFB8AE98),
                    fontStyle = FontStyle.Italic,
                    fontSize = 13.sp,
                    lineHeight = 20.sp,
                ),
            )
        }
        if (verse.translation.isNotBlank()) {
            VSpace(10.dp)
            ThinGoldDivider(soft = true)
            VSpace(10.dp)
            Text(
                text = "“${verse.translation}”",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = Color(0xFFEDE8DC),
                    fontStyle = FontStyle.Italic,
                    fontSize = 14.sp,
                    lineHeight = 22.sp,
                ),
            )
        }
    }
}

@Composable
private fun ThinGoldDivider(soft: Boolean = false) {
    val alpha = if (soft) 0.22f else 0.35f
    Box(
        Modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(
                Brush.horizontalGradient(
                    listOf(
                        Color.Transparent,
                        KiaanColors.SacredGold.copy(alpha = alpha),
                        Color.Transparent,
                    ),
                ),
            ),
    )
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
// Footer: Sakha asks, reflection input, error banner, primary CTA
// ============================================================================

/** Italic "Sakha asks:" prompt — appears just above the reflection field. */
@Composable
private fun SakhaAsksHeader(prompt: String, accent: Color) {
    Column(Modifier.fillMaxWidth()) {
        Text(
            text = "SAKHA ASKS:",
            style = MaterialTheme.typography.labelSmall.copy(
                color = accent,
                fontSize = 9.sp,
                letterSpacing = 2.sp,
                fontWeight = FontWeight.Medium,
            ),
        )
        VSpace(4.dp)
        Text(
            text = prompt,
            style = MaterialTheme.typography.headlineLarge.copy(
                color = KiaanColors.TextPrimary,
                fontStyle = FontStyle.Italic,
                fontSize = 17.sp,
                lineHeight = 26.sp,
            ),
        )
    }
}

/**
 * Add Reflection toggle row + animated TextField. Tapping the row toggles
 * the field. The lightbulb badge stays anchored to the right end. Word
 * count + "🔒 Encrypted" hint appear below an active textarea (web parity).
 */
@Composable
private fun ReflectionToggleAndField(
    expanded: Boolean,
    reflection: String,
    accent: Color,
    onToggle: () -> Unit,
    onChange: (String) -> Unit,
) {
    val borderColor =
        if (expanded) accent.copy(alpha = 0.4f)
        else KiaanColors.TextSecondary.copy(alpha = 0.2f)
    val bg =
        if (expanded) accent.copy(alpha = 0.05f)
        else KiaanColors.CosmosBlack.copy(alpha = 0.4f)

    Column(Modifier.fillMaxWidth()) {
        Row(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .border(1.dp, borderColor, RoundedCornerShape(14.dp))
                .background(bg)
                .clickable { onToggle() }
                .padding(horizontal = 18.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = if (expanded) "Hide Reflection" else "Add Reflection (Optional)",
                style = MaterialTheme.typography.bodyLarge.copy(
                    color = if (expanded) accent else KiaanColors.TextSecondary,
                    fontWeight = FontWeight.Medium,
                ),
                modifier = Modifier.weight(1f),
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.width(12.dp))
            KiaanInsightBadge()
        }

        if (expanded) {
            VSpace(10.dp)
            ReflectionTextArea(
                value = reflection,
                onChange = onChange,
                accent = accent,
            )
            VSpace(6.dp)
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                val words = reflection.trim()
                    .split(Regex("\\s+"))
                    .filter { it.isNotBlank() }
                    .size
                Text(
                    text = "✦ $words words offered",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = KiaanColors.SacredGold.copy(alpha = 0.55f),
                        fontSize = 10.sp,
                        letterSpacing = 0.5.sp,
                    ),
                    modifier = Modifier.weight(1f),
                )
                Icon(
                    Icons.Default.Lock,
                    contentDescription = null,
                    tint = KiaanColors.TextMuted,
                    modifier = Modifier.size(11.dp),
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    text = "Encrypted",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = KiaanColors.TextMuted,
                        fontSize = 10.sp,
                    ),
                )
            }
        }
    }
}

@Composable
private fun ReflectionTextArea(
    value: String,
    onChange: (String) -> Unit,
    accent: Color,
) {
    val borderColor = if (value.isNotEmpty())
        accent.copy(alpha = 0.4f)
    else
        KiaanColors.SacredGold.copy(alpha = 0.18f)
    Box(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .border(1.dp, borderColor, RoundedCornerShape(14.dp))
            .background(Color(0xFF161A42).copy(alpha = 0.5f))
            .padding(horizontal = 16.dp, vertical = 14.dp),
    ) {
        if (value.isEmpty()) {
            Text(
                text = "What stirs in you after this practice?",
                style = MaterialTheme.typography.bodyLarge.copy(
                    color = Color.White.copy(alpha = 0.25f),
                    fontStyle = FontStyle.Italic,
                ),
            )
        }
        BasicTextField(
            value = value,
            onValueChange = { next ->
                if (next.length <= 5000) onChange(next)
            },
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 120.dp),
            textStyle = LocalTextStyle.current.copy(
                color = Color(0xFFEDE8DC),
                fontSize = 16.sp,
                lineHeight = 26.sp,
                fontStyle = FontStyle.Italic,
            ),
            cursorBrush = SolidColor(KiaanColors.SacredGold),
        )
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
        Icon(
            Icons.Default.Lightbulb,
            contentDescription = null,
            tint = KiaanColors.SacredGold,
            modifier = Modifier.size(20.dp),
        )
    }
}

/** Primary CTA. Disabled+spinner during the network round-trip. */
@Composable
private fun CompleteStepButton(
    accent: Color,
    label: String,
    isCompleting: Boolean,
    enabled: Boolean,
    onClick: () -> Unit,
) {
    val containerColor = if (enabled) accent else accent.copy(alpha = 0.4f)
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(28.dp))
            .background(containerColor)
            .clickable(enabled = enabled) { onClick() }
            .padding(vertical = 18.dp, horizontal = 12.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (isCompleting) {
            CircularProgressIndicator(
                color = Color.Black,
                strokeWidth = 2.dp,
                modifier = Modifier.size(18.dp),
            )
            Spacer(Modifier.width(10.dp))
            Text(
                "Completing…",
                style = MaterialTheme.typography.titleLarge.copy(
                    color = Color.Black,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp,
                    fontSize = 16.sp,
                ),
            )
        } else {
            Text(
                label,
                style = MaterialTheme.typography.titleLarge.copy(
                    color = Color.Black,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp,
                    fontSize = 16.sp,
                ),
                textAlign = TextAlign.Center,
            )
        }
    }
}

/** Inline dismissable error banner — never blocks the flow. */
@Composable
private fun ErrorBanner(message: String, onDismiss: () -> Unit) {
    val rose = Color(0xFFF87171)
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .border(1.dp, rose.copy(alpha = 0.3f), RoundedCornerShape(14.dp))
            .background(rose.copy(alpha = 0.08f))
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium.copy(
                color = rose,
                fontSize = 13.sp,
            ),
            modifier = Modifier.weight(1f),
        )
        Spacer(Modifier.width(8.dp))
        IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
            Icon(
                Icons.Default.Close,
                contentDescription = "Dismiss",
                tint = rose,
                modifier = Modifier.size(16.dp),
            )
        }
    }
}

// ============================================================================
// Sakha Reflects completion card
// ============================================================================

@Composable
private fun SakhaReflectsCard(
    journey: Journey,
    step: DayStep,
    onReturn: () -> Unit,
) {
    @Suppress("UNUSED_VARIABLE") val _journey = journey  // reserved for future analytics
    AccentCard(
        accent = KiaanColors.SacredGold,
        variant = AccentCardVariant.FullBorder,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            // Om badge — radial blue glow with gold border
            Box(
                Modifier
                    .size(46.dp)
                    .clip(RoundedCornerShape(50))
                    .background(
                        Brush.radialGradient(
                            colors = listOf(Color(0xFF1B4FBB), Color(0xFF050714)),
                        ),
                    )
                    .border(1.5.dp, KiaanColors.SacredGold.copy(alpha = 0.6f), RoundedCornerShape(50)),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    "ॐ",
                    color = KiaanColors.SacredGold,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    "SAKHA REFLECTS",
                    style = MaterialTheme.typography.labelLarge.copy(
                        color = KiaanColors.SacredGold,
                        letterSpacing = 2.sp,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                    ),
                )
                Text(
                    "Your KIAAN companion responds",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = KiaanColors.TextMuted,
                        fontSize = 11.sp,
                    ),
                )
            }
            // Mastery pill +N
            Box(
                Modifier
                    .clip(RoundedCornerShape(50))
                    .background(Color(0x2610B981))
                    .border(1.dp, Color(0xFF10B981).copy(alpha = 0.4f), RoundedCornerShape(50))
                    .padding(horizontal = 11.dp, vertical = 5.dp),
            ) {
                Text(
                    "+${step.sakhaOnComplete.masteryGained} mastery",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = Color(0xFF6EE7B7),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                    ),
                )
            }
        }
        VSpace(16.dp)
        SerifItalic(
            text = step.sakhaOnComplete.body,
            color = Color(0xFFEDE8DC),
            fontSize = 15.sp,
        )
        VSpace(18.dp)
        // Embedded "Return to Journeys" — matches the in-card CTA from web.
        Row(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(Color(0xFF161A42).copy(alpha = 0.5f))
                .border(
                    1.dp,
                    Color.White.copy(alpha = 0.08f),
                    RoundedCornerShape(14.dp),
                )
                .clickable { onReturn() }
                .padding(vertical = 14.dp),
            horizontalArrangement = Arrangement.Center,
        ) {
            Text(
                "Return to Journeys",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = Color(0xFFB8AE98),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                ),
            )
        }
    }
}
