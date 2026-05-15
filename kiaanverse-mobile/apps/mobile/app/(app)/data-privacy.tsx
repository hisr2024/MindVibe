/**
 * Data & Privacy — operational data-handling page (separate from the
 * legal Privacy Policy at /(app)/privacy).
 *
 * This screen tells the seeker, in plain language, what we store, where,
 * for how long, and how they can export or delete it. Linked from the
 * Profile tab → "Data & Privacy" → `/(app)/data-privacy`. Self-contained:
 * no API calls, no state — content is baked into the bundle so it works
 * offline, even on dial-up.
 */

import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, GoldenHeader, SacredCard } from '@kiaanverse/ui';
import { Text } from 'react-native';
import { useTranslation } from '@kiaanverse/i18n';

const GOLD = '#D4A017';
const SACRED_WHITE = '#F0EBE1';
const TEXT_MUTED = 'rgba(240,235,225,0.62)';

/** 9 sections — heading + body pairs keyed support.dpN{Heading,Body}. */
const DATA_PRIVACY_SECTION_INDICES = Array.from({ length: 9 }, (_, i) => i + 1);

export default function DataAndPrivacyScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  const openMail = (): void => {
    void Linking.openURL('mailto:sacredquest2@gmail.com');
  };

  return (
    <Screen scroll gradient gradientVariant="cosmic">
      <GoldenHeader title={t('support.dataPrivacyTitle')} onBack={() => router.back()} />

      <SacredCard style={styles.card}>
        <Text style={styles.eyebrow}>{t('support.dataPrivacyEyebrow')}</Text>
        <Text style={styles.lastUpdated}>{t('support.lastUpdated')}</Text>

        <View style={styles.sections}>
          {DATA_PRIVACY_SECTION_INDICES.map((n) => (
            <View key={n} style={styles.section}>
              <Text style={styles.heading}>{t(`support.dp${n}Heading`)}</Text>
              <Text style={styles.body}>{t(`support.dp${n}Body`)}</Text>
            </View>
          ))}

          <Pressable
            onPress={openMail}
            accessibilityRole="link"
            accessibilityLabel={t('support.helpEmailA11y')}
            style={styles.contactRow}
          >
            <Text style={styles.contactLabel}>{t('support.dataPrivacyQuestions')}</Text>
            <Text style={styles.contactEmail}>{t('support.contactEmail')}</Text>
          </Pressable>
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
  contactRow: {
    marginTop: 8,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(212,160,23,0.35)',
    gap: 4,
  },
  contactLabel: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    color: TEXT_MUTED,
  },
  contactEmail: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    color: GOLD,
  },
});
