/**
 * Profile Tab
 *
 * User info, settings, journal, and analytics links.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import {
  BookOpen,
  BarChart3,
  Settings,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { Screen, Text, Card, Avatar, Divider, Button, colors, spacing, radii } from '@kiaanverse/ui';
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
      <ChevronRight size={18} color={theme.textTertiary} />
    </Pressable>
  );
}

export default function ProfileScreen(): React.JSX.Element {
  const { t } = useTranslation('common');
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuthStore();
  const { mode, setMode } = useThemeStore();

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
    <Screen scroll>
      <View style={styles.profileSection}>
        <Avatar name={user?.name} size={72} />
        <Text variant="h2">{user?.name ?? 'Seeker'}</Text>
        <Text variant="bodySmall" color={colors.divine.muted}>
          {user?.email ?? ''}
        </Text>
        <View style={styles.tierBadge}>
          <Text variant="caption" color={colors.gold[400]}>
            {user?.subscriptionTier ?? 'FREE'} Plan
          </Text>
        </View>
      </View>

      <Divider />

      <Card style={styles.menuCard}>
        <MenuItem
          icon={<BookOpen size={20} color={theme.accent} />}
          label="Sacred Journal"
          onPress={() => {}}
        />
        <Divider />
        <MenuItem
          icon={<BarChart3 size={20} color={theme.accent} />}
          label="Analytics"
          onPress={() => {}}
        />
        <Divider />
        <MenuItem
          icon={<Settings size={20} color={theme.accent} />}
          label="Settings"
          onPress={() => {}}
        />
        <Divider />
        <MenuItem
          icon={isDark
            ? <Sun size={20} color={theme.accent} />
            : <Moon size={20} color={theme.accent} />
          }
          label={isDark ? 'Light Mode' : 'Dark Mode'}
          onPress={handleToggleTheme}
        />
      </Card>

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
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.xl,
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
  logoutSection: {
    marginTop: spacing['3xl'],
    alignItems: 'center',
  },
});
