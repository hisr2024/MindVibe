package com.mindvibe.app.journey.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mindvibe.app.ui.theme.KiaanColors

/**
 * A card shaped like the reference screenshots: rounded, dark surface with
 * a colored left accent rail (or full colored border for active cards).
 */
@Composable
fun AccentCard(
    accent: Color,
    modifier: Modifier = Modifier,
    variant: AccentCardVariant = AccentCardVariant.LeftRail,
    innerPadding: PaddingValues = PaddingValues(horizontal = 20.dp, vertical = 18.dp),
    content: @Composable () -> Unit,
) {
    val shape = RoundedCornerShape(20.dp)
    val base = Modifier
        .fillMaxWidth()
        .clip(shape)
        .background(KiaanColors.CosmosBlack.copy(alpha = 0.7f))

    val decorated = when (variant) {
        AccentCardVariant.LeftRail -> base.then(
            Modifier.border(
                width = 1.dp,
                color = accent.copy(alpha = 0.22f),
                shape = shape,
            ),
        )
        AccentCardVariant.FullBorder -> base.then(
            Modifier.border(
                width = 1.5.dp,
                color = accent.copy(alpha = 0.85f),
                shape = shape,
            ),
        )
        AccentCardVariant.Glow -> base.then(
            Modifier
                .border(1.dp, accent.copy(alpha = 0.8f), shape)
                .background(accent.copy(alpha = 0.04f), shape),
        )
    }

    Row(modifier = modifier.then(decorated).height(IntrinsicSize.Min)) {
        if (variant == AccentCardVariant.LeftRail) {
            Box(
                Modifier
                    .width(3.dp)
                    .fillMaxHeight()
                    .background(accent),
            )
        }
        Column(Modifier.padding(innerPadding)) { content() }
    }
}

enum class AccentCardVariant { LeftRail, FullBorder, Glow }

/** Section eyebrow label — all caps, spaced, muted. */
@Composable
fun SectionEyebrow(
    text: String,
    color: Color = KiaanColors.TextSecondary,
    modifier: Modifier = Modifier,
) {
    Text(
        text = text.uppercase(),
        style = MaterialTheme.typography.labelLarge.copy(
            letterSpacing = 3.sp,
            color = color,
            fontWeight = FontWeight.Medium,
        ),
        modifier = modifier,
    )
}

/** Devanagari hero word with colored accent glow — matches the big vice tiles. */
@Composable
fun DevanagariHero(
    text: String,
    color: Color,
    modifier: Modifier = Modifier,
    size: Dp = 48.dp,
) {
    Text(
        text = text,
        style = TextStyle(
            fontFamily = MaterialTheme.typography.displayLarge.fontFamily,
            fontWeight = FontWeight.SemiBold,
            fontSize = with(androidx.compose.ui.platform.LocalDensity.current) { size.toSp() },
            color = color,
            shadow = androidx.compose.ui.graphics.Shadow(color = color.copy(alpha = 0.35f), blurRadius = 18f),
        ),
        modifier = modifier,
    )
}

/** A pill used for tag/chip placements on journey cards. */
@Composable
fun Chip(
    text: String,
    color: Color,
    modifier: Modifier = Modifier,
    filled: Boolean = false,
) {
    val bg = if (filled) color.copy(alpha = 0.2f) else Color.Transparent
    Box(
        modifier
            .clip(RoundedCornerShape(50))
            .background(bg)
            .border(1.dp, color.copy(alpha = 0.55f), RoundedCornerShape(50))
            .padding(horizontal = 10.dp, vertical = 4.dp),
    ) {
        Text(
            text = text,
            style = LocalTextStyle.current.copy(
                color = color,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                letterSpacing = 0.4.sp,
            ),
        )
    }
}

/** Italic serif quote commonly used for teaching / reflection bodies. */
@Composable
fun SerifItalic(
    text: String,
    modifier: Modifier = Modifier,
    color: Color = KiaanColors.TextPrimary,
    fontSize: androidx.compose.ui.unit.TextUnit = 16.sp,
) {
    Text(
        text = text,
        style = TextStyle(
            fontFamily = MaterialTheme.typography.headlineLarge.fontFamily,
            fontStyle = FontStyle.Italic,
            fontSize = fontSize,
            lineHeight = fontSize * 1.5f,
            color = color,
            fontWeight = FontWeight.Normal,
        ),
        modifier = modifier,
    )
}

/** A thin horizontal track-filled progress bar. */
@Composable
fun LinearProgressRail(
    progress: Float, // 0f..1f
    color: Color,
    modifier: Modifier = Modifier,
    height: Dp = 4.dp,
) {
    val shape = RoundedCornerShape(50)
    Box(
        modifier
            .fillMaxWidth()
            .height(height)
            .clip(shape)
            .background(Color.White.copy(alpha = 0.08f)),
    ) {
        Box(
            Modifier
                .fillMaxWidth(fraction = progress.coerceIn(0f, 1f))
                .height(height)
                .clip(shape)
                .background(
                    Brush.horizontalGradient(listOf(color.copy(alpha = 0.7f), color)),
                ),
        )
    }
}

/** Spacer utilities for readability. */
@Composable fun VSpace(h: Dp) { Spacer(Modifier.height(h)) }
@Composable fun HSpace(w: Dp) { Spacer(Modifier.width(w)) }

/** A small gold divider used for the "Wisdom" card separator. */
@Composable
fun GoldDivider(modifier: Modifier = Modifier) {
    Box(
        modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(
                Brush.horizontalGradient(
                    listOf(
                        Color.Transparent,
                        KiaanColors.SacredGold.copy(alpha = 0.6f),
                        Color.Transparent,
                    ),
                ),
            ),
    )
}

/** Circular "badge" container for icons. */
@Composable
fun CircleBadge(
    color: Color,
    modifier: Modifier = Modifier,
    size: Dp = 28.dp,
    content: @Composable () -> Unit,
) {
    Box(
        modifier
            .size(size)
            .clip(RoundedCornerShape(50))
            .background(color.copy(alpha = 0.18f))
            .border(1.dp, color.copy(alpha = 0.55f), RoundedCornerShape(50)),
        contentAlignment = Alignment.Center,
    ) { content() }
}
