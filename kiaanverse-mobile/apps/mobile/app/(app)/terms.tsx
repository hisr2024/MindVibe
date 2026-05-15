/**
 * Terms of Service — readable terms text rendered inside the app.
 *
 * Linked from Profile tab → "Terms of Service" → `/(app)/terms`.
 * Self-contained: no API calls, no state — content baked into the
 * bundle so it's available offline. Mirrors PrivacyPolicyScreen so
 * users see one consistent legal-doc surface.
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

/**
 * Section indices reference the 12 paired (heading, body) keys in the
 * support namespace (support.termsNHeading + support.termsNBody for
 * N = 1..12). Adding/reordering sections is a JSON-only change.
 *
 * NB: This is plain-language wellness-app TOS and the translations
 * mirror the English semantics; jurisdiction-specific legal review
 * for non-English locales is still recommended before production.
 */
const TERMS_SECTION_INDICES = Array.from({ length: 12 }, (_, i) => i + 1);

export default function TermsOfServiceScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen scroll gradient gradientVariant="cosmic">
      <GoldenHeader title={t('support.termsTitle')} onBack={() => router.back()} />

      <SacredCard style={styles.card}>
        <Text style={styles.eyebrow}>{t('support.termsEyebrow')}</Text>
        <Text style={styles.lastUpdated}>{t('support.lastUpdated')}</Text>

        <View style={styles.sections}>
          {TERMS_SECTION_INDICES.map((n) => (
            <View key={n} style={styles.section}>
              <Text style={styles.heading}>{t(`support.terms${n}Heading`)}</Text>
              <Text style={styles.body}>{t(`support.terms${n}Body`)}</Text>
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
