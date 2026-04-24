/**
 * WisdomPhase — Phase 3 of Nitya Sadhana: contemplate today's verse.
 *
 * Renders the shared ShlokaCard (gold-shimmer top + VerseRevelation
 * word-by-word Sanskrit reveal) and an "Ask Sakha" secondary CTA that
 * deep-links into the Sakha chat with the verse pre-filled as context.
 *
 * The verse defaults to BG 2.47 (karmaṇy-evādhikāras te…) until the
 * backend's /api/sadhana/daily route exposes a real shloka. When the
 * parent has a better source, it can pass `verse` directly.
 */

import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { DivineButton, ShlokaCard } from '@kiaanverse/ui';

const SACRED_WHITE = '#F5F0E8';
const GOLD = '#D4A017';
const TEXT_MUTED = 'rgba(240,235,225,0.6)';

export interface WisdomVerse {
  readonly sanskrit: string;
  readonly transliteration: string;
  readonly meaning: string;
  readonly reference: string;
}

const DEFAULT_VERSE: WisdomVerse = {
  sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।',
  transliteration: 'karmaṇy-evādhikāras te mā phaleṣu kadācana',
  meaning:
    'You have a right to perform your duty, but not to the fruits of your action. Let the fruit never be the motive of your work.',
  reference: 'Bhagavad Gita 2.47',
};

export interface WisdomPhaseProps {
  /** Optional verse override — otherwise falls back to BG 2.47. */
  readonly verse?: WisdomVerse | undefined;
  readonly onComplete: () => void;
}

function WisdomPhaseInner({
  verse,
  onComplete,
}: WisdomPhaseProps): React.JSX.Element {
  const router = useRouter();
  const active = verse ?? DEFAULT_VERSE;

  const handleAskSakha = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(tabs)/chat',
      params: {
        context: `Please explain ${active.reference}: ${active.sanskrit} — ${active.meaning}`,
      },
    });
  }, [active, router]);

  return (
    <View style={styles.wrap}>
      <View style={styles.titleBlock}>
        <Text style={styles.phaseLabel} allowFontScaling={false}>
          PHASE III
        </Text>
        <Text style={styles.phaseName}>Wisdom</Text>
        <Text style={styles.sanskrit} allowFontScaling={false}>
          श्रवण · Shravana
        </Text>
      </View>

      <View style={styles.cardWrap}>
        <ShlokaCard
          sanskrit={active.sanskrit}
          transliteration={active.transliteration}
          meaning={active.meaning}
          reference={active.reference}
        />
      </View>

      <View style={styles.helperBlock}>
        <Text style={styles.helper}>
          Sit with the verse. When you are ready, invite Sakha for a deeper
          meaning or continue when settled.
        </Text>
      </View>

      <View style={styles.ctaRow}>
        <DivineButton
          title="Ask Sakha"
          variant="secondary"
          onPress={handleAskSakha}
          style={styles.askBtn}
        />
        <DivineButton
          title="Complete Phase"
          variant="primary"
          onPress={onComplete}
          style={styles.continueBtn}
        />
      </View>
    </View>
  );
}

/** Phase 3 — contemplate today's shloka, optionally invite Sakha. */
export const WisdomPhase = React.memo(WisdomPhaseInner);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 16,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 4,
  },
  phaseLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 2,
  },
  phaseName: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 28,
    color: SACRED_WHITE,
    letterSpacing: 0.4,
  },
  sanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 14,
    lineHeight: 28,
    color: GOLD,
    textAlign: 'center',
  },
  cardWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  helperBlock: {
    paddingHorizontal: 8,
  },
  helper: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 20,
    textAlign: 'center',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  askBtn: {
    flex: 1,
  },
  continueBtn: {
    flex: 1,
  },
});
