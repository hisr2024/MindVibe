'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useKeyboardVisibility } from '@/hooks/useKeyboardVisibility'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useJournalEditor } from '@/hooks/useJournalEditor'
import { MOOD_OPTIONS, findMood } from '../constants'
import { MoodPill } from '../MoodPill'
import { SacredTextarea } from '../SacredTextarea'
import { TagPicker } from '../TagPicker'
import { AutoSaveIndicator } from '../AutoSaveIndicator'
import { KIAANPromptBanner } from '../KIAANPromptBanner'

export default function EditorTab() {
  const { triggerHaptic } = useHapticFeedback()
  const { isVisible: keyboardVisible, height: keyboardHeight } = useKeyboardVisibility()
  const { isListening, transcript, startListening, stopListening } = useVoiceInput({
    language: 'en-US',
  })

  const {
    title,
    setTitle,
    content,
    setContent,
    mood,
    setMood,
    tags,
    toggleTag,
    wordCount,
    saveState,
    saveEntry,
    kiaanPrompt,
  } = useJournalEditor()

  const lastTranscriptRef = useRef('')
  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current) {
      const added = transcript.slice(lastTranscriptRef.current.length)
      lastTranscriptRef.current = transcript
      if (added.trim()) {
        setContent((prev) => (prev ? `${prev} ${added.trim()}` : added.trim()))
      }
    }
  }, [transcript, setContent])

  const handleVoiceTap = () => {
    triggerHaptic('light')
    if (isListening) {
      stopListening()
    } else {
      lastTranscriptRef.current = ''
      startListening()
    }
  }

  const handleSave = async () => {
    triggerHaptic('medium')
    try {
      await saveEntry()
      triggerHaptic('success')
    } catch {
      triggerHaptic('error')
    }
  }

  const selectedMood = findMood(mood)
  const canSave = content.trim().length > 0 && saveState !== 'saving'

  return (
    <div
      style={{
        background: '#050714',
        minHeight: '100%',
        paddingBottom: keyboardVisible
          ? keyboardHeight
          : 'calc(env(safe-area-inset-bottom, 24px) + 24px)',
        transition: 'padding-bottom 0.3s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 18,
              fontStyle: 'italic',
              color: '#EDE8DC',
            }}
          >
            Sacred Reflection
          </div>
          <div
            style={{
              fontFamily: '"Noto Sans Devanagari", sans-serif',
              fontSize: 11,
              color: '#D4A017',
              marginTop: 1,
              lineHeight: 1.5,
            }}
          >
            आत्म-चिंतन
          </div>
        </div>
        <AutoSaveIndicator state={saveState} />
      </div>

      {kiaanPrompt && <KIAANPromptBanner prompt={kiaanPrompt} />}

      <div style={{ padding: '10px 16px 0' }}>
        <div
          style={{
            fontSize: 9,
            color: '#D4A017',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          How do you feel?
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label="Mood"
        className="scroll-x"
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 14px 12px',
          overflowX: 'auto',
        }}
      >
        {MOOD_OPTIONS.map((m) => (
          <MoodPill
            key={m.id}
            mood={m}
            isSelected={mood === m.id}
            onSelect={() => {
              triggerHaptic('light')
              setMood(m.id)
            }}
          />
        ))}
      </div>

      <div
        style={{
          padding: '0 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give this reflection a title…"
          aria-label="Reflection title"
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: 22,
            fontWeight: 300,
            fontStyle: 'italic',
            color: '#EDE8DC',
            outline: 'none',
            padding: '4px 0',
          }}
        />

        <div
          style={{
            height: 1,
            background:
              'linear-gradient(90deg,transparent,rgba(212,160,23,0.4) 30%,rgba(212,160,23,0.6) 50%,rgba(212,160,23,0.4) 70%,transparent)',
          }}
        />

        <SacredTextarea
          value={content}
          onChange={setContent}
          wordCount={wordCount}
          isRecording={isListening}
          onVoiceTap={handleVoiceTap}
          mood={selectedMood}
        />

        <TagPicker
          selectedTags={tags}
          onToggle={(tag) => {
            triggerHaptic('light')
            toggleTag(tag)
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '8px 12px',
            background: 'rgba(27,79,187,0.06)',
            border: '1px solid rgba(27,79,187,0.15)',
            borderRadius: 10,
            fontSize: 10,
            color: '#B8AE98',
            fontFamily: 'Outfit, sans-serif',
          }}
        >
          <span>🔒</span>
          <span>Encrypted end-to-end · Only mood and tags are visible to KIAAN</span>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={!canSave}
          aria-busy={saveState === 'saving'}
          style={{
            width: '100%',
            height: 54,
            borderRadius: 27,
            background: 'linear-gradient(135deg, #1B4FBB, #0E7490)',
            border: '1px solid rgba(212,160,23,0.4)',
            color: '#F8F6F0',
            fontFamily: 'Outfit, sans-serif',
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: '0.04em',
            cursor: canSave ? 'pointer' : 'not-allowed',
            opacity: canSave ? 1 : 0.55,
            touchAction: 'manipulation',
          }}
        >
          {saveState === 'saving' ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span style={{ animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>
                ॐ
              </span>
              Sealing your reflection…
            </span>
          ) : (
            'Offer This Reflection ✦'
          )}
        </motion.button>

        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}
