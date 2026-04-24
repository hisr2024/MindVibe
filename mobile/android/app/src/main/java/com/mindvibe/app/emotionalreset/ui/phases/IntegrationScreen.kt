package com.mindvibe.app.emotionalreset.ui.phases

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindvibe.app.emotionalreset.model.EmotionalResetComposition
import com.mindvibe.app.sadhana.ui.components.SacredPrimaryButton
import com.mindvibe.app.ui.theme.KiaanColors
import com.mindvibe.app.ui.theme.KiaanFonts

/**
 * Phase 4 — The Integration. Summary of the offering, the saved shloka,
 * a private journal, and the affirmation talisman the seeker carries
 * through the day.
 */
@Composable
fun IntegrationScreen(
    composition: EmotionalResetComposition,
    journal: String,
    onJournalChange: (String) -> Unit,
    onComplete: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val feeling = composition.feeling

    Box(modifier = modifier.fillMaxSize().systemBarsPadding()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(bottom = 100.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(20.dp))

            // Emotional Journey summary.
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(Color(0x66161A42))
                    .border(1.dp, Color(0x33F0C040), RoundedCornerShape(18.dp))
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(feeling.glowColor.copy(alpha = 0.2f))
                        .border(1.dp, feeling.glowColor.copy(alpha = 0.4f), CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(text = "🌺", style = MaterialTheme.typography.bodyLarge)
                }
                Column {
                    Text(
                        text = "YOUR EMOTIONAL JOURNEY",
                        style = MaterialTheme.typography.labelSmall.copy(
                            color = KiaanColors.TextMuted,
                            letterSpacing = 2.sp,
                        ),
                    )
                    Text(
                        text = "${feeling.label} · ${feeling.sanskrit} · Intensity ${composition.intensity}/5",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = feeling.glowColor,
                            fontFamily = KiaanFonts.Serif,
                        ),
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            // Saved shloka.
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(Color(0xFF0F143A))
                    .border(1.dp, Color(0x55F0C040), RoundedCornerShape(18.dp))
                    .padding(16.dp),
            ) {
                Text(
                    text = "SAVED TO SACRED LIBRARY",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = KiaanColors.SacredGold,
                        letterSpacing = 2.sp,
                    ),
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    text = "“${composition.witness.shloka.translation}”",
                    style = MaterialTheme.typography.bodyLarge.copy(
                        color = KiaanColors.SacredGold.copy(alpha = 0.95f),
                        fontFamily = KiaanFonts.Serif,
                        fontStyle = FontStyle.Italic,
                        lineHeight = 26.sp,
                    ),
                )
                Text(
                    text = composition.witness.shloka.reference,
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = KiaanColors.TextMuted,
                        fontWeight = FontWeight.Medium,
                    ),
                    textAlign = TextAlign.End,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            Spacer(Modifier.height(16.dp))

            // Private journal.
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(Color(0x66161A42))
                    .border(1.dp, Color(0x22F0C040), RoundedCornerShape(18.dp))
                    .padding(16.dp),
            ) {
                Text(
                    text = "What arose for you?",
                    style = MaterialTheme.typography.headlineMedium.copy(
                        color = KiaanColors.SacredGold,
                        fontFamily = KiaanFonts.Serif,
                        fontStyle = FontStyle.Italic,
                    ),
                )
                Spacer(Modifier.height(8.dp))
                BasicTextField(
                    value = journal,
                    onValueChange = onJournalChange,
                    textStyle = TextStyle(
                        color = KiaanColors.TextPrimary,
                        fontSize = 15.sp,
                        lineHeight = 22.sp,
                    ),
                    cursorBrush = SolidColor(KiaanColors.SacredGold),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp),
                    decorationBox = { inner ->
                        Box {
                            if (journal.isEmpty()) {
                                Text(
                                    text = "Your sacred journal awaits…",
                                    style = MaterialTheme.typography.bodyMedium.copy(
                                        color = KiaanColors.TextMuted,
                                    ),
                                )
                            }
                            inner()
                        }
                    },
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    text = "This stays private and sacred",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = KiaanColors.TextMuted,
                    ),
                )
            }

            Spacer(Modifier.height(16.dp))

            // Affirmation talisman.
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color(0xE6050714))
                    .border(1.dp, KiaanColors.SacredGold, RoundedCornerShape(20.dp))
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    text = "ॐ",
                    style = MaterialTheme.typography.headlineMedium.copy(
                        color = KiaanColors.TextMuted,
                        fontFamily = KiaanFonts.Serif,
                    ),
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    text = "“${composition.witness.affirmation}”",
                    style = MaterialTheme.typography.headlineMedium.copy(
                        color = KiaanColors.SacredGold,
                        fontFamily = KiaanFonts.Serif,
                        fontStyle = FontStyle.Italic,
                    ),
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    text = "Carry this today",
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = KiaanColors.TextMuted,
                        letterSpacing = 2.sp,
                    ),
                )
            }

            Spacer(Modifier.height(24.dp))
        }

        // Sticky primary CTA.
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .padding(horizontal = 20.dp, vertical = 20.dp),
        ) {
            SacredPrimaryButton(
                text = "Complete Sacred Reset",
                onClick = onComplete,
            )
        }
    }
}
