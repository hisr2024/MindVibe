/**
 * CompassAltarChamber — Chamber I (Altar)
 *
 * Entry to the Sambandha-Dharma compass:
 *   1. Animated CompassRose glyph + "सम्बन्ध धर्म / Relationship Compass" title.
 *   2. Horizontal scroller of 8 RELATIONSHIP_TYPES.
 *   3. Optional partner-name input (slides in once a type is picked).
 *   4. Tamas-Rajas-Sattva 3-step slider for the user's gut reading.
 *   5. "Open the Compass" CTA — disabled until a type is chosen.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GoldenButton } from '@kiaanverse/ui';

import {
  RELATIONSHIP_TYPES,
  type RelationshipTypeData,
} from '../data/relationshipTypes';
import { CompassRose } from '../components/CompassRose';
import type { GunaName } from '../hooks/useGunaCalculation';
import { ShankhaVoiceInput } from '../../../../voice/components/ShankhaVoiceInput';

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200, 191, 168, 0.65)';
const GOLD = '#E8B54A';
const CARD_BG = 'rgba(22, 26, 66, 0.6)';

const GUNA_STEPS: readonly {
  value: GunaName;
  sanskrit: string;
  label: string;
  color: string;
}[] = [
  { value: 'tamas', sanskrit: 'तमस्', label: 'Tamas', color: '#9CA3AF' },
  { value: 'rajas', sanskrit: 'रजस्', label: 'Rajas', color: '#E89B4A' },
  { value: 'sattva', sanskrit: 'सत्त्व', label: 'Sattva', color: GOLD },
];

export interface CompassAltarChamberProps {
  readonly relationshipType: RelationshipTypeData | null;
  readonly partnerName: string;
  readonly initialGunaReading: GunaName;
  readonly onRelationshipTypeChange: (type: RelationshipTypeData) => void;
  readonly onNameChange: (name: string) => void;
  readonly onGunaReadingChange: (reading: GunaName) => void;
  readonly onProceed: () => void;
}

export function CompassAltarChamber({
  relationshipType,
  partnerName,
  initialGunaReading,
  onRelationshipTypeChange,
  onNameChange,
  onGunaReadingChange,
  onProceed,
}: CompassAltarChamberProps): React.JSX.Element {
  const handleSelect = useCallback(
    (type: RelationshipTypeData) => {
      void Haptics.selectionAsync().catch(() => {});
      onRelationshipTypeChange(type);
    },
    [onRelationshipTypeChange]
  );

  const handleGunaPress = useCallback(
    (g: GunaName) => {
      void Haptics.selectionAsync().catch(() => {});
      onGunaReadingChange(g);
    },
    [onGunaReadingChange]
  );

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.heroBlock}>
        <CompassRose size={120} />
        <Animated.Text
          entering={FadeInUp.delay(500).duration(500)}
          style={styles.titleSanskrit}
        >
          सम्बन्ध धर्म
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(700).duration(500)}
          style={styles.titleEnglish}
        >
          Relationship Compass
        </Animated.Text>
      </Animated.View>

      <Animated.Text
        entering={FadeInUp.delay(900).duration(400)}
        style={styles.prompt}
      >
        Who are you bringing to the Compass?
      </Animated.Text>

      <Animated.View entering={FadeInDown.delay(1000).duration(400)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeRow}
        >
          {RELATIONSHIP_TYPES.map((type) => {
            const selected = relationshipType?.id === type.id;
            return (
              <Pressable
                key={type.id}
                accessibilityRole="button"
                accessibilityLabel={`${type.label} relationship`}
                accessibilityState={{ selected }}
                onPress={() => handleSelect(type)}
                style={[
                  styles.typeCard,
                  selected && {
                    borderColor: type.color,
                    borderWidth: 2,
                    shadowColor: type.color,
                    shadowOpacity: 0.45,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 8,
                  },
                ]}
              >
                <Text style={styles.typeSanskrit}>{type.sanskrit}</Text>
                <Text style={styles.typeLabel}>{type.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {relationshipType ? (
        <Animated.View
          entering={FadeInDown.duration(360)}
          style={styles.nameBlock}
        >
          <ShankhaVoiceInput
            value={partnerName}
            onChangeText={onNameChange}
            placeholder={`Their name (optional)`}
            style={styles.nameInput}
            maxLength={64}
            accessibilityLabel="Partner name"
            dictationMode="append"
            />
        </Animated.View>
      ) : null}

      {relationshipType ? (
        <Animated.View
          entering={FadeInDown.delay(120).duration(360)}
          style={styles.gunaBlock}
        >
          <Text style={styles.gunaPrompt}>
            How does this relationship feel right now?
          </Text>

          <View style={styles.gunaTrackWrap}>
            {GUNA_STEPS.map((g) => {
              const active = initialGunaReading === g.value;
              return (
                <Pressable
                  key={g.value}
                  onPress={() => handleGunaPress(g.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Set initial reading to ${g.label}`}
                  style={[
                    styles.gunaPill,
                    active && {
                      backgroundColor: `${g.color}33`,
                      borderColor: g.color,
                    },
                  ]}
                >
                  <Text style={[styles.gunaSanskrit, { color: g.color }]}>
                    {g.sanskrit}
                  </Text>
                  <Text
                    style={[
                      styles.gunaLabel,
                      active && { color: g.color, fontWeight: '600' },
                    ]}
                  >
                    {g.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      ) : null}

      <Animated.View
        entering={FadeInUp.delay(1100).duration(360)}
        style={styles.cta}
      >
        <GoldenButton
          title="Open the Compass"
          onPress={onProceed}
          disabled={!relationshipType}
          variant="divine"
        />
      </Animated.View>
    </View>
  );
}

export default CompassAltarChamber;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 18,
  },
  heroBlock: {
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  titleSanskrit: {
    fontFamily: 'CormorantGaramond-LightItalic',
    fontSize: 30,
    color: GOLD,
    letterSpacing: 1,
    marginTop: 8,
  },
  titleEnglish: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 14,
    color: TEXT_MUTED,
  },
  prompt: {
    textAlign: 'center',
    color: GOLD,
    fontFamily: 'CrimsonText-Italic',
    fontSize: 16,
    marginTop: 4,
  },
  typeRow: {
    paddingHorizontal: 4,
    gap: 10,
  },
  typeCard: {
    width: 86,
    height: 92,
    borderRadius: 16,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  typeSanskrit: {
    color: TEXT_MUTED,
    fontSize: 10,
    marginBottom: 6,
  },
  typeLabel: {
    color: SACRED_WHITE,
    fontSize: 13,
    fontWeight: '500',
  },
  nameBlock: {
    marginTop: 4,
  },
  nameInput: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.25)',
    color: SACRED_WHITE,
    fontSize: 16,
  },
  gunaBlock: {
    gap: 12,
  },
  gunaPrompt: {
    textAlign: 'center',
    color: TEXT_MUTED,
    fontFamily: 'CrimsonText-Italic',
    fontSize: 14,
  },
  gunaTrackWrap: {
    flexDirection: 'row',
    gap: 10,
  },
  gunaPill: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.18)',
  },
  gunaSanskrit: {
    fontSize: 14,
  },
  gunaLabel: {
    fontSize: 12,
    color: SACRED_WHITE,
  },
  cta: {
    marginTop: 8,
  },
});
