/**
 * PostCard — Community post card with author info, content, tags, and reactions.
 *
 * Displays author name/avatar, post content, tag badges, and a reaction bar
 * with four reaction types (Namaste, Love, Inspired, Wisdom). Each reaction
 * is tappable to toggle. Time-ago format for post age.
 */

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, Badge, Avatar, colors, spacing } from '@kiaanverse/ui';
import { useReactToPost } from '@kiaanverse/api';
import type { CommunityPost } from '@kiaanverse/api';

const REACTIONS = [
  { key: 'namaste', emoji: '🙏', label: 'Namaste' },
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'inspired', emoji: '🌟', label: 'Inspired' },
  { key: 'wisdom', emoji: '💡', label: 'Wisdom' },
] as const;

export interface PostCardProps {
  /** The community post data to display */
  readonly post: CommunityPost;
}

/** Computes a human-readable time-ago string from an ISO timestamp */
function timeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function PostCardInner({ post }: PostCardProps): React.JSX.Element {
  const reactToPost = useReactToPost();

  const handleReaction = useCallback(
    (reactionKey: string) => {
      void Haptics.selectionAsync();
      reactToPost.mutate({ postId: post.id, reaction: reactionKey });
    },
    [reactToPost, post.id]
  );

  const postAge = useMemo(() => timeAgo(post.createdAt), [post.createdAt]);

  const visibleTags = post.tags.slice(0, 3);

  return (
    <View style={styles.card}>
      {/* Author Row */}
      <View style={styles.authorRow}>
        <Avatar name={post.authorName} uri={post.authorAvatar} size={36} />
        <View style={styles.authorInfo}>
          <Text
            variant="body"
            color={colors.text.primary}
            style={styles.authorName}
          >
            {post.authorName}
          </Text>
          <Text variant="caption" color={colors.text.muted}>
            {postAge}
          </Text>
        </View>
      </View>

      {/* Content */}
      <Text variant="body" color={colors.text.primary} style={styles.content}>
        {post.content}
      </Text>

      {/* Tags */}
      {visibleTags.length > 0 ? (
        <View style={styles.tagsRow}>
          {visibleTags.map((tag) => (
            <Badge key={tag} label={tag} />
          ))}
        </View>
      ) : null}

      {/* Reaction Bar */}
      <View style={styles.reactionBar}>
        {REACTIONS.map((reaction) => {
          return (
            <Pressable
              key={reaction.key}
              onPress={() => handleReaction(reaction.key)}
              style={[
                styles.reactionButton,
                post.userReacted && styles.reactionActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`React with ${reaction.label}`}
            >
              <Text variant="caption">{reaction.emoji}</Text>
              <Text variant="caption" color={colors.text.muted}>
                {reaction.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Meta: reactions + comments count */}
      {post.reactionsCount > 0 || post.commentsCount > 0 ? (
        <View style={styles.metaRow}>
          {post.reactionsCount > 0 ? (
            <Text variant="caption" color={colors.text.muted}>
              {post.reactionsCount} reaction
              {post.reactionsCount !== 1 ? 's' : ''}
            </Text>
          ) : null}
          {post.commentsCount > 0 ? (
            <Text variant="caption" color={colors.text.muted}>
              {post.commentsCount} comment{post.commentsCount !== 1 ? 's' : ''}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export const PostCard = React.memo(PostCardInner);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.alpha.goldLight,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontWeight: '600',
  },
  content: {
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
  },
  reactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.alpha.goldLight,
    paddingTop: spacing.sm,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: 16,
  },
  reactionActive: {
    backgroundColor: colors.alpha.goldLight,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
