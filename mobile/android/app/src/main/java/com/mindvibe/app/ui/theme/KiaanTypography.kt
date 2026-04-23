package com.mindvibe.app.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/**
 * Kiaan typography. We use system-available families so Devanagari (संस्कृत)
 * renders correctly on every Android device without bundling heavy fonts.
 * The Serif family on Android maps to Noto Serif / Noto Serif Devanagari,
 * which carries the Sanskrit glyphs we need.
 */
object KiaanFonts {
    val Serif: FontFamily = FontFamily.Serif
    val Sans: FontFamily = FontFamily.SansSerif
    val Cursive: FontFamily = FontFamily.Cursive // used for italic "insight" blocks
}

val KiaanTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = KiaanFonts.Serif,
        fontWeight = FontWeight.Normal,
        fontSize = 40.sp,
        lineHeight = 48.sp,
        letterSpacing = 0.5.sp,
    ),
    displayMedium = TextStyle(
        fontFamily = KiaanFonts.Serif,
        fontWeight = FontWeight.Medium,
        fontSize = 30.sp,
        lineHeight = 38.sp,
    ),
    headlineLarge = TextStyle(
        fontFamily = KiaanFonts.Serif,
        fontWeight = FontWeight.Normal,
        fontStyle = FontStyle.Italic,
        fontSize = 26.sp,
        lineHeight = 34.sp,
    ),
    headlineMedium = TextStyle(
        fontFamily = KiaanFonts.Serif,
        fontWeight = FontWeight.Medium,
        fontSize = 22.sp,
        lineHeight = 30.sp,
    ),
    titleLarge = TextStyle(
        fontFamily = KiaanFonts.Sans,
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        lineHeight = 26.sp,
        letterSpacing = 2.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = KiaanFonts.Sans,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = KiaanFonts.Sans,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 22.sp,
    ),
    labelLarge = TextStyle(
        fontFamily = KiaanFonts.Sans,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 3.sp,
    ),
    labelSmall = TextStyle(
        fontFamily = KiaanFonts.Sans,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        letterSpacing = 1.5.sp,
    ),
)
