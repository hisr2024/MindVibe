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

const GOLD = '#D4A017';
const SACRED_WHITE = '#F0EBE1';
const TEXT_MUTED = 'rgba(240,235,225,0.62)';

interface Section {
  readonly heading: string;
  readonly body: string;
}

const SECTIONS: readonly Section[] = [
  {
    heading: 'On-Device Encryption',
    body:
      'Every Sacred Reflection is sealed with AES-256-GCM on your device ' +
      'using a key derived from your account secret. The server only ever ' +
      'stores the ciphertext plus plaintext metadata you choose (mood, ' +
      'tags, timestamp). Even our engineers cannot read your reflections.',
  },
  {
    heading: 'What We Store on Our Servers',
    body:
      '• Encrypted journal blobs (ciphertext only)\n' +
      '• Mood + tag metadata you select\n' +
      '• Journey progress (which step, how far)\n' +
      '• Verse bookmarks (chapter + verse only)\n' +
      '• Account metadata (email, name, language)\n' +
      '• Anonymized analytics (feature usage)',
  },
  {
    heading: 'What We Never Store',
    body:
      '• Your raw journal content\n' +
      '• Audio of your Sakha conversations (transcripts may be retained ' +
      'briefly for safety review and then deleted)\n' +
      '• Payment card details (handled by Google Play / App Store / Stripe)\n' +
      '• Any data we don’t explicitly need to operate the Service',
  },
  {
    heading: 'Where Your Data Lives',
    body:
      'Production data is stored in EU-region infrastructure (Frankfurt) ' +
      'with daily encrypted backups. We use Sentry for crash analytics ' +
      '(no PII), Cloudflare for content delivery, and Stripe / Google Play ' +
      '/ App Store for billing. None of these processors can read your ' +
      'encrypted reflections.',
  },
  {
    heading: 'Voice Companion Privacy',
    body:
      'When you speak with Sakha (KIAAN Voice Companion):\n' +
      '• Audio is streamed to our servers, transcribed, and discarded.\n' +
      '• Transcripts are PII-scrubbed before any logging.\n' +
      '• You can disable conversation history in Settings → Voice.\n' +
      '• Crisis-trigger conversations are reviewed by safety humans only.',
  },
  {
    heading: 'Retention',
    body:
      'Encrypted journals: kept until you delete them.\n' +
      'Account: kept until you delete your account.\n' +
      'Voice transcripts: 24 hours, then deleted.\n' +
      'Audit + safety logs: 90 days.\n' +
      'Backups: rolling 30-day window, then purged.',
  },
  {
    heading: 'Your Rights',
    body:
      'You can, at any time:\n' +
      '• Export every byte we hold for you (JSON + ciphertext bundle).\n' +
      '• Delete a single entry (irreversible after 7 days).\n' +
      '• Delete your account (permanent removal within 30 days).\n' +
      '• Withdraw consent for analytics.\n' +
      'Use Settings → Account → Data Controls, or email ' +
      'sacredquest2@gmail.com.',
  },
  {
    heading: 'Children',
    body:
      'Kiaanverse is intended for seekers aged 13 and above. We do not ' +
      'knowingly collect data from children under 13. If you believe a ' +
      'child has registered, please contact sacredquest2@gmail.com and ' +
      'we will remove the account.',
  },
  {
    heading: 'Updates',
    body:
      'We will tell you in-app at least 14 days before any material ' +
      'change to how your data is handled. The full legal Privacy Policy ' +
      'is also linked from the Profile tab → Legal section.',
  },
];

export default function DataAndPrivacyScreen(): React.JSX.Element {
  const router = useRouter();

  const openMail = (): void => {
    void Linking.openURL('mailto:sacredquest2@gmail.com');
  };

  return (
    <Screen scroll gradient gradientVariant="cosmic">
      <GoldenHeader title="Data & Privacy" onBack={() => router.back()} />

      <SacredCard style={styles.card}>
        <Text style={styles.eyebrow}>HOW YOUR DATA IS HANDLED</Text>
        <Text style={styles.lastUpdated}>Last Updated: May 2026</Text>

        <View style={styles.sections}>
          {SECTIONS.map((s) => (
            <View key={s.heading} style={styles.section}>
              <Text style={styles.heading}>{s.heading}</Text>
              <Text style={styles.body}>{s.body}</Text>
            </View>
          ))}

          <Pressable
            onPress={openMail}
            accessibilityRole="link"
            accessibilityLabel="Email sacredquest2@gmail.com"
            style={styles.contactRow}
          >
            <Text style={styles.contactLabel}>
              Questions? Write to us at
            </Text>
            <Text style={styles.contactEmail}>sacredquest2@gmail.com</Text>
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
