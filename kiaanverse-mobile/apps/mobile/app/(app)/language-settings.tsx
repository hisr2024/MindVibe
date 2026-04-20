/**
 * Language Settings — single-select list of supported locales.
 *
 * Optimistic local select + PATCH /api/user/language. The native script
 * preview uses NotoSansDevanagari for Indic scripts (falls back to the
 * system font for non-Indic entries, which is fine).
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { DivineScreenWrapper, SacredCard } from '@kiaanverse/ui';
import { apiClient } from '@kiaanverse/api';

const LANGUAGES = [
  { code: 'en', label: 'English',   native: 'English' },
  { code: 'hi', label: 'Hindi',     native: 'हिन्दी' },
  { code: 'sa', label: 'Sanskrit',  native: 'संस्कृत' },
  { code: 'ta', label: 'Tamil',     native: 'தமிழ்' },
  { code: 'te', label: 'Telugu',    native: 'తెలుగు' },
  { code: 'mr', label: 'Marathi',   native: 'मराठी' },
  { code: 'bn', label: 'Bengali',   native: 'বাংলা' },
  { code: 'gu', label: 'Gujarati',  native: 'ગુજરાતી' },
  { code: 'kn', label: 'Kannada',   native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'de', label: 'German',    native: 'Deutsch' },
  { code: 'fr', label: 'French',    native: 'Français' },
  { code: 'es', label: 'Spanish',   native: 'Español' },
] as const;

export default function LanguageSettings(): React.JSX.Element {
  const [selected, setSelected] = useState('en');

  const handleSelect = async (code: string) => {
    setSelected(code);
    try {
      await apiClient.patch('/api/user/language', { language: code });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DivineScreenWrapper>
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <Text style={styles.title}>Language</Text>
        <SacredCard style={{ padding: 0 }}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={styles.row}
              onPress={() => handleSelect(lang.code)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{lang.label}</Text>
                <Text style={styles.native}>{lang.native}</Text>
              </View>
              {selected === lang.code && (
                <Text style={{ color: '#D4A017', fontSize: 18 }}>✓</Text>
              )}
            </TouchableOpacity>
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
    fontFamily: 'NotoSansDevanagari-Regular',
    color: 'rgba(212,160,23,0.6)',
    marginTop: 1,
  },
});
