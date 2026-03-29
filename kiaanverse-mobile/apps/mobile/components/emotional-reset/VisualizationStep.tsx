/**
 * VisualizationStep -- Sacred guided visualization (Step 2 of Emotional Reset).
 *
 * Full-screen immersive experience with:
 *   - Animated particle field that responds to breathing rhythm
 *   - Progressive scene building with staggered text reveals
 *   - Emotion-specific color palette and imagery
 *   - Pulsing MandalaSpin backdrop with layered glow
 *   - Sacred countdown ring with progress arc
 *   - Haptic pulse synchronized with visual heartbeat
 *
 * NO ScrollView -- fits within one viewport. The user is guided through
 * a 30-second visualization with auto-advance.
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Text,
  GoldenButton,
  MandalaSpin,
  GlowCard,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useEmotionalResetStore } from '@kiaanverse/store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VisualizationStepProps {
  readonly stepData: {
    title?: string;
    description?: string;
    guidance?: string;
  } | null;
  readonly onNext: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const VISUALIZATION_DURATION = 30; // seconds
const ORB_SIZE = SCREEN_WIDTH * 0.55;
const MANDALA_SIZE = SCREEN_WIDTH * 0.95;

/** Number of sacred light particles floating around the visualization. */
const PARTICLE_COUNT = 12;

/**
 * Emotion-specific visualization themes providing color, imagery,
 * and guided text tailored to the user's selected emotion.
 */
const EMOTION_THEMES: Record<string, {
  color: string;
  glowColor: string;
  scenes: string[];
  title: string;
}> = {
  anger: {
    color: '#FF6B6B',
    glowColor: 'rgba(255, 107, 107, 0.15)',
    title: 'Cooling the Flame',
    scenes: [
      'Imagine a still, moonlit lake stretching to the horizon...',
      'Feel cool, silver light washing over you like gentle rain...',
      'Each breath draws the fire inward, transforming it into warm compassion...',
      'You are the lake — vast, deep, undisturbed by the wind above...',
    ],
  },
  anxiety: {
    color: '#74B9FF',
    glowColor: 'rgba(116, 185, 255, 0.15)',
    title: 'Anchoring the Mind',
    scenes: [
      'Visualize roots growing from your body deep into the earth...',
      'Feel the solid, unshakable ground beneath you holding you safe...',
      'A warm golden light rises from the earth, filling your body with stillness...',
      'You are rooted, grounded, held — nothing can shake this foundation...',
    ],
  },
  sadness: {
    color: '#A29BFE',
    glowColor: 'rgba(162, 155, 254, 0.15)',
    title: 'The Gentle Dawn',
    scenes: [
      'See a soft sunrise painting the sky in shades of rose and gold...',
      'Warm light reaches through the darkness, touching your heart gently...',
      'Each ray carries the promise that all darkness is temporary...',
      'You are the dawn itself — always returning, always renewed...',
    ],
  },
  grief: {
    color: '#DFE6E9',
    glowColor: 'rgba(223, 230, 233, 0.12)',
    title: 'Sacred Remembrance',
    scenes: [
      'Imagine a sacred garden where memories bloom as luminous flowers...',
      'Each flower holds a precious moment, glowing softly in eternal light...',
      'Love does not end — it transforms into the fragrance that fills this garden...',
      'You carry this garden within you, always. It grows with every breath...',
    ],
  },
  fear: {
    color: '#FDCB6E',
    glowColor: 'rgba(253, 203, 110, 0.15)',
    title: 'The Inner Fortress',
    scenes: [
      'Visualize a fortress of golden light surrounding you completely...',
      'Its walls are made of every moment of courage you have ever shown...',
      'Within these walls, you are sovereign — fear cannot enter uninvited...',
      'You are the warrior Arjuna, and the divine stands beside you always...',
    ],
  },
  confusion: {
    color: '#00CEC9',
    glowColor: 'rgba(0, 206, 201, 0.15)',
    title: 'Parting the Mist',
    scenes: [
      'See a dense, swirling mist before you, like thoughts without direction...',
      'A single flame appears in your heart — steady, unwavering, eternal...',
      'With each breath, the flame grows, burning away the fog of uncertainty...',
      'Clarity emerges like a mountain peak above the clouds — always there, now revealed...',
    ],
  },
  loneliness: {
    color: '#E17055',
    glowColor: 'rgba(225, 112, 85, 0.15)',
    title: 'The Web of Connection',
    scenes: [
      'Imagine luminous threads extending from your heart in every direction...',
      'Each thread connects you to every being who has ever loved you...',
      'Feel the warmth flowing through these connections — you were never alone...',
      'You are a sacred node in the infinite web of consciousness itself...',
    ],
  },
  shame: {
    color: '#FD79A8',
    glowColor: 'rgba(253, 121, 168, 0.12)',
    title: 'The Cleansing Rain',
    scenes: [
      'Imagine standing beneath a waterfall of warm, golden light...',
      'Each drop dissolves a layer of self-judgment, revealing the pure Self beneath...',
      'You are not your mistakes — you are the awareness witnessing them...',
      'Stand clean, radiant, and whole — as you were always meant to be...',
    ],
  },
  frustration: {
    color: '#E17055',
    glowColor: 'rgba(225, 112, 85, 0.12)',
    title: 'The River\'s Wisdom',
    scenes: [
      'See a powerful river meeting a great boulder in its path...',
      'The river does not fight — it flows around, finding new channels...',
      'Every obstacle becomes a source of new direction and hidden strength...',
      'You are the river — patient, persistent, always finding the way...',
    ],
  },
  jealousy: {
    color: '#55EFC4',
    glowColor: 'rgba(85, 239, 196, 0.15)',
    title: 'The Overflowing Cup',
    scenes: [
      'Imagine a golden cup in your hands, filling with light from above...',
      'The light represents your unique gifts — irreplaceable, infinite...',
      'As the cup overflows, it nourishes everything around you without diminishing...',
      'Abundance is your nature — there is no scarcity in the realm of the Self...',
    ],
  },
  overwhelm: {
    color: '#81ECEC',
    glowColor: 'rgba(129, 236, 236, 0.12)',
    title: 'The Sacred Pause',
    scenes: [
      'Imagine time itself slowing to a gentle stop around you...',
      'Everything else drifts into the distance — only this moment remains...',
      'In this stillness, you are the eye of the storm — calm, centered, infinite...',
      'One breath. One moment. One step. That is all that is ever needed...',
    ],
  },
  restlessness: {
    color: '#6C5CE7',
    glowColor: 'rgba(108, 92, 231, 0.15)',
    title: 'The Still Point',
    scenes: [
      'Visualize a vast ocean with waves rising and falling endlessly...',
      'Dive beneath the surface — deeper, deeper — to the silent floor below...',
      'Here, no current moves. No wave reaches. Only infinite stillness...',
      'You are not the waves — you are the ocean\'s depth, always at peace...',
    ],
  },
};

const DEFAULT_THEME = {
  color: '#D4A017',
  glowColor: 'rgba(212, 160, 23, 0.15)',
  title: 'Sacred Visualization',
  scenes: [
    'Close your eyes and see a golden light descending from above...',
    'It surrounds you completely, warm and protective like the divine embrace...',
    'Feel every cell in your body resonating with this radiant energy...',
    'You are light. You are peace. You are the eternal Self...',
  ],
};

// ---------------------------------------------------------------------------
// Sacred Particle -- floating light mote
// ---------------------------------------------------------------------------

function SacredParticle({
  index,
  themeColor,
}: {
  index: number;
  themeColor: string;
}): React.JSX.Element {
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
  const radius = ORB_SIZE * 0.55 + Math.random() * 40;
  const baseX = Math.cos(angle) * radius;
  const baseY = Math.sin(angle) * radius;
  const size = 3 + Math.random() * 5;

  const floatY = useSharedValue(0);
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    const driftAmount = 15 + Math.random() * 20;
    const duration = 2500 + Math.random() * 2000;
    const delay = index * 200;

    floatY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-driftAmount, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(driftAmount, { duration, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.15, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, [floatY, opacity, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: SCREEN_WIDTH / 2 + baseX - size / 2,
          top: SCREEN_HEIGHT * 0.38 + baseY - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: themeColor,
          shadowColor: themeColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: size * 2,
        },
        animatedStyle,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VisualizationStep({
  stepData,
  onNext,
}: VisualizationStepProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const emotion = useEmotionalResetStore((s) => s.session?.emotion);

  const theme = useMemo(
    () => EMOTION_THEMES[emotion ?? ''] ?? DEFAULT_THEME,
    [emotion],
  );

  const [timer, setTimer] = useState(VISUALIZATION_DURATION);
  const [sceneIndex, setSceneIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hapticRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulsing glow behind mandala
  const glowPulse = useSharedValue(0.4);
  // Progress ring value (0-1)
  const progress = useSharedValue(0);
  // Mandala rotation speed ramp
  const mandalaScale = useSharedValue(0.85);

  // Start animations on mount
  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    mandalaScale.value = withTiming(1, { duration: 4000, easing: Easing.out(Easing.ease) });
  }, [glowPulse, mandalaScale]);

  // Timer and scene progression
  useEffect(() => {
    const scenes = stepData?.description
      ? [stepData.description, ...(stepData.guidance ? [stepData.guidance] : [])]
      : theme.scenes;
    const sceneInterval = Math.floor(VISUALIZATION_DURATION / scenes.length);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onNext();
          return 0;
        }

        // Advance scene at intervals
        const elapsed = VISUALIZATION_DURATION - (prev - 1);
        const newSceneIndex = Math.min(
          Math.floor(elapsed / sceneInterval),
          scenes.length - 1,
        );
        if (newSceneIndex !== sceneIndex) {
          setSceneIndex(newSceneIndex);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        // Update progress
        progress.value = withTiming(elapsed / VISUALIZATION_DURATION, { duration: 900 });

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNext]);

  // Gentle haptic heartbeat every 4 seconds for somatic grounding
  useEffect(() => {
    hapticRef.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 4000);

    return () => {
      if (hapticRef.current) clearInterval(hapticRef.current);
    };
  }, []);

  const scenes = useMemo(() => {
    if (stepData?.description) {
      return [stepData.description, ...(stepData.guidance ? [stepData.guidance] : [])];
    }
    return theme.scenes;
  }, [stepData, theme.scenes]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const mandalaAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mandalaScale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      progress.value,
      [0, 1],
      [0, 360],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ rotate: `${rotation}deg` }],
      opacity: interpolate(progress.value, [0, 0.05], [0, 1], Extrapolation.CLAMP),
    };
  });

  const handleSkip = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (hapticRef.current) clearInterval(hapticRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  }, [onNext]);

  return (
    <View style={styles.root}>
      {/* Sacred particle field */}
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <SacredParticle key={i} index={i} themeColor={theme.color} />
      ))}

      {/* Pulsing glow backdrop */}
      <Animated.View
        style={[
          styles.glowBackdrop,
          {
            backgroundColor: theme.glowColor,
            shadowColor: theme.color,
          },
          glowStyle,
        ]}
      />

      {/* Mandala background with scale-in */}
      <Animated.View style={[styles.mandalaContainer, mandalaAnimatedStyle]}>
        <MandalaSpin
          size={MANDALA_SIZE}
          speed="slow"
          color={theme.color}
          opacity={0.08}
        />
      </Animated.View>

      {/* Progress ring indicator */}
      <Animated.View style={[styles.progressRing, progressStyle]}>
        <View
          style={[
            styles.progressDot,
            { backgroundColor: theme.color, shadowColor: theme.color },
          ]}
        />
      </Animated.View>

      {/* Title */}
      <Animated.View entering={FadeInDown.duration(800)} style={styles.titleContainer}>
        <Text variant="caption" color={colors.primary[400]} align="center">
          Sacred Visualization
        </Text>
        <Text variant="h2" color={colors.divine.aura} align="center">
          {stepData?.title ?? theme.title}
        </Text>
      </Animated.View>

      {/* Scene text -- cross-fades between scenes */}
      <View style={styles.sceneContainer}>
        <Animated.View
          entering={FadeIn.duration(1200)}
          exiting={FadeOut.duration(400)}
          key={`scene-${sceneIndex}`}
          style={styles.sceneTextWrap}
        >
          <GlowCard variant="sacred" style={styles.sceneCard}>
            <Text
              variant="body"
              color={colors.text.secondary}
              align="center"
              style={styles.sceneText}
            >
              {scenes[sceneIndex]}
            </Text>
          </GlowCard>
        </Animated.View>

        {/* Scene progress dots */}
        <View style={styles.sceneDots}>
          {scenes.map((_, i) => (
            <View
              key={i}
              style={[
                styles.sceneDot,
                {
                  backgroundColor:
                    i <= sceneIndex ? theme.color : colors.alpha.whiteLight,
                  shadowColor: i <= sceneIndex ? theme.color : 'transparent',
                  shadowOpacity: i <= sceneIndex ? 0.6 : 0,
                  shadowRadius: 4,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Timer + skip at bottom */}
      <Animated.View
        entering={FadeInUp.delay(600).duration(500)}
        style={[styles.bottomArea, { paddingBottom: insets.bottom + 16 }]}
      >
        <Text variant="h1" color={colors.text.muted} align="center" style={styles.timerText}>
          {timer > 0 ? `${timer}` : ''}
        </Text>
        <GoldenButton
          title="Continue"
          onPress={handleSkip}
          variant="outline"
          testID="visualization-next-btn"
        />
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  particle: {
    position: 'absolute',
    zIndex: 2,
  },
  glowBackdrop: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.2,
    left: SCREEN_WIDTH * 0.1,
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 80,
    elevation: 0,
  },
  mandalaContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  progressRing: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.38 - ORB_SIZE * 0.55,
    left: SCREEN_WIDTH / 2 - 4,
    width: 8,
    height: 8,
    zIndex: 3,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  titleContainer: {
    marginTop: spacing.lg,
    gap: spacing.xxs,
    zIndex: 5,
  },
  sceneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 5,
  },
  sceneTextWrap: {
    width: '100%',
  },
  sceneCard: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sceneText: {
    lineHeight: 28,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  sceneDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.lg,
  },
  sceneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  bottomArea: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    zIndex: 5,
  },
  timerText: {
    fontSize: 28,
    opacity: 0.4,
  },
});
