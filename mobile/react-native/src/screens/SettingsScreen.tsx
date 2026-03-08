/**
 * Settings Screen
 *
 * User preferences management:
 * - Theme (dark/light/system)
 * - Language
 * - Notification preferences
 * - Voice preferences
 * - Privacy controls
 * - Cache management
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import {
  useUserPreferencesStore,
  ThemeMode,
} from '@state/stores/userPreferencesStore';
import { darkTheme, lightTheme, typography, spacing, radii, colors } from '@theme/tokens';
import { useTheme } from '@hooks/useTheme';

// ---------------------------------------------------------------------------
// Languages
// ---------------------------------------------------------------------------

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'sa', label: 'संस्कृतम् (Sanskrit)' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const prefs = useUserPreferencesStore();

  const handleThemeChange = useCallback(
    (mode: ThemeMode) => {
      prefs.setThemeMode(mode);
    },
    [prefs],
  );

  const handleLanguageChange = useCallback(() => {
    const options = LANGUAGES.map((l) => l.label);
    Alert.alert(
      'Select Language',
      undefined,
      [
        ...LANGUAGES.map((lang) => ({
          text: lang.label,
          onPress: () => prefs.setLocale(lang.code),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  }, [prefs]);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Clear Cache',
      'This will remove cached verses and responses. Your data will re-download when online.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Cache Cleared', 'Local cache has been cleared.');
          },
        },
      ],
    );
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === prefs.locale)?.label ?? 'English';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingBottom: insets.bottom + spacing.bottomInset,
        paddingHorizontal: spacing.lg,
      }}
    >
      {/* Header */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={{ color: theme.accent, fontSize: 18 }}>← Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.textPrimary }]}>Settings</Text>

      {/* Appearance */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        APPEARANCE
      </Text>

      {/* Theme Toggle */}
      <View style={[styles.optionGroup, { borderColor: theme.divider }]}>
        {(['dark', 'light', 'system'] as ThemeMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.themeOption,
              {
                backgroundColor:
                  prefs.themeMode === mode ? colors.alpha.goldLight : 'transparent',
                borderColor:
                  prefs.themeMode === mode ? theme.accent + '44' : 'transparent',
              },
            ]}
            onPress={() => handleThemeChange(mode)}
            accessibilityRole="radio"
            accessibilityState={{ selected: prefs.themeMode === mode }}
          >
            <Text style={styles.themeEmoji}>
              {mode === 'dark' ? '🌙' : mode === 'light' ? '☀️' : '📱'}
            </Text>
            <Text style={[styles.themeLabel, { color: theme.textPrimary }]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Language */}
      <TouchableOpacity
        style={[styles.settingRow, { borderColor: theme.divider }]}
        onPress={handleLanguageChange}
        accessibilityRole="button"
        accessibilityLabel={`Language: ${currentLang}`}
      >
        <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Language</Text>
        <Text style={[styles.settingValue, { color: theme.textSecondary }]}>{currentLang} ›</Text>
      </TouchableOpacity>

      {/* Notifications */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        NOTIFICATIONS
      </Text>

      {[
        { key: 'dailyReminder' as const, label: 'Daily Reminder' },
        { key: 'journeyUpdates' as const, label: 'Journey Updates' },
        { key: 'weeklyInsights' as const, label: 'Weekly Insights' },
        { key: 'communityActivity' as const, label: 'Community Activity' },
      ].map(({ key, label }) => (
        <View key={key} style={[styles.settingRow, { borderColor: theme.divider }]}>
          <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{label}</Text>
          <Switch
            value={prefs.notifications[key]}
            onValueChange={(val) => prefs.setNotifications({ [key]: val })}
            trackColor={{ false: theme.inputBorder, true: colors.gold[600] }}
            thumbColor={prefs.notifications[key] ? colors.gold[200] : '#f4f3f4'}
            accessibilityLabel={label}
          />
        </View>
      ))}

      {/* Voice */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        VOICE
      </Text>

      <View style={[styles.settingRow, { borderColor: theme.divider }]}>
        <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Auto-Play Audio</Text>
        <Switch
          value={prefs.voice.autoPlay}
          onValueChange={(val) => prefs.setVoice({ autoPlay: val })}
          trackColor={{ false: theme.inputBorder, true: colors.gold[600] }}
          thumbColor={prefs.voice.autoPlay ? colors.gold[200] : '#f4f3f4'}
          accessibilityLabel="Auto-play audio"
        />
      </View>

      {/* Privacy */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        PRIVACY
      </Text>

      {[
        { key: 'analyticsEnabled' as const, label: 'Usage Analytics' },
        { key: 'crashReportingEnabled' as const, label: 'Crash Reporting' },
        { key: 'personalizedInsights' as const, label: 'Personalized Insights' },
      ].map(({ key, label }) => (
        <View key={key} style={[styles.settingRow, { borderColor: theme.divider }]}>
          <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{label}</Text>
          <Switch
            value={prefs.privacy[key]}
            onValueChange={(val) => prefs.setPrivacy({ [key]: val })}
            trackColor={{ false: theme.inputBorder, true: colors.gold[600] }}
            thumbColor={prefs.privacy[key] ? colors.gold[200] : '#f4f3f4'}
            accessibilityLabel={label}
          />
        </View>
      ))}

      {/* Data */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        DATA
      </Text>

      <TouchableOpacity
        style={[styles.settingRow, { borderColor: theme.divider }]}
        onPress={handleClearCache}
        accessibilityRole="button"
      >
        <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Clear Cache</Text>
        <Text style={[styles.settingValue, { color: theme.textSecondary }]}>›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    marginBottom: spacing.lg,
    alignSelf: 'flex-start',
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  optionGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  themeEmoji: { fontSize: 24 },
  themeLabel: { ...typography.caption, fontWeight: '500' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabel: { ...typography.body },
  settingValue: { ...typography.bodySmall },
});
