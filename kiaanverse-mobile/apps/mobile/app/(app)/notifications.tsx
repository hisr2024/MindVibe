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
import { useTranslation } from '@kiaanverse/i18n';

interface NotificationToggle {
  readonly key: string;
  readonly labelKey: string;
  readonly subKey: string;
}

const SETTINGS: readonly NotificationToggle[] = [
  { key: 'daily_verse', labelKey: 'settings.notifDailyVerseLabel', subKey: 'settings.notifDailyVerseSub' },
  { key: 'sadhana_reminder', labelKey: 'settings.notifSadhanaLabel', subKey: 'settings.notifSadhanaSub' },
  { key: 'journey_nudge', labelKey: 'settings.notifJourneyLabel', subKey: 'settings.notifJourneySub' },
  { key: 'kiaan_insights', labelKey: 'settings.notifKiaanLabel', subKey: 'settings.notifKiaanSub' },
  { key: 'streak_alert', labelKey: 'settings.notifStreakLabel', subKey: 'settings.notifStreakSub' },
];

export default function NotificationsScreen(): React.JSX.Element {
  const { t } = useTranslation();
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
      await apiClient.patch('/api/user/notification-preferences', {
        [key]: value,
      });
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
        <Text style={styles.title}>{t('settings.notificationsTitle')}</Text>
        <SacredCard style={{ padding: 0 }}>
          {SETTINGS.map((s, idx) => (
            <React.Fragment key={s.key}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{t(s.labelKey)}</Text>
                  <Text style={styles.sub}>{t(s.subKey)}</Text>
                </View>
                <Switch
                  value={prefs[s.key]}
                  onValueChange={(v) => toggle(s.key, v)}
                  trackColor={{
                    false: 'rgba(255,255,255,0.1)',
                    true: 'rgba(212,160,23,0.4)',
                  }}
                  thumbColor={
                    prefs[s.key] ? '#D4A017' : 'rgba(240,235,225,0.5)'
                  }
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
