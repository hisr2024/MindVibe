/**
 * CompassSealChamber — Chamber VI (Seal)
 *
 * Final affirmation. The user sees:
 *   - A blooming compass-rose glyph at the top
 *   - "Your Compass is Set" — staggered word-by-word reveal
 *   - A summary card (relationship, dominant guna, quality, sankalpa, date)
 *   - Three navigation buttons: Return Home / Journal This / Talk to Sakha
 *
 * Sealing behaviour: when this chamber mounts, the parent has already
 * persisted the SealedCompassReading to AsyncStorage. This screen is
 * purely presentational + navigation.
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { GoldenButton } from '@kiaanverse/ui';

import { CompassRose } from '../components/CompassRose';
import type { GunaName } from '../hooks/useGunaCalculation';

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200, 191, 168, 0.65)';
const GOLD = '#E8B54A';
const CARD_BG = 'rgba(22, 26, 66, 0.72)';
const CARD_BORDER = 'rgba(212, 160, 23, 0.18)';

const GUNA_COLORS: Readonly<Record<GunaName, string>> = {
  tamas: '#9CA3AF',
  rajas: '#E89B4A',
  sattva: GOLD,
  balanced: GOLD,
};

export interface CompassSealChamberProps {
  readonly partnerName: string;
  readonly relationshipTypeLabel: string;
  readonly dominantGuna: GunaName;
  readonly intentionText: string;
  readonly selectedQualityLabel: string | null;
  readonly sealedAt: string;
  readonly onJournal?: () => void;
  readonly onTalkToSakha?: () => void;
}

const TITLE_WORDS = ['Your', 'Compass', 'is', 'Set'] as const;

export function CompassSealChamber({
  partnerName,
  relationshipTypeLabel,
  dominantGuna,
  intentionText,
  selectedQualityLabel,
  sealedAt,
  onJournal,
  onTalkToSakha,
}: CompassSealChamberProps): React.JSX.Element {
  const router = useRouter();
  const gunaColor = GUNA_COLORS[dominantGuna] ?? GUNA_COLORS.balanced;
  const dominantLabel =
    dominantGuna.charAt(0).toUpperCase() + dominantGuna.slice(1);

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(sealedAt));
  }, [sealedAt]);

  const goHome = () => router.replace('/(tabs)' as never);
  const goJournal = () => {
    if (onJournal) return onJournal();
    router.push('/journal' as never);
  };
  const goSakha = () => {
    if (onTalkToSakha) return onTalkToSakha();
    // Sakha lives in the chat tab, not /wellness — the previous fallback
    // silently dropped users on the mood screen when they tapped
    // "Talk to Sakha" without an override handler.
    router.push('/chat' as never);
  };

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(420)} style={styles.heroBlock}>
        <CompassRose size={104} />
      </Animated.View>

      <View style={styles.titleRow}>
        {TITLE_WORDS.map((word, i) => (
          <Animated.Text
            key={`${word}-${i}`}
            entering={FadeInUp.delay(700 + i * 150).duration(440)}
            style={styles.titleWord}
          >
            {word}
          </Animated.Text>
        ))}
      </View>

      <Animated.View
        entering={FadeInDown.delay(1500).duration(380)}
        style={styles.summaryCard}
      >
        <Text style={styles.summaryLine}>
          Relationship:{' '}
          <Text style={styles.summaryStrong}>
            {partnerName.trim() || 'Unnamed'} ({relationshipTypeLabel})
          </Text>
        </Text>
        <Text style={[styles.summaryLine, { color: gunaColor }]}>
          Dominant Energy:{' '}
          <Text style={[styles.summaryStrong, { color: gunaColor }]}>
            {dominantLabel}
          </Text>
        </Text>
        {selectedQualityLabel ? (
          <Text style={styles.summaryLine}>
            Quality:{' '}
            <Text style={styles.summaryStrong}>{selectedQualityLabel}</Text>
          </Text>
        ) : null}
        {intentionText ? (
          <Text style={styles.intentionLine}>
            <Text style={styles.intentionLabel}>Intention: </Text>
            {intentionText}
          </Text>
        ) : null}
        <Text style={styles.dateLine}>Date: {formattedDate}</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(1800).duration(380)}
        style={styles.actions}
      >
        <GoldenButton title="Return to Home" onPress={goHome} variant="ghost" />
        <Pressable onPress={goJournal} style={styles.ghostButton}>
          <Text style={styles.ghostButtonLabel}>Journal This</Text>
        </Pressable>
        <Pressable onPress={goSakha} style={styles.ghostButton}>
          <Text style={styles.ghostButtonLabel}>Talk to Sakha</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default CompassSealChamber;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 18,
    alignItems: 'stretch',
  },
  heroBlock: {
    alignItems: 'center',
    marginTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  titleWord: {
    color: GOLD,
    fontFamily: 'CormorantGaramond-LightItalic',
    fontSize: 28,
  },
  summaryCard: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 18,
    gap: 8,
  },
  summaryLine: {
    color: SACRED_WHITE,
    fontSize: 14,
  },
  summaryStrong: {
    color: SACRED_WHITE,
    fontWeight: '600',
  },
  intentionLine: {
    color: SACRED_WHITE,
    fontSize: 14,
    fontFamily: 'CrimsonText-Italic',
    marginTop: 4,
  },
  intentionLabel: {
    color: SACRED_WHITE,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  dateLine: {
    color: TEXT_MUTED,
    fontSize: 11,
    marginTop: 6,
  },
  actions: {
    gap: 10,
    marginTop: 6,
  },
  ghostButton: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(232, 181, 74, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ghostButtonLabel: {
    color: GOLD,
    fontSize: 16,
    fontWeight: '600',
  },
});
