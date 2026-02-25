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
  default: 'bg-[#0a0a12]/85 border border-[#d4a44c]/15 shadow-[0_15px_60px_rgba(212,164,76,0.10)]',
  elevated: 'bg-gradient-to-br from-[#0d0b08] via-[#0a0a12] to-[#080810] border border-[#d4a44c]/20 shadow-[0_24px_100px_rgba(212,164,76,0.12)]',
  bordered: 'bg-black/40 border border-[#d4a44c]/20',
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
