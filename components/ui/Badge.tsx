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
  default: 'bg-[#d4a44c]/10 border-[#d4a44c]/30 text-[#f5f0e8]',
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-50',
  warning: 'bg-[#d4a44c]/10 border-[#d4a44c]/30 text-[#f5f0e8]',
  danger: 'bg-red-500/10 border-red-500/30 text-red-50',
  info: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-50',
  premium: 'bg-gradient-to-r from-[#d4a44c]/20 via-[#d4a44c]/20 to-[#d4a44c]/20 border-[#d4a44c]/40 text-[#f5f0e8]',
}

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#d4a44c]',
  success: 'bg-emerald-400',
  warning: 'bg-[#d4a44c]',
  danger: 'bg-red-400',
  info: 'bg-cyan-400',
  premium: 'bg-gradient-to-r from-[#d4a44c] to-[#d4a44c]',
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
