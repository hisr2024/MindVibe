/**
 * useDharmaMapData — Derives 8 dharma axis values from guna pattern selections
 *
 * Maps the three guna ratios onto the relationship dharma axes:
 * Sattva raises trust, honesty, respect, dharma.
 * Tamas lowers freedom, growth, union, compassion.
 * Rajas creates imbalance in respect, freedom, union.
 */

import { DHARMA_AXES } from '../data/dharmaAxes'

export function useDharmaMapData(selectedPatterns: {
  tamas: string[]
  rajas: string[]
  sattva: string[]
}): Record<string, number> {
  const tamasCount = selectedPatterns.tamas.length
  const rajasCount = selectedPatterns.rajas.length
  const sattvaCount = selectedPatterns.sattva.length
  const total = tamasCount + rajasCount + sattvaCount

  if (total === 0) {
    // Baseline 0.5 for all axes when no patterns selected
    return Object.fromEntries(DHARMA_AXES.map((a) => [a.id, 0.5]))
  }

  const sattvaRatio = sattvaCount / Math.max(total, 1)
  const tamasRatio = tamasCount / Math.max(total, 1)
  const rajasRatio = rajasCount / Math.max(total, 1)

  // Each axis is influenced differently by the three gunas
  // Values are clamped to [0, 1]
  const clamp = (v: number) => Math.max(0, Math.min(1, v))

  return {
    trust: clamp(0.3 + sattvaRatio * 0.7 - tamasRatio * 0.3),
    honesty: clamp(0.3 + sattvaRatio * 0.6 - tamasRatio * 0.2),
    respect: clamp(0.3 + sattvaRatio * 0.7 - rajasRatio * 0.2),
    growth: clamp(0.3 + sattvaRatio * 0.5 - tamasRatio * 0.4),
    freedom: clamp(0.4 - tamasRatio * 0.3 - rajasRatio * 0.3 + sattvaRatio * 0.4),
    compassion: clamp(0.3 + sattvaRatio * 0.6 - tamasRatio * 0.4),
    dharma: clamp(0.2 + sattvaRatio * 0.8 - tamasRatio * 0.2),
    union: clamp(0.3 + sattvaRatio * 0.5 - tamasRatio * 0.3 - rajasRatio * 0.2),
  }
}

export default useDharmaMapData
