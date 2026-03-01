'use client'

import { useState, useEffect, useCallback } from 'react'

// =============================================================================
// Types
// =============================================================================

interface Addon {
  name: string
  amount: number
  currency: string
  description: string
}

interface SubscriptionLinkForm {
  // Step 1: Plan Details
  plan_tier: string
  billing_period: string
  total_count: number
  start_at: string // ISO date string or empty for immediate
  offer_id: string
  // Step 2: Add Ons
  addons: Addon[]
  // Step 3: Link Details
  customer_name: string
  customer_email: string
  customer_phone: string
  expire_by: string // ISO date string or empty
  description: string
  notes: Record<string, string>
}

interface SubscriptionLink {
  id: number
  razorpay_subscription_id: string
  plan_tier: string
  billing_period: string
  short_url: string
  status: string
  total_count: number
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  offer_id: string | null
  description: string | null
  created_at: string | null
}

interface LinkListResponse {
  links: SubscriptionLink[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

// =============================================================================
// Constants
// =============================================================================

const PLAN_TIERS = [
  { value: 'basic', label: 'Plus (Basic)', price: '$4.99/mo' },
  { value: 'premium', label: 'Pro (Premium)', price: '$9.99/mo' },
  { value: 'enterprise', label: 'Elite (Enterprise)', price: '$15.00/mo' },
  { value: 'premier', label: 'Premier', price: '$25.00/mo' },
]

const STEPS = ['Plan Details', 'Add Ons', 'Link Details', 'Review']

const DEFAULT_FORM: SubscriptionLinkForm = {
  plan_tier: 'premium',
  billing_period: 'monthly',
  total_count: 0,
  start_at: '',
  offer_id: '',
  addons: [],
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  expire_by: '',
  description: '',
  notes: {},
}

const STATUS_COLORS: Record<string, string> = {
  created: 'bg-blue-500/20 text-blue-400',
  authenticated: 'bg-cyan-500/20 text-cyan-400',
  active: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  halted: 'bg-orange-500/20 text-orange-400',
  cancelled: 'bg-red-500/20 text-red-400',
  completed: 'bg-slate-500/20 text-slate-400',
  expired: 'bg-slate-500/20 text-slate-400',
}

// =============================================================================
// Component
// =============================================================================

export default function SubscriptionLinksPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState<SubscriptionLinkForm>({ ...DEFAULT_FORM })
  const [links, setLinks] = useState<SubscriptionLink[]>([])
  const [linksTotal, setLinksTotal] = useState(0)
  const [linksPage, setLinksPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [result, setResult] = useState<{ short_url: string; razorpay_subscription_id: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [noteKey, setNoteKey] = useState('')
  const [noteValue, setNoteValue] = useState('')

  // Fetch existing links
  const fetchLinks = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/subscriptions/links?page=${page}&page_size=10`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data: LinkListResponse = await res.json()
        setLinks(data.links)
        setLinksTotal(data.total)
        setLinksPage(data.page)
      }
    } catch {
      // Silently fail for list
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  // Form field updater
  const updateField = <K extends keyof SubscriptionLinkForm>(
    field: K,
    value: SubscriptionLinkForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Add-on helpers
  const addAddon = () => {
    setForm((prev) => ({
      ...prev,
      addons: [...prev.addons, { name: '', amount: 0, currency: 'INR', description: '' }],
    }))
  }

  const updateAddon = (index: number, field: keyof Addon, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      addons: prev.addons.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    }))
  }

  const removeAddon = (index: number) => {
    setForm((prev) => ({
      ...prev,
      addons: prev.addons.filter((_, i) => i !== index),
    }))
  }

  // Notes helpers
  const addNote = () => {
    if (noteKey.trim()) {
      setForm((prev) => ({
        ...prev,
        notes: { ...prev.notes, [noteKey.trim()]: noteValue.trim() },
      }))
      setNoteKey('')
      setNoteValue('')
    }
  }

  const removeNote = (key: string) => {
    setForm((prev) => {
      const updated = { ...prev.notes }
      delete updated[key]
      return { ...prev, notes: updated }
    })
  }

  // Submit
  const handleSubmit = async () => {
    setCreating(true)
    setError(null)
    setResult(null)

    const payload: Record<string, unknown> = {
      plan_tier: form.plan_tier,
      billing_period: form.billing_period,
      total_count: form.total_count,
    }

    if (form.start_at) {
      payload.start_at = Math.floor(new Date(form.start_at).getTime() / 1000)
    }
    if (form.expire_by) {
      payload.expire_by = Math.floor(new Date(form.expire_by).getTime() / 1000)
    }
    if (form.offer_id) payload.offer_id = form.offer_id
    if (form.customer_name) payload.customer_name = form.customer_name
    if (form.customer_email) payload.customer_email = form.customer_email
    if (form.customer_phone) payload.customer_phone = form.customer_phone
    if (form.description) payload.description = form.description
    if (Object.keys(form.notes).length > 0) payload.notes = form.notes
    if (form.addons.length > 0) {
      payload.addons = form.addons
        .filter((a) => a.name.trim())
        .map((a) => ({
          name: a.name,
          amount: a.amount,
          currency: a.currency,
          description: a.description || undefined,
        }))
    }

    try {
      const res = await fetch('/api/admin/subscriptions/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail?.message || err.detail || 'Failed to create subscription link')
      }

      const data = await res.json()
      setResult({
        short_url: data.short_url,
        razorpay_subscription_id: data.razorpay_subscription_id,
      })
      fetchLinks()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred')
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      // Fallback
    }
  }

  const resetForm = () => {
    setForm({ ...DEFAULT_FORM })
    setCurrentStep(0)
    setResult(null)
    setError(null)
    setShowForm(false)
  }

  const selectedPlan = PLAN_TIERS.find((p) => p.value === form.plan_tier)

  // =========================================================================
  // Render: Step Content
  // =========================================================================

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderPlanDetails()
      case 1:
        return renderAddOns()
      case 2:
        return renderLinkDetails()
      case 3:
        return renderReview()
      default:
        return null
    }
  }

  // Step 1: Plan Details
  const renderPlanDetails = () => (
    <div className="space-y-6">
      {/* Select Plan */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">Select Plan</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {PLAN_TIERS.map((tier) => (
            <button
              key={tier.value}
              onClick={() => updateField('plan_tier', tier.value)}
              className={`rounded-xl border p-4 text-left transition ${
                form.plan_tier === tier.value
                  ? 'border-[#d4a44c] bg-[#d4a44c]/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <p className="font-semibold text-slate-100">{tier.label}</p>
              <p className="text-sm text-slate-400">{tier.price}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Billing Period */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">Billing Period</label>
        <div className="flex gap-3">
          {['monthly', 'yearly'].map((period) => (
            <button
              key={period}
              onClick={() => updateField('billing_period', period)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
                form.billing_period === period
                  ? 'bg-[#d4a44c] text-slate-900'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Start Date */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">Start Date</label>
        <p className="mb-2 text-xs text-slate-500">
          Leave empty for immediate start (subscription starts with the first payment)
        </p>
        <input
          type="datetime-local"
          value={form.start_at}
          onChange={(e) => updateField('start_at', e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 focus:border-[#d4a44c] focus:outline-none focus:ring-1 focus:ring-[#d4a44c]"
        />
      </div>

      {/* Total Count */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">Total Count</label>
        <p className="mb-2 text-xs text-slate-500">
          Number of billing cycles to be charged (0 = until cancelled)
        </p>
        <input
          type="number"
          min={0}
          max={365}
          value={form.total_count}
          onChange={(e) => updateField('total_count', parseInt(e.target.value) || 0)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 focus:border-[#d4a44c] focus:outline-none focus:ring-1 focus:ring-[#d4a44c]"
        />
      </div>

      {/* Offer ID */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">Offer</label>
        <p className="mb-2 text-xs text-slate-500">
          Razorpay Offer ID for discounts (optional)
        </p>
        <input
          type="text"
          value={form.offer_id}
          onChange={(e) => updateField('offer_id', e.target.value)}
          placeholder="offer_..."
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#d4a44c] focus:outline-none focus:ring-1 focus:ring-[#d4a44c]"
        />
      </div>
    </div>
  )

  // Step 2: Add Ons
  const renderAddOns = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Add Ons</h3>
          <p className="text-sm text-slate-400">
            Add extra items to the subscription (e.g., setup fee, extra features)
          </p>
        </div>
        <button
          onClick={addAddon}
          className="rounded-lg bg-[#d4a44c] px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-[#e8b54a]"
        >
          + Add Item
        </button>
      </div>

      {form.addons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
          <p className="text-slate-400">No add-ons yet. Click &quot;+ Add Item&quot; to add one.</p>
          <p className="mt-1 text-xs text-slate-500">Add-ons are optional and will be charged once.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {form.addons.map((addon, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">Add-on #{index + 1}</span>
                <button
                  onClick={() => removeAddon(index)}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Name</label>
                  <input
                    type="text"
                    value={addon.name}
                    onChange={(e) => updateAddon(index, 'name', e.target.value)}
                    placeholder="e.g., Setup Fee"
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#d4a44c] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Amount (paisa)</label>
                  <input
                    type="number"
                    min={0}
                    value={addon.amount}
                    onChange={(e) => updateAddon(index, 'amount', parseInt(e.target.value) || 0)}
                    placeholder="e.g., 10000 = ₹100"
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#d4a44c] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-slate-400">Description</label>
                  <input
                    type="text"
                    value={addon.description}
                    onChange={(e) => updateAddon(index, 'description', e.target.value)}
                    placeholder="Optional description"
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#d4a44c] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Step 3: Link Details
  const renderLinkDetails = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">Link Details</h3>
        <p className="text-sm text-slate-400">
          Customer info and link configuration
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Customer Name</label>
          <input
            type="text"
            value={form.customer_name}
            onChange={(e) => updateField('customer_name', e.target.value)}
            placeholder="Optional"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#d4a44c] focus:outline-none focus:ring-1 focus:ring-[#d4a44c]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Customer Email</label>
          <input
            type="email"
            value={form.customer_email}
            onChange={(e) => updateField('customer_email', e.target.value)}
            placeholder="Optional"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#d4a44c] focus:outline-none focus:ring-1 focus:ring-[#d4a44c]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Customer Phone</label>
          <input
            type="tel"
            value={form.customer_phone}
            onChange={(e) => updateField('customer_phone', e.target.value)}
            placeholder="Optional (e.g., +91...)"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#d4a44c] focus:outline-none focus:ring-1 focus:ring-[#d4a44c]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Link Expiry</label>
          <input
            type="datetime-local"
            value={form.expire_by}
            onChange={(e) => updateField('expire_by', e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 focus:border-[#d4a44c] focus:outline-none focus:ring-1 focus:ring-[#d4a44c]"
          />
          <p className="mt-1 text-xs text-slate-500">When should this link expire?</p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          rows={3}
          placeholder="Internal description for admin reference"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#d4a44c] focus:outline-none focus:ring-1 focus:ring-[#d4a44c]"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">Notes (Key-Value)</label>
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={noteKey}
            onChange={(e) => setNoteKey(e.target.value)}
            placeholder="Key"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#d4a44c] focus:outline-none"
          />
          <input
            type="text"
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            placeholder="Value"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#d4a44c] focus:outline-none"
          />
          <button
            onClick={addNote}
            disabled={!noteKey.trim()}
            className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {Object.keys(form.notes).length > 0 && (
          <div className="space-y-1">
            {Object.entries(form.notes).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <span className="rounded bg-slate-700 px-2 py-0.5 text-slate-300">{key}</span>
                <span className="text-slate-400">=</span>
                <span className="text-slate-300">{value}</span>
                <button
                  onClick={() => removeNote(key)}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // Step 4: Review
  const renderReview = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">Review Subscription Link</h3>
        <p className="text-sm text-slate-400">Confirm the details before creating</p>
      </div>

      {/* Plan Details Summary */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#d4a44c]">
          Plan Details
        </h4>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Plan</span>
            <span className="font-medium text-slate-100">{selectedPlan?.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Billing Period</span>
            <span className="capitalize text-slate-100">{form.billing_period}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total Cycles</span>
            <span className="text-slate-100">
              {form.total_count === 0 ? 'Until cancelled' : form.total_count}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Start Date</span>
            <span className="text-slate-100">
              {form.start_at ? new Date(form.start_at).toLocaleString() : 'Immediate'}
            </span>
          </div>
          {form.offer_id && (
            <div className="flex justify-between">
              <span className="text-slate-400">Offer ID</span>
              <span className="font-mono text-xs text-slate-100">{form.offer_id}</span>
            </div>
          )}
        </div>
      </div>

      {/* Add Ons Summary */}
      {form.addons.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#d4a44c]">
            Add Ons ({form.addons.length})
          </h4>
          {form.addons.map((addon, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-slate-300">{addon.name || 'Unnamed'}</span>
              <span className="text-slate-100">
                {addon.currency} {(addon.amount / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Link Details Summary */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#d4a44c]">
          Link Details
        </h4>
        <div className="grid gap-2 text-sm">
          {form.customer_name && (
            <div className="flex justify-between">
              <span className="text-slate-400">Customer Name</span>
              <span className="text-slate-100">{form.customer_name}</span>
            </div>
          )}
          {form.customer_email && (
            <div className="flex justify-between">
              <span className="text-slate-400">Customer Email</span>
              <span className="text-slate-100">{form.customer_email}</span>
            </div>
          )}
          {form.customer_phone && (
            <div className="flex justify-between">
              <span className="text-slate-400">Customer Phone</span>
              <span className="text-slate-100">{form.customer_phone}</span>
            </div>
          )}
          {form.expire_by && (
            <div className="flex justify-between">
              <span className="text-slate-400">Expires</span>
              <span className="text-slate-100">
                {new Date(form.expire_by).toLocaleString()}
              </span>
            </div>
          )}
          {form.description && (
            <div className="flex justify-between">
              <span className="text-slate-400">Description</span>
              <span className="text-slate-100">{form.description}</span>
            </div>
          )}
          {Object.keys(form.notes).length > 0 && (
            <div>
              <span className="text-slate-400">Notes</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {Object.entries(form.notes).map(([k, v]) => (
                  <span key={k} className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                    {k}: {v}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!form.customer_name && !form.customer_email && !form.customer_phone && !form.description && (
            <p className="text-slate-500">No additional details specified</p>
          )}
        </div>
      </div>
    </div>
  )

  // =========================================================================
  // Render: Success Result
  // =========================================================================

  if (result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={resetForm} className="text-slate-400 hover:text-slate-200">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-slate-100">Subscription Link Created</h1>
        </div>

        <div className="rounded-xl border border-green-700 bg-green-900/20 p-6">
          <div className="mb-4 flex items-center gap-2">
            <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-lg font-semibold text-green-300">Link Created Successfully</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Subscription Link URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={result.short_url}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 font-mono"
                />
                <button
                  onClick={() => copyToClipboard(result.short_url)}
                  className="rounded-lg bg-[#d4a44c] px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-[#e8b54a]"
                >
                  {copiedUrl ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Razorpay Subscription ID</label>
              <p className="font-mono text-sm text-slate-400">{result.razorpay_subscription_id}</p>
            </div>
          </div>
        </div>

        <button
          onClick={resetForm}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600"
        >
          Create Another Link
        </button>
      </div>
    )
  }

  // =========================================================================
  // Render: Main Page
  // =========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Subscription Links</h1>
          <p className="text-sm text-slate-400">
            Create and manage Razorpay subscription payment links
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-[#d4a44c] px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-[#e8b54a]"
          >
            + Create Subscription Link
          </button>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, i) => (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setCurrentStep(i)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition ${
                        i === currentStep
                          ? 'bg-[#d4a44c] text-slate-900'
                          : i < currentStep
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {i < currentStep ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </button>
                    <span
                      className={`mt-1 text-xs ${
                        i === currentStep ? 'text-[#d4a44c]' : 'text-slate-500'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`mx-2 h-px w-12 sm:w-20 ${
                        i < currentStep ? 'bg-green-600' : 'bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-700 bg-red-900/20 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
                >
                  Back
                </button>
              )}
              <button
                onClick={resetForm}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="rounded-lg bg-[#d4a44c] px-6 py-2 text-sm font-medium text-slate-900 transition hover:bg-[#e8b54a]"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={creating}
                className="rounded-lg bg-[#d4a44c] px-6 py-2 text-sm font-medium text-slate-900 transition hover:bg-[#e8b54a] disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Subscription Link'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Existing Links Table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/30">
        <div className="border-b border-slate-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-100">
            Existing Links
            {linksTotal > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">({linksTotal})</span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-pulse text-slate-400">Loading subscription links...</div>
          </div>
        ) : links.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400">No subscription links created yet.</p>
            <p className="mt-1 text-sm text-slate-500">
              Create one to generate a shareable Razorpay payment link.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Period</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Cycles</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-3 text-sm capitalize text-slate-100">
                      {link.plan_tier}
                    </td>
                    <td className="px-6 py-3 text-sm capitalize text-slate-300">
                      {link.billing_period}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[link.status] || 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {link.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-300">
                      {link.customer_name || link.customer_email || '-'}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-300">
                      {link.total_count === 0 ? 'Auto' : link.total_count}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-400">
                      {link.created_at
                        ? new Date(link.created_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => copyToClipboard(link.short_url)}
                        className="rounded-lg bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-600"
                      >
                        Copy Link
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {linksTotal > 10 && (
          <div className="flex items-center justify-between border-t border-slate-700 px-6 py-3">
            <button
              onClick={() => fetchLinks(linksPage - 1)}
              disabled={linksPage <= 1}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {linksPage} of {Math.ceil(linksTotal / 10)}
            </span>
            <button
              onClick={() => fetchLinks(linksPage + 1)}
              disabled={linksPage * 10 >= linksTotal}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
