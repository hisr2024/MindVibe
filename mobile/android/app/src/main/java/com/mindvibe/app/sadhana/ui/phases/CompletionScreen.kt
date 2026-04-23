package com.mindvibe.app.sadhana.ui.phases

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.mindvibe.app.sadhana.model.CompletionResult
import com.mindvibe.app.sadhana.ui.components.OmGlyph
import com.mindvibe.app.sadhana.ui.components.SacredLinkButton
import com.mindvibe.app.sadhana.ui.components.SacredPrimaryButton
import com.mindvibe.app.ui.theme.KiaanColors
import com.mindvibe.app.ui.theme.KiaanFonts

@Composable
fun CompletionScreen(
    result: CompletionResult?,
    onWalkInDharma: () -> Unit,
    onViewJournal: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val xp = result?.xpAwarded ?: 25
    val streak = result?.streakCount ?: 1

    Box(
        modifier = modifier
            .fillMaxSize()
            .systemBarsPadding()
            .padding(horizontal = 24.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Spacer(Modifier.height(32.dp))
            XpOfferingCard(xp = xp)
            Spacer(Modifier.height(16.dp))

            Text(
                text = "$streak Day${if (streak == 1) "" else "s"} of Dharma",
                style = MaterialTheme.typography.headlineMedium.copy(
                    color = KiaanColors.TextPrimary,
                    fontWeight = FontWeight.Normal,
                ),
                textAlign = TextAlign.Center,
            )

            Spacer(Modifier.height(24.dp))
            OmGlyph(size = 60.dp)
            Spacer(Modifier.height(8.dp))
            Text(
                text = "लोका समस्ता सुखिनो भवन्तु",
                style = MaterialTheme.typography.headlineMedium.copy(
                    color = KiaanColors.SacredGold,
                    fontFamily = KiaanFonts.Serif,
                    fontSize = 22.sp,
                ),
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = "May all worlds be at peace",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                    fontStyle = FontStyle.Italic,
                ),
                textAlign = TextAlign.Center,
            )

            Spacer(Modifier.height(32.dp))
            SacredPrimaryButton(
                text = "Walk in Dharma",
                onClick = onWalkInDharma,
            )
            SacredLinkButton(
                text = "View Journal Entry",
                onClick = onViewJournal,
            )
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun XpOfferingCard(xp: Int) {
    Box(
        modifier = Modifier
            .fillMaxWidth(0.78f)
            .clip(RoundedCornerShape(24.dp))
            .background(
                Brush.linearGradient(
                    colors = listOf(
                        Color(0xFF1A1F55),
                        Color(0xFF0E1238),
                    ),
                ),
            )
            .border(
                width = 1.dp,
                color = KiaanColors.CardStroke,
                shape = RoundedCornerShape(24.dp),
            )
            .padding(horizontal = 28.dp, vertical = 26.dp),
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "✦",
                    color = KiaanColors.SacredGold,
                    style = MaterialTheme.typography.labelLarge,
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    text = "SACRED OFFERING",
                    style = MaterialTheme.typography.labelLarge.copy(
                        color = KiaanColors.SacredGold,
                        fontWeight = FontWeight.SemiBold,
                    ),
                )
            }
            Spacer(Modifier.height(14.dp))
            Text(
                text = "+$xp XP",
                style = MaterialTheme.typography.displayLarge.copy(
                    color = KiaanColors.SacredGold,
                    fontFamily = KiaanFonts.Serif,
                    fontSize = 54.sp,
                ),
            )
        }
    }
}
