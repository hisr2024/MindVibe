package com.mindvibe.app.emotionalreset.ui.phases

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.verticalScroll
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
import com.mindvibe.app.emotionalreset.model.EmotionalResetComposition
import com.mindvibe.app.sadhana.ui.components.SacredPrimaryButton
import com.mindvibe.app.ui.theme.KiaanColors
import com.mindvibe.app.ui.theme.KiaanFonts

/**
 * Phase 2 — The Sacred Witness. Sakha receives the offering and responds
 * with four beats: a witnessing note, a Bhagavad Gita shloka in an
 * elevated card, a deeper reflection, and a culminating affirmation.
 */
@Composable
fun WitnessScreen(
    composition: EmotionalResetComposition,
    onBeginBreath: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val witness = composition.witness

    Column(
        modifier = modifier
            .fillMaxSize()
            .systemBarsPadding()
            .padding(horizontal = 24.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(20.dp))

        // Sakha receiving avatar.
        Box(
            modifier = Modifier
                .size(64.dp)
                .clip(CircleShape)
                .background(
                    Brush.linearGradient(
                        colors = listOf(
                            Color(0x66F0C040),
                            Color(0x2622C6E6),
                        ),
                    ),
                )
                .border(1.dp, Color(0x66F0C040), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "🙏",
                style = MaterialTheme.typography.headlineMedium,
            )
        }

        Spacer(Modifier.height(6.dp))
        Text(
            text = "Sakha receives you",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = KiaanColors.SacredGold,
                fontStyle = FontStyle.Italic,
            ),
        )

        Spacer(Modifier.height(24.dp))

        Text(
            text = witness.witness,
            style = MaterialTheme.typography.bodyLarge.copy(
                color = KiaanColors.TextPrimary,
                lineHeight = 26.sp,
            ),
            textAlign = TextAlign.Center,
        )

        Spacer(Modifier.height(24.dp))

        ShlokaCard(
            sanskrit = witness.shloka.sanskrit,
            transliteration = witness.shloka.transliteration,
            translation = witness.shloka.translation,
            reference = witness.shloka.reference,
        )

        Spacer(Modifier.height(20.dp))

        Text(
            text = witness.reflection,
            style = MaterialTheme.typography.bodyLarge.copy(
                color = KiaanColors.TextSecondary,
                lineHeight = 28.sp,
            ),
            textAlign = TextAlign.Center,
        )

        Spacer(Modifier.height(24.dp))

        Text(
            text = "“${witness.affirmation}”",
            style = MaterialTheme.typography.headlineMedium.copy(
                color = KiaanColors.SacredGold,
                fontFamily = KiaanFonts.Serif,
                fontStyle = FontStyle.Italic,
            ),
            textAlign = TextAlign.Center,
        )

        Spacer(Modifier.height(32.dp))

        SacredPrimaryButton(
            text = "Begin Sacred Breathing",
            onClick = onBeginBreath,
        )

        Spacer(Modifier.height(32.dp))
    }
}

@Composable
private fun ShlokaCard(
    sanskrit: String,
    transliteration: String,
    translation: String,
    reference: String,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(
                Brush.linearGradient(
                    colors = listOf(Color(0xFF1A1F55), Color(0xFF0E1238)),
                ),
            )
            .border(1.dp, Color(0x66F0C040), RoundedCornerShape(20.dp))
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            text = sanskrit,
            style = MaterialTheme.typography.headlineMedium.copy(
                color = KiaanColors.SacredGold,
                fontFamily = KiaanFonts.Serif,
                fontStyle = FontStyle.Italic,
                lineHeight = 30.sp,
            ),
            textAlign = TextAlign.Center,
        )
        if (transliteration.isNotBlank()) {
            Text(
                text = transliteration,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                    fontStyle = FontStyle.Italic,
                ),
                textAlign = TextAlign.Center,
            )
        }
        Text(
            text = translation,
            style = MaterialTheme.typography.bodyLarge.copy(
                color = KiaanColors.TextPrimary,
            ),
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = reference,
            style = MaterialTheme.typography.labelSmall.copy(
                color = KiaanColors.TextMuted,
                letterSpacing = 1.5.sp,
                fontWeight = FontWeight.Medium,
            ),
        )
    }
}
