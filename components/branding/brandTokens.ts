import colors from '@/brand/tokens/colors.json'
import gradients from '@/brand/tokens/gradients.json'
import motion from '@/brand/tokens/motion.json'

export const brandColors = colors
export const brandGradients = gradients.gradients
export const motionTokens = motion

export const gradientCss = {
  mvGradientSunrise: 'linear-gradient(135deg, #ff7a3c 0%, #ff9f52 50%, #ffd36f 100%)',
  mvGradientOcean: 'linear-gradient(130deg, #0fa9a2 0%, #2ac8d4 55%, #9ae8ff 100%)',
  mvGradientAurora: 'linear-gradient(140deg, #ff7fa8 0%, #c987ff 52%, #e8d3ff 100%)',
  kiaanResonance: 'linear-gradient(120deg, #1e3a8a 0%, #2563eb 42%, #6ad7ff 100%)',
  spiritualGold: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 30%, #fcd34d 55%, #f59e0b 100%)',
  spiritualSaffron: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 35%, #fbbf24 60%, #fcd34d 100%)',
}

export const auraRings = {
  sunrise: 'radial-gradient(circle at 30% 30%, rgba(255, 147, 89, 0.32), rgba(255, 211, 111, 0.1) 48%, rgba(255, 147, 89, 0) 68%)',
  ocean: 'radial-gradient(circle at 30% 30%, rgba(23, 177, 167, 0.3), rgba(154, 232, 255, 0.12) 50%, rgba(23, 177, 167, 0) 72%)',
  aurora: 'radial-gradient(circle at 30% 30%, rgba(255, 143, 180, 0.3), rgba(200, 135, 255, 0.14) 55%, rgba(255, 143, 180, 0) 76%)',
}

export type GradientKey = keyof typeof gradientCss
export type AuraKey = keyof typeof auraRings
