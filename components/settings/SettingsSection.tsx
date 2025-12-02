'use client'

import { type ReactNode } from 'react'

interface SettingsSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function SettingsSection({
  title,
  description,
  children,
  className = '',
}: SettingsSectionProps) {
  return (
    <div className={`rounded-2xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-orange-50">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-orange-100/60">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

interface SettingsItemProps {
  label: string
  description?: string
  children: ReactNode
  className?: string
}

export function SettingsItem({
  label,
  description,
  children,
  className = '',
}: SettingsItemProps) {
  return (
    <div className={`flex items-center justify-between py-3 ${className}`}>
      <div>
        <p className="text-sm font-medium text-orange-50">{label}</p>
        {description && (
          <p className="text-xs text-orange-100/50 mt-0.5">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}

interface SettingsDividerProps {
  className?: string
}

export function SettingsDivider({ className = '' }: SettingsDividerProps) {
  return <hr className={`border-orange-500/10 ${className}`} />
}

export default SettingsSection
