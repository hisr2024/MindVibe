/**
 * Phase 4: Renewal — Set a new intention and receive a sacred blessing.
 *
 * Full-screen immersive mobile UX with two distinct states:
 *
 * STATE 1 (Intention Input):
 *   - DivineGradient (renewal variant) backdrop
 *   - Sacred prompt with breathing opacity animation
 *   - Golden-bordered TextInput for intention setting
 *   - KeyboardAvoidingView for seamless typing
 *   - Bottom-anchored "Receive Blessing" CTA
 *
 * STATE 2 (Blessing Reveal):
 *   - DivineGradient (divine variant) for transcendent atmosphere
 *   - ConfettiCannon celebration with 80 particles
 *   - LotusProgress bloom to full (120px) as completion badge
 *   - RenewalBlessing card with animated shimmer border
 *   - User intention displayed as sacred quote
 *   - Karma points awarded (+108)
 *   - "Complete Sacred Ritual" CTA
 *
 * Uses API integration with graceful fallback to hardcoded blessings.
 * Uses established sacred cosmic dark theme tokens exclusively.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
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
  ConfettiCannon,
  LotusProgress,
  SacredDivider,
  MandalaSpin,
  LoadingMandala,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useCompleteKarmaReset } from '@kiaanverse/api';
import { useKarmaResetStore } from '@kiaanverse/store';
import { KarmaPhaseTracker } from '../../../../components/karma-reset/KarmaPhaseTracker';
import { RenewalBlessing } from '../../../../components/karma-reset/RenewalBlessing';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Fallback blessings keyed by pattern id
// ---------------------------------------------------------------------------

interface BlessingData {
  blessing: string;
  verse: { chapter: number; verse: number; text: string; translation: string };
  karmaPoints: number;
}

const FALLBACK_BLESSINGS: Record<string, BlessingData> = {
  kama: {
    blessing:
      'You have loosened the grip of desire. May your heart find fulfilment not in possessing, but in being. The divine light within you is already complete.',
    verse: {
      chapter: 2,
      verse: 55,
      text: 'प्रजहाति यदा कामान्सर्वान्पार्थ मनोगतान्\nआत्मन्येवात्मना तुष्टः स्थितप्रज्ञस्तदोच्यते',
      translation:
        'When one completely renounces all desires of the mind and is satisfied in the Self by the Self, then one is called steady in wisdom.',
    },
    karmaPoints: 108,
  },
  krodha: {
    blessing:
      'The fire of anger has been transformed into the fire of awareness. May patience and compassion be the new flame you carry forward.',
    verse: {
      chapter: 5,
      verse: 26,
      text: 'कामक्रोधवियुक्तानां यतीनां यतचेतसाम्\nअभितो ब्रह्मनिर्वाणं वर्तते विदितात्मनाम्',
      translation:
        'For those sages who have conquered anger and desire, who have controlled their minds — liberation exists here and hereafter.',
    },
    karmaPoints: 108,
  },
  lobha: {
    blessing:
      'Greed dissolves when you realise that the entire universe already belongs to you. May you walk forward with open hands and an abundant heart.',
    verse: {
      chapter: 4,
      verse: 39,
      text: 'श्रद्धावाँल्लभते ज्ञानं तत्परः संयतेन्द्रियः\nज्ञानं लब्ध्वा परां शान्तिमचिरेणाधिगच्छति',
      translation:
        'A faithful person, absorbed in divine knowledge, with senses restrained, quickly attains supreme peace.',
    },
    karmaPoints: 108,
  },
  moha: {
    blessing:
      'The veil of delusion has parted. May the clarity you have found illuminate every step of your path and reveal what has always been true.',
    verse: {
      chapter: 18,
      verse: 73,
      text: 'नष्टो मोहः स्मृतिर्लब्धा त्वत्प्रसादान्मयाच्युत\nस्थितोऽस्मि गतसन्देहः करिष्ये वचनं तव',
      translation:
        'My delusion is destroyed, and I have gained wisdom through Your grace. I am firm; my doubts are gone. I shall act according to Your word.',
    },
    karmaPoints: 108,
  },
  mada: {
    blessing:
      'Pride has given way to humility. May you see the divine spark equally in yourself and in all beings you encounter.',
    verse: {
      chapter: 6,
      verse: 29,
      text: 'सर्वभूतस्थमात्मानं सर्वभूतानि चात्मनि\nईक्षते योगयुक्तात्मा सर्वत्र समदर्शनः',
      translation:
        'One who sees the Self in all beings and all beings in the Self — such a person never loses sight of the divine.',
    },
    karmaPoints: 108,
  },
  matsarya: {
    blessing:
      'Jealousy fades when the heart overflows with gratitude. May you celebrate others\' light as freely as you celebrate your own.',
    verse: {
      chapter: 12,
      verse: 13,
      text: 'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च\nनिर्ममो निरहङ्कारः समदुःखसुखः क्षमी',
      translation:
        'One who is free from malice toward all beings, who is friendly and compassionate — such a devotee is dear to Me.',
    },
    karmaPoints: 108,
  },
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function RenewalPhase(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { patternId } = useLocalSearchParams<{
    patternId: string;
    description?: string;
    reflection?: string;
  }>();

  const [intention, setIntention] = useState('');
  const [blessingData, setBlessingData] = useState<BlessingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBlessing, setShowBlessing] = useState(false);

  const completeKarmaReset = useCompleteKarmaReset();
  const sessionId = useKarmaResetStore((s) => s.sessionId);
  const setIntentionStore = useKarmaResetStore((s) => s.setIntention);
  const completeSession = useKarmaResetStore((s) => s.completeSession);

  // Sacred prompt breathing animation
  const promptBreath = useSharedValue(0.7);

  useEffect(() => {
    promptBreath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [promptBreath]);

  const promptStyle = useAnimatedStyle(() => ({
    opacity: promptBreath.value,
  }));

  // Fetch blessing from API (or use fallback)
  const fetchBlessing = useCallback(async () => {
    setIsLoading(true);
    setIntentionStore(intention);

    try {
      // Attempt API completion
      if (sessionId) {
        completeKarmaReset.mutate(sessionId, {
          onSuccess: (session) => {
            const apiBlessing = (session as unknown as Record<string, unknown>)?.blessing as BlessingData | undefined;
            if (apiBlessing?.blessing && apiBlessing?.verse) {
              setBlessingData(apiBlessing);
            } else {
              applyFallback();
            }
            completeSession();
            setShowBlessing(true);
            setIsLoading(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
          onError: () => {
            applyFallback();
            completeSession();
            setShowBlessing(true);
            setIsLoading(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        });
      } else {
        // No session — use fallback after brief sacred pause
        await new Promise((resolve) => setTimeout(resolve, 1500));
        applyFallback();
        completeSession();
        setShowBlessing(true);
        setIsLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      applyFallback();
      completeSession();
      setShowBlessing(true);
      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    function applyFallback(): void {
      const fallback = FALLBACK_BLESSINGS[patternId ?? 'kama'] ?? FALLBACK_BLESSINGS.kama;
      setBlessingData(fallback ?? null);
    }
  }, [intention, patternId, sessionId, completeKarmaReset, completeSession, setIntentionStore]);

  // Submit intention and request blessing
  const handleReceiveBlessing = useCallback(() => {
    if (!intention.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fetchBlessing();
  }, [intention, fetchBlessing]);

  const handleComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/tools/karma-reset');
  }, [router]);

  // -------------------------------------------------------------------------
  // STATE 2: Full-screen blessing reveal
  // -------------------------------------------------------------------------
  if (showBlessing && blessingData) {
    return (
      <DivineGradient variant="divine" style={styles.root}>
        {/* Confetti fills the entire screen */}
        <ConfettiCannon isActive particleCount={80} duration={4000} />

        {/* MandalaSpin backdrop */}
        <View style={styles.mandalaBackdrop}>
          <MandalaSpin
            size={SCREEN_WIDTH * 0.9}
            speed="slow"
            color={colors.divine.aura}
            opacity={0.06}
          />
        </View>

        <View style={[styles.blessingContainer, { paddingTop: insets.top + spacing.md }]}>
          {/* Phase tracker at top */}
          <Animated.View entering={FadeIn.duration(400)}>
            <KarmaPhaseTracker currentPhase={4} completedPhases={[1, 2, 3, 4]} />
          </Animated.View>

          {/* Centered blessing content */}
          <View style={styles.blessingContent}>
            {/* Large Lotus — completion badge */}
            <Animated.View entering={FadeIn.duration(800)} style={styles.lotusCenter}>
              <LotusProgress progress={1} size={120} />
            </Animated.View>

            <Animated.View entering={FadeIn.delay(200).duration(600)}>
              <Text variant="h2" color={colors.divine.aura} align="center">
                Sacred Renewal
              </Text>
            </Animated.View>

            {/* Sacred blessing card */}
            <Animated.View entering={FadeInUp.duration(600).delay(400)}>
              <GlowCard variant="sacred" style={styles.blessingCard}>
                <RenewalBlessing
                  blessing={blessingData.blessing}
                  verse={blessingData.verse}
                  karmaPoints={blessingData.karmaPoints}
                />
              </GlowCard>
            </Animated.View>

            {/* User intention as quote */}
            <Animated.View entering={FadeIn.duration(600).delay(600)}>
              <Text
                variant="body"
                color={colors.primary[300]}
                align="center"
                style={styles.intentionQuote}
              >
                &ldquo;{intention}&rdquo;
              </Text>
            </Animated.View>
          </View>

          {/* Bottom-anchored CTA */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(800)}
            style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}
          >
            <GoldenButton
              title="Complete Sacred Ritual"
              onPress={handleComplete}
              testID="renewal-complete"
            />
          </Animated.View>
        </View>
      </DivineGradient>
    );
  }

  // -------------------------------------------------------------------------
  // STATE 1: Intention input with keyboard handling
  // -------------------------------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <DivineGradient variant="renewal" style={styles.root}>
        {/* MandalaSpin backdrop */}
        <View style={styles.mandalaBackdrop}>
          <MandalaSpin
            size={SCREEN_WIDTH * 0.8}
            speed="slow"
            color={colors.alpha.goldLight}
            opacity={0.05}
          />
        </View>

        <View style={[styles.inputContainer, { paddingTop: insets.top + spacing.md }]}>
          {/* Phase tracker at top */}
          <Animated.View entering={FadeInDown.duration(500)}>
            <KarmaPhaseTracker currentPhase={4} completedPhases={[1, 2, 3]} />
          </Animated.View>

          {/* Header */}
          <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.header}>
            <Text variant="caption" color={colors.primary[500]} align="center">
              Phase 4 of 4
            </Text>
            <Text variant="h1" color={colors.divine.aura} align="center">
              Renewal
            </Text>
          </Animated.View>

          {/* Centered intention input — fills available vertical space */}
          <Animated.View
            entering={FadeInDown.duration(500).delay(200)}
            style={styles.intentionSection}
          >
            <Text variant="label" color={colors.primary[300]} align="center">
              Set Your New Intention
            </Text>

            <Animated.View style={promptStyle}>
              <Text variant="body" color={colors.text.secondary} align="center" style={styles.promptText}>
                What will you cultivate in place of the pattern you released?
              </Text>
            </Animated.View>

            <TextInput
              style={styles.textInput}
              value={intention}
              onChangeText={setIntention}
              placeholder="I will cultivate..."
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
              selectionColor={colors.primary[500]}
              accessibilityLabel="New intention"
            />

            <Text variant="caption" color={colors.text.muted} style={styles.charCount}>
              {intention.length}/500
            </Text>
          </Animated.View>

          {/* Bottom-anchored CTA — stays above keyboard */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(300)}
            style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <LoadingMandala size={48} />
                <Text variant="bodySmall" color={colors.text.muted} align="center">
                  Preparing your sacred blessing...
                </Text>
              </View>
            ) : (
              <GoldenButton
                title="Receive Blessing"
                onPress={handleReceiveBlessing}
                disabled={!intention.trim()}
                testID="renewal-receive-blessing"
              />
            )}
          </Animated.View>
        </View>
      </DivineGradient>
    </KeyboardAvoidingView>
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

  // -- State 1: Intention input --
  inputContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    zIndex: 1,
  },
  header: {
    gap: spacing.xxs,
    paddingTop: spacing.xs,
  },
  intentionSection: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  promptText: {
    lineHeight: 24,
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: colors.alpha.goldLight,
    borderRadius: radii.lg,
    backgroundColor: colors.background.card,
    color: colors.text.primary,
    padding: spacing.md,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    maxHeight: 200,
    shadowColor: colors.divine.aura,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  charCount: {
    textAlign: 'right',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },

  // -- State 2: Blessing reveal --
  blessingContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    zIndex: 1,
  },
  blessingContent: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  lotusCenter: {
    alignItems: 'center',
  },
  blessingCard: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  intentionQuote: {
    fontStyle: 'italic',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },

  // -- Shared --
  bottomCTA: {
    paddingTop: spacing.sm,
  },
});
