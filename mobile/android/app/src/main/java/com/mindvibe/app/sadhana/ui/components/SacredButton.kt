package com.mindvibe.app.sadhana.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindvibe.app.ui.theme.KiaanColors

/**
 * Pill-shaped gradient button used for "Walk in Dharma" and similar primary
 * CTAs. Mirrors the electric blue gradient pill on the web.
 */
@Composable
fun SacredPrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val shape = RoundedCornerShape(percent = 50)
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp)
            .clip(shape)
            .background(
                brush = if (enabled) KiaanColors.SacredButtonGradient
                else Brush.linearGradient(
                    listOf(Color(0xFF2B3155), Color(0xFF1C1F35)),
                ),
            ),
        contentAlignment = Alignment.Center,
    ) {
        OutlinedButton(
            onClick = onClick,
            enabled = enabled,
            shape = shape,
            border = BorderStroke(0.dp, Color.Transparent),
            colors = ButtonDefaults.outlinedButtonColors(
                containerColor = Color.Transparent,
                contentColor = Color.White,
                disabledContentColor = Color.White.copy(alpha = 0.5f),
            ),
            modifier = Modifier.fillMaxWidth().height(56.dp),
        ) {
            Text(
                text = text,
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.5.sp,
                ),
                color = Color.White,
                textAlign = TextAlign.Center,
            )
        }
    }
}

/** Subtle text-link CTA (e.g. "View Journal Entry"). */
@Composable
fun SacredLinkButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    TextButton(
        onClick = onClick,
        modifier = modifier.padding(top = 8.dp),
    ) {
        Text(
            text = text,
            color = KiaanColors.SacredGold,
            style = MaterialTheme.typography.bodyLarge,
        )
    }
}
