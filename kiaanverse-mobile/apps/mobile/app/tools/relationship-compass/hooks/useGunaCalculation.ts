/**
 * useGunaCalculation — derive normalized 0-1 guna scores + dominant guna
 * from the user's pattern selections.
 *
 * Each guna offers 8 patterns; scores are simply count / 8 so the dominant
 * label only flips when one guna has strictly more selections than the
 * others. With zero selections the result is "balanced".
 */

import { useMemo } from 'react';

export type GunaName = 'tamas' | 'rajas' | 'sattva' | 'balanced';

export interface GunaScores {
  readonly tamas: number;
  readonly rajas: number;
  readonly sattva: number;
  readonly dominant: GunaName;
}

export interface GunaSelections {
  readonly tamas: readonly string[];
  readonly rajas: readonly string[];
  readonly sattva: readonly string[];
}

const PATTERNS_PER_GUNA = 8;

export function useGunaCalculation(selectedPatterns: GunaSelections): GunaScores {
  return useMemo(() => {
    const tamas = selectedPatterns.tamas.length / PATTERNS_PER_GUNA;
    const rajas = selectedPatterns.rajas.length / PATTERNS_PER_GUNA;
    const sattva = selectedPatterns.sattva.length / PATTERNS_PER_GUNA;

    const max = Math.max(tamas, rajas, sattva);
    let dominant: GunaName = 'balanced';

    if (max > 0) {
      if (tamas === max && tamas > rajas && tamas > sattva) dominant = 'tamas';
      else if (rajas === max && rajas > tamas && rajas > sattva) dominant = 'rajas';
      else if (sattva === max && sattva > tamas && sattva > rajas) dominant = 'sattva';
    }

    return { tamas, rajas, sattva, dominant };
  }, [
    selectedPatterns.tamas.length,
    selectedPatterns.rajas.length,
    selectedPatterns.sattva.length,
  ]);
}

export default useGunaCalculation;
