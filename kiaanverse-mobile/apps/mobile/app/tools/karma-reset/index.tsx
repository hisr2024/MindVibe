/**
 * Karma Reset — Entry Screen (Immersive Native Mobile UX)
 *
 * Full-screen immersive layout with sacred cosmic dark theme:
 *   - DivineBackground (cosmic variant) as base layer
 *   - MandalaSpin rotating backdrop for atmospheric depth
 *   - Hero LotusProgress (140px) with sacred glow
 *   - SacredStepIndicator showing 0/4 phases
 *   - Horizontal FlatList carousel with snap-to-card phase previews
 *   - Animated PhaseCard components with spring scale and golden glow
 *   - Staggered reveal animations
 *   - Bottom-anchored CTA with safe-area awareness
 *   - Haptic feedback on card selection and navigation
 *
 * NO ScrollView — everything fits on a single viewport.
 * Uses established sacred cosmic dark theme tokens exclusively.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  ViewToken,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Text,
  GoldenButton,
  DivineBackground,
  GlowCard,
  LotusProgress,
  SacredStepIndicator,
  MandalaSpin,
  SacredDivider,
  colors,
  spacing,
} from '@kiaanverse/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;
const CARD_GAP = spacing.md;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

const PHASES = [
  {
    number: 1,
    title: 'Acknowledgment',
    icon: '\u{1FAB7}',
    sanskrit: 'प्रतिज्ञा',
    description: 'Recognize the karmic pattern you wish to release from your life',
  },
  {
    number: 2,
    title: 'Understanding',
    icon: '\u{1F4D6}',
    sanskrit: 'ज्ञान',
    description: 'Receive wisdom from the Bhagavad Gita to illuminate your path',
  },
  {
    number: 3,
    title: 'Release',
    icon: '\u{1F525}',
    sanskrit: 'मोक्ष',
    description: 'A guided breathing ritual to dissolve the pattern and let go',
  },
  {
    number: 4,
    title: 'Renewal',
    icon: '\u2728',
    sanskrit: 'नवीकरण',
    description: 'Set a sacred intention and receive a divine blessing',
  },
] as const;

/**
 * Animated phase card with scale feedback, golden glow on selection,
 * and sacred bounce animation.
 */
function PhaseCard({
  phase,
  isSelected,
  onSelect,
}: {
  phase: (typeof PHASES)[number];
  isSelected: boolean;
  onSelect: () => void;
}): React.JSX.Element {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.94, { damping: 15, stiffness: 350 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  }, [scale]);

  const handlePress = useCallback(() => {
    // Sacred bounce animation on select
    scale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1.03, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 14, stiffness: 300 }),
    );
    onSelect();
  }, [scale, onSelect]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`Phase ${phase.number}: ${phase.title}`}
    >
      <Animated.View style={animatedStyle}>
        <GlowCard
          variant={isSelected ? 'sacred' : 'golden'}
          style={[styles.phaseCard, isSelected && styles.phaseCardSelected]}
        >
          {/* Phase icon with sacred circle */}
          <View style={[
            styles.phaseIconContainer,
            isSelected && styles.phaseIconSelected,
          ]}>
            <Text variant="h1">{phase.icon}</Text>
          </View>

          {/* Phase number and Sanskrit */}
          <Text variant="caption" color={isSelected ? colors.primary[300] : colors.text.muted}>
            Phase {phase.number} · {phase.sanskrit}
          </Text>

          {/* Title */}
          <Text variant="h2" color={colors.text.primary}>
            {phase.title}
          </Text>

          {/* Description */}
          <Text variant="bodySmall" color={colors.text.secondary} align="center" style={styles.phaseDescription}>
            {phase.description}
          </Text>
        </GlowCard>
      </Animated.View>
    </Pressable>
  );
}

export default function KarmaResetIndex(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Lotus glow pulse
  const lotusGlow = useSharedValue(0.3);

  useEffect(() => {
    lotusGlow.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [lotusGlow]);

  const lotusGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: lotusGlow.value,
  }));

  // Track which card is most visible for auto-select on scroll stop
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0]?.item) {
        const visiblePhase = viewableItems[0].item as (typeof PHASES)[number];
        setSelectedPhase(visiblePhase.number);
        void Haptics.selectionAsync();
      }
    },
    [],
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const handlePhaseSelect = useCallback(
    (phaseNumber: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedPhase((prev) => (prev === phaseNumber ? null : phaseNumber));

      // Scroll the FlatList to center the selected card
      const index = PHASES.findIndex((p) => p.number === phaseNumber);
      if (index >= 0) {
        flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      }
    },
    [],
  );

  const handleBeginRitual = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/tools/karma-reset/phases/acknowledgment');
  }, [router]);

  const renderPhaseCard = useCallback(
    ({ item }: { item: (typeof PHASES)[number] }) => (
      <PhaseCard
        phase={item}
        isSelected={selectedPhase === item.number}
        onSelect={() => handlePhaseSelect(item.number)}
      />
    ),
    [selectedPhase, handlePhaseSelect],
  );

  const keyExtractor = useCallback(
    (item: (typeof PHASES)[number]) => String(item.number),
    [],
  );

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: CARD_WIDTH,
      offset: (CARD_WIDTH + CARD_GAP) * index,
      index,
    }),
    [],
  );

  return (
    <DivineBackground variant="cosmic" style={styles.root}>
      {/* MandalaSpin backdrop */}
      <View style={styles.mandalaBackdrop}>
        <MandalaSpin
          size={SCREEN_WIDTH * 0.85}
          speed="slow"
          color={colors.alpha.goldLight}
          opacity={0.04}
        />
      </View>

      <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
        {/* Hero — Large LotusProgress with sacred glow */}
        <Animated.View entering={FadeIn.duration(800)} style={styles.lotusContainer}>
          <Animated.View style={[styles.lotusGlow, lotusGlowStyle]}>
            <LotusProgress progress={0} size={140} />
          </Animated.View>
        </Animated.View>

        {/* Step indicator */}
        <SacredStepIndicator totalSteps={4} currentStep={0} completedSteps={[]} />

        {/* Title and subtitle */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text variant="h1" color={colors.divine.aura} align="center">
            Karma Reset
          </Text>
          <Text variant="body" color={colors.text.secondary} align="center" style={styles.subtitle}>
            Release what no longer serves your dharma
          </Text>
        </Animated.View>

        {/* Horizontal scrollable phase cards — snaps to each card */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={PHASES}
            renderItem={renderPhaseCard}
            keyExtractor={keyExtractor}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            snapToInterval={SNAP_INTERVAL}
            decelerationRate="fast"
            getItemLayout={getItemLayout}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
          />
        </Animated.View>

        {/* Bottom-anchored CTA with safe area padding */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(400)}
          style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}
        >
          <GoldenButton
            title="Begin Sacred Ritual"
            onPress={handleBeginRitual}
            testID="karma-reset-begin"
          />
        </Animated.View>
      </View>
    </DivineBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  mandalaBackdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  container: {
    flex: 1,
    zIndex: 1,
  },
  lotusContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  lotusGlow: {
    shadowColor: colors.divine.aura,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 0,
  },
  header: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  subtitle: {
    lineHeight: 22,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  carouselContent: {
    paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
  },
  phaseCard: {
    width: CARD_WIDTH,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  phaseCardSelected: {
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
  },
  phaseIconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.alpha.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
  },
  phaseIconSelected: {
    backgroundColor: colors.alpha.goldMedium,
    borderColor: colors.alpha.goldStrong,
    shadowColor: colors.divine.aura,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  phaseDescription: {
    lineHeight: 20,
    marginTop: spacing.xxs,
  },
  actions: {
    paddingHorizontal: spacing.lg,
  },
});
