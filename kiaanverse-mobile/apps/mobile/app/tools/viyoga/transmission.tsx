/**
 * Viyoga — Transmission Screen
 *
 * Displays Sakha's response as the "Viyoga's Transmission" card: a five-
 * section accordion that mirrors kiaanverse.com/m/viyog (I Get It /
 * A Different Way to See This / Try This Right Now / One Thing You Can
 * Do / Something to Consider). Progress flames across the top, card with
 * title + date + Expand/Collapse/Full-Text controls, and a
 * "Continue to Meditation →" button at the bottom.
 *
 * All content comes from `flow.aiResponse` which was shaped by
 * useSacredFlow's `submitFlow()` on the loading screen. If for any
 * reason the response is missing we surface a compassionate empty
 * state instead of a dead white card.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GoldenDivider } from '@kiaanverse/ui';
import { useSacredFlow } from '@/hooks/useSacredFlow';

// ── Section definitions — exact labels from the screenshot ────────────────

interface SectionDef {
  readonly icon: string;
  readonly label: string;
  readonly key: string;
}

const SECTIONS: readonly SectionDef[] = [
  { icon: '💚', label: 'I Get It', key: 'i_get_it' },
  { icon: '🔄', label: 'A Different Way to See This', key: 'different_way' },
  { icon: '⏱', label: 'Try This Right Now', key: 'try_right_now' },
  { icon: '✨', label: 'One Thing You Can Do', key: 'one_thing' },
  { icon: '💭', label: 'Something to Consider', key: 'something_consider' },
];

// ── Accordion section — controlled so Expand/Collapse All can drive it ────

interface AccordionSectionProps {
  readonly icon: string;
  readonly label: string;
  readonly content: string;
  readonly open: boolean;
  readonly onToggle: () => void;
}

function AccordionSection({
  icon,
  label,
  content,
  open,
  onToggle,
}: AccordionSectionProps): React.JSX.Element {
  const handlePress = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <View style={a.wrap}>
      <TouchableOpacity
        style={a.header}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        activeOpacity={0.75}
      >
        <Text style={a.icon}>{icon}</Text>
        <Text style={a.label}>{label}</Text>
        <Text style={a.chevron}>{open ? '∧' : '∨'}</Text>
      </TouchableOpacity>
      {open ? (
        <View style={a.body}>
          <Text style={a.content}>{content.length > 0 ? content : '—'}</Text>
        </View>
      ) : null}
    </View>
  );
}

const a = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.15)',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    backgroundColor: 'rgba(22,26,66,0.85)',
  },
  icon: {
    fontSize: 18,
  },
  label: {
    flex: 1,
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: '#D4A017',
  },
  chevron: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: 'rgba(212,160,23,0.6)',
  },
  body: {
    backgroundColor: 'rgba(14,18,42,0.9)',
    padding: 16,
  },
  content: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 15,
    color: '#F0EBE1',
    lineHeight: 26,
  },
});

// ── Screen ────────────────────────────────────────────────────────────────

const PROGRESS_FLAMES_TOTAL = 5;
const PROGRESS_FLAMES_LIT = 3;

function formatDate(): string {
  return new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ViyogaTransmission(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { flow, error } = useSacredFlow('viyoga');
  const result = flow.aiResponse;
  const separatedFrom = (flow.answers.separated_from ?? '').trim();

  // Per-section open/closed state lifted up so the Expand/Collapse All
  // controls can drive every accordion at once. "I Get It" (index 0)
  // starts open, matching the screenshot.
  const [openStates, setOpenStates] = useState<readonly boolean[]>(() =>
    SECTIONS.map((_, i) => i === 0)
  );

  const toggleSection = useCallback((index: number) => {
    setOpenStates((prev) => prev.map((v, i) => (i === index ? !v : v)));
  }, []);

  const expandAll = useCallback(() => {
    void Haptics.selectionAsync();
    setOpenStates(SECTIONS.map(() => true));
  }, []);

  const collapseAll = useCallback(() => {
    void Haptics.selectionAsync();
    setOpenStates(SECTIONS.map(() => false));
  }, []);

  // Full Text is a convenience — it expands every section so the user
  // can scroll the entire transmission as one long read.
  const fullText = expandAll;

  const handleContinue = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/tools/viyoga/meditation' as never);
  }, []);

  const cardDate = useMemo(formatDate, []);

  // ── Empty / error state — keep the screen inhabited even if Sakha 0s ──
  if (!result) {
    const isError = flow.status === 'error';
    return (
      <View style={em.screen}>
        <Text style={em.title}>
          {isError ? 'Sakha could not respond.' : 'Loading transmission...'}
        </Text>
        {isError && error ? <Text style={em.detail}>{error}</Text> : null}
        <TouchableOpacity
          style={em.backBtn}
          onPress={() => router.replace('/tools/viyoga/step1' as never)}
          accessibilityRole="button"
          accessibilityLabel="Return to the beginning"
        >
          <Text style={em.backBtnText}>Return to the beginning</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const headerText =
    result.header.length > 0
      ? result.header
      : separatedFrom.length > 0
        ? `Sakha has witnessed your longing for ${separatedFrom}`
        : 'Sakha has witnessed your longing';

  return (
    <View style={{ flex: 1, backgroundColor: '#030510' }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={t.header}>
          <View
            style={t.flames}
            accessibilityLabel={`Step ${PROGRESS_FLAMES_LIT} of ${PROGRESS_FLAMES_TOTAL}`}
          >
            {Array.from({ length: PROGRESS_FLAMES_TOTAL }).map((_, i) => (
              <Text
                key={i}
                style={[t.flame, i < PROGRESS_FLAMES_LIT && t.flameLit]}
              >
                🔥
              </Text>
            ))}
          </View>
          <Text style={t.witness}>{headerText}</Text>
        </View>

        <GoldenDivider style={{ marginVertical: 12 }} />

        <View style={t.card}>
          <View style={t.cardHeader}>
            <Text style={t.cardIcon}>🎯</Text>
            <View style={{ flex: 1 }}>
              <Text style={t.cardTitle}>Viyoga&apos;s Transmission</Text>
              <Text style={t.cardDate}>{cardDate}</Text>
            </View>
          </View>

          <View style={t.controls}>
            <TouchableOpacity
              style={t.controlBtn}
              onPress={expandAll}
              accessibilityRole="button"
              accessibilityLabel="Expand all sections"
            >
              <Text style={t.controlText}>Expand All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={t.controlBtn}
              onPress={collapseAll}
              accessibilityRole="button"
              accessibilityLabel="Collapse all sections"
            >
              <Text style={t.controlText}>Collapse All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={t.controlBtn}
              onPress={fullText}
              accessibilityRole="button"
              accessibilityLabel="Show full text"
            >
              <Text style={t.controlText}>Full Text</Text>
            </TouchableOpacity>
          </View>

          <GoldenDivider style={{ marginVertical: 8 }} />

          {SECTIONS.map((section, i) => (
            <AccordionSection
              key={section.key}
              icon={section.icon}
              label={section.label}
              content={result.sections[i]?.content ?? ''}
              open={openStates[i] ?? false}
              onToggle={() => toggleSection(i)}
            />
          ))}

          {result.footer.length > 0 ? (
            <Text style={t.footer}>{result.footer}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={t.continueBtn}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue to meditation"
        >
          <Text style={t.continueBtnText}>Continue to Meditation →</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const t = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  flames: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  flame: {
    fontSize: 18,
    opacity: 0.3,
  },
  flameLit: {
    opacity: 1,
  },
  witness: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 14,
    color: 'rgba(240,235,225,0.6)',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(14,18,42,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardTitle: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 22,
    color: '#D4A017',
  },
  cardDate: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: 'rgba(240,235,225,0.35)',
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  controlBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
    borderRadius: 8,
  },
  controlText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: 'rgba(240,235,225,0.5)',
  },
  footer: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    color: 'rgba(100,149,237,0.8)',
    textAlign: 'center',
    marginTop: 12,
  },
  continueBtn: {
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.25)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueBtnText: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 16,
    color: '#D4A017',
  },
});

const em = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#030510',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  title: {
    color: '#D4A017',
    fontFamily: 'CrimsonText-Italic',
    fontSize: 18,
    textAlign: 'center',
  },
  detail: {
    marginTop: 12,
    color: 'rgba(240,235,225,0.5)',
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.4)',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  backBtnText: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 15,
    color: '#D4A017',
  },
});
