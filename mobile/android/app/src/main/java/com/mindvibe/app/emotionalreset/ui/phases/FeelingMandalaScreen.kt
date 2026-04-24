package com.mindvibe.app.emotionalreset.ui.phases

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
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
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindvibe.app.emotionalreset.model.FeelingState
import com.mindvibe.app.emotionalreset.ui.components.FeelingMandala
import com.mindvibe.app.emotionalreset.ui.components.IntensitySelector
import com.mindvibe.app.sadhana.ui.components.SacredPrimaryButton
import com.mindvibe.app.ui.theme.KiaanColors
import com.mindvibe.app.ui.theme.KiaanFonts

/**
 * Phase 1 — The Feeling Mandala. User taps a petal (feeling), selects an
 * intensity (1–5), optionally pours their heart into the context textarea,
 * then offers the emotion to Sakha.
 */
@Composable
fun FeelingMandalaScreen(
    selectedFeeling: FeelingState?,
    intensity: Int,
    context: String,
    isComposing: Boolean,
    onSelectFeeling: (FeelingState) -> Unit,
    onSelectIntensity: (Int) -> Unit,
    onContextChange: (String) -> Unit,
    onOffer: () -> Unit,
    modifier: Modifier = Modifier,
) {
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
            verticalArrangement = Arrangement.Top,
        ) {
            Spacer(Modifier.height(20.dp))

            Text(
                text = "THE PARAMATMA IS WITH YOU",
                style = MaterialTheme.typography.labelSmall.copy(
                    color = KiaanColors.TextMuted,
                    letterSpacing = 3.sp,
                ),
            )
            Spacer(Modifier.height(10.dp))
            Text(
                text = "How is your heart right now?",
                style = MaterialTheme.typography.headlineMedium.copy(
                    color = KiaanColors.TextPrimary,
                    fontFamily = KiaanFonts.Serif,
                ),
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = "Touch the petal that speaks to you",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                    fontStyle = FontStyle.Italic,
                ),
                textAlign = TextAlign.Center,
            )

            Spacer(Modifier.height(16.dp))

            FeelingMandala(
                selected = selectedFeeling,
                onSelect = onSelectFeeling,
            )

            if (selectedFeeling != null) {
                Spacer(Modifier.height(16.dp))
                Text(
                    text = "${selectedFeeling.label} · ${selectedFeeling.sanskrit}",
                    style = MaterialTheme.typography.titleLarge.copy(
                        color = selectedFeeling.glowColor,
                        fontFamily = KiaanFonts.Serif,
                        letterSpacing = 1.sp,
                    ),
                )
            }

            Spacer(Modifier.height(16.dp))

            IntensitySelector(
                visible = selectedFeeling != null,
                current = intensity,
                onChange = onSelectIntensity,
                glowColor = selectedFeeling?.glowColor ?: KiaanColors.SacredGold,
            )

            AnimatedVisibility(
                visible = selectedFeeling != null && intensity > 0,
                enter = fadeIn() + slideInVertically { it / 4 },
                exit = fadeOut(),
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Spacer(Modifier.height(16.dp))

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color(0x66161A42))
                            .border(1.dp, Color(0x26F0C040), RoundedCornerShape(20.dp))
                            .padding(16.dp),
                    ) {
                        Text(
                            text = "Pour your heart here… (optional)",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                color = KiaanColors.TextMuted,
                                fontStyle = FontStyle.Italic,
                            ),
                        )
                        Spacer(Modifier.height(8.dp))
                        BasicTextField(
                            value = context,
                            onValueChange = onContextChange,
                            textStyle = TextStyle(
                                color = KiaanColors.TextPrimary,
                                fontSize = 15.sp,
                                lineHeight = 22.sp,
                            ),
                            cursorBrush = SolidColor(KiaanColors.SacredGold),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(96.dp),
                            decorationBox = { inner ->
                                Box {
                                    if (context.isEmpty()) {
                                        Text(
                                            text = "Speak freely — this is sacred space",
                                            style = MaterialTheme.typography.bodyMedium.copy(
                                                color = KiaanColors.TextMuted,
                                            ),
                                        )
                                    }
                                    inner()
                                }
                            },
                        )
                    }

                    Spacer(Modifier.height(20.dp))

                    if (isComposing) {
                        CircularProgressIndicator(color = KiaanColors.SacredGold)
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = "Sakha is receiving your offering…",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                color = KiaanColors.SacredGold,
                                fontStyle = FontStyle.Italic,
                            ),
                        )
                    } else {
                        SacredPrimaryButton(
                            text = "Offer to Sakha",
                            onClick = onOffer,
                        )
                    }

                    Spacer(Modifier.height(32.dp))
                }
            }

            Spacer(Modifier.height(40.dp))
        }
    }
}
