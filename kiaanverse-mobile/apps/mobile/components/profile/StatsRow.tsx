/**
 * StatsRow — three-column SacredCard with the seeker's key metrics.
 *
 *   [ 🔥 Streak ] │ [ ☸ Journeys ] │ [ 📖 Verses ]
 *
 * The number is rendered in CormorantGaramond-BoldItalic 36 px gold so
 * the stat reads as a sacred quantity rather than an analytics tile.
 * Vertical dividers use a gold-to-transparent gradient (the vertical
 * sibling of GoldenDivider) so the cells feel separated without
 * competing with the card's own gold top shimmer.
 */

import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SacredCard } from '@kiaanverse/ui';

const GOLD = '#D4A017';
const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(240,235,225,0.55)';

export interface StatsRowProps {
  readonly streakDays: number;
  readonly journeys: number;
  readonly verses: number;
  readonly style?: ViewStyle;
}

function StatsRowInner({
  streakDays,
  journeys,
  verses,
  style,
}: StatsRowProps): React.JSX.Element {
  return (
    <SacredCard style={[styles.card, style] as unknown as ViewStyle}>
      <View style={styles.row}>
        <Stat value={streakDays} label="Streak" unit="🔥" />
        <VerticalDivider />
        <Stat value={journeys} label="Journeys" unit="☸" />
        <VerticalDivider />
        <Stat value={verses} label="Verses" unit="📖" />
      </View>
    </SacredCard>
  );
}

function Stat({
  value,
  label,
  unit,
}: {
  readonly value: number;
  readonly label: string;
  readonly unit: string;
}): React.JSX.Element {
  return (
    <View
      style={styles.cell}
      accessibilityRole="text"
      accessibilityLabel={`${value} ${label}`}
    >
      <Text style={styles.number} allowFontScaling={false}>
        {value}
      </Text>
      <Text style={styles.unitLine} allowFontScaling={false}>
        <Text style={styles.unit}>{unit}</Text>
        <Text style={styles.label}>  {label}</Text>
      </Text>
    </View>
  );
}

function VerticalDivider(): React.JSX.Element {
  return (
    <View style={styles.divider} pointerEvents="none">
      <LinearGradient
        colors={[
          'rgba(212,160,23,0)',
          'rgba(212,160,23,0.35)',
          'rgba(212,160,23,0)',
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

/** Three-column stats card with gold gradient dividers. */
export const StatsRow = React.memo(StatsRowInner);

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 8,
  },
  number: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 36,
    color: GOLD,
    lineHeight: 40,
    letterSpacing: 0.4,
  },
  unitLine: {
    textAlign: 'center',
    marginTop: 2,
  },
  unit: {
    fontSize: 13,
    color: SACRED_WHITE,
  },
  label: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 0.6,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 8,
  },
});
