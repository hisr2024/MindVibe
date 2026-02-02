/**
 * Push Notification Service
 *
 * Handles push notification registration, permissions, and delivery.
 *
 * Features:
 * - Service Worker push subscription management
 * - Permission handling
 * - Notification scheduling
 * - Topic-based subscriptions
 * - Offline notification queueing
 *
 * Security:
 * - VAPID key authentication
 * - Encrypted push payloads
 * - Permission-based access
 */

import { apiFetch } from '@/lib/api'

// Notification topics
export type NotificationTopic =
  | 'daily_reminder'
  | 'mood_checkin'
  | 'journey_progress'
  | 'kiaan_insights'
  | 'community_updates'
  | 'weekly_summary'

// Notification preferences
export interface NotificationPreferences {
  enabled: boolean
  topics: NotificationTopic[]
  quietHoursStart?: string // HH:MM format
  quietHoursEnd?: string
  timezone: string
}

// Notification payload
export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  data?: Record<string, unknown>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  requireInteraction?: boolean
  silent?: boolean
  timestamp?: number
}

// Subscription info
export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  expirationTime?: number | null
}

// Service state
interface PushServiceState {
  isSupported: boolean
  isSubscribed: boolean
  permission: NotificationPermission
  subscription: PushSubscription | null
  preferences: NotificationPreferences
}

class PushNotificationService {
  private state: PushServiceState = {
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    subscription: null,
    preferences: {
      enabled: false,
      topics: [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  }

  private listeners: Set<(state: PushServiceState) => void> = new Set()
  private swRegistration: ServiceWorkerRegistration | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  /**
   * Initialize the push service
   */
  private async initialize(): Promise<void> {
    // Check support
    this.state.isSupported = 'serviceWorker' in navigator && 'PushManager' in window

    if (!this.state.isSupported) {
      console.warn('[PushService] Push notifications not supported')
      return
    }

    // Get current permission
    this.state.permission = Notification.permission

    // Get service worker registration
    try {
      this.swRegistration = await navigator.serviceWorker.ready
      await this.checkSubscription()
      await this.loadPreferences()
    } catch (error) {
      console.error('[PushService] Initialization failed:', error)
    }

    this.notifyListeners()
  }

  /**
   * Check current subscription status
   */
  private async checkSubscription(): Promise<void> {
    if (!this.swRegistration) return

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription()
      this.state.isSubscribed = !!subscription
      this.state.subscription = subscription
        ? this.serializeSubscription(subscription)
        : null
    } catch (error) {
      console.error('[PushService] Failed to check subscription:', error)
    }
  }

  /**
   * Serialize PushSubscription for storage/transmission
   */
  private serializeSubscription(sub: globalThis.PushSubscription): PushSubscription {
    const json = sub.toJSON()
    return {
      endpoint: sub.endpoint,
      keys: {
        p256dh: json.keys?.p256dh || '',
        auth: json.keys?.auth || '',
      },
      expirationTime: sub.expirationTime,
    }
  }

  /**
   * Load preferences from server/storage
   */
  private async loadPreferences(): Promise<void> {
    try {
      // Try to load from server
      const response = await apiFetch('/api/notifications/preferences')
      if (response.ok) {
        const data = await response.json()
        this.state.preferences = {
          enabled: data.enabled || false,
          topics: data.topics || [],
          quietHoursStart: data.quiet_hours_start,
          quietHoursEnd: data.quiet_hours_end,
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
      }
    } catch {
      // Fall back to local storage
      const stored = localStorage.getItem('mindvibe_notification_prefs')
      if (stored) {
        try {
          this.state.preferences = JSON.parse(stored)
        } catch {
          // Use defaults
        }
      }
    }
  }

  /**
   * Save preferences to server/storage
   */
  private async savePreferences(): Promise<void> {
    // Save locally
    localStorage.setItem(
      'mindvibe_notification_prefs',
      JSON.stringify(this.state.preferences)
    )

    // Save to server
    try {
      await apiFetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: this.state.preferences.enabled,
          topics: this.state.preferences.topics,
          quiet_hours_start: this.state.preferences.quietHoursStart,
          quiet_hours_end: this.state.preferences.quietHoursEnd,
          timezone: this.state.preferences.timezone,
        }),
      })
    } catch (error) {
      console.error('[PushService] Failed to save preferences:', error)
    }
  }

  /**
   * Request notification permission
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.state.isSupported) {
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      this.state.permission = permission
      this.notifyListeners()
      return permission
    } catch (error) {
      console.error('[PushService] Permission request failed:', error)
      return 'denied'
    }
  }

  /**
   * Subscribe to push notifications
   */
  public async subscribe(): Promise<boolean> {
    if (!this.state.isSupported || !this.swRegistration) {
      return false
    }

    if (this.state.permission !== 'granted') {
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        return false
      }
    }

    try {
      // Try to get VAPID public key from server
      // If backend doesn't support push notifications, fall back to local-only notifications
      let serverPushEnabled = false
      try {
        const keyResponse = await apiFetch('/api/notifications/vapid-key')
        if (keyResponse.ok) {
          const { public_key } = await keyResponse.json()

          // Convert base64 to Uint8Array
          const applicationServerKey = this.urlBase64ToUint8Array(public_key)

          // Subscribe to server push
          const subscription = await this.swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as BufferSource,
          })

          this.state.subscription = this.serializeSubscription(subscription)

          // Register subscription with server
          await apiFetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription: this.state.subscription,
            }),
          })
          serverPushEnabled = true
        }
      } catch (serverError) {
        // Server push not available, continue with local notifications only
        console.log('[PushService] Server push not available, using local notifications only')
      }

      // Enable notifications (local-only if server push failed)
      this.state.isSubscribed = true
      this.state.preferences.enabled = true
      await this.savePreferences()
      this.notifyListeners()

      console.log(`[PushService] Notifications enabled (server push: ${serverPushEnabled})`)
      return true
    } catch (error) {
      console.error('[PushService] Subscription failed:', error)
      return false
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribe(): Promise<boolean> {
    if (!this.swRegistration) {
      // Still disable notifications locally
      this.state.isSubscribed = false
      this.state.subscription = null
      this.state.preferences.enabled = false
      await this.savePreferences()
      this.notifyListeners()
      return true
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()

        // Try to notify server (ignore failures - server may not support notifications)
        try {
          await apiFetch('/api/notifications/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
            }),
          })
        } catch {
          // Server notification failed, but local unsubscribe succeeded
          console.log('[PushService] Server unsubscribe failed, but local unsubscribe succeeded')
        }
      }

      this.state.isSubscribed = false
      this.state.subscription = null
      this.state.preferences.enabled = false
      await this.savePreferences()
      this.notifyListeners()

      return true
    } catch (error) {
      console.error('[PushService] Unsubscribe failed:', error)
      return false
    }
  }

  /**
   * Update notification topics
   */
  public async updateTopics(topics: NotificationTopic[]): Promise<void> {
    this.state.preferences.topics = topics
    await this.savePreferences()
    this.notifyListeners()
  }

  /**
   * Set quiet hours
   */
  public async setQuietHours(
    start: string | undefined,
    end: string | undefined
  ): Promise<void> {
    this.state.preferences.quietHoursStart = start
    this.state.preferences.quietHoursEnd = end
    await this.savePreferences()
    this.notifyListeners()
  }

  /**
   * Show a local notification
   */
  public async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (this.state.permission !== 'granted') {
      console.warn('[PushService] Cannot show notification - permission not granted')
      return
    }

    // Check quiet hours
    if (this.isQuietHours()) {
      console.log('[PushService] Notification suppressed - quiet hours')
      return
    }

    try {
      if (this.swRegistration) {
        await this.swRegistration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icons/icon-192x192.png',
          badge: payload.badge || '/icons/badge-72x72.png',
          tag: payload.tag,
          data: payload.data,
          actions: payload.actions,
          requireInteraction: payload.requireInteraction,
          silent: payload.silent,
          timestamp: payload.timestamp,
          ...(payload.image && { image: payload.image }),
        } as NotificationOptions)
      } else {
        // Fallback to native Notification API
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/icons/icon-192x192.png',
          badge: payload.badge,
          tag: payload.tag,
          data: payload.data,
          requireInteraction: payload.requireInteraction,
          silent: payload.silent,
          timestamp: payload.timestamp,
        } as NotificationOptions)
      }
    } catch (error) {
      console.error('[PushService] Failed to show notification:', error)
    }
  }

  /**
   * Check if currently in quiet hours
   */
  private isQuietHours(): boolean {
    const { quietHoursStart, quietHoursEnd } = this.state.preferences

    if (!quietHoursStart || !quietHoursEnd) {
      return false
    }

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()

    const [startHour, startMin] = quietHoursStart.split(':').map(Number)
    const [endHour, endMin] = quietHoursEnd.split(':').map(Number)

    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    // Handle overnight quiet hours
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime
    }

    return currentTime >= startTime && currentTime <= endTime
  }

  /**
   * Convert URL-safe base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray
  }

  /**
   * Get current state
   */
  public getState(): PushServiceState {
    return { ...this.state }
  }

  /**
   * Subscribe to state changes
   */
  public onStateChange(callback: (state: PushServiceState) => void): () => void {
    this.listeners.add(callback)
    callback(this.getState()) // Immediate callback with current state
    return () => this.listeners.delete(callback)
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const state = this.getState()
    this.listeners.forEach((callback) => callback(state))
  }

  /**
   * Check if push is supported
   */
  public isSupported(): boolean {
    return this.state.isSupported
  }

  /**
   * Check if subscribed
   */
  public isSubscribed(): boolean {
    return this.state.isSubscribed
  }

  /**
   * Get current permission
   */
  public getPermission(): NotificationPermission {
    return this.state.permission
  }

  /**
   * Get preferences
   */
  public getPreferences(): NotificationPreferences {
    return { ...this.state.preferences }
  }
}

// Export singleton instance
export const pushService = new PushNotificationService()

// Export convenience functions
export function requestNotificationPermission(): Promise<NotificationPermission> {
  return pushService.requestPermission()
}

export function subscribeToPushNotifications(): Promise<boolean> {
  return pushService.subscribe()
}

export function unsubscribeFromPushNotifications(): Promise<boolean> {
  return pushService.unsubscribe()
}

export function showNotification(payload: NotificationPayload): Promise<void> {
  return pushService.showLocalNotification(payload)
}

export function getPushState() {
  return pushService.getState()
}

export default pushService
