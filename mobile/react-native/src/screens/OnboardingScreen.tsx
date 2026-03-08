/**
 * Onboarding Screen
 *
 * Horizontal swipeable onboarding flow shown after first signup:
 * 1. Personalization (name confirmation, intent)
 * 2. Choose spiritual focus (enemy selection)
 * 3. Notification permission
 * 4. Start first journey
 *
 * Uses FlatList for performant horizontal paging.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useAuthStore } from '@state/stores/authStore';
import { useUserPreferencesStore } from '@state/stores/userPreferencesStore';
import { darkTheme, typography, spacing, radii, colors } from '@theme/tokens';

// ---------------------------------------------------------------------------
// Slide Data
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  emoji: string;
  title: string;
  description: string;
  highlight?: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    emoji: '🙏',
    title: 'Namaste',
    description: 'MindVibe is your personal guide to inner peace, powered by the timeless wisdom of the Bhagavad Gita.',
    highlight: 'Your journey to self-discovery begins now.',
  },
  {
    id: 'enemies',
    emoji: '⚔️',
    title: 'Know Your Shadripu',
    description: 'The Gita identifies six inner enemies that cloud our peace: Kama (desire), Krodha (anger), Lobha (greed), Moha (delusion), Mada (pride), and Matsarya (jealousy).',
    highlight: 'We\'ll help you conquer them, one day at a time.',
  },
  {
    id: 'sakha',
    emoji: '🤖',
    title: 'Meet KIAAN',
    description: 'Your AI spiritual companion, grounded in Gita wisdom. Ask anything about life, purpose, relationships, or inner struggles.',
    highlight: 'Always available. Always compassionate.',
  },
  {
    id: 'ready',
    emoji: '🕉️',
    title: 'You\'re Ready',
    description: 'Start a 14-day journey, explore sacred verses, or simply talk to KIAAN. MindVibe adapts to your path.',
    highlight: 'Let\'s begin.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const theme = darkTheme;

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const { completeOnboarding } = useAuthStore();
  const { setHasCompletedOnboarding } = useUserPreferencesStore();

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      completeOnboarding();
      setHasCompletedOnboarding(true);
    } else {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  }, [currentIndex, isLastSlide, completeOnboarding, setHasCompletedOnboarding]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
    setHasCompletedOnboarding(true);
  }, [completeOnboarding, setHasCompletedOnboarding]);

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.slideContent}>
        <Text style={styles.slideEmoji}>{item.emoji}</Text>
        <Text style={[styles.slideTitle, { color: theme.textPrimary }]}>
          {item.title}
        </Text>
        <Text style={[styles.slideDesc, { color: theme.textSecondary }]}>
          {item.description}
        </Text>
        {item.highlight && (
          <Animated.Text
            entering={FadeInDown.delay(200)}
            style={[styles.slideHighlight, { color: theme.accent }]}
          >
            {item.highlight}
          </Animated.Text>
        )}
      </Animated.View>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + spacing.lg,
        },
      ]}
    >
      {/* Skip button */}
      {!isLastSlide && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={[styles.skipText, { color: theme.textSecondary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
        style={styles.flatList}
      />

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {SLIDES.map((slide, index) => (
          <View
            key={slide.id}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === currentIndex ? theme.accent : theme.inputBorder,
                width: index === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Action button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.accent }]}
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel={isLastSlide ? 'Start using MindVibe' : 'Next slide'}
        >
          <Text style={styles.actionButtonText}>
            {isLastSlide ? 'Start My Journey' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: spacing['2xl'],
    zIndex: 10,
    padding: spacing.sm,
  },
  skipText: {
    ...typography.label,
    fontSize: 16,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 340,
  },
  slideEmoji: {
    fontSize: 72,
    marginBottom: spacing['2xl'],
  },
  slideTitle: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  slideDesc: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.lg,
  },
  slideHighlight: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing['3xl'],
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionContainer: {
    paddingHorizontal: spacing['2xl'],
  },
  actionButton: {
    height: 56,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    ...typography.label,
    color: colors.divine.black,
    fontSize: 17,
    fontWeight: '600',
  },
});
