import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mv: {
          sunrise: '#ff9159',
          sunriseHighlight: '#ffd070',
          ocean: '#17b1a7',
          oceanSky: '#6dd7f2',
          aurora: '#ff8fb4',
          auroraLilac: '#c2a5ff',
        },
        kiaan: {
          deep: '#0f172a',
          glow: '#6ad7ff',
        },
        modes: {
          innerPeace: '#1fb8c0',
          mindControl: '#1e3a8a',
          selfKindness: '#e57ac5',
        },
      },
      fontFamily: {
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        mvGradientSunrise: 'linear-gradient(135deg, #ff7a3c 0%, #ff9f52 50%, #ffd36f 100%)',
        mvGradientOcean: 'linear-gradient(130deg, #0fa9a2 0%, #2ac8d4 55%, #9ae8ff 100%)',
        mvGradientAurora: 'linear-gradient(140deg, #ff7fa8 0%, #c987ff 52%, #e8d3ff 100%)',
        kiaanResonance: 'linear-gradient(120deg, #1e3a8a 0%, #2563eb 42%, #6ad7ff 100%)',
      },
      boxShadow: {
        glowSunrise: '0 12px 40px rgba(255, 147, 89, 0.35)',
        glowOcean: '0 12px 40px rgba(23, 177, 167, 0.32)',
        glowAurora: '0 12px 40px rgba(255, 143, 180, 0.34)',
      },
      borderRadius: {
        sheet: '28px',
        card: '20px',
        soft: '16px',
      },
    },
  },
  plugins: [],
}

export default config
