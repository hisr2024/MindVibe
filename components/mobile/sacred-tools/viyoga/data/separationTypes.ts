/**
 * Viyoga Sacred Journey — Separation Type Definitions
 *
 * Each separation type represents a distinct form of human longing and loss,
 * mapped to Bhagavad Gita verses that speak to that particular wound.
 * Colors, particles, and field tints create the visual atmosphere
 * for the meditation experience.
 */

export interface SeparationType {
  id: string
  sanskrit: string        // Devanagari
  label: string           // English name
  subtext: string         // One-line description
  color: string           // Primary color hex
  fieldColor: string      // Background tint hex
  particle: string        // Particle color name
  shlokaBias: string[]    // Gita verse references
}

export const SEPARATION_TYPES: SeparationType[] = [
  {
    id: 'death',
    sanskrit: 'मृत्यु-विछेद',
    label: 'Departure Through Death',
    subtext: 'A soul has crossed the threshold',
    color: '#3730A3',
    fieldColor: '#0A0818',
    particle: 'silver',
    shlokaBias: ['2.20', '2.23', '2.24', '2.19', '15.7'],
  },
  {
    id: 'estrangement',
    sanskrit: 'सम्बन्ध-विच्छेद',
    label: 'Estrangement & Silence',
    subtext: 'Distance that was chosen or imposed',
    color: '#0E7490',
    fieldColor: '#060F18',
    particle: 'teal',
    shlokaBias: ['16.1', '12.13', '12.14', '12.15', '13.27'],
  },
  {
    id: 'heartbreak',
    sanskrit: 'प्रेम-वेदना',
    label: 'Heartbreak & Romantic Loss',
    subtext: 'Love that transformed or ended',
    color: '#9D174D',
    fieldColor: '#180810',
    particle: 'rose',
    shlokaBias: ['2.47', '2.48', '2.55', '2.70', '12.17'],
  },
  {
    id: 'self',
    sanskrit: 'आत्म-विछेद',
    label: 'Separation from Self',
    subtext: 'Lost, numb, no longer yourself',
    color: '#4338CA',
    fieldColor: '#0A0A1A',
    particle: 'purple',
    shlokaBias: ['6.5', '6.6', '13.2', '13.3', '10.20'],
  },
  {
    id: 'homeland',
    sanskrit: 'देश-विरह',
    label: 'Longing for Home',
    subtext: 'Exile, displacement, rootlessness',
    color: '#92400E',
    fieldColor: '#100A04',
    particle: 'amber',
    shlokaBias: ['9.22', '9.34', '18.65', '8.14', '8.15'],
  },
  {
    id: 'divine',
    sanskrit: 'विरह-भक्ति',
    label: 'Longing for the Divine',
    subtext: 'Spiritual separation, the dark night',
    color: '#D4A017',
    fieldColor: '#0A0804',
    particle: 'gold',
    shlokaBias: ['9.29', '9.30', '9.31', '12.8', '12.9'],
  },
]
