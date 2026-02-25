'use client'

import * as React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const variants = {
  primary: 'bg-gradient-to-r from-[#d4a44c] via-[#d4a44c] to-[#e8b54a] text-slate-900 shadow-lg shadow-[#d4a44c]/25',
  secondary: 'bg-[#d4a44c]/15 text-[#f5f0e8] border border-[#d4a44c]/30',
  outline: 'bg-transparent text-[#f5f0e8] border border-[#d4a44c]/30 hover:bg-[#d4a44c]/10',
  ghost: 'bg-transparent text-[#f5f0e8] hover:bg-[#d4a44c]/10',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
}

export function AnimatedButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  className = '',
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-semibold transition-colors
        disabled:opacity-60 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="mr-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </motion.span>
          Loading...
        </>
      ) : (
        children
      )}
    </motion.button>
  )
}

interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  hoverEffect?: boolean
  onClick?: () => void
}

export function AnimatedCard({ children, className = '', hoverEffect = true, onClick }: AnimatedCardProps) {
  const Component = onClick ? motion.button : motion.div

  return (
    <Component
      whileHover={hoverEffect ? { y: -4, scale: 1.01 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`rounded-2xl border border-[#d4a44c]/15 bg-black/40 p-4 shadow-[0_10px_40px_rgba(212,164,76,0.12)] ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </Component>
  )
}

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function FadeIn({ children, delay = 0, duration = 0.4, className = '' }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerContainerProps {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}

export function StaggerContainer({ children, staggerDelay = 0.1, className = '' }: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedButton
