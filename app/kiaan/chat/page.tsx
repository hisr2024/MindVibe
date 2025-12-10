'use client';

import { useState, useCallback } from 'react';
import { KiaanChat, type Message } from '@/components/chat/KiaanChat';
import { apiCall, getErrorMessage } from '@/lib/api-client';
import Link from 'next/link';

type ViewMode = 'detailed' | 'summary';

/**
 * Dedicated KIAAN Chat Page
 * Full-featured chat interface moved from home page
 */
export default function KiaanChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await apiCall('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message: text.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from KIAAN');
      }

      const data = await response.json();
      
      // Add assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: data.response || "I'm here for you. Let's try again. 💙",
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('KIAAN chat error:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: getErrorMessage(error),
        timestamp: new Date().toISOString(),
        status: 'error',
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSaveToJournal = useCallback(async (text: string) => {
    if (typeof window === 'undefined') return;

    try {
      // Simple save to sacred reflections - redirect to journal page with prefilled content
      const params = new URLSearchParams({
        prefill: text,
        source: 'kiaan',
      });
      window.location.href = `/sacred-reflections?${params.toString()}`;
    } catch (error) {
      console.error('Failed to save to journal:', error);
    }
  }, []);

  const handleCopyResponse = useCallback((text: string) => {
    if (typeof window === 'undefined') return;
    
    navigator.clipboard.writeText(text).then(() => {
      // Show a brief success message (could be enhanced with a toast notification)
      console.log('Copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }, []);

  const handleShareResponse = useCallback((text: string) => {
    if (typeof window === 'undefined') return;
    
    if (navigator.share) {
      navigator.share({
        title: 'KIAAN Response',
        text: text,
      }).catch(err => {
        console.error('Failed to share:', err);
      });
    } else {
      // Fallback - copy to clipboard
      handleCopyResponse(text);
    }
  }, [handleCopyResponse]);

  // Quick response prompts
  const quickResponses = [
    { id: 'anxiety', text: 'Help me calm anxiety', emoji: '😰', prompt: 'I\'m feeling anxious and need help finding calm. Can you guide me?' },
    { id: 'heavy', text: 'My heart feels heavy', emoji: '💔', prompt: 'My heart feels heavy today. I need some support and understanding.' },
    { id: 'anger', text: 'Cooling anger', emoji: '😤', prompt: 'I\'m feeling angry and need help cooling down. Can you help me find peace?' },
    { id: 'clarity', text: 'Clarity check', emoji: '🧭', prompt: 'I need clarity on a situation. Can you help me see things more clearly?' },
    { id: 'balance', text: 'Work balance', emoji: '⚖️', prompt: 'I\'m struggling with work-life balance. How can I find more equilibrium?' },
    { id: 'relationships', text: 'Tender relationships', emoji: '💗', prompt: 'I need guidance on handling a tender relationship situation with care.' },
    { id: 'purpose', text: 'Purpose pulse', emoji: '🌟', prompt: 'Help me reconnect with my sense of purpose. I feel a bit lost.' },
    { id: 'peace', text: 'Quiet peace', emoji: '🕊️', prompt: 'I need to find quiet peace within myself. Can you guide me to stillness?' },
  ];

  const handleClarityPause = () => {
    const clarityMessage = "I need a moment to pause and reflect. Can you guide me through a brief clarity exercise?";
    handleSendMessage(clarityMessage);
  };

  const handleQuickResponse = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 pb-28 md:p-8">
      {/* Header */}
      <div className="space-y-4 rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-6 shadow-[0_30px_120px_rgba(255,115,39,0.18)] backdrop-blur md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-rose-200 bg-clip-text text-transparent md:text-4xl">
              Talk to KIAAN
            </h1>
            <p className="mt-2 text-sm text-orange-100/80 md:text-base">
              Your calm, privacy-first mental wellness companion powered by ancient wisdom
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-orange-500/30 bg-white/5 px-4 py-2 text-sm font-semibold text-orange-50 transition-all hover:border-orange-400/50 hover:bg-white/10"
          >
            ← Home
          </Link>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-orange-500/20 bg-white/5 px-4 py-3 text-sm text-orange-100/80">
          <span className="text-lg">🔒</span>
          <span>Conversations remain private • a warm, confidential refuge</span>
        </div>
      </div>

      {/* Quick Responses */}
      {messages.length === 0 && (
        <div className="space-y-4 rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-6 shadow-[0_20px_80px_rgba(255,115,39,0.12)] backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-orange-50">Quick Responses</h2>
            <button
              onClick={handleClarityPause}
              className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:scale-105"
            >
              🧘 Clarity Pause
            </button>
          </div>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {quickResponses.map((response) => (
              <button
                key={response.id}
                onClick={() => handleQuickResponse(response.prompt)}
                className="group relative overflow-hidden rounded-2xl border border-orange-500/20 bg-white/5 p-4 text-left transition-all hover:border-orange-400/40 hover:bg-white/10 hover:shadow-lg hover:shadow-orange-500/20"
              >
                <div className="flex flex-col gap-2">
                  <span className="text-2xl">{response.emoji}</span>
                  <span className="text-sm font-semibold text-orange-50">{response.text}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View Toggle & Actions - Only show when there are messages */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-3 shadow-[0_10px_40px_rgba(255,115,39,0.12)] backdrop-blur">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('detailed')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === 'detailed'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-white/5 text-orange-100/70 hover:bg-white/10 hover:text-orange-50'
              }`}
            >
              Detailed View
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === 'summary'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-white/5 text-orange-100/70 hover:bg-white/10 hover:text-orange-50'
              }`}
            >
              Summary
            </button>
          </div>
          <div className="flex gap-2">
            {messages.length > 0 && messages[messages.length - 1]?.sender === 'assistant' && (
              <>
                <button
                  onClick={() => handleCopyResponse(messages[messages.length - 1].text)}
                  className="rounded-lg border border-orange-500/30 bg-white/5 px-3 py-2 text-sm font-semibold text-orange-100/80 transition-all hover:border-orange-400/50 hover:bg-white/10 hover:text-orange-50"
                  title="Copy last response"
                >
                  📋 Copy
                </button>
                <button
                  onClick={() => handleShareResponse(messages[messages.length - 1].text)}
                  className="rounded-lg border border-orange-500/30 bg-white/5 px-3 py-2 text-sm font-semibold text-orange-100/80 transition-all hover:border-orange-400/50 hover:bg-white/10 hover:text-orange-50"
                  title="Share response"
                >
                  📤 Share
                </button>
                <button
                  onClick={() => handleSaveToJournal(messages[messages.length - 1].text)}
                  className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
                  title="Send to Sacred Reflections"
                >
                  ✨ Send to Sacred Reflections
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-4 shadow-[0_30px_120px_rgba(255,115,39,0.18)] backdrop-blur md:p-6">
        <KiaanChat
          messages={messages}
          onSendMessage={handleSendMessage}
          onSaveToJournal={handleSaveToJournal}
          isLoading={isLoading}
        />
      </div>

      {/* Quick Responses Below Chat - Always visible */}
      <div className="space-y-4 rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-6 shadow-[0_20px_80px_rgba(255,115,39,0.12)] backdrop-blur">
        <h2 className="text-lg font-semibold text-orange-50">Quick Responses</h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {quickResponses.map((response) => (
            <button
              key={response.id}
              onClick={() => handleQuickResponse(response.prompt)}
              className="group relative overflow-hidden rounded-2xl border border-orange-500/20 bg-white/5 p-4 text-left transition-all hover:border-orange-400/40 hover:bg-white/10 hover:shadow-lg hover:shadow-orange-500/20"
            >
              <div className="flex flex-col gap-2">
                <span className="text-2xl">{response.emoji}</span>
                <span className="text-sm font-semibold text-orange-50">{response.text}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>

      {/* Helper Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/sacred-reflections"
          className="rounded-2xl border border-amber-300/20 bg-white/5 p-4 shadow-[0_14px_60px_rgba(251,191,36,0.16)] transition-all hover:border-amber-300/40 hover:shadow-[0_20px_80px_rgba(251,191,36,0.24)]"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <div>
              <h3 className="font-semibold text-amber-50">Sacred Reflections</h3>
              <p className="text-sm text-amber-100/70">Journal your thoughts</p>
            </div>
          </div>
        </Link>

        <Link
          href="/emotional-reset"
          className="rounded-2xl border border-orange-500/20 bg-white/5 p-4 shadow-[0_14px_60px_rgba(255,147,71,0.16)] transition-all hover:border-orange-500/40 hover:shadow-[0_20px_80px_rgba(255,147,71,0.24)]"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔄</span>
            <div>
              <h3 className="font-semibold text-orange-50">Emotional Reset</h3>
              <p className="text-sm text-orange-100/70">Quick calm exercises</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard"
          className="rounded-2xl border border-teal-400/15 bg-white/5 p-4 shadow-[0_14px_60px_rgba(34,197,235,0.12)] transition-all hover:border-teal-400/30 hover:shadow-[0_20px_80px_rgba(34,197,235,0.18)]"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="font-semibold text-white">Dashboard</h3>
              <p className="text-sm text-white/70">Track your progress</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="rounded-3xl border border-orange-500/15 bg-[#0b0b0f] p-5 shadow-[0_20px_80px_rgba(255,115,39,0.12)] md:p-6">
        <h2 className="text-lg font-semibold text-orange-100">Disclaimer</h2>
        <p className="mt-3 text-sm leading-relaxed text-orange-100/80">
          KIAAN shares supportive reflections inspired by wisdom traditions. These conversations and exercises are not medical advice. If you are facing serious concerns or feel unsafe, please contact your country's emergency medical services or a licensed professional right away.
        </p>
      </div>
    </main>
  );
}
