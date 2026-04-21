/**
 * ArrivalPhase — Phase 1 of Nitya Sadhana: pranayama breathing.
 *
 * Uses the shared BreathingOrb with the classic 4-7-8 pattern (inhale
 * 4 s, hold 7 s, exhale 8 s, rest 0 s). The ceremony requires three
 * full cycles to complete (~57 s), after which the "Complete Phase"
 * button emerges. Until then the button reads "Breathing…" and is
 * disabled so the user cannot skip the contemplative rhythm.
 *
 * Typography:
 *   - Sanskrit instruction: NotoSansDevanagari 14 px DIVINE_GOLD.
 *   - Phase name: CormorantGaramond-Italic 24 px SACRED_WHITE.
 *   - Cycle counter: Outfit 12 px TEXT_MUTED.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BreathingOrb, DivineButton } from '@kiaanverse/ui';

const SACRED_WHITE = '#F5F0E8';
const GOLD = '#D4A017';
const TEXT_MUTED = 'rgba(240,235,225,0.6)';

const REQUIRED_CYCLES = 3;

/** 4-7-8 breathing pattern in milliseconds. */
const BREATH_478 = {
  inhale: 4_000,
  holdIn: 7_000,
  exhale: 8_000,
  holdOut: 0,
} as const;

export interface ArrivalPhaseProps {
  readonly onComplete: () => void;
}

function ArrivalPhaseInner({ onComplete }: ArrivalPhaseProps): React.JSX.Element {
  const [cycles, setCycles] = useState(0);
  const [active, setActive] = useState(true);

  const handleCycle = useCallback(() => {
    setCycles((prev) => prev + 1);
  }, []);

  const isReady = cycles >= REQUIRED_CYCLES;

  useEffect(() => {
    if (isReady) setActive(false);
  }, [isReady]);

  return (
    <View style={styles.wrap}>
      <View style={styles.titleBlock}>
        <Text style={styles.phaseLabel} allowFontScaling={false}>
          PHASE I
        </Text>
        <Text style={styles.phaseName}>Arrival</Text>
        <Text style={styles.sanskrit} allowFontScaling={false}>
          प्राणायाम · Pranayama
        </Text>
      </View>

      <View style={styles.orbWrap}>
        <BreathingOrb
          pattern={BREATH_478}
          isActive={active}
          size={220}
          onCycleComplete={handleCycle}
        />
      </View>

      <View style={styles.counterWrap}>
        <Text style={styles.counter}>
          Cycle {Math.min(cycles + (isReady ? 0 : 1), REQUIRED_CYCLES)} of{' '}
          {REQUIRED_CYCLES}
        </Text>
        <Text style={styles.helper}>
          4 in · 7 hold · 8 out
        </Text>
      </View>

      <View style={styles.cta}>
        <DivineButton
          title={isReady ? 'Complete Phase' : 'Breathing…'}
          variant="primary"
          onPress={onComplete}
          disabled={!isReady}
        />
      </View>
    </View>
  );
}

/** Phase 1 — 4-7-8 breathing for three cycles. */
export const ArrivalPhase = React.memo(ArrivalPhaseInner);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 24,
    gap: 20,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 4,
  },
  phaseLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 2,
  },
  phaseName: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 28,
    color: SACRED_WHITE,
    letterSpacing: 0.4,
  },
  sanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 14,
    lineHeight: 28,
    color: GOLD,
    textAlign: 'center',
  },
  orbWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterWrap: {
    alignItems: 'center',
    gap: 2,
  },
  counter: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 16,
    color: GOLD,
    letterSpacing: 0.4,
  },
  helper: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    letterSpacing: 1.2,
  },
  cta: {
    alignSelf: 'stretch',
  },
});
