export interface DharmaAxis {
  id: string
  label: string
  sanskrit: string
  angle: number  // degrees (0-315, step 45)
}

export const DHARMA_AXES: DharmaAxis[] = [
  { id: 'trust',      label: 'Trust',      sanskrit: 'विश्वास',     angle: 0 },
  { id: 'honesty',    label: 'Honesty',    sanskrit: 'सत्य',       angle: 45 },
  { id: 'respect',    label: 'Respect',    sanskrit: 'आदर',        angle: 90 },
  { id: 'growth',     label: 'Growth',     sanskrit: 'विकास',      angle: 135 },
  { id: 'freedom',    label: 'Freedom',    sanskrit: 'स्वातंत्र्य', angle: 180 },
  { id: 'compassion', label: 'Compassion', sanskrit: 'करुणा',      angle: 225 },
  { id: 'dharma',     label: 'Dharma',     sanskrit: 'धर्म',       angle: 270 },
  { id: 'union',      label: 'Union',      sanskrit: 'योग',        angle: 315 },
]
