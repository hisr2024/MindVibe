/**
 * Settings — App preferences, security, data, and account management.
 *
 * Organized in sections: Notifications, Language, Appearance, Security,
 * Data, About, and Account. Uses useUserSettings() to read current
 * values and useUpdateSettings() mutation to persist changes.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, Switch, Pressable, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Text,
  Card,
  GoldenHeader,
  Divider,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useUserSettings, useUpdateSettings } from '@kiaanverse/api';
import { useAuthStore } from '@kiaanverse/store';

type ThemeValue = 'dark' | 'light' | 'auto';
const THEME_OPTIONS: ThemeValue[] = ['dark', 'light', 'auto'];

export default function SettingsScreen(): React.JSX.Element {
  const router = useRouter();
  const { data: settings } = useUserSettings();
  const updateSettings = useUpdateSettings();
  const { logout } = useAuthStore();

  const handleToggle = useCallback(
    (key: string, value: boolean) => {
      void Haptics.selectionAsync();
      updateSettings.mutate({ [key]: value });
    },
    [updateSettings],
  );

  const handleThemeChange = useCallback(
    (theme: ThemeValue) => {
      void Haptics.selectionAsync();
      updateSettings.mutate({ theme });
    },
    [updateSettings],
  );

  const handleClearCache = useCallback(() => {
    Alert.alert('Clear Cache', 'This will remove all locally cached data. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        onPress: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          logout();
        },
      },
    ]);
  }, [logout]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This action is irreversible. All your data, journeys, and reflections will be permanently deleted. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          },
        },
      ],
    );
  }, []);

  const currentTheme = settings?.theme ?? 'dark';

  return (
    <Screen scroll>
      <GoldenHeader title="Settings" onBack={() => router.back()} />

      {/* Notifications */}
      <SectionHeader title="Notifications" />
      <Card style={styles.card}>
        <SettingRow label="Push Notifications" description="Daily reminders and updates">
          <Switch
            value={settings?.notifications_enabled ?? true}
            onValueChange={(v) => handleToggle('notifications_enabled', v)}
            trackColor={{ false: colors.alpha.whiteLight, true: colors.primary[700] }}
            thumbColor={colors.primary[300]}
          />
        </SettingRow>
        <Divider />
        <SettingRow
          label="Daily Reminder Time"
          description={settings?.daily_reminder_time ?? '07:00 AM'}
        />
      </Card>

      {/* Language */}
      <SectionHeader title="Language" />
      <Card style={styles.card}>
        <SettingRow label="Language" description={settings?.language ?? 'English'}>
          <Pressable style={styles.changeButton}>
            <Text variant="caption" color={colors.primary[300]}>
              Change
            </Text>
          </Pressable>
        </SettingRow>
      </Card>

      {/* Appearance */}
      <SectionHeader title="Appearance" />
      <Card style={styles.card}>
        <SettingRow label="Theme" description={`Current: ${currentTheme}`}>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((t) => (
              <Pressable
                key={t}
                style={[styles.themeChip, currentTheme === t && styles.themeChipActive]}
                onPress={() => handleThemeChange(t)}
                accessibilityRole="button"
                accessibilityState={{ selected: currentTheme === t }}
              >
                <Text
                  variant="caption"
                  color={currentTheme === t ? colors.primary[300] : colors.text.muted}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </SettingRow>
      </Card>

      {/* Security */}
      <SectionHeader title="Security" />
      <Card style={styles.card}>
        <SettingRow label="Biometric Login" description="Use Face ID / Fingerprint">
          <Switch
            value={settings?.biometric_enabled ?? false}
            onValueChange={(v) => handleToggle('biometric_enabled', v)}
            trackColor={{ false: colors.alpha.whiteLight, true: colors.primary[700] }}
            thumbColor={colors.primary[300]}
          />
        </SettingRow>
        <Divider />
        <SettingRow label="Journal Encryption" description="Encrypt all sacred reflections">
          <Switch
            value={settings?.journal_encryption ?? true}
            onValueChange={(v) => handleToggle('journal_encryption', v)}
            trackColor={{ false: colors.alpha.whiteLight, true: colors.primary[700] }}
            thumbColor={colors.primary[300]}
          />
        </SettingRow>
      </Card>

      {/* Data */}
      <SectionHeader title="Data" />
      <Card style={styles.card}>
        <SettingRow label="Offline Mode" description="Cache content for offline access">
          <Switch
            value={settings?.offline_mode ?? true}
            onValueChange={(v) => handleToggle('offline_mode', v)}
            trackColor={{ false: colors.alpha.whiteLight, true: colors.primary[700] }}
            thumbColor={colors.primary[300]}
          />
        </SettingRow>
        <Divider />
        <Pressable onPress={handleClearCache} style={styles.actionRow}>
          <Text variant="body" color={colors.text.primary}>
            Clear Cache
          </Text>
          <Text variant="caption" color={colors.text.muted}>
            Free up storage space
          </Text>
        </Pressable>
      </Card>

      {/* About */}
      <SectionHeader title="About" />
      <Card style={styles.card}>
        <SettingRow label="App Version" description="Kiaanverse v1.0.0">
          <Text variant="caption" color={colors.text.muted}>
            1.0.0
          </Text>
        </SettingRow>
        <Divider />
        <Pressable style={styles.linkRow}>
          <Text variant="body" color={colors.text.primary}>
            Privacy Policy
          </Text>
        </Pressable>
        <Divider />
        <Pressable style={styles.linkRow}>
          <Text variant="body" color={colors.text.primary}>
            Terms of Service
          </Text>
        </Pressable>
      </Card>

      {/* Account */}
      <SectionHeader title="Account" />
      <Card style={styles.card}>
        <Pressable onPress={handleSignOut} style={styles.signOutRow}>
          <Text variant="label" color={colors.semantic.error}>
            Sign Out
          </Text>
        </Pressable>
        <Divider />
        <Pressable onPress={handleDeleteAccount} style={styles.deleteRow}>
          <Text variant="caption" color={colors.semantic.error}>
            Delete Account
          </Text>
        </Pressable>
      </Card>

      <View style={styles.bottomSpacer} />
    </Screen>
  );
}

/** Section group header */
function SectionHeader({ title }: { title: string }): React.JSX.Element {
  return (
    <Text variant="caption" color={colors.text.muted} style={styles.sectionHeader}>
      {title.toUpperCase()}
    </Text>
  );
}

/** Reusable setting row: label + description on left, control on right */
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children?: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text variant="body" color={colors.text.primary}>
          {label}
        </Text>
        {description.length > 0 ? (
          <Text variant="caption" color={colors.text.muted}>
            {description}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  card: {
    marginHorizontal: spacing.lg,
    gap: 0,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingInfo: {
    flex: 1,
    gap: 2,
    marginRight: spacing.md,
  },
  themeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  themeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
  },
  themeChipActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.alpha.goldLight,
  },
  changeButton: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
  },
  actionRow: {
    paddingVertical: spacing.sm,
    gap: 2,
  },
  linkRow: {
    paddingVertical: spacing.sm,
  },
  signOutRow: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  deleteRow: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  bottomSpacer: {
    height: spacing.bottomInset,
  },
});
