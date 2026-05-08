/**
 * summarize — extract a short, meaningful summary from a Sakha response.
 *
 * Port of the desktop kiaanverse.com `buildSummary` heuristic
 * (components/chat/MessageBubble.tsx). Keeps the Android app's
 * "Saransh" (Hindi: सारांश, summary) toggle behaviorally identical
 * to the web's "summary" view mode so users get the same short-form
 * experience across platforms.
 *
 * Strategy:
 *   1. Normalize whitespace + strip markdown emphasis (`*foo*`).
 *   2. Split into sentences (>20 chars).
 *   3. Find one sentence with a "wisdom marker" (psychology /
 *      attachment / pattern / etc.) — these are usually the
 *      core insight of a Sakha response.
 *   4. Find one sentence with an "action marker" (practice / try /
 *      begin / etc.) — these usually contain the practical takeaway.
 *   5. Combine wisdom + action. If neither exists, fall back to the
 *      first 2 substantive sentences.
 *   6. Cap at 350 chars (matches web).
 *   7. Ensure clean ending punctuation.
 *
 * Returns empty string for empty/whitespace-only input.
 *
 * No backend call. No LLM round-trip. No latency. Same heuristic
 * the web uses as a fallback when AI-generated summary is absent —
 * mobile uses it as the PRIMARY path (no need to plumb a separate
 * summary field through the chat-streaming protocol).
 */

const WISDOM_MARKERS = [
  'pattern',
  'regulation',
  'nervous system',
  'attachment',
  'mechanism',
  'cognitive',
  'habit',
  'values',
  'conditioning',
  'awareness',
];

const ACTION_MARKERS = [
  'step',
  'practice',
  'try',
  'begin',
  'start',
  'notice',
  'focus',
  'take',
  'action',
  'choose',
];

/** Threshold below which a message is too short to need summarization. */
export const SUMMARIZE_THRESHOLD_CHARS = 280;

/** Hard cap on summary length to match the web's 350-char ceiling. */
const SUMMARY_MAX_CHARS = 350;

/** Inner truncation budget — leaves room for the trailing "..." marker. */
const SUMMARY_TRUNCATE_AT = 340;

export function summarize(text: string): string {
  // Normalize: collapse whitespace runs, strip *italic-emphasis* spans,
  // trim. Empty input returns empty so callers can decide whether to
  // show "no summary available" or hide the toggle entirely.
  const normalized = text
    .replace(/\s+/g, ' ')
    .replace(/\*[^*]*\*/g, '')
    .trim();
  if (!normalized) return '';

  // Sentence split via lookbehind on terminal punctuation. Filter out
  // very short fragments (< 20 chars) — these are usually section
  // headers or "Hi." style fillers, not substantive content.
  const sentences = normalized
    .split(/(?<=[.!?])\s+/u)
    .filter((s) => s.length > 20);

  if (sentences.length === 0) {
    // Whole text was one short fragment — return as-is, capped.
    return cap(normalized);
  }

  const wisdomSentence = sentences.find((s) =>
    WISDOM_MARKERS.some((m) => s.toLowerCase().includes(m)),
  );
  const actionSentence = sentences.find((s) =>
    ACTION_MARKERS.some((m) => s.toLowerCase().includes(m)),
  );

  let summary = '';
  if (wisdomSentence) summary = wisdomSentence;
  if (actionSentence && actionSentence !== wisdomSentence) {
    summary = summary ? `${summary} ${actionSentence}` : actionSentence;
  }

  // No marker hits → fall back to the first 2 substantive sentences.
  // These usually carry the lead of the response (Sakha's prose tends
  // to open with the central insight).
  if (!summary) {
    summary = sentences.slice(0, 2).join(' ');
  }

  return cap(summary);
}

/**
 * Cap to SUMMARY_MAX_CHARS, ensure clean ending punctuation. Pulled
 * out so the empty-fragments fallback path can use it too.
 */
function cap(s: string): string {
  let out = s;
  if (out.length > SUMMARY_MAX_CHARS) {
    out = out.slice(0, SUMMARY_TRUNCATE_AT) + '...';
  }
  if (out && !out.endsWith('.') && !out.endsWith('...')) {
    out = out.replace(/[!?]?$/u, '.');
  }
  return out;
}

/**
 * Should a Saransh toggle be shown for this text? Returns false when
 * the message is already short enough that a summary view would be
 * indistinguishable from the full text — saves UI clutter on quick
 * one-line responses ("Sure, here you go", "Got it", etc.).
 */
export function isWorthSummarizing(text: string): boolean {
  return text.trim().length > SUMMARIZE_THRESHOLD_CHARS;
}
