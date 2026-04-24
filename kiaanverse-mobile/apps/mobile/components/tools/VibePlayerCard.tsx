/**
 * VibePlayerCard — the full-width, extra-elevated Sacred Sound card.
 *
 * This is the sole member of the Tools Dashboard's "Sacred Sound" section
 * and therefore carries its own visual weight — 120 px tall (vs. 96 px
 * for ordinary tools) with a Krishna → peacock gradient body and an
 * animated waveform visualization across the middle.
 *
 * Left:   🎵 icon bubble + "KIAAN Vibe Player" / कियान वाइब + current
 *         track name (or "Press play to begin" when idle).
 * Middle: WaveformVisualizer (Skia-backed, bounces only while `isPlaying`).
 * Right:  Mini play/pause button (44 px circle) — toggles the store and
 *         fires a Light haptic. Tapping the card itself routes to the
 *         full Vibe Player screen.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Polygon } from 'react-native-svg';
import { WaveformVisualizer } from '@kiaanverse/ui';

import { KRISHNA_BLUE, PEACOCK_TEAL } from './toolColors';

const DIVINE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.7)';
const DIVINE_GOLD = '#D4A017';
const CARD_HEIGHT = 120;
const LEFT_STRIPE_WIDTH = 3;
const ICON_CIRCLE = 44;
const PLAY_CIRCLE = 44;

/** Krishna → peacock gradient defined exactly per the prompt. */
const GRADIENT_COLORS = [
  'rgba(27,79,187,0.15)',
  'rgba(14,116,144,0.1)',
] as const;

export interface VibePlayerCardProps {
  /** Current track title — falls back to a gentle idle prompt when null. */
  readonly trackName: string | null;
  /** Whether audio is playing (drives waveform + play/pause glyph). */
  readonly isPlaying: boolean;
  /** Tap anywhere on the card (except the play button) — opens full player. */
  readonly onOpenPlayer: () => void;
  /** Tap on the play button — toggles playback in the store. */
  readonly onTogglePlay: () => void;
  /** Optional style override for the outer wrapper. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

function PlayIcon({ color }: { color: string }): React.JSX.Element {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Polygon points="7,5 19,12 7,19" fill={color} />
    </Svg>
  );
}

function PauseIcon({ color }: { color: string }): React.JSX.Element {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill={color}>
      <Path d="M6 5 h4 v14 h-4 z" />
      <Path d="M14 5 h4 v14 h-4 z" />
    </Svg>
  );
}

function VibePlayerCardInner({
  trackName,
  isPlaying,
  onOpenPlayer,
  onTogglePlay,
  style,
  testID,
}: VibePlayerCardProps): React.JSX.Element {
  const scale = useSharedValue(1);
  const playScale = useSharedValue(1);

  const handleCardPressIn = useCallback(() => {
    scale.value = withTiming(0.985, { duration: 150, easing: DIVINE_OUT });
  }, [scale]);

  const handleCardPressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 150, easing: DIVINE_OUT });
  }, [scale]);

  const handleCardPress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpenPlayer();
  }, [onOpenPlayer]);

  const handlePlayPressIn = useCallback(() => {
    playScale.value = withTiming(0.88, { duration: 120, easing: DIVINE_OUT });
  }, [playScale]);

  const handlePlayPressOut = useCallback(() => {
    playScale.value = withTiming(1, { duration: 160, easing: DIVINE_OUT });
  }, [playScale]);

  const handlePlayPress = useCallback(
    (e: GestureResponderEvent) => {
      // Swallow the event so the card-level onPress doesn't also fire
      // (RN bubbles presses up the Pressable tree on Android).
      e.stopPropagation();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onTogglePlay();
    },
    [onTogglePlay]
  );

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const playAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playScale.value }],
  }));

  const displayTrackName = trackName ?? 'Press play to begin';
  const a11yLabel = trackName
    ? `KIAAN Vibe Player. Now playing ${trackName}.`
    : 'KIAAN Vibe Player. Nothing playing.';

  return (
    <Animated.View
      style={[styles.outer, cardAnimatedStyle, style]}
      testID={testID}
    >
      <Pressable
        onPressIn={handleCardPressIn}
        onPressOut={handleCardPressOut}
        onPress={handleCardPress}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint="Opens the full Vibe Player"
        style={styles.press}
      >
        <View style={styles.surface}>
          {/* Base Krishna→peacock gradient body. */}
          <LinearGradient
            colors={GRADIENT_COLORS as unknown as string[]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Left semantic-color stripe. */}
          <View
            style={[styles.stripe, { backgroundColor: KRISHNA_BLUE }]}
            pointerEvents="none"
          />

          {/* Row content */}
          <View style={styles.row}>
            {/* Icon */}
            <View style={styles.iconCircle} pointerEvents="none">
              <Text style={styles.iconGlyph} allowFontScaling={false}>
                🎵
              </Text>
            </View>

            {/* Title + track + waveform column */}
            <View style={styles.centerCol} pointerEvents="none">
              <Text style={styles.title} numberOfLines={1}>
                KIAAN Vibe Player
              </Text>
              <Text style={styles.sanskrit} numberOfLines={1}>
                कियान वाइब
              </Text>
              <View style={styles.trackRow}>
                <Text style={styles.trackName} numberOfLines={1}>
                  {displayTrackName}
                </Text>
              </View>
              <View style={styles.waveformWrap}>
                <WaveformVisualizer
                  isPlaying={isPlaying}
                  barCount={24}
                  height={18}
                  color={DIVINE_GOLD}
                />
              </View>
            </View>

            {/* Mini play/pause button */}
            <Animated.View style={playAnimatedStyle}>
              <Pressable
                onPressIn={handlePlayPressIn}
                onPressOut={handlePlayPressOut}
                onPress={handlePlayPress}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                hitSlop={8}
                style={styles.playButton}
              >
                {isPlaying ? (
                  <PauseIcon color={SACRED_WHITE} />
                ) : (
                  <PlayIcon color={SACRED_WHITE} />
                )}
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** Full-width 120 px Krishna-blue sacred-sound card. */
export const VibePlayerCard = React.memo(VibePlayerCardInner);

const styles = StyleSheet.create({
  outer: {
    width: '100%',
  },
  press: {
    width: '100%',
  },
  surface: {
    width: '100%',
    minHeight: CARD_HEIGHT,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
    backgroundColor: 'rgba(17,20,53,0.9)',
    overflow: 'hidden',
    // Extra elevation vs. ordinary tool cards.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 14,
  },
  stripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: LEFT_STRIPE_WIDTH,
    zIndex: 3,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 14 + LEFT_STRIPE_WIDTH,
    paddingRight: 14,
    gap: 14,
    minHeight: CARD_HEIGHT,
  },
  iconCircle: {
    width: ICON_CIRCLE,
    height: ICON_CIRCLE,
    borderRadius: ICON_CIRCLE / 2,
    backgroundColor: 'rgba(27,79,187,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(27,79,187,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 26,
  },
  centerCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    color: SACRED_WHITE,
    letterSpacing: 0.2,
  },
  sanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 11,
    lineHeight: 20,
    color: PEACOCK_TEAL,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  trackName: {
    flex: 1,
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
  },
  waveformWrap: {
    marginTop: 4,
    alignSelf: 'stretch',
  },
  playButton: {
    width: PLAY_CIRCLE,
    height: PLAY_CIRCLE,
    borderRadius: PLAY_CIRCLE / 2,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.5)',
    backgroundColor: 'rgba(27,79,187,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
