package com.mindvibe.app.sadhana.ui.phases

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.mindvibe.app.sadhana.model.DharmaIntention
import com.mindvibe.app.ui.theme.KiaanColors
import com.mindvibe.app.ui.theme.KiaanFonts

/**
 * Intention / Sankalpa phase.
 *
 * The AI-suggested intention is shown as an editable gratitude card.
 * Tapping the seal commits the sankalpa — a single golden deepa (lamp)
 * inside a blue sphere — and a gold glow washes the screen.
 */
@Composable
fun IntentionScreen(
    intention: DharmaIntention,
    intentionText: String,
    onIntentionChange: (String) -> Unit,
    onSeal: () -> Unit,
    sealed: Boolean,
    modifier: Modifier = Modifier,
) {
    var editing by remember { mutableStateOf(false) }
    val categoryTokens = intention.category.split("|")
    val category = categoryTokens.first().uppercase()
    val slot = categoryTokens.getOrNull(1) ?: "today"

    Box(
        modifier = modifier
            .fillMaxSize()
            .systemBarsPadding()
            .padding(horizontal = 20.dp),
    ) {
        // Golden wash overlay when sealed.
        if (sealed) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                KiaanColors.SacredGold.copy(alpha = 0.25f),
                                Color.Transparent,
                            ),
                        ),
                    ),
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(24.dp))

            IntentionCard(
                category = category,
                slot = slot,
                text = intentionText,
                editing = editing,
                onEditToggle = { editing = !editing },
                onChange = onIntentionChange,
            )

            Spacer(Modifier.height(12.dp))
            Text(
                text = if (sealed) "Sankalpa sealed. Walk in dharma."
                else "Tap the pencil to customize your intention",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = if (sealed) KiaanColors.SacredGold else KiaanColors.TextMuted,
                    fontStyle = if (sealed) FontStyle.Italic else FontStyle.Normal,
                ),
                textAlign = TextAlign.Center,
            )

            Spacer(Modifier.height(48.dp))
            Text(
                text = "Seal Your Sankalpa",
                style = MaterialTheme.typography.bodyLarge.copy(
                    color = KiaanColors.TextSecondary,
                ),
            )
            Spacer(Modifier.height(12.dp))
            SankalpaSeal(
                enabled = !sealed,
                onClick = onSeal,
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = "I commit to this sankalpa",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                ),
            )
            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
private fun IntentionCard(
    category: String,
    slot: String,
    text: String,
    editing: Boolean,
    onEditToggle: () -> Unit,
    onChange: (String) -> Unit,
) {
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
            .drawBehind {
                // Left gold accent bar.
                drawRect(
                    color = KiaanColors.SacredGold,
                    topLeft = Offset.Zero,
                    size = Size(width = 4f, height = size.height),
                )
            }
            .padding(20.dp),
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = category,
                    style = MaterialTheme.typography.labelLarge.copy(
                        color = KiaanColors.SacredGold,
                        fontWeight = FontWeight.SemiBold,
                    ),
                    modifier = Modifier.weight(1f),
                )
                IconButton(onClick = onEditToggle) {
                    Icon(
                        imageVector = Icons.Outlined.Edit,
                        contentDescription = "Edit intention",
                        tint = KiaanColors.TextSecondary,
                    )
                }
            }
            Spacer(Modifier.height(8.dp))

            if (editing) {
                TextField(
                    value = text,
                    onValueChange = onChange,
                    textStyle = MaterialTheme.typography.headlineMedium.copy(
                        color = KiaanColors.TextPrimary,
                        fontFamily = KiaanFonts.Serif,
                        fontStyle = FontStyle.Italic,
                    ),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        cursorColor = KiaanColors.SacredGold,
                    ),
                    modifier = Modifier.fillMaxWidth(),
                )
            } else {
                Text(
                    text = text,
                    style = MaterialTheme.typography.headlineMedium.copy(
                        fontFamily = KiaanFonts.Serif,
                        fontStyle = FontStyle.Italic,
                        color = KiaanColors.TextPrimary,
                    ),
                    textAlign = TextAlign.Center,
                )
            }

            Spacer(Modifier.height(18.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
            ) {
                Text(
                    text = "For today, $slot",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = KiaanColors.TextMuted,
                        fontStyle = FontStyle.Italic,
                    ),
                )
            }
        }
    }
}

@Composable
private fun SankalpaSeal(enabled: Boolean, onClick: () -> Unit) {
    val transition = rememberInfiniteTransition(label = "sealPulse")
    val glow by transition.animateFloat(
        initialValue = 0.5f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1800),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "glow",
    )

    Box(
        modifier = Modifier
            .size(92.dp)
            .clip(CircleShape)
            .then(if (enabled) Modifier.clickable(onClick = onClick) else Modifier)
            .drawBehind {
                val r = size.minDimension / 2f
                val center = Offset(size.width / 2f, size.height / 2f)
                // Outer gold glow.
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            KiaanColors.SacredGold.copy(alpha = glow * 0.55f),
                            Color.Transparent,
                        ),
                        center = center,
                        radius = r * 1.6f,
                    ),
                    radius = r * 1.6f,
                    center = center,
                )
                // Blue sphere body.
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            Color(0xFF3154B9),
                            Color(0xFF13276A),
                        ),
                        center = Offset(center.x - r * 0.2f, center.y - r * 0.2f),
                        radius = r,
                    ),
                    radius = r * 0.9f,
                    center = center,
                )
                // Gold ring.
                drawCircle(
                    color = KiaanColors.SacredGold,
                    radius = r * 0.92f,
                    center = center,
                    style = Stroke(width = 2f),
                )
            },
        contentAlignment = Alignment.Center,
    ) {
        // Central golden lamp / bindu
        Box(
            modifier = Modifier
                .size(18.dp)
                .drawBehind {
                    val r = size.minDimension / 2f
                    val c = Offset(size.width / 2f, size.height / 2f)
                    drawCircle(
                        brush = Brush.radialGradient(
                            colors = listOf(
                                Color(0xFFFBE38A),
                                KiaanColors.SacredGold,
                                KiaanColors.DeepGold,
                            ),
                            center = c,
                            radius = r,
                        ),
                        radius = r,
                        center = c,
                    )
                },
        )
    }
}
