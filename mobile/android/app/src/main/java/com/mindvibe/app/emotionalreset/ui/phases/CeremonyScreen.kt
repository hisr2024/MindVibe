package com.mindvibe.app.emotionalreset.ui.phases

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindvibe.app.emotionalreset.model.EmotionalResetResult
import com.mindvibe.app.emotionalreset.ui.components.CeremonyCanvas
import com.mindvibe.app.emotionalreset.ui.components.SparkleIcon
import com.mindvibe.app.ui.theme.KiaanColors
import com.mindvibe.app.ui.theme.KiaanFonts
import kotlinx.coroutines.delay

/**
 * Phase 5 — The Release. A 1:1 adaptation of kiaanverse.com's emotional
 * reset ceremony. Particles of the offering (gold) and peace (blue) orbit
 * the ॐ, then converge into its center as the result card blooms with:
 *
 *   "Your offering has been received. The Atman within you is untouched."
 *   ✦ EMOTIONAL RESET COMPLETE
 *   Duration: N min    Confusion → Peace
 *   [ Return to Sakha ]
 */
@Composable
fun CeremonyScreen(
    result: EmotionalResetResult?,
    fallbackTransitionLabel: String?,
    onReturnToSakha: () -> Unit,
    modifier: Modifier = Modifier,
) {
    // Stage: 0 = cosmic orbit, 1 = converge, 2 = result card.
    var stage by remember { mutableStateOf(0) }
    var convergeProgress by remember { mutableFloatStateOf(0f) }

    LaunchedEffect(Unit) {
        delay(2_400L)
        stage = 1

        val start = System.currentTimeMillis()
        val duration = 2_000L
        while (convergeProgress < 1f) {
            val elapsed = (System.currentTimeMillis() - start).toFloat()
            convergeProgress = (elapsed / duration).coerceIn(0f, 1f)
            delay(16L)
        }

        delay(300L)
        stage = 2
    }

    Box(modifier = modifier.fillMaxSize()) {
        // The cosmic canvas persists across all stages — it's the altar.
        CeremonyCanvas(
            convergeProgress = convergeProgress,
            modifier = Modifier.fillMaxSize(),
        )

        AnimatedVisibility(
            visible = stage >= 2,
            enter = fadeIn() + slideInVertically { it / 6 },
            modifier = Modifier.fillMaxSize(),
        ) {
            ResultCard(
                result = result,
                fallbackTransitionLabel = fallbackTransitionLabel,
                onReturnToSakha = onReturnToSakha,
            )
        }
    }
}

@Composable
private fun ResultCard(
    result: EmotionalResetResult?,
    fallbackTransitionLabel: String?,
    onReturnToSakha: () -> Unit,
) {
    val durationMin = result?.durationMinutes ?: 2
    val transition = result?.transitionLabel ?: fallbackTransitionLabel ?: "Offering → Peace"

    Column(
        modifier = Modifier
            .fillMaxSize()
            .systemBarsPadding()
            .padding(horizontal = 28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = "Your offering has been received.",
            style = MaterialTheme.typography.headlineMedium.copy(
                color = KiaanColors.TextPrimary,
                fontFamily = KiaanFonts.Serif,
                fontStyle = FontStyle.Italic,
                lineHeight = 34.sp,
                fontSize = 22.sp,
                fontWeight = FontWeight.Normal,
            ),
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(10.dp))
        Text(
            text = "The Atman within you is untouched.",
            style = MaterialTheme.typography.headlineMedium.copy(
                color = KiaanColors.TextPrimary,
                fontFamily = KiaanFonts.Serif,
                fontStyle = FontStyle.Italic,
                lineHeight = 34.sp,
                fontSize = 22.sp,
                fontWeight = FontWeight.Normal,
            ),
            textAlign = TextAlign.Center,
        )

        Spacer(Modifier.height(28.dp))

        SparkleIcon(size = 96.dp)

        Spacer(Modifier.height(14.dp))

        Text(
            text = "EMOTIONAL RESET COMPLETE",
            style = MaterialTheme.typography.labelLarge.copy(
                color = KiaanColors.SacredGold,
                letterSpacing = 3.sp,
                fontWeight = FontWeight.SemiBold,
            ),
            textAlign = TextAlign.Center,
        )

        Spacer(Modifier.height(10.dp))

        Row(
            horizontalArrangement = Arrangement.spacedBy(28.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "Duration: $durationMin min",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                ),
            )
            Text(
                text = transition,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                ),
            )
        }

        Spacer(Modifier.height(28.dp))

        ReturnToSakhaButton(onClick = onReturnToSakha)
    }
}

@Composable
private fun ReturnToSakhaButton(onClick: () -> Unit) {
    OutlinedButton(
        onClick = onClick,
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.5.dp, KiaanColors.SacredGold),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = Color.Transparent,
            contentColor = KiaanColors.SacredGold,
        ),
        modifier = Modifier
            .wrapContentWidth()
            .width(260.dp)
            .height(54.dp),
    ) {
        Text(
            text = "Return to Sakha",
            style = MaterialTheme.typography.titleLarge.copy(
                color = KiaanColors.SacredGold,
                fontWeight = FontWeight.Medium,
                letterSpacing = 0.5.sp,
                fontSize = 17.sp,
            ),
            textAlign = TextAlign.Center,
        )
    }
}
