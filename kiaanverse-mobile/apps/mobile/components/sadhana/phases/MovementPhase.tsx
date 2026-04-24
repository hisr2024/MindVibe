/**
 * MovementPhase — Phase 5 of Nitya Sadhana: gentle asana / movement.
 *
 * Presents a simple instruction card (Surya Namaskar suggested by
 * default) with a count-down timer. The "Complete Phase" button
 * unlocks either after the timer elapses OR via an explicit "Done
 * early" link — daily practice is respected, not enforced.
 */

import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DivineButton, SacredCard } from '@kiaanverse/ui';

const SACRED_WHITE = '#F5F0E8';
const GOLD = '#D4A017';
const TEXT_MUTED = 'rgba(240,235,225,0.6)';

const DEFAULT_DURATION_SEC = 180;

export interface MovementPhaseProps {
  /** Override the target duration in seconds. @default 180 */
  readonly durationSec?: number;
  readonly onComplete: () => void;
}

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function MovementPhaseInner({
  durationSec = DEFAULT_DURATION_SEC,
  onComplete,
}: MovementPhaseProps): React.JSX.Element {
  const [remaining, setRemaining] = useState(durationSec);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const ready = remaining === 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleBlock}>
        <Text style={styles.phaseLabel} allowFontScaling={false}>
          PHASE V
        </Text>
        <Text style={styles.phaseName}>Movement</Text>
        <Text style={styles.sanskrit} allowFontScaling={false}>
          आसन · Asana
        </Text>
      </View>

      <SacredCard style={styles.card}>
        <Text style={styles.cardTitle}>Surya Namaskar — Five Rounds</Text>
        <Text style={styles.cardBody}>
          Stand tall. Palms together at the heart. Move with the breath through
          five rounds of sun salutations. Let attention settle into the body —
          notice the warmth, the circulation, the return of the breath to its
          rhythm.
        </Text>
      </SacredCard>

      <View style={styles.timerBlock}>
        <Text style={styles.timerLabel}>Timer</Text>
        <Text style={styles.timer} allowFontScaling={false}>
          {formatClock(remaining)}
        </Text>
      </View>

      <View style={styles.cta}>
        <DivineButton
          title={ready ? 'Complete Phase' : 'Moving…'}
          variant="primary"
          onPress={onComplete}
          disabled={!ready}
        />
        {!ready ? (
          <Pressable
            onPress={onComplete}
            accessibilityRole="button"
            accessibilityLabel="I am done early"
            style={styles.earlyBtn}
          >
            <Text style={styles.earlyText}>I am done early</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** Phase 5 — gentle asana with a countdown timer. */
export const MovementPhase = React.memo(MovementPhaseInner);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 16,
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
  card: {
    gap: 8,
  },
  cardTitle: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 18,
    color: SACRED_WHITE,
  },
  cardBody: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 14,
    color: SACRED_WHITE,
    lineHeight: 22,
  },
  timerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  timerLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 1.4,
  },
  timer: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 56,
    color: GOLD,
    lineHeight: 64,
    letterSpacing: 1.5,
  },
  cta: {
    alignSelf: 'stretch',
    gap: 10,
  },
  earlyBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  earlyText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 12,
    color: TEXT_MUTED,
    letterSpacing: 0.4,
  },
});
