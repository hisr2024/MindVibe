'use client'

import { Badge, Button } from '@/components/ui'

interface BillingRecord {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  invoiceUrl?: string
}

interface BillingHistoryProps {
  records?: BillingRecord[]
  paymentMethod?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  nextBillingDate?: string
  className?: string
}

// Generate mock billing records
const generateMockRecords = (): BillingRecord[] => {
  const records: BillingRecord[] = []
  const now = new Date()
  
  for (let i = 0; i < 6; i++) {
    const date = new Date(now)
    date.setMonth(date.getMonth() - i)
    records.push({
      id: `inv_${i}`,
      date: date.toISOString(),
      amount: 999, // $9.99 in cents
      status: i === 0 ? 'paid' : 'paid',
      invoiceUrl: '#',
    })
  }
  
  return records
}

export function BillingHistory({
  records,
  paymentMethod,
  nextBillingDate,
  className = '',
}: BillingHistoryProps) {
  const billingRecords = records || generateMockRecords()

  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" size="sm">Paid</Badge>
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>
      case 'failed':
        return <Badge variant="danger" size="sm">Failed</Badge>
      default:
        return <Badge variant="default" size="sm">{status}</Badge>
    }
  }

  return (
    <div className={`rounded-2xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-orange-50 mb-6">Billing Information</h2>

      {/* Payment Method */}
      {paymentMethod && (
        <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-black/30">
          <div className="flex items-center gap-4">
            <div className="h-10 w-14 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-orange-50">
                {paymentMethod.brand} •••• {paymentMethod.last4}
              </p>
              <p className="text-xs text-orange-100/60">
                Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            Update
          </Button>
        </div>
      )}

      {/* Next Billing */}
      {nextBillingDate && (
        <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-50">Next Billing Date</p>
              <p className="text-xs text-orange-100/60">
                {new Date(nextBillingDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-orange-50">$9.99</p>
              <p className="text-xs text-orange-100/60">Est. charge</p>
            </div>
          </div>
        </div>
      )}

      {/* Billing History Table */}
      <div>
        <h3 className="text-sm font-semibold text-orange-100/70 mb-3">Billing History</h3>
        <div className="space-y-2">
          {billingRecords.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between py-3 px-4 rounded-xl bg-black/20 hover:bg-orange-500/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="text-sm text-orange-50">
                    {new Date(record.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-orange-50">
                  {formatAmount(record.amount)}
                </span>
                {getStatusBadge(record.status)}
                {record.invoiceUrl && (
                  <Button variant="ghost" size="sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BillingHistory
