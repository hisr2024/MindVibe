package com.mindvibe.app.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

/**
 * Kiaanverse sacred palette — dark, cosmic, gold-accented.
 * Matches kiaanverse.com mobile visual language.
 */
object KiaanColors {
    // Cosmos / background
    val CosmosBlack = Color(0xFF05060C)
    val DeepIndigo = Color(0xFF0A0D1F)
    val VioletNight = Color(0xFF101433)
    val MidnightNavy = Color(0xFF0D1032)

    // Sacred gold
    val SacredGold = Color(0xFFF0C040)
    val DeepGold = Color(0xFFB98824)
    val AmberGlow = Color(0xFFE0A530)

    // Text
    val TextPrimary = Color(0xFFF6F1E3)
    val TextSecondary = Color(0xFFB8B3A4)
    val TextMuted = Color(0xFF7A7561)

    // Mood sphere colors (from web parity)
    val MoodRadiant = Color(0xFFF0C040)
    val MoodPeaceful = Color(0xFF67E8F9)
    val MoodGrateful = Color(0xFF6EE7B7)
    val MoodSeeking = Color(0xFFC4B5FD)
    val MoodHeavy = Color(0xFF93C5FD)
    val MoodWounded = Color(0xFFFCA5A5)

    // Breath flower palette
    val BreathInhale = Color(0xFF22C6E6)
    val BreathHold = Color(0xFFEACB4D)
    val BreathExhale = Color(0xFFF08A2C)
    val BreathRest = Color(0xFF7A7BE8)

    // Card surfaces
    val CardSurface = Color(0xFF151A3B)
    val CardStroke = Color(0x66F0C040)

    // Gradients
    val CosmosBackground: Brush
        get() = Brush.radialGradient(
            colors = listOf(
                Color(0xFF0F1336),
                Color(0xFF070916),
                CosmosBlack,
            ),
            radius = 1400f,
        )

    val SacredButtonGradient: Brush
        get() = Brush.linearGradient(
            colors = listOf(
                Color(0xFF2B6FF5),
                Color(0xFF1E40AF),
            ),
        )

    val GoldStrokeGradient: Brush
        get() = Brush.linearGradient(
            colors = listOf(SacredGold, DeepGold, SacredGold),
        )
}
