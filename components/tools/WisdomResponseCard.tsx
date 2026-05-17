'use client'

import { useState, useEffect, useMemo } from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
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
  order?: number
}

interface SectionMeta {
  title: string
  icon: string
  order: number
}

type AnalysisMode = 'quick' | 'deep' | 'quantum'

interface SourceRef {
  file: string
  reference?: string
}

interface WisdomResponseCardProps {
  tool: 'viyoga' | 'ardha' | 'relationship_compass'
  sections: Record<string, string>
  fullResponse: string
  gitaVersesUsed?: number
  timestamp: string
  language?: string
  analysisMode?: AnalysisMode
  citations?: { source_file: string; reference_if_any?: string; chunk_id: string }[]
  sources?: SourceRef[]
  secularMode?: boolean  // If true, hide spiritual references in UI
}

// Section configurations for each tool
const SECTION_CONFIG = {
  viyoga: {
    icon: '🎯',
    name: 'Viyoga',
    sectionMeta: {
      // Secular/Modern sections (default mode)
      'I Get It': { title: 'I Get It', icon: '💚', order: 1 },
      i_get_it: { title: 'I Get It', icon: '💚', order: 1 },
      "What's Really Going On": { title: "What's Really Going On", icon: '💡', order: 2 },
      whats_really_going_on: { title: "What's Really Going On", icon: '💡', order: 2 },
      what_s_really_going_on: { title: "What's Really Going On", icon: '💡', order: 2 },
      'A Different Way to See This': { title: 'A Different Way to See This', icon: '🔄', order: 3 },
      a_different_way_to_see_this: { title: 'A Different Way to See This', icon: '🔄', order: 3 },
      'Try This Right Now': { title: 'Try This Right Now', icon: '⏱️', order: 4 },
      try_this_right_now: { title: 'Try This Right Now', icon: '⏱️', order: 4 },
      'One Thing You Can Do': { title: 'One Thing You Can Do', icon: '✨', order: 5 },
      one_thing_you_can_do: { title: 'One Thing You Can Do', icon: '✨', order: 5 },
      'Something to Consider': { title: 'Something to Consider', icon: '💭', order: 6 },
      something_to_consider: { title: 'Something to Consider', icon: '💭', order: 6 },
      // Legacy/Gita sections (for backwards compatibility)
      sacred_recognition: { title: 'Sacred Recognition', icon: '🙏', order: 1 },
      anatomy_of_attachment: { title: 'Anatomy of Attachment', icon: '🔗', order: 2 },
      gita_core_transmission: { title: 'Gita Core Transmission', icon: '🕉️', order: 3 },
      sakshi_practice_60s: { title: 'Sakshi Practice (60s)', icon: '👁️', order: 4 },
      karma_yoga_step_today: { title: 'Karma Yoga Step (Today)', icon: '⚡', order: 5 },
      one_question: { title: 'One Question', icon: '❓', order: 6 },
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
      // ARDHA 5-pillar framework (primary — these match the actual AI response headings)
      atma_distinction: { title: 'Atma Distinction', icon: '👁️', order: 1 },
      ragadvesha_scan: { title: 'Raga-Dvesha Scan', icon: '🔗', order: 2 },
      dharma_alignment: { title: 'Dharma Alignment', icon: '⚖️', order: 3 },
      hrdaya_samatvam: { title: 'Hrdaya Samatvam', icon: '🧘', order: 4 },
      arpana: { title: 'Arpana', icon: '🙏', order: 5 },
      gita_verse: { title: 'Gita Verse', icon: '📜', order: 6 },
      compliance_check: { title: 'Compliance Check', icon: '✅', order: 7 },
      // Legacy section keys (backward compatibility)
      distortion_detection: { title: 'Distortion Detection', icon: '🔍', order: 1 },
      emotional_precision: { title: 'Emotional Precision', icon: '🎯', order: 2 },
      mechanism_insight: { title: 'Mechanism Insight', icon: '🧠', order: 3 },
      gitaaligned_truth: { title: 'Gita-Aligned Truth', icon: '📜', order: 4 },
      calibration_layer: { title: 'Calibration Layer', icon: '⚖️', order: 5 },
      disciplined_action: { title: 'Disciplined Action', icon: '🎯', order: 6 },
      reflective_question: { title: 'Reflective Question', icon: '❓', order: 7 },
    },
    accentColor: 'purple',
  },
  relationship_compass: {
    icon: '🧭',
    name: 'Relationship Compass',
    sectionMeta: {
      // ═══ 5-Step Gita Framework (PRIMARY — strict adherence) ═══
      'Step 1: Pause Before Reacting': { title: 'Step 1: Pause Before Reacting', icon: '🌿', order: 1 },
      'Step 2: Identify the Attachment': { title: 'Step 2: Identify the Attachment', icon: '🔥', order: 2 },
      'Step 3: Regulate Before You Communicate': { title: 'Step 3: Regulate', icon: '🧘', order: 3 },
      'Step 4: Speak Without Demanding an Outcome': { title: 'Step 4: Speak (Karma Yoga)', icon: '🕊️', order: 4 },
      'Step 5: See Their Humanity': { title: 'Step 5: See Their Humanity', icon: '👁️', order: 5 },
      'What This Looks Like in Practice': { title: 'What This Looks Like', icon: '📱', order: 6 },
      'The Real Test': { title: 'The Real Test', icon: '💎', order: 7 },
      // ═══ Unified Clarity / Engine sections (legacy emotional precision format) ═══
      'Emotional Precision': { title: 'Emotional Precision', icon: '💜', order: 1 },
      "What's Really Going On": { title: "What's Really Going On", icon: '💡', order: 2 },
      "What's Actually Happening": { title: "What's Actually Happening", icon: '💡', order: 2 },
      'The Deeper Insight': { title: 'The Deeper Insight', icon: '🤝', order: 3 },
      'The Hard Truth': { title: 'The Hard Truth', icon: '✨', order: 4 },
      'What To Do': { title: 'What To Do', icon: '👣', order: 5 },
      'Script': { title: 'Script', icon: '💬', order: 6 },
      // ═══ Wisdom-infused sections (legacy) ═══
      'I Hear You': { title: 'I Hear You', icon: '💜', order: 1 },
      'What Might Be Happening': { title: 'What Might Be Happening', icon: '💡', order: 2 },
      'The Other Side': { title: 'The Other Side', icon: '🤝', order: 3 },
      'What You Could Try': { title: 'What You Could Try', icon: '✨', order: 4 },
      'A Way to Say It': { title: 'A Way to Say It', icon: '💬', order: 5 },
      'Gita Wisdom': { title: 'Gita Wisdom', icon: '🙏', order: 6 },
      'One Small Step': { title: 'One Small Step', icon: '👣', order: 7 },
      'Let Me Understand Better': { title: 'Let Me Understand Better', icon: '❓', order: 8 },
      // ═══ Legacy/Gita sections (backward compatibility) ═══
      'Sacred Acknowledgement': { title: 'Sacred Acknowledgement', icon: '🙏', order: 1 },
      'Inner Conflict Mirror': { title: 'Inner Conflict Mirror', icon: '🪞', order: 2 },
      'Gita Teachings Used': { title: 'Gita Teachings Used', icon: '📜', order: 3 },
      'Dharma Options': { title: 'Dharma Options', icon: '⚖️', order: 4 },
      'Sacred Speech': { title: 'Sacred Speech', icon: '🗣️', order: 5 },
      'Detachment Anchor': { title: 'Detachment Anchor', icon: '⚓', order: 6 },
      'One Next Step': { title: 'One Next Step', icon: '🪷', order: 7 },
      'One Gentle Question': { title: 'One Gentle Question', icon: '❓', order: 8 },
      'What I Need From the Gita Repository': { title: 'What I Need From the Gita Repository', icon: '📚', order: 9 },
      Citations: { title: 'Citations', icon: '🔖', order: 10 },
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
  // Additional terms for deep dive & quantum dive
  'samskara': 'Deep impressions - mental patterns from past experiences',
  'tapas': 'Purifying fire - transformation through challenge',
  'atman': 'The eternal self - unchanging essence',
  'rasa': 'Emotional essence - the flavor of experience',
  'sharira': 'The body - physical vessel',
  'sangha': 'Community - connection to others',
  'karma yoga': 'Path of selfless action',
  'vritti': 'Thought wave - mental fluctuation',
  'samatvam': 'Equanimity in all situations',
}

// Analysis mode display names and badges
const ANALYSIS_MODE_DISPLAY: Record<AnalysisMode, { name: string; icon: string; color: string }> = {
  quick: { name: 'Quick Reframe', icon: '⚡', color: 'from-blue-500/20 to-cyan-400/20 border-blue-400/30 text-blue-300' },
  deep: { name: 'Deep Dive', icon: '🔍', color: 'from-indigo-500/20 to-violet-400/20 border-indigo-400/30 text-indigo-300' },
  quantum: { name: 'Quantum Dive', icon: '🌌', color: 'from-purple-500/20 to-pink-400/20 border-purple-400/30 text-purple-300' },
}

// Pre-sorted at module level to avoid re-sorting on every call
const SORTED_SANSKRIT_TERMS = Object.keys(SANSKRIT_TERMS).sort((a, b) => b.length - a.length)

function highlightSanskrit(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  const sortedTerms = SORTED_SANSKRIT_TERMS

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
            <span className="text-[#e8b54a] font-medium italic border-b border-[#e8b54a]/30 border-dotted">
              {originalTerm}
            </span>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/95 border border-[#d4a44c]/30 rounded-lg text-xs text-[#f5f0e8] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-lg shadow-[#d4a44c]/10">
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
  analysisMode = 'quick',
  citations: _citations = [],
  sources: _sources = [],
  secularMode = false,
}: WisdomResponseCardProps) {
  const [showFullText, setShowFullText] = useState(false)
  const [copyLabel, setCopyLabel] = useState('Copy')

  const config = SECTION_CONFIG[tool]
  const accentColorMap = {
    orange: {
      border: 'border-[#d4a44c]/20',
      bg: 'bg-[#d4a44c]/5',
      text: 'text-[#f5f0e8]',
      accent: 'text-[#e8b54a]',
      badge: 'from-[#d4a44c]/20 to-[#d4a44c]/20 border-[#d4a44c]/30 text-[#e8b54a]',
      glow: 'shadow-[#d4a44c]/10',
      button: 'from-[#d4a44c] via-[#ffb347] to-[#e8b54a]',
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
  }
  const accentColorClass = accentColorMap[config.accentColor as keyof typeof accentColorMap] || accentColorMap.orange

  // Parse sections into ordered array (memoized to avoid re-computation)
  const parsedSections: WisdomSection[] = useMemo(() => {
    const sectionMeta = config.sectionMeta as Record<string, SectionMeta>
    return Object.entries(sections)
      .map(([key, content]) => {
        const meta: SectionMeta = sectionMeta[key] || {
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
  }, [sections, config.sectionMeta])

  // Expand first 2 sections by default (or all if 3 or fewer).
  // Re-sync when sections change (e.g. new API response).
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  useEffect(() => {
    setExpandedSections(
      parsedSections.length <= 3
        ? parsedSections.map(s => s.key)
        : parsedSections.slice(0, 2).map(s => s.key)
    )
  }, [parsedSections])

  // Memoize expensive Sanskrit highlighting to avoid O(n*m) on every render
  const highlightedFullResponse = useMemo(
    () => secularMode ? fullResponse : highlightSanskrit(fullResponse),
    [fullResponse, secularMode]
  )

  const highlightedSections = useMemo(
    () => parsedSections.map(s => ({
      ...s,
      highlighted: secularMode ? s.content : highlightSanskrit(s.content),
    })),
    [parsedSections, secularMode]
  )

  const expandAll = () => {
    setExpandedSections(parsedSections.map(s => s.key))
  }

  const collapseAll = () => {
    setExpandedSections([])
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullResponse)
      setCopyLabel('Copied')
      window.setTimeout(() => setCopyLabel('Copy'), 1500)
    } catch {
      setCopyLabel('Copy failed')
      window.setTimeout(() => setCopyLabel('Copy'), 1500)
    }
  }

  return (
    <div className={`rounded-2xl bg-black/60 ${accentColorClass.border} border p-5 md:p-6 shadow-inner ${accentColorClass.glow}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className={`font-semibold ${accentColorClass.accent}`}>
              {config.name}&apos;s {tool === 'ardha' ? 'Reframe' : 'Transmission'}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {/* Analysis Mode Badge (for Ardha) */}
              {tool === 'ardha' && analysisMode && ANALYSIS_MODE_DISPLAY[analysisMode] && (
                <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${ANALYSIS_MODE_DISPLAY[analysisMode].color} px-2.5 py-0.5 text-[10px] font-semibold border`}>
                  <span>{ANALYSIS_MODE_DISPLAY[analysisMode].icon}</span>
                  <span>{ANALYSIS_MODE_DISPLAY[analysisMode].name}</span>
                </span>
              )}
              {gitaVersesUsed > 0 && !secularMode && (
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
          <button
            onClick={handleCopy}
            className="text-[10px] px-2 py-1 rounded border border-gray-600/50 text-gray-400 hover:text-white hover:border-gray-500 transition"
          >
            {copyLabel}
          </button>
          <VoiceResponseButton
            text={fullResponse.replace(/\*\*/g, '')}
            language={language}
            size="sm"
            variant="accent"
          />
        </div>
      </div>

      {/* Section Controls - only show when we have sections */}
      {parsedSections.length > 1 && !showFullText && (
        <div className="flex items-center gap-2 mb-5">
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
                ? 'border-[#d4a44c]/50 text-[#e8b54a]'
                : 'border-gray-600/50 text-gray-400 hover:text-white hover:border-gray-500'
            }`}
          >
            {showFullText ? 'Show Sections' : 'Full Text'}
          </button>
        </div>
      )}

      {/* Content */}
      {showFullText || parsedSections.length === 0 ? (
        /* Full Text View - also shown when no sections parsed */
        <div className={`whitespace-pre-wrap text-sm ${accentColorClass.text} leading-relaxed max-w-[65ch]`}>
          {highlightedFullResponse}
        </div>
      ) : (
        /* Sectioned View — Radix Accordion for a11y */
        <AccordionPrimitive.Root
          type="multiple"
          value={expandedSections}
          onValueChange={setExpandedSections}
          className="space-y-4"
        >
          {highlightedSections.map((section) => (
            <AccordionPrimitive.Item
              key={section.key}
              value={section.key}
              className={`rounded-xl ${accentColorClass.bg} border ${accentColorClass.border} overflow-hidden`}
            >
              <AccordionPrimitive.Header>
                <AccordionPrimitive.Trigger
                  className="group w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  <span className="text-lg" aria-hidden="true">{section.icon}</span>
                  <span className={`font-medium ${accentColorClass.accent} flex-1`}>
                    {section.title}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-gray-500 transition-transform motion-reduce:transition-none group-data-[state=open]:rotate-180"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                {/* Subtle separator between trigger and content */}
                <div className={`mx-4 border-t ${accentColorClass.border}`} />
                <div className={`px-4 pt-3 pb-4 text-sm ${accentColorClass.text} leading-[1.75] max-w-[65ch]`}>
                  {section.highlighted}
                </div>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          ))}
        </AccordionPrimitive.Root>
      )}


      {/* Closing */}
      <div className="mt-8 pt-4 border-t border-gray-700/50 text-center">
        <p className="text-xs text-gray-500 italic">
          💙 Here to help you navigate this with clarity and compassion
        </p>
      </div>
    </div>
  )
}

// Loading Animation Component
export function WisdomLoadingState({ tool, secularMode = true }: { tool: 'viyoga' | 'ardha' | 'relationship_compass'; secularMode?: boolean }) {
  const loadingMessages = {
    viyoga: [
      'Taking a moment to understand...',
      'Thinking about what might help...',
      'Finding a helpful perspective...',
      'Preparing thoughtful guidance...',
    ],
    ardha: [
      'Detecting distortion patterns...',
      'Calibrating story vs fact...',
      'Aligning Gita principles...',
      'Preparing reframe...',
    ],
    relationship_compass: [
      'Understanding your situation through Gita wisdom...',
      'Analyzing the root attachment...',
      'Crafting your 5-step Gita guidance...',
      'Preparing your real-world practice...',
    ],
  }

  const [messageIndex, setMessageIndex] = useState(0)
  const messages = loadingMessages[tool]

  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [messages.length])

  // Use secular styling for viyoga and relationship_compass
  const useSecularStyle = secularMode && (tool === 'viyoga' || tool === 'relationship_compass')
  const symbol = useSecularStyle ? '💚' : '🕉️'
  const subtitleText = useSecularStyle
    ? 'Finding the right words for your situation...'
    : 'Searching sacred verses for your situation...'

  return (
    <div className="rounded-2xl bg-black/40 border border-[#d4a44c]/20 p-8 text-center">
      {/* Symbol Animation */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-2 border-[#d4a44c]/30 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-[#d4a44c]/40 animate-pulse" />
        <div className="absolute inset-4 rounded-full border border-[#e8b54a]/50 animate-spin" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">
          {symbol}
        </div>
      </div>

      {/* Loading Message */}
      <p className="text-[#f0c96d] font-medium animate-pulse">
        {messages[messageIndex]}
      </p>
      <p className="text-xs text-[#f5f0e8]/70 mt-2">
        {subtitleText}
      </p>

      {/* Progress dots */}
      <div className="flex justify-center gap-1 mt-4">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#d4a44c]/60 animate-bounce"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
