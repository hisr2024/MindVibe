/**
 * Wisdom Rooms — Guided Discussion Room List
 *
 * Displays available wisdom rooms with topic, host, participant count,
 * and active status indicator. Each room card has a "Join" button that
 * navigates to the room chat. Supports pull-to-refresh.
 */

import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Text,
  Card,
  GoldenHeader,
  GoldenButton,
  Badge,
  LoadingMandala,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useWisdomRooms, type WisdomRoom } from '@kiaanverse/api';

export default function WisdomRoomsListScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: rooms, isLoading, refetch, isRefetching } = useWisdomRooms();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleJoin = useCallback(
    (roomId: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(`/wisdom-rooms/${roomId}`);
    },
    [router],
  );

  const renderRoom = useCallback(
    ({ item, index }: { item: WisdomRoom; index: number }) => (
      <Animated.View entering={FadeInUp.delay(index * 80).duration(400)}>
        <Card style={styles.roomCard}>
          <View style={styles.roomHeader}>
            <View style={styles.roomTitleRow}>
              {item.isActive ? <View style={styles.activeDot} /> : null}
              <Text variant="label" color={colors.text.primary} numberOfLines={1} style={styles.roomName}>
                {item.topic}
              </Text>
            </View>
            <Badge label={`${item.participantCount} joined`} />
          </View>

          {item.description ? (
            <Text variant="bodySmall" color={colors.text.secondary} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.roomFooter}>
            <Text variant="caption" color={colors.text.muted}>
              Host: {item.hostName}
            </Text>
            <GoldenButton
              title="Join"
              onPress={() => handleJoin(item.id)}
              style={styles.joinButton}
              variant="divine"
            />
          </View>
        </Card>
      </Animated.View>
    ),
    [handleJoin],
  );

  const keyExtractor = useCallback((item: WisdomRoom) => item.id, []);

  if (isLoading && !rooms) {
    return (
      <Screen>
        <GoldenHeader title="Wisdom Rooms" onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <LoadingMandala size={60} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <GoldenHeader title="Wisdom Rooms" onBack={() => router.back()} />

      <Text variant="body" color={colors.text.secondary} align="center" style={styles.subtitle}>
        Join guided discussions
      </Text>

      <FlatList
        data={rooms ?? []}
        renderItem={renderRoom}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="body" color={colors.text.muted} align="center">
              No active wisdom rooms right now.{'\n'}Pull down to refresh.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.bottomInset,
    gap: spacing.md,
  },
  roomCard: {
    gap: spacing.sm,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    marginRight: spacing.sm,
  },
  roomName: {
    flex: 1,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.semantic.success,
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  joinButton: {
    paddingHorizontal: spacing.md,
    minWidth: 80,
  },
  emptyContainer: {
    paddingVertical: spacing.xxl,
  },
});
