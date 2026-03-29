/**
 * useGunaCalculation — Pure calculation of guna scores from pattern selections
 *
 * Returns normalized scores (0-1) for each guna and the dominant guna.
 * Max patterns per guna is 8, so scores are fractions of 8.
 */

interface GunaScores {
  tamas: number
  rajas: number
  sattva: number
  dominant: 'tamas' | 'rajas' | 'sattva' | 'balanced'
}

export function useGunaCalculation(selectedPatterns: {
  tamas: string[]
  rajas: string[]
  sattva: string[]
}): GunaScores {
  const tamas = selectedPatterns.tamas.length / 8
  const rajas = selectedPatterns.rajas.length / 8
  const sattva = selectedPatterns.sattva.length / 8

  const max = Math.max(tamas, rajas, sattva)
  let dominant: GunaScores['dominant'] = 'balanced'

  if (max > 0) {
    if (tamas === max && tamas > rajas && tamas > sattva) dominant = 'tamas'
    else if (rajas === max && rajas > tamas && rajas > sattva) dominant = 'rajas'
    else if (sattva === max && sattva > tamas && sattva > rajas) dominant = 'sattva'
  }

  return { tamas, rajas, sattva, dominant }
}

export default useGunaCalculation
