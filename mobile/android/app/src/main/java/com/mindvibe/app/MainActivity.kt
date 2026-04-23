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
import com.mindvibe.app.sadhana.ui.NityaSadhanaHost
import com.mindvibe.app.ui.theme.KiaanColors
import com.mindvibe.app.ui.theme.KiaanTheme
import dagger.hilt.android.AndroidEntryPoint

/**
 * Entry point for the MindVibe / Kiaanverse Android app.
 *
 * The home experience is the Nitya Sadhana — the adaptive daily practice
 * that mirrors kiaanverse.com/m/sadhana. Edge-to-edge is enabled so the
 * cosmos background flows under the system bars without a letterbox.
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
                    NityaSadhanaHost()
                }
            }
        }
    }
}

@Preview(showBackground = true, backgroundColor = 0xFF05060C)
@Composable
private fun NityaSadhanaHostPreview() {
    KiaanTheme {
        NityaSadhanaHost()
    }
}
