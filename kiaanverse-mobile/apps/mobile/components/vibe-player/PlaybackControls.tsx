/**
 * PlaybackControls — the five-icon transport row for the full player.
 *
 *   [ Previous ] [ Play / Pause (56 px gradient) ] [ Next ] [ Repeat ] [ Bookmark ]
 *
 * Play/Pause is the visual anchor: a 56 px circle filled with the
 * Krishna-aura LinearGradient, rendered with the pause glyph when
 * playback is live and the play glyph (nudged 1 px right to optically
 * center) when paused. Press feedback: scale 0.88 → 1.0 with
 * SACRED_SPRING, Medium haptic.
 *
 * Previous/Next are 44 px circles with a gold outline.
 *
 * Repeat cycles through three states — off / track / queue — and the
 * button tints by state. Bookmark is a toggle that persists on the
 * track via the consumer's handler.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Line, Path, Polygon, Rect } from 'react-native-svg';

/** Zustand `RepeatMode` from `@kiaanverse/store` is re-declared here to
 *  avoid a runtime import cycle and to keep this component standalone. */
export type RepeatMode = 'off' | 'one' | 'all';

const GOLD = '#D4A017';
const SACRED_WHITE = '#F5F0E8';
const KRISHNA_AURA = [
  'rgba(27,79,187,0.95)',
  'rgba(66,41,155,0.95)',
  'rgba(212,160,23,0.85)',
] as const;

const PLAY_SIZE = 56;
const SECONDARY_SIZE = 44;
const DIVINE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

export interface PlaybackControlsProps {
  /** Whether audio is actively playing (drives play/pause glyph). */
  readonly isPlaying: boolean;
  /** Current repeat mode (drives the right-side repeat icon). */
  readonly repeatMode: RepeatMode;
  /** Whether the current track is bookmarked. */
  readonly isBookmarked: boolean;
  /** Skip to previous track. */
  readonly onPrev: () => void;
  /** Toggle play / pause. */
  readonly onTogglePlay: () => void;
  /** Skip to next track. */
  readonly onNext: () => void;
  /** Cycle repeat mode (off → all → one → off). */
  readonly onCycleRepeat: () => void;
  /** Toggle the bookmark for the current track. */
  readonly onToggleBookmark: () => void;
}

function PrevIcon({ color }: { color: string }): React.JSX.Element {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Polygon points="18,5 8,12 18,19" />
      <Rect x={5} y={5} width={2} height={14} />
    </Svg>
  );
}

function NextIcon({ color }: { color: string }): React.JSX.Element {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Polygon points="6,5 16,12 6,19" />
      <Rect x={17} y={5} width={2} height={14} />
    </Svg>
  );
}

function PlayGlyph({ color }: { color: string }): React.JSX.Element {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      {/* Slight rightward nudge — play triangle always looks off-center
          otherwise because its visual centroid sits to the right of its
          bounding-box center. */}
      <Polygon points="8,5 19,12 8,19" />
    </Svg>
  );
}

function PauseGlyph({ color }: { color: string }): React.JSX.Element {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Rect x={6} y={5} width={4} height={14} rx={1} />
      <Rect x={14} y={5} width={4} height={14} rx={1} />
    </Svg>
  );
}

/** Repeat glyph — two arrows in a rounded rectangle; "1" overlay for `one`. */
function RepeatIcon({
  mode,
  color,
}: {
  mode: RepeatMode;
  color: string;
}): React.JSX.Element {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Top arrow pointing right */}
      <Path d="M4 8 h13 l-3 -3 M17 8 l0 3" />
      {/* Bottom arrow pointing left */}
      <Path d="M20 16 h-13 l3 3 M7 16 l0 -3" />
      {/* Dot in the center of the "1" variant */}
      {mode === 'one' ? (
        <Line
          x1={12}
          y1={11.5}
          x2={12}
          y2={12.5}
          stroke={color}
          strokeWidth={2.4}
        />
      ) : null}
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
      width={20}
      height={20}
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

function PlaybackControlsInner({
  isPlaying,
  repeatMode,
  isBookmarked,
  onPrev,
  onTogglePlay,
  onNext,
  onCycleRepeat,
  onToggleBookmark,
}: PlaybackControlsProps): React.JSX.Element {
  // Sacred-spring for the big play button. Uses Reanimated spring with the
  // same damping/stiffness profile the design system calls SACRED_SPRING.
  const playScale = useSharedValue(1);

  const handlePlayPressIn = useCallback(() => {
    playScale.value = withTiming(0.88, { duration: 90, easing: DIVINE_OUT });
  }, [playScale]);

  const handlePlayPressOut = useCallback(() => {
    playScale.value = withSpring(1.0, {
      damping: 12,
      stiffness: 260,
      mass: 0.7,
    });
  }, [playScale]);

  const handlePlayPress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onTogglePlay();
  }, [onTogglePlay]);

  const handleSecondaryPress = useCallback((fn: () => void) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fn();
  }, []);

  const handleRepeatPress = useCallback(() => {
    void Haptics.selectionAsync();
    onCycleRepeat();
  }, [onCycleRepeat]);

  const handleBookmarkPress = useCallback(() => {
    void Haptics.selectionAsync();
    onToggleBookmark();
  }, [onToggleBookmark]);

  const playAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playScale.value }],
  }));

  const repeatColor = repeatMode === 'off' ? 'rgba(212,160,23,0.4)' : GOLD;
  const bookmarkColor = isBookmarked ? GOLD : 'rgba(212,160,23,0.5)';

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => handleSecondaryPress(onPrev)}
        style={styles.secondary}
        accessibilityRole="button"
        accessibilityLabel="Previous track"
      >
        <PrevIcon color={GOLD} />
      </Pressable>

      <Animated.View style={playAnimatedStyle}>
        <Pressable
          onPressIn={handlePlayPressIn}
          onPressOut={handlePlayPressOut}
          onPress={handlePlayPress}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          hitSlop={6}
          style={styles.playButtonTouch}
        >
          <View style={styles.playButton}>
            <LinearGradient
              colors={KRISHNA_AURA as unknown as string[]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {isPlaying ? (
              <PauseGlyph color={SACRED_WHITE} />
            ) : (
              <PlayGlyph color={SACRED_WHITE} />
            )}
          </View>
        </Pressable>
      </Animated.View>

      <Pressable
        onPress={() => handleSecondaryPress(onNext)}
        style={styles.secondary}
        accessibilityRole="button"
        accessibilityLabel="Next track"
      >
        <NextIcon color={GOLD} />
      </Pressable>

      <Pressable
        onPress={handleRepeatPress}
        style={styles.secondary}
        accessibilityRole="button"
        accessibilityLabel={`Repeat ${repeatMode}`}
        accessibilityState={{ selected: repeatMode !== 'off' }}
      >
        <RepeatIcon mode={repeatMode} color={repeatColor} />
      </Pressable>

      <Pressable
        onPress={handleBookmarkPress}
        style={styles.secondary}
        accessibilityRole="button"
        accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        accessibilityState={{ selected: isBookmarked }}
      >
        <BookmarkIcon filled={isBookmarked} color={bookmarkColor} />
      </Pressable>
    </View>
  );
}

/** Five-icon transport row with Krishna-aura play button. */
export const PlaybackControls = React.memo(PlaybackControlsInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    gap: 10,
  },
  secondary: {
    width: SECONDARY_SIZE,
    height: SECONDARY_SIZE,
    borderRadius: SECONDARY_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.35)',
    backgroundColor: 'rgba(212,160,23,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonTouch: {
    width: PLAY_SIZE,
    height: PLAY_SIZE,
    borderRadius: PLAY_SIZE / 2,
  },
  playButton: {
    width: PLAY_SIZE,
    height: PLAY_SIZE,
    borderRadius: PLAY_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
});
