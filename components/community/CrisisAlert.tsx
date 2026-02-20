/**
 * Crisis Alert Component
 *
 * Displays crisis resources and support information when crisis keywords detected.
 *
 * Quantum Enhancement #5: Community Wisdom Circles
 */

'use client'

import { motion } from 'framer-motion'
import { AlertCircle, Phone, MessageSquare, Globe, X } from 'lucide-react'
import { useState } from 'react'

interface CrisisResource {
  name: string
  phone: string
  url: string
  description: string
  availability: string
}

interface CrisisAlertProps {
  resources?: CrisisResource[]
  onClose?: () => void
  className?: string
}

const DEFAULT_RESOURCES: CrisisResource[] = [
  {
    name: 'National Suicide Prevention Lifeline (US)',
    phone: '988',
    url: 'https://988lifeline.org',
    description: '24/7 free and confidential support for people in distress',
    availability: '24/7'
  },
  {
    name: 'Crisis Text Line',
    phone: 'Text HOME to 741741',
    url: 'https://www.crisistextline.org',
    description: 'Free 24/7 text support for those in crisis',
    availability: '24/7'
  },
  {
    name: 'International Crisis Resources',
    phone: 'Varies by country',
    url: 'https://www.iasp.info/resources/Crisis_Centres',
    description: 'Directory of crisis centers worldwide',
    availability: '24/7'
  },
  {
    name: 'NAMI Helpline',
    phone: '1-800-950-6264',
    url: 'https://www.nami.org',
    description: 'Spiritual wellness support and resources',
    availability: 'Mon-Fri 10am-10pm ET'
  }
]

export function CrisisAlert({ resources = DEFAULT_RESOURCES, onClose, className = '' }: CrisisAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  const handleDismiss = () => {
    setIsDismissed(true)
    if (onClose) {
      onClose()
    }
  }

  if (isDismissed) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-3xl border border-red-400/30 bg-gradient-to-br from-red-950/50 to-red-900/30 p-6 ${className}`}
    >
      {/* Close Button */}
      {onClose && (
        <button
          onClick={handleDismiss}
          className="float-right text-red-100/60 hover:text-red-100 transition"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-50">Immediate Support Available</h3>
            <p className="text-sm text-red-100/80">You don&apos;t have to face this alone</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-red-400/20 bg-red-950/30">
          <p className="text-sm text-red-100/90 leading-relaxed">
            If you&apos;re experiencing thoughts of suicide or self-harm, please reach out for immediate help.
            These resources are available right now, and trained counselors are ready to support you.
          </p>
        </div>
      </div>

      {/* Crisis Resources */}
      <div className="space-y-3 mb-6">
        {resources.map((resource, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl border border-red-400/20 bg-red-950/20 p-4 hover:border-red-400/40 transition"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-red-50 mb-1 flex items-center gap-2">
                  {resource.name}
                  <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                    {resource.availability}
                  </span>
                </h4>
                <p className="text-xs text-red-100/70 mb-3">{resource.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Phone Button */}
              {resource.phone !== 'Varies by country' && (
                <a
                  href={`tel:${resource.phone.replace(/[^0-9]/g, '')}`}
                  className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-red-500/30 text-red-50 font-medium hover:bg-red-500/40 transition flex items-center justify-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  <span>{resource.phone}</span>
                </a>
              )}

              {/* Website Button */}
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl border border-red-400/30 text-red-100 hover:border-red-400/50 hover:bg-red-500/10 transition flex items-center gap-2 text-sm"
              >
                <Globe className="h-4 w-4" />
                <span>Visit Website</span>
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Message */}
      <div className="rounded-2xl border border-red-400/20 bg-red-950/30 p-4">
        <h5 className="text-sm font-semibold text-red-50 mb-2 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span>While You Wait</span>
        </h5>
        <ul className="space-y-1.5 text-xs text-red-100/80">
          <li>• Remove any means of self-harm from your immediate surroundings</li>
          <li>• Stay with someone you trust, or call a friend or family member</li>
          <li>• Remember: Crisis feelings are temporary, even when they feel permanent</li>
          <li>• Your life has value, and help is available</li>
        </ul>
      </div>

      {/* Gita Wisdom */}
      <div className="mt-4 rounded-2xl border border-orange-400/20 bg-orange-950/20 p-4">
        <p className="text-sm text-orange-100/90 italic leading-relaxed mb-2">
          &quot;For one who has conquered the mind, the mind is the best of friends;
          but for one who has failed to do so, their mind will remain the greatest enemy.&quot;
        </p>
        <p className="text-xs text-orange-100/60">— Bhagavad Gita 6.6</p>
      </div>
    </motion.div>
  )
}
