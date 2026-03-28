import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mv: {
          sunrise: '#d4a44c',
          sunriseHighlight: '#f0c96d',
          ocean: '#17b1a7',
          oceanSky: '#6dd7f2',
          aurora: '#ff8fb4',
          auroraLilac: '#c2a5ff',
        },
        kiaan: {
          deep: '#0a0a12',
          glow: '#e8b54a',
        },
        modes: {
          innerPeace: '#1fb8c0',
          mindControl: '#1e3a8a',
          selfKindness: '#e57ac5',
        },
        gold: {
          50: '#fdf8ef',
          100: '#f5e6c8',
          200: '#f0d9a8',
          300: '#e8c380',
          400: '#e8b54a',
          500: '#d4a44c',
          600: '#c8943a',
          700: '#a67a2e',
          800: '#7a5a22',
          900: '#4e3a16',
        },
        divine: {
          black: '#050507',
          void: '#0a0a12',
          surface: '#0f0f18',
          cream: '#f5f0e8',
          muted: '#a89e8e',
        },
        /* Sacred palette — Kiaanverse divine mobile theme */
        sacred: {
          'cosmic-void': '#050714',
          'yamuna-deep': '#0B0E2A',
          'yamuna-mid': '#111435',
          'yamuna-surface': '#161A42',
          'krishna-blue': '#1B4FBB',
          'krishna-glow': '#2563EB',
          'peacock-teal': '#0E7490',
          'peacock-iridescent': '#06B6D4',
          'peacock-shimmer': '#67E8F9',
          'divine-gold': '#D4A017',
          'divine-gold-bright': '#F0C040',
          'divine-gold-glow': '#FDE68A',
          'saffron-core': '#F97316',
          'saffron-warm': '#FB923C',
          'sacred-white': '#F8F6F0',
          'text-primary': '#EDE8DC',
          'text-secondary': '#B8AE98',
          'text-muted': '#6B6355',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sacred: ['var(--font-sacred)', 'Crimson Text', 'Georgia', 'Times New Roman', 'serif'],
        divine: ['var(--font-cormorant)', 'Cormorant Garamond', 'Georgia', 'serif'],
        display: ['var(--font-playfair)', 'Playfair Display', 'serif'],
        ui: ['var(--font-outfit)', 'Outfit', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['var(--text-h1)', { lineHeight: '1.2', letterSpacing: '-0.025em', fontWeight: '700' }],
        'title': ['var(--text-h2)', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '700' }],
        'subtitle': ['var(--text-h3)', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
        'subheading': ['var(--text-h4)', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['var(--text-body-lg)', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        'body': ['var(--text-body)', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        'caption': ['var(--text-caption)', { lineHeight: '1.35' }],
        'label': ['var(--text-label)', { lineHeight: '1.4', letterSpacing: '0.01em' }],
      },
      backgroundImage: {
        mvGradientSunrise: 'linear-gradient(135deg, #c8943a 0%, #e8b54a 50%, #f0c96d 100%)',
        mvGradientOcean: 'linear-gradient(130deg, #0fa9a2 0%, #2ac8d4 55%, #9ae8ff 100%)',
        mvGradientAurora: 'linear-gradient(140deg, #ff7fa8 0%, #c987ff 52%, #e8d3ff 100%)',
        kiaanResonance: 'linear-gradient(120deg, #c8943a 0%, #d4a44c 42%, #e8b54a 100%)',
        // Golden Black theme gradients
        mobileCardGlow: 'radial-gradient(ellipse at center, rgba(212, 164, 76, 0.12) 0%, transparent 70%)',
        mobileNavGlow: 'linear-gradient(180deg, transparent 0%, rgba(5, 5, 7, 0.98) 100%)',
        goldenShimmer: 'linear-gradient(135deg, #c8943a 0%, #e8b54a 40%, #f0c96d 70%, #d4a44c 100%)',
        cosmicVoid: 'linear-gradient(170deg, #030305 0%, #050507 40%, #080608 70%, #050305 100%)',
      },
      boxShadow: {
        glowSunrise: '0 12px 40px rgba(212, 164, 76, 0.3)',
        glowOcean: '0 12px 40px rgba(23, 177, 167, 0.32)',
        glowAurora: '0 12px 40px rgba(255, 143, 180, 0.34)',
        glowGold: '0 0 32px rgba(212, 164, 76, 0.35)',
        glowGoldStrong: '0 8px 40px rgba(212, 164, 76, 0.4)',
        // Mobile-optimized shadows
        'mobile-sm': '0 2px 8px rgba(0, 0, 0, 0.2)',
        'mobile-md': '0 4px 16px rgba(0, 0, 0, 0.25)',
        'mobile-lg': '0 8px 32px rgba(0, 0, 0, 0.35)',
        'mobile-glow': '0 0 20px rgba(212, 164, 76, 0.25)',
        'mobile-card': '0 4px 20px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(212, 164, 76, 0.08)',
        'mobile-button': '0 4px 16px rgba(212, 164, 76, 0.3)',
        'mobile-nav': '0 -4px 24px rgba(0, 0, 0, 0.5)',
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
        // Semantic section spacing
        'section-sm': 'var(--section-gap-sm)',
        'section-md': 'var(--section-gap-md)',
        'section-lg': 'var(--section-gap-lg)',
        'page-x': 'var(--page-px)',
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
        // Sacred animations
        'sacred-breath': 'sacred-divine-breath 4s ease-in-out infinite',
        'sacred-bloom': 'sacred-lotus-bloom 600ms cubic-bezier(0.0, 0.8, 0.2, 1.0) forwards',
        'sacred-krishna-pulse': 'sacred-krishna-pulse 2s ease-in-out infinite',
        'sacred-peacock-shimmer': 'sacred-peacock-shimmer 0.6s ease-out forwards',
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
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 164, 76, 0.3)' },
          '50%': { boxShadow: '0 0 35px rgba(212, 164, 76, 0.5)' },
        },
        mobilePress: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.96)' },
          '100%': { transform: 'scale(1)' },
        },
        // Sacred keyframes (referenced by sacred animations above)
        'sacred-divine-breath': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212,160,23,0.3), 0 0 40px rgba(212,160,23,0.15)', transform: 'scale(1)' },
          '50%': { boxShadow: '0 0 30px rgba(212,160,23,0.5), 0 0 60px rgba(212,160,23,0.25)', transform: 'scale(1.02)' },
        },
        'sacred-lotus-bloom': {
          '0%': { opacity: '0', clipPath: 'circle(0% at 50% 50%)', filter: 'brightness(2)' },
          '40%': { opacity: '1', clipPath: 'circle(30% at 50% 50%)', filter: 'brightness(1.3)' },
          '100%': { clipPath: 'circle(100% at 50% 50%)', filter: 'brightness(1)' },
        },
        'sacred-krishna-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(37,99,235,0)' },
          '50%': { boxShadow: '0 0 0 6px rgba(37,99,235,0.15)' },
        },
        'sacred-peacock-shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      transitionTimingFunction: {
        'mobile-spring': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'mobile-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'mobile-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'sacred-divine-in': 'cubic-bezier(0.25, 0.1, 0.0, 1.0)',
        'sacred-divine-out': 'cubic-bezier(0.0, 0.0, 0.15, 1.0)',
        'sacred-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'sacred-lotus': 'cubic-bezier(0.0, 0.8, 0.2, 1.0)',
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
