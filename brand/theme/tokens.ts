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
  background: 'radial-gradient(circle at 15% 20%, rgba(255,153,51,0.08), transparent 32%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.05), transparent 40%), linear-gradient(135deg, #050505 0%, #0b0b0f 45%, #120907 100%)',
  surface: '#0f1624',
  surfaceSubtle: '#0b0b10',
  surfaceElevated: 'rgba(13,13,16,0.9)',
  textPrimary: '#f8fafc',
  textSecondary: '#e2e8f0',
  textMuted: '#cbd5e1',
  border: 'rgba(226, 232, 240, 0.16)',
  borderStrong: 'rgba(255, 153, 51, 0.22)',
  cardTealBg: 'linear-gradient(140deg, rgba(18, 92, 92, 0.85), rgba(60, 152, 142, 0.7), rgba(98, 204, 190, 0.6))',
  cardTealText: '#e7fffb',
  cardBlueBg: 'linear-gradient(145deg, rgba(24, 42, 74, 0.86), rgba(58, 93, 132, 0.75), rgba(124, 173, 226, 0.68))',
  cardBlueText: '#eaf2ff',
  cardLilacBg: 'linear-gradient(145deg, rgba(72, 46, 78, 0.85), rgba(122, 76, 124, 0.7), rgba(196, 158, 214, 0.64))',
  cardLilacText: '#f9f0ff',
  cardShadow: '0 16px 48px rgba(6, 10, 22, 0.32)',
  panelBg: 'rgba(13, 13, 16, 0.9)',
  panelBorder: 'rgba(255, 153, 51, 0.22)',
  panelTextPrimary: '#f8fafc',
  panelTextSecondary: '#e2e8f0',
  inputBg: 'rgba(0, 0, 0, 0.55)',
  inputBorder: 'rgba(255, 153, 51, 0.28)',
  inputPlaceholder: 'rgba(248, 250, 252, 0.72)',
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
