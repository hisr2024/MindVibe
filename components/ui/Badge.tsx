'use client'

import { type ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'premium'
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  children: ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-orange-500/10 border-orange-500/30 text-orange-50',
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-50',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-50',
  danger: 'bg-red-500/10 border-red-500/30 text-red-50',
  info: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-50',
  premium: 'bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 border-orange-400/40 text-orange-50',
}

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-orange-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  info: 'bg-cyan-400',
  premium: 'bg-gradient-to-r from-orange-400 to-amber-400',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
}

export function Badge({ variant = 'default', size = 'md', dot, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant]} animate-pulse`} />}
      {children}
    </span>
  )
}

export default Badge
