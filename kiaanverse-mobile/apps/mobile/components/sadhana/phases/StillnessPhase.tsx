/**
 * StillnessPhase — Phase 2 of Nitya Sadhana: dhyana / seated meditation.
 *
 * A single slow-rotating mandala fills the centre of a nearly-black
 * screen. The count-up timer starts at 00:00 and the "Complete Phase"
 * button only unlocks after a minimum 60 s sit — long enough to let the
 * user actually settle, short enough to respect real-world attention
 * spans on a daily practice.
 *
 * Typography:
 *   - "Settle into stillness" : CormorantGaramond-Italic 24 px.
 *   - Timer:                    CormorantGaramond-BoldItalic 56 px gold.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DivineButton, MandalaSpin } from '@kiaanverse/ui';

const SACRED_WHITE = '#F5F0E8';
const GOLD = '#D4A017';
const TEXT_MUTED = 'rgba(240,235,225,0.55)';
const MIN_SECONDS = 60;

export interface StillnessPhaseProps {
  readonly onComplete: () => void;
}

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function StillnessPhaseInner({ onComplete }: StillnessPhaseProps): React.JSX.Element {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const ready = seconds >= MIN_SECONDS;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleBlock}>
        <Text style={styles.phaseLabel} allowFontScaling={false}>
          PHASE II
        </Text>
        <Text style={styles.phaseName}>Stillness</Text>
        <Text style={styles.sanskrit} allowFontScaling={false}>
          ध्यान · Dhyana
        </Text>
      </View>

      <View style={styles.mandalaWrap} pointerEvents="none">
        <MandalaSpin size={240} speed="slow" color={GOLD} opacity={0.4} />
      </View>

      <View style={styles.centerCol}>
        <Text style={styles.prompt}>Settle into stillness</Text>
        <Text style={styles.timer} allowFontScaling={false}>
          {formatClock(seconds)}
        </Text>
        {ready ? (
          <Text style={styles.readyNote}>
            When the bell rings in your heart, continue.
          </Text>
        ) : (
          <Text style={styles.helper}>
            Remain for at least {MIN_SECONDS - seconds}s more
          </Text>
        )}
      </View>

      <View style={styles.cta}>
        <DivineButton
          title={ready ? 'Complete Phase' : 'Settling…'}
          variant="primary"
          onPress={onComplete}
          disabled={!ready}
        />
      </View>
    </View>
  );
}

/** Phase 2 — silent seated meditation with a slow mandala. */
export const StillnessPhase = React.memo(StillnessPhaseInner);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 24,
    gap: 12,
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
  mandalaWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCol: {
    alignItems: 'center',
    gap: 8,
  },
  prompt: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 24,
    color: SACRED_WHITE,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  timer: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 56,
    color: GOLD,
    letterSpacing: 1.5,
    lineHeight: 64,
  },
  helper: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    letterSpacing: 1,
  },
  readyNote: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  cta: {
    alignSelf: 'stretch',
  },
});
