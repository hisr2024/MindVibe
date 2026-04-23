/**
 * EmotionalResetScreen — Orchestrates the sacred ritual on Android.
 *
 * Phase order: mandala → witness → breath → integration → ceremony.
 *
 * The prior `arrival` phase (a 1.6 s "Entering sacred space…" loader)
 * has been removed — it was ceremonial padding, not real work, and it
 * made the tool feel gated. The mandala phase is now the true entry,
 * so the user sees the offering surface immediately.
 *
 * Architecture notes:
 *   - Each phase owns the full viewport; the background canvas stays
 *     mounted across transitions so users never "leave" sacred space.
 *   - Phase swaps no longer re-fade the whole layer — each phase
 *     component controls its own entry choreography. The canvas beneath
 *     is the continuity.
 *   - All backend wiring lives in this orchestrator — phases receive
 *     typed data + callbacks only.
 *
 * Mirrors the web flow at `app/(mobile)/m/emotional-reset/page.tsx`.
 */

import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { api } from '@kiaanverse/api';
import { EmotionalResetCanvas } from './visuals/EmotionalResetCanvas';
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

  // Phase `arrival` is intentionally skipped — the "Entering sacred space…"
  // loader added a 1.6 s blocker with no purpose other than ceremony, and
  // made the ritual feel gated. The mandala phase is now the true entry
  // point; the canvas underneath fades in on mount, which is enough.
  const [phase, setPhase] = useState<EmotionalResetPhase>('mandala');
  const [emotion, setEmotion] = useState<EmotionalState | null>(null);
  const [intensity, setIntensity] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crisis, setCrisis] = useState<string | null>(null);
  const startedAt = useRef(Date.now());

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

      {/* Phase swap: plain View instead of a fading Animated.View. Each
          phase component handles its own entry choreography, so re-fading
          the whole layer on every phase change just added visible flashes.
          The canvas behind stays mounted, keeping the "sacred space"
          unbroken. */}
      <View style={StyleSheet.absoluteFill}>
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
      </View>
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
