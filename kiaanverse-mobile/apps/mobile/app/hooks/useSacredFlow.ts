/**
 * useSacredFlow — lightweight state container for multi-step sacred tool flows.
 *
 * Each flow (viyoga, ardha, etc.) owns a bucket of string answers collected
 * across its input screens plus an `aiResponse` the submission screen fills
 * after calling Sakha. Storage is in-memory only — these flows are transient
 * by design (a user should not resume a half-finished reflection after
 * killing the app; they should arrive fresh).
 *
 * Usage:
 *   const { answers, updateAnswer, submitFlow, status, flow } =
 *     useSacredFlow('viyoga');
 *   updateAnswer('separation_type', 'divine');
 *   await submitFlow();
 *   console.log(flow.aiResponse);
 */

import { useCallback } from 'react';
import { create } from 'zustand';
import { api } from '@kiaanverse/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FlowName = 'viyoga' | 'ardha' | 'karma-reset' | 'emotional-reset';

export type FlowStatus = 'idle' | 'calling' | 'done' | 'error';

export type FlowAnswers = Record<string, string>;

/**
 * Structured transmission the Viyoga screen renders.
 *
 * Shaped by `submitFlow` from whatever the backend returns — the backend's
 * `routes/viyoga.py` answers with a single `assistant` string plus a
 * karma-yoga insight, so we split/compose that into five accordion sections
 * ("I Get It", "A Different Way to See This", "Try This Right Now",
 * "One Thing You Can Do", "Something to Consider") that mirror the
 * kiaanverse.com/m/viyog layout.
 */
export interface ViyogaTransmission {
  readonly header: string;
  readonly footer: string;
  readonly sections: ReadonlyArray<{ readonly content: string }>;
  readonly verse: string | null;
}

export type FlowAIResponse = ViyogaTransmission | null;

export interface FlowBucket {
  readonly answers: FlowAnswers;
  readonly status: FlowStatus;
  readonly error: string | null;
  readonly aiResponse: FlowAIResponse;
}

interface SacredFlowState {
  flows: Record<string, FlowBucket>;
  setAnswer: (flow: FlowName, key: string, value: string) => void;
  setStatus: (flow: FlowName, status: FlowStatus, error?: string | null) => void;
  setAIResponse: (flow: FlowName, response: FlowAIResponse) => void;
  reset: (flow: FlowName) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const EMPTY_BUCKET: FlowBucket = {
  answers: {},
  status: 'idle',
  error: null,
  aiResponse: null,
};

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

  setAIResponse: (flow, response) =>
    set((state) => {
      const current = state.flows[flow] ?? EMPTY_BUCKET;
      return {
        flows: {
          ...state.flows,
          [flow]: { ...current, aiResponse: response },
        },
      };
    }),

  reset: (flow) =>
    set((state) => ({
      flows: { ...state.flows, [flow]: { ...EMPTY_BUCKET } },
    })),
}));

// ---------------------------------------------------------------------------
// Viyoga submission — prompt construction + response shaping
// ---------------------------------------------------------------------------

/** Turns the collected answers into a single, human-phrased prompt. */
function buildViyogaPrompt(answers: FlowAnswers): string {
  const type = answers.separation_type ?? 'separation';
  const from = answers.separated_from ?? 'someone dear';
  const intensity = answers.intensity ?? 'Present';
  const wish = answers.wish_to_say ?? '';

  return [
    `I am carrying a ${type} separation from ${from}.`,
    `The feeling is ${intensity.toLowerCase()}.`,
    wish.length > 0 ? `What I wish I could say: ${wish}` : '',
    '',
    'Please reflect on this in the voice of Viyoga and speak to me with compassion.',
  ]
    .filter((line) => line.length > 0)
    .join('\n');
}

interface ViyogaBackendResponse {
  assistant?: string;
  error?: string;
  citations?: Array<{ reference_if_any?: string }>;
  karma_yoga_insight?: {
    teaching?: string;
    verse?: string;
    remedy?: string;
  };
}

/**
 * Split a long assistant response into up to 5 section strings.
 *
 * The backend returns prose, not a structured multi-section object. We
 * split on paragraph breaks first (that matches how KIAAN usually writes
 * back), and fall through to sentence splits when there are fewer than
 * five paragraphs. Sections that end up empty are filled with the
 * karma-yoga teaching / remedy / verse reference so every accordion has
 * *something* to say.
 */
function shapeTransmission(
  raw: ViyogaBackendResponse,
  answers: FlowAnswers,
): ViyogaTransmission {
  const assistant = (raw.assistant ?? '').trim();
  const teaching = (raw.karma_yoga_insight?.teaching ?? '').trim();
  const remedy = (raw.karma_yoga_insight?.remedy ?? '').trim();
  const verse = (raw.karma_yoga_insight?.verse ?? raw.citations?.[0]?.reference_if_any ?? '').trim();

  const paragraphs = assistant
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Build a five-slot section array. Fall-through order:
  //   1. paragraphs[i]
  //   2. teaching / remedy / verse line (by slot)
  //   3. empty string (screen shows "—" placeholder)
  const pick = (i: number): string => {
    const para = paragraphs[i];
    if (para !== undefined) return para;
    if (i === 1 && teaching.length > 0) return teaching;
    if ((i === 2 || i === 3) && remedy.length > 0) return remedy;
    if (i === 4 && verse.length > 0) return `The wisdom points here: ${verse}`;
    return '';
  };

  const sections = [0, 1, 2, 3, 4].map((i) => ({ content: pick(i) }));

  const from = answers.separated_from?.trim();
  const header =
    from && from.length > 0
      ? `Sakha has witnessed your longing for ${from}`
      : 'Sakha has witnessed your longing';

  const footer = verse.length > 0
    ? `Anchored in ${verse}`
    : 'Even in separation, there is union.';

  return {
    header,
    footer,
    sections,
    verse: verse.length > 0 ? verse : null,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseSacredFlowResult {
  readonly answers: FlowAnswers;
  readonly status: FlowStatus;
  readonly error: string | null;
  readonly flow: FlowBucket;
  readonly updateAnswer: (key: string, value: string) => void;
  readonly submitFlow: () => Promise<void>;
  readonly resetFlow: () => void;
}

/**
 * Access the collected state for a given sacred flow.
 *
 * `submitFlow()` actually fires the backend call for Viyoga (the others
 * are no-op for now and just flip the status machine so a loading screen
 * can show a transitional state). The shaped `aiResponse` lives on the
 * `flow` bucket for the transmission screen to read.
 */
export function useSacredFlow(flow: FlowName): UseSacredFlowResult {
  const bucket = useSacredFlowStore((state) => state.flows[flow] ?? EMPTY_BUCKET);
  const setAnswer = useSacredFlowStore((state) => state.setAnswer);
  const setStatus = useSacredFlowStore((state) => state.setStatus);
  const setAIResponse = useSacredFlowStore((state) => state.setAIResponse);
  const reset = useSacredFlowStore((state) => state.reset);

  const updateAnswer = useCallback(
    (key: string, value: string) => {
      setAnswer(flow, key, value);
    },
    [flow, setAnswer],
  );

  const submitFlow = useCallback(async (): Promise<void> => {
    setStatus(flow, 'calling');

    // Only Viyoga submits to a backend today. Other flows just
    // acknowledge and return — keeps the API surface consistent so
    // callers don't branch on flow name.
    if (flow !== 'viyoga') {
      setStatus(flow, 'done');
      return;
    }

    // Read the latest answers directly from the store so we don't hold
    // a stale closure snapshot from render time.
    const latest = useSacredFlowStore.getState().flows[flow] ?? EMPTY_BUCKET;

    try {
      const { data } = await api.viyoga.chat(buildViyogaPrompt(latest.answers));
      const raw = (data ?? {}) as ViyogaBackendResponse;

      if (raw.error) {
        throw new Error(raw.error);
      }

      const transmission = shapeTransmission(raw, latest.answers);
      setAIResponse(flow, transmission);
      setStatus(flow, 'done');
    } catch (err) {
      const message =
        err instanceof Error && err.message.length > 0
          ? err.message
          : 'Sakha could not respond right now.';
      setStatus(flow, 'error', message);
      throw err;
    }
  }, [flow, setStatus, setAIResponse]);

  const resetFlow = useCallback(() => {
    reset(flow);
  }, [flow, reset]);

  return {
    answers: bucket.answers,
    status: bucket.status,
    error: bucket.error,
    flow: bucket,
    updateAnswer,
    submitFlow,
    resetFlow,
  };
}
