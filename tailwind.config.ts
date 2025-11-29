import type { Config } from 'tailwindcss'

const config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: '#1A1A2E',
        vibrant: {
          blue: '#6bb8c7',
          pink: '#f3b3c2',
          green: '#9ad5c0',
          yellow: '#f2d8a7',
        },
        gradient: {
          one: 'linear-gradient(90deg, #00d4ff 0%, #39ff14 100%)',
          two: 'linear-gradient(270deg, #ff4dff -10%, #00d4ff 110%)',
        },
        calm: {
          50: '#F7F9FC',
          100: '#E9F5F2',
          200: '#D7EDEC',
          300: '#C5E5E5',
          400: '#A8DADC',
          500: '#7FBAC1',
          600: '#5A9EA6',
          700: '#3F8088',
          800: '#2E646C',
          900: '#234F55',
        },
        blush: {
          50: '#F8FBFB',
          100: '#EEF6F6',
          200: '#DCECEC',
          300: '#C9E1E1',
          400: '#ABCFCF',
          500: '#8CBEBE',
          600: '#6BA5A5',
          700: '#4E8585',
          800: '#396767',
          900: '#2D5050',
        },
        ink: {
          50: '#0B1721',
          100: '#0F1F2C',
          200: '#102536',
          300: '#132E43',
          400: '#1B3E58',
          500: '#24506F',
          600: '#2F6588',
          700: '#39789F',
          800: '#4189B5',
          900: '#4A9CCC',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'Open Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 35px -15px rgba(36, 80, 111, 0.25)',
        glow: '0 0 0 4px rgba(107, 184, 199, 0.25)',
        'neon-strong': '0 12px 40px rgba(16, 37, 54, 0.14), 0 16px 70px rgba(96, 135, 150, 0.18)',
      },
      backgroundImage: {
        'gradient-one': 'linear-gradient(90deg, #6bb8c7 0%, #9ad5c0 100%)',
        'gradient-two': 'linear-gradient(270deg, #f3b3c2 -10%, #6bb8c7 110%)',
        'aurora-grid':
          'radial-gradient(circle at 20% 20%, rgba(107, 184, 199, 0.2), transparent 30%), radial-gradient(circle at 80% 10%, rgba(243, 179, 194, 0.18), transparent 35%), radial-gradient(circle at 60% 70%, rgba(154, 213, 192, 0.22), transparent 32%)',
        'cyber-dust':
          'radial-gradient(circle at 15% 20%, rgba(107, 184, 199, 0.2), transparent 32%), radial-gradient(circle at 80% 8%, rgba(243, 179, 194, 0.2), transparent 30%), radial-gradient(circle at 40% 72%, rgba(154, 213, 192, 0.24), transparent 36%)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 212, 255, 0.35)' },
          '50%': { boxShadow: '0 0 0 18px rgba(0, 212, 255, 0)' },
        },
        float: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(0px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        glow: 'glow 2.8s infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
