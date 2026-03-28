/**
 * WisdomCircleCard — Grid card for community circles.
 */
import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Text, Card, Badge, colors, spacing } from '@kiaanverse/ui';

interface Circle {
  id: string;
  name: string;
  description: string;
  member_count: number;
  is_joined: boolean;
}

export interface WisdomCircleCardProps {
  circle: Circle;
  onPress: () => void;
}

export function WisdomCircleCard({ circle, onPress }: WisdomCircleCardProps): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <Card style={[styles.card, circle.is_joined && styles.joinedCard]}>
        <Text variant="h3" align="center">🕉️</Text>
        <Text variant="label" numberOfLines={1}>{circle.name}</Text>
        <Text variant="caption" color={colors.text.muted} numberOfLines={2}>{circle.description}</Text>
        <Badge label={`${circle.member_count} members`} />
        {circle.is_joined && (
          <Text variant="caption" color={colors.primary[300]}>Joined</Text>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, maxWidth: '50%' },
  card: { gap: spacing.xs, alignItems: 'center', paddingVertical: spacing.md },
  joinedCard: { borderWidth: 1, borderColor: colors.alpha.goldLight },
});
