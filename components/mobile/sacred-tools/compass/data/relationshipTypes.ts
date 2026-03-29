export interface RelationshipTypeData {
  id: string
  sanskrit: string
  label: string
  color: string
}

export const RELATIONSHIP_TYPES: RelationshipTypeData[] = [
  { id: 'partner',   sanskrit: 'प्रिय',     label: 'Partner',       color: '#9D174D' },
  { id: 'parent',    sanskrit: 'माता-पिता',  label: 'Parent',        color: '#92400E' },
  { id: 'child',     sanskrit: 'पुत्र',      label: 'Child',         color: '#065F46' },
  { id: 'sibling',   sanskrit: 'भ्राता',     label: 'Sibling',       color: '#1D4ED8' },
  { id: 'friend',    sanskrit: 'मित्र',      label: 'Friend',        color: '#0E7490' },
  { id: 'colleague', sanskrit: 'सहकर्मी',    label: 'Colleague',     color: '#4338CA' },
  { id: 'guru',      sanskrit: 'गुरु',       label: 'Teacher/Guru',  color: '#D4A017' },
  { id: 'self',      sanskrit: 'आत्मन्',     label: 'With Myself',   color: '#6B21A8' },
]
