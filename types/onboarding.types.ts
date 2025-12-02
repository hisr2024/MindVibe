/**
 * Onboarding Types
 * Type definitions for MindVibe onboarding flow
 */

/** Step identifiers for the onboarding flow */
export type OnboardingStepId =
  | 'welcome'
  | 'profile'
  | 'preferences'
  | 'subscription'
  | 'complete'

/** Onboarding step definition */
export interface OnboardingStep {
  id: OnboardingStepId
  title: string
  description?: string
  isOptional?: boolean
  isCompleted?: boolean
}

/** User timezone selection */
export interface TimezoneOption {
  value: string
  label: string
  offset: string
}

/** Profile data collected during onboarding */
export interface ProfileData {
  displayName: string
  email: string
  avatar?: string | null
  avatarFile?: File | null
  bio?: string
  timezone: string
  createdAt?: string
  updatedAt?: string
}

/** Available wellness goals */
export type WellnessGoal =
  | 'stress'
  | 'sleep'
  | 'focus'
  | 'anxiety'
  | 'mood'
  | 'growth'
  | 'relationships'
  | 'mindfulness'

/** Mood tracking frequency options */
export type MoodTrackingFrequency =
  | 'daily'
  | 'twice_daily'
  | 'weekly'
  | 'as_needed'

/** Notification settings */
export interface NotificationSettings {
  dailyReminder: boolean
  dailyReminderTime?: string
  weeklyDigest: boolean
  kiaanSuggestions: boolean
  achievementAlerts: boolean
}

/** Preferences data collected during onboarding */
export interface PreferencesData {
  goals: WellnessGoal[]
  interests: string[]
  moodTrackingFrequency: MoodTrackingFrequency
  notifications: NotificationSettings
}

/** Subscription tier identifiers */
export type SubscriptionTierId = 'free' | 'basic' | 'premium' | 'enterprise'

/** Billing cycle options */
export type BillingCycle = 'monthly' | 'yearly'

/** Feature availability in a tier */
export interface TierFeature {
  name: string
  included: boolean
  limit?: string | number
  description?: string
}

/** Subscription tier definition */
export interface SubscriptionTier {
  id: SubscriptionTierId
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  kiaanQuota: number | 'unlimited'
  features: TierFeature[]
  isPopular?: boolean
  badge?: string
  color?: string
}

/** Subscription data from onboarding selection */
export interface SubscriptionData {
  tierId: SubscriptionTierId
  billingCycle: BillingCycle
  selectedAt?: string
}

/** Complete onboarding state */
export interface OnboardingState {
  currentStep: number
  isComplete: boolean
  startedAt: string
  completedAt?: string
  profile: ProfileData
  preferences: PreferencesData
  subscription: SubscriptionData
}

/** Validation errors for onboarding forms */
export interface OnboardingValidationErrors {
  profile?: Partial<Record<keyof ProfileData, string>>
  preferences?: Partial<Record<keyof PreferencesData, string>>
  subscription?: Partial<Record<keyof SubscriptionData, string>>
}

/** Onboarding progress from API */
export interface OnboardingProgress {
  userId: string
  currentStep: number
  isComplete: boolean
  data: Partial<OnboardingState>
  lastUpdated: string
}

/** Default onboarding values */
export const DEFAULT_PROFILE_DATA: ProfileData = {
  displayName: '',
  email: '',
  avatar: null,
  bio: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
}

export const DEFAULT_PREFERENCES_DATA: PreferencesData = {
  goals: [],
  interests: [],
  moodTrackingFrequency: 'daily',
  notifications: {
    dailyReminder: true,
    dailyReminderTime: '09:00',
    weeklyDigest: true,
    kiaanSuggestions: true,
    achievementAlerts: true,
  },
}

export const DEFAULT_SUBSCRIPTION_DATA: SubscriptionData = {
  tierId: 'free',
  billingCycle: 'monthly',
}

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  currentStep: 0,
  isComplete: false,
  startedAt: new Date().toISOString(),
  profile: DEFAULT_PROFILE_DATA,
  preferences: DEFAULT_PREFERENCES_DATA,
  subscription: DEFAULT_SUBSCRIPTION_DATA,
}
