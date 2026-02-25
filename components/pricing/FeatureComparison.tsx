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
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#f5f0e8]/30">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )
    }
    return <span className="text-sm text-[#f5f0e8] font-medium">{value}</span>
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-4 text-left text-sm font-semibold text-[#f5f0e8]/70 border-b border-[#d4a44c]/15">
              Features
            </th>
            {tiers.map(tier => (
              <th
                key={tier.id}
                className={`p-4 text-center text-sm font-semibold border-b ${
                  tier.highlighted
                    ? 'bg-[#d4a44c]/10 text-[#f5f0e8] border-[#d4a44c]/30'
                    : 'text-[#f5f0e8]/70 border-[#d4a44c]/15'
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
                  className="p-4 pt-6 text-xs font-bold uppercase tracking-wider text-[#d4a44c]"
                >
                  {category.category}
                </td>
              </tr>
              {category.items.map((item, itemIndex) => (
                <tr key={`item-${catIndex}-${itemIndex}`} className="border-b border-[#d4a44c]/10 hover:bg-[#d4a44c]/5">
                  <td className="p-4">
                    <div className="text-sm font-medium text-[#f5f0e8]">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-[#f5f0e8]/50 mt-0.5">{item.description}</div>
                    )}
                  </td>
                  {tiers.map(tier => (
                    <td
                      key={tier.id}
                      className={`p-4 text-center ${
                        tier.highlighted ? 'bg-[#d4a44c]/5' : ''
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
