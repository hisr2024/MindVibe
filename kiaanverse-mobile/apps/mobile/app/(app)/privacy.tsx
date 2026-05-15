/**
 * Privacy Policy — readable policy text rendered inside the app.
 *
 * Linked from Profile tab → "Privacy Policy" → `/(app)/privacy`.
 * Kept intentionally self-contained: no API calls, no state — the
 * content is baked into the bundle so it's available offline.
 *
 * NB: Translations mirror the English semantics; jurisdiction-specific
 * legal review for non-English locales is still recommended.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, GoldenHeader, SacredCard } from '@kiaanverse/ui';
import { Text } from 'react-native';
import { useTranslation } from '@kiaanverse/i18n';

const GOLD = '#D4A017';
const SACRED_WHITE = '#F0EBE1';
const TEXT_MUTED = 'rgba(240,235,225,0.62)';

/** 8 sections — heading + body pairs keyed support.privacyN{Heading,Body}. */
const PRIVACY_SECTION_INDICES = Array.from({ length: 8 }, (_, i) => i + 1);

export default function PrivacyPolicyScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen scroll gradient gradientVariant="cosmic">
      <GoldenHeader title={t('support.privacyTitle')} onBack={() => router.back()} />

      <SacredCard style={styles.card}>
        <Text style={styles.eyebrow}>{t('support.privacyEyebrow')}</Text>
        <Text style={styles.lastUpdated}>{t('support.lastUpdated')}</Text>

        <View style={styles.sections}>
          {PRIVACY_SECTION_INDICES.map((n) => (
            <View key={n} style={styles.section}>
              <Text style={styles.heading}>{t(`support.privacy${n}Heading`)}</Text>
              <Text style={styles.body}>{t(`support.privacy${n}Body`)}</Text>
            </View>
          ))}
        </View>
      </SacredCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  eyebrow: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    letterSpacing: 1.4,
    color: GOLD,
    textTransform: 'uppercase',
  },
  lastUpdated: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 4,
    marginBottom: 20,
  },
  sections: {
    gap: 18,
  },
  section: {
    gap: 6,
  },
  heading: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    color: SACRED_WHITE,
  },
  body: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(240,235,225,0.85)',
  },
});
