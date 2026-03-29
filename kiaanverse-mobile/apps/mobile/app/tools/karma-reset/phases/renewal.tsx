/**
 * Phase 4: Renewal — Set a new intention and receive a sacred blessing.
 *
 * The final phase of the Karma Reset ritual. Two distinct full-screen states:
 *   1. Intention input — KeyboardAvoidingView with centered TextInput and
 *      bottom-anchored "Receive Blessing" CTA.
 *   2. Blessing reveal — Full-screen immersive display with confetti, large
 *      LotusProgress, GlowCard blessing, and bottom-anchored completion CTA.
 *
 * Karma points are awarded on completion.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown, FadeIn, FadeInUp } from 'react-native-reanimated';
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
  colors,
  spacing,
} from '@kiaanverse/ui';
import { KarmaPhaseTracker } from '../../../../components/karma-reset/KarmaPhaseTracker';
import { RenewalBlessing } from '../../../../components/karma-reset/RenewalBlessing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
      text: 'प्रजहाति यदा कामान्सर्वान्पार्थ मनोगतान्',
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
      text: 'कामक्रोधवियुक्तानां यतीनां यतचेतसाम्',
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
      text: 'श्रद्धावाँल्लभते ज्ञानं तत्परः संयतेन्द्रियः',
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
      text: 'नष्टो मोहः स्मृतिर्लब्धा त्वत्प्रसादान्मयाच्युत',
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
      text: 'सर्वभूतस्थमात्मानं सर्वभूतानि चात्मनि',
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
      text: 'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च',
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

  // Fetch blessing from API (or use fallback)
  const fetchBlessing = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API latency — replace with real endpoint
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const fallback = FALLBACK_BLESSINGS[patternId ?? 'kama'] ?? FALLBACK_BLESSINGS.kama;
      setBlessingData(fallback);
      setShowBlessing(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      const fallback = FALLBACK_BLESSINGS[patternId ?? 'kama'] ?? FALLBACK_BLESSINGS.kama;
      setBlessingData(fallback);
      setShowBlessing(true);
    } finally {
      setIsLoading(false);
    }
  }, [patternId]);

  // Submit intention and request blessing
  const handleReceiveBlessing = useCallback(() => {
    if (!intention.trim()) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fetchBlessing();
  }, [intention, fetchBlessing]);

  const handleComplete = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

            {/* Sacred blessing card */}
            <Animated.View entering={FadeInUp.duration(600).delay(300)}>
              <GlowCard variant="sacred" style={styles.blessingCard}>
                <RenewalBlessing
                  blessing={blessingData.blessing}
                  verse={blessingData.verse}
                  karmaPoints={blessingData.karmaPoints}
                />
              </GlowCard>
            </Animated.View>

            {/* User intention as quote */}
            <Animated.View entering={FadeIn.duration(600).delay(500)}>
              <Text
                variant="body"
                color={colors.primary[200]}
                align="center"
                style={styles.intentionQuote}
              >
                "{intention}"
              </Text>
            </Animated.View>
          </View>

          {/* Bottom-anchored CTA */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(700)}
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
        <View style={[styles.inputContainer, { paddingTop: insets.top + spacing.md }]}>
          {/* Phase tracker at top */}
          <Animated.View entering={FadeInDown.duration(500)}>
            <KarmaPhaseTracker currentPhase={4} completedPhases={[1, 2, 3]} />
          </Animated.View>

          {/* Header */}
          <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.header}>
            <Text variant="h2" align="center">
              Phase 4: Renewal
            </Text>
            <Text variant="bodySmall" color={colors.text.muted} align="center">
              Step 4 of 4
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
            <Text variant="body" color={colors.text.secondary} align="center">
              What will you cultivate in place of the pattern you released?
            </Text>

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
          </Animated.View>

          {/* Bottom-anchored CTA — stays above keyboard */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(300)}
            style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
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
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // -- State 1: Intention input --
  inputContainer: {
    flex: 1,
  },
  header: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  intentionSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
    borderRadius: 16,
    backgroundColor: colors.background.card,
    color: colors.text.primary,
    padding: spacing.md,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    maxHeight: 200,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },

  // -- State 2: Blessing reveal --
  blessingContainer: {
    flex: 1,
  },
  blessingContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
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
    paddingHorizontal: spacing.lg,
  },
});
