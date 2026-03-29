/**
 * Phase 2: Understanding — Receive Gita wisdom for the selected karmic pattern.
 *
 * Full-screen immersive mobile UX with:
 *   - DivineGradient (healing variant) backdrop with MandalaSpin atmosphere
 *   - API-integrated wisdom fetch with graceful fallback guidance
 *   - Sacred verse card with golden border glow and Sanskrit typography
 *   - Animated wisdom text reveal with staggered cascade
 *   - Golden-bordered reflection TextInput with breathing prompt animation
 *   - Bottom-anchored CTA with safe-area awareness
 *   - Loading state with sacred mandala spinner
 *
 * Uses the established sacred cosmic dark theme tokens exclusively.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Text,
  GoldenButton,
  DivineGradient,
  GlowCard,
  SacredDivider,
  MandalaSpin,
  LoadingMandala,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useKarmaResetStep } from '@kiaanverse/api';
import { useKarmaResetStore } from '@kiaanverse/store';
import { KarmaPhaseTracker } from '../../../../components/karma-reset/KarmaPhaseTracker';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GitaVerse {
  chapter: number;
  verse: number;
  sanskrit: string;
  translation: string;
}

interface PatternGuidance {
  wisdom: string;
  verse: GitaVerse;
}

// ---------------------------------------------------------------------------
// Fallback guidance keyed by pattern id (used when API is unavailable)
// ---------------------------------------------------------------------------

const FALLBACK_GUIDANCE: Record<string, PatternGuidance> = {
  kama: {
    wisdom:
      'Attachment is born from desire. When desire is thwarted, anger arises. Through equanimity and surrender to the divine, the bonds of attachment loosen and the soul finds freedom.',
    verse: {
      chapter: 2,
      verse: 62,
      sanskrit: 'ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते\nसङ्गात्सञ्जायते कामः कामात्क्रोधोऽभिजायते',
      translation:
        'While contemplating the objects of the senses, a person develops attachment for them. From attachment, desire is born; from desire, anger arises.',
    },
  },
  krodha: {
    wisdom:
      'Anger clouds discernment and leads to the destruction of wisdom. By cultivating patience and self-awareness, you transform reactive fury into conscious response.',
    verse: {
      chapter: 2,
      verse: 63,
      sanskrit: 'क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः\nस्मृतिभ्रंशाद् बुद्धिनाशो बुद्धिनाशात्प्रणश्यति',
      translation:
        'From anger arises delusion; from delusion, confusion of memory; from confusion of memory, loss of reason; and from loss of reason, one is utterly ruined.',
    },
  },
  lobha: {
    wisdom:
      'Greed is the endless hunger of the ego. The Gita teaches that true wealth lies in contentment and the recognition that the Self needs nothing external to be complete.',
    verse: {
      chapter: 16,
      verse: 21,
      sanskrit: 'त्रिविधं नरकस्येदं द्वारं नाशनमात्मनः\nकामः क्रोधस्तथा लोभस्तस्मादेतत्त्रयं त्यजेत्',
      translation:
        'There are three gates leading to the hell of self-destruction: lust, anger, and greed. Therefore, one must abandon all three.',
    },
  },
  moha: {
    wisdom:
      'Delusion veils the true nature of reality. Through the light of knowledge and disciplined practice, the fog of confusion lifts and clarity is restored.',
    verse: {
      chapter: 5,
      verse: 15,
      sanskrit: 'नादत्ते कस्यचित्पापं न चैव सुकृतं विभुः\nअज्ञानेनावृतं ज्ञानं तेन मुह्यन्ति जन्तवः',
      translation:
        'The all-pervading Spirit does not take on anyone\'s sinful or pious deeds. Knowledge is covered by ignorance, and thereby beings are deluded.',
    },
  },
  mada: {
    wisdom:
      'Pride erects walls between the self and others. When you recognise the divine spark in every being, the fortress of ego crumbles and humility takes root.',
    verse: {
      chapter: 16,
      verse: 4,
      sanskrit: 'दम्भो दर्पोऽभिमानश्च क्रोधः पारुष्यमेव च\nअज्ञानं चाभिजातस्य पार्थ सम्पदमासुरीम्',
      translation:
        'Hypocrisy, arrogance, conceit, anger, harshness, and ignorance — these are the marks of those born with demoniac qualities.',
    },
  },
  matsarya: {
    wisdom:
      'Jealousy poisons the well of inner peace. The Gita reminds us that every soul walks its own path; comparing journeys only breeds suffering.',
    verse: {
      chapter: 12,
      verse: 13,
      sanskrit: 'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च\nनिर्ममो निरहङ्कारः समदुःखसुखः क्षमी',
      translation:
        'One who is free from malice toward all beings, who is friendly and compassionate, free from possessiveness and ego — such a devotee is dear to Me.',
    },
  },
};

// ---------------------------------------------------------------------------
// Pattern display names for contextual header
// ---------------------------------------------------------------------------

const PATTERN_NAMES: Record<string, string> = {
  kama: 'Desire & Attachment',
  krodha: 'Anger',
  lobha: 'Greed',
  moha: 'Delusion',
  mada: 'Pride',
  matsarya: 'Jealousy',
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function UnderstandingPhase(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { patternId, description } = useLocalSearchParams<{
    patternId: string;
    description?: string;
  }>();

  const [guidance, setGuidance] = useState<PatternGuidance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reflection, setReflection] = useState('');

  const karmaResetStep = useKarmaResetStep();
  const sessionId = useKarmaResetStore((s) => s.sessionId);
  const setWisdomVerses = useKarmaResetStore((s) => s.setWisdomVerses);

  // Verse card border shimmer animation
  const borderShimmer = useSharedValue(0.15);

  useEffect(() => {
    borderShimmer.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [borderShimmer]);

  const verseBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(212, 160, 23, ${borderShimmer.value})`,
  }));

  // Fetch guidance from API with fallback
  useEffect(() => {
    let cancelled = false;

    async function fetchGuidance(): Promise<void> {
      try {
        // Attempt API call for AI-generated wisdom
        if (sessionId) {
          karmaResetStep.mutate(
            {
              sessionId,
              phase: 2,
              data: { patternId, description },
            },
            {
              onSuccess: (session) => {
                if (cancelled) return;
                // Try to extract guidance from API response
                const apiWisdom = (session as unknown as Record<string, unknown>)?.wisdom as PatternGuidance | undefined;
                if (apiWisdom?.wisdom && apiWisdom?.verse) {
                  setGuidance(apiWisdom);
                  // Store verses for later phases
                  setWisdomVerses([{
                    chapter: apiWisdom.verse.chapter,
                    verse: apiWisdom.verse.verse,
                    sanskrit: apiWisdom.verse.sanskrit,
                    translation: apiWisdom.verse.translation,
                    application: apiWisdom.wisdom,
                  }]);
                } else {
                  useFallback();
                }
                setIsLoading(false);
              },
              onError: () => {
                if (!cancelled) useFallback();
              },
            },
          );
        } else {
          // No session — use fallback after brief pause for UX feel
          await new Promise((resolve) => setTimeout(resolve, 1200));
          if (!cancelled) useFallback();
        }
      } catch {
        if (!cancelled) useFallback();
      }
    }

    function useFallback(): void {
      const fallback = FALLBACK_GUIDANCE[patternId ?? 'kama'] ?? FALLBACK_GUIDANCE.kama;
      setGuidance(fallback ?? null);
      if (fallback) {
        setWisdomVerses([{
          chapter: fallback.verse.chapter,
          verse: fallback.verse.verse,
          sanskrit: fallback.verse.sanskrit,
          translation: fallback.verse.translation,
          application: fallback.wisdom,
        }]);
      }
      setIsLoading(false);
    }

    fetchGuidance();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patternId]);

  const handleContinue = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({
      pathname: '/tools/karma-reset/phases/release',
      params: { patternId, description, reflection },
    });
  }, [patternId, description, reflection, router]);

  const patternName = PATTERN_NAMES[patternId ?? 'kama'] ?? 'Your Pattern';

  return (
    <DivineGradient variant="healing" style={styles.root}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* MandalaSpin backdrop */}
        <View style={styles.mandalaBackdrop}>
          <MandalaSpin
            size={SCREEN_WIDTH * 0.85}
            speed="slow"
            color={colors.alpha.goldLight}
            opacity={0.04}
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
            <KarmaPhaseTracker currentPhase={2} completedPhases={[1]} />
          </Animated.View>

          {/* Header */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.header}>
            <Text variant="caption" color={colors.primary[500]} align="center">
              Phase 2 of 4 — {patternName}
            </Text>
            <Text variant="h1" color={colors.divine.aura} align="center">
              Understanding
            </Text>
            <Text variant="body" color={colors.text.secondary} align="center" style={styles.subtitle}>
              Receive wisdom from the Bhagavad Gita
            </Text>
          </Animated.View>

          <SacredDivider />

          {/* Loading state */}
          {isLoading ? (
            <Animated.View entering={FadeIn.duration(500)} style={styles.loadingContainer}>
              <LoadingMandala size={64} />
              <Text variant="body" color={colors.text.muted} align="center" style={styles.loadingText}>
                Consulting the wisdom of the Gita...
              </Text>
            </Animated.View>
          ) : null}

          {/* Wisdom content */}
          {!isLoading && guidance ? (
            <>
              {/* Wisdom text */}
              <Animated.View entering={FadeIn.duration(800).delay(100)} style={styles.section}>
                <Text variant="label" color={colors.primary[300]}>
                  The Wisdom of the Gita
                </Text>
                <Text variant="body" color={colors.text.secondary} style={styles.wisdomText}>
                  {guidance.wisdom}
                </Text>
              </Animated.View>

              {/* Sacred verse card with animated golden border */}
              <Animated.View entering={FadeInDown.duration(700).delay(300)}>
                <Animated.View style={[styles.verseCardOuter, verseBorderStyle]}>
                  <GlowCard variant="sacred" style={styles.verseCard}>
                    <Text variant="caption" color={colors.primary[500]} align="center">
                      Bhagavad Gita {guidance.verse.chapter}.{guidance.verse.verse}
                    </Text>

                    <View style={styles.sanskritContainer}>
                      <Text
                        variant="body"
                        color={colors.primary[300]}
                        align="center"
                        style={styles.sanskritText}
                      >
                        {guidance.verse.sanskrit}
                      </Text>
                    </View>

                    <SacredDivider />

                    <Text
                      variant="body"
                      color={colors.text.secondary}
                      align="center"
                      style={styles.translationText}
                    >
                      {guidance.verse.translation}
                    </Text>
                  </GlowCard>
                </Animated.View>
              </Animated.View>

              {/* Reflection prompt */}
              <Animated.View entering={FadeIn.duration(600).delay(500)} style={styles.section}>
                <Text variant="label" color={colors.primary[300]}>
                  Contemplate
                </Text>
                <Text variant="body" color={colors.text.muted} style={styles.reflectionPrompt}>
                  What does this wisdom mean for your situation?
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={reflection}
                  onChangeText={setReflection}
                  placeholder="Write your reflection here..."
                  placeholderTextColor={colors.text.muted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                  selectionColor={colors.primary[500]}
                  accessibilityLabel="Reflection on Gita wisdom"
                />
                <Text variant="caption" color={colors.text.muted} style={styles.charCount}>
                  {reflection.length}/500
                </Text>
              </Animated.View>

              {/* Bottom spacer */}
              <View style={{ height: 100 }} />
            </>
          ) : null}
        </ScrollView>

        {/* Bottom-anchored CTA */}
        {!isLoading && guidance ? (
          <Animated.View
            entering={FadeInUp.duration(400).delay(600)}
            style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}
          >
            <GoldenButton
              title="Continue to Release"
              onPress={handleContinue}
              testID="understanding-continue"
            />
          </Animated.View>
        ) : null}
      </KeyboardAvoidingView>
    </DivineGradient>
  );
}

// ---------------------------------------------------------------------------
// Styles -- using ONLY established theme tokens
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.lg,
  },
  loadingText: {
    fontStyle: 'italic',
  },
  section: {
    gap: spacing.sm,
  },
  wisdomText: {
    lineHeight: 26,
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  verseCardOuter: {
    borderRadius: radii.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  verseCard: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  sanskritContainer: {
    paddingVertical: spacing.sm,
  },
  sanskritText: {
    lineHeight: 32,
    letterSpacing: 0.5,
    fontSize: 17,
  },
  translationText: {
    lineHeight: 24,
    fontStyle: 'italic',
  },
  reflectionPrompt: {
    lineHeight: 22,
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
    minHeight: 100,
    shadowColor: colors.divine.aura,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
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
    backgroundColor: 'rgba(8, 11, 26, 0.92)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.alpha.whiteLight,
    zIndex: 10,
  },
});
