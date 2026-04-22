/**
 * Ardha — Result screen.
 *
 * 1:1 adaptation of the response view at kiaanverse.com/m/ardha: the
 * "Ardha's Reframe" card (header, ⚡ Quick Reframe badge, timestamp,
 * Copy + 🔊 audio controls, Expand / Collapse / Full Text), the 5-pillar
 * accordion (Dharma Alignment expanded by default), the ARDHA Analysis
 * block below the card (Detected: + pillars), and three bottom actions:
 * Return to Home, Journal This, Reframe Again.
 *
 * The payload arrives via router params as a JSON-stringified
 * `ArdhaStructuredResponse` from the input screen. On a cold start with
 * no params (deep link, refresh) we bounce back to the input screen
 * rather than rendering an empty card.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-react-native';
import {
  DivineBackground,
  GoldenHeader,
  Text,
  colors,
  fontFamily,
  radii,
  spacing,
  useSpeechOutput,
} from '@kiaanverse/ui';
import type { ArdhaStructuredResponse } from '@kiaanverse/api';

/** Which section is open by default on first render. Matches the web. */
const DEFAULT_OPEN_SECTION = 'dharma_alignment';

type ExpandMode = 'accordion' | 'all' | 'none' | 'full_text';

function formatTimestamp(now: Date): string {
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}, ${hh}:${mi}:${ss}`;
}

export default function ArdhaResultScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ payload?: string }>();
  const { speak, stop, isSpeaking } = useSpeechOutput();

  // Parse payload once — if it fails or is missing, bounce back to input.
  const payload = useMemo<ArdhaStructuredResponse | null>(() => {
    if (!params.payload) return null;
    try {
      return JSON.parse(params.payload) as ArdhaStructuredResponse;
    } catch {
      return null;
    }
  }, [params.payload]);

  useEffect(() => {
    if (!payload) router.replace('/tools/ardha');
  }, [payload, router]);

  // Stop any ongoing speech when the screen unmounts.
  useEffect(() => () => stop(), [stop]);

  const [expandMode, setExpandMode] = useState<ExpandMode>('accordion');
  const [openSection, setOpenSection] = useState<string>(DEFAULT_OPEN_SECTION);
  // Frozen timestamp — captured on mount so it matches when the reframe
  // was received, not when the user later taps expand.
  const [timestamp] = useState(() => formatTimestamp(new Date()));

  const handleToggleSection = useCallback(
    (key: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (expandMode !== 'accordion') setExpandMode('accordion');
      setOpenSection((prev) => (prev === key ? '' : key));
    },
    [expandMode],
  );

  const handleExpandAll = useCallback(() => {
    Haptics.selectionAsync();
    setExpandMode('all');
  }, []);
  const handleCollapseAll = useCallback(() => {
    Haptics.selectionAsync();
    setExpandMode('none');
    setOpenSection('');
  }, []);
  const handleFullText = useCallback(() => {
    Haptics.selectionAsync();
    setExpandMode((m) => (m === 'full_text' ? 'accordion' : 'full_text'));
  }, []);

  const handleCopy = useCallback(async () => {
    if (!payload) return;
    Haptics.selectionAsync();
    try {
      // Share sheet doubles as Copy on mobile — every OS exposes "Copy"
      // as one of its share targets, and we avoid adding a clipboard dep.
      await Share.share({ message: payload.fullText, title: "Ardha's Reframe" });
    } catch {
      // User dismissed the sheet; nothing to do.
    }
  }, [payload]);

  const handleSpeak = useCallback(() => {
    if (!payload) return;
    Haptics.selectionAsync();
    if (isSpeaking) {
      stop();
    } else {
      speak(payload.fullText);
    }
  }, [payload, isSpeaking, speak, stop]);

  const handleReturnHome = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)');
  }, [router]);

  const handleJournal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // journal/new.tsx doesn't currently read a seed param, so we route
    // there plainly rather than promising a pre-fill that doesn't happen.
    // The Copy button above is the explicit path to carry the reframe
    // text into any journal, chat, or notes app.
    router.push('/journal/new');
  }, [router]);

  const handleReframeAgain = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/tools/ardha');
  }, [router]);

  if (!payload) {
    // Redirect effect above handles this — return the dark shell so the
    // screen never flashes empty content.
    return <DivineBackground variant="cosmic" style={styles.root}><></></DivineBackground>;
  }

  const sections = payload.sections;
  const analysis = payload.analysis;
  // Crisis path: backend returns a compassionate support message with no
  // pillar headings. Rendering it inside the accordion buries it behind
  // a chevron under an unrelated "Dharma Alignment" label — show it
  // directly instead, and hide the Expand/Collapse/Full-Text controls
  // that don't apply to a single plain paragraph.
  const isCrisis = analysis.crisisDetected;

  return (
    <DivineBackground variant="cosmic" style={styles.root}>
      <GoldenHeader title="Ardha" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Ardha's Reframe card ─────────────────────────────── */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardIconBubble}>
              <Text style={styles.cardIcon}>🔄</Text>
            </View>
            <View style={styles.cardTitleBlock}>
              <Text style={styles.cardTitle}>Ardha's{'\n'}Reframe</Text>
              <View style={styles.quickBadge}>
                <Text style={styles.quickBadgeText}>⚡ Quick Reframe</Text>
              </View>
              <Text style={styles.timestamp}>{timestamp}</Text>
            </View>
            <View style={styles.topActions}>
              <Pressable
                onPress={handleCopy}
                style={({ pressed }) => [
                  styles.copyButton,
                  pressed && styles.pressedFade,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Copy reframe text"
              >
                <Text style={styles.copyButtonText}>Copy</Text>
              </Pressable>
              <Pressable
                onPress={handleSpeak}
                style={({ pressed }) => [
                  styles.audioButton,
                  pressed && styles.pressedFade,
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  isSpeaking ? 'Stop audio playback' : 'Listen to reframe'
                }
              >
                {isSpeaking ? (
                  <VolumeX size={18} color={colors.primary[500]} />
                ) : (
                  <Volume2 size={18} color={colors.primary[500]} />
                )}
              </Pressable>
            </View>
          </View>

          <View style={[styles.controlsRow, isCrisis && styles.hidden]}>
            {[
              { key: 'expand', label: 'Expand All', onPress: handleExpandAll },
              { key: 'collapse', label: 'Collapse All', onPress: handleCollapseAll },
              { key: 'full', label: 'Full Text', onPress: handleFullText },
            ].map((c) => (
              <Pressable
                key={c.key}
                onPress={c.onPress}
                style={({ pressed }) => [
                  styles.controlChip,
                  ((c.key === 'expand' && expandMode === 'all') ||
                    (c.key === 'collapse' && expandMode === 'none') ||
                    (c.key === 'full' && expandMode === 'full_text')) &&
                    styles.controlChipActive,
                  pressed && styles.pressedFade,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.controlChipText}>{c.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Sections OR full text OR crisis body */}
          {isCrisis ? (
            <View style={styles.crisisBlock}>
              <Text style={styles.crisisBody}>{payload.fullText}</Text>
            </View>
          ) : expandMode === 'full_text' ? (
            <View style={styles.fullTextBlock}>
              <Text style={styles.fullTextBody}>{payload.fullText}</Text>
            </View>
          ) : (
            <View>
              {sections.length === 0 ? (
                <View style={styles.emptyBlock}>
                  <Text style={styles.emptyText}>
                    ARDHA returned an empty reframe. Please try again.
                  </Text>
                </View>
              ) : (
                sections.map((section) => {
                  const isOpen =
                    expandMode === 'all' ||
                    (expandMode !== 'none' && openSection === section.key);
                  return (
                    <View key={section.key} style={styles.sectionCard}>
                      <Pressable
                        onPress={() => handleToggleSection(section.key)}
                        style={({ pressed }) => [
                          styles.sectionHeader,
                          pressed && styles.pressedFade,
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: isOpen }}
                        accessibilityLabel={`${section.label} section`}
                      >
                        <Text style={styles.sectionIcon}>{section.icon}</Text>
                        <Text style={styles.sectionLabel}>{section.label}</Text>
                        {isOpen ? (
                          <ChevronUp size={16} color={colors.primary[500]} />
                        ) : (
                          <ChevronDown size={16} color={colors.primary[500]} />
                        )}
                      </Pressable>
                      {isOpen ? (
                        <View style={styles.sectionBody}>
                          <View style={styles.sectionDivider} />
                          <Text style={styles.sectionContent}>{section.content}</Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          )}

          <Text style={styles.cardFooter}>
            💙 Here to help you navigate this with clarity and compassion
          </Text>
        </Animated.View>

        {/* ── ARDHA Analysis block ─────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(120)}
          style={styles.analysisBlock}
        >
          <View style={styles.analysisHeaderRow}>
            <View style={styles.analysisDot} />
            <Text style={styles.analysisHeader}>ARDHA Analysis</Text>
          </View>

          {analysis.detected && !isCrisis ? (
            <View style={styles.detectedRow}>
              <Text style={styles.detectedLabel}>Detected: </Text>
              <Text style={styles.detectedValue}>{analysis.detected}</Text>
            </View>
          ) : null}

          {isCrisis ? (
            <Text style={styles.crisisCareLine}>
              ARDHA has paused reframing. What you are feeling deserves direct,
              compassionate support — please reach out to the people and helplines
              listed above.
            </Text>
          ) : analysis.pillars.length > 0 ? (
            analysis.pillars.map((pillar, i) => (
              <View key={`${pillar.badge}-${i}`} style={styles.analysisPillarRow}>
                <View style={styles.analysisPillarBadge}>
                  <Text style={styles.analysisPillarBadgeText}>{pillar.badge}</Text>
                </View>
                <View style={styles.analysisPillarBody}>
                  <Text style={styles.analysisPillarName}>
                    {pillar.name}
                    {pillar.sanskrit ? (
                      <Text style={styles.analysisPillarSanskrit}>
                        {' '}
                        ({pillar.sanskrit})
                      </Text>
                    ) : null}
                  </Text>
                  {pillar.question ? (
                    <Text style={styles.analysisPillarQuestion}>
                      {pillar.question}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.analysisEmpty}>
              No pillars were flagged — ARDHA read this as a neutral inquiry.
            </Text>
          )}

          {!isCrisis && payload.compliance.maxScore > 0 ? (
            <Text style={styles.complianceLine}>
              Compliance {payload.compliance.score}/{payload.compliance.maxScore}
              {payload.fallback ? ' · template fallback' : ''}
            </Text>
          ) : null}
        </Animated.View>

        {/* ── Action buttons ──────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(200)}
          style={styles.actionsBlock}
        >
          <Pressable
            onPress={handleReturnHome}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.pressedFade,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>Return to Home</Text>
          </Pressable>
          <Pressable
            onPress={handleJournal}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.pressedFade,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>Journal This</Text>
          </Pressable>
          <Pressable
            onPress={handleReframeAgain}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.pressedFade,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>Reframe Again</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </DivineBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  pressedFade: { opacity: 0.7 },

  // ── Reframe card ───────────────────────────────────────────────────
  card: {
    backgroundColor: 'rgba(14,18,42,0.95)',
    borderWidth: 1,
    borderColor: colors.alpha.goldStrong,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardIconBubble: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.alpha.krishnaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: { fontSize: 22 },
  cardTitleBlock: { flex: 1, gap: spacing.xxs },
  cardTitle: {
    fontFamily: fontFamily.divineItalic,
    fontSize: 22,
    lineHeight: 28,
    color: colors.primary[300],
  },
  quickBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(6,182,212,0.18)',
    borderRadius: radii.xl,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: 2,
  },
  quickBadgeText: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.divine.peacockBright,
  },
  timestamp: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  topActions: {
    gap: spacing.xs,
    alignItems: 'flex-end',
  },
  copyButton: {
    borderWidth: 1,
    borderColor: colors.alpha.whiteStrong,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  copyButtonText: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.text.secondary,
  },
  audioButton: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.alpha.goldMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Controls row ───────────────────────────────────────────────────
  controlsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  controlChip: {
    borderWidth: 1,
    borderColor: colors.alpha.goldLight,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  controlChipActive: {
    borderColor: colors.alpha.goldStrong,
    backgroundColor: colors.alpha.goldLight,
  },
  controlChipText: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.text.secondary,
  },

  // ── Sections accordion ─────────────────────────────────────────────
  sectionCard: {
    backgroundColor: 'rgba(22,26,66,0.6)',
    borderRadius: radii.md,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  sectionIcon: { fontSize: 18 },
  sectionLabel: {
    flex: 1,
    fontFamily: fontFamily.divineItalic,
    fontSize: 17,
    color: colors.primary[300],
  },
  sectionBody: {
    backgroundColor: 'rgba(14,18,42,0.85)',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.alpha.goldLight,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.primary,
  },

  // ── Full text view ─────────────────────────────────────────────────
  fullTextBlock: {
    backgroundColor: 'rgba(14,18,42,0.85)',
    borderRadius: radii.md,
    padding: spacing.md,
  },
  fullTextBody: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.primary,
  },

  // ── Crisis render ──────────────────────────────────────────────────
  // Plain paragraph style with a soft warning tint, no accordion.
  crisisBlock: {
    backgroundColor: 'rgba(192,57,43,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.35)',
    borderRadius: radii.md,
    padding: spacing.md,
  },
  crisisBody: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 24,
    color: colors.text.primary,
  },
  crisisCareLine: {
    fontFamily: fontFamily.scriptureItalic,
    fontSize: 13,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  hidden: { display: 'none' },

  emptyBlock: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fontFamily.scriptureItalic,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  cardFooter: {
    fontFamily: fontFamily.scriptureItalic,
    fontSize: 13,
    color: 'rgba(100,149,237,0.7)',
    textAlign: 'center',
    marginTop: spacing.md,
  },

  // ── ARDHA Analysis ─────────────────────────────────────────────────
  analysisBlock: {
    backgroundColor: 'rgba(22,26,66,0.85)',
    borderWidth: 1,
    borderColor: colors.alpha.goldLight,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  analysisHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  analysisDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },
  analysisHeader: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.primary[500],
  },
  detectedRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  detectedLabel: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: colors.text.secondary,
  },
  detectedValue: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.primary[500],
    textTransform: 'capitalize',
  },
  analysisPillarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  analysisPillarBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.alpha.goldLight,
    borderWidth: 1,
    borderColor: colors.alpha.goldStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisPillarBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: colors.primary[500],
  },
  analysisPillarBody: { flex: 1 },
  analysisPillarName: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.text.primary,
  },
  analysisPillarSanskrit: {
    fontFamily: fontFamily.scriptureItalic,
    fontSize: 12,
    color: colors.text.muted,
  },
  analysisPillarQuestion: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  analysisEmpty: {
    fontFamily: fontFamily.scriptureItalic,
    fontSize: 13,
    color: colors.text.muted,
  },
  complianceLine: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.text.muted,
    textAlign: 'right',
  },

  // ── Action buttons ─────────────────────────────────────────────────
  actionsBlock: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: colors.alpha.goldStrong,
    borderRadius: radii.xl,
    paddingVertical: 15,
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: fontFamily.divineItalic,
    fontSize: 17,
    color: colors.text.primary,
  },
});
