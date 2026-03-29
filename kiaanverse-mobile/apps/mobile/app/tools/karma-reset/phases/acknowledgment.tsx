/**
 * Phase 1: Acknowledgment — Recognize the karmic pattern to release.
 *
 * Full-screen immersive mobile UX with:
 *   - DivineGradient backdrop (release variant) for sacred atmosphere
 *   - Animated KarmaPhaseTracker at top with golden progress circles
 *   - Six Shadripu (enemies of mind) as animated selectable pattern cards
 *   - Sacred golden-bordered TextInput for personal pattern description
 *   - Bottom-anchored CTA with safe-area awareness
 *   - Staggered reveal animations with spring-based card interactions
 *   - Haptic feedback on selection and navigation
 *   - Starts karma reset session via API on continue
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeInUp,
  SlideInDown,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Text,
  GoldenButton,
  DivineGradient,
  SacredDivider,
  MandalaSpin,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useStartKarmaReset } from '@kiaanverse/api';
import { useKarmaResetStore } from '@kiaanverse/store';
import {
  KarmicPatternCard,
  KarmicPattern,
} from '../../../../components/karma-reset/KarmicPatternCard';
import { KarmaPhaseTracker } from '../../../../components/karma-reset/KarmaPhaseTracker';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Shadripu — The Six Enemies of the Mind
// ---------------------------------------------------------------------------

const KARMIC_PATTERNS: readonly KarmicPattern[] = [
  {
    id: 'kama',
    sanskrit: 'काम (Kāma)',
    english: 'Desire / Attachment',
    icon: '🔥',
    description: 'Clinging to outcomes, people, or possessions that bind the soul',
  },
  {
    id: 'krodha',
    sanskrit: 'क्रोध (Krodha)',
    english: 'Anger',
    icon: '⚡',
    description: 'Reactive fury that clouds judgment and harms sacred bonds',
  },
  {
    id: 'lobha',
    sanskrit: 'लोभ (Lobha)',
    english: 'Greed',
    icon: '💰',
    description: 'Insatiable wanting that leaves the soul perpetually empty',
  },
  {
    id: 'moha',
    sanskrit: 'मोह (Moha)',
    english: 'Delusion',
    icon: '🌀',
    description: 'Confusion about what is real, mistaking the transient for eternal',
  },
  {
    id: 'mada',
    sanskrit: 'मद (Mada)',
    english: 'Pride',
    icon: '👑',
    description: 'Ego-driven superiority that separates you from the divine in others',
  },
  {
    id: 'matsarya',
    sanskrit: 'मात्सर्य (Mātsarya)',
    english: 'Jealousy',
    icon: '🐍',
    description: 'Resentment of another\'s fortune that poisons your own peace',
  },
] as const;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AcknowledgmentPhase(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const [personalDescription, setPersonalDescription] = useState('');

  const startKarmaReset = useStartKarmaReset();
  const setPattern = useKarmaResetStore((s) => s.setPattern);
  const startSession = useKarmaResetStore((s) => s.startSession);

  const handleSelect = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPatternId(id);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedPatternId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Start session via API (non-blocking, with fallback)
    startKarmaReset.mutate(selectedPatternId, {
      onSuccess: (session) => {
        startSession(session.id ?? `local-${Date.now()}`);
        setPattern(selectedPatternId, personalDescription);
      },
      onError: () => {
        // Graceful degradation: continue with local session
        startSession(`local-${Date.now()}`);
        setPattern(selectedPatternId, personalDescription);
      },
    });

    // Navigate immediately for seamless UX
    setPattern(selectedPatternId, personalDescription);
    router.push({
      pathname: '/tools/karma-reset/phases/understanding',
      params: {
        patternId: selectedPatternId,
        description: personalDescription,
      },
    });
  }, [selectedPatternId, personalDescription, router, startKarmaReset, startSession, setPattern]);

  return (
    <DivineGradient variant="release" style={styles.root}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* MandalaSpin backdrop for atmosphere */}
        <View style={styles.mandalaBackdrop}>
          <MandalaSpin
            size={SCREEN_WIDTH * 0.9}
            speed="slow"
            color={colors.alpha.goldLight}
            opacity={0.05}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Phase tracker */}
          <Animated.View entering={FadeInDown.duration(500)}>
            <KarmaPhaseTracker currentPhase={1} completedPhases={[]} />
          </Animated.View>

          {/* Header with sacred styling */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.header}>
            <Text variant="caption" color={colors.primary[400]} align="center">
              Phase 1 of 4
            </Text>
            <Text variant="h1" color={colors.divine.aura} align="center">
              Acknowledgment
            </Text>
            <Text variant="body" color={colors.text.secondary} align="center" style={styles.subtitle}>
              Name the karmic pattern you are ready to release
            </Text>
          </Animated.View>

          <SacredDivider />

          {/* Pattern grid -- 2 columns of sacred cards */}
          <Animated.View entering={FadeIn.duration(600).delay(300)} style={styles.grid}>
            {KARMIC_PATTERNS.map((pattern, index) => (
              <Animated.View
                key={pattern.id}
                entering={FadeInDown.duration(400).delay(300 + index * 80)}
              >
                <KarmicPatternCard
                  pattern={pattern}
                  isSelected={selectedPatternId === pattern.id}
                  onSelect={handleSelect}
                />
              </Animated.View>
            ))}
          </Animated.View>

          {/* Personal description -- appears after pattern selected */}
          {selectedPatternId ? (
            <Animated.View
              entering={SlideInDown.springify().damping(18).stiffness(200)}
              style={styles.inputSection}
            >
              <Text variant="label" color={colors.primary[300]}>
                Describe this pattern in your life
              </Text>
              <Text variant="caption" color={colors.text.muted}>
                How does this pattern manifest? Be honest and gentle with yourself.
              </Text>
              <TextInput
                style={styles.textInput}
                value={personalDescription}
                onChangeText={setPersonalDescription}
                placeholder="In my life, this pattern shows up when..."
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
                selectionColor={colors.primary[500]}
                accessibilityLabel="Personal description of karmic pattern"
              />
              <Text variant="caption" color={colors.text.muted} style={styles.charCount}>
                {personalDescription.length}/500
              </Text>
            </Animated.View>
          ) : null}

          {/* Bottom spacer for scroll */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Bottom-anchored CTA with safe area */}
        {selectedPatternId ? (
          <Animated.View
            entering={FadeInUp.duration(400)}
            style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}
          >
            <GoldenButton
              title="Continue to Understanding"
              onPress={handleContinue}
              loading={startKarmaReset.isPending}
              testID="acknowledgment-continue"
            />
          </Animated.View>
        ) : null}
      </KeyboardAvoidingView>
    </DivineGradient>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xxs,
    paddingTop: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.xs,
    lineHeight: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  inputSection: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: colors.alpha.goldLight,
    borderRadius: radii.lg,
    backgroundColor: colors.background.card,
    color: colors.text.primary,
    padding: spacing.md,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 110,
    shadowColor: colors.divine.aura,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  charCount: {
    textAlign: 'right',
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: 'rgba(5, 7, 20, 0.9)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.alpha.whiteLight,
    zIndex: 10,
  },
});
