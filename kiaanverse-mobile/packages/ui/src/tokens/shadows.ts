/**
 * Kiaanverse Shadow Presets — Canonical KIAANVERSE Spec
 *
 * Uses iOS shadow* properties + Android elevation. The four canonical
 * semantic shadows (card / divine / krishnaGlow / ripple) mirror the
 * spec exactly; sm / md / lg / glow / glowStrong are retained aliases
 * for existing consumers.
 */

import { DIVINE_GOLD, KRISHNA_BLUE } from './colors';

export const shadows = {
  // --------------------------------------------------------------------
  // Canonical named shadows (preferred API)
  // --------------------------------------------------------------------

  /** CARD — deep cosmic drop shadow for elevated surfaces. */
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },

  /** DIVINE — subtle gold aura for sacred elements (use sparingly). */
  divine: {
    shadowColor: DIVINE_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },

  /** GLOW — Krishna-blue action glow for primary CTAs and links. */
  krishnaGlow: {
    shadowColor: KRISHNA_BLUE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },

  /** RIPPLE — golden ripple halo for milestone moments. */
  ripple: {
    shadowColor: DIVINE_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 12,
  },

  // --------------------------------------------------------------------
  // Legacy aliases — retained for backwards compatibility.
  // --------------------------------------------------------------------

  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: DIVINE_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  glowStrong: {
    shadowColor: DIVINE_GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

export type Shadows = typeof shadows;
