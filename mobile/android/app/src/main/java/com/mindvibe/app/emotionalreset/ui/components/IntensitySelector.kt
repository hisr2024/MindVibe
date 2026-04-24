package com.mindvibe.app.emotionalreset.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.mindvibe.app.emotionalreset.model.IntensityLevel
import com.mindvibe.app.ui.theme.KiaanColors

/**
 * Five-level intensity selector with sanskrit names. Matches the web's
 * post-selection intensity reveal — gentle dots that ripple in when a
 * feeling has been chosen.
 */
@Composable
fun IntensitySelector(
    visible: Boolean,
    current: Int,
    onChange: (Int) -> Unit,
    modifier: Modifier = Modifier,
    glowColor: Color = KiaanColors.SacredGold,
) {
    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(),
        exit = fadeOut(),
        modifier = modifier,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(Color(0x66161A42))
                .border(1.dp, Color(0x33F0C040), RoundedCornerShape(20.dp))
                .padding(horizontal = 20.dp, vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "How present is it?",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                    fontStyle = FontStyle.Italic,
                ),
            )
            androidx.compose.foundation.layout.Spacer(Modifier.size(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IntensityLevel.All.forEach { level ->
                    IntensityDot(
                        level = level,
                        selected = level.value == current,
                        glowColor = glowColor,
                        onClick = { onChange(level.value) },
                    )
                }
            }
            if (current >= 1) {
                androidx.compose.foundation.layout.Spacer(Modifier.size(10.dp))
                val level = IntensityLevel.All[current - 1]
                Text(
                    text = "${level.label} · ${level.sanskrit}",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = glowColor,
                        fontWeight = FontWeight.Medium,
                    ),
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

@Composable
private fun IntensityDot(
    level: IntensityLevel,
    selected: Boolean,
    glowColor: Color,
    onClick: () -> Unit,
) {
    val diameter = 18 + (level.value - 1) * 4
    Box(
        modifier = Modifier
            .size((diameter + 20).dp)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .size(diameter.dp)
                .clip(CircleShape)
                .background(
                    if (selected) glowColor.copy(alpha = 0.85f)
                    else Color.White.copy(alpha = 0.15f),
                )
                .border(
                    width = if (selected) 1.5.dp else 0.5.dp,
                    color = if (selected) Color.White.copy(alpha = 0.5f)
                    else Color.White.copy(alpha = 0.2f),
                    shape = CircleShape,
                ),
        )
    }
}
