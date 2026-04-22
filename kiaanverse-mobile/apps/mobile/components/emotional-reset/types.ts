/**
 * Shared types for the Emotional Reset Expo port.
 *
 * Mirrors the web implementation at `app/(mobile)/m/emotional-reset/page.tsx`
 * so the two platforms can share terminology and a 1:1 ritual structure.
 */

export type EmotionalResetPhase =
  | 'arrival'
  | 'mandala'
  | 'witness'
  | 'breath'
  | 'integration'
  | 'ceremony';

export interface EmotionalState {
  id: string;
  label: string;
  sanskrit: string;
  glowColor: string;
  emoji: string;
}

export const EMOTIONS: EmotionalState[] = [
  { id: 'anger',     label: 'Anger',      sanskrit: 'क्रोध',   glowColor: '#EF4444', emoji: '🔥' },
  { id: 'fear',      label: 'Fear',       sanskrit: 'भय',      glowColor: '#3B82F6', emoji: '💧' },
  { id: 'grief',     label: 'Grief',      sanskrit: 'शोक',     glowColor: '#6B7280', emoji: '🌧' },
  { id: 'anxiety',   label: 'Anxiety',    sanskrit: 'चिंता',   glowColor: '#8B5CF6', emoji: '🌀' },
  { id: 'confusion', label: 'Confusion',  sanskrit: 'भ्रम',    glowColor: '#F59E0B', emoji: '🌫' },
  { id: 'despair',   label: 'Despair',    sanskrit: 'निराशा',  glowColor: '#64748B', emoji: '🌑' },
];

export interface Shloka {
  sanskrit: string;
  transliteration: string;
  translation: string;
  reference: string;
}

export interface AIResponse {
  witness: string;
  shloka: Shloka;
  reflection: string;
  affirmation: string;
}

export interface BreathingPattern {
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
}

/** Breathing pattern tuned to emotional intensity. */
export function breathPatternForIntensity(intensity: number): BreathingPattern {
  if (intensity <= 2) return { inhale: 4, holdIn: 4, exhale: 4, holdOut: 1 };
  if (intensity <= 4) return { inhale: 4, holdIn: 7, exhale: 8, holdOut: 1 };
  return { inhale: 2, holdIn: 4, exhale: 6, holdOut: 1 };
}

/** Parse the backend's sectioned AI reply ([WITNESS][SHLOKA][REFLECTION][AFFIRMATION]). */
export function parseAIResponse(raw: string): AIResponse | null {
  if (!raw) return null;
  try {
    const witnessMatch = raw.match(/\[WITNESS\]\s*([\s\S]*?)(?=\[SHLOKA\])/i);
    const shlokaMatch = raw.match(/\[SHLOKA\]\s*([\s\S]*?)(?=\[REFLECTION\])/i);
    const reflectionMatch = raw.match(/\[REFLECTION\]\s*([\s\S]*?)(?=\[AFFIRMATION\])/i);
    const affirmationMatch = raw.match(/\[AFFIRMATION\]\s*([\s\S]*?)$/i);

    const witness = witnessMatch?.[1]?.trim() ?? '';
    const shlokaText = shlokaMatch?.[1]?.trim() ?? '';
    const reflection = reflectionMatch?.[1]?.trim() ?? '';
    const affirmation = affirmationMatch?.[1]?.trim() ?? '';

    const lines = shlokaText.split('\n').map((s) => s.trim()).filter(Boolean);
    const shloka: Shloka = {
      sanskrit: lines[0] ?? '',
      transliteration: lines[1] ?? '',
      translation: lines[2] ?? '',
      reference: lines[3] ?? '',
    };

    if (!witness && !reflection) return null;
    return { witness, shloka, reflection, affirmation };
  } catch {
    return null;
  }
}

/** Shared fallback response — used when the backend is unreachable. */
export const FALLBACK_RESPONSE: AIResponse = {
  witness:
    'Dear one, your feeling is valid and witnessed. Sakha holds space for what arises in you right now.',
  shloka: {
    sanskrit: 'धृतिस्मृतिलभस्तत्त्वं',
    transliteration: 'dhritis smritir labhas tattvam',
    translation:
      'Fortitude, memory, wisdom, and steadfastness — these are born of sattva.',
    reference: 'BG 18.43',
  },
  reflection:
    'The Gita reminds us that within every storm of emotion lies the unchanged Atman. Like the ocean remains deep even when its surface churns, your true self is unshaken.',
  affirmation:
    'I am the eternal witness, undisturbed by the waves of temporary feeling.',
};
