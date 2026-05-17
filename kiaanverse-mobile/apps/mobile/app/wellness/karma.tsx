/**
 * Karma Tree Screen
 *
 * SVG tree that grows as user completes practices.
 * Each node = completed practice / wisdom absorbed.
 * 5 tree levels: Seed → Sapling → Young Tree → Mighty Tree → Sacred Tree
 * Tap nodes → linked wisdom/action.
 * Spring animation on new node addition.
 */

import React, { useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Sprout, Award } from 'lucide-react-native';
import {
  Screen,
  Text,
  GoldenHeader,
  KarmaTree,
  LoadingMandala,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useTheme } from '@kiaanverse/ui';
import type { KarmaNode } from '@kiaanverse/ui';
import {
  useKarmaTree,
  type KarmaNodeData,
  type KarmaTreeLevel,
} from '@kiaanverse/api';
import { useTranslation } from '@kiaanverse/i18n';

// ---------------------------------------------------------------------------
// Tree Level Config
// ---------------------------------------------------------------------------

// `id` is the canonical level identifier (matches `KarmaTreeLevel`). The
// human-readable `name` + `description` resolve at render via t() from the
// `karmaLevel*Name` / `karmaLevel*Desc` key pair.
interface TreeLevelInfo {
  readonly id: 'seed' | 'sapling' | 'young_tree' | 'mighty_tree' | 'sacred_tree';
  readonly nameKey: string;
  readonly descKey: string;
  readonly emoji: string;
  readonly minPoints: number;
}

const TREE_LEVELS: readonly TreeLevelInfo[] = [
  { id: 'seed', nameKey: 'karmaLevelSeedName', descKey: 'karmaLevelSeedDesc', emoji: '🌱', minPoints: 0 },
  { id: 'sapling', nameKey: 'karmaLevelSaplingName', descKey: 'karmaLevelSaplingDesc', emoji: '🌿', minPoints: 10 },
  { id: 'young_tree', nameKey: 'karmaLevelYoungTreeName', descKey: 'karmaLevelYoungTreeDesc', emoji: '🌳', minPoints: 30 },
  { id: 'mighty_tree', nameKey: 'karmaLevelMightyTreeName', descKey: 'karmaLevelMightyTreeDesc', emoji: '🏔️', minPoints: 60 },
  { id: 'sacred_tree', nameKey: 'karmaLevelSacredTreeName', descKey: 'karmaLevelSacredTreeDesc', emoji: '✨', minPoints: 100 },
] as const;

const LEVEL_TO_INDEX: Record<KarmaTreeLevel, number> = {
  seed: 0,
  sapling: 1,
  young_tree: 2,
  mighty_tree: 3,
  sacred_tree: 4,
};

function getLevelInfo(level: KarmaTreeLevel): TreeLevelInfo {
  const info = TREE_LEVELS[LEVEL_TO_INDEX[level]];
  return info !== undefined ? info : (TREE_LEVELS[0] as TreeLevelInfo);
}

function getNextLevel(level: KarmaTreeLevel): TreeLevelInfo | null {
  const idx = LEVEL_TO_INDEX[level];
  if (idx < TREE_LEVELS.length - 1) {
    const next = TREE_LEVELS[idx + 1];
    return next !== undefined ? next : null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Level Progress Bar
// ---------------------------------------------------------------------------

function LevelProgress({
  level,
  totalPoints,
}: {
  level: KarmaTreeLevel;
  totalPoints: number;
}): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation('wellness');
  const current = getLevelInfo(level);
  const next = getNextLevel(level);

  const progress = next
    ? Math.min(
        ((totalPoints - current.minPoints) /
          (next.minPoints - current.minPoints)) *
          100,
        100
      )
    : 100;

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <View
        style={[
          styles.levelCard,
          { backgroundColor: c.card, borderColor: c.cardBorder },
        ]}
      >
        <View style={styles.levelHeader}>
          <Text variant="h2">{current.emoji}</Text>
          <View style={styles.levelText}>
            <Text variant="label" color={c.textPrimary}>
              {t(current.nameKey)}
            </Text>
            <Text variant="caption" color={c.textSecondary}>
              {t(current.descKey)}
            </Text>
          </View>
        </View>

        {/* Points */}
        <View style={styles.pointsRow}>
          <Award size={14} color={colors.primary[300]} />
          <Text variant="label" color={colors.primary[300]}>
            {t('karmaPointsFmt', { count: String(totalPoints) })}
          </Text>
        </View>

        {/* Progress bar */}
        {next ? (
          <View style={styles.progressSection}>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: colors.alpha.whiteLight },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: colors.primary[500],
                  },
                ]}
              />
            </View>
            <Text variant="caption" color={c.textTertiary}>
              {t('karmaPointsToNextFmt', {
                count: String(next.minPoints - totalPoints),
                emoji: next.emoji,
                name: t(next.nameKey),
              })}
            </Text>
          </View>
        ) : (
          <Text variant="caption" color={colors.primary[300]}>
            {t('karmaMaxLevelMessage')}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Node Detail Modal (inline)
// ---------------------------------------------------------------------------

function NodeDetail({
  node,
  onClose,
}: {
  node: KarmaNodeData;
  onClose: () => void;
}): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { t } = useTranslation('wellness');

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <View
        style={[
          styles.nodeDetail,
          { backgroundColor: c.card, borderColor: colors.primary[500] },
        ]}
      >
        <View style={styles.nodeDetailHeader}>
          <Text variant="label" color={c.textPrimary}>
            {node.label}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityLabel={t('karmaCloseDetailA11y')}
          >
            <Text variant="caption" color={c.textTertiary}>
              {t('karmaCloseButton')}
            </Text>
          </Pressable>
        </View>

        <Text variant="bodySmall" color={c.textSecondary}>
          {node.action}
        </Text>

        <View style={styles.nodePointsRow}>
          <Award size={12} color={colors.primary[300]} />
          <Text variant="caption" color={colors.primary[300]}>
            {t('karmaPointsAddFmt', { count: String(node.points) })}
          </Text>
          {node.completed ? (
            <Text variant="caption" color={colors.semantic.success}>
              {t('karmaStatusCompleted')}
            </Text>
          ) : (
            <Text variant="caption" color={c.textTertiary}>
              {t('karmaStatusPending')}
            </Text>
          )}
        </View>

        {node.linkedWisdom ? (
          <Pressable
            onPress={() => {
              const parts = node.linkedWisdom?.split('.') ?? [];
              if (parts.length === 2) {
                router.push(`/(tabs)/shlokas/${parts[0]}/${parts[1]}`);
              }
              onClose();
            }}
            accessibilityLabel={t('karmaReadWisdomA11y')}
          >
            <Text variant="caption" color={colors.primary[300]}>
              {t('karmaReadWisdomFmt', { ref: node.linkedWisdom })}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function KarmaTreeScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const { t } = useTranslation('wellness');

  const { data, isLoading, error } = useKarmaTree();
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(
    null
  );

  // Transform KarmaNodeData to KarmaNode for the UI component
  const nodes = data?.nodes;
  const treeNodes: KarmaNode[] = useMemo(() => {
    if (!nodes) return [];
    return nodes.map((n) => ({
      id: n.id,
      label: n.label,
      completed: n.completed,
    }));
  }, [nodes]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !nodes) return null;
    return nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId, nodes]);

  const handleNodePress = useCallback((id: string) => {
    setSelectedNodeId((prev) => (prev === id ? null : id));
  }, []);

  // Fallback data when API hasn't returned yet
  const level: KarmaTreeLevel = data?.level ?? 'seed';
  const totalPoints = data?.totalPoints ?? 0;

  return (
    <Screen>
      <GoldenHeader
        title={t('karmaScreenTitle')}
        onBack={() => router.back()}
        testID="karma-header"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Level progress */}
        <LevelProgress level={level} totalPoints={totalPoints} />

        {/* Tree visualization */}
        {isLoading ? (
          <View style={styles.centerState}>
            <LoadingMandala size={80} />
            <Text variant="bodySmall" color={c.textSecondary}>
              {t('karmaLoadingMessage')}
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text variant="body" color={colors.semantic.error}>
              {t('karmaErrorTitle')}
            </Text>
            <Text variant="bodySmall" color={c.textSecondary}>
              {t('karmaErrorBody')}
            </Text>
          </View>
        ) : treeNodes.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(600).springify()}>
            <KarmaTree
              nodes={treeNodes}
              onNodePress={handleNodePress}
              width={320}
              height={Math.max(400, treeNodes.length * 60 + 120)}
              testID="karma-tree"
            />
          </Animated.View>
        ) : (
          <View style={styles.emptyTree}>
            <Sprout size={48} color={c.textTertiary} />
            <Text variant="body" color={c.textSecondary} align="center">
              {t('karmaEmptyTitle')}
            </Text>
            <Text variant="bodySmall" color={c.textTertiary} align="center">
              {t('karmaEmptyBody')}
            </Text>
          </View>
        )}

        {/* Node detail (shown when a node is tapped) */}
        {selectedNode ? (
          <NodeDetail
            node={selectedNode}
            onClose={() => setSelectedNodeId(null)}
          />
        ) : null}

        {/* Level guide */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text
            variant="label"
            color={c.textSecondary}
            style={styles.guideTitle}
          >
            {t('karmaGrowthStagesTitle')}
          </Text>
          <View style={styles.levelGuide}>
            {TREE_LEVELS.map((lvl, i) => {
              const isActive = i <= LEVEL_TO_INDEX[level];
              return (
                <View
                  key={lvl.id}
                  style={[
                    styles.levelItem,
                    {
                      borderColor: isActive
                        ? colors.primary[500]
                        : c.cardBorder,
                    },
                  ]}
                >
                  <Text variant="body">{lvl.emoji}</Text>
                  <View style={styles.levelItemText}>
                    <Text
                      variant="caption"
                      color={isActive ? colors.primary[300] : c.textTertiary}
                    >
                      {t(lvl.nameKey)}
                    </Text>
                    <Text variant="caption" color={c.textTertiary}>
                      {t('karmaLevelPointsFmt', { count: String(lvl.minPoints) })}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  centerState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
  },

  // Level card
  levelCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  levelText: {
    flex: 1,
    gap: 2,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressSection: {
    gap: spacing.xxs,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Node detail
  nodeDetail: {
    borderRadius: radii.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: spacing.sm,
  },
  nodeDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nodePointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },

  // Empty tree
  emptyTree: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
  },

  // Level guide
  guideTitle: {
    marginBottom: spacing.xs,
  },
  levelGuide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  levelItemText: {
    gap: 1,
  },
});
