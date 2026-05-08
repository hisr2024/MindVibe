/**
 * Voice — pick the most natural-sounding voice on the device.
 *
 * Lists every voice the Android system TTS engine exposes for the
 * selected language, sorted by scored quality (Studio > Neural2 >
 * WaveNet > Local/Network > Standard). Each row has a Play preview
 * button so the user can hear a one-line sample before locking
 * in their pick.
 *
 * The "Auto" row at the top (always selected by default) uses
 * the auto-pick algorithm in ``voice/lib/divineVoice.ts``.
 *
 * Selection is persisted via ``setPreferredVoice`` (AsyncStorage)
 * and applies immediately to every Speech.speak() across the app —
 * Listen buttons, Voice Companion, verse readings.
 *
 * The Voice Persona section below the language picker lets users
 * choose between three prosody presets (Divine / Friend / Storyteller),
 * each tuned for a different mode of listening:
 *
 *   • Divine       — slow, contemplative, slightly grave (default)
 *   • Friend       — warm, conversational, natural pace
 *   • Storyteller  — slow, deeper, theatrical (best for verse readings)
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Screen,
  Text,
  Card,
  GoldenHeader,
  Divider,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';

import {
  type DivinePersona,
  type VoiceOption,
  getPreferredPersonaSync,
  getPreferredVoiceSync,
  listVoicesForLanguage,
  previewVoice,
  setPreferredPersona,
  setPreferredVoice,
  warmDivineVoiceCache,
} from '../../voice/lib/divineVoice';

// ── LANGUAGE TABS ────────────────────────────────────────────────────
/** Languages exposed in the picker. Mirror of ``TARGET_LANGUAGES``
 *  in divineVoice.ts; kept narrow so the tab bar fits comfortably. */
const LANGUAGE_OPTIONS: ReadonlyArray<{
  readonly code: string;
  readonly label: string;
}> = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'sa-IN', label: 'संस्कृत' },
  { code: 'mr-IN', label: 'मराठी' },
  { code: 'ta-IN', label: 'தமிழ்' },
  { code: 'bn-IN', label: 'বাংলা' },
];

// ── PERSONA OPTIONS ──────────────────────────────────────────────────
const PERSONA_OPTIONS: ReadonlyArray<{
  readonly value: DivinePersona;
  readonly label: string;
  readonly description: string;
}> = [
  {
    value: 'divine',
    label: 'Divine',
    description: 'Slow, contemplative, soothing. Default.',
  },
  {
    value: 'friend',
    label: 'Friend',
    description: 'Warm, conversational, natural pace.',
  },
  {
    value: 'storyteller',
    label: 'Storyteller',
    description: 'Slow, deeper, theatrical. Best for verses.',
  },
];

// ── QUALITY BADGE LABELS ─────────────────────────────────────────────
const QUALITY_LABELS: Record<VoiceOption['quality'], string> = {
  studio: 'Studio',
  neural2: 'Neural2',
  neural: 'Neural',
  wavenet: 'WaveNet',
  local: 'On-device',
  standard: 'Standard',
};

const QUALITY_COLORS: Record<VoiceOption['quality'], string> = {
  studio: '#FFD700',
  neural2: '#F0C040',
  neural: '#D4A017',
  wavenet: '#B8860B',
  local: '#8B7355',
  standard: '#666666',
};

// ── COMPONENT ────────────────────────────────────────────────────────
export default function VoiceSettingsScreen(): React.JSX.Element {
  const router = useRouter();

  const [language, setLanguage] = useState<string>('en-IN');
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const [persona, setPersona] = useState<DivinePersona>('divine');

  // Initial load: warm the voice cache so the picker has data to
  // render. Cache is module-scoped — second visit is instant.
  useEffect(() => {
    let mounted = true;
    void (async () => {
      await warmDivineVoiceCache();
      if (!mounted) return;
      setPersona(getPreferredPersonaSync());
      const list = await listVoicesForLanguage(language);
      if (!mounted) return;
      setVoices(list);
      setSelected(getPreferredVoiceSync(language));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
    // We deliberately don't depend on `language` here; the language
    // switcher below has its own loader so we don't double-fetch on
    // first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh voice list when the language tab changes.
  const handleLanguageChange = useCallback(async (code: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setLanguage(code);
    setLoading(true);
    const list = await listVoicesForLanguage(code);
    setVoices(list);
    setSelected(getPreferredVoiceSync(code));
    setLoading(false);
  }, []);

  const handlePickAuto = useCallback(async () => {
    void Haptics.selectionAsync().catch(() => {});
    await setPreferredVoice(language, undefined);
    setSelected(undefined);
  }, [language]);

  const handlePickVoice = useCallback(
    async (id: string) => {
      void Haptics.selectionAsync().catch(() => {});
      await setPreferredVoice(language, id);
      setSelected(id);
    },
    [language],
  );

  const handlePreview = useCallback(
    (id: string) => {
      void Haptics.selectionAsync().catch(() => {});
      previewVoice(id, language);
    },
    [language],
  );

  const handlePersonaChange = useCallback(async (value: DivinePersona) => {
    void Haptics.selectionAsync().catch(() => {});
    await setPreferredPersona(value);
    setPersona(value);
  }, []);

  const sortedVoices = useMemo(() => voices, [voices]);

  return (
    <Screen scroll>
      <GoldenHeader title="Voice" onBack={() => router.back()} />

      {/* Intro */}
      <Card style={styles.card}>
        <Text variant="label" color={colors.text.primary}>
          The voice of Sakha
        </Text>
        <Text variant="caption" color={colors.text.muted} style={styles.mt4}>
          Choose the voice that feels most divine and calm to you. Studio
          and Neural2 voices sound the most natural; older voices may
          sound robotic. Tap Play to hear each one before deciding.
        </Text>
      </Card>

      {/* Language tabs */}
      <SectionHeader title="Language" />
      <Card style={styles.card}>
        <View style={styles.langRow}>
          {LANGUAGE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.code}
              onPress={() => void handleLanguageChange(opt.code)}
              style={[
                styles.langChip,
                language === opt.code && styles.langChipActive,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: language === opt.code }}
            >
              <Text
                variant="caption"
                color={
                  language === opt.code
                    ? colors.primary[300]
                    : colors.text.muted
                }
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Voice list */}
      <SectionHeader title="Voice" />
      <Card style={styles.card}>
        {/* Auto row */}
        <Pressable
          onPress={() => void handlePickAuto()}
          style={[
            styles.voiceRow,
            selected === undefined && styles.voiceRowSelected,
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: selected === undefined }}
        >
          <View style={styles.voiceRowMain}>
            <Text variant="label" color={colors.text.primary}>
              Auto (best for language)
            </Text>
            <Text
              variant="caption"
              color={colors.text.muted}
              style={styles.mt2}
            >
              Picks the most natural voice your device offers.
            </Text>
          </View>
          {selected === undefined ? (
            <View style={styles.checkmark}>
              <Text variant="caption" color={colors.primary[300]}>
                ✓
              </Text>
            </View>
          ) : null}
        </Pressable>

        <Divider />

        {/* Loading / empty states */}
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary[300]} />
          </View>
        ) : sortedVoices.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text variant="caption" color={colors.text.muted}>
              No voices found for this language. Install a TTS engine
              update from your device settings to unlock more voices.
            </Text>
          </View>
        ) : (
          sortedVoices.map((v, idx) => (
            <React.Fragment key={v.identifier}>
              {idx > 0 ? <Divider /> : null}
              <View
                style={[
                  styles.voiceRow,
                  selected === v.identifier && styles.voiceRowSelected,
                ]}
              >
                <Pressable
                  onPress={() => void handlePickVoice(v.identifier)}
                  style={styles.voiceRowMain}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: selected === v.identifier,
                  }}
                >
                  <View style={styles.voiceTitleRow}>
                    <Text variant="label" color={colors.text.primary}>
                      {v.name}
                    </Text>
                    <View
                      style={[
                        styles.qualityBadge,
                        { borderColor: QUALITY_COLORS[v.quality] },
                      ]}
                    >
                      <Text
                        variant="caption"
                        color={QUALITY_COLORS[v.quality]}
                        style={styles.qualityBadgeText}
                      >
                        {QUALITY_LABELS[v.quality]}
                      </Text>
                    </View>
                  </View>
                  <Text
                    variant="caption"
                    color={colors.text.muted}
                    style={styles.mt2}
                  >
                    {v.language}
                    {v.gender !== 'unknown' ? ` · ${v.gender}` : ''}
                  </Text>
                </Pressable>
                <View style={styles.voiceRowActions}>
                  <Pressable
                    onPress={() => handlePreview(v.identifier)}
                    style={styles.previewBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Preview ${v.name}`}
                    hitSlop={8}
                  >
                    <Text
                      variant="caption"
                      color={colors.primary[300]}
                      style={styles.previewBtnText}
                    >
                      ▶ Play
                    </Text>
                  </Pressable>
                  {selected === v.identifier ? (
                    <View style={styles.checkmark}>
                      <Text variant="caption" color={colors.primary[300]}>
                        ✓
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </React.Fragment>
          ))
        )}
      </Card>

      {/* Persona */}
      <SectionHeader title="Voice Persona" />
      <Card style={styles.card}>
        {PERSONA_OPTIONS.map((opt, idx) => (
          <React.Fragment key={opt.value}>
            {idx > 0 ? <Divider /> : null}
            <Pressable
              onPress={() => void handlePersonaChange(opt.value)}
              style={[
                styles.voiceRow,
                persona === opt.value && styles.voiceRowSelected,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: persona === opt.value }}
            >
              <View style={styles.voiceRowMain}>
                <Text variant="label" color={colors.text.primary}>
                  {opt.label}
                </Text>
                <Text
                  variant="caption"
                  color={colors.text.muted}
                  style={styles.mt2}
                >
                  {opt.description}
                </Text>
              </View>
              {persona === opt.value ? (
                <View style={styles.checkmark}>
                  <Text variant="caption" color={colors.primary[300]}>
                    ✓
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </React.Fragment>
        ))}
      </Card>
    </Screen>
  );
}

// ── HELPERS ──────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }): React.JSX.Element {
  return (
    <View style={styles.sectionHeader}>
      <Text variant="caption" color={colors.text.muted}>
        {title.toUpperCase()}
      </Text>
    </View>
  );
}

// ── STYLES ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  mt2: { marginTop: 2 },
  mt4: { marginTop: 4 },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: 'rgba(212,160,23,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.18)',
  },
  langChipActive: {
    backgroundColor: 'rgba(212,160,23,0.22)',
    borderColor: 'rgba(212,160,23,0.45)',
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  voiceRowSelected: {
    // Subtle highlight; don't change text colours so contrast stays
    // accessible.
  },
  voiceRowMain: {
    flex: 1,
  },
  voiceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  qualityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  qualityBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  voiceRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.md,
    backgroundColor: 'rgba(212,160,23,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.28)',
  },
  previewBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,160,23,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.45)',
  },
  loadingRow: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyRow: {
    paddingVertical: spacing.md,
  },
});
