package com.mindvibe.app.journey.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Hub
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindvibe.app.journey.model.BottomTab
import com.mindvibe.app.ui.theme.KiaanColors

private sealed class Screen {
    data object Home : Screen()
    data class Detail(val journeyId: String) : Screen()
}

/**
 * Root container for the Shadripu Journeys experience — renders the dark
 * cosmos background, current tab, and the bottom navigation bar. Pushing
 * a Journey detail takes over the whole screen (matches the web flow).
 */
@Composable
fun JourneyHost() {
    var screen by remember { mutableStateOf<Screen>(Screen.Home) }
    var tab by remember { mutableStateOf(BottomTab.Today) }

    Box(
        Modifier
            .fillMaxSize()
            .background(KiaanColors.CosmosBackground),
    ) {
        when (val s = screen) {
            is Screen.Home -> Scaffold(
                containerColor = Color.Transparent,
                bottomBar = {
                    BottomNav(
                        current = tab,
                        onSelect = { tab = it },
                    )
                },
            ) { inner ->
                AnimatedContent(
                    targetState = tab,
                    transitionSpec = { fadeIn() togetherWith fadeOut() },
                    label = "tab-switch",
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(inner),
                ) { current ->
                    when (current) {
                        BottomTab.Today -> TodayScreen(
                            onOpenJourney = { screen = Screen.Detail(it) },
                            onStartJourney = { screen = Screen.Detail(it) },
                        )
                        BottomTab.Journeys -> JourneysListScreen(
                            onOpenJourney = { screen = Screen.Detail(it) },
                        )
                        BottomTab.Battleground -> BattlegroundScreen(
                            onOpenJourney = { screen = Screen.Detail(it) },
                        )
                        BottomTab.Wisdom -> WisdomScreen()
                    }
                }
            }

            is Screen.Detail -> JourneyDetailScreen(
                journeyId = s.journeyId,
                onBack = { screen = Screen.Home },
            )
        }
    }
}

// ============================================================================
// Bottom nav
// ============================================================================

@Composable
private fun BottomNav(
    current: BottomTab,
    onSelect: (BottomTab) -> Unit,
) {
    Box(
        Modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color.Transparent,
                        KiaanColors.CosmosBlack,
                    ),
                ),
            )
            .padding(top = 4.dp, bottom = 4.dp),
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BottomTab.values().forEach { tab ->
                NavItem(
                    tab = tab,
                    selected = tab == current,
                    onClick = { onSelect(tab) },
                )
            }
        }
    }
}

@Composable
private fun NavItem(
    tab: BottomTab,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val color = if (selected) KiaanColors.SacredGold else KiaanColors.TextSecondary.copy(alpha = 0.75f)
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 4.dp),
    ) {
        Box(contentAlignment = Alignment.TopEnd) {
            Icon(
                imageVector = iconFor(tab),
                contentDescription = tab.label,
                tint = color,
                modifier = Modifier.size(26.dp),
            )
            if (selected) {
                Box(
                    Modifier
                        .size(6.dp)
                        .clip(RoundedCornerShape(50))
                        .background(KiaanColors.SacredGold),
                )
            }
        }
        Spacer(Modifier.size(6.dp))
        Text(
            tab.label,
            style = MaterialTheme.typography.labelSmall.copy(
                color = color,
                fontSize = 11.sp,
                fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                letterSpacing = 0.sp,
            ),
        )
    }
}

private fun iconFor(tab: BottomTab): ImageVector = when (tab) {
    BottomTab.Today -> Icons.Default.LocalFireDepartment
    BottomTab.Journeys -> Icons.Default.Shield
    BottomTab.Battleground -> Icons.Default.Hub
    BottomTab.Wisdom -> Icons.Default.AutoAwesome
}
