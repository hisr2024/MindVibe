/**
 * Phase 2: Understanding — Receive Gita wisdom for the selected karmic pattern.
 *
 * Fetches AI-generated guidance and a relevant Bhagavad Gita verse from the
 * API. The user reads the wisdom, then writes a personal reflection before
 * advancing to the Release phase.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Text,
  Card,
  GoldenButton,
  Divider,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { KarmaPhaseTracker } from '../../../../components/karma-reset/KarmaPhaseTracker';

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
      sanskrit: 'ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते',
      translation:
        'While contemplating the objects of the senses, a person develops attachment for them.',
    },
  },
  krodha: {
    wisdom:
      'Anger clouds discernment and leads to the destruction of wisdom. By cultivating patience and self-awareness, you transform reactive fury into conscious response.',
    verse: {
      chapter: 2,
      verse: 63,
      sanskrit: 'क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः',
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
      sanskrit: 'त्रिविधं नरकस्येदं द्वारं नाशनमात्मनः',
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
      sanskrit: 'नादत्ते कस्यचित्पापं न चैव सुकृतं विभुः',
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
      sanskrit: 'दम्भो दर्पोऽभिमानश्च क्रोधः पारुष्यमेव च',
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
      sanskrit: 'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च',
      translation:
        'One who is free from malice toward all beings, who is friendly and compassionate — such a devotee is dear to Me.',
    },
  },
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function UnderstandingPhase(): React.JSX.Element {
  const router = useRouter();
  const { patternId, description } = useLocalSearchParams<{
    patternId: string;
    description?: string;
  }>();

  const [guidance, setGuidance] = useState<PatternGuidance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reflection, setReflection] = useState('');

  // Fetch guidance from API with fallback
  useEffect(() => {
    let cancelled = false;

    async function fetchGuidance(): Promise<void> {
      try {
        // Simulate API call — replace with real endpoint when available
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (cancelled) return;

        // Use fallback guidance (production: replace with API response)
        const fallback = FALLBACK_GUIDANCE[patternId ?? 'kama'];
        setGuidance(fallback ?? FALLBACK_GUIDANCE.kama);
      } catch {
        // Graceful degradation: always show fallback wisdom
        if (!cancelled) {
          setGuidance(FALLBACK_GUIDANCE[patternId ?? 'kama'] ?? FALLBACK_GUIDANCE.kama);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchGuidance();
    return () => { cancelled = true; };
  }, [patternId]);

  const handleContinue = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({
      pathname: '/tools/karma-reset/phases/release',
      params: { patternId, description, reflection },
    });
  }, [patternId, description, reflection, router]);

  return (
    <Screen scroll>
      <View style={styles.container}>
        {/* Phase tracker */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <KarmaPhaseTracker currentPhase={2} completedPhases={[1]} />
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.header}>
          <Text variant="h2" align="center">
            📖 Phase 2: Understanding
          </Text>
          <Text variant="bodySmall" color={colors.text.muted} align="center">
            Step 2 of 4
          </Text>
        </Animated.View>

        <Divider />

        {/* Loading state */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text variant="body" color={colors.text.muted} align="center">
              Consulting the wisdom of the Gita...
            </Text>
          </View>
        ) : null}

        {/* Wisdom content */}
        {!isLoading && guidance ? (
          <>
            {/* Wisdom section */}
            <Animated.View entering={FadeIn.duration(600)} style={styles.section}>
              <Text variant="label" color={colors.primary[300]}>
                The Wisdom of the Gita tells us...
              </Text>
              <Text variant="body" color={colors.text.secondary} style={styles.wisdomText}>
                {guidance.wisdom}
              </Text>
            </Animated.View>

            {/* Verse card */}
            <Animated.View entering={FadeIn.duration(600).delay(200)}>
              <Card style={styles.verseCard}>
                <Text variant="caption" color={colors.text.muted} align="center">
                  Bhagavad Gita {guidance.verse.chapter}.{guidance.verse.verse}
                </Text>
                <Text
                  variant="body"
                  color={colors.primary[200]}
                  align="center"
                  style={styles.sanskritText}
                >
                  {guidance.verse.sanskrit}
                </Text>
                <Divider />
                <Text variant="bodySmall" color={colors.text.secondary} align="center">
                  {guidance.verse.translation}
                </Text>
              </Card>
            </Animated.View>

            {/* Reflection prompt */}
            <Animated.View entering={FadeIn.duration(600).delay(400)} style={styles.section}>
              <Text variant="label" color={colors.text.secondary}>
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
                accessibilityLabel="Reflection on Gita wisdom"
              />
            </Animated.View>

            {/* Continue */}
            <Animated.View entering={FadeIn.duration(400).delay(600)} style={styles.actions}>
              <GoldenButton
                title="Continue to Release"
                onPress={handleContinue}
                testID="understanding-continue"
              />
            </Animated.View>
          </>
        ) : null}
      </View>
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  wisdomText: {
    lineHeight: 24,
    fontStyle: 'italic',
  },
  verseCard: {
    marginHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.alpha.goldLight,
  },
  sanskritText: {
    lineHeight: 28,
    paddingVertical: spacing.xs,
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
  actions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
