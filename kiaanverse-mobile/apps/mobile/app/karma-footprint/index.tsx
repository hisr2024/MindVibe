/**
 * Karma Footprint — Dashboard for karmic action tracking
 *
 * Displays total karma points, positive action count, growth areas,
 * ripple effects history, and recommended practices. Includes a
 * simple modal for logging new actions.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Text,
  Card,
  Input,
  GoldenButton,
  GoldenHeader,
  Badge,
  Divider,
  LoadingMandala,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useKarmaFootprint } from '@kiaanverse/api';

interface RippleEffect {
  action: string;
  impact: string;
  karma_points: number;
}

export default function KarmaFootprintScreen(): React.JSX.Element {
  const router = useRouter();
  const { data, isLoading } = useKarmaFootprint();
  const [showLogModal, setShowLogModal] = useState(false);
  const [newAction, setNewAction] = useState('');
  const [newImpact, setNewImpact] = useState('');

  const handleLogAction = useCallback(() => {
    if (!newAction.trim()) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewAction('');
    setNewImpact('');
    setShowLogModal(false);
  }, [newAction]);

  const handleOpenModal = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowLogModal(true);
  }, []);

  const renderRipple = useCallback(({ item, index }: { item: RippleEffect; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 60).duration(400)}>
      <Card style={styles.rippleCard}>
        <View style={styles.rippleHeader}>
          <Text variant="body" color={colors.text.primary} style={styles.rippleAction}>
            {item.action}
          </Text>
          <Text variant="caption" color={colors.primary[300]}>
            +{item.karma_points}
          </Text>
        </View>
        <Text variant="bodySmall" color={colors.text.secondary}>
          {item.impact}
        </Text>
      </Card>
    </Animated.View>
  ), []);

  if (isLoading) {
    return (
      <Screen>
        <GoldenHeader title="Karma Footprint" onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <LoadingMandala size={80} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <GoldenHeader title="Karma Footprint" onBack={() => router.back()} />

      <FlatList
        data={data?.ripple_effects ?? []}
        renderItem={renderRipple}
        keyExtractor={(_, index) => `ripple-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Text variant="body" color={colors.text.secondary} align="center">
              Your karmic ripples in the world
            </Text>

            {/* Total karma display */}
            <Animated.View entering={FadeInDown.duration(600)} style={styles.karmaDisplay}>
              <Text variant="caption" color={colors.text.muted} align="center">
                Total Karma
              </Text>
              <Text variant="h1" color={colors.divine.aura} align="center" style={styles.karmaNumber}>
                {data?.total_karma ?? 0}
              </Text>
              <Text variant="bodySmall" color={colors.primary[300]} align="center">
                {data?.positive_actions ?? 0} positive actions
              </Text>
            </Animated.View>

            {/* Areas of growth */}
            {data?.areas_of_growth && data.areas_of_growth.length > 0 ? (
              <Animated.View entering={FadeInDown.delay(200).duration(500)}>
                <Text variant="label" color={colors.text.muted} style={styles.sectionLabel}>
                  Areas of Growth
                </Text>
                <View style={styles.chipRow}>
                  {data.areas_of_growth.map((area) => (
                    <Badge key={area} label={area} />
                  ))}
                </View>
              </Animated.View>
            ) : null}

            {/* Gita guidance */}
            {data?.gita_guidance ? (
              <Animated.View entering={FadeInDown.delay(300).duration(500)}>
                <Card style={styles.guidanceCard}>
                  <Text variant="bodySmall" color={colors.primary[300]} style={styles.guidanceText}>
                    {data.gita_guidance}
                  </Text>
                </Card>
              </Animated.View>
            ) : null}

            <Divider />

            <Text variant="label" color={colors.text.muted} style={styles.sectionLabel}>
              Ripple Effects
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="body" color={colors.text.muted} align="center">
              Your karmic journey awaits.{'\n'}Log your first action below.
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footerContainer}>
            <GoldenButton title="Log New Action" onPress={handleOpenModal} />
          </View>
        }
      />

      {/* Log Action Modal */}
      <Modal visible={showLogModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowLogModal(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text variant="h3" color={colors.text.primary} align="center">
              Log Karmic Action
            </Text>
            <Input
              label="What did you do?"
              placeholder="Describe your action..."
              value={newAction}
              onChangeText={setNewAction}
              multiline
            />
            <Input
              label="What impact did it have?"
              placeholder="How did it affect others..."
              value={newImpact}
              onChangeText={setNewImpact}
              multiline
            />
            <GoldenButton
              title="Log Action"
              onPress={handleLogAction}
              disabled={!newAction.trim()}
            />
            <Pressable onPress={() => setShowLogModal(false)} style={styles.cancelButton}>
              <Text variant="body" color={colors.text.muted} align="center">
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  headerContent: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  karmaDisplay: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xxs,
  },
  karmaNumber: {
    fontSize: 56,
    lineHeight: 64,
  },
  sectionLabel: {
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  guidanceCard: {
    borderColor: colors.alpha.goldMedium,
    borderWidth: 1,
  },
  guidanceText: {
    lineHeight: 20,
    fontStyle: 'italic',
  },
  rippleCard: {
    gap: spacing.xs,
  },
  rippleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rippleAction: {
    flex: 1,
  },
  emptyContainer: {
    paddingVertical: spacing.xxl,
  },
  footerContainer: {
    paddingTop: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.alpha.blackHeavy,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
  },
});
