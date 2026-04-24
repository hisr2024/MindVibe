package com.mindvibe.app.journey.ui

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import com.mindvibe.app.journey.model.Difficulty
import com.mindvibe.app.journey.model.Journey
import com.mindvibe.app.journey.ui.components.Chip
import com.mindvibe.app.journey.ui.components.SerifItalic
import com.mindvibe.app.journey.ui.components.VSpace
import com.mindvibe.app.ui.theme.KiaanColors

@Composable
fun JourneysListScreen(onOpenJourney: (String) -> Unit) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        items(JourneyContent.journeys, key = { it.id }) { j ->
            JourneyCatalogCard(j = j, onOpen = { onOpenJourney(j.id) })
        }
    }
}

@Composable
private fun JourneyCatalogCard(j: Journey, onOpen: () -> Unit) {
    Column(
        Modifier
            .clip(RoundedCornerShape(18.dp))
            .background(j.vice.surface)
            .border(1.5.dp, j.vice.accent.copy(alpha = 0.5f), RoundedCornerShape(18.dp))
            .clickable { onOpen() }
            .padding(14.dp),
    ) {
        // Meta row
        Row(verticalAlignment = Alignment.CenterVertically) {
            Chip(
                text = "${j.durationDays}d",
                color = j.vice.accent,
                filled = true,
            )
            Spacer(Modifier.width(6.dp))
            Chip(
                text = j.difficulty.label,
                color = KiaanColors.TextSecondary,
            )
            Spacer(Modifier.weight(1f))
            if (j.isActive) {
                Chip(text = "DAY ${j.currentDay}", color = j.vice.accent, filled = true)
            } else if (j.isFree) {
                Chip(text = "Free", color = Color(0xFF10B981), filled = true)
            }
        }
        VSpace(14.dp)
        // Devanagari hero + English
        Row(verticalAlignment = Alignment.Bottom) {
            Text(
                j.vice.devanagari,
                style = MaterialTheme.typography.displayLarge.copy(
                    color = j.vice.accent,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 32.sp,
                ),
            )
            Spacer(Modifier.width(6.dp))
            Text(
                j.vice.englishName,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = j.vice.accent.copy(alpha = 0.9f),
                    fontStyle = FontStyle.Italic,
                ),
                modifier = Modifier.padding(bottom = 4.dp),
            )
        }
        VSpace(10.dp)
        // Title
        SerifItalic(
            text = j.title,
            fontSize = 18.sp,
            color = KiaanColors.TextPrimary,
        )
        VSpace(6.dp)
        // Subtitle
        Text(
            j.subtitle,
            style = MaterialTheme.typography.bodyMedium.copy(
                color = KiaanColors.TextSecondary,
                lineHeight = 20.sp,
            ),
            maxLines = 2,
        )
        VSpace(12.dp)
        // "Today this looks like" block
        Column(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Color.White.copy(alpha = 0.02f))
                .border(1.dp, j.vice.accent.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                .padding(10.dp),
        ) {
            Text(
                "TODAY THIS LOOKS LIKE",
                style = MaterialTheme.typography.labelSmall.copy(
                    color = j.vice.accent,
                    letterSpacing = 1.5.sp,
                    fontSize = 9.sp,
                ),
            )
            VSpace(4.dp)
            Text(
                j.todayThisLooksLike,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                    fontStyle = FontStyle.Italic,
                    fontSize = 12.sp,
                    lineHeight = 16.sp,
                ),
                maxLines = 3,
            )
        }
        VSpace(10.dp)
        // Verse anchor
        Column(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(KiaanColors.CosmosBlack.copy(alpha = 0.5f))
                .border(1.dp, KiaanColors.SacredGold.copy(alpha = 0.22f), RoundedCornerShape(12.dp))
                .padding(10.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("✦", color = KiaanColors.SacredGold, fontSize = 12.sp)
                Spacer(Modifier.width(4.dp))
                Text(
                    j.anchorVerse.citation,
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = KiaanColors.SacredGold,
                        fontSize = 10.sp,
                    ),
                )
            }
            VSpace(4.dp)
            Text(
                j.anchorVerse.devanagari,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp,
                ),
                maxLines = 1,
            )
            Text(
                j.anchorVerse.transliteration,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                    fontStyle = FontStyle.Italic,
                    fontSize = 11.sp,
                ),
                maxLines = 1,
            )
        }
        VSpace(10.dp)
        // Conquered by
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(20.dp)
                    .clip(RoundedCornerShape(50))
                    .background(j.vice.accent.copy(alpha = 0.2f))
                    .border(1.dp, j.vice.accent.copy(alpha = 0.5f), RoundedCornerShape(50)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.Default.ArrowForward,
                    contentDescription = null,
                    tint = j.vice.accent,
                    modifier = Modifier.size(11.dp),
                )
            }
            Spacer(Modifier.width(6.dp))
            Text(
                "Conquered by ",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                    fontStyle = FontStyle.Italic,
                    fontSize = 12.sp,
                ),
            )
            Text(
                j.conqueredBy,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = j.vice.accent,
                    fontStyle = FontStyle.Italic,
                    fontSize = 12.sp,
                ),
                maxLines = 1,
            )
        }
        VSpace(12.dp)
        // Begin / Continue CTA
        Row(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(j.vice.accent)
                .clickable { onOpen() }
                .padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            val cta = if (j.isActive) "Continue → Day ${j.currentDay}" else "Begin ${j.durationDays}-Day Journey"
            Text(
                cta,
                style = MaterialTheme.typography.labelLarge.copy(
                    color = Color.Black,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.sp,
                    fontSize = 13.sp,
                ),
                textAlign = TextAlign.Center,
            )
            if (!j.isActive) {
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
}
