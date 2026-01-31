'use client'

import { useState } from 'react'
import { VoiceResponseButton } from '@/components/voice'

/**
 * WisdomResponseCard - Ultra-deep Gita wisdom display component
 *
 * Displays structured wisdom transmissions with:
 * - Expandable sections with sacred styling
 * - Sanskrit term highlighting
 * - Smooth reveal animations
 * - Sacred iconography
 */

interface WisdomSection {
  key: string
  title: string
  content: string
  icon?: string
}

interface WisdomResponseCardProps {
  tool: 'viyoga' | 'ardha' | 'relationship_compass'
  sections: Record<string, string>
  fullResponse: string
  gitaVersesUsed?: number
  timestamp: string
  language?: string
}

// Section configurations for each tool
const SECTION_CONFIG = {
  viyoga: {
    icon: '🎯',
    name: 'Viyoga',
    sectionMeta: {
      honoring_pain: { title: 'Sacred Recognition', icon: '🙏', order: 1 },
      sacred_acknowledgment: { title: 'Sacred Recognition', icon: '🙏', order: 1 },
      understanding_attachment: { title: 'Anatomy of Attachment', icon: '🔗', order: 2 },
      five_layers_attachment: { title: 'Five Layers of Attachment', icon: '🔗', order: 2 },
      karma_yoga_liberation: { title: 'Karma Yoga Liberation', icon: '⚡', order: 3 },
      complete_teaching_karma_yoga: { title: 'Complete Karma Yoga Teaching', icon: '⚡', order: 3 },
      deeper_truth: { title: 'The Deeper Truth', icon: '💎', order: 4 },
      witness_consciousness: { title: 'Witness Consciousness', icon: '👁️', order: 5 },
      practical_wisdom: { title: 'Sacred Practice', icon: '🌟', order: 6 },
      sacred_practice: { title: 'Sacred Practice', icon: '🌟', order: 6 },
      eternal_anchor: { title: 'Eternal Anchor', icon: '⚓', order: 7 },
      eternal_truth: { title: 'Eternal Truth', icon: '⚓', order: 7 },
      // Legacy sections
      validation: { title: 'Validation', icon: '💚', order: 1 },
      attachment_check: { title: 'Attachment Check', icon: '🔗', order: 2 },
      detachment_principle: { title: 'Detachment Principle', icon: '🌊', order: 3 },
      one_action: { title: 'One Action', icon: '🎯', order: 4 },
    },
    accentColor: 'orange',
  },
  ardha: {
    icon: '🔄',
    name: 'Ardha',
    sectionMeta: {
      sacred_witness: { title: 'Sacred Witnessing', icon: '👁️', order: 1 },
      recognition: { title: 'Recognition', icon: '👁️', order: 1 },
      architecture_of_mind: { title: 'Architecture of Mind', icon: '🧠', order: 2 },
      complete_anatomy_thought: { title: 'Anatomy of Thought', icon: '🧠', order: 2 },
      deep_insight: { title: 'Deep Insight', icon: '💡', order: 2 },
      sthitaprajna_teaching: { title: 'Sthitaprajna Teaching', icon: '🏔️', order: 3 },
      complete_teaching_sthitaprajna: { title: 'Complete Sthitaprajna', icon: '🏔️', order: 3 },
      sacred_reframe: { title: 'Sacred Reframe', icon: '🔄', order: 4 },
      reframe: { title: 'Reframe', icon: '🔄', order: 4 },
      sakshi_bhava_practice: { title: 'Witness Practice', icon: '🧘', order: 5 },
      practice_of_witness: { title: 'Practice of Witness', icon: '🧘', order: 5 },
      small_action_step: { title: 'Small Action Step', icon: '🚶', order: 5 },
      eternal_truth: { title: 'Eternal Truth', icon: '✨', order: 6 },
    },
    accentColor: 'purple',
  },
  relationship_compass: {
    icon: '🧭',
    name: 'Relationship Compass',
    sectionMeta: {
      sacred_witness_to_pain: { title: 'Sacred Witnessing', icon: '💜', order: 1 },
      acknowledgment: { title: 'Acknowledgment', icon: '💜', order: 1 },
      mirror_of_relationship: { title: 'Mirror of Relationship', icon: '🪞', order: 2 },
      inner_landscape: { title: 'Inner Landscape', icon: '🪞', order: 2 },
      underneath: { title: 'What Lies Beneath', icon: '🔍', order: 2 },
      others_inner_world: { title: "The Other's World", icon: '🌍', order: 3 },
      others_suffering: { title: "The Other's Suffering", icon: '🌍', order: 3 },
      complete_teaching_dharma: { title: 'Dharma Teaching', icon: '⚖️', order: 4 },
      clarity: { title: 'Clarity', icon: '💡', order: 4 },
      ego_illumination: { title: 'Ego Illumination', icon: '🔦', order: 5 },
      sacred_communication: { title: 'Sacred Communication', icon: '💬', order: 6 },
      path_forward: { title: 'Path Forward', icon: '🛤️', order: 6 },
      teaching_of_kshama: { title: 'Kshama - Forgiveness', icon: '🕊️', order: 7 },
      eternal_anchor: { title: 'Eternal Anchor', icon: '⚓', order: 8 },
      reminder: { title: 'Reminder', icon: '💫', order: 8 },
    },
    accentColor: 'rose',
  },
}

// Sanskrit terms to highlight with tooltips
const SANSKRIT_TERMS: Record<string, string> = {
  'phala-sakti': 'Attachment to fruits/outcomes',
  'nishkama karma': 'Desireless action - acting without attachment to results',
  'sakshi bhava': 'Witness consciousness - observing without identifying',
  'samatva': 'Equanimity - balanced state of mind',
  'drashtri': 'The Seer - the unchanging witness',
  'kutastha': 'The unchanging one - immovable like an anvil',
  'sankalpa': 'Sacred intention or resolve',
  'ishvara pranidhana': 'Surrender to the higher power',
  'yogastha': 'Established in yoga/union',
  'chitta-vritti': 'Mind modifications - thought waves',
  'manas': 'The thinking mind',
  'sthitaprajna': 'One of steady wisdom',
  'viveka': 'Discrimination - wisdom to discern',
  'prana': 'Life force energy / breath',
  'svadhyaya': 'Self-study - honest inner examination',
  'daya': 'Compassion - feeling with others',
  'karuna': 'Mercy - wishing freedom from suffering',
  'maitri': 'Loving-kindness',
  'sama-darshana': 'Equal vision - seeing same consciousness in all',
  'satya': 'Truth',
  'ahimsa': 'Non-harm / non-violence',
  'ahamkara': 'Ego-self - the "I-maker"',
  'tyaga': 'Sacred surrender / renunciation',
  'kshama': 'Forgiveness - releasing resentment',
  'priya vachana': 'Pleasant speech - truth spoken kindly',
  'atma-tripti': 'Self-contentment - inner completeness',
  'purnatva': 'Fullness / wholeness',
  'dharma': 'Right action / sacred duty',
}

function highlightSanskrit(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  // Sort terms by length (longest first) to avoid partial matches
  const sortedTerms = Object.keys(SANSKRIT_TERMS).sort((a, b) => b.length - a.length)

  while (remaining.length > 0) {
    let found = false

    for (const term of sortedTerms) {
      const lowerRemaining = remaining.toLowerCase()
      const index = lowerRemaining.indexOf(term.toLowerCase())

      if (index === 0) {
        // Found at start
        const originalTerm = remaining.slice(0, term.length)
        parts.push(
          <span
            key={key++}
            className="relative group cursor-help"
          >
            <span className="text-amber-300 font-medium italic border-b border-amber-300/30 border-dotted">
              {originalTerm}
            </span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/95 border border-amber-500/30 rounded-lg text-xs text-amber-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-lg shadow-amber-500/10">
              {SANSKRIT_TERMS[term]}
            </span>
          </span>
        )
        remaining = remaining.slice(term.length)
        found = true
        break
      } else if (index > 0) {
        // Found later, add text before it
        parts.push(<span key={key++}>{remaining.slice(0, index)}</span>)
        remaining = remaining.slice(index)
        found = true
        break
      }
    }

    if (!found) {
      // No Sanskrit terms found, add remaining text
      parts.push(<span key={key++}>{remaining}</span>)
      remaining = ''
    }
  }

  return parts
}

export default function WisdomResponseCard({
  tool,
  sections,
  fullResponse,
  gitaVersesUsed = 0,
  timestamp,
  language = 'en-IN',
}: WisdomResponseCardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [showFullText, setShowFullText] = useState(false)

  const config = SECTION_CONFIG[tool]
  const accentColorClass = {
    orange: {
      border: 'border-orange-500/20',
      bg: 'bg-orange-500/5',
      text: 'text-orange-100',
      accent: 'text-orange-300',
      badge: 'from-orange-500/20 to-amber-400/20 border-orange-400/30 text-orange-300',
      glow: 'shadow-orange-500/10',
      button: 'from-orange-400 via-[#ffb347] to-orange-200',
    },
    purple: {
      border: 'border-purple-500/20',
      bg: 'bg-purple-500/5',
      text: 'text-purple-100',
      accent: 'text-purple-300',
      badge: 'from-purple-500/20 to-indigo-400/20 border-purple-400/30 text-purple-300',
      glow: 'shadow-purple-500/10',
      button: 'from-purple-400 via-[#b347ff] to-purple-200',
    },
    rose: {
      border: 'border-rose-500/20',
      bg: 'bg-rose-500/5',
      text: 'text-rose-100',
      accent: 'text-rose-300',
      badge: 'from-rose-500/20 to-pink-400/20 border-rose-400/30 text-rose-300',
      glow: 'shadow-rose-500/10',
      button: 'from-rose-400 via-[#ff6b8a] to-rose-200',
    },
  }[config.accentColor]

  // Parse sections into ordered array
  const parsedSections: WisdomSection[] = Object.entries(sections)
    .map(([key, content]) => {
      const meta = config.sectionMeta[key as keyof typeof config.sectionMeta] || {
        title: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        icon: '📿',
        order: 99,
      }
      return {
        key,
        title: meta.title,
        content: content || '',
        icon: meta.icon,
        order: meta.order,
      }
    })
    .filter(s => s.content && s.content.trim().length > 0)
    .sort((a, b) => (a.order || 99) - (b.order || 99))

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedSections(new Set(parsedSections.map(s => s.key)))
  }

  const collapseAll = () => {
    setExpandedSections(new Set())
  }

  return (
    <div className={`rounded-2xl bg-black/60 ${accentColorClass.border} border p-5 shadow-inner ${accentColorClass.glow}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className={`font-semibold ${accentColorClass.accent}`}>
              {config.name}&apos;s Transmission
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {gitaVersesUsed > 0 && (
                <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${accentColorClass.badge} px-2.5 py-0.5 text-[10px] font-semibold border`}>
                  <span>🕉️</span>
                  <span>Gita Wisdom ({gitaVersesUsed} verses)</span>
                </span>
              )}
              <span className="text-[10px] text-gray-400">
                {new Date(timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <VoiceResponseButton
            text={fullResponse.replace(/\*\*/g, '')}
            language={language}
            size="sm"
            variant="accent"
          />
        </div>
      </div>

      {/* Section Controls */}
      {parsedSections.length > 1 && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={expandAll}
            className="text-[10px] px-2 py-1 rounded border border-gray-600/50 text-gray-400 hover:text-white hover:border-gray-500 transition"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-[10px] px-2 py-1 rounded border border-gray-600/50 text-gray-400 hover:text-white hover:border-gray-500 transition"
          >
            Collapse All
          </button>
          <button
            onClick={() => setShowFullText(!showFullText)}
            className={`text-[10px] px-2 py-1 rounded border transition ${
              showFullText
                ? 'border-amber-500/50 text-amber-300'
                : 'border-gray-600/50 text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            {showFullText ? 'Show Sections' : 'Full Text'}
          </button>
        </div>
      )}

      {/* Content */}
      {showFullText ? (
        /* Full Text View */
        <div className={`whitespace-pre-wrap text-sm ${accentColorClass.text} leading-relaxed`}>
          {highlightSanskrit(fullResponse)}
        </div>
      ) : (
        /* Sectioned View */
        <div className="space-y-3">
          {parsedSections.map((section, index) => {
            const isExpanded = expandedSections.has(section.key) || parsedSections.length <= 3
            const isPreview = !isExpanded && section.content.length > 200

            return (
              <div
                key={section.key}
                className={`rounded-xl ${accentColorClass.bg} border ${accentColorClass.border} overflow-hidden transition-all duration-300`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition text-left"
                >
                  <span className="text-lg">{section.icon}</span>
                  <span className={`font-medium ${accentColorClass.accent} flex-1`}>
                    {section.title}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </button>

                {/* Section Content */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className={`px-4 pb-4 text-sm ${accentColorClass.text} leading-relaxed`}>
                    {highlightSanskrit(section.content)}
                  </div>
                </div>

                {/* Preview (when collapsed) */}
                {isPreview && (
                  <div className={`px-4 pb-3 text-sm ${accentColorClass.text} opacity-60`}>
                    {section.content.slice(0, 150)}...
                    <span className={`ml-2 text-xs ${accentColorClass.accent}`}>
                      (click to expand)
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Sacred Closing */}
      <div className="mt-6 pt-4 border-t border-gray-700/50 text-center">
        <p className="text-xs text-gray-500 italic">
          🙏 This wisdom transmission draws from 5000 years of Bhagavad Gita teachings
        </p>
      </div>
    </div>
  )
}

// Sacred Loading Animation Component
export function WisdomLoadingState({ tool }: { tool: 'viyoga' | 'ardha' | 'relationship_compass' }) {
  const loadingMessages = {
    viyoga: [
      'Centering in Karma Yoga...',
      'Releasing attachment to outcomes...',
      'Channeling ancient wisdom...',
      'Preparing sacred transmission...',
    ],
    ardha: [
      'Stilling the mind...',
      'Accessing Sthitaprajna wisdom...',
      'Observing thought patterns...',
      'Preparing sacred transmission...',
    ],
    relationship_compass: [
      'Invoking Dharma wisdom...',
      'Cultivating Daya (compassion)...',
      'Seeking Sama-darshana (equal vision)...',
      'Preparing sacred transmission...',
    ],
  }

  const [messageIndex, setMessageIndex] = useState(0)
  const messages = loadingMessages[tool]

  // Cycle through messages
  useState(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length)
    }, 2000)
    return () => clearInterval(interval)
  })

  return (
    <div className="rounded-2xl bg-black/40 border border-amber-500/20 p-8 text-center">
      {/* Sacred Symbol Animation */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-amber-400/40 animate-pulse" />
        <div className="absolute inset-4 rounded-full border border-amber-300/50 animate-spin" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">
          🕉️
        </div>
      </div>

      {/* Loading Message */}
      <p className="text-amber-200 font-medium animate-pulse">
        {messages[messageIndex]}
      </p>
      <p className="text-xs text-amber-100/50 mt-2">
        Searching sacred verses for your situation...
      </p>

      {/* Progress dots */}
      <div className="flex justify-center gap-1 mt-4">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-amber-400/60 animate-bounce"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
