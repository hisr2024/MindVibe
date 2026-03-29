export interface DharmicQuality {
  id: string
  sanskrit: string
  label: string
  description: string
  color: string
}

export const DHARMIC_QUALITIES: DharmicQuality[] = [
  { id: 'compassion', sanskrit: 'करुणा',   label: 'Compassion',        description: 'Seeing their pain as sacred',       color: '#0E7490' },
  { id: 'honesty',    sanskrit: 'सत्य',    label: 'Honesty',           description: 'Speaking truth with love',           color: '#D4A017' },
  { id: 'patience',   sanskrit: 'क्षमा',   label: 'Patience',          description: 'Waiting with wisdom',                color: '#065F46' },
  { id: 'detachment', sanskrit: 'वैराग्य', label: 'Sacred Detachment', description: 'Loving without clinging',            color: '#4338CA' },
  { id: 'service',    sanskrit: 'सेवा',    label: 'Seva',              description: 'Giving without expectation',         color: '#92400E' },
  { id: 'surrender',  sanskrit: 'समर्पण',  label: 'Surrender',         description: 'Releasing the outcome',              color: '#9D174D' },
]
