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
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        mvGradientSunrise: 'linear-gradient(135deg, #ff7a3c 0%, #ff9f52 50%, #ffd36f 100%)',
        mvGradientOcean: 'linear-gradient(130deg, #0fa9a2 0%, #2ac8d4 55%, #9ae8ff 100%)',
        mvGradientAurora: 'linear-gradient(140deg, #ff7fa8 0%, #c987ff 52%, #e8d3ff 100%)',
        kiaanResonance: 'linear-gradient(120deg, #1e3a8a 0%, #2563eb 42%, #6ad7ff 100%)',
        // Mobile-optimized gradients
        mobileCardGlow: 'radial-gradient(ellipse at center, rgba(255, 145, 89, 0.15) 0%, transparent 70%)',
        mobileNavGlow: 'linear-gradient(180deg, transparent 0%, rgba(11, 11, 15, 0.98) 100%)',
      },
      boxShadow: {
        glowSunrise: '0 12px 40px rgba(255, 147, 89, 0.35)',
        glowOcean: '0 12px 40px rgba(23, 177, 167, 0.32)',
        glowAurora: '0 12px 40px rgba(255, 143, 180, 0.34)',
        // Mobile-optimized shadows
        'mobile-sm': '0 2px 8px rgba(0, 0, 0, 0.15)',
        'mobile-md': '0 4px 16px rgba(0, 0, 0, 0.2)',
        'mobile-lg': '0 8px 32px rgba(0, 0, 0, 0.25)',
        'mobile-glow': '0 0 20px rgba(255, 145, 89, 0.3)',
        'mobile-card': '0 4px 20px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'mobile-button': '0 4px 16px rgba(255, 122, 60, 0.35)',
        'mobile-nav': '0 -4px 24px rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        sheet: '28px',
        card: '20px',
        soft: '16px',
        // Mobile-specific
        'mobile-card': '18px',
        'mobile-button': '14px',
        'mobile-input': '12px',
      },
      spacing: {
        // Safe area spacing
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-left': 'env(safe-area-inset-left, 0px)',
        'safe-right': 'env(safe-area-inset-right, 0px)',
        // Mobile nav height
        'mobile-nav': '88px',
        'mobile-header': '64px',
      },
      animation: {
        // Mobile-optimized animations
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.35s ease-out',
        'fade-in-down': 'fadeInDown 0.35s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-down': 'slideDown 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-left': 'slideLeft 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-right': 'slideRight 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'bounce-gentle': 'bounceGentle 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'mobile-press': 'mobilePress 0.15s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 145, 89, 0.3)' },
          '50%': { boxShadow: '0 0 35px rgba(255, 145, 89, 0.5)' },
        },
        mobilePress: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.96)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      transitionTimingFunction: {
        'mobile-spring': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'mobile-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'mobile-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
    },
  },
  plugins: [],
}

export default config
