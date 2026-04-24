/**
 * JournalEntryCard — Card component for journal list items.
 *
 * Renders date, title preview, mood badge, tag chips, and encrypted indicator.
 * Includes a subtle golden left border accent and press-in scale animation.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Text, Badge, colors, spacing } from '@kiaanverse/ui';
import type { JournalEntry } from '@kiaanverse/api';

const MOOD_EMOJI_MAP: Record<string, string> = {
  heavy: '😔',
  unsettled: '😕',
  neutral: '😐',
  peaceful: '🙂',
  blissful: '😊',
};

/** Maximum number of tag chips to display before truncating */
const MAX_VISIBLE_TAGS = 3;

export interface JournalEntryCardProps {
  /** The journal entry data to display */
  readonly entry: JournalEntry;
  /** Callback when the card is pressed, receives the entry */
  readonly onPress: (entry: JournalEntry) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function JournalEntryCardInner({
  entry,
  onPress,
}: JournalEntryCardProps): React.JSX.Element {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [scale]);

  const handlePress = useCallback(() => {
    onPress(entry);
  }, [entry, onPress]);

  const moodEmoji = entry.mood_tag ? MOOD_EMOJI_MAP[entry.mood_tag] : null;

  // Separate mood tag from other tags for display
  const displayTags = entry.tags.filter(
    (tag) => !Object.keys(MOOD_EMOJI_MAP).includes(tag)
  );
  const visibleTags = displayTags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenCount = displayTags.length - MAX_VISIBLE_TAGS;

  const title = entry.title ?? entry.content_preview ?? 'Untitled reflection';

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`Journal entry: ${title}`}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        {/* Golden left border accent */}
        <View style={styles.goldAccent} />

        <View style={styles.content}>
          {/* Date */}
          <Text variant="caption" color={colors.text.muted}>
            {formatDate(entry.created_at)}
          </Text>

          {/* Title / Preview */}
          <Text
            variant="body"
            color={colors.text.primary}
            numberOfLines={2}
            style={styles.title}
          >
            {title}
          </Text>

          {/* Tags row: mood badge + tag chips + lock icon */}
          <View style={styles.tagsRow}>
            {moodEmoji ? (
              <View style={styles.moodBadge}>
                <Text variant="caption">{moodEmoji}</Text>
                <Text variant="caption" color={colors.text.secondary}>
                  {entry.mood_tag}
                </Text>
              </View>
            ) : null}

            {visibleTags.map((tag) => (
              <Badge key={tag} label={tag} />
            ))}

            {hiddenCount > 0 ? (
              <Text variant="caption" color={colors.text.muted}>
                +{hiddenCount}
              </Text>
            ) : null}

            {/* Encrypted lock icon */}
            <View style={styles.lockContainer}>
              <Text variant="caption" color={colors.text.muted}>
                {'🔒'}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export const JournalEntryCard = React.memo(JournalEntryCardInner);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.alpha.goldLight,
  },
  goldAccent: {
    width: 4,
    backgroundColor: colors.primary[500],
  },
  content: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xxs,
  },
  title: {
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.alpha.goldLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 12,
  },
  lockContainer: {
    marginLeft: 'auto',
  },
});
