package com.mindvibe.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import dagger.hilt.android.AndroidEntryPoint

/**
 * Main Activity for MindVibe Android app
 * Entry point for the Jetpack Compose UI
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            MindVibeTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    WelcomeScreen()
                }
            }
        }
    }
}

@Composable
fun WelcomeScreen() {
    Text(
        text = "Welcome to MindVibe",
        style = MaterialTheme.typography.headlineLarge
    )
}

@Composable
fun MindVibeTheme(content: @Composable () -> Unit) {
    MaterialTheme {
        content()
    }
}

@Preview(showBackground = true)
@Composable
fun WelcomeScreenPreview() {
    MindVibeTheme {
        WelcomeScreen()
    }
}
