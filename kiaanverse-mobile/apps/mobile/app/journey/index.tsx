/**
 * Sacred Journey Catalog — Divine mobile UX for browsing, tracking,
 * and completing wisdom journeys that transform inner enemies.
 *
 * Three tabs: Discover (catalog with enemy category filtering),
 * Active (in-progress journeys with progress bars),
 * Completed (finished journeys with achievement badges).
 *
 * Features:
 * - Full-screen DivineBackground with cosmic variant
 * - LotusProgress hero element showing overall completion rate
 * - Horizontal enemy category chip filters (Krodha, Bhaya, etc.)
 * - Pull-to-refresh on every tab
 * - Rich haptic feedback on all interactions
 * - Staggered FadeInDown card animations
 * - Safe area insets for notch/home indicator
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  type ListRenderItemInfo,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Clock,
  CheckCircle2,
  Sparkles,
  Trophy,
  Flame,
  Star,
} from 'lucide-react-native';
import {
  Text,
  GoldenButton,
  DivineBackground,
  GlowCard,
  GoldenProgressBar,
  LotusProgress,
  MandalaSpin,
  SacredDivider,
  LoadingMandala,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import {
  useJourneyTemplates,
  useJourneys,
  useStartJourney,
  useJourneyDashboard,
  type JourneyTemplate,
  type Journey,
} from '@kiaanverse/api';
import { useJourneyStore } from '@kiaanverse/store';
import { useTranslation } from '@kiaanverse/i18n';

// ---------------------------------------------------------------------------
// Constants & Types
// ---------------------------------------------------------------------------

type TabKey = 'discover' | 'active' | 'completed';

/**
 * Inner enemy metadata — Sanskrit name, English translation, and accent color.
 *
 * The keys here MUST match the backend's `EnemyType` enum (six shadripu):
 *   kama · krodha · lobha · moha · mada · matsarya
 *
 * (Bhaya / fear is NOT one of the shadripu and is intentionally absent.)
 */
const ENEMY_INFO: Record<string, { name: string; sanskrit: string; color: string }> = {
  kama: { name: 'Desire', sanskrit: 'काम', color: '#f59e0b' },
  krodha: { name: 'Anger', sanskrit: 'क्रोध', color: '#ef4444' },
  lobha: { name: 'Greed', sanskrit: 'लोभ', color: '#10b981' },
  moha: { name: 'Delusion', sanskrit: 'मोह', color: '#8b5cf6' },
  mada: { name: 'Pride', sanskrit: 'मद', color: '#ec4899' },
  matsarya: { name: 'Envy', sanskrit: 'मत्सर्य', color: '#06b6d4' },
};

/** Category chip definition for the Discover tab filter row. */
const CATEGORY_CHIPS: { key: string; name: string; sanskrit: string; color: string }[] = [
  { key: 'all', name: 'All', sanskrit: 'सर्व', color: colors.primary[500] },
  ...Object.entries(ENEMY_INFO).map(([key, info]) => ({
    key,
    name: info.name,
    sanskrit: info.sanskrit,
    color: info.color,
  })),
];

/** Difficulty level display configuration. */
const DIFFICULTY_CONFIG = {
  beginner: { label: 'Beginner', color: '#22c55e' },
  intermediate: { label: 'Intermediate', color: '#f59e0b' },
  advanced: { label: 'Advanced', color: '#ef4444' },
} as const;

type DifficultyKey = keyof typeof DIFFICULTY_CONFIG;
const DIFFICULTY_DEFAULT = DIFFICULTY_CONFIG.beginner;

function getDifficultyConfig(key: string): { label: string; color: string } {
  return (DIFFICULTY_CONFIG as Record<string, { label: string; color: string }>)[key] ?? DIFFICULTY_DEFAULT;
}

/** Sacred gold used for titles and accents. */
const DIVINE_GOLD = '#FFD700';
const DIVINE_GOLD_DIM = 'rgba(255, 215, 0, 0.15)';
const DIVINE_GOLD_MEDIUM = 'rgba(255, 215, 0, 0.3)';

// ---------------------------------------------------------------------------
// Helper: Extract enemy key from template category/title
// ---------------------------------------------------------------------------

/**
 * Attempts to determine the enemy type from a template's category or title.
 * Falls back to undefined if no match is found.
 */
function resolveEnemyKey(template: JourneyTemplate): string | undefined {
  const searchText = `${template.category} ${template.title}`.toLowerCase();
  for (const key of Object.keys(ENEMY_INFO)) {
    if (searchText.includes(key)) return key;
  }
  return undefined;
}

/**
 * Extracts the difficulty from a template. The JourneyTemplate type does not
 * include difficulty natively, but the server may include it as an extra field.
 */
function resolveDifficulty(template: JourneyTemplate): string {
  return (template as JourneyTemplate & { difficulty?: string }).difficulty ?? 'beginner';
}

// ---------------------------------------------------------------------------
// Enemy Category Chip
// ---------------------------------------------------------------------------

function CategoryChip({
  chip,
  isActive,
  onPress,
}: {
  chip: (typeof CATEGORY_CHIPS)[number];
  isActive: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.categoryChip,
        {
          backgroundColor: isActive ? DIVINE_GOLD_MEDIUM : 'rgba(255,255,255,0.06)',
          borderColor: isActive ? chip.color : 'transparent',
        },
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${chip.name} category filter`}
    >
      <View style={[styles.colorDot, { backgroundColor: chip.color }]} />
      <Text variant="caption" color={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.6)'}>
        {chip.sanskrit}
      </Text>
      <Text variant="caption" color={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}>
        {chip.name}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Discover Tab — Template Card
// ---------------------------------------------------------------------------

function TemplateCard({
  item,
  index,
  onStart,
  isStarting,
}: {
  item: JourneyTemplate;
  index: number;
  onStart: () => void;
  isStarting: boolean;
}): React.JSX.Element {
  const enemyKey = resolveEnemyKey(item);
  const enemy = enemyKey ? ENEMY_INFO[enemyKey] : undefined;
  const accentColor = enemy?.color ?? colors.primary[500];
  const difficulty = resolveDifficulty(item);
  const diffConfig = getDifficultyConfig(difficulty);

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(500).springify()}>
      <GlowCard variant="divine" style={styles.templateCard}>
        {/* Enemy color accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

        {/* Mandala background decoration */}
        <View style={styles.mandalaContainer}>
          <MandalaSpin size={120} opacity={0.05} speed="slow" color={accentColor} />
        </View>

        <View style={styles.templateContent}>
          {/* Enemy badge + Duration */}
          <View style={styles.templateMetaRow}>
            {enemy && (
              <View style={[styles.enemyBadge, { backgroundColor: accentColor + '20' }]}>
                <View style={[styles.colorDotSmall, { backgroundColor: accentColor }]} />
                <Text variant="caption" color={accentColor}>
                  {enemy.sanskrit} · {enemy.name}
                </Text>
              </View>
            )}
            <View style={styles.durationBadge}>
              <Clock size={12} color="rgba(255,255,255,0.6)" />
              <Text variant="caption" color="rgba(255,255,255,0.6)">
                {item.durationDays} Days
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text
            variant="h3"
            color="#FFFFFF"
            numberOfLines={2}
            style={styles.templateTitle}
          >
            {item.title}
          </Text>

          {/* Difficulty pill */}
          <View style={[styles.difficultyPill, { backgroundColor: diffConfig.color + '20' }]}>
            <Text variant="caption" color={diffConfig.color}>
              {diffConfig.label}
            </Text>
          </View>

          {/* Description */}
          <Text
            variant="bodySmall"
            color="rgba(255,255,255,0.65)"
            numberOfLines={2}
            style={styles.templateDescription}
          >
            {item.description}
          </Text>

          {/* CTA Button */}
          <GoldenButton
            title="Begin Journey"
            variant="primary"
            onPress={onStart}
            loading={isStarting}
            style={styles.ctaButton}
          />
        </View>
      </GlowCard>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Active Tab — Active Journey Card
// ---------------------------------------------------------------------------

function ActiveJourneyCard({
  item,
  index,
  onPress,
}: {
  item: Journey;
  index: number;
  onPress: () => void;
}): React.JSX.Element {
  const progress = item.durationDays > 0
    ? (item.completedSteps / item.durationDays) * 100
    : 0;
  const enemyKey = resolveEnemyKey(item as unknown as JourneyTemplate);
  const enemy = enemyKey ? ENEMY_INFO[enemyKey] : undefined;
  const accentColor = enemy?.color ?? colors.primary[500];

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(450).springify()}>
      <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel={`${item.title}, Day ${item.currentDay} of ${item.durationDays}`}>
        <GlowCard variant="golden" style={styles.activeCard}>
          {/* Header: Enemy dot + title + day counter */}
          <View style={styles.activeHeader}>
            <View style={styles.activeHeaderLeft}>
              <View style={[styles.colorDot, { backgroundColor: accentColor }]} />
              {enemy && (
                <Text variant="caption" color={accentColor}>
                  {enemy.sanskrit}
                </Text>
              )}
            </View>
            <Text variant="caption" color={DIVINE_GOLD}>
              Day {item.currentDay} of {item.durationDays}
            </Text>
          </View>

          {/* Journey title */}
          <Text variant="label" color="#FFFFFF" numberOfLines={1}>
            {item.title}
          </Text>

          {/* Progress bar */}
          <GoldenProgressBar progress={progress} height={8} />

          {/* Progress percentage */}
          <Text variant="caption" color="rgba(255,255,255,0.6)" style={styles.progressLabel}>
            {Math.round(progress)}% complete
          </Text>
        </GlowCard>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Completed Tab — Completed Journey Card
// ---------------------------------------------------------------------------

function CompletedJourneyCard({
  item,
  index,
  onPress,
}: {
  item: Journey;
  index: number;
  onPress: () => void;
}): React.JSX.Element {
  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  /** Estimate XP earned — completedSteps * 10 is the base reward. */
  const xpEarned = item.completedSteps * 10;

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(450).springify()}>
      <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel={`${item.title}, completed`}>
        <GlowCard variant="default" style={styles.completedCard}>
          <View style={styles.completedHeader}>
            {/* Checkmark */}
            <CheckCircle2 size={22} color="#22c55e" />
            {/* Title */}
            <Text variant="label" color="#FFFFFF" numberOfLines={1} style={styles.completedTitle}>
              {item.title}
            </Text>
          </View>

          <View style={styles.completedMetaRow}>
            {/* Completed badge */}
            <View style={styles.completedBadge}>
              <Text variant="caption" color="#22c55e">
                Completed
              </Text>
            </View>

            {/* Duration */}
            <Text variant="caption" color="rgba(255,255,255,0.5)">
              {item.durationDays} Days
            </Text>

            {/* XP */}
            <View style={styles.xpBadge}>
              <Star size={12} color={DIVINE_GOLD} />
              <Text variant="caption" color={DIVINE_GOLD}>
                {xpEarned} XP
              </Text>
            </View>
          </View>
        </GlowCard>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Tab Pill
// ---------------------------------------------------------------------------

function TabPill({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.tabPill,
        isActive && styles.tabPillActive,
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Text
        variant="label"
        color={isActive ? '#000000' : 'rgba(255,255,255,0.5)'}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<Record<string, unknown>>;
  title: string;
  subtitle: string;
}): React.JSX.Element {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
      <Icon size={48} color="rgba(255,255,255,0.2)" />
      <Text variant="body" color="rgba(255,255,255,0.5)" align="center">
        {title}
      </Text>
      <Text variant="bodySmall" color="rgba(255,255,255,0.35)" align="center">
        {subtitle}
      </Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function JourneyScreen(): React.JSX.Element {
  const { t } = useTranslation('journeys');
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ---- State ----
  const [activeTab, setActiveTab] = useState<TabKey>('discover');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // ---- Data ----
  const {
    data: templates,
    isLoading: templatesLoading,
    refetch: refetchTemplates,
    isRefetching: isRefetchingTemplates,
  } = useJourneyTemplates();

  const {
    data: activeJourneys,
    refetch: refetchActive,
    isRefetching: isRefetchingActive,
  } = useJourneys('active');

  const {
    data: completedJourneys,
    refetch: refetchCompleted,
    isRefetching: isRefetchingCompleted,
  } = useJourneys('completed');

  const {
    data: dashboard,
  } = useJourneyDashboard();

  const startJourney = useStartJourney();

  // ---- Derived data ----

  /** Filter templates by selected enemy category. */
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    if (categoryFilter === 'all') return templates;
    return templates.filter((tmpl) => {
      const enemyKey = resolveEnemyKey(tmpl);
      return enemyKey === categoryFilter;
    });
  }, [templates, categoryFilter]);

  /** Overall journey completion rate (0-1) for the LotusProgress hero. */
  const overallProgress = useMemo(() => {
    const completed = dashboard?.completedCount ?? completedJourneys?.length ?? 0;
    const active = activeJourneys?.length ?? 0;
    const total = completed + active;
    if (total === 0) return 0;
    return completed / total;
  }, [dashboard, completedJourneys, activeJourneys]);

  // ---- Handlers ----

  const handleStartJourney = useCallback(
    (templateId: string) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      startJourney.mutate(templateId);
    },
    [startJourney],
  );

  const handleJourneyPress = useCallback(
    (journeyId: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(`/journey/${journeyId}`);
    },
    [router],
  );

  // ---- Render helpers ----

  const renderTemplateItem = useCallback(
    ({ item, index }: ListRenderItemInfo<JourneyTemplate>) => (
      <TemplateCard
        item={item}
        index={index}
        onStart={() => handleStartJourney(item.id)}
        isStarting={startJourney.isPending}
      />
    ),
    [handleStartJourney, startJourney.isPending],
  );

  const renderActiveItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Journey>) => (
      <ActiveJourneyCard
        item={item}
        index={index}
        onPress={() => handleJourneyPress(item.id)}
      />
    ),
    [handleJourneyPress],
  );

  const renderCompletedItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Journey>) => (
      <CompletedJourneyCard
        item={item}
        index={index}
        onPress={() => handleJourneyPress(item.id)}
      />
    ),
    [handleJourneyPress],
  );

  const keyExtractor = useCallback((item: { id: string }) => item.id, []);

  // ---- Category chips (horizontal ScrollView inside FlatList header) ----

  const renderCategoryChips = useCallback(() => (
    <FlatList
      data={CATEGORY_CHIPS}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(chip) => chip.key}
      contentContainerStyle={styles.categoryRow}
      renderItem={({ item: chip }) => (
        <CategoryChip
          chip={chip}
          isActive={categoryFilter === chip.key}
          onPress={() => setCategoryFilter(chip.key)}
        />
      )}
    />
  ), [categoryFilter]);

  // ---- Tab content ----

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'discover', label: 'Discover' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <DivineBackground variant="cosmic">
      {/* ================================================================ */}
      {/* Sacred Header                                                     */}
      {/* ================================================================ */}
      <Animated.View
        entering={FadeInUp.duration(600)}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <Text variant="h2" color={DIVINE_GOLD} style={styles.headerTitle}>
          Sacred Journeys
        </Text>
        <Text variant="bodySmall" color="rgba(255,255,255,0.6)" style={styles.headerSubtitle}>
          Transform your inner enemies through Vedic wisdom
        </Text>

        {/* Lotus Progress Hero */}
        <View style={styles.lotusContainer}>
          <LotusProgress progress={overallProgress} size={80} />
          <Text variant="caption" color={DIVINE_GOLD} style={styles.lotusLabel}>
            {Math.round(overallProgress * 100)}% mastered
          </Text>
        </View>

        <SacredDivider />

        {/* Tab pills */}
        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <TabPill
              key={tab.key}
              label={tab.label}
              isActive={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}
            />
          ))}
        </View>
      </Animated.View>

      {/* ================================================================ */}
      {/* Tab Content                                                       */}
      {/* ================================================================ */}

      {activeTab === 'discover' && (
        <FlatList
          data={filteredTemplates}
          renderItem={renderTemplateItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + spacing.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingTemplates}
              onRefresh={() => void refetchTemplates()}
              tintColor={colors.primary[500]}
            />
          }
          ListHeaderComponent={renderCategoryChips}
          ListEmptyComponent={
            templatesLoading ? (
              <View style={styles.emptyState}>
                <LoadingMandala size={64} />
                <Text variant="bodySmall" color="rgba(255,255,255,0.5)">
                  Unveiling sacred paths...
                </Text>
              </View>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="No journeys in this category"
                subtitle="Try selecting a different inner enemy above"
              />
            )
          }
        />
      )}

      {activeTab === 'active' && (
        <FlatList
          data={activeJourneys ?? []}
          renderItem={renderActiveItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + spacing.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingActive}
              onRefresh={() => void refetchActive()}
              tintColor={colors.primary[500]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={Flame}
              title="No active journeys"
              subtitle="Begin a sacred journey from the Discover tab"
            />
          }
        />
      )}

      {activeTab === 'completed' && (
        <FlatList
          data={completedJourneys ?? []}
          renderItem={renderCompletedItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + spacing.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingCompleted}
              onRefresh={() => void refetchCompleted()}
              tintColor={colors.primary[500]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={Trophy}
              title="No completed journeys yet"
              subtitle="Complete a journey to earn your first achievement"
            />
          }
        />
      )}
    </DivineBackground>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // -- Header --
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
  },
  lotusContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  lotusLabel: {
    marginTop: spacing.xs,
  },

  // -- Tab pills --
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  tabPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tabPillActive: {
    backgroundColor: DIVINE_GOLD,
  },

  // -- Category chips --
  categoryRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  colorDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // -- List --
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  // -- Empty state --
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
  },

  // -- Template card (Discover) --
  templateCard: {
    overflow: 'hidden',
    position: 'relative',
  },
  accentBar: {
    height: 4,
    width: '100%',
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  mandalaContainer: {
    position: 'absolute',
    top: -20,
    right: -20,
    zIndex: 0,
  },
  templateContent: {
    padding: spacing.md,
    gap: spacing.sm,
    zIndex: 1,
  },
  templateMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  enemyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  templateTitle: {
    fontWeight: '700',
  },
  difficultyPill: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
  },
  templateDescription: {
    lineHeight: 20,
  },
  ctaButton: {
    marginTop: spacing.xs,
  },

  // -- Active journey card --
  activeCard: {
    gap: spacing.sm,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressLabel: {
    textAlign: 'right',
  },

  // -- Completed journey card --
  completedCard: {
    gap: spacing.sm,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  completedTitle: {
    flex: 1,
  },
  completedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  completedBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
});
