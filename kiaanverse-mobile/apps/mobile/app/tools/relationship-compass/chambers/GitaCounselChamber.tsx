/**
 * GitaCounselChamber — Chamber IV (Gita Counsel)
 *
 * Two states:
 *
 *   1. Loading — central mandala + cycling sacred messages while the API
 *      generates wisdom. Mirrors the screenshot: a softly-glowing yantra
 *      with the line "The dharmic wisdom is flowing..." underneath.
 *
 *   2. Ready — the "Relationship Compass's Transmission" card with:
 *        - Title + Gita-Wisdom badge + Copy + TTS buttons
 *        - Expand-All / Collapse-All / Full-Text controls
 *        - 7 expandable step cards driven by the CompassTransmission
 *        - Footer line "💙 Here to help you navigate this with clarity..."
 *      and a CTA to the next chamber (intention).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { GoldenButton } from '@kiaanverse/ui';

import type { CompassTransmission } from '../hooks/useCompassWisdom';

/**
 * Optional clipboard support — `expo-clipboard` may or may not be linked
 * in this Expo build. We try to load it lazily and fall back to a silent
 * no-op so the Copy button never crashes when the module is missing.
 */
type ClipboardLike = { setStringAsync(text: string): Promise<void> };
let Clipboard: ClipboardLike | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  Clipboard = require('expo-clipboard') as ClipboardLike;
} catch {
  Clipboard = null;
}

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200, 191, 168, 0.65)';
const GOLD = '#E8B54A';
const GOLD_DEEP = '#D4A017';
const CARD_BG = 'rgba(22, 26, 66, 0.65)';
const ROSE = '#F8AFAA';
const TRANSMISSION_BORDER = 'rgba(248, 175, 170, 0.18)';

const LOADING_MESSAGES: readonly string[] = [
  'The Compass is finding your direction...',
  'Reading the gunas of your connection...',
  'Krishna is illuminating the path...',
  'The dharmic wisdom is flowing...',
] as const;

export interface GitaCounselChamberProps {
  readonly loading: boolean;
  readonly transmission: CompassTransmission | null;
  readonly partnerName: string;
  readonly onContinue: () => void;
}

/** Slowly-pulsing yantra glyph shown during the wisdom-loading state. */
function YantraLoader(): React.JSX.Element {
  const opacity = useSharedValue(0.5);
  const scale = useSharedValue(0.96);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    scale.value = withRepeat(
      withTiming(1.03, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.yantraWrap, animatedStyle]}>
      <Svg width={130} height={130} viewBox="0 0 130 130">
        <Circle cx={65} cy={65} r={58} fill="rgba(22, 26, 66, 0.85)" stroke={GOLD} strokeWidth={1} />
        <Circle cx={65} cy={65} r={42} fill="none" stroke={GOLD} strokeOpacity={0.45} strokeWidth={0.8} />
        <Circle cx={65} cy={65} r={28} fill="none" stroke={GOLD} strokeOpacity={0.35} strokeWidth={0.8} />
        {/* Hex 1 */}
        <Path
          d="M65 30 L92 50 L92 80 L65 100 L38 80 L38 50 Z"
          fill="none"
          stroke={GOLD}
          strokeWidth={1}
        />
        {/* Hex 2 (inverted) */}
        <Path
          d="M65 100 L92 80 L92 50 L65 30 L38 50 L38 80 Z"
          fill="none"
          stroke={GOLD}
          strokeOpacity={0.55}
          strokeWidth={1}
        />
        {/* Cross axes */}
        <Line x1={20} y1={65} x2={110} y2={65} stroke={GOLD} strokeOpacity={0.18} strokeWidth={0.6} />
        <Line x1={65} y1={20} x2={65} y2={110} stroke={GOLD} strokeOpacity={0.18} strokeWidth={0.6} />
        <Circle cx={65} cy={65} r={4} fill={GOLD} />
        {/* 6 perimeter dots */}
        {[0, 60, 120, 180, 240, 300].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const cx = 65 + Math.cos(rad) * 58;
          const cy = 65 + Math.sin(rad) * 58;
          return <Circle key={deg} cx={cx} cy={cy} r={3} fill="#5BB7C7" />;
        })}
      </Svg>
    </Animated.View>
  );
}

function StepCard({
  step,
  expanded,
  onToggle,
}: {
  readonly step: CompassTransmission['steps'][number];
  readonly expanded: boolean;
  readonly onToggle: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.stepCard}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${step.title}, ${expanded ? 'collapse' : 'expand'}`}
        style={styles.stepHeader}
      >
        <Text style={styles.stepIcon}>{step.icon}</Text>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepCaret}>{expanded ? '⌃' : '⌄'}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.stepBody}>
          <Text style={styles.stepBodyText}>{step.body}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function GitaCounselChamber({
  loading,
  transmission,
  partnerName,
  onContinue,
}: GitaCounselChamberProps): React.JSX.Element {
  const [messageIndex, setMessageIndex] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showFullText, setShowFullText] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Cycle the loading message every 3 s while the API runs.
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(id);
  }, [loading]);

  // Open the first card by default once the transmission lands.
  useEffect(() => {
    if (!transmission) return;
    setExpanded({ [transmission.steps[0]?.id ?? '']: true });
  }, [transmission]);

  // Stop TTS if the chamber unmounts mid-speech.
  useEffect(() => {
    return () => {
      Speech.stop().catch(() => {});
    };
  }, []);

  const expandAll = useCallback(() => {
    if (!transmission) return;
    setExpanded(
      Object.fromEntries(transmission.steps.map((s) => [s.id, true])),
    );
  }, [transmission]);

  const collapseAll = useCallback(() => setExpanded({}), []);

  const toggleFullText = useCallback(() => setShowFullText((v) => !v), []);

  const toggleStep = useCallback(
    (id: string) => {
      void Haptics.selectionAsync().catch(() => {});
      setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    },
    [],
  );

  const onCopy = useCallback(async () => {
    if (!transmission) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (Clipboard) {
      await Clipboard.setStringAsync(transmission.fullText).catch(() => {});
    }
  }, [transmission]);

  const onSpeak = useCallback(async () => {
    if (!transmission) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    Speech.speak(transmission.fullText, {
      rate: 0.95,
      pitch: 1.0,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [isSpeaking, transmission]);

  const formattedTimestamp = useMemo(() => {
    if (!transmission) return '';
    const d = new Date(transmission.generatedAt);
    return `${d.toLocaleDateString('en-IN')}, ${d.toLocaleTimeString('en-IN', { hour12: false })}`;
  }, [transmission]);

  if (loading || !transmission) {
    return (
      <View style={styles.loadingRoot}>
        <YantraLoader />
        <Animated.Text
          key={messageIndex}
          entering={FadeIn.duration(450)}
          style={styles.loadingMessage}
        >
          {LOADING_MESSAGES[messageIndex]}
        </Animated.Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(420)} style={styles.transmissionCard}>
        <View style={styles.transmissionHeader}>
          <View style={styles.transmissionTitleBlock}>
            <Text style={styles.transmissionTitle}>
              Relationship Compass's
            </Text>
            <Text style={styles.transmissionTitle}>Transmission</Text>
            <View style={styles.badgeRow}>
              <View style={styles.gitaBadge}>
                <Text style={styles.gitaBadgeText}>
                  ॐ Gita Wisdom ({transmission.verseCount} verse
                  {transmission.verseCount === 1 ? '' : 's'})
                </Text>
              </View>
            </View>
            <Text style={styles.timestamp}>{formattedTimestamp}</Text>
          </View>

          <View style={styles.iconColumn}>
            <Pressable
              onPress={onCopy}
              accessibilityRole="button"
              accessibilityLabel="Copy transmission"
              style={styles.iconButton}
            >
              <Text style={styles.iconButtonLabel}>Copy</Text>
            </Pressable>
            <Pressable
              onPress={onSpeak}
              accessibilityRole="button"
              accessibilityLabel={isSpeaking ? 'Stop reading' : 'Read transmission aloud'}
              style={[styles.iconButton, styles.speakButton, isSpeaking && styles.speakButtonActive]}
            >
              <Text style={styles.iconButtonLabel}>{isSpeaking ? '⏸︎' : '🔊'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <Pressable onPress={expandAll} style={styles.controlPill}>
            <Text style={styles.controlPillText}>Expand All</Text>
          </Pressable>
          <Pressable onPress={collapseAll} style={styles.controlPill}>
            <Text style={styles.controlPillText}>Collapse All</Text>
          </Pressable>
          <Pressable onPress={toggleFullText} style={styles.controlPill}>
            <Text style={styles.controlPillText}>
              {showFullText ? 'Step View' : 'Full Text'}
            </Text>
          </Pressable>
        </View>

        {showFullText ? (
          <ScrollView style={styles.fullTextScroll}>
            <Text style={styles.fullText}>{transmission.fullText}</Text>
          </ScrollView>
        ) : (
          <View style={styles.stepStack}>
            {transmission.steps.map((step) => (
              <StepCard
                key={step.id}
                step={step}
                expanded={Boolean(expanded[step.id])}
                onToggle={() => toggleStep(step.id)}
              />
            ))}
          </View>
        )}

        <Animated.Text
          entering={FadeInDown.delay(120).duration(360)}
          style={styles.footer}
        >
          💙 Here to help you navigate this with clarity and compassion
        </Animated.Text>

        {transmission.source === 'fallback' ? (
          <Text style={styles.fallbackNotice}>
            Showing your offline guide while the network is calm.
          </Text>
        ) : null}
      </Animated.View>

      <View style={styles.cta}>
        <GoldenButton
          title={partnerName.trim() ? `Set Intention with ${partnerName.trim()}` : 'Set Your Dharmic Intention'}
          onPress={onContinue}
          variant="divine"
        />
      </View>
    </View>
  );
}

export default GitaCounselChamber;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  loadingRoot: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  yantraWrap: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GOLD,
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  loadingMessage: {
    color: TEXT_MUTED,
    fontFamily: 'CrimsonText-Italic',
    fontSize: 14,
    textAlign: 'center',
  },
  transmissionCard: {
    borderRadius: 20,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: TRANSMISSION_BORDER,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 14,
  },
  transmissionHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  transmissionTitleBlock: {
    flex: 1,
    gap: 4,
  },
  transmissionTitle: {
    color: ROSE,
    fontFamily: 'CormorantGaramond-LightItalic',
    fontSize: 24,
    lineHeight: 28,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  gitaBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(155, 90, 200, 0.16)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(180, 120, 220, 0.45)',
  },
  gitaBadgeText: {
    color: '#D6A6E8',
    fontSize: 12,
    fontWeight: '500',
  },
  timestamp: {
    color: TEXT_MUTED,
    fontSize: 11,
    marginTop: 8,
  },
  iconColumn: {
    flexDirection: 'column',
    gap: 8,
  },
  iconButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    minWidth: 56,
    alignItems: 'center',
  },
  iconButtonLabel: {
    color: SACRED_WHITE,
    fontSize: 13,
    fontWeight: '500',
  },
  speakButton: {
    backgroundColor: 'rgba(232, 181, 74, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(232, 181, 74, 0.45)',
  },
  speakButtonActive: {
    backgroundColor: 'rgba(232, 181, 74, 0.32)',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  controlPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  controlPillText: {
    color: SACRED_WHITE,
    fontSize: 12,
  },
  stepStack: {
    gap: 10,
  },
  stepCard: {
    borderRadius: 14,
    backgroundColor: 'rgba(40, 25, 50, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(248, 175, 170, 0.20)',
    overflow: 'hidden',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  stepIcon: {
    fontSize: 20,
  },
  stepTitle: {
    flex: 1,
    color: ROSE,
    fontFamily: 'CormorantGaramond-LightItalic',
    fontSize: 18,
  },
  stepCaret: {
    color: ROSE,
    fontSize: 20,
    width: 20,
    textAlign: 'center',
  },
  stepBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  stepBodyText: {
    color: SACRED_WHITE,
    fontSize: 14,
    lineHeight: 22,
  },
  fullTextScroll: {
    maxHeight: 360,
    backgroundColor: 'rgba(40, 25, 50, 0.55)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(248, 175, 170, 0.18)',
  },
  fullText: {
    color: SACRED_WHITE,
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    color: TEXT_MUTED,
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  fallbackNotice: {
    color: GOLD_DEEP,
    fontSize: 12,
    textAlign: 'center',
  },
  cta: {
    marginTop: 4,
  },
});
