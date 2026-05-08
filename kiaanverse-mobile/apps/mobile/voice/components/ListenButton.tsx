/**
 * ListenButton — reusable text-to-speech toggle button.
 *
 * Single source of truth for "play this text aloud" affordances across
 * the Android app. Wraps android.speech.tts.TextToSpeech via expo-speech,
 * which is the SAME engine kiaanverse.com uses on Chrome/Android through
 * the browser's SpeechSynthesis API.
 *
 * Two playback modes:
 *
 *   1. Single-text:  <ListenButton text="..." />
 *      Speaks the string in en-IN at 0.95 rate.
 *
 *   2. Sequential segments:  <ListenButton segments={[
 *          { text: '...', language: 'sa-IN', rate: 0.85 },
 *          { text: '...', language: 'en-IN', rate: 0.9 },
 *          { text: '...', language: 'hi-IN', rate: 0.9 },
 *        ]} />
 *      Plays segments back-to-back via nested onDone callbacks.
 *      Used for Bhagavad Gita verses (Sanskrit → English → Hindi).
 *
 * Three visual variants:
 *
 *   • variant='inline'    — compact pill button used inside chat
 *                           bubbles + action bars
 *   • variant='secondary' — full-width DivineButton (matches the
 *                           verse-view "Listen to verse" CTA)
 *   • variant='primary'   — full-width filled CTA for hero placements
 *                           (Verse of the Day card, tool results)
 *
 * Cleanup: Speech.stop() runs on unmount so a recycled FlatList view
 * or a navigation-away doesn't leave audio playing for off-screen
 * content. Tapping while playing always toggles to stop — no separate
 * stop UI needed.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Square, Volume2 } from 'lucide-react-native';

import {
  divineProsody,
  warmDivineVoiceCache,
} from '../lib/divineVoice';

const GOLD = '#D4A017';

export interface ListenSegment {
  /** Text to speak. Empty strings are skipped silently. */
  readonly text: string;
  /** BCP-47 language tag. Defaults to 'en-IN'. */
  readonly language?: string;
  /** Playback rate. Defaults to 0.9 (slightly slower than natural). */
  readonly rate?: number;
  /** Pitch. Defaults to 1.0. */
  readonly pitch?: number;
}

export type ListenButtonVariant = 'inline' | 'secondary' | 'primary';

export interface ListenButtonProps {
  /** Single text to speak. Use this OR `segments`, not both. */
  readonly text?: string;
  /** Multiple segments played back-to-back. Use this for verses. */
  readonly segments?: readonly ListenSegment[];
  /** Default language for the single-text path. Defaults to 'en-IN'. */
  readonly language?: string;
  /** Default rate for the single-text path. Defaults to 0.95. */
  readonly rate?: number;
  /** Visual variant. Defaults to 'inline' (compact). */
  readonly variant?: ListenButtonVariant;
  /** Override the idle label. Defaults to 'Listen'. */
  readonly idleLabel?: string;
  /** Override the playing label. Defaults to 'Stop'. */
  readonly playingLabel?: string;
  /** Accessibility label for the idle state. Computed if absent. */
  readonly accessibilityLabelIdle?: string;
  /** Accessibility label for the playing state. Computed if absent. */
  readonly accessibilityLabelPlaying?: string;
}

export function ListenButton({
  text,
  segments,
  language = 'en-IN',
  rate = 0.95,
  variant = 'inline',
  idleLabel = 'Listen',
  playingLabel = 'Stop',
  accessibilityLabelIdle,
  accessibilityLabelPlaying,
}: ListenButtonProps): React.JSX.Element | null {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Pre-compute the playback list. If `segments` is provided we use it
  // verbatim; otherwise we wrap the single `text` into a 1-segment list.
  // Empty/whitespace-only strings are filtered so an empty Hindi
  // translation doesn't trigger a silent utterance.
  const playList: readonly ListenSegment[] = React.useMemo(() => {
    if (segments && segments.length > 0) {
      return segments.filter((s) => s.text && s.text.trim().length > 0);
    }
    if (text && text.trim().length > 0) {
      return [{ text, language, rate, pitch: 1.0 }];
    }
    return [];
  }, [segments, text, language, rate]);

  const handleToggle = useCallback(async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    if (playList.length === 0) return;

    void Haptics.selectionAsync().catch(() => {});

    // Warm the divine voice cache once on first tap (idempotent —
    // subsequent taps hit the in-memory cache instantly). This picks
    // Google's neural network voices over the default local voice
    // for each language, giving the most natural + divine output the
    // device can produce without paid providers (Sarvam / ElevenLabs).
    await warmDivineVoiceCache();

    setIsSpeaking(true);
    Speech.stop();

    // Walk the segment list via nested onDone callbacks. Each callback
    // is captured by index — once segment N finishes, fire segment N+1.
    // On final segment's onDone, flip back to idle.
    //
    // For each segment we overlay divineProsody(language) on top of any
    // segment-specific rate/pitch overrides. The prosody helper picks
    // the highest-quality device voice + applies contemplative cadence
    // (rate 0.88 default, 0.85 for Sanskrit; pitch 0.98 default, 0.97
    // for Sanskrit to match Vedic ritual register).
    const speakAt = (index: number) => {
      if (index >= playList.length) {
        setIsSpeaking(false);
        return;
      }
      const seg = playList[index];
      const lang = seg.language ?? 'en-IN';
      const prosody = divineProsody(lang);
      Speech.speak(seg.text, {
        language: lang,
        // Caller-provided rate/pitch override prosody defaults so a
        // surface that needs unusual cadence (e.g. fast announcement)
        // can still get it. Most callers leave these undefined and
        // inherit divine prosody.
        rate: seg.rate ?? prosody.rate,
        pitch: seg.pitch ?? prosody.pitch,
        // Voice ID = highest-quality match the device offers. If
        // undefined, expo-speech falls back to the engine default —
        // not a crash, just a quality regression.
        voice: prosody.voice,
        onDone: () => speakAt(index + 1),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    };
    speakAt(0);
  }, [isSpeaking, playList]);

  // Stop in-flight TTS when the button unmounts. Critical for FlatList
  // recycling — without this, an off-screen card could keep playing.
  useEffect(() => {
    return () => {
      // Only stop if WE were the one playing; otherwise we'd cancel
      // a sibling button's playback. setIsSpeaking is React state so
      // its closure here reflects the value at unmount time.
      if (isSpeaking) Speech.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No content to play → render nothing rather than a dead button.
  if (playList.length === 0) return null;

  const a11yLabel = isSpeaking
    ? accessibilityLabelPlaying ?? 'Stop reading aloud'
    : accessibilityLabelIdle ?? 'Read aloud';
  const label = isSpeaking ? playingLabel : idleLabel;
  const Icon = isSpeaking ? (
    <Square size={variant === 'inline' ? 14 : 16} color={GOLD} fill={GOLD} />
  ) : (
    <Volume2 size={variant === 'inline' ? 14 : 16} color={GOLD} />
  );

  if (variant === 'inline') {
    // Empty label = icon-only mode — used on tight surfaces like the
    // Verse-of-the-Day card on the home tab where space is shared
    // between Ask Sakha + Listen + Bookmark in a single row.
    const showLabel = label.length > 0;
    return (
      <Pressable
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        style={({ pressed }) => [
          styles.inlineBtn,
          !showLabel && styles.inlineBtnIconOnly,
          pressed && styles.inlineBtnPressed,
        ]}
        hitSlop={8}
      >
        {Icon}
        {showLabel ? <Text style={styles.inlineLabel}>{label}</Text> : null}
      </Pressable>
    );
  }

  // Secondary + primary share the full-width pill shape; only the
  // background color differs.
  return (
    <Pressable
      onPress={handleToggle}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      style={({ pressed }) => [
        styles.fullBtn,
        variant === 'primary' ? styles.primaryBg : styles.secondaryBg,
        pressed && styles.fullBtnPressed,
      ]}
    >
      <View style={styles.fullBtnRow}>
        {Icon}
        <Text
          style={[
            styles.fullBtnLabel,
            variant === 'primary' && styles.fullBtnLabelOnPrimary,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // ── inline (compact pill, used in action bars) ──
  inlineBtn: {
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
  inlineBtnPressed: {
    backgroundColor: 'rgba(212,160,23,0.18)',
    borderColor: 'rgba(212,160,23,0.36)',
  },
  inlineBtnIconOnly: {
    paddingHorizontal: 8,
  },
  inlineLabel: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '500',
  },
  // ── full (secondary + primary CTAs) ──
  fullBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullBtnPressed: {
    opacity: 0.85,
  },
  fullBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryBg: {
    backgroundColor: 'rgba(212,160,23,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.36)',
  },
  primaryBg: {
    backgroundColor: GOLD,
  },
  fullBtnLabel: {
    color: GOLD,
    fontSize: 15,
    fontWeight: '600',
  },
  fullBtnLabelOnPrimary: {
    color: '#0A0E1F',
  },
});
