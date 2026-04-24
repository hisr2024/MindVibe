/**
 * KarmaResetScreen — Single-screen state machine orchestrating all 6
 * phases of the Karma Reset ritual.
 *
 * Phase order: entry → context → reflection → wisdom → sankalpa → seal.
 * Each phase owns the full viewport; the background `KarmaCanvas`
 * stays mounted across transitions so the cosmic void + ember glow
 * breathe continuously (a sacred space the user never "leaves").
 *
 * Mirrors `app/(mobile)/m/karma-reset/KarmaResetScreen.tsx` — the web
 * version that uses framer-motion with a clip-path sweep; here we swap
 * the clip for a fade+scale because RN doesn't support clipPath without
 * Skia masking (and the effect is nearly indistinguishable on mobile).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import * as ExpoCrypto from 'expo-crypto';
import { KarmaCanvas } from './visuals/KarmaCanvas';
import { EntryPhase } from './phases/EntryPhase';
import { ContextPhase } from './phases/ContextPhase';
import { ReflectionPhase } from './phases/ReflectionPhase';
import { WisdomPhase } from './phases/WisdomPhase';
import { SankalpaPhase } from './phases/SankalpaPhase';
import { SealPhase } from './phases/SealPhase';
import type {
  KarmaReflectionAnswer,
  KarmaResetContext,
  KarmaResetPhase,
  KarmaResetSession,
  KarmaWisdomResponse,
  SankalpaSeal,
} from './types';

function newSessionId(): string {
  // expo-crypto is already a dep; randomUUID works on all supported RN runtimes
  const uuid = (ExpoCrypto as unknown as { randomUUID?: () => string })
    .randomUUID;
  if (typeof uuid === 'function') return uuid();
  return `kr-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

type PartialSession = Omit<
  KarmaResetSession,
  'phase' | 'context' | 'wisdom' | 'sankalpa'
> & {
  context?: KarmaResetContext;
  wisdom: KarmaWisdomResponse | null;
  sankalpa: SankalpaSeal | null;
};

export function KarmaResetScreen(): React.JSX.Element {
  const [phase, setPhase] = useState<KarmaResetPhase>('entry');
  const [committedActions, setCommittedActions] = useState<string[]>([]);

  const [session, setSession] = useState<PartialSession>(() => ({
    sessionId: newSessionId(),
    startedAt: new Date(),
    reflections: [],
    xpAwarded: 0,
    streakCount: 0,
    wisdom: null,
    sankalpa: null,
  }));

  const updateSession = useCallback((patch: Partial<PartialSession>) => {
    setSession((prev) => ({ ...prev, ...patch }));
  }, []);

  // Phase transitions fire in sequence. Each handler mutates the session
  // and advances `phase`, which the animator below keys its fade off.
  const handleEntryComplete = useCallback(() => setPhase('context'), []);

  const handleContextComplete = useCallback(
    (ctx: KarmaResetContext) => {
      updateSession({ context: ctx });
      setPhase('reflection');
    },
    [updateSession]
  );

  const handleReflectionComplete = useCallback(
    (refs: KarmaReflectionAnswer[]) => {
      updateSession({ reflections: refs });
      setPhase('wisdom');
    },
    [updateSession]
  );

  const handleWisdomComplete = useCallback(
    (wisdom: KarmaWisdomResponse) => {
      updateSession({ wisdom });
      setPhase('sankalpa');
    },
    [updateSession]
  );

  const handleSankalpaComplete = useCallback(
    (sankalpa: SankalpaSeal) => {
      updateSession({ sankalpa, completedAt: new Date() });
      setPhase('seal');
    },
    [updateSession]
  );

  // Fade-in every time `phase` changes — gives the illusion of a
  // smooth "clip-path" sweep like the web version. `withSequence`
  // ensures the 0 frame actually paints before the timing animates
  // back to 1 (a bare `value = 0; value = withTiming(1)` would coalesce
  // and skip the fade).
  const fade = useSharedValue(1);
  useEffect(() => {
    fade.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1, {
        duration: 600,
        easing: Easing.bezier(0, 0.8, 0.2, 1),
      })
    );
  }, [phase, fade]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  const sealSession = useMemo((): KarmaResetSession | null => {
    if (!session.context) return null;
    // `completedAt` is an optional field (no `undefined` allowed under
    // exactOptionalPropertyTypes), so spread it in only when set.
    return {
      sessionId: session.sessionId,
      phase: 'seal',
      context: session.context,
      reflections: session.reflections,
      wisdom: session.wisdom,
      sankalpa: session.sankalpa,
      xpAwarded: session.xpAwarded,
      streakCount: session.streakCount,
      startedAt: session.startedAt,
      ...(session.completedAt !== undefined && {
        completedAt: session.completedAt,
      }),
    };
  }, [session]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {/* Phase-reactive background — persists across transitions */}
      <KarmaCanvas phase={phase} />

      <Animated.View
        style={[StyleSheet.absoluteFill, fadeStyle]}
        // Each phase swap remounts via the `key` so internal state resets.
        key={phase}
      >
        {phase === 'entry' ? (
          <EntryPhase onComplete={handleEntryComplete} />
        ) : null}
        {phase === 'context' ? (
          <ContextPhase onComplete={handleContextComplete} />
        ) : null}
        {phase === 'reflection' && session.context ? (
          <ReflectionPhase
            context={session.context}
            onComplete={handleReflectionComplete}
          />
        ) : null}
        {phase === 'wisdom' && session.context ? (
          <WisdomPhase
            context={session.context}
            reflections={session.reflections}
            onComplete={handleWisdomComplete}
            onActionsChange={setCommittedActions}
          />
        ) : null}
        {phase === 'sankalpa' && session.wisdom && session.context ? (
          <SankalpaPhase
            wisdom={session.wisdom}
            context={session.context}
            onComplete={handleSankalpaComplete}
          />
        ) : null}
        {phase === 'seal' && sealSession ? (
          <SealPhase
            session={sealSession}
            committedActions={committedActions}
          />
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050714',
    overflow: 'hidden',
  },
});
