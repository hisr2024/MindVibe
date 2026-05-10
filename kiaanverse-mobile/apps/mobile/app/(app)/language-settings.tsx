/**
 * Language Settings — single-select list of all supported locales.
 *
 * Reads/writes the user-preferences store (which drives <I18nProvider> at the
 * root layout, so the UI re-renders in the new locale immediately) and best-
 * effort syncs to the server. Server failure is non-fatal — the local choice
 * is the source of truth on device.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { DivineScreenWrapper, SacredCard } from '@kiaanverse/ui';
import { apiClient } from '@kiaanverse/api';
import { locales, translatedLocales, type Locale } from '@kiaanverse/i18n';
import { useUserPreferencesStore } from '@kiaanverse/store';

declare const __DEV__: boolean;

const TRANSLATED_SET = new Set<Locale>(translatedLocales);

export default function LanguageSettings(): React.JSX.Element {
  const locale = useUserPreferencesStore((s) => s.locale);
  const setLocale = useUserPreferencesStore((s) => s.setLocale);

  const handleSelect = useCallback(
    (code: Locale) => {
      // Optimistic local update — drives the I18nProvider via the store
      setLocale(code);
      // Best-effort server sync. We deliberately do not await or surface
      // errors: device preference is the source of truth and the store is
      // already persisted via AsyncStorage.
      apiClient
        .post('/api/translation/preferences', {
          language: code,
          auto_translate: false,
        })
        .catch((e: unknown) => {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.warn('language preference sync failed', e);
          }
        });
    },
    [setLocale],
  );

  return (
    <DivineScreenWrapper>
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <Text style={styles.title}>Language</Text>
        <SacredCard style={{ padding: 0 }}>
          {locales.map((lang) => {
            const isSelected = locale === lang.code;
            const hasTranslation = TRANSLATED_SET.has(lang.code);
            return (
              <TouchableOpacity
                key={lang.code}
                style={styles.row}
                onPress={() => handleSelect(lang.code)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${lang.name}, ${lang.nativeName}`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{lang.name}</Text>
                  <Text
                    style={[
                      styles.native,
                      lang.direction === 'rtl' && styles.rtl,
                    ]}
                  >
                    {lang.nativeName}
                  </Text>
                </View>
                {!hasTranslation && (
                  <Text style={styles.fallbackTag}>EN fallback</Text>
                )}
                {isSelected && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            );
          })}
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,160,23,0.08)',
  },
  label: {
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    color: '#F0EBE1',
  },
  native: {
    fontSize: 13,
    color: 'rgba(212,160,23,0.7)',
    marginTop: 1,
  },
  rtl: {
    writingDirection: 'rtl',
  },
  fallbackTag: {
    fontSize: 10,
    color: 'rgba(240,235,225,0.4)',
    fontFamily: 'Outfit-Regular',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  check: {
    color: '#D4A017',
    fontSize: 18,
  },
});
