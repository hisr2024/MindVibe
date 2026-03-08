/**
 * Profile Screen
 *
 * User profile hub with:
 * - Account info and subscription tier
 * - Journey stats summary
 * - Quick navigation to settings, journal, analytics
 * - Logout action
 * - Data export
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@state/stores/authStore';
import { api } from '@services/apiClient';
import { darkTheme, typography, spacing, radii, colors, shadows } from '@theme/tokens';
import type { ProfileStackParamList } from '@app-types/index';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = darkTheme;
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  const { user, logout } = useAuthStore();

  // Fetch dashboard stats
  const { data: dashboard } = useQuery({
    queryKey: ['journey-dashboard'],
    queryFn: async () => {
      const { data } = await api.journeys.dashboard();
      return data;
    },
  });

  // Fetch analytics summary
  const { data: analytics } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      try {
        const { data } = await api.profile.get();
        return data;
      } catch {
        return null;
      }
    },
  });

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your data will be synced when you sign back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ],
    );
  }, [logout]);

  const tierColors: Record<string, string> = {
    FREE: colors.divine.muted,
    BASIC: colors.gold[400],
    PREMIUM: colors.mv.aurora,
    ENTERPRISE: colors.mv.auroraLilac,
  };

  const tierLabel = user?.subscriptionTier ?? 'FREE';
  const tierColor = tierColors[tierLabel] ?? colors.divine.muted;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.xl,
        paddingBottom: insets.bottom + spacing.bottomInset,
        paddingHorizontal: spacing.lg,
      }}
    >
      {/* User Header */}
      <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={[styles.avatar, { backgroundColor: colors.alpha.goldMedium }]}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() ?? '🕉️'}
          </Text>
        </View>
        <Text style={[styles.userName, { color: theme.textPrimary }]}>
          {user?.name ?? 'Seeker'}
        </Text>
        <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
          {user?.email ?? ''}
        </Text>
        <View style={[styles.tierBadge, { backgroundColor: tierColor + '22' }]}>
          <Text style={[styles.tierText, { color: tierColor }]}>
            {tierLabel}
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {[
          {
            emoji: '🧘',
            label: 'Active',
            value: String(dashboard?.active_journeys ?? dashboard?.activeJourneys ?? 0),
          },
          {
            emoji: '✅',
            label: 'Completed',
            value: String(dashboard?.completed_journeys ?? dashboard?.completedJourneys ?? 0),
          },
          {
            emoji: '🔥',
            label: 'Streak',
            value: `${dashboard?.current_streak ?? dashboard?.currentStreak ?? 0}d`,
          },
          {
            emoji: '📅',
            label: 'Total Days',
            value: String(dashboard?.total_days_completed ?? dashboard?.totalDaysCompleted ?? 0),
          },
        ].map((stat) => (
          <View
            key={stat.label}
            style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
          >
            <Text style={styles.statEmoji}>{stat.emoji}</Text>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: theme.textTertiary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {[
          { label: 'Journal', emoji: '📔', screen: 'Journal' as const },
          { label: 'Analytics', emoji: '📊', screen: 'Analytics' as const },
          { label: 'Settings', emoji: '⚙️', screen: 'Settings' as const },
          { label: 'Privacy & Data', emoji: '🔒', screen: 'Privacy' as const },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, { borderColor: theme.divider }]}
            onPress={() => navigation.navigate(item.screen)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <Text style={styles.menuEmoji}>{item.emoji}</Text>
            <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>
              {item.label}
            </Text>
            <Text style={{ color: theme.textTertiary }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: colors.semantic.error + '44' }]}
        onPress={handleLogout}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Text style={[styles.logoutText, { color: colors.semantic.error }]}>
          Sign Out
        </Text>
      </TouchableOpacity>

      {/* App Version */}
      <Text style={[styles.versionText, { color: theme.textTertiary }]}>
        MindVibe v1.0.0
      </Text>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  // User card
  userCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.gold[300],
  },
  userName: {
    ...typography.h2,
    marginBottom: 2,
  },
  userEmail: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  tierBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  tierText: {
    ...typography.label,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statEmoji: { fontSize: 24, marginBottom: spacing.xs },
  statValue: { ...typography.h2, marginBottom: 2 },
  statLabel: { ...typography.caption },
  // Menu
  menuSection: {
    marginBottom: spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  menuEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  menuLabel: { ...typography.body, flex: 1 },
  // Logout
  logoutButton: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoutText: {
    ...typography.label,
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
