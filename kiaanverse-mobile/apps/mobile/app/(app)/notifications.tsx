/**
 * Notifications Settings — toggle push categories.
 *
 * Optimistic local toggle + PATCH /api/user/notification-preferences.
 * Failed writes log to console; the UI keeps the optimistic value so the
 * user doesn't see a flicker (the next hydrate will reconcile if needed).
 */

import React, { useState } from 'react';
import { View, Text, Switch, ScrollView, StyleSheet } from 'react-native';
import { DivineScreenWrapper, SacredCard, GoldenDivider } from '@kiaanverse/ui';
import { apiClient } from '@kiaanverse/api';

const SETTINGS = [
  { key: 'daily_verse',      label: 'Daily Verse',     sub: 'Morning shloka reminder' },
  { key: 'sadhana_reminder', label: 'Nitya Sadhana',   sub: 'Practice reminders' },
  { key: 'journey_nudge',    label: 'Journey Nudges',  sub: 'Step completion reminders' },
  { key: 'kiaan_insights',   label: 'KIAAN Insights',  sub: 'Weekly wisdom digest' },
  { key: 'streak_alert',     label: 'Streak Alerts',   sub: "Don't break your streak" },
] as const;

export default function NotificationsScreen(): React.JSX.Element {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    daily_verse: true,
    sadhana_reminder: true,
    journey_nudge: false,
    kiaan_insights: true,
    streak_alert: true,
  });

  const toggle = async (key: string, value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    try {
      await apiClient.patch('/api/user/notification-preferences', { [key]: value });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DivineScreenWrapper>
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Notifications</Text>
        <SacredCard style={{ padding: 0 }}>
          {SETTINGS.map((s, idx) => (
            <React.Fragment key={s.key}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{s.label}</Text>
                  <Text style={styles.sub}>{s.sub}</Text>
                </View>
                <Switch
                  value={prefs[s.key]}
                  onValueChange={(v) => toggle(s.key, v)}
                  trackColor={{
                    false: 'rgba(255,255,255,0.1)',
                    true: 'rgba(212,160,23,0.4)',
                  }}
                  thumbColor={prefs[s.key] ? '#D4A017' : 'rgba(240,235,225,0.5)'}
                />
              </View>
              {idx < SETTINGS.length - 1 && (
                <GoldenDivider style={{ marginHorizontal: 16 }} />
              )}
            </React.Fragment>
          ))}
        </SacredCard>
      </ScrollView>
    </DivineScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontFamily: 'CormorantGaramond-BoldItalic',
    color: '#F0EBE1',
    marginTop: 60,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  label: {
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    color: '#F0EBE1',
    marginBottom: 2,
  },
  sub: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    color: 'rgba(240,235,225,0.4)',
  },
});
