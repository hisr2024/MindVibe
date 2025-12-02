'use client'

import { Card, CardContent } from '@/components/ui'
import ProgressBar from '@/components/ui/ProgressBar'

interface UsageItem {
  name: string
  used: number
  limit: number | 'unlimited'
  unit?: string
}

interface UsageCardProps {
  items: UsageItem[]
  className?: string
}

export function UsageCard({ items, className = '' }: UsageCardProps) {
  return (
    <Card className={className}>
      <CardContent>
        <h3 className="font-semibold text-orange-50 mb-4">Feature Usage</h3>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index}>
              {item.limit === 'unlimited' ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-orange-100">{item.name}</span>
                  <span className="text-sm font-medium text-orange-50">
                    {item.used} {item.unit ?? 'used'} (unlimited)
                  </span>
                </div>
              ) : (
                <ProgressBar
                  value={item.used}
                  max={item.limit}
                  label={item.name}
                  size="sm"
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default UsageCard
