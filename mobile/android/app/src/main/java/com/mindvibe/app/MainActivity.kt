package com.mindvibe.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import com.mindvibe.app.emotionalreset.ui.EmotionalResetHost
import com.mindvibe.app.home.SakhaHomeScreen
import com.mindvibe.app.sadhana.ui.NityaSadhanaHost
import com.mindvibe.app.ui.theme.KiaanColors
import com.mindvibe.app.ui.theme.KiaanTheme
import dagger.hilt.android.AndroidEntryPoint

/**
 * Entry point for the MindVibe / Kiaanverse Android app.
 *
 * The app opens on Sakha's home — a minimal chooser that routes to either
 * the Nitya Sadhana practice or the Emotional Reset ritual. Both are 1:1
 * adaptations of the corresponding flows on kiaanverse.com/m.
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

/** The three root destinations of the Android app. */
private enum class SakhaRoute { Home, Sadhana, EmotionalReset }

@Composable
private fun SakhaRoot() {
    var route by rememberSaveable { mutableStateOf(SakhaRoute.Home) }

    AnimatedContent(
        targetState = route,
        transitionSpec = {
            fadeIn(tween(400)) togetherWith fadeOut(tween(250))
        },
        label = "sakhaRootTransition",
        modifier = Modifier.fillMaxSize(),
    ) { current ->
        when (current) {
            SakhaRoute.Home -> SakhaHomeScreen(
                onOpenSadhana = { route = SakhaRoute.Sadhana },
                onOpenEmotionalReset = { route = SakhaRoute.EmotionalReset },
            )

            SakhaRoute.Sadhana -> NityaSadhanaHost()

            SakhaRoute.EmotionalReset -> EmotionalResetHost(
                onExit = { route = SakhaRoute.Home },
            )
        }
    }
}

@Preview(showBackground = true, backgroundColor = 0xFF05060C)
@Composable
private fun SakhaRootPreview() {
    KiaanTheme {
        SakhaRoot()
    }
}
