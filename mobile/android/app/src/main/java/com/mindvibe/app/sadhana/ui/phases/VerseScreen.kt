package com.mindvibe.app.sadhana.ui.phases

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindvibe.app.sadhana.model.SadhanaVerse
import com.mindvibe.app.sadhana.ui.components.OmGlyph
import com.mindvibe.app.sadhana.ui.components.SacredPrimaryButton
import com.mindvibe.app.ui.theme.KiaanColors
import com.mindvibe.app.ui.theme.KiaanFonts
import kotlinx.coroutines.delay

/**
 * Verse meditation phase. Opens with the Sanskrit verse alone on a dark
 * canvas (the "Skip →" ghost emerges after a beat); then the full card
 * fades in with transliteration, English, and KIAAN's insight.
 */
@Composable
fun VerseScreen(
    verse: SadhanaVerse,
    onComplete: () -> Unit,
    onSkip: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var showCard by remember { mutableStateOf(false) }

    LaunchedEffect(verse.verseId) {
        delay(2500L) // Let the Sanskrit breathe first.
        showCard = true
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .systemBarsPadding()
            .padding(horizontal = 20.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
            ) {
                Text(
                    text = "Skip →",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = KiaanColors.TextMuted,
                    ),
                    modifier = Modifier
                        .clickable(onClick = onSkip)
                        .padding(6.dp),
                )
            }

            Spacer(Modifier.height(16.dp))
            Text(
                text = verse.sanskrit,
                style = MaterialTheme.typography.headlineMedium.copy(
                    color = KiaanColors.SacredGold,
                    fontSize = 22.sp,
                    lineHeight = 34.sp,
                ),
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = "Chapter ${verse.chapter} • Verse ${verse.verse} • ${verse.chapterName}",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                ),
                textAlign = TextAlign.Center,
            )

            Spacer(Modifier.height(24.dp))

            AnimatedVisibility(
                visible = showCard,
                enter = fadeIn() + slideInVertically(initialOffsetY = { it / 6 }),
                exit = fadeOut(),
            ) {
                VerseCard(verse)
            }

            Spacer(Modifier.height(20.dp))
            Text(
                text = "Sit with this truth",
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontStyle = FontStyle.Italic,
                    color = KiaanColors.TextMuted,
                ),
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(8.dp))
            OmGlyph(size = 56.dp)
            Spacer(Modifier.height(24.dp))

            SacredPrimaryButton(
                text = "Continue to Reflection",
                onClick = onComplete,
            )
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun VerseCard(verse: SadhanaVerse) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(KiaanColors.CardSurface)
            .border(
                width = 1.dp,
                color = KiaanColors.CardStroke,
                shape = RoundedCornerShape(20.dp),
            )
            .padding(20.dp),
    ) {
        Column {
            Text(
                text = verse.transliteration,
                style = MaterialTheme.typography.bodyLarge.copy(
                    fontFamily = KiaanFonts.Serif,
                    fontStyle = FontStyle.Italic,
                    color = KiaanColors.TextPrimary,
                ),
            )
            Spacer(Modifier.height(14.dp))

            Divider()

            Spacer(Modifier.height(14.dp))
            Text(
                text = verse.english,
                style = MaterialTheme.typography.headlineMedium.copy(
                    color = KiaanColors.TextPrimary,
                    fontWeight = FontWeight.Normal,
                ),
            )

            Spacer(Modifier.height(18.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "✦",
                    color = KiaanColors.SacredGold,
                    style = MaterialTheme.typography.labelLarge,
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    text = "KIAAN'S INSIGHT",
                    style = MaterialTheme.typography.labelLarge.copy(
                        color = KiaanColors.SacredGold,
                        fontWeight = FontWeight.SemiBold,
                    ),
                )
            }
            Spacer(Modifier.height(10.dp))

            Row {
                Box(
                    modifier = Modifier
                        .width(3.dp)
                        .height(120.dp)
                        .background(KiaanColors.SacredGold),
                )
                Spacer(Modifier.width(12.dp))
                Text(
                    text = verse.kiaanInsight,
                    style = MaterialTheme.typography.bodyLarge.copy(
                        fontFamily = KiaanFonts.Serif,
                        fontStyle = FontStyle.Italic,
                        color = KiaanColors.TextPrimary,
                    ),
                )
            }
        }
    }
}

@Composable
private fun Divider() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(KiaanColors.DeepGold.copy(alpha = 0.35f)),
    )
}
