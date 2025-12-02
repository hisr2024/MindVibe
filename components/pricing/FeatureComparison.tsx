'use client'

import { type PricingTier } from './PricingCard'

interface FeatureComparisonProps {
  tiers: PricingTier[]
  features: {
    category: string
    items: {
      name: string
      description?: string
      values: Record<string, boolean | string | number>
    }[]
  }[]
  className?: string
}

export function FeatureComparison({ tiers, features, className = '' }: FeatureComparisonProps) {
  const renderValue = (value: boolean | string | number) => {
    if (typeof value === 'boolean') {
      return value ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-100/30">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )
    }
    return <span className="text-sm text-orange-50 font-medium">{value}</span>
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-4 text-left text-sm font-semibold text-orange-100/70 border-b border-orange-500/15">
              Features
            </th>
            {tiers.map(tier => (
              <th
                key={tier.id}
                className={`p-4 text-center text-sm font-semibold border-b ${
                  tier.highlighted
                    ? 'bg-orange-500/10 text-orange-50 border-orange-500/30'
                    : 'text-orange-100/70 border-orange-500/15'
                }`}
              >
                {tier.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((category, catIndex) => (
            <>
              <tr key={`category-${catIndex}`}>
                <td
                  colSpan={tiers.length + 1}
                  className="p-4 pt-6 text-xs font-bold uppercase tracking-wider text-orange-400"
                >
                  {category.category}
                </td>
              </tr>
              {category.items.map((item, itemIndex) => (
                <tr key={`item-${catIndex}-${itemIndex}`} className="border-b border-orange-500/10 hover:bg-orange-500/5">
                  <td className="p-4">
                    <div className="text-sm font-medium text-orange-50">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-orange-100/50 mt-0.5">{item.description}</div>
                    )}
                  </td>
                  {tiers.map(tier => (
                    <td
                      key={tier.id}
                      className={`p-4 text-center ${
                        tier.highlighted ? 'bg-orange-500/5' : ''
                      }`}
                    >
                      {renderValue(item.values[tier.id] ?? false)}
                    </td>
                  ))}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default FeatureComparison
