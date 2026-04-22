/**
 * DharmicIntentionChamber — Chamber V (Sankalpa)
 *
 * Two-step ritual:
 *   1. Choose one of six dharmic qualities (compassion, honesty, patience,
 *      sacred detachment, seva, surrender) — laid out in a 2-column grid.
 *   2. Compose a personal sankalpa (intention) sentence — pre-filled with
 *      "In my relationship with {name}, I choose {quality}."
 *
 * Sealing the intention triggers a heavy haptic (the spiritual
 * "thunk" of commitment) and advances to the final chamber.
 */

import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GoldenButton } from '@kiaanverse/ui';

import { DHARMIC_QUALITIES, type DharmicQuality } from '../data/dharmicQualities';

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200, 191, 168, 0.65)';
const GOLD = '#E8B54A';
const CARD_BG = 'rgba(22, 26, 66, 0.6)';

export interface DharmicIntentionChamberProps {
  readonly partnerName: string;
  readonly selectedQuality: DharmicQuality | null;
  readonly intentionText: string;
  readonly onQualityChange: (quality: DharmicQuality) => void;
  readonly onIntentionTextChange: (text: string) => void;
  readonly onSeal: () => void;
}

export function DharmicIntentionChamber({
  partnerName,
  selectedQuality,
  intentionText,
  onQualityChange,
  onIntentionTextChange,
  onSeal,
}: DharmicIntentionChamberProps): React.JSX.Element {
  // Pre-fill the sankalpa once the user picks a quality (only if they
  // haven't already typed something). This matches the screenshot.
  useEffect(() => {
    if (!selectedQuality) return;
    if (intentionText.trim().length > 0) return;
    const name = partnerName.trim() || 'them';
    onIntentionTextChange(
      `In my relationship with ${name}, I choose ${selectedQuality.label.toLowerCase()}.`,
    );
    // Intentionally only re-run when the selected quality changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuality?.id]);

  const handleSelect = useCallback(
    (q: DharmicQuality) => {
      void Haptics.selectionAsync().catch(() => {});
      onQualityChange(q);
    },
    [onQualityChange],
  );

  const handleSeal = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    onSeal();
  }, [onSeal]);

  return (
    <View style={styles.root}>
      <Animated.Text
        entering={FadeIn.duration(380)}
        style={styles.title}
      >
        Set your dharmic intention
      </Animated.Text>

      <View style={styles.grid}>
        {DHARMIC_QUALITIES.map((q) => {
          const selected = selectedQuality?.id === q.id;
          return (
            <Pressable
              key={q.id}
              accessibilityRole="button"
              accessibilityLabel={`${q.label} — ${q.description}`}
              accessibilityState={{ selected }}
              onPress={() => handleSelect(q)}
              style={[
                styles.qualityCard,
                selected && {
                  borderColor: q.color,
                  borderWidth: 2,
                  shadowColor: q.color,
                  shadowOpacity: 0.55,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 10,
                },
              ]}
            >
              <Text style={[styles.qualitySanskrit, { color: q.color }]}>
                {q.sanskrit}
              </Text>
              <Text style={styles.qualityLabel}>{q.label}</Text>
              <Text style={styles.qualityDescription}>{q.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View
        entering={FadeInDown.duration(360)}
        style={styles.intentionWrap}
      >
        <TextInput
          value={intentionText}
          onChangeText={onIntentionTextChange}
          placeholder={
            selectedQuality
              ? `In my relationship with ${partnerName.trim() || 'them'}, I choose ${selectedQuality.label.toLowerCase()}.`
              : 'Write your sankalpa here...'
          }
          placeholderTextColor={TEXT_MUTED}
          style={styles.intentionInput}
          multiline
          numberOfLines={3}
          maxLength={280}
          accessibilityLabel="Your intention"
        />
      </Animated.View>

      <View style={styles.cta}>
        <GoldenButton
          title="Seal My Compass"
          onPress={handleSeal}
          disabled={!selectedQuality}
          variant="divine"
        />
      </View>
    </View>
  );
}

export default DharmicIntentionChamber;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 18,
    alignItems: 'stretch',
  },
  title: {
    color: GOLD,
    fontFamily: 'CrimsonText-Italic',
    fontSize: 17,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  qualityCard: {
    width: '48%',
    minHeight: 110,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  qualitySanskrit: {
    fontSize: 18,
  },
  qualityLabel: {
    color: SACRED_WHITE,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  qualityDescription: {
    color: TEXT_MUTED,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  intentionWrap: {
    marginTop: 4,
  },
  intentionInput: {
    minHeight: 88,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(245, 240, 232, 0.65)',
    color: SACRED_WHITE,
    fontSize: 15,
    fontFamily: 'CrimsonText-Italic',
    textAlignVertical: 'top',
  },
  cta: {
    marginTop: 4,
  },
});
