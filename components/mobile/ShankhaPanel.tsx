'use client'

/**
 * ShankhaPanel — Conversation panel for the KIAAN Voice Companion.
 * Shows message history, tool suggestions, interim transcript, and text input.
 * Positioned above the Shankha FAB, slides up with spring animation.
 */

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ShankhaIcon } from '@/components/icons/ShankhaIcon'
import type { ToolSuggestion } from '@/utils/voice/ecosystemNavigator'

// ─── Types ──────────────────────────────────────────────────────────────────

interface CompanionMessage {
  id: string
  role: 'user' | 'companion'
  content: string
  mood?: string
  wisdomUsed?: { principle: string; verse_ref: string } | null
}

type HandsFreeState = 'idle' | 'hearing' | 'processing'

interface ShankhaPanelProps {
  isListening: boolean
  isResponding: boolean
  isProcessing: boolean
  isTTSSpeaking: boolean
  messages: CompanionMessage[]
  inputText: string
  interimTranscript: string
  handsFreeState: HandsFreeState
  vadSupported: boolean
  toolSuggestion: ToolSuggestion | null
  error: string | null
  onInputChange: (text: string) => void
  onSubmit: () => void
  onVoiceActivate: () => void
  onClose: () => void
  onCancelAutoCollapse: () => void
}

// ─── Quick Tool Links ───────────────────────────────────────────────────────

const TOOL_LINKS = [
  { id: 'viyoga', icon: '🕉️', label: 'Viyoga', href: '/m/viyog' },
  { id: 'ardha', icon: '📿', label: 'Ardha', href: '/m/ardha' },
  { id: 'kiaan-chat', icon: '🧘', label: 'Chat', href: '/m/kiaan' },
  { id: 'compass', icon: '🕊️', label: 'Compass', href: '/m/relationship-compass' },
] as const

// ─── Component ──────────────────────────────────────────────────────────────

export function ShankhaPanel({
  isListening,
  isResponding,
  isProcessing,
  isTTSSpeaking,
  messages,
  inputText,
  interimTranscript,
  handsFreeState,
  vadSupported,
  toolSuggestion,
  error,
  onInputChange,
  onSubmit,
  onVoiceActivate,
  onClose,
  onCancelAutoCollapse,
}: ShankhaPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when responding
  useEffect(() => {
    if (isResponding && inputRef.current) inputRef.current.focus()
  }, [isResponding])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  const lastCompanionMessage = [...messages].reverse().find(m => m.role === 'companion')

  const statusText = isListening && handsFreeState === 'hearing'
    ? 'Hearing you...'
    : isListening
    ? 'Listening...'
    : isTTSSpeaking
    ? 'Speaking...'
    : isProcessing
    ? 'Thinking...'
    : 'Voice Companion'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className="mb-3 w-[320px] max-h-[420px] overflow-hidden rounded-3xl border border-[#D4A017]/20"
      style={{
        background: 'linear-gradient(to bottom, rgba(11,14,42,0.98), rgba(8,8,8,0.95), rgba(5,5,7,0.98))',
        boxShadow: '0 -8px 32px rgba(5,7,20,0.8), 0 0 0 1px rgba(212,160,23,0.05)',
        backdropFilter: 'blur(24px)',
        borderRadius: '24px 24px 24px 8px',
      }}
      onClick={onCancelAutoCollapse}
    >
      {/* Top glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4A017]/40 to-transparent rounded-t-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <ShankhaIcon
            size={18}
            color="#D4A017"
            filled={isListening || isTTSSpeaking}
            className={isTTSSpeaking ? 'animate-pulse' : ''}
          />
          <div>
            <h3 className="text-sm font-semibold text-[#EDE8DC] font-[family-name:var(--font-divine)]">KIAAN</h3>
            <p className="text-[10px] text-[#B8AE98]">{statusText}</p>
          </div>
        </div>
        <motion.button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 text-[#B8AE98] hover:bg-white/10 transition-colors"
          whileTap={{ scale: 0.9 }}
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      </div>

      {/* Messages / Transcript */}
      <div className="max-h-[200px] overflow-y-auto px-4 py-3 space-y-2.5">
        {/* Listening state */}
        {isListening && (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-1.5 mb-3">
              {[0, 1, 2, 3, 4].map(i => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full"
                  style={{ background: 'linear-gradient(to top, #D4A017, #06B6D4)' }}
                  animate={{ height: handsFreeState === 'hearing' ? [8, 22, 10, 24, 8] : [4, 8, 4, 8, 4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
                />
              ))}
            </div>
            {interimTranscript ? (
              <p className="text-sm text-[#EDE8DC]/90 italic font-[family-name:var(--font-ui)]">
                &ldquo;{interimTranscript}&rdquo;
              </p>
            ) : (
              <p className="text-xs text-[#6B6355]">
                {vadSupported ? "Speak now... I'm listening" : 'Speak now...'}
              </p>
            )}
          </div>
        )}

        {/* Message bubbles */}
        {isResponding && messages.slice(-4).map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-[#1B4FBB] to-[#0E7490] text-white rounded-br-sm'
                  : 'bg-[rgba(22,26,66,0.8)] text-[#EDE8DC] border border-[#D4A017]/10 rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap break-words leading-relaxed font-[family-name:var(--font-ui)]">{msg.content}</p>
              {msg.role === 'companion' && msg.wisdomUsed && (
                <p className="text-[9px] text-[#D4A017] mt-1 text-right">
                  — BG {msg.wisdomUsed.verse_ref}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Processing dots */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-[rgba(22,26,66,0.8)] rounded-2xl px-4 py-2.5 border border-[#D4A017]/10">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-[#D4A017]/60 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-400/80 text-center">{error}</p>}
        <div ref={messagesEndRef} />
      </div>

      {/* Tool suggestion */}
      {toolSuggestion && isResponding && (
        <div className="border-t border-white/5 px-4 py-2">
          <Link
            href={toolSuggestion.tool?.route || `/m/tools`}
            onClick={onClose}
            className="group flex items-center gap-2 rounded-xl border border-[#D4A017]/15 bg-gradient-to-r from-[#D4A017]/10 to-transparent px-3 py-2 transition-all hover:border-[#D4A017]/30"
          >
            <span className="text-base">{toolSuggestion.tool?.icon || '✨'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#EDE8DC] truncate">{toolSuggestion.tool?.name || 'Suggested Tool'}</p>
              <p className="text-[10px] text-[#6B6355] truncate">{toolSuggestion.reason || 'May help with what you shared'}</p>
            </div>
            <svg className="w-3.5 h-3.5 text-[#D4A017]/40 group-hover:text-[#D4A017]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* Quick tools row */}
      {isResponding && !toolSuggestion && (
        <div className="border-t border-white/5 px-3 py-2">
          <div className="flex items-center gap-1">
            {TOOL_LINKS.map(tool => (
              <Link
                key={tool.id}
                href={tool.href}
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/[0.02] px-1.5 py-1.5 text-[10px] text-[#B8AE98] hover:bg-white/[0.05] transition-all"
              >
                <span className="text-xs">{tool.icon}</span>
                <span className="truncate">{tool.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Text input */}
      {isResponding && (
        <div className="border-t border-white/5 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => { onInputChange(e.target.value); onCancelAutoCollapse() }}
              onKeyDown={handleKeyDown}
              placeholder="Ask KIAAN anything..."
              className="flex-1 bg-[rgba(22,26,66,0.6)] text-[#EDE8DC] placeholder-[#6B6355] rounded-xl px-3 py-2 text-sm border border-[#D4A017]/15 focus:outline-none focus:ring-1 focus:ring-[#D4A017]/40 font-[family-name:var(--font-ui)]"
              disabled={isProcessing}
              maxLength={2000}
            />
            {/* Send */}
            <motion.button
              onClick={onSubmit}
              disabled={!inputText.trim() || isProcessing}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #1B4FBB, #0E7490)' }}
              whileTap={{ scale: 0.9 }}
              aria-label="Send"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.button>
            {/* Mic */}
            <motion.button
              onClick={onVoiceActivate}
              disabled={isProcessing}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D4A017]/20 bg-[#D4A017]/10 text-[#D4A017] disabled:opacity-40"
              whileTap={{ scale: 0.9 }}
              aria-label="Voice input"
            >
              <ShankhaIcon size={16} color="currentColor" strokeWidth={2} />
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
