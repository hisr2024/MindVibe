/**
 * Privacy Policy — readable policy text rendered inside the app.
 *
 * Linked from Profile tab → "Privacy Policy" → `/(app)/privacy`.
 * Kept intentionally self-contained: no API calls, no state — the
 * content is baked into the bundle so it's available offline.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, GoldenHeader, SacredCard } from '@kiaanverse/ui';
import { Text } from 'react-native';

const GOLD = '#D4A017';
const SACRED_WHITE = '#F0EBE1';
const TEXT_MUTED = 'rgba(240,235,225,0.62)';

interface Section {
  readonly heading: string;
  readonly body: string;
}

const SECTIONS: readonly Section[] = [
  {
    heading: 'Effective Date & Scope',
    body:
      'This Privacy Policy applies to the Kiaanverse / MindVibe mobile ' +
      'application and any associated services (collectively, "the ' +
      'Service") operated by Kiaanverse. By using the Service you agree ' +
      'to the practices described below.',
  },
  {
    heading: '1. Your Journal Is Sacred',
    body:
      'Your journal entries are encrypted using AES-256-GCM directly on your ' +
      'device before being stored. Kiaanverse cannot read your journal content. ' +
      'Only you hold the key.',
  },
  {
    heading: '2. What We Collect',
    body:
      'We collect only what is necessary to provide the service:\n' +
      '• Account information (email, name)\n' +
      '• Usage metadata (which features you use, when)\n' +
      '• Journal metadata (mood labels, tags, timestamps — NOT content)\n' +
      '• Device information (for technical support)',
  },
  {
    heading: '3. What We Never Collect',
    body:
      '• Journal entry content (always encrypted, never readable by us)\n' +
      '• Your private conversations with Sakha (processed in memory only)\n' +
      '• Payment card details (handled by Google Play / Stripe)',
  },
  {
    heading: '4. KarmaLytix Privacy',
    body:
      'KarmaLytix analyzes only encrypted metadata — mood labels, tags, ' +
      'timestamps. Your journal words are never read. This is our sacred ' +
      'promise.',
  },
  {
    heading: '5. Data Sharing',
    body:
      'We do not sell your data. We do not share your data with advertisers. ' +
      'We share only what is required to operate the service (hosting, ' +
      'authentication providers).',
  },
  {
    heading: '6. Your Rights (GDPR)',
    body:
      'You have the right to access, correct, export, and delete your data. ' +
      'Contact: sacredquest2@gmail.com',
  },
  {
    heading: '7. Contact',
    body:
      'For privacy questions, data exports, or to exercise any of your ' +
      'rights, write to us at:\n\nsacredquest2@gmail.com\n\n' +
      'We answer every privacy email within 7 business days.',
  },
];

export default function PrivacyPolicyScreen(): React.JSX.Element {
  const router = useRouter();

  return (
    <Screen scroll gradient gradientVariant="cosmic">
      <GoldenHeader title="Privacy Policy" onBack={() => router.back()} />

      <SacredCard style={styles.card}>
        <Text style={styles.eyebrow}>KIAANVERSE PRIVACY POLICY</Text>
        <Text style={styles.lastUpdated}>Last Updated: May 2026</Text>

        <View style={styles.sections}>
          {SECTIONS.map((s) => (
            <View key={s.heading} style={styles.section}>
              <Text style={styles.heading}>{s.heading}</Text>
              <Text style={styles.body}>{s.body}</Text>
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
