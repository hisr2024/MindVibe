/**
 * Settings — App preferences, security, and account management.
 */
import React, { useCallback } from 'react';
import { View, StyleSheet, Switch, Pressable, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen, Text, Card, Divider, colors, spacing } from '@kiaanverse/ui';
import { useAuthStore, useUserPreferencesStore, useThemeStore } from '@kiaanverse/store';

export default function SettingsScreen(): React.JSX.Element {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { locale, setLocale } = useUserPreferencesStore();
  const { mode, setMode } = useThemeStore();

  const handleLogout = useCallback(() => {
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

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text variant="h2">Settings</Text>
      </Animated.View>

      {/* Notifications */}
      <SectionHeader title="Notifications" />
      <Card style={styles.card}>
        <SettingRow label="Push Notifications" description="Daily reminders and community updates">
          <Switch
            value={true}
            trackColor={{ false: colors.alpha.whiteLight, true: colors.primary[700] }}
            thumbColor={colors.primary[300]}
          />
        </SettingRow>
        <Divider />
        <SettingRow label="Daily Sadhana Reminder" description="Morning reminder for practice">
          <Switch
            value={true}
            trackColor={{ false: colors.alpha.whiteLight, true: colors.primary[700] }}
            thumbColor={colors.primary[300]}
          />
        </SettingRow>
      </Card>

      {/* Appearance */}
      <SectionHeader title="Appearance" />
      <Card style={styles.card}>
        <SettingRow label="Theme" description={`Current: ${mode}`}>
          <View style={styles.themeRow}>
            {(['dark', 'light'] as const).map((t) => (
              <Pressable
                key={t}
                style={[styles.themeChip, mode === t && styles.themeChipActive]}
                onPress={() => setMode(t)}
              >
                <Text variant="caption" color={mode === t ? colors.primary[300] : colors.text.muted}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </SettingRow>
        <Divider />
        <SettingRow label="Language" description={locale}>
          <Text variant="caption" color={colors.primary[300]}>Change</Text>
        </SettingRow>
      </Card>

      {/* Security */}
      <SectionHeader title="Security" />
      <Card style={styles.card}>
        <SettingRow label="Biometric Login" description="Use Face ID / Fingerprint">
          <Switch
            value={false}
            trackColor={{ false: colors.alpha.whiteLight, true: colors.primary[700] }}
            thumbColor={colors.primary[300]}
          />
        </SettingRow>
        <Divider />
        <SettingRow label="Journal Encryption" description="Encrypt all sacred reflections">
          <Switch
            value={true}
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
            value={true}
            trackColor={{ false: colors.alpha.whiteLight, true: colors.primary[700] }}
            thumbColor={colors.primary[300]}
          />
        </SettingRow>
      </Card>

      {/* About */}
      <SectionHeader title="About" />
      <Card style={styles.card}>
        <SettingRow label="App Version" description="Kiaanverse v1.0.0">
          <Text variant="caption" color={colors.text.muted}>1.0.0</Text>
        </SettingRow>
        <Divider />
        <SettingRow label="Privacy Policy" description="" />
        <Divider />
        <SettingRow label="Terms of Service" description="" />
      </Card>

      {/* Account */}
      <SectionHeader title="Account" />
      <Card style={styles.card}>
        <Pressable onPress={handleLogout} style={styles.logoutRow}>
          <Text variant="label" color={colors.semantic.error}>Sign Out</Text>
        </Pressable>
      </Card>

      <View style={styles.bottomSpacer} />
    </Screen>
  );
}

function SectionHeader({ title }: { title: string }): React.JSX.Element {
  return (
    <Text variant="caption" color={colors.text.muted} style={styles.sectionHeader}>
      {title.toUpperCase()}
    </Text>
  );
}

function SettingRow({ label, description, children }: { label: string; description: string; children?: React.ReactNode }): React.JSX.Element {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text variant="body">{label}</Text>
        {description.length > 0 && (
          <Text variant="caption" color={colors.text.muted}>{description}</Text>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.lg, paddingBottom: spacing.md },
  sectionHeader: { marginTop: spacing.lg, marginBottom: spacing.xs, paddingHorizontal: spacing.xs },
  card: { gap: 0 },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingInfo: { flex: 1, gap: 2, marginRight: spacing.md },
  themeRow: { flexDirection: 'row', gap: spacing.xs },
  themeChip: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2,
    borderRadius: 8, borderWidth: 1, borderColor: colors.alpha.whiteLight,
  },
  themeChipActive: { borderColor: colors.primary[500], backgroundColor: colors.alpha.goldLight },
  logoutRow: { paddingVertical: spacing.sm, alignItems: 'center' },
  bottomSpacer: { height: 100 },
});
