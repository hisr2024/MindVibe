/**
 * PostCard — Community post display with reactions.
 */
import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, Card, Badge, colors, spacing } from '@kiaanverse/ui';
import { useReactToPost } from '@kiaanverse/api';

const REACTIONS = [
  { emoji: '🙏', label: 'namaste' },
  { emoji: '❤️', label: 'love' },
  { emoji: '🌟', label: 'inspired' },
  { emoji: '💡', label: 'wisdom' },
] as const;

interface Post {
  id: string;
  author_name: string;
  content: string;
  tags: string[];
  reactions: Record<string, number>;
  user_reaction?: string;
  created_at: string;
}

export interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps): React.JSX.Element {
  const reactToPost = useReactToPost();

  const handleReaction = useCallback((reaction: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reactToPost.mutate({ postId: post.id, reaction });
  }, [post.id, reactToPost]);

  const timeAgo = formatTimeAgo(post.created_at);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text variant="caption" color={colors.text.primary}>
            {post.author_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text variant="label">{post.author_name}</Text>
          <Text variant="caption" color={colors.text.muted}>{timeAgo}</Text>
        </View>
      </View>

      <Text variant="body" color={colors.text.primary}>{post.content}</Text>

      {post.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {post.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} label={tag} />
          ))}
        </View>
      )}

      <View style={styles.reactionsRow}>
        {REACTIONS.map(({ emoji, label }) => {
          const count = post.reactions[label] ?? 0;
          const isActive = post.user_reaction === label;
          return (
            <Pressable
              key={label}
              onPress={() => handleReaction(label)}
              style={[styles.reactionBtn, isActive && styles.reactionActive]}
            >
              <Text variant="caption">{emoji} {count > 0 ? count : ''}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, marginBottom: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.background.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.alpha.goldLight,
  },
  headerInfo: { flex: 1 },
  tagsRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  reactionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  reactionBtn: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2,
    borderRadius: 16, borderWidth: 1, borderColor: colors.alpha.whiteLight,
  },
  reactionActive: { borderColor: colors.primary[500], backgroundColor: colors.alpha.goldLight },
});
