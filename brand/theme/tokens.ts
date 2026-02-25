export type ThemeTokens = {
  background: string
  surface: string
  surfaceSubtle: string
  surfaceElevated: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  border: string
  borderStrong: string
  cardTealBg: string
  cardTealText: string
  cardBlueBg: string
  cardBlueText: string
  cardLilacBg: string
  cardLilacText: string
  cardShadow: string
  panelBg: string
  panelBorder: string
  panelTextPrimary: string
  panelTextSecondary: string
  inputBg: string
  inputBorder: string
  inputPlaceholder: string
  overlaySoft: string
}

export const darkTheme: ThemeTokens = {
  background: 'radial-gradient(circle at 15% 20%, rgba(212,164,76,0.06), transparent 32%), radial-gradient(circle at 80% 0%, rgba(245,240,232,0.04), transparent 40%), linear-gradient(135deg, #050507 0%, #0a0a12 45%, #0d0b08 100%)',
  surface: '#0a0a12',
  surfaceSubtle: '#080810',
  surfaceElevated: 'rgba(10,10,18,0.92)',
  textPrimary: '#f5f0e8',
  textSecondary: '#e8e0d0',
  textMuted: '#b8b0a0',
  border: 'rgba(212, 164, 76, 0.12)',
  borderStrong: 'rgba(212, 164, 76, 0.22)',
  cardTealBg: 'linear-gradient(140deg, rgba(18, 92, 92, 0.85), rgba(60, 152, 142, 0.7), rgba(98, 204, 190, 0.6))',
  cardTealText: '#e7fffb',
  cardBlueBg: 'linear-gradient(145deg, rgba(24, 42, 74, 0.86), rgba(58, 93, 132, 0.75), rgba(124, 173, 226, 0.68))',
  cardBlueText: '#eaf2ff',
  cardLilacBg: 'linear-gradient(145deg, rgba(72, 46, 78, 0.85), rgba(122, 76, 124, 0.7), rgba(196, 158, 214, 0.64))',
  cardLilacText: '#f9f0ff',
  cardShadow: '0 16px 48px rgba(6, 10, 22, 0.32)',
  panelBg: 'rgba(10, 10, 18, 0.92)',
  panelBorder: 'rgba(212, 164, 76, 0.22)',
  panelTextPrimary: '#f5f0e8',
  panelTextSecondary: '#e8e0d0',
  inputBg: 'rgba(0, 0, 0, 0.55)',
  inputBorder: 'rgba(212, 164, 76, 0.22)',
  inputPlaceholder: 'rgba(245, 240, 232, 0.72)',
  overlaySoft: 'linear-gradient(180deg, rgba(0,0,0,0.28), rgba(0,0,0,0.4))'
}

export const lightTheme: ThemeTokens = {
  background:
    'linear-gradient(135deg, #ffffff 0%, #f6f8fb 45%, #eef2f7 100%), radial-gradient(circle at 18% 22%, rgba(255,188,120,0.16), transparent 32%), radial-gradient(circle at 82% 18%, rgba(149,213,255,0.16), transparent 38%)',
  surface: '#ffffff',
  surfaceSubtle: '#f3f4f6',
  surfaceElevated: '#f8fafc',
  textPrimary: '#0b1220',
  textSecondary: '#1f2937',
  textMuted: '#334155',
  border: '#cbd5e1',
  borderStrong: '#0f172a',
  cardTealBg: 'linear-gradient(135deg, #bff0e8, #9ee0d2, #7acdbf)',
  cardTealText: '#0b1220',
  cardBlueBg: 'linear-gradient(135deg, #d7e6ff, #b8d0f3, #94b8e6)',
  cardBlueText: '#0b1a2b',
  cardLilacBg: 'linear-gradient(135deg, #ece4f9, #d6c9ef, #c0addf)',
  cardLilacText: '#221534',
  cardShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
  panelBg: '#ffffff',
  panelBorder: '#cbd5e1',
  panelTextPrimary: '#0b1220',
  panelTextSecondary: '#1f2937',
  inputBg: '#ffffff',
  inputBorder: '#94a3b8',
  inputPlaceholder: '#475569',
  overlaySoft: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(243,244,246,0.95))'
}

export function applyThemeTokens(tokens: ThemeTokens) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(`--mv-${key}`, value)
  })
}
