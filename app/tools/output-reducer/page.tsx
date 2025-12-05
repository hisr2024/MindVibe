'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function OutputReducerPage() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleReduce() {
    const trimmedInput = input.trim()
    if (!trimmedInput) return

    setLoading(true)
    setError(null)
    setOutput('')

    const systemPrompt = `You are a concise writing assistant. Your task is to reduce the given text to its essential meaning while preserving the core message. 

Rules:
- Remove unnecessary words, filler phrases, and redundant information
- Keep the tone and intent intact
- Make it clear and direct
- Aim for 30-50% reduction in length when possible
- Preserve any important details or action items

Return ONLY the reduced text without any preamble or explanation.`

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: `${systemPrompt}\n\nOriginal text:\n${trimmedInput}\n\nReduced version:` 
        })
      })

      if (!response.ok) {
        setError('Unable to process your text. Please try again.')
        return
      }

      const data = await response.json()
      setOutput(data.response)
    } catch {
      setError('Connection error. Please check your network and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!output) return
    
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = output
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleSave() {
    if (!output) return
    
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reduced-text.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleClear() {
    setInput('')
    setOutput('')
    setError(null)
  }

  const inputWordCount = input.trim().split(/\s+/).filter(Boolean).length
  const outputWordCount = output.trim().split(/\s+/).filter(Boolean).length
  const reduction = inputWordCount > 0 && outputWordCount > 0 
    ? Math.round((1 - outputWordCount / inputWordCount) * 100) 
    : 0

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/90 p-6 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent">
                Output Reducer
              </h1>
              <p className="text-sm text-orange-100/70 mt-1">Simplify lengthy text to its essence</p>
            </div>
            <Link href="/" className="text-sm text-orange-100/60 hover:text-orange-200 transition">
              ← Home
            </Link>
          </div>
        </header>

        {/* Input Section */}
        <section className="rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-orange-100">Input Text</label>
            <span className="text-xs text-orange-100/50">{inputWordCount} words</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your text here to reduce..."
            className="w-full h-48 rounded-xl bg-black/50 border border-orange-500/25 text-orange-50 placeholder:text-orange-100/40 p-4 focus:ring-2 focus:ring-orange-400/50 outline-none resize-none"
          />
          
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={handleReduce}
              disabled={!input.trim() || loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition hover:scale-[1.02]"
            >
              {loading ? 'Reducing...' : 'Reduce'}
            </button>
            <button
              onClick={handleClear}
              className="px-6 py-3 rounded-xl border border-orange-500/30 text-orange-100/80 font-medium hover:bg-white/5 transition"
            >
              Clear
            </button>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          )}
        </section>

        {/* Output Section */}
        {output && (
          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-[0_15px_60px_rgba(16,185,129,0.08)]">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-emerald-100">Reduced Text</label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-100/50">{outputWordCount} words</span>
                {reduction > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-200">
                    -{reduction}%
                  </span>
                )}
              </div>
            </div>
            
            <div className="rounded-xl bg-black/40 border border-emerald-500/20 p-4 mb-4">
              <p className="text-sm text-emerald-50 leading-relaxed whitespace-pre-wrap">
                {output}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCopy}
                className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white/80 font-medium hover:bg-white/15 transition flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white/80 font-medium hover:bg-white/15 transition flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Save
              </button>
            </div>
          </section>
        )}

        {/* Tips */}
        <section className="rounded-2xl border border-orange-500/10 bg-[#0d0d10]/60 p-4">
          <p className="text-xs text-orange-100/50">
            <strong className="text-orange-100/70">Tip:</strong> Works best with emails, meeting notes, or long messages. The reducer preserves meaning while cutting unnecessary words.
          </p>
        </section>
      </div>
    </main>
  )
}
