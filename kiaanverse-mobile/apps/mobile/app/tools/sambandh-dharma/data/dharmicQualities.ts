/**
 * Dharmic qualities the user can choose as their sankalpa (intention)
 * in the final reflection chamber. Six qualities, paired in a 2-column grid.
 */

export interface DharmicQuality {
  readonly id: string;
  readonly sanskrit: string;
  readonly label: string;
  readonly description: string;
  readonly color: string;
}

export const DHARMIC_QUALITIES: readonly DharmicQuality[] = [
  {
    id: 'compassion',
    sanskrit: 'करुणा',
    label: 'Compassion',
    description: 'Seeing their pain as sacred',
    color: '#0E7490',
  },
  {
    id: 'honesty',
    sanskrit: 'सत्य',
    label: 'Honesty',
    description: 'Speaking truth with love',
    color: '#D4A017',
  },
  {
    id: 'patience',
    sanskrit: 'क्षमा',
    label: 'Patience',
    description: 'Waiting with wisdom',
    color: '#065F46',
  },
  {
    id: 'detachment',
    sanskrit: 'वैराग्य',
    label: 'Sacred Detachment',
    description: 'Loving without clinging',
    color: '#4338CA',
  },
  {
    id: 'service',
    sanskrit: 'सेवा',
    label: 'Seva',
    description: 'Giving without expectation',
    color: '#92400E',
  },
  {
    id: 'surrender',
    sanskrit: 'समर्पण',
    label: 'Surrender',
    description: 'Releasing the outcome',
    color: '#9D174D',
  },
] as const;

export function findQualityById(id: string | null): DharmicQuality | null {
  if (!id) return null;
  return DHARMIC_QUALITIES.find((q) => q.id === id) ?? null;
}
