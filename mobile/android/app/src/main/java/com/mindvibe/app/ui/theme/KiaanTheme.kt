package com.mindvibe.app.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val KiaanDarkColorScheme = darkColorScheme(
    primary = KiaanColors.SacredGold,
    onPrimary = KiaanColors.CosmosBlack,
    secondary = KiaanColors.MoodPeaceful,
    onSecondary = KiaanColors.CosmosBlack,
    tertiary = KiaanColors.MoodSeeking,
    background = KiaanColors.CosmosBlack,
    onBackground = KiaanColors.TextPrimary,
    surface = KiaanColors.DeepIndigo,
    onSurface = KiaanColors.TextPrimary,
    surfaceVariant = KiaanColors.CardSurface,
    onSurfaceVariant = KiaanColors.TextSecondary,
    outline = KiaanColors.DeepGold,
    error = KiaanColors.MoodWounded,
)

/**
 * Kiaanverse / Nitya Sadhana theme — always dark, always sacred.
 * The practice demands a contemplative night-sky canvas; we do not offer
 * a light variant on purpose.
 */
@Composable
fun KiaanTheme(
    @Suppress("UNUSED_PARAMETER") darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colorScheme = KiaanDarkColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = KiaanColors.CosmosBlack.toArgb()
            window.navigationBarColor = KiaanColors.CosmosBlack.toArgb()
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = false
                isAppearanceLightNavigationBars = false
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                window.isNavigationBarContrastEnforced = false
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = KiaanTypography,
        content = content,
    )
}
