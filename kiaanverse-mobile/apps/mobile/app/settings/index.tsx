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
import { useTranslation } from '@kiaanverse/i18n';

type ThemeValue = 'dark' | 'light' | 'auto';
const THEME_OPTIONS: ThemeValue[] = ['dark', 'light', 'auto'];

// Theme key — resolved via t() at render. The value (`ThemeValue`) is
// the canonical stable ID stored in user settings; only the visible
// chip label is localized.
const THEME_LABEL_KEYS: Record<ThemeValue, string> = {
  dark: 'themeDark',
  light: 'themeLight',
  auto: 'themeAuto',
};

export default function SettingsScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('settings');
  const { data: settings } = useUserSettings();
  const updateSettings = useUpdateSettings();
  const { logout } = useAuthStore();

  const handleToggle = useCallback(
    (key: string, value: boolean) => {
      void Haptics.selectionAsync();
      updateSettings.mutate({ [key]: value });
    },
    [updateSettings]
  );

  const handleThemeChange = useCallback(
    (theme: ThemeValue) => {
      void Haptics.selectionAsync();
      updateSettings.mutate({ theme });
    },
    [updateSettings]
  );

  const handleClearCache = useCallback(() => {
    Alert.alert(
      t('clearCacheAlertTitle'),
      t('clearCacheAlertBody'),
      [
        { text: t('cancelButton'), style: 'cancel' },
        {
          text: t('clearButton'),
          onPress: () => {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
          },
        },
      ]
    );
  }, [t]);

  const handleSignOut = useCallback(() => {
    Alert.alert(t('signOutAlertTitle'), t('signOutAlertBody'), [
      { text: t('cancelButton'), style: 'cancel' },
      {
        text: t('signOut'),
        style: 'destructive',
        onPress: () => {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          );
          logout();
        },
      },
    ]);
  }, [logout, t]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      t('deleteAccountAlertTitle'),
      t('deleteAccountAlertBody'),
      [
        { text: t('cancelButton'), style: 'cancel' },
        {
          text: t('deleteAccountConfirm'),
          style: 'destructive',
          onPress: () => {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Error
            );
          },
        },
      ]
    );
  }, [t]);

  const currentTheme = settings?.theme ?? 'dark';

  return (
    <Screen scroll>
      <GoldenHeader title={t('screenTitle')} onBack={() => router.back()} />

      {/* Notifications */}
      <SectionHeader title={t('sectionNotifications')} />
      <Card style={styles.card}>
        <SettingRow
          label={t('pushNotifLabel')}
          description={t('pushNotifDesc')}
        >
          <Switch
            value={settings?.notifications_enabled ?? true}
            onValueChange={(v) => handleToggle('notifications_enabled', v)}
            trackColor={{
              false: colors.alpha.whiteLight,
              true: colors.primary[700],
            }}
            thumbColor={colors.primary[300]}
          />
        </SettingRow>
        <Divider />
        <SettingRow
          label={t('dailyReminderLabel')}
          description={settings?.daily_reminder_time ?? t('dailyReminderDefault')}
        />
      </Card>

      {/* Language */}
      <SectionHeader title={t('sectionLanguage')} />
      <Card style={styles.card}>
        <SettingRow
          label={t('languageLabel')}
          description={settings?.language ?? t('languageDefault')}
        >
          <Pressable style={styles.changeButton}>
            <Text variant="caption" color={colors.primary[300]}>
              {t('changeButton')}
            </Text>
          </Pressable>
        </SettingRow>
      </Card>

      {/* Voice — choose the most natural voice + persona for Sakha
          across Listen buttons, Voice Companion, and verse readings. */}
      <SectionHeader title={t('sectionVoice')} />
      <Card style={styles.card}>
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            router.push('/settings/voice');
          }}
          accessibilityRole="button"
          accessibilityLabel={t('voiceSettingsA11y')}
        >
          <SettingRow
            label={t('voicePersonaLabel')}
            description={t('voicePersonaDesc')}
          >
            <Text variant="caption" color={colors.primary[300]}>
              ›
            </Text>
          </SettingRow>
        </Pressable>
      </Card>

      {/* Appearance */}
      <SectionHeader title={t('sectionAppearance')} />
      <Card style={styles.card}>
        <SettingRow
          label={t('themeLabel')}
          description={t('themeCurrentFmt', { theme: t(THEME_LABEL_KEYS[currentTheme]) })}
        >
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((themeValue) => (
              <Pressable
                key={themeValue}
                style={[
                  styles.themeChip,
                  currentTheme === themeValue && styles.themeChipActive,
                ]}
                onPress={() => handleThemeChange(themeValue)}
                accessibilityRole="button"
                accessibilityState={{ selected: currentTheme === themeValue }}
              >
                <Text
                  variant="caption"
                  color={
                    currentTheme === themeValue ? colors.primary[300] : colors.text.muted
                  }
                >
                  {t(THEME_LABEL_KEYS[themeValue])}
                </Text>
              </Pressable>
            ))}
          </View>
        </SettingRow>
      </Card>

      {/* Security */}
      <SectionHeader title={t('sectionSecurity')} />
      <Card style={styles.card}>
        <SettingRow
          label={t('biometricLabel')}
          description={t('biometricDesc')}
        >
          <Switch
            value={settings?.biometric_enabled ?? false}
            onValueChange={(v) => handleToggle('biometric_enabled', v)}
            trackColor={{
              false: colors.alpha.whiteLight,
              true: colors.primary[700],
            }}
            thumbColor={colors.primary[300]}
          />
        </SettingRow>
        <Divider />
        <SettingRow
          label={t('journalEncLabel')}
          description={t('journalEncDesc')}
        >
          <Switch
            value={settings?.journal_encryption ?? true}
            onValueChange={(v) => handleToggle('journal_encryption', v)}
            trackColor={{
              false: colors.alpha.whiteLight,
              true: colors.primary[700],
            }}
            thumbColor={colors.primary[300]}
          />
        </SettingRow>
      </Card>

      {/* Data */}
      <SectionHeader title={t('sectionData')} />
      <Card style={styles.card}>
        <SettingRow
          label={t('offlineModeLabel')}
          description={t('offlineModeDesc')}
        >
          <Switch
            value={settings?.offline_mode ?? true}
            onValueChange={(v) => handleToggle('offline_mode', v)}
            trackColor={{
              false: colors.alpha.whiteLight,
              true: colors.primary[700],
            }}
            thumbColor={colors.primary[300]}
          />
        </SettingRow>
        <Divider />
        <Pressable onPress={handleClearCache} style={styles.actionRow}>
          <Text variant="body" color={colors.text.primary}>
            {t('clearCacheAction')}
          </Text>
          <Text variant="caption" color={colors.text.muted}>
            {t('clearCacheDesc')}
          </Text>
        </Pressable>
      </Card>

      {/* About */}
      <SectionHeader title={t('sectionAbout')} />
      <Card style={styles.card}>
        <SettingRow label={t('appVersionLabel')} description={t('appVersionDesc')}>
          <Text variant="caption" color={colors.text.muted}>
            {t('appVersionValue')}
          </Text>
        </SettingRow>
        <Divider />
        <Pressable
          onPress={() => router.push('/settings/privacy')}
          style={styles.linkRow}
        >
          <Text variant="body" color={colors.text.primary}>
            {t('privacyDataLink')}
          </Text>
          <Text variant="caption" color={colors.text.muted}>
            {t('privacyDataLinkDesc')}
          </Text>
        </Pressable>
        <Divider />
        <Pressable style={styles.linkRow}>
          <Text variant="body" color={colors.text.primary}>
            {t('privacyPolicyLink')}
          </Text>
        </Pressable>
        <Divider />
        <Pressable style={styles.linkRow}>
          <Text variant="body" color={colors.text.primary}>
            {t('termsOfServiceLink')}
          </Text>
        </Pressable>
      </Card>

      {/* Account */}
      <SectionHeader title={t('sectionAccount')} />
      <Card style={styles.card}>
        <Pressable onPress={handleSignOut} style={styles.signOutRow}>
          <Text variant="label" color={colors.semantic.error}>
            {t('signOut')}
          </Text>
        </Pressable>
        <Divider />
        <Pressable onPress={handleDeleteAccount} style={styles.deleteRow}>
          <Text variant="caption" color={colors.semantic.error}>
            {t('deleteAccountAction')}
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
    <Text
      variant="caption"
      color={colors.text.muted}
      style={styles.sectionHeader}
    >
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
