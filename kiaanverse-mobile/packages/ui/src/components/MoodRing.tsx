/**
 * MoodRing — Circular SVG mood selector with 8 spiritual states.
 *
 * Eight moods arranged around a golden circle. Tapping a mood selects it
 * and animates the highlight ring to that position with a spring.
 *
 * Moods: Joy, Peace, Anger, Sadness, Fear, Love, Gratitude, Confusion
 */

import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../theme/useTheme';
import { spring } from '../tokens/motion';
import { Text } from './Text';

/** Available mood identifiers. */
export type Mood =
  | 'joy'
  | 'peace'
  | 'anger'
  | 'sadness'
  | 'fear'
  | 'love'
  | 'gratitude'
  | 'confusion';

/** Static mood definitions with emoji and display label. */
const MOOD_CONFIG: ReadonlyArray<{ readonly id: Mood; readonly emoji: string; readonly label: string }> = [
  { id: 'joy', emoji: '😊', label: 'Joy' },
  { id: 'peace', emoji: '🕊️', label: 'Peace' },
  { id: 'anger', emoji: '🔥', label: 'Anger' },
  { id: 'sadness', emoji: '🌧️', label: 'Sadness' },
  { id: 'fear', emoji: '😰', label: 'Fear' },
  { id: 'love', emoji: '💛', label: 'Love' },
  { id: 'gratitude', emoji: '🙏', label: 'Gratitude' },
  { id: 'confusion', emoji: '🌀', label: 'Confusion' },
] as const;

/** Props for the MoodRing component. */
export interface MoodRingProps {
  /** Currently selected mood. */
  readonly selectedMood?: Mood;
  /** Called when the user taps a mood sector. */
  readonly onMoodSelect: (mood: Mood) => void;
  /** Diameter of the ring in points. @default 280 */
  readonly size?: number;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function getMoodIndex(mood: Mood | undefined): number {
  if (mood === undefined) return -1;
  return MOOD_CONFIG.findIndex((m) => m.id === mood);
}

function MoodRingInner({
  selectedMood,
  onMoodSelect,
  size = 280,
  testID,
}: MoodRingProps): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const auraColor = theme.palette.divine.aura;

  const centerX = size / 2;
  const centerY = size / 2;
  const ringRadius = size / 2 - 40;
  const nodeRadius = 22;
  const highlightRadius = nodeRadius + 6;

  // Animated highlight position
  const highlightAngle = useSharedValue(
    getMoodIndex(selectedMood) >= 0
      ? (getMoodIndex(selectedMood) / MOOD_CONFIG.length) * Math.PI * 2 - Math.PI / 2
      : -Math.PI / 2,
  );

  const highlightProps = useAnimatedProps(() => {
    const x = centerX + ringRadius * Math.cos(highlightAngle.value);
    const y = centerY + ringRadius * Math.sin(highlightAngle.value);
    return { cx: x, cy: y };
  });

  const handleSelect = useCallback(
    (mood: Mood, index: number) => {
      const angle = (index / MOOD_CONFIG.length) * Math.PI * 2 - Math.PI / 2;
      highlightAngle.value = withSpring(angle, spring.default);
      onMoodSelect(mood);
    },
    [highlightAngle, onMoodSelect],
  );

  const moodNodes = useMemo(() => {
    return MOOD_CONFIG.map((mood, i) => {
      const angle = (i / MOOD_CONFIG.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + ringRadius * Math.cos(angle);
      const y = centerY + ringRadius * Math.sin(angle);
      const isSelected = selectedMood === mood.id;

      return { ...mood, x, y, angle, index: i, isSelected };
    });
  }, [centerX, centerY, ringRadius, selectedMood]);

  return (
    <View style={[styles.container, { width: size, height: size }]} testID={testID}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={ringRadius}
          stroke={c.cardBorder}
          strokeWidth={1}
          fill="none"
        />

        {/* Animated golden highlight circle */}
        {selectedMood !== undefined ? (
          <AnimatedCircle
            animatedProps={highlightProps}
            r={highlightRadius}
            fill="none"
            stroke={auraColor}
            strokeWidth={2.5}
          />
        ) : null}

        {/* Mood node backgrounds */}
        {moodNodes.map((mood) => (
          <G key={mood.id}>
            <Circle
              cx={mood.x}
              cy={mood.y}
              r={nodeRadius}
              fill={mood.isSelected ? theme.palette.alpha.goldMedium : c.surface}
              stroke={mood.isSelected ? auraColor : c.cardBorder}
              strokeWidth={mood.isSelected ? 1.5 : 0.5}
            />
            <SvgText
              x={mood.x}
              y={mood.y + 1}
              fontSize={20}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {mood.emoji}
            </SvgText>
          </G>
        ))}
      </Svg>

      {/* Pressable hit areas overlaid on SVG */}
      {moodNodes.map((mood) => (
        <Pressable
          key={mood.id}
          onPress={() => handleSelect(mood.id, mood.index)}
          style={[
            styles.hitArea,
            {
              left: mood.x - nodeRadius - 4,
              top: mood.y - nodeRadius - 4,
              width: (nodeRadius + 4) * 2,
              height: (nodeRadius + 4) * 2,
              borderRadius: nodeRadius + 4,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Select mood: ${mood.label}`}
          accessibilityState={{ selected: mood.isSelected }}
        />
      ))}

      {/* Labels outside the SVG for better text rendering */}
      {moodNodes.map((mood) => {
        const labelAngle = (mood.index / MOOD_CONFIG.length) * Math.PI * 2 - Math.PI / 2;
        const labelR = ringRadius + 30;
        const lx = centerX + labelR * Math.cos(labelAngle);
        const ly = centerY + labelR * Math.sin(labelAngle);

        return (
          <Text
            key={`label-${mood.id}`}
            variant="caption"
            color={mood.isSelected ? c.accent : c.textTertiary}
            style={[
              styles.label,
              {
                left: lx - 30,
                top: ly - 8,
              },
            ]}
            align="center"
          >
            {mood.label}
          </Text>
        );
      })}
    </View>
  );
}

/** Circular SVG mood selector with 8 spiritual states and animated golden highlight. */
export const MoodRing = React.memo(MoodRingInner);

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  hitArea: {
    position: 'absolute',
  },
  label: {
    position: 'absolute',
    width: 60,
  },
});
