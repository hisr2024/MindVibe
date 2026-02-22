/**
 * Compassionate Care Component
 *
 * Provides gentle, spiritual support resources when someone needs extra care.
 * Frames support as an extension of the divine friend experience.
 *
 * Community Wisdom Circles
 */

'use client'

import { motion } from 'framer-motion'
import { Phone, MessageSquare, Globe, X } from 'lucide-react'
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
    name: 'Support Line (US)',
    phone: '988',
    url: 'https://988lifeline.org',
    description: 'Free and confidential support, available anytime',
    availability: '24/7'
  },
  {
    name: 'Text Support',
    phone: 'Text HOME to 741741',
    url: 'https://www.crisistextline.org',
    description: 'Free text-based support when you need someone to listen',
    availability: '24/7'
  },
  {
    name: 'International Support',
    phone: 'Varies by country',
    url: 'https://www.iasp.info/resources/Crisis_Centres',
    description: 'Support centers around the world',
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
      className={`rounded-3xl border border-[#d4a44c]/30 bg-gradient-to-br from-slate-950/80 to-[#0f0a08]/60 p-6 ${className}`}
    >
      {/* Close Button */}
      {onClose && (
        <button
          onClick={handleDismiss}
          className="float-right text-orange-100/60 hover:text-orange-100 transition"
          aria-label="Dismiss crisis alert"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-full bg-[#d4a44c]/20 flex items-center justify-center">
            <span className="text-2xl">🙏</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#d4a44c]">You Are Not Alone</h3>
            <p className="text-sm text-orange-100/80">Krishna walks beside you. Caring souls are here to help.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-[#d4a44c]/20 bg-[#d4a44c]/5">
          <p className="text-sm text-orange-100/90 leading-relaxed">
            Your feelings matter deeply. Sometimes the path requires support beyond what a spiritual companion can offer.
            These resources are available right now — caring, trained people ready to listen.
          </p>
        </div>
      </div>

      {/* Support Resources */}
      <div className="space-y-3 mb-6">
        {resources.map((resource, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl border border-[#d4a44c]/20 bg-[#d4a44c]/5 p-4 hover:border-[#d4a44c]/40 transition"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-orange-50 mb-1 flex items-center gap-2">
                  {resource.name}
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                    {resource.availability}
                  </span>
                </h4>
                <p className="text-xs text-orange-100/70 mb-3">{resource.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Phone Button */}
              {resource.phone !== 'Varies by country' && (
                <a
                  href={`tel:${resource.phone.replace(/[^0-9]/g, '')}`}
                  className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-[#d4a44c]/20 text-orange-50 font-medium hover:bg-[#d4a44c]/30 transition flex items-center justify-center gap-2"
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
                className="px-4 py-2.5 rounded-xl border border-[#d4a44c]/30 text-orange-100 hover:border-[#d4a44c]/50 hover:bg-[#d4a44c]/10 transition flex items-center gap-2 text-sm"
              >
                <Globe className="h-4 w-4" />
                <span>Learn More</span>
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gentle Guidance */}
      <div className="rounded-2xl border border-[#d4a44c]/20 bg-[#d4a44c]/5 p-4">
        <h5 className="text-sm font-semibold text-orange-50 mb-2 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#d4a44c]" />
          <span>A Gentle Reminder</span>
        </h5>
        <ul className="space-y-1.5 text-xs text-orange-100/80">
          <li>• Stay close to someone you trust — a friend, family member, or loved one</li>
          <li>• Difficult feelings are like passing clouds — they come and they go</li>
          <li>• You are deeply valued, and kind hearts are ready to listen</li>
          <li>• As Krishna says: &quot;You are never alone. I am always with you.&quot;</li>
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
