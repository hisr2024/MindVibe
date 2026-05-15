/**
 * Help Center — in-app FAQ + troubleshooting reference.
 *
 * Linked from Profile tab → "Help Center" → `/help`. Self-contained:
 * no API calls, no state — content baked into the bundle so it works
 * offline, even on dial-up. Mirrors the layout of /privacy, /terms,
 * /data-privacy so the user encounters one consistent legal-doc /
 * support surface.
 *
 * Each FAQ is a heading + body block. The bottom of the screen has a
 * tappable mail-to link routing to sacredquest2@gmail.com so the user
 * can escalate when the FAQ doesn't answer their question.
 *
 * Crisis callout sits at the very top — non-negotiable for a wellness
 * surface. It points to local emergency services + a couple of
 * widely-recognised crisis lines without trying to be exhaustive
 * (different countries, different numbers — we don't fake authority).
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
const CRISIS_RED = '#dc2626';

/**
 * FAQ rows pull their heading + body from i18n via key suffix indices.
 * Adding/removing rows is a JSON-only change once `support.faqN*` keys
 * exist in every locale.
 */
const FAQ_KEYS: ReadonlyArray<{ heading: string; body: string }> = [
  { heading: 'support.faq1Heading', body: 'support.faq1Body' },
  { heading: 'support.faq2Heading', body: 'support.faq2Body' },
  { heading: 'support.faq3Heading', body: 'support.faq3Body' },
  { heading: 'support.faq4Heading', body: 'support.faq4Body' },
  { heading: 'support.faq5Heading', body: 'support.faq5Body' },
  { heading: 'support.faq6Heading', body: 'support.faq6Body' },
  { heading: 'support.faq7Heading', body: 'support.faq7Body' },
  { heading: 'support.faq8Heading', body: 'support.faq8Body' },
  { heading: 'support.faq9Heading', body: 'support.faq9Body' },
  { heading: 'support.faq10Heading', body: 'support.faq10Body' },
];

export default function HelpCenterScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  const openMail = (): void => {
    void Linking.openURL(
      'mailto:sacredquest2@gmail.com?subject=Kiaanverse%20Support',
    );
  };

  return (
    <Screen scroll gradient gradientVariant="cosmic">
      <GoldenHeader title={t('support.helpTitle')} onBack={() => router.back()} />

      <SacredCard style={[styles.card, styles.crisisCard]}>
        <Text style={[styles.eyebrow, styles.crisisEyebrow]}>
          {t('support.ifInCrisis')}
        </Text>
        <Text style={styles.crisisBody}>{t('support.helpCrisisBody')}</Text>
      </SacredCard>

      <SacredCard style={styles.card}>
        <Text style={styles.eyebrow}>{t('support.helpEyebrow')}</Text>
        <Text style={styles.lastUpdated}>{t('support.lastUpdated')}</Text>

        <View style={styles.sections}>
          {FAQ_KEYS.map((faq) => (
            <View key={faq.heading} style={styles.section}>
              <Text style={styles.heading}>{t(faq.heading)}</Text>
              <Text style={styles.body}>{t(faq.body)}</Text>
            </View>
          ))}

          <Pressable
            onPress={openMail}
            accessibilityRole="link"
            accessibilityLabel={t('support.helpEmailA11y')}
            style={styles.contactRow}
          >
            <Text style={styles.contactLabel}>{t('support.helpStillStuck')}</Text>
            <Text style={styles.contactEmail}>{t('support.contactEmail')}</Text>
            <Text style={styles.contactSla}>{t('support.answerSla')}</Text>
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
  crisisCard: {
    borderLeftWidth: 3,
    borderLeftColor: CRISIS_RED,
  },
  eyebrow: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    letterSpacing: 1.4,
    color: GOLD,
    textTransform: 'uppercase',
  },
  crisisEyebrow: {
    color: CRISIS_RED,
  },
  crisisBody: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 15,
    lineHeight: 24,
    color: SACRED_WHITE,
    marginTop: 10,
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
  contactSla: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
  },
});
