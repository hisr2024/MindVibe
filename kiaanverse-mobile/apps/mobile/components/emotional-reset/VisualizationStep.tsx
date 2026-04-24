/**
 * VisualizationStep -- Sacred guided visualization (Step 2 of Emotional Reset).
 *
 * Full-screen immersive experience with:
 *   - Animated particle field (6 lightweight particles, no shadows)
 *   - Progressive scene building with staggered text reveals
 *   - Emotion-specific color palette and imagery
 *   - Pulsing MandalaSpin backdrop with layered glow
 *   - Sacred countdown using Reanimated shared values (no JS re-renders)
 *   - Haptic pulse on scene transitions only
 *
 * Performance: Timer runs entirely on the UI thread via shared values.
 * Scene changes trigger minimal JS-thread re-renders (max 4 over 30s).
 */

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { View, StyleSheet, Dimensions, TextInput } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useDerivedValue,
  withRepeat,
  withSequence,
  withTiming,
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

/** Reduced from 12 to 6 for performance — fewer animated views + no shadows. */
const PARTICLE_COUNT = 6;

/**
 * Emotion-specific visualization themes providing color, imagery,
 * and guided text tailored to the user's selected emotion.
 */
const EMOTION_THEMES: Record<
  string,
  {
    color: string;
    glowColor: string;
    scenes: string[];
    title: string;
  }
> = {
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
    title: "The River's Wisdom",
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
      "You are not the waves — you are the ocean's depth, always at peace...",
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
// Sacred Particle -- lightweight floating light mote (no shadows)
// ---------------------------------------------------------------------------

const SacredParticle = React.memo(function SacredParticle({
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
    const delay = index * 300;

    floatY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-driftAmount, {
            duration,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(driftAmount, {
            duration,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.7, {
            duration: duration * 0.8,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.15, {
            duration: duration * 0.8,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      )
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
        },
        animatedStyle,
      ]}
    />
  );
});

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
    [emotion]
  );

  // Timer as shared value — updates on UI thread, no JS re-renders
  const timerShared = useSharedValue(VISUALIZATION_DURATION);
  const [sceneIndex, setSceneIndex] = useState(0);
  const sceneIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    mandalaScale.value = withTiming(1, {
      duration: 4000,
      easing: Easing.out(Easing.ease),
    });
  }, [glowPulse, mandalaScale]);

  const scenes = useMemo(() => {
    if (stepData?.description) {
      return [
        stepData.description,
        ...(stepData.guidance ? [stepData.guidance] : []),
      ];
    }
    return theme.scenes;
  }, [stepData, theme.scenes]);

  // Timer and scene progression — minimal JS re-renders
  useEffect(() => {
    const sceneInterval = Math.floor(VISUALIZATION_DURATION / scenes.length);
    let elapsed = 0;

    timerRef.current = setInterval(() => {
      elapsed += 1;
      const remaining = VISUALIZATION_DURATION - elapsed;

      // Update shared value on UI thread — no re-render
      timerShared.value = remaining;

      // Update progress ring
      progress.value = withTiming(elapsed / VISUALIZATION_DURATION, {
        duration: 900,
      });

      // Only trigger JS re-render when scene actually changes (max 4 times)
      const newSceneIndex = Math.min(
        Math.floor(elapsed / sceneInterval),
        scenes.length - 1
      );
      if (newSceneIndex !== sceneIndexRef.current) {
        sceneIndexRef.current = newSceneIndex;
        setSceneIndex(newSceneIndex);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onNext();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNext, scenes.length]);

  // Derive timer text from shared value — runs on UI thread
  const timerText = useDerivedValue(() => {
    const val = Math.round(timerShared.value);
    return val > 0 ? `${val}` : '';
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Reanimated text prop works at runtime but isn't typed
  const timerAnimatedProps = useAnimatedProps(
    () =>
      ({
        text: timerText.value,
      }) as any
  );

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
      Extrapolation.CLAMP
    );
    return {
      transform: [{ rotate: `${rotation}deg` }],
      opacity: interpolate(
        progress.value,
        [0, 0.05],
        [0, 1],
        Extrapolation.CLAMP
      ),
    };
  });

  const handleSkip = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  }, [onNext]);

  return (
    <View style={styles.root}>
      {/* Sacred particle field — reduced to 6 lightweight particles */}
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <SacredParticle key={i} index={i} themeColor={theme.color} />
      ))}

      {/* Pulsing glow backdrop */}
      <Animated.View
        style={[
          styles.glowBackdrop,
          {
            backgroundColor: theme.glowColor,
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
        <View style={[styles.progressDot, { backgroundColor: theme.color }]} />
      </Animated.View>

      {/* Title */}
      <Animated.View
        entering={FadeInDown.duration(800)}
        style={styles.titleContainer}
      >
        <Text variant="caption" color={colors.primary[500]} align="center">
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
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Timer + skip at bottom — timer uses animated text, no JS re-renders */}
      <Animated.View
        entering={FadeInUp.delay(600).duration(500)}
        style={[styles.bottomArea, { paddingBottom: insets.bottom + 16 }]}
      >
        <AnimatedTextInput
          editable={false}
          style={styles.timerText}
          animatedProps={timerAnimatedProps}
        />
        <GoldenButton
          title="Continue"
          onPress={handleSkip}
          variant="secondary"
          testID="visualization-next-btn"
        />
      </Animated.View>
    </View>
  );
}

/**
 * Animated TextInput used to display the countdown timer on the UI thread.
 * Using TextInput with animatedProps avoids JS-thread re-renders for text updates.
 */
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

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
  },
  bottomArea: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    zIndex: 5,
  },
  timerText: {
    fontSize: 28,
    color: colors.text.muted,
    opacity: 0.4,
    textAlign: 'center',
    padding: 0,
  },
});
