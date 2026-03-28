/**
 * Phase 4: Renewal — Set a new intention and receive a sacred blessing.
 *
 * The final phase of the Karma Reset ritual. The user writes an intention
 * for what they will cultivate in place of the released pattern. An AI-
 * generated blessing and Gita verse honour their transformation. Karma
 * points are awarded on completion.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Screen,
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
  const { patternId } = useLocalSearchParams<{
    patternId: string;
    description?: string;
    reflection?: string;
  }>();

  const [intention, setIntention] = useState('');
  const [blessingData, setBlessingData] = useState<BlessingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBlessing, setShowBlessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Fetch blessing from API (or use fallback)
  const fetchBlessing = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API latency — replace with real endpoint
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const fallback = FALLBACK_BLESSINGS[patternId ?? 'kama'] ?? FALLBACK_BLESSINGS.kama;
      setBlessingData(fallback);
      setShowBlessing(true);
    } catch {
      const fallback = FALLBACK_BLESSINGS[patternId ?? 'kama'] ?? FALLBACK_BLESSINGS.kama;
      setBlessingData(fallback);
      setShowBlessing(true);
    } finally {
      setIsLoading(false);
    }
  }, [patternId]);

  // Auto-fetch blessing once intention is submitted
  const handleReceiveBlessing = useCallback(() => {
    if (!intention.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCompleted(true);
    fetchBlessing();
  }, [intention, fetchBlessing]);

  const handleComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Navigate back to tools root — celebration can be added as a follow-up
    router.replace('/tools/karma-reset');
  }, [router]);

  return (
    <Screen scroll>
      <DivineGradient variant="renewal">
      <View style={styles.container}>
        <ConfettiCannon isActive={isCompleted} particleCount={80} duration={4000} />
        {/* Phase tracker */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <KarmaPhaseTracker currentPhase={4} completedPhases={[1, 2, 3]} />
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.header}>
          <Text variant="h2" align="center">
            ✨ Phase 4: Renewal
          </Text>
          <Text variant="bodySmall" color={colors.text.muted} align="center">
            Step 4 of 4
          </Text>
        </Animated.View>

        <SacredDivider />

        {/* Intention prompt */}
        {!showBlessing ? (
          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.section}>
            <Text variant="label" color={colors.primary[300]}>
              Set Your New Intention
            </Text>
            <Text variant="body" color={colors.text.secondary}>
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
              accessibilityLabel="New intention"
            />

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
        ) : null}

        {/* Blessing display */}
        {showBlessing && blessingData ? (
          <>
            <GlowCard variant="sacred">
            <RenewalBlessing
              blessing={blessingData.blessing}
              verse={blessingData.verse}
              karmaPoints={blessingData.karmaPoints}
            />
            </GlowCard>

            <View style={styles.lotusCompletionBadge}>
              <LotusProgress progress={1} size={100} />
            </View>

            {/* Intention reminder */}
            <Animated.View entering={FadeIn.duration(600).delay(400)} style={styles.section}>
              <Text variant="label" color={colors.text.secondary} align="center">
                Your Intention
              </Text>
              <Text variant="body" color={colors.primary[200]} align="center" style={styles.intentionText}>
                "{intention}"
              </Text>
            </Animated.View>

            {/* Complete button */}
            <Animated.View entering={FadeIn.duration(400).delay(600)} style={styles.actions}>
              <GoldenButton
                title="Complete Sacred Ritual"
                onPress={handleComplete}
                testID="renewal-complete"
              />
            </Animated.View>
          </>
        ) : null}
      </View>
      </DivineGradient>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
    borderRadius: 12,
    backgroundColor: colors.background.card,
    color: colors.text.primary,
    padding: spacing.md,
    fontSize: 15,
    minHeight: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  intentionText: {
    fontStyle: 'italic',
    lineHeight: 24,
  },
  lotusCompletionBadge: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
});
