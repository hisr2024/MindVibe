package com.mindvibe.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import com.mindvibe.app.journey.ui.JourneyHost
import com.mindvibe.app.ui.theme.KiaanColors
import com.mindvibe.app.ui.theme.KiaanTheme
import dagger.hilt.android.AndroidEntryPoint

/**
 * Entry point for the Kiaanverse Android app.
 *
 * The home experience is the षड्रिपु Journeys flow — a 1:1 adaptation of
 * kiaanverse.com mobile (Today / Journeys / Battleground / Wisdom). Edge-
 * to-edge is enabled so the cosmos background flows under the system bars
 * without a letterbox.
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
                    JourneyHost()
                }
            }
        }
    }
}

@Preview(showBackground = true, backgroundColor = 0xFF05060C)
@Composable
private fun JourneyHostPreview() {
    KiaanTheme {
        JourneyHost()
    }
}
