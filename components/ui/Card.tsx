'use client'

import { type ReactNode } from 'react'

type CardVariant = 'default' | 'elevated' | 'bordered' | 'ghost'

interface CardProps {
  variant?: CardVariant
  className?: string
  children: ReactNode
}

interface CardHeaderProps {
  className?: string
  children: ReactNode
}

interface CardContentProps {
  className?: string
  children: ReactNode
}

interface CardFooterProps {
  className?: string
  children: ReactNode
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-[#0d0d10]/85 border border-orange-500/15 shadow-[0_15px_60px_rgba(255,115,39,0.14)]',
  elevated: 'bg-gradient-to-br from-[#0f0a08] via-[#0b0b0f] to-[#0c0f19] border border-orange-500/20 shadow-[0_24px_100px_rgba(255,115,39,0.18)]',
  bordered: 'bg-black/40 border border-orange-500/20',
  ghost: 'bg-transparent',
}

export function Card({ variant = 'default', className = '', children }: CardProps) {
  return (
    <div className={`rounded-3xl ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children }: CardHeaderProps) {
  return (
    <div className={`p-6 pb-0 ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ className = '', children }: CardContentProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ className = '', children }: CardFooterProps) {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  )
}

export default Card
