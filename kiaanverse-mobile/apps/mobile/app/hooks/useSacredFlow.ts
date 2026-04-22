/**
 * useSacredFlow — lightweight state container for multi-step sacred tool flows.
 *
 * Each flow (viyoga, ardha, etc.) owns a bucket of string answers collected
 * across its input screens, plus a status machine the submission screen drives
 * while calling Sakha. The store is kept in-memory only — these flows are
 * transient by design (a user should not resume a half-finished reflection
 * after killing the app; they should arrive fresh).
 *
 * Usage:
 *   const { answers, updateAnswer, submitFlow, status } = useSacredFlow('viyoga');
 *   updateAnswer('separation_type', 'divine');
 *   await submitFlow();
 */

import { useCallback } from 'react';
import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FlowName = 'viyoga' | 'ardha' | 'karma-reset' | 'emotional-reset';

export type FlowStatus = 'idle' | 'calling' | 'done' | 'error';

export type FlowAnswers = Record<string, string>;

interface FlowBucket {
  answers: FlowAnswers;
  status: FlowStatus;
  error: string | null;
}

interface SacredFlowState {
  flows: Record<string, FlowBucket>;
  setAnswer: (flow: FlowName, key: string, value: string) => void;
  setStatus: (flow: FlowName, status: FlowStatus, error?: string | null) => void;
  reset: (flow: FlowName) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const EMPTY_BUCKET: FlowBucket = { answers: {}, status: 'idle', error: null };

const useSacredFlowStore = create<SacredFlowState>((set) => ({
  flows: {},

  setAnswer: (flow, key, value) =>
    set((state) => {
      const current = state.flows[flow] ?? EMPTY_BUCKET;
      return {
        flows: {
          ...state.flows,
          [flow]: {
            ...current,
            answers: { ...current.answers, [key]: value },
          },
        },
      };
    }),

  setStatus: (flow, status, error = null) =>
    set((state) => {
      const current = state.flows[flow] ?? EMPTY_BUCKET;
      return {
        flows: {
          ...state.flows,
          [flow]: { ...current, status, error },
        },
      };
    }),

  reset: (flow) =>
    set((state) => ({
      flows: { ...state.flows, [flow]: { ...EMPTY_BUCKET } },
    })),
}));

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseSacredFlowResult {
  readonly answers: FlowAnswers;
  readonly status: FlowStatus;
  readonly error: string | null;
  readonly updateAnswer: (key: string, value: string) => void;
  readonly submitFlow: () => Promise<void>;
  readonly resetFlow: () => void;
}

/**
 * Access the collected state for a given sacred flow.
 *
 * The actual submission call to Sakha lives on the flow's loading screen;
 * `submitFlow` here only drives the status machine so input screens can
 * reflect "Listening..." while the loading screen owns the API call. The
 * loading screen is expected to wrap the network call with `setStatus`.
 */
export function useSacredFlow(flow: FlowName): UseSacredFlowResult {
  const bucket = useSacredFlowStore((state) => state.flows[flow] ?? EMPTY_BUCKET);
  const setAnswer = useSacredFlowStore((state) => state.setAnswer);
  const setStatus = useSacredFlowStore((state) => state.setStatus);
  const reset = useSacredFlowStore((state) => state.reset);

  const updateAnswer = useCallback(
    (key: string, value: string) => {
      setAnswer(flow, key, value);
    },
    [flow, setAnswer],
  );

  const submitFlow = useCallback(async () => {
    setStatus(flow, 'calling');
  }, [flow, setStatus]);

  const resetFlow = useCallback(() => {
    reset(flow);
  }, [flow, reset]);

  return {
    answers: bucket.answers,
    status: bucket.status,
    error: bucket.error,
    updateAnswer,
    submitFlow,
    resetFlow,
  };
}
