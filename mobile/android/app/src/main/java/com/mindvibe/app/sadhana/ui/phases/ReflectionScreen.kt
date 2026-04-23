package com.mindvibe.app.sadhana.ui.phases

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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.mindvibe.app.sadhana.model.ReflectionPrompt
import com.mindvibe.app.sadhana.ui.components.SacredPrimaryButton
import com.mindvibe.app.ui.theme.KiaanColors
import com.mindvibe.app.ui.theme.KiaanFonts

@Composable
fun ReflectionScreen(
    prompt: ReflectionPrompt,
    reflectionText: String,
    onReflectionChange: (String) -> Unit,
    onComplete: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val wordCount = remember(reflectionText) {
        reflectionText.trim().split(Regex("\\s+")).filter { it.isNotBlank() }.size
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
        ) {
            Spacer(Modifier.height(16.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "✦",
                    color = KiaanColors.SacredGold,
                    style = MaterialTheme.typography.labelLarge,
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    text = "REFLECTION",
                    style = MaterialTheme.typography.labelLarge.copy(
                        color = KiaanColors.SacredGold,
                        fontWeight = FontWeight.SemiBold,
                    ),
                )
            }

            Spacer(Modifier.height(16.dp))
            Text(
                text = prompt.prompt,
                style = MaterialTheme.typography.headlineLarge.copy(
                    color = KiaanColors.TextPrimary,
                    fontStyle = FontStyle.Italic,
                    fontFamily = KiaanFonts.Serif,
                ),
            )
            Spacer(Modifier.height(14.dp))
            Text(
                text = prompt.guidingQuestion,
                style = MaterialTheme.typography.bodyLarge.copy(
                    color = KiaanColors.TextSecondary,
                    fontStyle = FontStyle.Italic,
                ),
            )

            Spacer(Modifier.height(20.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(KiaanColors.CardSurface)
                    .border(
                        width = 1.dp,
                        color = KiaanColors.CardStroke.copy(alpha = 0.6f),
                        shape = RoundedCornerShape(18.dp),
                    ),
            ) {
                TextField(
                    value = reflectionText,
                    onValueChange = onReflectionChange,
                    placeholder = {
                        Text(
                            text = prompt.placeholder,
                            style = MaterialTheme.typography.bodyLarge.copy(
                                color = KiaanColors.TextMuted,
                                fontStyle = FontStyle.Italic,
                                fontFamily = KiaanFonts.Serif,
                            ),
                        )
                    },
                    textStyle = MaterialTheme.typography.bodyLarge.copy(
                        color = KiaanColors.TextPrimary,
                        fontFamily = KiaanFonts.Serif,
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 180.dp),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        disabledContainerColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        cursorColor = KiaanColors.SacredGold,
                    ),
                )
            }

            Spacer(Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "✦ $wordCount word${if (wordCount == 1) "" else "s"} offered",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = KiaanColors.TextMuted,
                    ),
                )
            }

            Spacer(Modifier.height(24.dp))
            SacredPrimaryButton(
                text = if (reflectionText.isBlank()) "Sit in silence" else "Offer this reflection",
                onClick = onComplete,
            )
            Spacer(Modifier.height(24.dp))
        }
    }
}

