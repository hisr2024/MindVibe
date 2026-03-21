/**
 * KarmaTree — SVG tree visualization showing spiritual progress.
 *
 * A tree grows from the bottom with trunk, branches, and leaf nodes.
 * Each node represents a journey milestone. Completed nodes bloom
 * with golden color; pending nodes are muted.
 *
 * Tap any node to navigate to that milestone.
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Line, Circle, G, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '../theme/useTheme';
import { spring } from '../tokens/motion';

/** A single node in the karma tree. */
export interface KarmaNode {
  /** Unique identifier for the node. */
  readonly id: string;
  /** Display label for the node. */
  readonly label: string;
  /** Whether this milestone has been achieved. */
  readonly completed: boolean;
}

/** Props for the KarmaTree component. */
export interface KarmaTreeProps {
  /** Flat list of milestone nodes (rendered as a vertical tree). */
  readonly nodes: ReadonlyArray<KarmaNode>;
  /** Called when a node is tapped. */
  readonly onNodePress: (id: string) => void;
  /** SVG viewBox width. @default 300 */
  readonly width?: number;
  /** SVG viewBox height. @default 400 */
  readonly height?: number;
  /** Optional container style. */
  readonly style?: ViewStyle;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const NODE_RADIUS = 18;
const TRUNK_X = 150;

/** Compute vertical positions for each node, evenly spaced. */
function layoutNodes(
  nodes: ReadonlyArray<KarmaNode>,
  height: number,
): ReadonlyArray<{ node: KarmaNode; x: number; y: number; index: number }> {
  const topPad = 50;
  const bottomPad = 60;
  const usable = height - topPad - bottomPad;
  const step = nodes.length > 1 ? usable / (nodes.length - 1) : 0;

  return nodes.map((node, i) => {
    // Alternate branches left and right of the trunk
    const offsetX = i % 2 === 0 ? -40 : 40;
    return {
      node,
      x: TRUNK_X + offsetX,
      y: height - bottomPad - step * i,
      index: i,
    };
  });
}

function AnimatedLeaf({
  cx,
  cy,
  completed,
  index,
  completedColor,
  pendingColor,
  borderColor,
}: {
  cx: number;
  cy: number;
  completed: boolean;
  index: number;
  completedColor: string;
  pendingColor: string;
  borderColor: string;
}): React.JSX.Element {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 100, withSpring(1, spring.bouncy));
  }, [scale, index]);

  const animatedProps = useAnimatedProps(() => ({
    r: NODE_RADIUS * scale.value,
  }));

  return (
    <AnimatedCircle
      cx={cx}
      cy={cy}
      animatedProps={animatedProps}
      fill={completed ? completedColor : pendingColor}
      stroke={completed ? completedColor : borderColor}
      strokeWidth={1.5}
    />
  );
}

function KarmaTreeInner({
  nodes,
  onNodePress,
  width = 300,
  height = 400,
  style,
  testID,
}: KarmaTreeProps): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const auraColor = theme.palette.divine.aura;

  const layout = useMemo(() => layoutNodes(nodes, height), [nodes, height]);

  const handlePress = useCallback(
    (id: string) => {
      onNodePress(id);
    },
    [onNodePress],
  );

  return (
    <View style={[styles.container, { width, height }, style]} testID={testID}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Trunk line */}
        {layout.length > 0 ? (
          <Line
            x1={TRUNK_X}
            y1={height - 40}
            x2={TRUNK_X}
            y2={(layout[0]?.y ?? 50) - NODE_RADIUS}
            stroke={c.accent}
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.4}
          />
        ) : null}

        {/* Branch lines connecting trunk to nodes */}
        {layout.map((item) => (
          <Line
            key={`branch-${item.node.id}`}
            x1={TRUNK_X}
            y1={item.y}
            x2={item.x}
            y2={item.y}
            stroke={item.node.completed ? auraColor : c.cardBorder}
            strokeWidth={2}
            strokeLinecap="round"
            opacity={item.node.completed ? 0.6 : 0.3}
          />
        ))}

        {/* Animated leaf nodes */}
        {layout.map((item) => (
          <G key={`node-${item.node.id}`}>
            <AnimatedLeaf
              cx={item.x}
              cy={item.y}
              completed={item.node.completed}
              index={item.index}
              completedColor={auraColor}
              pendingColor={c.surface}
              borderColor={c.cardBorder}
            />
            <SvgText
              x={item.x}
              y={item.y + 1}
              fontSize={10}
              textAnchor="middle"
              dominantBaseline="central"
              fill={item.node.completed ? c.background : c.textTertiary}
              fontWeight="600"
            >
              {item.node.completed ? '✓' : (item.index + 1).toString()}
            </SvgText>
          </G>
        ))}
      </Svg>

      {/* Pressable overlays + labels */}
      {layout.map((item) => (
        <Pressable
          key={`press-${item.node.id}`}
          onPress={() => handlePress(item.node.id)}
          style={[
            styles.hitArea,
            {
              left: item.x - NODE_RADIUS - 4,
              top: item.y - NODE_RADIUS - 4,
              width: (NODE_RADIUS + 4) * 2,
              height: (NODE_RADIUS + 4) * 2,
              borderRadius: NODE_RADIUS + 4,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${item.node.label} — ${item.node.completed ? 'completed' : 'pending'}`}
        />
      ))}

      {/* Node labels rendered as RN Text for better font support */}
      {layout.map((item) => {
        const labelLeft = item.x < TRUNK_X;
        return (
          <View
            key={`label-${item.node.id}`}
            style={[
              styles.labelContainer,
              {
                top: item.y - 8,
                left: labelLeft ? item.x - NODE_RADIUS - 90 : item.x + NODE_RADIUS + 8,
              },
            ]}
          >
            <Animated.Text
              style={[
                styles.labelText,
                {
                  color: item.node.completed ? c.accent : c.textTertiary,
                  textAlign: labelLeft ? 'right' : 'left',
                },
              ]}
              numberOfLines={1}
            >
              {item.node.label}
            </Animated.Text>
          </View>
        );
      })}
    </View>
  );
}

/** SVG tree showing spiritual progress with spring-animated leaf nodes. */
export const KarmaTree = React.memo(KarmaTreeInner);

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  hitArea: {
    position: 'absolute',
  },
  labelContainer: {
    position: 'absolute',
    width: 80,
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
