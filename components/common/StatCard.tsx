/**
 * StatCard Component
 * Display statistics with icon and trend indicator
 */

'use client'

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  color?: 'orange' | 'emerald' | 'blue' | 'purple' | 'red'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

const colorStyles = {
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    icon: 'text-orange-400',
    value: 'text-orange-50',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-400',
    value: 'text-emerald-50',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'text-blue-400',
    value: 'text-blue-50',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    icon: 'text-purple-400',
    value: 'text-purple-50',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: 'text-red-400',
    value: 'text-red-50',
  },
}

const sizeStyles = {
  sm: {
    padding: 'p-3',
    title: 'text-xs',
    value: 'text-xl',
    subtitle: 'text-[10px]',
    icon: 'w-8 h-8',
  },
  md: {
    padding: 'p-4',
    title: 'text-sm',
    value: 'text-2xl',
    subtitle: 'text-xs',
    icon: 'w-10 h-10',
  },
  lg: {
    padding: 'p-6',
    title: 'text-base',
    value: 'text-3xl',
    subtitle: 'text-sm',
    icon: 'w-12 h-12',
  },
}

const trendIcons = {
  up: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  down: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  stable: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
}

const trendColors = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  stable: 'text-orange-100/60',
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'orange',
  size = 'md',
  className = '',
  onClick,
}: StatCardProps) {
  const colorStyle = colorStyles[color]
  const sizeStyle = sizeStyles[size]

  const Component = onClick ? motion.button : motion.div

  return (
    <Component
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`
        rounded-2xl border ${colorStyle.bg} ${colorStyle.border} ${sizeStyle.padding}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`font-medium text-orange-100/70 ${sizeStyle.title} mb-1`}>
            {title}
          </p>
          <p className={`font-bold ${colorStyle.value} ${sizeStyle.value}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-orange-100/50 ${sizeStyle.subtitle} mt-1`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${trendColors[trend]}`}>
              {trendIcons[trend]}
              {trendValue && <span className="text-xs">{trendValue}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={`${sizeStyle.icon} rounded-xl ${colorStyle.bg} flex items-center justify-center ${colorStyle.icon}`}
          >
            {icon}
          </div>
        )}
      </div>
    </Component>
  )
}

export default StatCard
