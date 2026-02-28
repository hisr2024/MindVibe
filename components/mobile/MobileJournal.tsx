'use client'

/**
 * Mobile Journal Component
 *
 * A mobile-optimized journal interface with voice input support.
 *
 * Features:
 * - Voice-to-text input
 * - Auto-save with offline support
 * - Tag suggestions
 * - Mood association
 * - Rich text formatting
 * - Haptic feedback
 *
 * @example
 * <MobileJournal onSave={handleSave} />
 */

import {
  forwardRef,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Save,
  X,
  Hash,
  Calendar,
  Sparkles,
  ChevronDown,
  Check,
  AlertCircle,
  Loader2,
  BookOpen,
} from 'lucide-react'

import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useKeyboardVisibility } from '@/hooks/useKeyboardVisibility'
import { useLanguage } from '@/hooks/useLanguage'
import { queueOfflineOperation } from '@/lib/offline/syncService'

// Predefined tags for quick selection
const SUGGESTED_TAGS = [
  { id: 'gratitude', label: 'Gratitude', emoji: '🙏' },
  { id: 'reflection', label: 'Reflection', emoji: '💭' },
  { id: 'growth', label: 'Growth', emoji: '🌱' },
  { id: 'challenge', label: 'Challenge', emoji: '💪' },
  { id: 'insight', label: 'Insight', emoji: '💡' },
  { id: 'peace', label: 'Peace', emoji: '☮️' },
  { id: 'wisdom', label: 'Wisdom', emoji: '📖' },
  { id: 'healing', label: 'Healing', emoji: '❤️‍🩹' },
]

// Mood options
const MOOD_OPTIONS = [
  { id: 'peaceful', emoji: '😌', label: 'Peaceful' },
  { id: 'grateful', emoji: '🥰', label: 'Grateful' },
  { id: 'hopeful', emoji: '🌟', label: 'Hopeful' },
  { id: 'thoughtful', emoji: '🤔', label: 'Thoughtful' },
  { id: 'anxious', emoji: '😰', label: 'Anxious' },
  { id: 'sad', emoji: '😢', label: 'Sad' },
]

export interface JournalEntry {
  id?: string
  title: string
  body: string
  tags: string[]
  mood?: string
  createdAt: string
  updatedAt: string
}

export interface MobileJournalProps {
  /** Initial entry data for editing */
  initialEntry?: Partial<JournalEntry>
  /** Save handler */
  onSave: (entry: JournalEntry) => Promise<void>
  /** Close/cancel handler */
  onClose?: () => void
  /** Show close button */
  showClose?: boolean
  /** Prefilled content from KIAAN or other sources */
  prefillContent?: string
  /** Custom className */
  className?: string
}

export const MobileJournal = forwardRef<HTMLDivElement, MobileJournalProps>(
  function MobileJournal(
    {
      initialEntry,
      onSave,
      onClose,
      showClose = true,
      prefillContent,
      className = '',
    },
    ref
  ) {
    const { triggerHaptic } = useHapticFeedback()
    const { isVisible: isKeyboardVisible, height: keyboardHeight } = useKeyboardVisibility()
    const { language } = useLanguage()

    const [title, setTitle] = useState(initialEntry?.title || '')
    const [body, setBody] = useState(initialEntry?.body || prefillContent || '')
    const [tags, setTags] = useState<string[]>(initialEntry?.tags || [])
    const [mood, setMood] = useState<string | undefined>(initialEntry?.mood)
    const [showTagSelector, setShowTagSelector] = useState(false)
    const [showMoodSelector, setShowMoodSelector] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const [customTag, setCustomTag] = useState('')

    const bodyRef = useRef<HTMLTextAreaElement>(null)
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout>>()

    // Voice input
    const {
      isListening,
      isSupported: voiceSupported,
      transcript,
      startListening,
      stopListening,
    } = useVoiceInput({
      language,
      onTranscript: (text, isFinal) => {
        if (isFinal) {
          setBody((prev) => prev + (prev ? ' ' : '') + text)
          triggerHaptic('selection')
        }
      },
    })

    // Auto-save to offline storage
    const handleAutoSave = useCallback(async () => {
      if (!body.trim()) return

      const entry: JournalEntry = {
        id: initialEntry?.id || `draft_${Date.now()}`,
        title: title || 'Untitled Reflection',
        body,
        tags,
        mood,
        createdAt: initialEntry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Queue for offline sync
      queueOfflineOperation(
        'journal',
        initialEntry?.id ? 'update' : 'create',
        entry.id as string,
        entry as unknown as Record<string, unknown>
      )

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, [body, title, tags, mood, initialEntry])

    // Auto-save debounced
    useEffect(() => {
      if (body.length > 10 && !isSaving) {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current)
        }

        autoSaveTimerRef.current = setTimeout(() => {
          handleAutoSave()
        }, 3000)
      }

      return () => {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current)
        }
      }
    }, [body, title, tags, mood, handleAutoSave, isSaving])

    // Save entry
    const handleSave = useCallback(async () => {
      if (!body.trim()) {
        triggerHaptic('warning')
        return
      }

      setIsSaving(true)
      setSaveStatus('saving')
      triggerHaptic('medium')

      try {
        const entry: JournalEntry = {
          id: initialEntry?.id,
          title: title || 'Untitled Reflection',
          body,
          tags,
          mood,
          createdAt: initialEntry?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        await onSave(entry)

        triggerHaptic('success')
        setSaveStatus('saved')
      } catch (error) {
        console.error('Failed to save journal entry:', error)
        triggerHaptic('error')
        setSaveStatus('error')
      } finally {
        setIsSaving(false)
      }
    }, [body, title, tags, mood, initialEntry, onSave, triggerHaptic])

    // Toggle tag
    const toggleTag = useCallback((tagId: string) => {
      triggerHaptic('selection')
      setTags((prev) =>
        prev.includes(tagId)
          ? prev.filter((t) => t !== tagId)
          : [...prev, tagId]
      )
    }, [triggerHaptic])

    // Add custom tag
    const addCustomTag = useCallback(() => {
      if (customTag.trim() && !tags.includes(customTag.trim().toLowerCase())) {
        triggerHaptic('selection')
        setTags((prev) => [...prev, customTag.trim().toLowerCase()])
        setCustomTag('')
      }
    }, [customTag, tags, triggerHaptic])

    // Toggle voice input
    const handleVoiceToggle = useCallback(() => {
      triggerHaptic('selection')
      if (isListening) {
        stopListening()
      } else {
        startListening()
      }
    }, [isListening, startListening, stopListening, triggerHaptic])

    // Format current date
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    return (
      <div
        ref={ref}
        className={`flex flex-col h-full bg-[#050507] ${className}`}
        style={{
          paddingBottom: isKeyboardVisible ? keyboardHeight : 0,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <span className="font-medium text-white">Sacred Reflection</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Save status */}
            <AnimatePresence mode="wait">
              {saveStatus === 'saving' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-xs text-slate-400"
                >
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </motion.div>
              )}
              {saveStatus === 'saved' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-xs text-green-400"
                >
                  <Check className="w-3 h-3" />
                  <span>Saved</span>
                </motion.div>
              )}
              {saveStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-xs text-red-400"
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>Error</span>
                </motion.div>
              )}
            </AnimatePresence>

            {showClose && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-400" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Date display */}
        <div className="px-4 py-2 flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3 h-3" />
          <span>{currentDate}</span>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto px-4">
          {/* Title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your reflection a title..."
            className="
              w-full py-3 text-xl font-semibold text-white
              bg-transparent border-none outline-none
              placeholder:text-slate-600
            "
          />

          {/* Body textarea */}
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What's on your mind today? Write freely..."
            className="
              w-full min-h-[200px] py-2 text-base text-slate-300
              bg-transparent border-none outline-none resize-none
              placeholder:text-slate-600 leading-relaxed
            "
            style={{ fontSize: '16px' }}
          />

          {/* Voice transcript indicator */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 py-2"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-red-500"
                />
                <span className="text-sm text-slate-400">Listening...</span>
                {transcript && (
                  <span className="text-sm text-white">{transcript}</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 py-3">
              {tags.map((tag) => {
                const tagData = SUGGESTED_TAGS.find((t) => t.id === tag)
                return (
                  <motion.button
                    key={tag}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleTag(tag)}
                    className="
                      flex items-center gap-1 px-3 py-1.5 rounded-full
                      bg-purple-500/20 border border-purple-500/30
                      text-xs text-purple-300
                    "
                  >
                    {tagData?.emoji && <span>{tagData.emoji}</span>}
                    <span>{tagData?.label || tag}</span>
                    <X className="w-3 h-3 ml-1" />
                  </motion.button>
                )
              })}
            </div>
          )}

          {/* Mood display */}
          {mood && (
            <div className="py-2">
              <button
                onClick={() => setShowMoodSelector(true)}
                className="
                  flex items-center gap-2 px-3 py-2 rounded-xl
                  bg-white/[0.04] border border-white/[0.08]
                "
              >
                <span className="text-lg">
                  {MOOD_OPTIONS.find((m) => m.id === mood)?.emoji}
                </span>
                <span className="text-sm text-slate-300">
                  Feeling {MOOD_OPTIONS.find((m) => m.id === mood)?.label}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-500 ml-auto" />
              </button>
            </div>
          )}
        </div>

        {/* Tag selector sheet */}
        <AnimatePresence>
          {showTagSelector && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowTagSelector(false)}
                className="fixed inset-0 bg-black/60 z-40"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="
                  fixed bottom-0 left-0 right-0 z-50
                  bg-[#1a1a1f] rounded-t-3xl
                  p-4 pb-safe-bottom
                "
              >
                <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-4">Add Tags</h3>

                {/* Custom tag input */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                    placeholder="Add custom tag..."
                    className="
                      flex-1 px-4 py-2 rounded-xl
                      bg-white/[0.06] border border-white/[0.08]
                      text-white text-sm
                      placeholder:text-slate-500
                      outline-none focus:border-purple-500/40
                    "
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={addCustomTag}
                    disabled={!customTag.trim()}
                    className="
                      px-4 py-2 rounded-xl
                      bg-purple-500/20 border border-purple-500/30
                      text-purple-300 text-sm
                      disabled:opacity-50
                    "
                  >
                    Add
                  </motion.button>
                </div>

                {/* Suggested tags */}
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_TAGS.map((tag) => {
                    const isSelected = tags.includes(tag.id)
                    return (
                      <motion.button
                        key={tag.id}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleTag(tag.id)}
                        className={`
                          flex items-center gap-1 px-3 py-2 rounded-xl
                          text-sm transition-all
                          ${isSelected
                            ? 'bg-purple-500/30 border border-purple-500/50 text-purple-200'
                            : 'bg-white/[0.04] border border-white/[0.08] text-slate-300'
                          }
                        `}
                      >
                        <span>{tag.emoji}</span>
                        <span>{tag.label}</span>
                        {isSelected && <Check className="w-3 h-3 ml-1" />}
                      </motion.button>
                    )
                  })}
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTagSelector(false)}
                  className="
                    w-full mt-4 py-3 rounded-xl
                    bg-white/[0.08] text-white font-medium
                  "
                >
                  Done
                </motion.button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mood selector sheet */}
        <AnimatePresence>
          {showMoodSelector && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMoodSelector(false)}
                className="fixed inset-0 bg-black/60 z-40"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="
                  fixed bottom-0 left-0 right-0 z-50
                  bg-[#1a1a1f] rounded-t-3xl
                  p-4 pb-safe-bottom
                "
              >
                <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-4">How are you feeling?</h3>

                <div className="grid grid-cols-3 gap-3">
                  {MOOD_OPTIONS.map((option) => {
                    const isSelected = mood === option.id
                    return (
                      <motion.button
                        key={option.id}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          triggerHaptic('selection')
                          setMood(option.id)
                          setShowMoodSelector(false)
                        }}
                        className={`
                          flex flex-col items-center gap-1 py-4 rounded-xl
                          transition-all
                          ${isSelected
                            ? 'bg-[#d4a44c]/20 border border-[#d4a44c]/40'
                            : 'bg-white/[0.04] border border-white/[0.08]'
                          }
                        `}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <span className={`text-xs ${isSelected ? 'text-[#e8b54a]' : 'text-slate-400'}`}>
                          {option.label}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>

                {mood && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setMood(undefined)
                      setShowMoodSelector(false)
                    }}
                    className="
                      w-full mt-4 py-3 rounded-xl
                      bg-white/[0.04] text-slate-400 text-sm
                    "
                  >
                    Clear mood
                  </motion.button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Bottom toolbar */}
        <div className="
          px-4 py-3
          bg-[#050507]/95 backdrop-blur-xl
          border-t border-white/[0.06]
        ">
          <div className="flex items-center justify-between">
            {/* Tools */}
            <div className="flex items-center gap-2">
              {/* Voice input */}
              {voiceSupported && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleVoiceToggle}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${isListening
                      ? 'bg-red-500 text-white'
                      : 'bg-white/[0.06] text-slate-400'
                    }
                  `}
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </motion.button>
              )}

              {/* Tags */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowTagSelector(true)}
                className="
                  w-10 h-10 rounded-full flex items-center justify-center
                  bg-white/[0.06] text-slate-400
                "
              >
                <Hash className="w-5 h-5" />
              </motion.button>

              {/* Mood */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowMoodSelector(true)}
                className="
                  w-10 h-10 rounded-full flex items-center justify-center
                  bg-white/[0.06] text-slate-400
                "
              >
                {mood ? (
                  <span className="text-lg">{MOOD_OPTIONS.find((m) => m.id === mood)?.emoji}</span>
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
              </motion.button>
            </div>

            {/* Save button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={!body.trim() || isSaving}
              className="
                px-6 py-2.5 rounded-xl
                bg-gradient-to-r from-purple-500 to-pink-500
                text-white font-medium text-sm
                shadow-lg shadow-purple-500/30
                disabled:opacity-50
                flex items-center gap-2
              "
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save</span>
            </motion.button>
          </div>

          {/* Safe area */}
          <div className="h-[env(safe-area-inset-bottom,0px)]" />
        </div>
      </div>
    )
  }
)

export default MobileJournal
