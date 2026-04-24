/**
 * ActionDharmaCards — Three practice cards for the next 24 hours.
 *
 * Each card shows a Sanskrit concept, its English meaning, a specific
 * practice, a Gita reference, and a circular commit toggle. Committed
 * practices bubble up to the parent so they can be POSTed with the
 * session-completion payload.
 *
 * Mirrors `app/(mobile)/m/karma-reset/components/ActionDharmaCards.tsx`.
 */

import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import type { KarmaWisdomActionDharma } from './types';

interface ActionDharmaCardsProps {
  actions: KarmaWisdomActionDharma[];
  onCommit?: (committedConcepts: string[]) => void;
}

function CardRow({
  action,
  index,
  isCommitted,
  onToggle,
}: {
  action: KarmaWisdomActionDharma;
  index: number;
  isCommitted: boolean;
  onToggle: () => void;
}): React.JSX.Element {
  const enter = useSharedValue(0);

  React.useEffect(() => {
    enter.value = withDelay(
      index * 150,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
    );
  }, [enter, index]);

  const style = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateX: (1 - enter.value) * -12 }],
  }));

  return (
    <Animated.View style={[styles.card, style]}>
      <View style={styles.textCol}>
        <View style={styles.conceptRow}>
          <Animated.Text style={styles.concept}>{action.concept}</Animated.Text>
          <Animated.Text style={styles.meaning}>
            ({action.meaning})
          </Animated.Text>
        </View>
        <Animated.Text style={styles.practice}>{action.practice}</Animated.Text>
        <Animated.Text style={styles.gitaRef}>{action.gitaRef}</Animated.Text>
      </View>

      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isCommitted }}
        accessibilityLabel={
          isCommitted ? 'Uncommit practice' : 'Commit to this practice'
        }
        style={[
          styles.toggle,
          {
            backgroundColor: isCommitted ? '#D4A017' : 'transparent',
            borderColor: isCommitted ? '#D4A017' : 'rgba(212,160,23,0.4)',
          },
        ]}
      >
        {isCommitted ? (
          <Svg width={12} height={12} viewBox="0 0 12 12">
            <Path
              d="M2 6L5 9L10 3"
              stroke="#050714"
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export function ActionDharmaCards({
  actions,
  onCommit,
}: ActionDharmaCardsProps): React.JSX.Element {
  const [committed, setCommitted] = useState<Set<number>>(new Set());

  const handleToggle = useCallback(
    (index: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCommitted((prev) => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        onCommit?.(actions.filter((_, i) => next.has(i)).map((a) => a.concept));
        return next;
      });
    },
    [actions, onCommit]
  );

  return (
    <View>
      <Animated.Text style={styles.heading}>Practices for Today</Animated.Text>
      <View style={styles.list}>
        {actions.map((action, i) => (
          <CardRow
            key={`${i}-${action.concept}`}
            action={action}
            index={i}
            isCommitted={committed.has(i)}
            onToggle={() => handleToggle(i)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 10,
    color: '#6B6355',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: 'rgba(17,20,53,0.98)',
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  textCol: {
    flex: 1,
  },
  conceptRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  concept: {
    fontStyle: 'italic',
    fontSize: 18,
    fontWeight: '500',
    color: '#F0C040',
  },
  meaning: {
    fontSize: 11,
    fontWeight: '300',
    color: '#6B6355',
  },
  practice: {
    fontSize: 13,
    color: '#F0EBE1',
    lineHeight: 20,
  },
  gitaRef: {
    fontSize: 10,
    color: '#D4A017',
    textAlign: 'right',
    marginTop: 6,
  },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
