package com.mindvibe.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindvibe.app.emotionalreset.ui.EmotionalResetHost
import com.mindvibe.app.journey.ui.JourneyHost
import com.mindvibe.app.ui.theme.KiaanColors
import com.mindvibe.app.ui.theme.KiaanFonts
import com.mindvibe.app.ui.theme.KiaanTheme
import dagger.hilt.android.AndroidEntryPoint

/**
 * Entry point for the Kiaanverse Android app.
 *
 * The home experience is the षड्रिपु Journeys flow — a 1:1 adaptation of
 * kiaanverse.com mobile (Today / Journeys / Battleground / Wisdom). A
 * discreet gold sparkle launcher in the top-right corner reveals the
 * Emotional Reset ritual (kiaanverse.com/m/er) as a full-screen overlay,
 * matching the web's behavior of opening /m/er as a standalone flow.
 *
 * Edge-to-edge is enabled so the cosmos background flows under the system
 * bars without a letterbox.
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(Color.Transparent.value.toInt()),
            navigationBarStyle = SystemBarStyle.dark(Color.Transparent.value.toInt()),
        )
        super.onCreate(savedInstanceState)

        setContent {
            KiaanTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = KiaanColors.CosmosBlack,
                ) {
                    SakhaRoot()
                }
            }
        }
    }
}

/** Root destinations — Journey is home; Emotional Reset is a full-screen tool. */
private enum class SakhaRoute { Journey, EmotionalReset }

/**
 * App shell that hosts [JourneyHost] and crossfades to [EmotionalResetHost]
 * when the user taps the sparkle launcher. System-back from the overlay
 * returns to Journey without tearing down its tab/screen state.
 */
@Composable
private fun SakhaRoot() {
    var route by rememberSaveable { mutableStateOf(SakhaRoute.Journey) }

    // EmotionalResetHost installs its own phase-aware BackHandler first; this
    // only fires once the ritual has exited (or from the Mandala phase).
    BackHandler(enabled = route == SakhaRoute.EmotionalReset) {
        route = SakhaRoute.Journey
    }

    Box(modifier = Modifier.fillMaxSize()) {
        AnimatedContent(
            targetState = route,
            transitionSpec = {
                fadeIn(tween(400)) togetherWith fadeOut(tween(250))
            },
            label = "sakhaRootTransition",
            modifier = Modifier.fillMaxSize(),
        ) { current ->
            when (current) {
                SakhaRoute.Journey -> JourneyHost()
                SakhaRoute.EmotionalReset -> EmotionalResetHost(
                    onExit = { route = SakhaRoute.Journey },
                )
            }
        }

        // Overlay the launcher only on the Journey home — hide it inside
        // the ritual so the ceremony canvas is unobstructed.
        AnimatedVisibility(
            visible = route == SakhaRoute.Journey,
            enter = fadeIn(tween(400)),
            exit = fadeOut(tween(200)),
            modifier = Modifier
                .align(Alignment.TopEnd)
                .statusBarsPadding()
                .padding(top = 8.dp, end = 12.dp),
        ) {
            EmotionalResetLauncher(
                onClick = { route = SakhaRoute.EmotionalReset },
            )
        }
    }
}

/**
 * Tiny gold sparkle button used to open Emotional Reset from the Journey
 * home. Matches the golden-ring aesthetic of the web's entry.
 */
@Composable
private fun EmotionalResetLauncher(onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(44.dp)
            .clip(CircleShape)
            .background(
                Brush.radialGradient(
                    colors = listOf(
                        Color(0x33F0C040),
                        Color(0x110A0D1F),
                    ),
                ),
            )
            .border(1.dp, KiaanColors.SacredGold.copy(alpha = 0.7f), CircleShape)
            .clickable(
                onClick = onClick,
                role = Role.Button,
            ),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = "✦",
            style = TextStyle(
                fontFamily = KiaanFonts.Serif,
                fontSize = 20.sp,
                color = KiaanColors.SacredGold,
            ),
        )
    }
}

@Preview(showBackground = true, backgroundColor = 0xFF05060C)
@Composable
private fun SakhaRootPreview() {
    KiaanTheme {
        SakhaRoot()
    }
}
