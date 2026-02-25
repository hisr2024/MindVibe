'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

const COOKIE_CONSENT_KEY = 'mindvibe_cookie_consent'
const COOKIE_CONSENT_VERSION = '1.0'

interface CookieBannerProps {
  onAcceptAll?: () => void
  onRejectAll?: () => void
  onSavePreferences?: (preferences: CookiePreferences) => void
}

export default function CookieBanner({ 
  onAcceptAll, 
  onRejectAll, 
  onSavePreferences 
}: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, cannot be changed
    analytics: false,
    marketing: false,
    functional: false,
  })

  useEffect(() => {
    // Check if consent has been given
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      setIsVisible(true)
    } else {
      try {
        const parsed = JSON.parse(consent)
        if (parsed.version !== COOKIE_CONSENT_VERSION) {
          // Version changed, show banner again
          setIsVisible(true)
        } else {
          setPreferences(parsed.preferences)
        }
      } catch {
        setIsVisible(true)
      }
    }
  }, [])

  const saveConsent = async (prefs: CookiePreferences) => {
    const consentData = {
      version: COOKIE_CONSENT_VERSION,
      preferences: prefs,
      timestamp: new Date().toISOString(),
    }
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData))
    
    // Also save to backend if user is authenticated
    try {
      // Generate a simple unique ID if one doesn't exist
      // Using a timestamp + random string for browser compatibility
      const generateId = () => {
        const timestamp = Date.now().toString(36)
        const randomPart = Math.random().toString(36).substring(2, 15)
        return `${timestamp}-${randomPart}`
      }
      const anonymousId = localStorage.getItem('anonymous_id') || generateId()
      localStorage.setItem('anonymous_id', anonymousId)
      
      await fetch('/api/compliance/cookie-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...prefs,
          anonymous_id: anonymousId,
        }),
      })
    } catch {
      // Backend save failed, but local storage succeeded
    }
    
    setIsVisible(false)
  }

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    }
    setPreferences(allAccepted)
    saveConsent(allAccepted)
    onAcceptAll?.()
  }

  const handleRejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    }
    setPreferences(onlyNecessary)
    saveConsent(onlyNecessary)
    onRejectAll?.()
  }

  const handleSavePreferences = () => {
    saveConsent(preferences)
    onSavePreferences?.(preferences)
  }

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'necessary') return // Cannot change necessary cookies
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
      >
        <div className="mx-auto max-w-4xl rounded-2xl bg-gray-900/95 backdrop-blur-lg border border-[#d4a44c]/20 shadow-2xl">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-2xl">🍪</div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-[#f5f0e8] mb-2">
                  Cookie Preferences
                </h3>
                <p className="text-sm text-[#f5f0e8]/70 mb-4">
                  We use cookies to enhance your experience, analyze site traffic, and personalize content. 
                  You can customize your preferences below or accept all cookies.
                </p>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 mb-4">
                        {/* Necessary Cookies */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                          <div>
                            <span className="text-sm font-medium text-[#f5f0e8]">
                              Necessary Cookies
                            </span>
                            <p className="text-xs text-[#f5f0e8]/50">
                              Required for the website to function properly. Cannot be disabled.
                            </p>
                          </div>
                          <div className="w-12 h-6 rounded-full bg-emerald-500/30 flex items-center px-1">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 ml-auto" />
                          </div>
                        </div>

                        {/* Analytics Cookies */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                          <div>
                            <span className="text-sm font-medium text-[#f5f0e8]">
                              Analytics Cookies
                            </span>
                            <p className="text-xs text-[#f5f0e8]/50">
                              Help us understand how visitors interact with our website.
                            </p>
                          </div>
                          <button
                            onClick={() => updatePreference('analytics', !preferences.analytics)}
                            className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                              preferences.analytics 
                                ? 'bg-emerald-500/30' 
                                : 'bg-gray-700'
                            }`}
                          >
                            <div 
                              className={`w-4 h-4 rounded-full transition-all ${
                                preferences.analytics 
                                  ? 'bg-emerald-500 ml-auto' 
                                  : 'bg-gray-500'
                              }`} 
                            />
                          </button>
                        </div>

                        {/* Marketing Cookies */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                          <div>
                            <span className="text-sm font-medium text-[#f5f0e8]">
                              Marketing Cookies
                            </span>
                            <p className="text-xs text-[#f5f0e8]/50">
                              Used to track visitors across websites for advertising purposes.
                            </p>
                          </div>
                          <button
                            onClick={() => updatePreference('marketing', !preferences.marketing)}
                            className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                              preferences.marketing 
                                ? 'bg-emerald-500/30' 
                                : 'bg-gray-700'
                            }`}
                          >
                            <div 
                              className={`w-4 h-4 rounded-full transition-all ${
                                preferences.marketing 
                                  ? 'bg-emerald-500 ml-auto' 
                                  : 'bg-gray-500'
                              }`} 
                            />
                          </button>
                        </div>

                        {/* Functional Cookies */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                          <div>
                            <span className="text-sm font-medium text-[#f5f0e8]">
                              Functional Cookies
                            </span>
                            <p className="text-xs text-[#f5f0e8]/50">
                              Enable enhanced functionality and personalization.
                            </p>
                          </div>
                          <button
                            onClick={() => updatePreference('functional', !preferences.functional)}
                            className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                              preferences.functional 
                                ? 'bg-emerald-500/30' 
                                : 'bg-gray-700'
                            }`}
                          >
                            <div 
                              className={`w-4 h-4 rounded-full transition-all ${
                                preferences.functional 
                                  ? 'bg-emerald-500 ml-auto' 
                                  : 'bg-gray-500'
                              }`} 
                            />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-[#d4a44c] hover:text-[#e8b54a] transition-colors"
                  >
                    {showDetails ? 'Hide Details' : 'Customize'}
                  </button>
                  
                  <div className="flex-grow" />
                  
                  <button
                    onClick={handleRejectAll}
                    className="px-4 py-2 text-sm font-medium text-[#f5f0e8]/70 hover:text-[#f5f0e8] transition-colors"
                  >
                    Reject All
                  </button>
                  
                  {showDetails ? (
                    <button
                      onClick={handleSavePreferences}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-[#d4a44c]/20 text-[#d4a44c] hover:bg-[#d4a44c]/30 transition-colors"
                    >
                      Save Preferences
                    </button>
                  ) : null}
                  
                  <button
                    onClick={handleAcceptAll}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-[#d4a44c] text-white hover:bg-[#c8943a] transition-colors"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
