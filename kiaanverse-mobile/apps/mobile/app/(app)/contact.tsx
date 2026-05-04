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

const GOLD = '#D4A017';
const SACRED_WHITE = '#F0EBE1';
const TEXT_MUTED = 'rgba(240,235,225,0.62)';
const CRISIS_RED = '#dc2626';

const CONTACT_EMAIL = 'sacredquest2@gmail.com';

interface Category {
  readonly label: string;
  readonly subject: string;
  readonly body: string;
  readonly hint: string;
}

const CATEGORIES: readonly Category[] = [
  {
    label: 'General question',
    subject: 'Kiaanverse — General question',
    body: 'Tell us what’s on your mind:',
    hint: 'We answer within 7 business days.',
  },
  {
    label: 'Account or login issue',
    subject: 'Kiaanverse — Account / login issue',
    body:
      'Please include:\n• The email you signed up with\n• What happens when ' +
      'you try to log in\n• Whether you can see this message means you’re ' +
      'logged in on at least one device\n\nDescription:',
    hint: 'Include your account email so we can locate the record.',
  },
  {
    label: 'Billing or subscription',
    subject: 'Kiaanverse — Billing / subscription',
    body:
      'Please include:\n• Your store order ID (visible in Google Play / App ' +
      'Store receipt)\n• What charge you’re asking about\n• Whether you ' +
      'are looking for a refund or a restoration\n\nDescription:',
    hint: 'Order IDs from your store receipt help us resolve faster.',
  },
  {
    label: 'Bug report',
    subject: 'Kiaanverse — Bug report',
    body:
      'Please include:\n• Device + Android / iOS version\n• What you ' +
      'expected to happen\n• What actually happened\n• Steps to reproduce ' +
      '(if you can)\n\nA screenshot or short screen-recording attached to ' +
      'this email is the single biggest accelerator.\n\nDescription:',
    hint: 'A screenshot or screen-recording cuts triage time in half.',
  },
  {
    label: 'Feature request',
    subject: 'Kiaanverse — Feature request',
    body:
      'Tell us about the moment when you wished the app could do this:',
    hint: 'Real stories beat abstract feature names.',
  },
  {
    label: 'Privacy or data export',
    subject: 'Kiaanverse — Privacy / data export request',
    body:
      'Please tell us:\n• Whether you want a full data export, a deletion, ' +
      'or another GDPR right\n• Your account email\n\nWe respond within 7 ' +
      'business days as required by GDPR.\n\nDescription:',
    hint: 'Per GDPR, we respond within 7 business days.',
  },
  {
    label: 'Press or partnerships',
    subject: 'Kiaanverse — Press / partnership inquiry',
    body: 'Tell us about your outlet or organisation and what you’re hoping to discuss:',
    hint: 'Please include your name, organisation, and timeline.',
  },
];

function buildMailto(category: Category): string {
  const subject = encodeURIComponent(category.subject);
  const body = encodeURIComponent(`${category.body}\n\n`);
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

export default function ContactUsScreen(): React.JSX.Element {
  const router = useRouter();

  const openCategory = (cat: Category): void => {
    void Linking.openURL(buildMailto(cat));
  };

  const openPlainMail = (): void => {
    void Linking.openURL(`mailto:${CONTACT_EMAIL}`);
  };

  return (
    <Screen scroll gradient gradientVariant="cosmic">
      <GoldenHeader title="Contact Us" onBack={() => router.back()} />

      <SacredCard style={[styles.card, styles.crisisCard]}>
        <Text style={[styles.eyebrow, styles.crisisEyebrow]}>
          IF YOU ARE IN CRISIS
        </Text>
        <Text style={styles.crisisBody}>
          We are not a crisis service and we cannot answer in real time.
          Please reach a trained human now. India: iCall +91-9152987821.
          US: dial or text 988. UK: 116 123. Or your local emergency
          number. We are here for everything else.
        </Text>
      </SacredCard>

      <SacredCard style={styles.card}>
        <Text style={styles.eyebrow}>WRITE TO US</Text>
        <Text style={styles.intro}>
          Pick the category that fits best — we use the subject line to
          route your message to the right person on our side.
        </Text>

        <Pressable
          onPress={openPlainMail}
          accessibilityRole="link"
          accessibilityLabel={`Email ${CONTACT_EMAIL}`}
          style={styles.emailRow}
        >
          <Text style={styles.emailLabel}>Direct email</Text>
          <Text style={styles.emailAddress}>{CONTACT_EMAIL}</Text>
        </Pressable>

        <View style={styles.categories}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.label}
              onPress={() => openCategory(cat)}
              accessibilityRole="button"
              accessibilityLabel={`Email ${CONTACT_EMAIL} about ${cat.label}`}
              style={({ pressed }) => [
                styles.categoryRow,
                pressed && styles.categoryRowPressed,
              ]}
            >
              <View style={styles.categoryText}>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                <Text style={styles.categoryHint}>{cat.hint}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.footer}>
          We are a small team. Every email is read by a human. We answer
          within 7 business days — usually much sooner.
        </Text>
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
