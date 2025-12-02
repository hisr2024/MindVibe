'use client'

import Link from 'next/link'
import { Card, CardContent, Button } from '@/components/ui'

interface UpgradePromptProps {
  title?: string
  description?: string
  features?: string[]
  ctaText?: string
  ctaLink?: string
  onUpgrade?: () => void
  variant?: 'default' | 'compact' | 'banner'
  className?: string
}

export function UpgradePrompt({
  title = 'Unlock More Features',
  description = 'Upgrade your plan to access premium features and unlimited KIAAN questions.',
  features = [],
  ctaText = 'View Plans',
  ctaLink = '/pricing',
  onUpgrade,
  variant = 'default',
  className = '',
}: UpgradePromptProps) {
  if (variant === 'banner') {
    return (
      <div className={`rounded-2xl bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-orange-500/20 border border-orange-400/30 p-4 ${className}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-300 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-orange-50">{title}</p>
              <p className="text-sm text-orange-100/70">{description}</p>
            </div>
          </div>
          {onUpgrade ? (
            <Button onClick={onUpgrade} variant="primary" size="sm">
              {ctaText}
            </Button>
          ) : (
            <Link href={ctaLink}>
              <Button variant="primary" size="sm">
                {ctaText}
              </Button>
            </Link>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 rounded-xl bg-orange-500/10 border border-orange-500/20 p-3 ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400 shrink-0">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <p className="flex-1 text-sm text-orange-100">{description}</p>
        {onUpgrade ? (
          <Button onClick={onUpgrade} variant="outline" size="sm">
            Upgrade
          </Button>
        ) : (
          <Link href={ctaLink}>
            <Button variant="outline" size="sm">
              Upgrade
            </Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <Card variant="elevated" className={className}>
      <CardContent>
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-300 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-orange-50 mb-1">{title}</h3>
            <p className="text-sm text-orange-100/70 mb-4">{description}</p>
            
            {features.length > 0 && (
              <ul className="space-y-2 mb-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-orange-100/80">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            )}
            
            {onUpgrade ? (
              <Button onClick={onUpgrade} variant="primary" size="md">
                {ctaText}
              </Button>
            ) : (
              <Link href={ctaLink}>
                <Button variant="primary" size="md">
                  {ctaText}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default UpgradePrompt
