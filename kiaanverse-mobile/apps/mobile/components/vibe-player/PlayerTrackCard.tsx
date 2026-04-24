/**
 * PlayerTrackCard — 72 px SacredCard row used in the Vibe Player library.
 *
 * Anatomy:
 *   [ 40 px play circle | title column | duration + bookmark ]
 *
 * The play circle renders one of three states:
 *   - playing (this track is current AND audio is playing):
 *       animated 3-bar equalizer in DIVINE_GOLD
 *   - paused (this track is current but audio is paused):
 *       static ▶ glyph in DIVINE_GOLD
 *   - idle (not the current track):
 *       static ▶ glyph in rgba(240,235,225,0.4)
 *
 * The currently-playing track also gets a gold accent bar on the left
 * and a subtle background shimmer — lightweight visual reinforcement
 * of the now-playing state.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Polygon } from 'react-native-svg';
import { SacredCard } from '@kiaanverse/ui';

import { EqualizerBars } from './EqualizerBars';

const GOLD = '#D4A017';
const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.65)';
const PLAY_IDLE = 'rgba(240,235,225,0.4)';
const CARD_HEIGHT = 72;
const PLAY_CIRCLE = 40;
const LEFT_STRIPE_WIDTH = 3;
const DIVINE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

/** Minimal track shape — accepts whatever the library query returns. */
export interface PlayerTrack {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly duration: number;
  readonly category?: string;
  /** Sanskrit name for the track, if available. */
  readonly sanskrit?: string;
}

export interface PlayerTrackCardProps {
  readonly track: PlayerTrack;
  /** True when this row represents the currently-loaded track. */
  readonly isCurrent: boolean;
  /** True when audio is playing (only meaningful if `isCurrent`). */
  readonly isPlaying: boolean;
  /** True when the user has bookmarked this track. */
  readonly isBookmarked: boolean;
  /** Tap on the card body — "select this track". */
  readonly onPress: () => void;
  /** Tap on the bookmark icon (doesn't trigger the card press). */
  readonly onToggleBookmark: () => void;
  /** Optional style override. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

/** Format seconds to `M:SS`. */
function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function PlayGlyph({ color }: { color: string }): React.JSX.Element {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill={color}>
      <Polygon points="8,5 19,12 8,19" />
    </Svg>
  );
}

function BookmarkIcon({
  filled,
  color,
}: {
  filled: boolean;
  color: string;
}): React.JSX.Element {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      stroke={color}
      strokeWidth={1.6}
      fill={filled ? color : 'none'}
      strokeLinejoin="round"
    >
      <Path d="M6 4 h12 v17 l-6 -4 l-6 4 z" />
    </Svg>
  );
}

function PlayerTrackCardInner({
  track,
  isCurrent,
  isPlaying,
  isBookmarked,
  onPress,
  onToggleBookmark,
  style,
  testID,
}: PlayerTrackCardProps): React.JSX.Element {
  // Press scale animation for the card.
  const scale = useSharedValue(1);
  // Subtle now-playing background shimmer — only animates when `isPlaying`.
  const shimmer = useSharedValue(0);

  React.useEffect(() => {
    if (isCurrent && isPlaying) {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      shimmer.value = withTiming(0, { duration: 400 });
    }
  }, [isCurrent, isPlaying, shimmer]);

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.98, { duration: 150, easing: DIVINE_OUT });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 150, easing: DIVINE_OUT });
  }, [scale]);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const handleBookmark = useCallback(() => {
    void Haptics.selectionAsync();
    onToggleBookmark();
  }, [onToggleBookmark]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value * 0.22,
  }));

  const showEqualizer = isCurrent && isPlaying;
  const playGlyphColor = isCurrent ? GOLD : PLAY_IDLE;
  const titleColor = isCurrent ? GOLD : SACRED_WHITE;

  const categoryLabel = track.category
    ? `${capitalise(track.category)} · ${formatDuration(track.duration)}`
    : formatDuration(track.duration);

  return (
    <Animated.View
      style={[styles.outer, cardAnimatedStyle, style]}
      testID={testID}
    >
      <SacredCard
        onPress={undefined}
        style={styles.card}
        contentStyle={styles.cardContent}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={`${track.title} by ${track.artist}, ${formatDuration(
            track.duration
          )}`}
          accessibilityState={{ selected: isCurrent }}
          style={styles.pressArea}
        >
          {/* Now-playing subtle background shimmer. */}
          {isCurrent ? (
            <Animated.View
              style={[styles.shimmer, shimmerStyle]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={[
                  'rgba(212,160,23,0.0)',
                  'rgba(212,160,23,0.4)',
                  'rgba(212,160,23,0.0)',
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          ) : null}

          {/* 40 px play circle. */}
          <View
            style={[styles.playCircle, isCurrent && styles.playCircleCurrent]}
            pointerEvents="none"
          >
            {showEqualizer ? (
              <EqualizerBars isPlaying height={18} />
            ) : (
              <View style={styles.playGlyphNudge}>
                <PlayGlyph color={playGlyphColor} />
              </View>
            )}
          </View>

          {/* Title column */}
          <View style={styles.textCol} pointerEvents="none">
            <Text
              style={[styles.title, { color: titleColor }]}
              numberOfLines={1}
            >
              {track.title}
            </Text>
            {track.sanskrit ? (
              <Text style={styles.sanskrit} numberOfLines={1}>
                {track.sanskrit}
              </Text>
            ) : null}
            <Text style={styles.meta} numberOfLines={1}>
              {categoryLabel}
            </Text>
          </View>

          {/* Right: duration + bookmark button. */}
          <View style={styles.rightCol}>
            <Text style={styles.duration}>
              {formatDuration(track.duration)}
            </Text>
            <Pressable
              onPress={handleBookmark}
              accessibilityRole="button"
              accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              accessibilityState={{ selected: isBookmarked }}
              hitSlop={8}
              style={styles.bookmarkBtn}
            >
              <BookmarkIcon filled={isBookmarked} color={GOLD} />
            </Pressable>
          </View>
        </Pressable>

        {/* Left gold accent — ONLY for the current track. Rendered last so
            it paints above the pressable's ripple area. */}
        {isCurrent ? (
          <View style={styles.currentStripe} pointerEvents="none" />
        ) : null}
      </SacredCard>
    </Animated.View>
  );
}

/** 72 px SacredCard track row with equalizer / bookmark. */
export const PlayerTrackCard = React.memo(PlayerTrackCardInner);

function capitalise(s: string): string {
  if (s.length === 0) return s;
  return s[0]!.toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
  },
  card: {
    width: '100%',
    minHeight: CARD_HEIGHT,
  },
  cardContent: {
    padding: 0,
    overflow: 'hidden',
  },
  pressArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: CARD_HEIGHT,
    paddingVertical: 10,
    paddingLeft: 12 + LEFT_STRIPE_WIDTH,
    paddingRight: 14,
    gap: 12,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  playCircle: {
    width: PLAY_CIRCLE,
    height: PLAY_CIRCLE,
    borderRadius: PLAY_CIRCLE / 2,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.25)',
    backgroundColor: 'rgba(212,160,23,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircleCurrent: {
    borderColor: 'rgba(212,160,23,0.6)',
    backgroundColor: 'rgba(212,160,23,0.14)',
  },
  playGlyphNudge: {
    // Optical centering — triangle glyphs read right-heavy, so nudge 1 px.
    paddingLeft: 1,
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 1,
  },
  title: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: SACRED_WHITE,
    letterSpacing: 0.2,
  },
  sanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 11,
    lineHeight: 18,
    color: GOLD,
  },
  meta: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: TEXT_MUTED,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },
  duration: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: TEXT_MUTED,
  },
  bookmarkBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: LEFT_STRIPE_WIDTH,
    backgroundColor: GOLD,
    zIndex: 3,
  },
});
