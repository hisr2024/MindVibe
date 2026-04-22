/**
 * useCompassWisdom — calls the relationship-compass API with the user's
 * full guna context and returns a structured 7-section "transmission"
 * (the expandable card list seen on the Gita-Counsel chamber).
 *
 * Resilience:
 *   - The mobile API package's `useRelationshipGuide` already maps the
 *     backend's `compass_guidance` shape into a flat RelationshipGuidance.
 *   - When the API fails OR returns empty guidance (offline / outage)
 *     we fall back to a deterministic local transmission so the user is
 *     never stranded mid-flow. The fallback is grounded in the Gita
 *     references (BG 2.62-63, 6.29) the screen already promises.
 *
 * The hook returns a stable async function plus loading + error state so
 * the orchestrator can drive the chamber transition itself.
 */

import { useCallback, useState } from 'react';
import { useRelationshipGuide } from '@kiaanverse/api';
import type { GunaName } from './useGunaCalculation';
import { GUNA_PATTERNS, type GunaKey } from '../data/gunaPatterns';

export interface CompassTransmissionStep {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly body: string;
}

export interface CompassTransmission {
  readonly steps: readonly CompassTransmissionStep[];
  readonly verseCount: number;
  readonly source: 'api' | 'fallback';
  readonly generatedAt: string;
  readonly fullText: string;
}

export interface CompassWisdomInput {
  readonly relationshipTypeId: string;
  readonly relationshipTypeLabel: string;
  readonly partnerName: string;
  readonly initialGunaReading: GunaName;
  readonly dominantGuna: GunaName;
  readonly selectedPatterns: Readonly<Record<GunaKey, readonly string[]>>;
  readonly customQuery: string;
}

const MAX_QUERY_LEN = 500;

interface FallbackStepMeta {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
}

const FALLBACK_STEPS: readonly FallbackStepMeta[] = [
  { id: 'pause',       title: 'Step 1: Pause Before Reacting',     icon: '🌿' },
  { id: 'attachment',  title: 'Step 2: Identify the Attachment',   icon: '🔥' },
  { id: 'regulate',    title: 'Step 3: Regulate',                  icon: '🧘' },
  { id: 'speak',       title: 'Step 4: Speak (Karma Yoga)',        icon: '🕊️' },
  { id: 'humanity',    title: 'Step 5: See Their Humanity',        icon: '👁️' },
  { id: 'looks-like',  title: 'What This Looks Like',              icon: '📱' },
  { id: 'real-test',   title: 'The Real Test',                     icon: '💎' },
] as const;

function withBody(meta: FallbackStepMeta, body: string): CompassTransmissionStep {
  return { id: meta.id, title: meta.title, icon: meta.icon, body };
}

/**
 * Strip control characters, collapse whitespace, and trim to MAX_QUERY_LEN.
 * Avoids sending newlines / control chars that the backend rejects.
 */
function sanitizeText(input: string): string {
  // Strip control chars (U+0000-U+001F + U+007F) and collapse whitespace.
  // eslint-disable-next-line no-control-regex, no-misleading-character-class
  const stripped = input.replace(/[\u0000-\u001F\u007F]/g, ' ');
  return stripped.replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LEN);
}

/**
 * Build the enriched message the backend uses to ground its response.
 * This mirrors the web's `buildGunaContext` exactly so the same prompt
 * shape lands in the LLM regardless of platform.
 */
function buildEnrichedMessage(input: CompassWisdomInput): string {
  const patternTexts = (key: GunaKey): string =>
    input.selectedPatterns[key]
      .map((id) => GUNA_PATTERNS[key].find((p) => p.id === id)?.text)
      .filter(Boolean)
      .join('; ');

  const parts: string[] = [];
  parts.push(
    `[Relationship: ${input.relationshipTypeLabel} with ${input.partnerName || 'someone'}]`,
  );
  if (input.initialGunaReading && input.initialGunaReading !== 'balanced') {
    parts.push(`[Initial guna reading: ${input.initialGunaReading}]`);
  }
  parts.push(`[Dominant energy: ${input.dominantGuna}]`);
  if (input.selectedPatterns.tamas.length > 0) {
    parts.push(`[Tamas patterns: ${patternTexts('tamas')}]`);
  }
  if (input.selectedPatterns.rajas.length > 0) {
    parts.push(`[Rajas patterns: ${patternTexts('rajas')}]`);
  }
  if (input.selectedPatterns.sattva.length > 0) {
    parts.push(`[Sattva patterns: ${patternTexts('sattva')}]`);
  }
  const trimmedQuery = input.customQuery.trim();
  if (trimmedQuery.length > 0) {
    parts.push(`[User's own situation: ${trimmedQuery}]`);
  }

  const userSituation =
    trimmedQuery.length > 0
      ? trimmedQuery
      : `I need guidance on navigating this ${input.relationshipTypeLabel.toLowerCase()} with wisdom.`;

  return sanitizeText(`${parts.join(' ')} ${userSituation}`);
}

/**
 * Best-effort split of a free-form guidance string into the 7 transmission
 * steps. We look for sentence-ish boundaries; whatever doesn't slot in goes
 * into the final "Real Test" card so nothing is lost.
 */
function splitIntoSteps(
  guidance: string,
  fallback: CompassTransmission,
): readonly CompassTransmissionStep[] {
  // Split at sentence boundaries that precede a capital letter (English
  // upper-case OR any Devanagari letter, both covered by \p{Lu}/\p{L}).
  const sentences = guidance
    .split(/(?<=[.!?])\s+(?=\p{Lu}|\p{L})/u)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) return fallback.steps;

  const target = FALLBACK_STEPS.length;
  const perStep = Math.max(1, Math.ceil(sentences.length / target));

  return FALLBACK_STEPS.map((stepMeta, i) => {
    const slice = sentences.slice(i * perStep, (i + 1) * perStep).join(' ');
    const body = slice || fallback.steps[i]?.body || 'Pause and notice what arises.';
    return withBody(stepMeta, body);
  });
}

function buildFallback(input: CompassWisdomInput): CompassTransmission {
  const name = input.partnerName.trim() || 'them';
  const bodies: readonly string[] = [
    `Right now, part of you wants to react — to defend, to vent, to be heard. Pause. ` +
      `You feel ${input.dominantGuna === 'sattva' ? 'tender' : 'frustrated'} — and that feeling is real and valid. ` +
      `Name it. Sit with it for a moment. Your mind is telling you a story about what this means — about your worth, about ${name}'s intent. ` +
      `That story is inside you, and recognising that isn't weakness — it IS the practice. That pause alone prevents 80% of the damage.`,
    `You were attached to a specific outcome — to how ${name} SHOULD have responded, to what they SHOULD have understood. ` +
      `The pain lives in the gap between what you hoped for and what you got. The Gita reveals (BG 2.62–63): ` +
      `'From contemplation of sense objects arises attachment, from attachment springs desire, from desire comes anger, from anger arises delusion.' ` +
      `Instead of blaming, release the expectation first.`,
    `Bring breath into the body. Inhale 4, hold 4, exhale 6 — three rounds. ` +
      `The nervous system settles before the mind. Krishna's counsel in BG 6.5 — "Lift yourself by yourself, do not let yourself sink" — begins here, in the body. ` +
      `Only a regulated mind can speak dharma; an aroused one only speaks reaction.`,
    `Instead of: "You always do this. You don't care." Try: "When [specific thing] happened, I felt [specific emotion]. ` +
      `I value this relationship, so I wanted to share that honestly. I'm not looking for you to fix it or defend yourself — I just need you to know where I'm at." ` +
      `Notice the difference: no accusation, no demand, no emotional manipulation. You are doing your duty — honesty. You release the fruit — their reaction. ` +
      `If they respond defensively, you remain steady. If they apologise, you remain steady. That steadiness is the practice.`,
    `${name} is not a villain. They are a being trying their best with the ${input.dominantGuna === 'tamas' ? 'fog' : 'fire'} they carry. ` +
      `BG 6.29 — "One who sees the same Lord dwelling equally everywhere" — invites you to remember: most reactions come from old wounds, not from malice. ` +
      `They were overwhelmed, not because they don't care. Equal vision doesn't mean excusing the behaviour — it means you don't reduce a whole person to one moment. ` +
      `Hold space for their complexity while protecting your own peace.`,
    `"Hey, I realised I reacted internally because I had expectations. I value our relationship, so I wanted to say I felt [emotion] when [event]. ` +
      `No blame — I just wanted to be open. I'm good, and I hope we can stay steady with each other."`,
    `The real test isn't whether ${name} responds the way you hope. The real test is whether you can keep choosing dharma — clarity, compassion, honesty — ` +
      `regardless of their reaction. That is karma yoga in a relationship: action without attachment to the fruit. The Compass returns you to yourself.`,
  ];

  const steps: CompassTransmissionStep[] = FALLBACK_STEPS.map((meta, i) =>
    withBody(meta, bodies[i] ?? 'Pause and notice what arises.'),
  );

  const fullText = steps.map((s) => `${s.title}\n${s.body}`).join('\n\n');
  return {
    steps,
    verseCount: 3,
    source: 'fallback',
    generatedAt: new Date().toISOString(),
    fullText,
  };
}

export interface UseCompassWisdomResult {
  readonly transmission: CompassTransmission | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly request: (input: CompassWisdomInput) => Promise<CompassTransmission>;
  readonly reset: () => void;
}

export function useCompassWisdom(): UseCompassWisdomResult {
  const guideMutation = useRelationshipGuide();
  const [transmission, setTransmission] = useState<CompassTransmission | null>(null);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async (input: CompassWisdomInput): Promise<CompassTransmission> => {
      setError(null);
      const enrichedMessage = buildEnrichedMessage(input);
      const fallback = buildFallback(input);

      try {
        const trimmedContext = input.customQuery.trim();
        const payload: { question: string; context?: string } = {
          question: enrichedMessage,
        };
        if (trimmedContext.length > 0) payload.context = trimmedContext;
        const result = await guideMutation.mutateAsync(payload);

        const guidance = (result.guidance ?? '').trim();
        if (guidance.length === 0) {
          // API replied but with no body — degrade to fallback rather than show blank.
          setTransmission(fallback);
          return fallback;
        }

        const verseCount =
          (result.verse ? 1 : 0) + (result.dharma_principles?.length ?? 0);
        const apiSteps = splitIntoSteps(guidance, fallback);
        const apiTransmission: CompassTransmission = {
          steps: apiSteps,
          verseCount: Math.max(1, verseCount),
          source: 'api',
          generatedAt: new Date().toISOString(),
          fullText: guidance,
        };
        setTransmission(apiTransmission);
        return apiTransmission;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Relationship Compass is gathering wisdom. Showing your offline guide.';
        setError(message);
        setTransmission(fallback);
        return fallback;
      }
    },
    [guideMutation],
  );

  const reset = useCallback(() => {
    setTransmission(null);
    setError(null);
  }, []);

  return {
    transmission,
    loading: guideMutation.isPending,
    error,
    request,
    reset,
  };
}

export default useCompassWisdom;
