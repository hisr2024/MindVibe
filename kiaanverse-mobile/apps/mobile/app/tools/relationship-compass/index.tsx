/**
 * Relationship Compass — Sambandha Dharma (सम्बन्ध धर्म)
 *
 * 1:1 native parity with the web Relationship Compass on the
 * `/m/relationship-compass` route. Hosts the six "sacred chambers" inside
 * a single Expo Router screen so the user feels they're moving through
 * one continuous ritual rather than between routes.
 *
 *   Chamber I:   COMPASS ALTAR      — relationship + name + initial guna
 *   Chamber II:  GUNA MIRROR        — situation + 24 pattern chips
 *   Chamber III: DHARMA MAP         — 8-axis radar with interpretation
 *   Chamber IV:  GITA COUNSEL       — AI-generated 7-step transmission
 *   Chamber V:   DHARMIC INTENTION  — sankalpa setting
 *   Chamber VI:  COMPASS SEAL       — summary + next-step CTAs
 *
 * Cross-cutting:
 *   - Shared header with back arrow + "Relationship Compass" title +
 *     bell glyph (decorative; the real notification button lives in the
 *     tabs layout).
 *   - SacredProgressFlames row underneath the header on every chamber
 *     except the altar, showing the 6 chambers and the current step.
 *   - All chamber state lives in this orchestrator so the user can move
 *     forward / backward without losing input.
 *   - When the user reaches the seal we push a SealedCompassReading into
 *     the persisted `useRelationshipStore` so it shows up in their log.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { Screen } from '@kiaanverse/ui';
import {
  useRelationshipStore,
  type SealedCompassReading,
} from '@kiaanverse/store';

import { CompassAltarChamber } from './chambers/CompassAltarChamber';
import { GunaMirrorChamber } from './chambers/GunaMirrorChamber';
import { DharmaMapChamber } from './chambers/DharmaMapChamber';
import { GitaCounselChamber } from './chambers/GitaCounselChamber';
import { DharmicIntentionChamber } from './chambers/DharmicIntentionChamber';
import { CompassSealChamber } from './chambers/CompassSealChamber';
import { SacredProgressFlames } from './components/SacredProgressFlames';
import { useCompassWisdom } from './hooks/useCompassWisdom';
import { useGunaCalculation, type GunaName } from './hooks/useGunaCalculation';
import { useDharmaMapData } from './hooks/useDharmaMapData';
import type { RelationshipTypeData } from './data/relationshipTypes';
import type { DharmicQuality } from './data/dharmicQualities';
import type { GunaKey } from './data/gunaPatterns';

const SACRED_WHITE = '#F5F0E8';

type ChamberKey =
  | 'altar'
  | 'guna_mirror'
  | 'dharma_map'
  | 'gita_counsel'
  | 'intention'
  | 'seal';

const CHAMBER_ORDER: readonly ChamberKey[] = [
  'altar',
  'guna_mirror',
  'dharma_map',
  'gita_counsel',
  'intention',
  'seal',
] as const;

interface CompassDraft {
  relationshipType: RelationshipTypeData | null;
  partnerName: string;
  initialGunaReading: GunaName;
  selectedPatterns: { tamas: string[]; rajas: string[]; sattva: string[] };
  customQuery: string;
  selectedQuality: DharmicQuality | null;
  intentionText: string;
}

const INITIAL_DRAFT: CompassDraft = {
  relationshipType: null,
  partnerName: '',
  initialGunaReading: 'balanced',
  selectedPatterns: { tamas: [], rajas: [], sattva: [] },
  customQuery: '',
  selectedQuality: null,
  intentionText: '',
};

export default function RelationshipCompassScreen(): React.JSX.Element {
  const router = useRouter();
  const addSealedReading = useRelationshipStore((s) => s.addSealedReading);

  const [chamber, setChamber] = useState<ChamberKey>('altar');
  const [draft, setDraft] = useState<CompassDraft>(INITIAL_DRAFT);
  const sealedRef = useRef<SealedCompassReading | null>(null);

  const wisdom = useCompassWisdom();

  const gunaScores = useGunaCalculation(draft.selectedPatterns);
  const dharmaValues = useDharmaMapData(draft.selectedPatterns);

  const currentIndex = useMemo(
    () => CHAMBER_ORDER.indexOf(chamber),
    [chamber],
  );

  // ---------------------------------------------------------------------
  // Hardware back: route back through chambers, never directly out of the
  // ritual unless we're already on the altar.
  // ---------------------------------------------------------------------
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (chamber === 'altar') return false;
      setChamber(CHAMBER_ORDER[Math.max(0, currentIndex - 1)] as ChamberKey);
      return true;
    });
    return () => sub.remove();
  }, [chamber, currentIndex]);

  const advance = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    const next = CHAMBER_ORDER[currentIndex + 1];
    if (next) setChamber(next);
  }, [currentIndex]);

  const onBack = useCallback(() => {
    if (chamber === 'altar') {
      router.back();
      return;
    }
    setChamber(CHAMBER_ORDER[Math.max(0, currentIndex - 1)] as ChamberKey);
  }, [chamber, currentIndex, router]);

  // ---------------------------------------------------------------------
  // Draft setters — small enough to inline here, keeps state colocated.
  // ---------------------------------------------------------------------
  const setRelationshipType = useCallback((t: RelationshipTypeData) => {
    setDraft((d) => ({ ...d, relationshipType: t }));
  }, []);
  const setPartnerName = useCallback((name: string) => {
    setDraft((d) => ({ ...d, partnerName: name }));
  }, []);
  const setInitialGunaReading = useCallback((g: GunaName) => {
    setDraft((d) => ({ ...d, initialGunaReading: g }));
  }, []);
  const setCustomQuery = useCallback((q: string) => {
    setDraft((d) => ({ ...d, customQuery: q }));
  }, []);
  const togglePattern = useCallback((guna: GunaKey, patternId: string) => {
    setDraft((d) => {
      const list = d.selectedPatterns[guna];
      const next = list.includes(patternId)
        ? list.filter((id) => id !== patternId)
        : [...list, patternId];
      return {
        ...d,
        selectedPatterns: { ...d.selectedPatterns, [guna]: next },
      };
    });
  }, []);
  const setSelectedQuality = useCallback((q: DharmicQuality) => {
    setDraft((d) => ({ ...d, selectedQuality: q }));
  }, []);
  const setIntentionText = useCallback((text: string) => {
    setDraft((d) => ({ ...d, intentionText: text }));
  }, []);

  // ---------------------------------------------------------------------
  // Dharma-map → Gita-counsel transition: kick off the AI request and
  // move the user onto the loading view immediately.
  // ---------------------------------------------------------------------
  const requestWisdom = useCallback(async () => {
    void Haptics.selectionAsync().catch(() => {});
    setChamber('gita_counsel');
    if (!draft.relationshipType) return;
    await wisdom.request({
      relationshipTypeId: draft.relationshipType.id,
      relationshipTypeLabel: draft.relationshipType.label,
      partnerName: draft.partnerName,
      initialGunaReading: draft.initialGunaReading,
      dominantGuna: gunaScores.dominant,
      selectedPatterns: draft.selectedPatterns,
      customQuery: draft.customQuery,
    });
  }, [
    draft.relationshipType,
    draft.partnerName,
    draft.initialGunaReading,
    draft.selectedPatterns,
    draft.customQuery,
    gunaScores.dominant,
    wisdom,
  ]);

  // ---------------------------------------------------------------------
  // Intention → Seal transition: persist the reading once and only once.
  // ---------------------------------------------------------------------
  const handleSeal = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    if (!draft.relationshipType || sealedRef.current) {
      setChamber('seal');
      return;
    }
    const reading: SealedCompassReading = {
      id: `compass-${Date.now()}`,
      relationshipTypeId: draft.relationshipType.id,
      relationshipTypeLabel: draft.relationshipType.label,
      partnerName: draft.partnerName.trim(),
      initialGunaReading: draft.initialGunaReading,
      selectedPatterns: {
        tamas: [...draft.selectedPatterns.tamas],
        rajas: [...draft.selectedPatterns.rajas],
        sattva: [...draft.selectedPatterns.sattva],
      },
      gunaScores: {
        tamas: gunaScores.tamas,
        rajas: gunaScores.rajas,
        sattva: gunaScores.sattva,
        dominant: gunaScores.dominant,
      },
      dharmaValues: { ...dharmaValues },
      customQuery: draft.customQuery.trim(),
      selectedQualityId: draft.selectedQuality?.id ?? null,
      selectedQualityLabel: draft.selectedQuality?.label ?? null,
      intentionText: draft.intentionText.trim(),
      gitaResponse: wisdom.transmission?.fullText ?? null,
      gitaVerses: wisdom.transmission?.verseCount ?? 0,
      sealedAt: new Date().toISOString(),
    };
    sealedRef.current = reading;
    addSealedReading(reading);
    setChamber('seal');
  }, [
    addSealedReading,
    draft,
    gunaScores,
    dharmaValues,
    wisdom.transmission,
  ]);

  // ---------------------------------------------------------------------
  // Renders — each chamber is wrapped in a fade so transitions feel calm.
  // ---------------------------------------------------------------------
  const chamberContent = (() => {
    switch (chamber) {
      case 'altar':
        return (
          <CompassAltarChamber
            relationshipType={draft.relationshipType}
            partnerName={draft.partnerName}
            initialGunaReading={draft.initialGunaReading}
            onRelationshipTypeChange={setRelationshipType}
            onNameChange={setPartnerName}
            onGunaReadingChange={setInitialGunaReading}
            onProceed={advance}
          />
        );
      case 'guna_mirror':
        return (
          <GunaMirrorChamber
            selectedPatterns={draft.selectedPatterns}
            onTogglePattern={togglePattern}
            gunaScores={gunaScores}
            customQuery={draft.customQuery}
            onCustomQueryChange={setCustomQuery}
            onProceed={advance}
          />
        );
      case 'dharma_map':
        return (
          <DharmaMapChamber
            dharmaValues={dharmaValues}
            dominantGuna={gunaScores.dominant}
            partnerName={draft.partnerName}
            onProceed={requestWisdom}
          />
        );
      case 'gita_counsel':
        return (
          <GitaCounselChamber
            loading={wisdom.loading}
            transmission={wisdom.transmission}
            partnerName={draft.partnerName}
            onContinue={advance}
          />
        );
      case 'intention':
        return (
          <DharmicIntentionChamber
            partnerName={draft.partnerName}
            selectedQuality={draft.selectedQuality}
            intentionText={draft.intentionText}
            onQualityChange={setSelectedQuality}
            onIntentionTextChange={setIntentionText}
            onSeal={handleSeal}
          />
        );
      case 'seal': {
        const reading = sealedRef.current;
        return (
          <CompassSealChamber
            partnerName={reading?.partnerName ?? draft.partnerName}
            relationshipTypeLabel={
              reading?.relationshipTypeLabel ?? draft.relationshipType?.label ?? ''
            }
            dominantGuna={reading?.gunaScores.dominant ?? gunaScores.dominant}
            selectedQualityLabel={
              reading?.selectedQualityLabel ?? draft.selectedQuality?.label ?? null
            }
            intentionText={reading?.intentionText ?? draft.intentionText}
            sealedAt={reading?.sealedAt ?? new Date().toISOString()}
          />
        );
      }
    }
  })();

  return (
    <Screen scroll={false} gradient edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          style={styles.iconBtn}
        >
          <ChevronLeft size={28} color={SACRED_WHITE} />
        </Pressable>
        <Text style={styles.headerTitle}>Relationship Compass</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={12}
          style={styles.iconBtn}
          onPress={() => {}}
        >
          <Bell size={22} color={SACRED_WHITE} />
        </Pressable>
      </View>

      {chamber !== 'altar' ? (
        <SacredProgressFlames total={6} current={currentIndex} />
      ) : (
        <View style={styles.altarSpacer} />
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          key={chamber}
          entering={FadeIn.duration(360).easing(Easing.out(Easing.cubic))}
          exiting={FadeOut.duration(220)}
        >
          {chamberContent}
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    minHeight: 44,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: SACRED_WHITE,
    fontFamily: 'CormorantGaramond-LightItalic',
    fontSize: 22,
    textAlign: 'center',
  },
  altarSpacer: {
    height: 6,
  },
  scrollContent: {
    paddingTop: 6,
    paddingBottom: 32,
  },
});
