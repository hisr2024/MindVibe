/**
 * Profile Tab
 *
 * User info, settings, journal, and analytics links.
 * Features cosmic gradient background and golden aura ring on avatar.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import {
  BookOpen,
  BarChart3,
  Settings,
  Moon,
  Sun,
  ChevronRight,
} from 'lucide-react-native';
import { Screen, Text, Card, Avatar, SacredDivider, Button, GlowCard, colors, spacing, radii } from '@kiaanverse/ui';
import { useTheme } from '@kiaanverse/ui';
import { useAuthStore, useThemeStore } from '@kiaanverse/store';
import { useTranslation } from '@kiaanverse/i18n';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

function MenuItem({ icon, label, onPress }: MenuItemProps): React.JSX.Element {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && { opacity: 0.7 },
      ]}
      accessibilityRole="button"
    >
      {icon}
      <Text variant="body" style={styles.menuLabel}>{label}</Text>
      <ChevronRight size={18} color={theme.colors.textTertiary} />
    </Pressable>
  );
}

export default function ProfileScreen(): React.JSX.Element {
  const { t } = useTranslation('common');
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const { user, logout } = useAuthStore();
  const { mode: _mode, setMode } = useThemeStore();

  const handleToggleTheme = useCallback(() => {
    setMode(isDark ? 'light' : 'dark');
  }, [isDark, setMode]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => void logout(),
        },
      ],
    );
  }, [logout, t]);

  return (
    <Screen scroll gradient>
      <View style={styles.profileSection}>
        {/* Avatar with golden aura ring */}
        <View style={styles.avatarContainer}>
          <View style={styles.auraRing}>
            <Avatar name={user?.name ?? 'Seeker'} size={72} />
          </View>
        </View>
        <Text variant="h2">{user?.name ?? 'Seeker'}</Text>
        <Text variant="bodySmall" color={c.textTertiary}>
          {user?.email ?? ''}
        </Text>
        <View style={styles.tierBadge}>
          <Text variant="caption" color={colors.primary[300]}>
            {user?.subscriptionTier ?? 'FREE'} Plan
          </Text>
        </View>
      </View>

      <SacredDivider />

      <GlowCard style={styles.menuCard}>
        <MenuItem
          icon={<BookOpen size={20} color={c.accent} />}
          label="Sacred Journal"
          onPress={() => {}}
        />
        <View style={[styles.menuDivider, { backgroundColor: c.divider }]} />
        <MenuItem
          icon={<BarChart3 size={20} color={c.accent} />}
          label="Analytics"
          onPress={() => {}}
        />
        <View style={[styles.menuDivider, { backgroundColor: c.divider }]} />
        <MenuItem
          icon={<Settings size={20} color={c.accent} />}
          label="Settings"
          onPress={() => {}}
        />
        <View style={[styles.menuDivider, { backgroundColor: c.divider }]} />
        <MenuItem
          icon={isDark
            ? <Sun size={20} color={c.accent} />
            : <Moon size={20} color={c.accent} />
          }
          label={isDark ? 'Light Mode' : 'Dark Mode'}
          onPress={handleToggleTheme}
        />
      </GlowCard>

      <View style={styles.logoutSection}>
        <Button
          title="Sign Out"
          variant="ghost"
          onPress={handleLogout}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  auraRing: {
    padding: 4,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.divine.aura,
    shadowColor: colors.divine.aura,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  tierBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.alpha.goldLight,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  menuLabel: {
    flex: 1,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.lg,
  },
  logoutSection: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
});
