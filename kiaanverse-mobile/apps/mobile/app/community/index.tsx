/**
 * Community Feed Screen
 *
 * Two-tab layout: Feed (posts from all circles) and Circles (grid of
 * wisdom circles). Supports pull-to-refresh and infinite scroll.
 * FAB navigates to the post composer.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Screen, Text, GoldenHeader, colors, spacing } from '@kiaanverse/ui';
import { useCommunityPosts, useCommunityCircles } from '@kiaanverse/api';
import type { CommunityPost, CommunityCircle } from '@kiaanverse/api';
import { PostCard } from '../../components/community/PostCard';
import { WisdomCircleCard } from '../../components/community/WisdomCircleCard';

type Tab = 'feed' | 'circles';

const GRID_COLUMNS = 2;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - CARD_GAP) / GRID_COLUMNS;

export default function CommunityScreen(): React.JSX.Element {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [refreshing, setRefreshing] = useState(false);

  const { data: posts, refetch: refetchPosts } = useCommunityPosts();

  const { data: circles, refetch: refetchCircles } = useCommunityCircles();

  const handleTabPress = useCallback((tab: Tab) => {
    void Haptics.selectionAsync();
    setActiveTab(tab);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'feed') {
      await refetchPosts();
    } else {
      await refetchCircles();
    }
    setRefreshing(false);
  }, [activeTab, refetchPosts, refetchCircles]);

  const handleFabPress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/community/compose');
  }, [router]);

  const handleCirclePress = useCallback(
    (circle: CommunityCircle) => {
      router.push(`/community/circles/${circle.id}`);
    },
    [router]
  );

  const renderPost = useCallback(
    ({ item }: { item: CommunityPost }) => <PostCard post={item} />,
    []
  );

  const renderCircle = useCallback(
    ({ item }: { item: CommunityCircle }) => (
      <WisdomCircleCard
        circle={item}
        onPress={handleCirclePress}
        width={CARD_WIDTH}
      />
    ),
    [handleCirclePress]
  );

  const postKeyExtractor = useCallback((item: CommunityPost) => item.id, []);
  const circleKeyExtractor = useCallback(
    (item: CommunityCircle) => item.id,
    []
  );

  const renderFeedEmpty = useCallback(
    () => (
      <Animated.View
        entering={FadeIn.duration(500)}
        style={styles.emptyContainer}
      >
        <Text variant="h2" align="center">
          {'🕊️'}
        </Text>
        <Text variant="body" color={colors.text.muted} align="center">
          The community awaits your first words of wisdom.
        </Text>
      </Animated.View>
    ),
    []
  );

  const renderCirclesEmpty = useCallback(
    () => (
      <Animated.View
        entering={FadeIn.duration(500)}
        style={styles.emptyContainer}
      >
        <Text variant="h2" align="center">
          {'🔮'}
        </Text>
        <Text variant="body" color={colors.text.muted} align="center">
          No wisdom circles available yet.{'\n'}Check back soon.
        </Text>
      </Animated.View>
    ),
    []
  );

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        tintColor={colors.primary[500]}
        colors={[colors.primary[500]]}
      />
    ),
    [refreshing, handleRefresh]
  );

  return (
    <Screen>
      <GoldenHeader title="Community" onBack={() => router.back()} />

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => handleTabPress('feed')}
          style={[styles.tab, activeTab === 'feed' && styles.tabActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'feed' }}
        >
          <Text
            variant="body"
            color={
              activeTab === 'feed' ? colors.primary[500] : colors.text.muted
            }
          >
            Feed
          </Text>
        </Pressable>
        <Pressable
          onPress={() => handleTabPress('circles')}
          style={[styles.tab, activeTab === 'circles' && styles.tabActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'circles' }}
        >
          <Text
            variant="body"
            color={
              activeTab === 'circles' ? colors.primary[500] : colors.text.muted
            }
          >
            Circles
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {activeTab === 'feed' ? (
        <FlatList
          data={posts ?? []}
          renderItem={renderPost}
          keyExtractor={postKeyExtractor}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderFeedEmpty}
          refreshControl={refreshControl}
        />
      ) : (
        <FlatList
          data={circles ?? []}
          renderItem={renderCircle}
          keyExtractor={circleKeyExtractor}
          numColumns={GRID_COLUMNS}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderCirclesEmpty}
          refreshControl={refreshControl}
        />
      )}

      {/* FAB — compose new post */}
      <Pressable
        onPress={handleFabPress}
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel="Compose new post"
      >
        <Text variant="h2" color={colors.background.dark} align="center">
          +
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.alpha.goldLight,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary[500],
  },
  feedContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.bottomInset,
    gap: spacing.sm,
  },
  gridContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.bottomInset,
    gap: CARD_GAP,
  },
  gridRow: {
    gap: CARD_GAP,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl,
    gap: spacing.md,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.divine.aura,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
