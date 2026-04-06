'use client'

interface OrderSummaryCardProps {
  planName: string
  symbol: string
  price: number
  period: string
  lineItems?: { label: string; value: string }[]
}

export function OrderSummaryCard({
  planName,
  symbol,
  price,
  period,
  lineItems = [],
}: OrderSummaryCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3
          className="text-xl font-serif text-white"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          {planName}
        </h3>
        <div className="text-right">
          <span className="text-2xl font-bold text-white">
            {symbol}
            {price}
          </span>
          <span className="text-sm text-white/50">{period}</span>
        </div>
      </div>
      <div className="border-t border-white/10 pt-3 space-y-2">
        {lineItems.map((li) => (
          <div key={li.label} className="flex justify-between text-sm text-white/60">
            <span>{li.label}</span>
            <span>{li.value}</span>
          </div>
        ))}
        <div className="flex justify-between text-base font-semibold text-white pt-2 border-t border-white/10">
          <span>Due today</span>
          <span>{symbol}0.00</span>
        </div>
      </div>
    </div>
  )
}
