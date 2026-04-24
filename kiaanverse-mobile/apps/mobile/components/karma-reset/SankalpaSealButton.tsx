/**
 * SankalpaSealButton — The ceremonial intention-sealing button.
 *
 * Sequence on tap:
 *   1. Heavy haptic burst.
 *   2. Three expanding golden ripple rings (stagger 150ms).
 *   3. Button background transitions from indigo-to-void to white-to-indigo.
 *   4. A golden sweep overlay travels the full screen.
 *   5. After 1800ms, `तत् त्वम् असि` reveals with a spring, followed by
 *      "This intention has been witnessed."
 *   6. The parent's `onSeal` fires 1200ms after the reveal so the
 *      transition into the Seal phase feels earned.
 *
 * Mirrors `app/(mobile)/m/karma-reset/components/SankalpaSealButton.tsx`.
 */

import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface SankalpaSealButtonProps {
  onSeal: () => void;
  disabled?: boolean;
}

function RippleRing({
  delay,
  active,
}: {
  delay: number;
  active: boolean;
}): React.JSX.Element {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (active) {
      scale.value = 0.5;
      opacity.value = 0.8;
      scale.value = withDelay(
        delay,
        withTiming(2.5, { duration: 700, easing: Easing.out(Easing.ease) })
      );
      opacity.value = withDelay(
        delay,
        withTiming(0, { duration: 700, easing: Easing.out(Easing.ease) })
      );
    }
  }, [active, delay, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.ripple, style]} />;
}

export function SankalpaSealButton({
  onSeal,
  disabled,
}: SankalpaSealButtonProps): React.JSX.Element {
  const [sealing, setSealing] = useState(false);
  const [sealed, setSealed] = useState(false);

  // Continuous "divine breath" glow on the resting button
  const glow = useSharedValue(0);

  React.useEffect(() => {
    if (!sealing && !sealed) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      glow.value = withTiming(0, { duration: 300 });
    }
  }, [sealing, sealed, glow]);

  const breathStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.25 + 0.15 * glow.value,
    shadowRadius: 28 + 8 * glow.value,
  }));

  // Tat tvam asi reveal scale/opacity
  const revealScale = useSharedValue(0.9);
  const revealOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (sealed) {
      revealOpacity.value = withDelay(
        200,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
      );
      revealScale.value = withDelay(
        400,
        withSpring(1, { damping: 18, stiffness: 200 })
      );
    }
  }, [sealed, revealScale, revealOpacity]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: revealOpacity.value,
    transform: [{ scale: revealScale.value }],
  }));

  // Fullscreen golden sweep overlay
  const sweep = useSharedValue(0);
  React.useEffect(() => {
    if (sealing) {
      sweep.value = withTiming(1, {
        duration: 600,
        easing: Easing.bezier(0, 0.8, 0.2, 1),
      });
    } else {
      sweep.value = 0;
    }
  }, [sealing, sweep]);

  const sweepStyle = useAnimatedStyle(() => ({
    opacity: sweep.value,
  }));

  const handleSeal = useCallback(() => {
    if (disabled || sealing || sealed) return;
    setSealing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setTimeout(() => {
      setSealed(true);
      setTimeout(() => onSeal(), 1200);
    }, 600);
  }, [disabled, sealing, sealed, onSeal]);

  return (
    <View style={styles.container}>
      <Animated.Text style={styles.prompt}>
        Seal this Sankalpa before the Paramatma
      </Animated.Text>

      {/* Button with ripples */}
      <View style={styles.buttonFrame}>
        {sealing ? (
          <>
            <RippleRing delay={0} active={sealing} />
            <RippleRing delay={150} active={sealing} />
            <RippleRing delay={300} active={sealing} />
          </>
        ) : null}

        <Pressable
          onPress={handleSeal}
          disabled={disabled || sealed}
          accessibilityRole="button"
          accessibilityLabel="Seal your sankalpa"
        >
          <Animated.View
            style={[
              styles.button,
              {
                backgroundColor: sealing ? '#FFFFFF' : '#1B4FBB',
              },
              breathStyle,
            ]}
          >
            <Animated.Text style={styles.anjali}>🙏</Animated.Text>
          </Animated.View>
        </Pressable>
      </View>

      {/* Fullscreen golden sweep */}
      <Animated.View pointerEvents="none" style={[styles.sweep, sweepStyle]} />

      {/* Tat tvam asi reveal */}
      {sealed ? (
        <Animated.View style={[styles.reveal, revealStyle]}>
          <Animated.Text style={styles.tatTvamAsi}>तत् त्वम् असि</Animated.Text>
          <Animated.Text style={styles.witness}>
            This intention has been witnessed.
          </Animated.Text>
        </Animated.View>
      ) : null}

      {!sealed ? (
        <Animated.Text style={styles.commit}>
          I commit to walk in dharma today
        </Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  prompt: {
    fontSize: 11,
    color: '#6B6355',
    textAlign: 'center',
  },
  buttonFrame: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(212,160,23,0.6)',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(212,160,23,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    // shadowOpacity + shadowRadius animated in breathStyle
    elevation: 10,
  },
  anjali: {
    fontSize: 32,
  },
  sweep: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'rgba(212,160,23,0.12)',
    pointerEvents: 'none',
  },
  reveal: {
    alignItems: 'center',
    marginTop: 12,
  },
  tatTvamAsi: {
    fontSize: 36,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#F0C040',
    textShadowColor: 'rgba(212,160,23,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  witness: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#B8AE98',
    marginTop: 8,
  },
  commit: {
    fontSize: 10,
    color: '#6B6355',
    textAlign: 'center',
  },
});
