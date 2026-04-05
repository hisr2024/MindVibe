/**
 * Kiaanverse divine dark theme for Stripe Elements.
 *
 * Matches the sacred-mobile.css design system:
 * - Cosmic void backgrounds
 * - Divine gold accents
 * - Outfit font family
 * - Sacred border radii and spacing
 */

import type { Appearance } from '@stripe/stripe-js'

export const STRIPE_APPEARANCE: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#D4A017',
    colorBackground: '#111435',
    colorText: '#EDE8DC',
    colorTextSecondary: '#B8AE98',
    colorTextPlaceholder: '#6B6355',
    colorIconTab: '#B8AE98',
    colorIconTabSelected: '#D4A017',
    colorDanger: '#FCA5A5',
    fontFamily: '"Outfit", system-ui, sans-serif',
    fontSizeBase: '14px',
    borderRadius: '14px',
    spacingUnit: '4px',
    spacingGridRow: '16px',
    spacingGridColumn: '16px',
  },
  rules: {
    '.Input': {
      backgroundColor: 'rgba(22,26,66,0.55)',
      border: '1px solid rgba(212,160,23,0.18)',
      color: '#EDE8DC',
      fontSize: '14px',
      padding: '12px 14px',
    },
    '.Input:focus': {
      border: '1px solid rgba(212,160,23,0.6)',
      boxShadow: '0 0 0 3px rgba(212,160,23,0.08)',
      outline: 'none',
    },
    '.Input--invalid': {
      border: '1px solid rgba(239,68,68,0.6)',
    },
    '.Label': {
      color: '#B8AE98',
      fontSize: '11px',
      fontWeight: '400',
      letterSpacing: '0.06em',
      textTransform: 'uppercase' as const,
      marginBottom: '6px',
    },
    '.Error': {
      color: '#FCA5A5',
      fontSize: '12px',
      marginTop: '6px',
    },
    '.Tab': {
      backgroundColor: 'rgba(22,26,66,0.4)',
      border: '1px solid rgba(212,160,23,0.12)',
      borderRadius: '12px',
      color: '#B8AE98',
      padding: '10px 14px',
    },
    '.Tab:hover': {
      backgroundColor: 'rgba(22,26,66,0.7)',
      border: '1px solid rgba(212,160,23,0.3)',
      color: '#EDE8DC',
    },
    '.Tab--selected': {
      backgroundColor: 'rgba(212,160,23,0.1)',
      border: '1px solid rgba(212,160,23,0.5)',
      color: '#F0C040',
      boxShadow: '0 0 0 1px rgba(212,160,23,0.3)',
    },
    '.Tab--selected:focus': {
      boxShadow: '0 0 0 3px rgba(212,160,23,0.15)',
    },
    '.TabIcon--selected': {
      fill: '#D4A017',
    },
    '.TabLabel--selected': {
      color: '#F0C040',
    },
    '.Block': {
      backgroundColor: 'rgba(22,26,66,0.4)',
      border: '1px solid rgba(212,160,23,0.08)',
      borderRadius: '12px',
    },
    '.CheckboxInput--checked': {
      backgroundColor: '#D4A017',
      borderColor: '#D4A017',
    },
  },
}
