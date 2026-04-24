/**
 * useKarmaReset — State + API orchestration hook for the 6-phase flow.
 *
 * Wraps the three service calls (`reflect`, `wisdom`, `complete`) with
 * loading state. Because `karmaResetService` is total — every call
 * resolves with usable content via local fallbacks when the backend
 * is unreachable — this hook never surfaces an error to the UI; the
 * ritual always completes.
 *
 * Mirrors `app/(mobile)/m/karma-reset/hooks/useKarmaReset.ts` but
 * trades the web's error-and-retry surface for an offline-first
 * fallback path that's more appropriate on mobile.
 */

import { useCallback, useState } from 'react';
import {
  completeSession,
  getReflectionQuestion,
  getWisdom,
} from '../services/karmaResetService';
import type {
  KarmaCompleteResponse,
  KarmaReflectionAnswer,
  KarmaReflectionQuestion,
  KarmaResetContext,
  KarmaWisdomResponse,
} from '../components/karma-reset/types';

interface UseKarmaResetValue {
  fetchReflectionQuestion: (
    context: KarmaResetContext,
    questionIndex: 0 | 1 | 2
  ) => Promise<KarmaReflectionQuestion>;
  fetchWisdom: (
    context: KarmaResetContext,
    reflections: KarmaReflectionAnswer[]
  ) => Promise<KarmaWisdomResponse>;
  finishSession: (
    sessionId: string,
    sankalpaSigned: boolean,
    actionDharmaCommitted: string[]
  ) => Promise<KarmaCompleteResponse>;
  isLoadingQuestion: boolean;
  isLoadingWisdom: boolean;
  isCompleting: boolean;
}

export function useKarmaReset(): UseKarmaResetValue {
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isLoadingWisdom, setIsLoadingWisdom] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const fetchReflectionQuestion = useCallback(
    async (
      context: KarmaResetContext,
      questionIndex: 0 | 1 | 2
    ): Promise<KarmaReflectionQuestion> => {
      setIsLoadingQuestion(true);
      try {
        return await getReflectionQuestion(context, questionIndex);
      } finally {
        setIsLoadingQuestion(false);
      }
    },
    []
  );

  const fetchWisdom = useCallback(
    async (
      context: KarmaResetContext,
      reflections: KarmaReflectionAnswer[]
    ): Promise<KarmaWisdomResponse> => {
      setIsLoadingWisdom(true);
      try {
        return await getWisdom(context, reflections);
      } finally {
        setIsLoadingWisdom(false);
      }
    },
    []
  );

  const finishSession = useCallback(
    async (
      sessionId: string,
      sankalpaSigned: boolean,
      actionDharmaCommitted: string[]
    ): Promise<KarmaCompleteResponse> => {
      setIsCompleting(true);
      try {
        return await completeSession(
          sessionId,
          sankalpaSigned,
          actionDharmaCommitted
        );
      } finally {
        setIsCompleting(false);
      }
    },
    []
  );

  return {
    fetchReflectionQuestion,
    fetchWisdom,
    finishSession,
    isLoadingQuestion,
    isLoadingWisdom,
    isCompleting,
  };
}
