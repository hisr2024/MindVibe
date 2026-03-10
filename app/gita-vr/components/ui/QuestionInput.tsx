/**
 * QuestionInput — Voice/text question input for asking Krishna
 *
 * Voice mode: microphone button with speech recognition.
 * Text mode: floating text input.
 * Sends questions to KIAAN AI Krishna persona.
 */

'use client'

import { useState, useCallback } from 'react'
import { Html } from '@react-three/drei'
import { useGitaVRStore } from '@/stores/gitaVRStore'

interface QuestionInputProps {
  onAskQuestion: (question: string) => Promise<void>
}

export default function QuestionInput({ onAskQuestion }: QuestionInputProps) {
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const interactionMode = useGitaVRStore((s) => s.interactionMode)
  const setInteractionMode = useGitaVRStore((s) => s.setInteractionMode)
  const isProcessingQuestion = useGitaVRStore((s) => s.isProcessingQuestion)
  const sceneState = useGitaVRStore((s) => s.sceneState)

  const handleSubmit = useCallback(async () => {
    if (!inputText.trim() || isProcessingQuestion) return
    const question = inputText.trim()
    setInputText('')
    await onAskQuestion(question)
  }, [inputText, isProcessingQuestion, onAskQuestion])

  const handleVoiceInput = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setInteractionMode('text')
      return
    }

    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    const recognition = new (SpeechRecognition as new () => SpeechRecognition)()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? ''
      setInputText(transcript)
      setIsListening(false)
      // Auto-submit voice input
      if (transcript.trim()) {
        onAskQuestion(transcript.trim())
        setInputText('')
      }
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    try {
      recognition.start()
    } catch {
      // Permission denied or already started — fall back to text mode
      setIsListening(false)
      setInteractionMode('text')
    }
  }, [setInteractionMode, onAskQuestion])

  // Don't show during intro/loading
  if (sceneState === 'loading' || sceneState === 'intro') return null

  return (
    <Html
      position={[0, -1.5, 3]}
      center
      distanceFactor={6}
      style={{ pointerEvents: 'auto' }}
    >
      <div className="w-[360px] rounded-xl border border-[#d4a44c]/15 bg-black/80 p-3 backdrop-blur-lg">
        {/* Mode toggle */}
        <div className="mb-2 flex justify-center gap-2">
          <button
            onClick={() => setInteractionMode('text')}
            className={`rounded-md px-3 py-1 text-xs transition ${
              interactionMode === 'text'
                ? 'bg-[#d4a44c]/20 text-[#d4a44c]'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Text
          </button>
          <button
            onClick={() => setInteractionMode('voice')}
            className={`rounded-md px-3 py-1 text-xs transition ${
              interactionMode === 'voice'
                ? 'bg-[#d4a44c]/20 text-[#d4a44c]'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Voice
          </button>
        </div>

        {interactionMode === 'text' ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Ask Krishna a question..."
              disabled={isProcessingQuestion}
              className="flex-1 rounded-lg border border-[#d4a44c]/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[#d4a44c]/30"
            />
            <button
              onClick={handleSubmit}
              disabled={isProcessingQuestion || !inputText.trim()}
              className="rounded-lg bg-[#d4a44c]/20 px-4 py-2 text-sm text-[#d4a44c] transition hover:bg-[#d4a44c]/30 disabled:opacity-30"
            >
              {isProcessingQuestion ? '...' : 'Ask'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleVoiceInput}
            disabled={isProcessingQuestion || isListening}
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 transition ${
              isListening
                ? 'animate-pulse border-red-400 bg-red-400/20'
                : 'border-[#d4a44c]/30 bg-[#d4a44c]/10 hover:bg-[#d4a44c]/20'
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isListening ? '#f87171' : '#d4a44c'} strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        )}

        {isProcessingQuestion && (
          <p className="mt-2 text-center text-xs text-[#d4a44c]/50">
            Krishna contemplates your question...
          </p>
        )}
      </div>
    </Html>
  )
}
