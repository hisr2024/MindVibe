/**
 * useDharmaMapData — projects the three guna ratios onto the 8 dharma axes.
 *
 * Sattva nourishes trust, honesty, respect, growth, dharma.
 * Tamas erodes freedom, growth, union, compassion.
 * Rajas creates imbalance in respect, freedom, union.
 *
 * With zero selections every axis returns 0.5 (a balanced baseline).
 */

import { useMemo } from 'react';
import { DHARMA_AXES } from '../data/dharmaAxes';
import type { GunaSelections } from './useGunaCalculation';

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export function useDharmaMapData(
  selectedPatterns: GunaSelections
): Record<string, number> {
  return useMemo(() => {
    const tamasCount = selectedPatterns.tamas.length;
    const rajasCount = selectedPatterns.rajas.length;
    const sattvaCount = selectedPatterns.sattva.length;
    const total = tamasCount + rajasCount + sattvaCount;

    if (total === 0) {
      return Object.fromEntries(DHARMA_AXES.map((a) => [a.id, 0.5]));
    }

    const sattvaRatio = sattvaCount / total;
    const tamasRatio = tamasCount / total;
    const rajasRatio = rajasCount / total;

    return {
      trust: clamp01(0.3 + sattvaRatio * 0.7 - tamasRatio * 0.3),
      honesty: clamp01(0.3 + sattvaRatio * 0.6 - tamasRatio * 0.2),
      respect: clamp01(0.3 + sattvaRatio * 0.7 - rajasRatio * 0.2),
      growth: clamp01(0.3 + sattvaRatio * 0.5 - tamasRatio * 0.4),
      freedom: clamp01(
        0.4 - tamasRatio * 0.3 - rajasRatio * 0.3 + sattvaRatio * 0.4
      ),
      compassion: clamp01(0.3 + sattvaRatio * 0.6 - tamasRatio * 0.4),
      dharma: clamp01(0.2 + sattvaRatio * 0.8 - tamasRatio * 0.2),
      union: clamp01(
        0.3 + sattvaRatio * 0.5 - tamasRatio * 0.3 - rajasRatio * 0.2
      ),
    };
  }, [
    selectedPatterns.tamas.length,
    selectedPatterns.rajas.length,
    selectedPatterns.sattva.length,
  ]);
}

export default useDharmaMapData;
