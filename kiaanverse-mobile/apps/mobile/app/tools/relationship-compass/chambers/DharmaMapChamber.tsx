/**
 * DharmaMapChamber — Chamber III (Dharma Map)
 *
 * Renders the 8-axis radar with the user's computed dharma values.
 * Below the chart, a single sentence highlights the strongest and
 * weakest axes ("strong trust but diminished honesty"). The CTA
 * advances to the Gita-Counsel chamber, which kicks off the API call.
 */

import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GoldenButton } from '@kiaanverse/ui';

import { DHARMA_AXES } from '../data/dharmaAxes';
import { DharmaRadar } from '../components/DharmaRadar';
import type { GunaName } from '../hooks/useGunaCalculation';

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200, 191, 168, 0.65)';

export interface DharmaMapChamberProps {
  readonly dharmaValues: Readonly<Record<string, number>>;
  readonly dominantGuna: GunaName;
  readonly partnerName: string;
  readonly onProceed: () => void;
}

export function DharmaMapChamber({
  dharmaValues,
  dominantGuna,
  partnerName,
  onProceed,
}: DharmaMapChamberProps): React.JSX.Element {
  const interpretation = useMemo(() => {
    const ranked = DHARMA_AXES.map((axis) => ({
      axis,
      value: dharmaValues[axis.id] ?? 0.5,
    })).sort((a, b) => b.value - a.value);

    const highestAxis = ranked[0]?.axis ?? DHARMA_AXES[0];
    const lowestAxis =
      ranked[ranked.length - 1]?.axis ?? DHARMA_AXES[DHARMA_AXES.length - 1];
    if (!highestAxis || !lowestAxis) return '';
    const nameLabel = partnerName.trim() ? `with ${partnerName.trim()} ` : '';
    return `Your relationship ${nameLabel}shows strong ${highestAxis.label.toLowerCase()} (${highestAxis.sanskrit}) but diminished ${lowestAxis.label.toLowerCase()} (${lowestAxis.sanskrit}).`;
  }, [dharmaValues, partnerName]);

  const screenWidth = Dimensions.get('window').width;
  const radarSize = Math.min(360, screenWidth - 16);

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.radarWrap}>
        <DharmaRadar
          dharmaValues={dharmaValues}
          dominantGuna={dominantGuna}
          size={radarSize}
        />
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(800).duration(400)}
        style={styles.interpretation}
      >
        {interpretation}
      </Animated.Text>

      <View style={styles.cta}>
        <GoldenButton
          title="Receive the Gita's Wisdom"
          onPress={onProceed}
          variant="divine"
        />
      </View>
    </View>
  );
}

export default DharmaMapChamber;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 18,
  },
  radarWrap: {
    alignItems: 'center',
    marginTop: 4,
  },
  interpretation: {
    color: SACRED_WHITE,
    fontFamily: 'CrimsonText-Italic',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  // unused – kept exported for future spacing tweaks
  helper: {
    color: TEXT_MUTED,
    fontSize: 12,
    textAlign: 'center',
  },
  cta: {
    marginTop: 4,
  },
});
