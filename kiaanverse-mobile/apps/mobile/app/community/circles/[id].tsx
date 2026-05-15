/**
 * Wisdom Circle Detail Screen
 *
 * Displays circle information (name, description, member count) and its
 * posts. Shows a "Join Circle" button for non-members. Pull-to-refresh
 * for the post list.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  Screen,
  Text,
  GoldenButton,
  GoldenHeader,
  Badge,
  Divider,
  colors,
  spacing,
} from '@kiaanverse/ui';
import {
  useCommunityCircles,
  useCommunityPosts,
  useJoinCircle,
} from '@kiaanverse/api';
import type { CommunityPost } from '@kiaanverse/api';
import { useTranslation } from '@kiaanverse/i18n';
import { PostCard } from '../../../components/community/PostCard';

export default function CircleDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('community');
  const { id } = useLocalSearchParams<{ id: string }>();
  const circleId = id ?? '';

  const { data: circles } = useCommunityCircles();
  const {
    data: posts,
    isLoading: postsLoading,
    refetch,
  } = useCommunityPosts(circleId);
  const joinCircle = useJoinCircle();

  const [refreshing, setRefreshing] = useState(false);

  /** Find circle from the cached circles list */
  const circle = useMemo(
    () => (circles ?? []).find((c) => c.id === circleId),
    [circles, circleId]
  );

  const handleJoin = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await joinCircle.mutateAsync(circleId);
    } catch {
      // Join failure is non-critical — user can retry
    }
  }, [joinCircle, circleId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderPost = useCallback(
    ({ item }: { item: CommunityPost }) => <PostCard post={item} />,
    []
  );

  const keyExtractor = useCallback((item: CommunityPost) => item.id, []);

  const renderEmpty = useCallback(
    () =>
      !postsLoading ? (
        <View style={styles.emptyContainer}>
          <Text variant="body" color={colors.text.muted} align="center">
            {t('circlePostsEmpty')}
          </Text>
        </View>
      ) : null,
    [postsLoading, t]
  );

  if (!circle) {
    return (
      <Screen>
        <GoldenHeader title={t('circleFallbackTitle')} onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary[500]} size="large" />
        </View>
      </Screen>
    );
  }

  const ListHeader = (
    <Animated.View entering={FadeIn.duration(400)} style={styles.headerSection}>
      {/* Circle icon / avatar placeholder */}
      <View style={styles.circleAvatar}>
        <Text variant="h1" align="center">
          {'🔮'}
        </Text>
      </View>

      <Text variant="h1" color={colors.text.primary} align="center">
        {circle.name}
      </Text>

      <Text variant="body" color={colors.text.secondary} align="center">
        {circle.description}
      </Text>

      <View style={styles.metaRow}>
        <Badge label={t('circleMembersFmt', { count: circle.memberCount })} />
        <Badge label={circle.category} />
      </View>

      {/* Join button for non-members */}
      {!circle.isJoined ? (
        <View style={styles.joinContainer}>
          <GoldenButton
            title={t('circleJoinButton')}
            onPress={handleJoin}
            loading={joinCircle.isPending}
            variant="divine"
          />
        </View>
      ) : (
        <View style={styles.joinedBadge}>
          <Text variant="caption" color={colors.semantic.success}>
            {t('circleJoinedBadge')}
          </Text>
        </View>
      )}

      <Divider />

      <Text
        variant="label"
        color={colors.text.secondary}
        style={styles.postsLabel}
      >
        {t('circlePostsLabel')}
      </Text>
    </Animated.View>
  );

  return (
    <Screen>
      <GoldenHeader title={circle.name} onBack={() => router.back()} />

      <FlatList
        data={posts ?? []}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.bottomInset,
    gap: spacing.sm,
  },
  headerSection: {
    gap: spacing.md,
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  circleAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.alpha.goldMedium,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  joinContainer: {
    width: '100%',
    paddingTop: spacing.xs,
  },
  joinedBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.alpha.goldLight,
  },
  postsLabel: {
    alignSelf: 'flex-start',
    paddingTop: spacing.xs,
  },
  emptyContainer: {
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
});
