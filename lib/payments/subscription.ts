/**
 * Subscription plan definitions and helpers
 *
 * Defines the four tiers: Seeker (free), Bhakta, Sadhak, Siddha.
 * Each has multi-currency pricing for monthly/annual billing.
 *
 * SINGLE SOURCE OF TRUTH — import plan names from here. Never hardcode
 * "Sacred Pro" / "Sacred Circle" anywhere; those are deprecated aliases.
 */

import { type CurrencyCode } from './currency'

export type PlanId = 'seeker' | 'pro' | 'circle'
export type BillingCycle = 'monthly' | 'annual'

export interface PlanFeature {
  name: string
  locked?: boolean
}

export interface PlanPricing {
  monthly: number
  annual: number
}

export interface Plan {
  id: PlanId
  name: string
  sanskrit: string
  tagline: string
  color: string
  featured?: boolean
  badge?: string
  trialDays?: number
  price: Record<CurrencyCode, PlanPricing>
  cta: string
  features: PlanFeature[]
}

export const PLANS: Plan[] = [
  {
    id: 'seeker',
    name: 'Seeker',
    sanskrit: 'जिज्ञासु',
    tagline: 'Begin the inner journey',
    color: '#6B6355',
    price: {
      INR: { monthly: 0, annual: 0 },
      USD: { monthly: 0, annual: 0 },
      EUR: { monthly: 0, annual: 0 },
      GBP: { monthly: 0, annual: 0 },
    },
    cta: 'Continue as Seeker',
    features: [
      { name: '5 Sakha conversations/month' },
      { name: 'Daily Gita shloka' },
      { name: 'Nitya Sadhana (3 sessions)' },
      { name: 'KIAAN Voice Companion', locked: true },
      { name: 'Shadripu Journeys', locked: true },
      { name: 'Karma & Emotional Reset', locked: true },
    ],
  },
  {
    id: 'pro',
    name: 'Bhakta',
    sanskrit: 'भक्त',
    tagline: 'The devoted seeker\u2019s companion',
    color: '#D4A017',
    featured: true,
    badge: 'MOST POPULAR',
    trialDays: 7,
    price: {
      INR: { monthly: 149, annual: 83 },
      USD: { monthly: 5, annual: 3 },
      EUR: { monthly: 5, annual: 3 },
      GBP: { monthly: 4, annual: 2 },
    },
    cta: 'Start 7-Day Free Trial',
    features: [
      { name: 'Unlimited Sakha conversations' },
      { name: 'KIAAN Voice Companion (Shankha)' },
      { name: 'All 6 Shadripu Journeys' },
      { name: 'Karma Reset · Emotional Reset' },
      { name: 'Viyoga · Ardha · Relationship Compass' },
      { name: 'KIAAN Vibe Player (500+ sacred tracks)' },
      { name: 'Cross-session memory & spiritual journal' },
      { name: 'Priority AI response speed' },
    ],
  },
  {
    id: 'circle',
    name: 'Sadhak',
    sanskrit: 'साधक',
    tagline: 'The complete dharmic practice',
    color: '#06B6D4',
    badge: 'COMPLETE',
    trialDays: 7,
    price: {
      INR: { monthly: 399, annual: 233 },
      USD: { monthly: 12, annual: 7 },
      EUR: { monthly: 11, annual: 7 },
      GBP: { monthly: 9, annual: 5 },
    },
    cta: 'Begin Sacred Journey',
    features: [
      { name: 'Everything in Bhakta' },
      { name: 'Up to 5 family members' },
      { name: 'Shared family Gita library' },
      { name: 'Family karma dashboard' },
      { name: "Children's sacred stories mode" },
      { name: 'Priority support' },
    ],
  },
]

/**
 * Get annual total from per-month annual price.
 */
export function getAnnualTotal(monthlyEquivalent: number): number {
  return monthlyEquivalent * 12
}

/**
 * Calculate savings percentage between monthly and annual billing.
 */
export function getSavingsPercent(monthly: number, annualMonthly: number): number {
  if (monthly === 0) return 0
  return Math.round(((monthly - annualMonthly) / monthly) * 100)
}

/**
 * Get plan by ID.
 */
export function getPlanById(id: PlanId): Plan | undefined {
  return PLANS.find(p => p.id === id)
}
