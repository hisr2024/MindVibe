/**
 * EmotionalResetScreen — Orchestrates the 6-phase sacred ritual on Android.
 *
 * Phase order: arrival → mandala → witness → breath → integration → ceremony.
 *
 * Architecture notes:
 *   - Each phase owns the full viewport; the background canvas stays
 *     mounted across transitions so users never "leave" sacred space.
 *   - Phase swaps are animated with a fade-in keyed off `phase` (same
 *     trick as KarmaResetScreen so `withSequence` doesn't coalesce).
 *   - All backend wiring lives in this orchestrator — phases receive
 *     typed data + callbacks only.
 *
 * Mirrors the web flow at `app/(mobile)/m/emotional-reset/page.tsx`.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { api } from '@kiaanverse/api';
import { EmotionalResetCanvas } from './visuals/EmotionalResetCanvas';
import { ArrivalPhase } from './phases/ArrivalPhase';
import { MandalaPhase } from './phases/MandalaPhase';
import { WitnessPhase } from './phases/WitnessPhase';
import { BreathPhase } from './phases/BreathPhase';
import { IntegrationPhase } from './phases/IntegrationPhase';
import { CeremonyPhase } from './phases/CeremonyPhase';
import {
  FALLBACK_RESPONSE,
  parseAIResponse,
  type AIResponse,
  type EmotionalResetPhase,
  type EmotionalState,
} from './types';

// Backend cap from backend/routes/emotional_reset.py::USER_INPUT_MAX_LENGTH.
const BACKEND_INPUT_LIMIT = 2000;

/** Trim each dynamic segment and hard-clip the final payload. */
function buildStepOneInput(
  emotion: EmotionalState,
  intensity: number,
  context: string,
): string {
  const header = `I am feeling ${emotion.label.toLowerCase()} (${emotion.sanskrit}) at intensity ${intensity}/5.`;
  const ctxSegment = context ? ` ${context.slice(0, 800)}` : '';
  return `${header}${ctxSegment}`.slice(0, BACKEND_INPUT_LIMIT);
}

type StepPayload = {
  guidance?: string;
  assessment?: { assessment?: string };
  crisis_detected?: boolean;
  crisis_response?: string;
};

type StartPayload = {
  session_id: string;
};

export function EmotionalResetScreen(): React.JSX.Element {
  const router = useRouter();

  const [phase, setPhase] = useState<EmotionalResetPhase>('arrival');
  const [emotion, setEmotion] = useState<EmotionalState | null>(null);
  const [intensity, setIntensity] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crisis, setCrisis] = useState<string | null>(null);
  const startedAt = useRef(Date.now());

  // Phase fade-in — same technique as KarmaResetScreen.
  const fade = useSharedValue(1);
  useEffect(() => {
    fade.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1, {
        duration: 600,
        easing: Easing.bezier(0, 0.8, 0.2, 1),
      }),
    );
  }, [phase, fade]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  // Phase 0 → 1
  const handleArrivalComplete = useCallback(() => setPhase('mandala'), []);

  // Phase 1 → 2 (start session + step 1)
  const handleOffer = useCallback(
    async (selected: EmotionalState, selectedIntensity: number, context: string) => {
      setEmotion(selected);
      setIntensity(selectedIntensity);
      setPhase('witness');
      setLoading(true);
      setError(null);
      setCrisis(null);

      try {
        // The existing shared client passes (emotion, intensity) in the start
        // body — the backend ignores these fields (the route takes no body)
        // but we honour the signature so the shared hooks stay happy.
        const startResp = await api.emotionalReset.start(
          selected.label.toLowerCase(),
          selectedIntensity,
        );
        const sessionData = (startResp.data ?? {}) as StartPayload;
        if (!sessionData.session_id) {
          throw new Error('The sacred session could not be opened. Please try again.');
        }
        setSessionId(sessionData.session_id);

        const userInput = buildStepOneInput(selected, selectedIntensity, context);
        const stepResp = await api.emotionalReset.step(sessionData.session_id, {
          current_step: 1,
          user_input: userInput,
        });
        const stepData = (stepResp.data ?? {}) as StepPayload;

        if (stepData.crisis_detected) {
          setCrisis(
            stepData.crisis_response ||
              'Your wellbeing comes first. If you are in crisis, please reach out to a trusted person or local emergency services.',
          );
          return;
        }

        const guidance = stepData.guidance ?? '';
        const parsed = parseAIResponse(guidance);
        if (parsed) {
          setResponse(parsed);
        } else {
          setResponse({
            witness: guidance,
            shloka: { sanskrit: '', transliteration: '', translation: '', reference: '' },
            reflection: stepData.assessment?.assessment ?? '',
            affirmation: '',
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to connect. Please try again.';
        setError(message);
        setResponse(FALLBACK_RESPONSE);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Phase 2 → 3
  const handleBeginBreathing = useCallback(() => setPhase('breath'), []);

  // Phase 3 → 4
  const handleBreathComplete = useCallback(() => setPhase('integration'), []);

  // Phase 4 → 5
  const handleIntegrationComplete = useCallback((_journal: string) => {
    // The journal text is private to the user's device for now; future
    // work can persist it via the journal API. Sending it here would
    // require the encrypted-journal pipeline — we do not surface a
    // half-encrypted version for a feature in its first iteration.
    setPhase('ceremony');
  }, []);

  // Ceremony session completion — wrapped so the phase can retry/ignore.
  const completeSession = useCallback(async (id: string) => {
    await api.emotionalReset.complete(id);
  }, []);

  const handleReturnHome = useCallback(() => {
    router.replace('/(tabs)');
  }, [router]);

  const handleCrisisExit = useCallback(() => {
    router.replace('/(tabs)');
  }, [router]);

  const durationMinutes = (Date.now() - startedAt.current) / 60_000;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <EmotionalResetCanvas phase={phase} />

      <Animated.View
        style={[StyleSheet.absoluteFill, fadeStyle]}
        key={phase}
      >
        {phase === 'arrival' ? (
          <ArrivalPhase onComplete={handleArrivalComplete} />
        ) : null}

        {phase === 'mandala' ? (
          <MandalaPhase onOffer={handleOffer} />
        ) : null}

        {phase === 'witness' && emotion ? (
          <WitnessPhase
            emotion={emotion}
            intensity={intensity}
            loading={loading}
            response={response}
            crisis={crisis}
            error={error}
            onContinue={handleBeginBreathing}
            onExit={handleCrisisExit}
          />
        ) : null}

        {phase === 'breath' ? (
          <BreathPhase intensity={intensity} onComplete={handleBreathComplete} />
        ) : null}

        {phase === 'integration' && emotion ? (
          <IntegrationPhase
            emotion={emotion}
            intensity={intensity}
            response={response}
            onComplete={handleIntegrationComplete}
          />
        ) : null}

        {phase === 'ceremony' && emotion ? (
          <CeremonyPhase
            emotion={emotion}
            response={response}
            sessionId={sessionId}
            durationMinutes={durationMinutes}
            completeSession={completeSession}
            onReturn={handleReturnHome}
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
