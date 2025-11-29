import type { Config } from 'tailwindcss'

const config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
        glow: '0 0 0 4px rgba(168, 218, 220, 0.35)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
