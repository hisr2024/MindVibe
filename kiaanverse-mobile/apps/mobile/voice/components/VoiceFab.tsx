/**
 * VoiceFab — bottom-right floating action button that summons Sakha.
 *
 * Behaviour:
 *   • Single tap   → onPress (caller routes to /voice-companion).
 *   • Long-press   → onLongPress (caller opens the wake-word
 *                    settings sheet so the user can toggle "Hey
 *                    Sakha" without leaving their current screen).
 *   • Listening    → renders a soft golden pulse (Reanimated) when
 *                    `listening` is true, so the user has a passive
 *                    indicator that the wake-word is actually armed.
 *
 * Position: anchored to the bottom-right safe area, lifted above the
 * tab bar by `tabBarLift`. Caller passes the actual lift because the
 * tab-bar height differs per layout (e.g. tabs route vs. modal
 * presentation).
 *
 * Accessibility:
 *   • role="button"
 *   • accessibilityLabel describes both the action and the listening
 *     state (so VoiceOver / TalkBack distinguish the two).
 *   • 56dp diameter — meets the Material 3 FAB minimum touch target.
 *
 * Visual: golden gradient ring with a stylized conch glyph. Pulse is
 * a separate ring layer so we can drop it without re-rendering the
 * gradient (cheaper on every frame).
 */

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const FAB_SIZE = 56;
const PULSE_DIAMETER = 84;
const PULSE_DURATION_MS = 1800;

export interface VoiceFabProps {
  onPress: () => void;
  onLongPress?: () => void;
  /** When true, animates a soft pulse ring to signal the wake-word
   *  recognizer is armed. False = static FAB. */
  listening?: boolean;
  /** Distance to lift above the safe-area bottom (e.g. tab bar
   *  height). Default 24. */
  tabBarLift?: number;
  /** Extra horizontal inset (e.g. when a snackbar uses the right
   *  edge). Default 16. */
  rightInset?: number;
}

export function VoiceFab({
  onPress,
  onLongPress,
  listening = false,
  tabBarLift = 24,
  rightInset = 16,
}: VoiceFabProps): React.JSX.Element {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (listening) {
      pulse.value = withRepeat(
        withTiming(1, {
          duration: PULSE_DURATION_MS,
          easing: Easing.out(Easing.ease),
        }),
        -1,
        false,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
    return () => {
      cancelAnimation(pulse);
    };
  }, [listening, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - pulse.value),
    transform: [{ scale: 0.7 + 0.6 * pulse.value }],
  }));

  const handlePress = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPress();
  };

  const handleLongPress = (): void => {
    if (!onLongPress) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    onLongPress();
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        { bottom: tabBarLift, right: rightInset },
      ]}
    >
      {/* Pulse ring (only when listening). pointerEvents=none so it
          never intercepts taps on the FAB itself. */}
      {listening && (
        <Animated.View
          pointerEvents="none"
          style={[styles.pulseRing, pulseStyle]}
        />
      )}

      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={450}
        accessibilityRole="button"
        accessibilityLabel={
          listening
            ? 'Sakha is listening. Tap to open the voice companion. Long-press for voice settings.'
            : 'Open Sakha voice companion. Long-press for voice settings.'
        }
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
        ]}
        hitSlop={6}
      >
        <LinearGradient
          colors={['#fbbf24', '#d4a017', '#a16207']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.glyphWrap}>
            {/* Stylized shankha (ॐ) glyph — kept as text so we
                inherit the font scaling without a SVG asset. */}
            <Animated.Text style={styles.glyph} accessibilityElementsHidden>
              ॐ
            </Animated.Text>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: PULSE_DIAMETER,
    height: PULSE_DIAMETER,
    borderRadius: PULSE_DIAMETER / 2,
    backgroundColor: '#fbbf24',
  },
  pressable: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    overflow: 'hidden',
    shadowColor: '#a16207',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  glyph: {
    color: '#1a0a04',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
});
