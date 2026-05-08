/**
 * MessageActionBar — reusable Listen / Copy / Share / Journal action row.
 *
 * Single source of truth for "what can the user do with this Sakha
 * narrative?" affordances. Drop-in for the bottom of any message
 * bubble, tool result card, wisdom-room reply, daily-wisdom card, etc.
 *
 * Mirrors the desktop SakhaMessageBubble's action set on
 * kiaanverse.com so the Android app gives users the same options
 * (the user explicitly asked for share / save / play sound on
 * every Sakha response).
 *
 * Action wiring:
 *   • Listen   → expo-speech (= android.speech.tts.TextToSpeech).
 *                Same engine kiaanverse.com Chrome uses through
 *                window.speechSynthesis.
 *   • Copy     → opens Android share sheet which surfaces system
 *                "Copy to clipboard" as one of its options. This
 *                avoids adding expo-clipboard (~30KB) just for one
 *                button — the Android share sheet is the native UX.
 *   • Share    → same Share.share() flow; exposes social media +
 *                messaging targets.
 *   • Journal  → router.push('/sacred-reflections') with a
 *                JSON-encoded `prefill` query param matching the
 *                contract the Sacred Reflections editor accepts
 *                (see voice/hooks/useToolInvocation.ts:62 →
 *                TOOL_ROUTES.SACRED_REFLECTIONS).
 *
 * Each action handler is fire-and-forget with its own try/catch.
 * A Share-sheet cancel or a TTS engine hiccup must NOT crash the
 * surrounding bubble — these are nice-to-have actions surrounding
 * a message that already rendered correctly.
 */

import React, { useCallback } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { BookHeart, Copy, Share2 } from 'lucide-react-native';

import { ListenButton } from './ListenButton';

const GOLD = '#D4A017';

export interface MessageActionBarProps {
  /** The text to act on. Required — defines what gets read / shared / saved. */
  readonly text: string;
  /** Suffix appended when sharing. Defaults to '— Sakha · Kiaanverse'.
   *  Override per surface (e.g. 'Bhagavad Gita 2.47 · Kiaanverse'). */
  readonly shareSuffix?: string;
  /** Optional pre-share title (Android share sheet title). */
  readonly shareTitle?: string;
  /** Source tag for Sacred Reflections prefill. Defaults to 'sakha'. */
  readonly journalSource?: string;
  /** Optional verse reference to pre-fill on the journal. */
  readonly journalVerseRef?: string;
  /** Hide the Listen button (e.g. when the surrounding card already has one). */
  readonly hideListen?: boolean;
  /** Hide the Journal button (e.g. when the surface IS the journal). */
  readonly hideJournal?: boolean;
}

export function MessageActionBar({
  text,
  shareSuffix = '— Sakha · Kiaanverse',
  shareTitle,
  journalSource = 'sakha',
  journalVerseRef,
  hideListen = false,
  hideJournal = false,
}: MessageActionBarProps): React.JSX.Element {
  const router = useRouter();

  const handleShare = useCallback(async () => {
    void Haptics.selectionAsync().catch(() => {});
    try {
      await Share.share({
        title: shareTitle,
        message: `${text}\n\n${shareSuffix}`,
      });
    } catch {
      // User cancelled or share sheet unavailable — no state to
      // unwind. The original message stays in the surrounding card.
    }
  }, [text, shareSuffix, shareTitle]);

  const handleJournal = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    router.push({
      pathname: '/sacred-reflections',
      params: {
        prefill: JSON.stringify({
          prefill_text: text,
          source: journalSource,
          ...(journalVerseRef ? { verse_ref: journalVerseRef } : {}),
        }),
      },
    });
  }, [text, router, journalSource, journalVerseRef]);

  return (
    <View style={styles.actionBar}>
      {!hideListen ? <ListenButton text={text} variant="inline" /> : null}

      <Pressable
        onPress={handleShare}
        accessibilityRole="button"
        accessibilityLabel="Copy or share"
        style={({ pressed }) => [
          styles.actionBtn,
          pressed && styles.actionBtnPressed,
        ]}
        hitSlop={8}
      >
        <Copy size={14} color={GOLD} />
        <Text style={styles.actionLabel}>Copy</Text>
      </Pressable>

      <Pressable
        onPress={handleShare}
        accessibilityRole="button"
        accessibilityLabel="Share to social media or messaging app"
        style={({ pressed }) => [
          styles.actionBtn,
          pressed && styles.actionBtnPressed,
        ]}
        hitSlop={8}
      >
        <Share2 size={14} color={GOLD} />
        <Text style={styles.actionLabel}>Share</Text>
      </Pressable>

      {!hideJournal ? (
        <Pressable
          onPress={handleJournal}
          accessibilityRole="button"
          accessibilityLabel="Save to Sacred Reflections journal"
          style={({ pressed }) => [
            styles.actionBtn,
            pressed && styles.actionBtnPressed,
          ]}
          hitSlop={8}
        >
          <BookHeart size={14} color={GOLD} />
          <Text style={styles.actionLabel}>Journal</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,160,23,0.12)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(212,160,23,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.18)',
  },
  actionBtnPressed: {
    backgroundColor: 'rgba(212,160,23,0.18)',
    borderColor: 'rgba(212,160,23,0.36)',
  },
  actionLabel: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '500',
  },
});
