/**
 * Karma Reset — Entry Screen (Immersive Native UX)
 *
 * Full-screen immersive layout with horizontal pattern cards,
 * hero LotusProgress, haptic feedback, and bottom-anchored CTA.
 * No ScrollView — everything fits on a single viewport.
 * Horizontal FlatList with snap-to-card for pattern browsing.
 */

import React, { useState, useCallback, useRef } from 'react';
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
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
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
    description: 'Recognize the karmic pattern you wish to release',
  },
  {
    number: 2,
    title: 'Understanding',
    icon: '\u{1F4D6}',
    description: 'Receive wisdom from the Bhagavad Gita for clarity',
  },
  {
    number: 3,
    title: 'Release',
    icon: '\u{1F525}',
    description: 'A guided breathing ritual to let go of the pattern',
  },
  {
    number: 4,
    title: 'Renewal',
    icon: '\u2728',
    description: 'Set a new intention and receive a sacred blessing',
  },
] as const;

/**
 * Animated pattern card with scale feedback on selection.
 * Press triggers haptic feedback and animated scale bounce.
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
    // Bounce animation on select
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
          <View style={styles.phaseIconContainer}>
            <Text variant="h1">{phase.icon}</Text>
          </View>
          <Text variant="label" color={isSelected ? colors.primary[200] : colors.primary[300]}>
            Phase {phase.number}
          </Text>
          <Text variant="h2" color={colors.text.primary}>
            {phase.title}
          </Text>
          <Text variant="bodySmall" color={colors.text.muted} align="center">
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
      <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
        {/* Hero — Large LotusProgress centered */}
        <Animated.View entering={FadeIn.duration(800)} style={styles.lotusContainer}>
          <LotusProgress progress={0} size={140} />
        </Animated.View>

        {/* Step indicator */}
        <SacredStepIndicator totalSteps={4} currentStep={0} completedSteps={[]} />

        {/* Title and subtitle */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Text variant="h1" align="center">
            Karma Reset
          </Text>
          <Text variant="bodySmall" color={colors.text.muted} align="center">
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
          entering={FadeInDown.duration(500).delay(400)}
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
  container: {
    flex: 1,
  },
  lotusContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  header: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
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
    borderColor: colors.primary[400],
  },
  phaseIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.alpha.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  actions: {
    paddingHorizontal: spacing.lg,
  },
});
