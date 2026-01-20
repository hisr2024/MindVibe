'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { KiaanChat, type Message } from '@/components/chat/KiaanChat';
import { apiCall, getErrorMessage } from '@/lib/api-client';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';
import { LanguageSelector } from '@/components/chat/LanguageSelector';

/**
 * Dedicated KIAAN Chat Page - Inner Component
 * Full-featured chat interface with mood context support
 */
function KiaanChatPageInner() {
  const { t, isInitialized, language } = useLanguage();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'detailed' | 'summary'>('detailed');

  // Handle mood context from Quick Check-in
  useEffect(() => {
    const mood = searchParams?.get('mood');
    const message = searchParams?.get('message');
    
    if (mood && message) {
      // Add a welcome message with mood context
      const welcomeMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: `I see you're feeling ${mood}. I'm here to support you. Let's explore this together. 💙`,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
      
      // Auto-send the mood message
      setTimeout(() => {
        handleSendMessage(decodeURIComponent(message));
      }, 1000);
    }
  }, [searchParams]);

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
        body: JSON.stringify({ 
          message: text.trim(),
          language: language || 'en'
        }),
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
  }, [language]);

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
      <div className="relative z-10 space-y-4 rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-6 shadow-[0_30px_120px_rgba(255,115,39,0.18)] backdrop-blur md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-rose-200 bg-clip-text text-transparent md:text-4xl">
              {t('kiaan.chat.title', 'Talk to KIAAN')}
            </h1>
            <p className="mt-2 text-sm text-orange-100/80 md:text-base">
              {t('kiaan.chat.subtitle', 'Your calm, privacy-first mental wellness companion powered by ancient wisdom')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Voice Mode Toggle */}
            <Link
              href="/kiaan/voice"
              className="flex items-center gap-2 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-amber-500/10 px-4 py-2 text-sm font-semibold text-orange-50 transition-all hover:border-orange-400/50 hover:from-orange-500/20 hover:to-amber-500/20"
              title="Switch to Voice Mode"
            >
              <span className="text-lg">🎙️</span>
              <span className="hidden sm:inline">{t('kiaan.voice.switch', 'Voice Mode')}</span>
            </Link>
            {/* Language Selector */}
            <LanguageSelector compact />
            <Link
              href="/"
              className="rounded-xl border border-orange-500/30 bg-white/5 px-4 py-2 text-sm font-semibold text-orange-50 transition-all hover:border-orange-400/50 hover:bg-white/10"
            >
              ← {t('navigation.mainNav.home', 'Home')}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-orange-500/20 bg-white/5 px-4 py-3 text-sm text-orange-100/80">
          <span className="text-lg">🔒</span>
          <span>{t('home.hero.privacy', 'Conversations remain private • a warm, confidential refuge')}</span>
        </div>
      </div>

      {/* Message Actions - Only show when there are KIAAN responses */}
      {messages.length > 0 && messages[messages.length - 1]?.sender === 'assistant' && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-3 shadow-[0_10px_40px_rgba(255,115,39,0.12)] backdrop-blur">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-orange-500/20 bg-white/5 p-1">
            <button
              onClick={() => setViewMode('detailed')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'detailed'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'text-orange-100/70 hover:text-orange-50'
              }`}
            >
              Detailed
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'summary'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'text-orange-100/70 hover:text-orange-50'
              }`}
            >
              Summary
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
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
          viewMode={viewMode}
        />
      </div>

      {/* Quick Responses - Below KIAAN Chat */}
      {messages.length === 0 && (
        <div className="space-y-4 rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-6 shadow-[0_20px_80px_rgba(255,115,39,0.12)] backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-orange-50">{t('kiaan.quickPrompts.title', 'Quick Responses')}</h2>
            <button
              onClick={handleClarityPause}
              className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:scale-105"
            >
              🧘 {t('kiaan.clarityPause.title', 'Clarity Pause')}
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
                  <span className="text-sm font-semibold text-orange-50">{t(`kiaan.quickPrompts.scenarios.${response.id}.label`, response.text)}</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      )}

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

/**
 * KIAAN Chat Page with Suspense boundary
 * Wraps the main component to handle useSearchParams properly
 */
export default function KiaanChatPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto" />
          <p className="text-orange-100">Loading KIAAN Chat...</p>
        </div>
      </div>
    }>
      <KiaanChatPageInner />
    </Suspense>
  );
}
