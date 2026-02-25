/**
 * LoadingSpinner Component
 * Animated loading indicator
 */

'use client'

import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'orange' | 'white' | 'current'
  className?: string
  label?: string
}

const sizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

const colorStyles = {
  orange: 'text-[#d4a44c]',
  white: 'text-white',
  current: 'text-current',
}

export function LoadingSpinner({
  size = 'md',
  color = 'orange',
  className = '',
  label,
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <motion.svg
        className={`${sizeStyles[size]} ${colorStyles[color]}`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </motion.svg>
      {label && (
        <p className={`text-sm ${colorStyles[color]} opacity-70`}>{label}</p>
      )}
    </div>
  )
}

/**
 * Loading overlay for sections/cards
 */
interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  className?: string
  spinnerSize?: 'sm' | 'md' | 'lg'
}

export function LoadingOverlay({
  isLoading,
  children,
  className = '',
  spinnerSize = 'md',
}: LoadingOverlayProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-inherit"
        >
          <LoadingSpinner size={spinnerSize} />
        </motion.div>
      )}
    </div>
  )
}

export default LoadingSpinner
