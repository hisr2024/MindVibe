/**
 * GunaMirrorChamber — Chamber II (Guna Mirror)
 *
 * The user reflects on their relationship by:
 *   - (optional) typing a free-form situation (max 500 chars)
 *   - selecting from 24 pattern chips spread across 3 horizontally-paged
 *     panels (Tamas / Rajas / Sattva)
 *
 * Live guna score bars at the bottom show the energetic mix building up.
 * The "See Your Dharma Map" CTA is enabled once the user has selected
 * any pattern OR typed a situation.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GoldenButton } from '@kiaanverse/ui';

import { GUNA_PANELS, GUNA_PATTERNS, type GunaKey } from '../data/gunaPatterns';
import type { GunaScores, GunaSelections } from '../hooks/useGunaCalculation';

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200, 191, 168, 0.65)';
const GOLD = '#E8B54A';
const CARD_BG = 'rgba(22, 26, 66, 0.6)';

const MAX_QUERY_LEN = 500;

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface GunaMirrorChamberProps {
  readonly selectedPatterns: GunaSelections;
  readonly onTogglePattern: (guna: GunaKey, patternId: string) => void;
  readonly gunaScores: GunaScores;
  readonly customQuery: string;
  readonly onCustomQueryChange: (text: string) => void;
  readonly onProceed: () => void;
}

export function GunaMirrorChamber({
  selectedPatterns,
  onTogglePattern,
  gunaScores,
  customQuery,
  onCustomQueryChange,
  onProceed,
}: GunaMirrorChamberProps): React.JSX.Element {
  const scrollRef = useRef<ScrollView>(null);
  const [activePanel, setActivePanel] = useState(0);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setActivePanel((prev) => (prev === idx ? prev : idx));
    },
    []
  );

  const handleToggle = useCallback(
    (guna: GunaKey, patternId: string) => {
      void Haptics.selectionAsync().catch(() => {});
      onTogglePattern(guna, patternId);
    },
    [onTogglePattern]
  );

  const totalSelected =
    selectedPatterns.tamas.length +
    selectedPatterns.rajas.length +
    selectedPatterns.sattva.length;

  const ctaDisabled = totalSelected === 0 && customQuery.trim().length === 0;

  const dominantLabel =
    gunaScores.dominant === 'balanced'
      ? 'Balanced energy'
      : `Predominantly ${gunaScores.dominant}`;

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.queryBlock}>
        <Text style={styles.queryLabel}>
          Your situation <Text style={styles.queryLabelMuted}>(optional)</Text>
        </Text>
        <TextInput
          value={customQuery}
          onChangeText={(text) =>
            onCustomQueryChange(text.slice(0, MAX_QUERY_LEN))
          }
          placeholder="Describe your situation in your own words..."
          placeholderTextColor={TEXT_MUTED}
          multiline
          numberOfLines={3}
          style={styles.queryInput}
          maxLength={MAX_QUERY_LEN}
          accessibilityLabel="Describe your situation"
        />
        {customQuery.length > 0 ? (
          <Text style={styles.queryCount}>
            {customQuery.length}/{MAX_QUERY_LEN}
          </Text>
        ) : null}
      </Animated.View>

      <Text style={styles.divider}>Or select patterns you recognise</Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        style={styles.panelScroller}
      >
        {GUNA_PANELS.map((panel) => (
          <View key={panel.key} style={[styles.panel, { width: SCREEN_WIDTH }]}>
            <View style={[styles.panelHeader, { backgroundColor: panel.tint }]}>
              <Text style={[styles.panelTitle, { color: panel.color }]}>
                {panel.sanskrit} — {panel.label}
              </Text>
              <Text style={styles.panelSubtext}>{panel.subtext}</Text>
            </View>

            <View style={styles.chipWrap}>
              {GUNA_PATTERNS[panel.key].map((pattern) => {
                const isSelected = selectedPatterns[panel.key].includes(
                  pattern.id
                );
                return (
                  <Pressable
                    key={pattern.id}
                    accessibilityRole="button"
                    accessibilityLabel={pattern.text}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => handleToggle(panel.key, pattern.id)}
                    style={[
                      styles.chip,
                      isSelected && {
                        backgroundColor: panel.tint,
                        borderColor: panel.color,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        isSelected && { color: panel.color },
                      ]}
                      numberOfLines={1}
                    >
                      {pattern.shortLabel}
                    </Text>
                    <Text
                      style={[
                        styles.chipSanskrit,
                        isSelected && { color: panel.color },
                      ]}
                    >
                      {pattern.sanskrit}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {GUNA_PANELS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activePanel ? styles.dotActive : styles.dotIdle,
            ]}
          />
        ))}
      </View>

      <Animated.View
        entering={FadeInDown.duration(360)}
        style={styles.scoreBlock}
      >
        {GUNA_PANELS.map((panel) => (
          <View key={panel.key} style={styles.scoreRow}>
            <Text style={[styles.scoreLabel, { color: panel.color }]}>
              {panel.label}
            </Text>
            <View style={styles.scoreTrack}>
              <View
                style={[
                  styles.scoreFill,
                  {
                    backgroundColor: panel.color,
                    width: `${(gunaScores[panel.key] ?? 0) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        ))}
        <Text style={styles.dominantLabel}>{dominantLabel}</Text>
      </Animated.View>

      <View style={styles.cta}>
        <GoldenButton
          title="Get Your Dharma Map"
          onPress={onProceed}
          disabled={ctaDisabled}
          variant="divine"
        />
      </View>
    </View>
  );
}

export default GunaMirrorChamber;

const styles = StyleSheet.create({
  root: {
    paddingBottom: 32,
    gap: 14,
  },
  queryBlock: {
    paddingHorizontal: 20,
    gap: 6,
  },
  queryLabel: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '500',
  },
  queryLabelMuted: {
    color: TEXT_MUTED,
    fontWeight: '400',
  },
  queryInput: {
    minHeight: 84,
    borderRadius: 14,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: SACRED_WHITE,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  queryCount: {
    color: TEXT_MUTED,
    fontSize: 11,
    textAlign: 'right',
  },
  divider: {
    paddingHorizontal: 20,
    color: GOLD,
    fontSize: 13,
    fontWeight: '500',
  },
  panelScroller: {
    marginHorizontal: 0,
  },
  panel: {
    paddingHorizontal: 20,
    gap: 12,
  },
  panelHeader: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  panelSubtext: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.18)',
  },
  chipLabel: {
    color: SACRED_WHITE,
    fontSize: 12,
  },
  chipSanskrit: {
    color: TEXT_MUTED,
    fontSize: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: { backgroundColor: GOLD },
  dotIdle: { backgroundColor: 'rgba(200, 191, 168, 0.32)' },
  scoreBlock: {
    paddingHorizontal: 20,
    gap: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scoreLabel: {
    width: 56,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '600',
  },
  scoreTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 3,
  },
  dominantLabel: {
    color: TEXT_MUTED,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  cta: {
    paddingHorizontal: 20,
  },
});
