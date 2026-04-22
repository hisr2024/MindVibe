/**
 * useKarmaReset — State + API orchestration hook for the 6-phase flow.
 *
 * Wraps the three service calls (reflect, wisdom, complete) with
 * loading/error state. Any API failure resolves to `null` with the
 * error surfaced via `error` — consumers decide whether to show a
 * retry affordance or proceed with local fallback data.
 *
 * Mirrors `app/(mobile)/m/karma-reset/hooks/useKarmaReset.ts`.
 */

import { useState, useCallback } from 'react';
import {
  getReflectionQuestion,
  getWisdom,
  completeSession,
} from '../services/karmaResetService';
import type {
  KarmaResetContext,
  KarmaReflectionQuestion,
  KarmaReflectionAnswer,
  KarmaWisdomResponse,
  KarmaCompleteResponse,
} from '../components/karma-reset/types';

interface UseKarmaResetValue {
  fetchReflectionQuestion: (
    context: KarmaResetContext,
    questionIndex: 0 | 1 | 2,
  ) => Promise<KarmaReflectionQuestion | null>;
  fetchWisdom: (
    context: KarmaResetContext,
    reflections: KarmaReflectionAnswer[],
  ) => Promise<KarmaWisdomResponse | null>;
  finishSession: (
    sessionId: string,
    sankalpaSigned: boolean,
    actionDharmaCommitted: string[],
  ) => Promise<KarmaCompleteResponse>;
  isLoadingQuestion: boolean;
  isLoadingWisdom: boolean;
  isCompleting: boolean;
  error: string | null;
  clearError: () => void;
}

export function useKarmaReset(): UseKarmaResetValue {
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isLoadingWisdom, setIsLoadingWisdom] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReflectionQuestion = useCallback(
    async (
      context: KarmaResetContext,
      questionIndex: 0 | 1 | 2,
    ): Promise<KarmaReflectionQuestion | null> => {
      setIsLoadingQuestion(true);
      setError(null);
      try {
        return await getReflectionQuestion(context, questionIndex);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Unable to get reflection question';
        setError(msg);
        return null;
      } finally {
        setIsLoadingQuestion(false);
      }
    },
    [],
  );

  const fetchWisdom = useCallback(
    async (
      context: KarmaResetContext,
      reflections: KarmaReflectionAnswer[],
    ): Promise<KarmaWisdomResponse | null> => {
      setIsLoadingWisdom(true);
      setError(null);
      try {
        return await getWisdom(context, reflections);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Sakha is momentarily unavailable';
        setError(msg);
        return null;
      } finally {
        setIsLoadingWisdom(false);
      }
    },
    [],
  );

  const finishSession = useCallback(
    async (
      sessionId: string,
      sankalpaSigned: boolean,
      actionDharmaCommitted: string[],
    ): Promise<KarmaCompleteResponse> => {
      setIsCompleting(true);
      try {
        return await completeSession(
          sessionId,
          sankalpaSigned,
          actionDharmaCommitted,
        );
      } catch {
        // The ceremony plays even when the network fails — return a
        // local-only success so the user always reaches the seal.
        return {
          success: true,
          xpAwarded: 25,
          streakCount: 1,
          message: 'Your karma has been met with dharma.',
        };
      } finally {
        setIsCompleting(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    fetchReflectionQuestion,
    fetchWisdom,
    finishSession,
    isLoadingQuestion,
    isLoadingWisdom,
    isCompleting,
    error,
    clearError,
  };
}
