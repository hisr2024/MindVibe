/**
 * useSacredFlow — lightweight state container for multi-step sacred tool flows.
 *
 * Each flow (viyoga, ardha, karma-reset, emotional-reset, relationship-compass)
 * owns a bucket of string answers collected across its input screens plus a
 * response payload the submission screen fills after calling KIAAN.
 * Storage is in-memory only — these flows are transient by design (a user
 * should not resume a half-finished reflection after killing the app; they
 * should arrive fresh).
 *
 * Submission:
 *   - `viyoga` still posts to the dedicated `/api/viyoga/chat` route so the
 *     existing meditation → release → fire screens keep their richer
 *     `ViyogaTransmission` (karma_yoga_insight, citations). The structured
 *     shape is shaped into five accordion sections + screen-local copy
 *     defaults for the transmission screen.
 *   - The other four flows call the unified `/api/kiaan/tools/*` surface
 *     (see `kiaan/client.ts`). They receive a single `response` string
 *     which is stored as `plainText` on the bucket; the tool's complete
 *     screen renders it verbatim inside a SakhaResponse card.
 *
 * Usage:
 *   const { answers, updateAnswer, submitFlow, status, flow } =
 *     useSacredFlow('ardha');
 *   updateAnswer('situation', 'I keep missing deadlines');
 *   updateAnswer('limiting_belief', "I'm not disciplined enough");
 *   updateAnswer('fear', 'Everyone will stop trusting me');
 *   await submitFlow();
 *   console.log(flow.plainText); // KIAAN's reframe
 */

import { useCallback } from 'react';
import { create } from 'zustand';
import {
  api,
  kiaan,
  isAuthError,
  isOfflineError,
  isApiError,
  type KiaanGitaVerse,
} from '@kiaanverse/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FlowName =
  | 'viyoga'
  | 'ardha'
  | 'karma-reset'
  | 'emotional-reset'
  | 'relationship-compass';

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
 *
 * Downstream screens (meditation, release, fire) read optional fields
 * populated either by a future structured response or by tasteful
 * screen-local defaults when absent.
 */
export interface ViyogaTransmission {
  readonly header: string;
  readonly footer: string;
  readonly sections: readonly { readonly content: string }[];
  readonly verse: string | null;
  /** One sentence per meditation screen (meditation.tsx). */
  readonly meditationScreens: readonly string[];
  /** Second-line copy under "What do you wish to release?" (release.tsx). */
  readonly releaseSubtitle: string;
  /** Three closing lines on the Sacred Fire screen (fire.tsx). */
  readonly fireLines: readonly string[];
}

export type FlowAIResponse = ViyogaTransmission | null;

export interface FlowBucket {
  readonly answers: FlowAnswers;
  readonly status: FlowStatus;
  readonly error: string | null;
  /** Viyoga-only structured transmission. Null for other flows. */
  readonly aiResponse: FlowAIResponse;
  /** Raw KIAAN response text for ardha / karma-reset / emotional-reset /
   *  relationship-compass. Null for Viyoga (which uses `aiResponse`). */
  readonly plainText: string | null;
  /** Verse the user surfaced from WisdomCore before submitting; echoed to
   *  the backend so its grounding matches what the user saw. */
  readonly verse: KiaanGitaVerse | null;
}

interface SacredFlowState {
  flows: Record<string, FlowBucket>;
  setAnswer: (flow: FlowName, key: string, value: string) => void;
  setVerse: (flow: FlowName, verse: KiaanGitaVerse | null) => void;
  setStatus: (
    flow: FlowName,
    status: FlowStatus,
    error?: string | null
  ) => void;
  setAIResponse: (flow: FlowName, response: FlowAIResponse) => void;
  setPlainText: (flow: FlowName, text: string | null) => void;
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
  plainText: null,
  verse: null,
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

  setVerse: (flow, verse) =>
    set((state) => {
      const current = state.flows[flow] ?? EMPTY_BUCKET;
      return {
        flows: {
          ...state.flows,
          [flow]: { ...current, verse },
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

  setPlainText: (flow, text) =>
    set((state) => {
      const current = state.flows[flow] ?? EMPTY_BUCKET;
      return {
        flows: {
          ...state.flows,
          [flow]: { ...current, plainText: text },
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
  citations?: { reference_if_any?: string }[];
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
  answers: FlowAnswers
): ViyogaTransmission {
  const assistant = (raw.assistant ?? '').trim();
  const teaching = (raw.karma_yoga_insight?.teaching ?? '').trim();
  const remedy = (raw.karma_yoga_insight?.remedy ?? '').trim();
  const verse = (
    raw.karma_yoga_insight?.verse ??
    raw.citations?.[0]?.reference_if_any ??
    ''
  ).trim();

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

  const footer =
    verse.length > 0
      ? `Anchored in ${verse}`
      : 'Even in separation, there is union.';

  // Meditation / release / fire copy — backends today don't structure
  // these, so we hand the screens the same tasteful defaults they'd
  // otherwise inline. When the server eventually returns them, the
  // screens will pick them up automatically.
  const meditationScreens: readonly string[] = [
    'The longing you carry is sacred.',
    'It is not weakness. It is love with nowhere to go.',
    'Breathe in what you remember.',
    'You carry it within you. It lives in your bones.',
    'The separation is real. The connection is also real.',
    'Distance cannot sever what is written into you.',
    'You are not uprooted. Your roots stretch everywhere.',
    'The bond holds. It always holds.',
    'Breathe out slowly. You are exactly where you are meant to be.',
  ];

  const releaseSubtitle =
    'Not the love. Not the memory. But the weight of the pain.';

  const fireLines: readonly string[] = [
    'Your offering has been received by the Sacred Fire.',
    'It is released... no longer has power over you.',
    'What remains is love. Only love.',
  ];

  return {
    header,
    footer,
    sections,
    verse: verse.length > 0 ? verse : null,
    meditationScreens,
    releaseSubtitle,
    fireLines,
  };
}

// ---------------------------------------------------------------------------
// Unified KIAAN submission — ardha / karma-reset / emotional-reset /
// relationship-compass. Returns the raw `response` string or throws.
// ---------------------------------------------------------------------------

/** Pick a string answer, trim, and fall back to `fallback` if empty. */
function pickAnswer(answers: FlowAnswers, key: string, fallback = ''): string {
  const v = answers[key];
  if (typeof v !== 'string') return fallback;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

async function submitKiaanTool(
  flow: Exclude<FlowName, 'viyoga'>,
  answers: FlowAnswers,
  verse: KiaanGitaVerse | null
): Promise<string> {
  const v = verse ?? undefined;

  switch (flow) {
    case 'ardha': {
      const res = await kiaan.tools.ardha(
        {
          situation: pickAnswer(answers, 'situation'),
          limiting_belief: pickAnswer(answers, 'limiting_belief'),
          fear: pickAnswer(answers, 'fear'),
        },
        v
      );
      return res.response;
    }
    case 'karma-reset': {
      const res = await kiaan.tools.karmaReset(
        {
          pattern: pickAnswer(answers, 'pattern'),
          dimension: pickAnswer(answers, 'dimension', 'action'),
          dharmic_action: pickAnswer(answers, 'dharmic_action'),
        },
        v
      );
      return res.response;
    }
    case 'emotional-reset': {
      const res = await kiaan.tools.emotionalReset(
        {
          emotion: pickAnswer(answers, 'emotion', 'overwhelmed'),
          intensity: pickAnswer(answers, 'intensity', '5'),
          situation: pickAnswer(answers, 'situation'),
        },
        v
      );
      return res.response;
    }
    case 'relationship-compass': {
      const res = await kiaan.tools.relationshipCompass(
        {
          challenge: pickAnswer(answers, 'challenge'),
          relationship_type: pickAnswer(
            answers,
            'relationship_type',
            'partner'
          ),
          core_difficulty: pickAnswer(answers, 'core_difficulty'),
        },
        v
      );
      return res.response;
    }
  }
}

// ---------------------------------------------------------------------------
// Error → compassionate user-facing string. Callers can still inspect the
// status sentinel (`AUTH_EXPIRED`) to trigger a sign-in redirect.
// ---------------------------------------------------------------------------

const AUTH_EXPIRED_SENTINEL = 'AUTH_EXPIRED';

function humaniseError(err: unknown): string {
  if (isAuthError(err)) return AUTH_EXPIRED_SENTINEL;
  if (isOfflineError(err)) return "Saved. Sakha will reply when you're online.";
  if (isApiError(err)) {
    if (err.statusCode === 429)
      return 'Pause, breathe — too many requests. Try in a minute.';
    if (
      err.statusCode === 502 ||
      err.statusCode === 503 ||
      err.statusCode === 504
    )
      return 'Sakha is collecting herself. Your words are saved locally; try again.';
    if (err.statusCode >= 500)
      return 'Something went wrong. Your words are safe.';
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message.length > 0) return err.message;
  return 'Sakha could not respond right now.';
}

/** Exported so tool screens can detect auth failures and redirect. */
export const FLOW_AUTH_EXPIRED = AUTH_EXPIRED_SENTINEL;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseSacredFlowResult {
  readonly answers: FlowAnswers;
  readonly status: FlowStatus;
  readonly error: string | null;
  readonly flow: FlowBucket;
  readonly updateAnswer: (key: string, value: string) => void;
  readonly setVerse: (verse: KiaanGitaVerse | null) => void;
  readonly submitFlow: () => Promise<void>;
  readonly resetFlow: () => void;
}

/**
 * Access the collected state for a given sacred flow.
 *
 * `submitFlow()` routes by flow name:
 *   - `viyoga` → `/api/viyoga/chat` (rich structured transmission).
 *   - others  → `/api/kiaan/tools/<tool>` (plain response string).
 *
 * Errors are humanised on the bucket's `error` field. The `AUTH_EXPIRED`
 * sentinel (exported as `FLOW_AUTH_EXPIRED`) lets screens redirect to
 * sign-in without catching the error themselves.
 */
export function useSacredFlow(flow: FlowName): UseSacredFlowResult {
  const bucket = useSacredFlowStore(
    (state) => state.flows[flow] ?? EMPTY_BUCKET
  );
  const setAnswer = useSacredFlowStore((state) => state.setAnswer);
  const setVerseFn = useSacredFlowStore((state) => state.setVerse);
  const setStatus = useSacredFlowStore((state) => state.setStatus);
  const setAIResponse = useSacredFlowStore((state) => state.setAIResponse);
  const setPlainText = useSacredFlowStore((state) => state.setPlainText);
  const reset = useSacredFlowStore((state) => state.reset);

  const updateAnswer = useCallback(
    (key: string, value: string) => {
      setAnswer(flow, key, value);
    },
    [flow, setAnswer]
  );

  const setVerse = useCallback(
    (verse: KiaanGitaVerse | null) => {
      setVerseFn(flow, verse);
    },
    [flow, setVerseFn]
  );

  const submitFlow = useCallback(async (): Promise<void> => {
    setStatus(flow, 'calling');

    // Read the latest answers directly from the store so we don't hold
    // a stale closure snapshot from render time.
    const latest = useSacredFlowStore.getState().flows[flow] ?? EMPTY_BUCKET;

    try {
      if (flow === 'viyoga') {
        const { data } = await api.viyoga.chat(
          buildViyogaPrompt(latest.answers)
        );
        const raw = (data ?? {}) as ViyogaBackendResponse;

        if (raw.error) {
          throw new Error(raw.error);
        }

        const transmission = shapeTransmission(raw, latest.answers);
        setAIResponse(flow, transmission);
        // Mirror the raw assistant text onto plainText as well so
        // callers that don't care about the five-section shape can
        // still access it (e.g. a "copy to journal" affordance).
        setPlainText(flow, (raw.assistant ?? '').trim());
        setStatus(flow, 'done');
        return;
      }

      const text = await submitKiaanTool(flow, latest.answers, latest.verse);
      setPlainText(flow, text);
      setStatus(flow, 'done');
    } catch (err) {
      const message = humaniseError(err);
      setStatus(flow, 'error', message);
      throw err;
    }
  }, [flow, setStatus, setAIResponse, setPlainText]);

  const resetFlow = useCallback(() => {
    reset(flow);
  }, [flow, reset]);

  return {
    answers: bucket.answers,
    status: bucket.status,
    error: bucket.error,
    flow: bucket,
    updateAnswer,
    setVerse,
    submitFlow,
    resetFlow,
  };
}
