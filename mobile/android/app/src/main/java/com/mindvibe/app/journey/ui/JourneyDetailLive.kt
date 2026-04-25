package com.mindvibe.app.journey.ui

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.mindvibe.app.journey.data.JourneyContent
import com.mindvibe.app.journey.viewmodel.JourneyDetailViewModel
import com.mindvibe.app.ui.theme.KiaanColors

/**
 * Live-data entry point for the Journey detail experience. The host
 * navigates here with a journey id; the ViewModel:
 *   - calls the live /api/journey-engine endpoints,
 *   - falls back to the offline JourneyContent catalog when the journey
 *     id is a catalog stub or the network is unreachable,
 *   - keeps the screen state alive across configuration changes.
 *
 * Why this exists alongside [JourneyDetailScreen]: the original screen is
 * a pure / preview-friendly renderer over the [JourneyContent] catalog, so
 * removing it would break every Compose preview. This wrapper sits on top
 * of the same set of composables but feeds them from the VM state.
 */
@Composable
fun JourneyDetailLive(
    journeyId: String,
    onBack: () -> Unit,
    viewModel: JourneyDetailViewModel = hiltViewModel(),
) {
    LaunchedEffect(journeyId) { viewModel.bind(journeyId) }
    val ui by viewModel.state.collectAsState()

    when {
        // First load — show a contemplative skeleton instead of a blank screen.
        ui.loading && ui.journey == null -> JourneyLoadingState()

        // Hard error and nothing cached — give the user a way back.
        ui.error != null && ui.journey == null -> JourneyErrorState(
            message = ui.error!!,
            onRetry = viewModel::load,
            onBack = onBack,
        )

        // Journey loaded — defer to the existing catalog renderer when this
        // is a stub id (so previews + live offline behave identically), and
        // hand off to a thin live-bound shim otherwise.
        ui.journey != null -> {
            val isCatalog = JourneyContent.journeys.any { it.id == journeyId }
            if (isCatalog) {
                // The catalog renderer is fully self-contained and needs no
                // live state. This is the path that runs in the AAB review
                // build where the backend isn't reachable.
                JourneyDetailScreen(journeyId = journeyId, onBack = onBack)
            } else {
                JourneyDetailLiveBody(
                    viewModel = viewModel,
                    onBack = onBack,
                )
            }
        }
    }
}

@Composable
private fun JourneyLoadingState() {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = KiaanColors.SacredGold, strokeWidth = 2.dp)
            Spacer(Modifier.height(12.dp))
            Text(
                "Composing your practice…",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                ),
            )
        }
    }
}

@Composable
private fun JourneyErrorState(
    message: String,
    onRetry: () -> Unit,
    onBack: () -> Unit,
) {
    Box(Modifier.fillMaxSize().padding(32.dp), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                "Something went sideways",
                style = MaterialTheme.typography.headlineMedium.copy(
                    color = KiaanColors.TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                ),
            )
            Spacer(Modifier.height(8.dp))
            Text(
                message,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                ),
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(20.dp))
            Row(
                Modifier
                    .clip(RoundedCornerShape(14.dp))
                    .background(KiaanColors.SacredGold)
                    .clickable { onRetry() }
                    .padding(horizontal = 18.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    Icons.Default.Refresh,
                    contentDescription = null,
                    tint = Color.Black,
                    modifier = Modifier.size(16.dp),
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    "Try Again",
                    style = MaterialTheme.typography.labelLarge.copy(
                        color = Color.Black,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                    ),
                )
            }
            Spacer(Modifier.height(10.dp))
            Text(
                "Return to Journeys",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = KiaanColors.TextSecondary,
                ),
                modifier = Modifier
                    .clip(RoundedCornerShape(50))
                    .clickable { onBack() }
                    .padding(horizontal = 16.dp, vertical = 8.dp),
            )
        }
    }
}

/**
 * Minimal live shim for journeys fetched from the engine. We don't have
 * a complete domain mapping from StepDto yet (modern_example sub-fields
 * vary), so for now the live path renders the same catalog body when the
 * vice can be mapped, and otherwise shows a safe placeholder. The catalog
 * path above handles the offline / preview case fully — this stub is
 * intentionally small until we wire the rest of the response generation.
 */
@Composable
private fun JourneyDetailLiveBody(
    viewModel: JourneyDetailViewModel,
    onBack: () -> Unit,
) {
    val ui by viewModel.state.collectAsState()
    val journey = ui.journey ?: return
    // Re-use the catalog journey of the same vice as the renderer source —
    // this gives us the full visual treatment while live data flows in.
    val template = JourneyContent.journeys.firstOrNull { it.vice == journey.vice }
    if (template != null) {
        JourneyDetailScreen(journeyId = template.id, onBack = onBack)
    } else {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text(
                "${journey.title} · Day ${journey.currentDay} of ${journey.durationDays}",
                style = MaterialTheme.typography.bodyLarge.copy(
                    color = KiaanColors.TextPrimary,
                ),
            )
        }
    }
}
