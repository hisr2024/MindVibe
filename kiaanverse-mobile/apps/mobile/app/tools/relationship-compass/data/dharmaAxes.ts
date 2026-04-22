/**
 * The 8 dharma axes that form the relationship-compass radar chart.
 *
 * Each axis points outward from the centre at a fixed angle (0° = up,
 * clockwise). Sanskrit + English labels are rendered just outside the
 * polygon's outermost ring.
 */

export interface DharmaAxis {
  readonly id: string;
  readonly label: string;
  readonly sanskrit: string;
  /** Degrees clockwise from north (0 = up). */
  readonly angle: number;
}

export const DHARMA_AXES: readonly DharmaAxis[] = [
  { id: 'trust',      label: 'Trust',      sanskrit: 'विश्वास',    angle: 0   },
  { id: 'honesty',    label: 'Honesty',    sanskrit: 'सत्य',       angle: 45  },
  { id: 'respect',    label: 'Respect',    sanskrit: 'आदर',        angle: 90  },
  { id: 'growth',     label: 'Growth',     sanskrit: 'विकास',      angle: 135 },
  { id: 'freedom',    label: 'Freedom',    sanskrit: 'स्वातंत्र्य', angle: 180 },
  { id: 'compassion', label: 'Compassion', sanskrit: 'करुणा',      angle: 225 },
  { id: 'dharma',     label: 'Dharma',     sanskrit: 'धर्म',       angle: 270 },
  { id: 'union',      label: 'Union',      sanskrit: 'योग',        angle: 315 },
] as const;
