/**
 * Contact Us — categorised mail-to dispatcher.
 *
 * Linked from Profile tab → "Contact Us" → `/contact`. Self-contained:
 * no API calls, no state — every interaction is a `mailto:` intent
 * that hands off to the user's mail client. Subjects are pre-filled
 * per category so we can triage faster on the receiving side.
 *
 * Layout follows the same Screen / GoldenHeader / SacredCard pattern
 * as /help, /privacy, /terms, /data-privacy so the user encounters one
 * consistent legal-doc / support surface.
 *
 * Crisis callout sits at the very top — non-negotiable for a wellness
 * surface. Kiaanverse is not a crisis line and we never want a user in
 * an acute moment to type a message and wait 7 days.
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

const CONTACT_EMAIL = 'sacredquest2@gmail.com';

/**
 * Category metadata — each entry references its i18n keys. The screen
 * resolves them at render time so each locale supplies its own label,
 * subject line, body template, and inline hint.
 */
interface CategoryKey {
  readonly id: string;
  readonly labelKey: string;
  readonly subjectKey: string;
  readonly bodyKey: string;
  readonly hintKey: string;
}

const CATEGORY_KEYS: readonly CategoryKey[] = [
  {
    id: 'general',
    labelKey: 'support.cat1Label',
    subjectKey: 'support.cat1Subject',
    bodyKey: 'support.cat1Body',
    hintKey: 'support.cat1Hint',
  },
  {
    id: 'account',
    labelKey: 'support.cat2Label',
    subjectKey: 'support.cat2Subject',
    bodyKey: 'support.cat2Body',
    hintKey: 'support.cat2Hint',
  },
  {
    id: 'billing',
    labelKey: 'support.cat3Label',
    subjectKey: 'support.cat3Subject',
    bodyKey: 'support.cat3Body',
    hintKey: 'support.cat3Hint',
  },
  {
    id: 'bug',
    labelKey: 'support.cat4Label',
    subjectKey: 'support.cat4Subject',
    bodyKey: 'support.cat4Body',
    hintKey: 'support.cat4Hint',
  },
  {
    id: 'feature',
    labelKey: 'support.cat5Label',
    subjectKey: 'support.cat5Subject',
    bodyKey: 'support.cat5Body',
    hintKey: 'support.cat5Hint',
  },
  {
    id: 'privacy',
    labelKey: 'support.cat6Label',
    subjectKey: 'support.cat6Subject',
    bodyKey: 'support.cat6Body',
    hintKey: 'support.cat6Hint',
  },
  {
    id: 'press',
    labelKey: 'support.cat7Label',
    subjectKey: 'support.cat7Subject',
    bodyKey: 'support.cat7Body',
    hintKey: 'support.cat7Hint',
  },
];

function buildMailto(subject: string, body: string): string {
  const s = encodeURIComponent(subject);
  const b = encodeURIComponent(`${body}\n\n`);
  return `mailto:${CONTACT_EMAIL}?subject=${s}&body=${b}`;
}

export default function ContactUsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  const openCategory = (cat: CategoryKey): void => {
    void Linking.openURL(buildMailto(t(cat.subjectKey), t(cat.bodyKey)));
  };

  const openPlainMail = (): void => {
    void Linking.openURL(`mailto:${CONTACT_EMAIL}`);
  };

  return (
    <Screen scroll gradient gradientVariant="cosmic">
      <GoldenHeader title={t('support.contactTitle')} onBack={() => router.back()} />

      <SacredCard style={[styles.card, styles.crisisCard]}>
        <Text style={[styles.eyebrow, styles.crisisEyebrow]}>
          {t('support.ifInCrisis')}
        </Text>
        <Text style={styles.crisisBody}>{t('support.contactCrisisBody')}</Text>
      </SacredCard>

      <SacredCard style={styles.card}>
        <Text style={styles.eyebrow}>{t('support.contactEyebrow')}</Text>
        <Text style={styles.intro}>{t('support.contactIntro')}</Text>

        <Pressable
          onPress={openPlainMail}
          accessibilityRole="link"
          accessibilityLabel={t('support.contactEmailA11y', { email: CONTACT_EMAIL })}
          style={styles.emailRow}
        >
          <Text style={styles.emailLabel}>{t('support.contactDirectEmail')}</Text>
          <Text style={styles.emailAddress}>{CONTACT_EMAIL}</Text>
        </Pressable>

        <View style={styles.categories}>
          {CATEGORY_KEYS.map((cat) => {
            const label = t(cat.labelKey);
            return (
              <Pressable
                key={cat.id}
                onPress={() => openCategory(cat)}
                accessibilityRole="button"
                accessibilityLabel={t('support.contactCategoryA11y', {
                  email: CONTACT_EMAIL,
                  label,
                })}
                style={({ pressed }) => [
                  styles.categoryRow,
                  pressed && styles.categoryRowPressed,
                ]}
              >
                <View style={styles.categoryText}>
                  <Text style={styles.categoryLabel}>{label}</Text>
                  <Text style={styles.categoryHint}>{t(cat.hintKey)}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.footer}>{t('support.contactFooter')}</Text>
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
  intro: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(240,235,225,0.78)',
    marginTop: 12,
    marginBottom: 18,
  },
  emailRow: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(212,160,23,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,160,23,0.4)',
    gap: 4,
  },
  emailLabel: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 12,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emailAddress: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 17,
    color: GOLD,
  },
  categories: {
    marginTop: 22,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(212,160,23,0.18)',
  },
  categoryRowPressed: {
    opacity: 0.6,
  },
  categoryText: {
    flex: 1,
    paddingRight: 12,
    gap: 2,
  },
  categoryLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    color: SACRED_WHITE,
  },
  categoryHint: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    color: TEXT_MUTED,
  },
  chevron: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 22,
    color: GOLD,
  },
  footer: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_MUTED,
    marginTop: 24,
    textAlign: 'center',
  },
});
