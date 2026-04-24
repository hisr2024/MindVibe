package com.mindvibe.app.home

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import com.mindvibe.app.sadhana.ui.components.OmGlyph
import com.mindvibe.app.sadhana.ui.components.SacredBackground
import com.mindvibe.app.ui.theme.KiaanColors
import com.mindvibe.app.ui.theme.KiaanFonts

/**
 * Sakha's home — a minimal chooser between the two primary sacred tools
 * the app ships: Nitya Sadhana (daily practice) and Emotional Reset
 * (in-the-moment emotional alchemy). Both are 1:1 adaptations of the
 * respective flows on kiaanverse.com.
 */
@Composable
fun SakhaHomeScreen(
    onOpenSadhana: () -> Unit,
    onOpenEmotionalReset: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.fillMaxSize()) {
        SacredBackground()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .systemBarsPadding()
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            OmGlyph(size = 88.dp)
            Spacer(Modifier.height(18.dp))
            Text(
                text = "Sakha",
                style = MaterialTheme.typography.displayMedium.copy(
                    color = KiaanColors.SacredGold,
                    fontFamily = KiaanFonts.Serif,
                    fontSize = 36.sp,
                ),
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = "Your sacred companion",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                    fontStyle = FontStyle.Italic,
                ),
                textAlign = TextAlign.Center,
            )

            Spacer(Modifier.height(40.dp))

            HomeTile(
                title = "Nitya Sadhana",
                subtitle = "Your daily practice",
                accent = KiaanColors.SacredGold,
                onClick = onOpenSadhana,
            )
            Spacer(Modifier.height(14.dp))
            HomeTile(
                title = "Emotional Reset",
                subtitle = "When your heart needs holding",
                accent = KiaanColors.MoodPeaceful,
                onClick = onOpenEmotionalReset,
            )

            Spacer(Modifier.height(40.dp))
            Text(
                text = "सर्वे भवन्तु सुखिनः",
                style = MaterialTheme.typography.bodyLarge.copy(
                    color = KiaanColors.SacredGold.copy(alpha = 0.8f),
                    fontFamily = KiaanFonts.Serif,
                ),
                textAlign = TextAlign.Center,
            )
            Text(
                text = "May all beings be at peace",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextMuted,
                    fontStyle = FontStyle.Italic,
                ),
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun HomeTile(
    title: String,
    subtitle: String,
    accent: Color,
    onClick: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(
                Brush.linearGradient(
                    colors = listOf(Color(0xFF1A1F55), Color(0xFF0E1238)),
                ),
            )
            .border(
                BorderStroke(1.dp, accent.copy(alpha = 0.35f)),
                RoundedCornerShape(22.dp),
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 22.dp, vertical = 20.dp),
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineMedium.copy(
                color = KiaanColors.TextPrimary,
                fontFamily = KiaanFonts.Serif,
                fontWeight = FontWeight.Normal,
                fontSize = 22.sp,
            ),
        )
        Spacer(Modifier.size(4.dp))
        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodyMedium.copy(
                color = accent.copy(alpha = 0.9f),
                fontStyle = FontStyle.Italic,
            ),
        )
    }
}
