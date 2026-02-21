'use client';

import { useState, useCallback, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { KiaanChat, type Message } from '@/components/chat/KiaanChat';
import { apiCall, getErrorMessage, isQuotaExceeded, isFeatureLocked, getUpgradeUrl } from '@/lib/api-client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/hooks/useLanguage';
import { LanguageSelector } from '@/components/chat/LanguageSelector';
import { getNextStepSuggestion, extractThemes } from '@/lib/suggestions/nextStep';
import { useNextStepStore } from '@/lib/suggestions/store';

// Dynamic imports for secondary UI components
const PathwayMap = dynamic(
  () => import('@/components/navigation/PathwayMap').then(mod => ({ default: mod.PathwayMap })),
  { loading: () => <div className="h-32 animate-pulse rounded-xl bg-slate-800/30" /> }
);
const NextStepLink = dynamic(
  () => import('@/components/suggestions/NextStepLink').then(mod => ({ default: mod.NextStepLink })),
  { loading: () => <div className="h-10 animate-pulse rounded-lg bg-slate-800/30" /> }
);

/**
 * Dedicated KIAAN Chat Page - Inner Component
 * Full-featured chat interface with mood context support
 */
function KiaanChatPageInner() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'detailed' | 'summary'>('summary');

  // Session tracking for conversation continuity
  const [sessionId] = useState(() => crypto.randomUUID());

  // Ref to always access the latest handleSendMessage without stale closures
  const handleSendMessageRef = useRef<(text: string) => Promise<void>>();

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build conversation history for context awareness (last 10 messages)
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
        timestamp: m.timestamp
      }));

      const response = await apiCall('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({
          message: text.trim(),
          language: language || 'en',
          session_id: sessionId,
          conversation_history: conversationHistory
        }),
      });

      const data = await response.json();

      // Add assistant message with AI-generated summary
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: data.response || t('kiaan.chat.defaultResponse', "I'm here. Tell me what's going on and we'll work through it together."),
        timestamp: new Date().toISOString(),
        summary: data.summary || undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('KIAAN chat error:', error);

      let errorText = getErrorMessage(error)
      const upgradeUrl = getUpgradeUrl(error)

      if (isQuotaExceeded(error)) {
        errorText = `${errorText}\n\n${t('kiaan.chat.quotaExceeded', 'Your monthly quota has been reached. [Upgrade your plan](/pricing) to continue chatting.')}`
      } else if (isFeatureLocked(error)) {
        errorText = `${errorText}\n\n${t('kiaan.chat.featureLocked', `This feature requires a higher plan. [View plans](${upgradeUrl || '/pricing'}) to unlock it.`)}`
      }

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: errorText,
        timestamp: new Date().toISOString(),
        status: 'error',
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [language, sessionId, messages]);

  // Keep ref in sync so useEffect always calls the latest version
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  // Handle mood context from Quick Check-in
  const moodHandledRef = useRef(false);
  useEffect(() => {
    if (moodHandledRef.current) return;
    const mood = searchParams?.get('mood');
    const message = searchParams?.get('message');

    if (mood && message) {
      moodHandledRef.current = true;
      const welcomeMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: t('kiaan.chat.moodWelcome', `You're registering ${mood} right now. That's useful data. Tell me what's happening — I'm here to help you understand it and work with it.`),
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);

      // Use ref to avoid stale closure
      setTimeout(() => {
        handleSendMessageRef.current?.(decodeURIComponent(message));
      }, 1000);
    }
  }, [searchParams]);

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
      // Copied successfully
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

  // --- Next-step suggestion session signals ---
  const incrementTheme = useNextStepStore((s) => s.incrementTheme);
  const themeCounts = useNextStepStore((s) => s.themeCounts);

  // Track themes when a new user message is added
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.sender === 'user') {
      for (const theme of extractThemes(lastMsg.text)) {
        incrementTheme(theme);
      }
    }
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextStepSuggestion = useMemo(() => {
    const lastUser = [...messages].reverse().find((m) => m.sender === 'user');
    const lastAssistant = [...messages].reverse().find((m) => m.sender === 'assistant' && !m.status);
    return getNextStepSuggestion({
      tool: 'kiaan',
      userText: lastUser?.text,
      aiText: lastAssistant?.text,
      sessionSignals: { themeCounts },
    });
  }, [messages, themeCounts]);

  // Quick response prompts — grounded, practical language (labels translated, prompts in English for AI)
  const quickResponses = [
    { id: 'anxiety', text: t('kiaan.quickPrompts.scenarios.anxiety.label', 'Anxiety is high'), emoji: '😰', prompt: 'My anxiety is elevated right now. Help me understand what\'s happening in my nervous system and what I can do about it.' },
    { id: 'heavy', text: t('kiaan.quickPrompts.scenarios.heavy.label', 'Feeling heavy'), emoji: '💔', prompt: 'I\'m carrying a heaviness today. Help me identify what\'s driving it and how to process it.' },
    { id: 'anger', text: t('kiaan.quickPrompts.scenarios.anger.label', 'Managing anger'), emoji: '😤', prompt: 'I\'m angry right now. Help me regulate before I react and understand what\'s underneath it.' },
    { id: 'clarity', text: t('kiaan.quickPrompts.scenarios.clarity.label', 'Need clarity'), emoji: '🧭', prompt: 'I\'m stuck on a decision and can\'t think clearly. Help me sort through the competing factors.' },
    { id: 'balance', text: t('kiaan.quickPrompts.scenarios.balance.label', 'Overwhelmed'), emoji: '⚖️', prompt: 'I\'m overwhelmed with competing demands. Help me prioritize and reduce cognitive load.' },
    { id: 'relationships', text: t('kiaan.quickPrompts.scenarios.relationships.label', 'Relationship stress'), emoji: '💗', prompt: 'A relationship is causing me stress. Help me understand the attachment pattern and what I can do.' },
    { id: 'purpose', text: t('kiaan.quickPrompts.scenarios.purpose.label', 'Feeling stuck'), emoji: '🌟', prompt: 'I feel disconnected from what matters to me. Help me reconnect with my values and find a concrete next step.' },
    { id: 'peace', text: t('kiaan.quickPrompts.scenarios.peace.label', 'Need to regulate'), emoji: '🕊️', prompt: 'My nervous system is activated and I need to downregulate. Walk me through a grounding exercise.' },
  ];

  const handleClarityPause = () => {
    const clarityMessage = "I need to slow down and regulate. Walk me through a brief grounding exercise to bring my nervous system back to baseline.";
    handleSendMessage(clarityMessage);
  };

  const handleQuickResponse = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <main className="mx-auto max-w-5xl space-y-4 sm:space-y-6 p-3 sm:p-4 pb-28 sm:pb-24 md:p-8">
      {/* Pathway Map */}
      <PathwayMap />

      {/* Header */}
      <div className="relative z-10 space-y-3 sm:space-y-4 rounded-2xl sm:rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-4 sm:p-6 shadow-[0_30px_120px_rgba(255,115,39,0.18)] backdrop-blur md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-rose-200 bg-clip-text text-transparent md:text-4xl">
              {t('kiaan.chat.title', 'Talk to KIAAN')}
            </h1>
            <p className="mt-1 sm:mt-2 text-sm text-orange-100/80 md:text-base">
              {t('kiaan.chat.subtitle', 'Your calm, privacy-first spiritual companion')}
            </p>
            <p className="mt-1.5 text-[11px] tracking-wide text-orange-300/50" data-testid="mode-label">
              {t('dashboard.mode_label.prefix', 'You are in:')} {t('dashboard.mode_label.kiaan', 'Companion Mode')}
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* KIAAN Companion - Conversation Mode */}
            <Link
              href="/companion"
              className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-teal-500/30 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 px-3 sm:px-4 py-2 text-sm font-semibold text-teal-50 transition-all hover:border-teal-400/50 hover:from-teal-500/20 hover:to-cyan-500/20"
              title="KIAAN Companion - Talk with KIAAN"
            >
              <span className="text-lg">🗣️</span>
              <span className="hidden sm:inline">{t('kiaan.voice.companion', 'KIAAN Companion')}</span>
            </Link>
            {/* Voice Mode Toggle */}
            <Link
              href="/companion"
              className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-amber-500/10 px-3 sm:px-4 py-2 text-sm font-semibold text-orange-50 transition-all hover:border-orange-400/50 hover:from-orange-500/20 hover:to-amber-500/20"
              title="Switch to Voice Mode"
            >
              <span className="text-lg">🎙️</span>
              <span className="hidden sm:inline">{t('kiaan.voice.switch', 'Voice Mode')}</span>
            </Link>
            {/* Language Selector */}
            <LanguageSelector compact />
            <Link
              href="/"
              className="rounded-xl border border-orange-500/30 bg-white/5 px-3 sm:px-4 py-2 text-sm font-semibold text-orange-50 transition-all hover:border-orange-400/50 hover:bg-white/10"
            >
              ← <span className="hidden sm:inline">{t('navigation.mainNav.home', 'Home')}</span><span className="sm:hidden">{t('navigation.mainNav.home', 'Home')}</span>
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
              onClick={() => setViewMode('summary')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'summary'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'text-orange-100/70 hover:text-orange-50'
              }`}
              title="Quick summary"
            >
              {t('kiaan.chat.summary', 'Summary')}
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'detailed'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'text-orange-100/70 hover:text-orange-50'
              }`}
              title={t('kiaan.chat.fullViewTitle', 'Full detailed response')}
            >
              {t('kiaan.chat.fullView', 'Full View')}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyResponse(messages[messages.length - 1].text)}
              className="rounded-lg border border-orange-500/30 bg-white/5 px-3 py-2 text-sm font-semibold text-orange-100/80 transition-all hover:border-orange-400/50 hover:bg-white/10 hover:text-orange-50"
              title="Copy last response"
            >
              📋 {t('kiaan.chat.copy', 'Copy')}
            </button>
            <button
              onClick={() => handleShareResponse(messages[messages.length - 1].text)}
              className="rounded-lg border border-orange-500/30 bg-white/5 px-3 py-2 text-sm font-semibold text-orange-100/80 transition-all hover:border-orange-400/50 hover:bg-white/10 hover:text-orange-50"
              title={t('kiaan.chat.shareTitle', 'Share response')}
            >
              📤 {t('kiaan.chat.share', 'Share')}
            </button>
            <button
              onClick={() => handleSaveToJournal(messages[messages.length - 1].text)}
              className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
              title={t('kiaan.chat.saveToJournalTitle', 'Save to Journal')}
            >
              ✨ {t('kiaan.chat.saveToJournal', 'Save to Journal')}
            </button>
          </div>
        </div>
      )}

      {/* Next Step Suggestion */}
      {messages.length > 0 && messages[messages.length - 1]?.sender === 'assistant' && (
        <NextStepLink suggestion={nextStepSuggestion} />
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
          <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
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

      {/* A Note from KIAAN */}
      <div className="rounded-3xl border border-[#d4a44c]/15 bg-[#0b0b0f] p-5 shadow-[0_20px_80px_rgba(212,164,76,0.08)] md:p-6">
        <h2 className="text-lg font-semibold text-[#d4a44c]/80">{t('kiaan.chat.divineFriend', 'Your Divine Friend')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-orange-100/70">
          {t('kiaan.chat.disclaimer', 'KIAAN is your spiritual companion, sharing reflections drawn from the Bhagavad Gita and ancient wisdom. This is a sacred space for inner peace and self-discovery. For matters beyond the spiritual path, always seek guidance from qualified professionals.')}
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
          <p className="text-orange-100">Loading...</p>
        </div>
      </div>
    }>
      <KiaanChatPageInner />
    </Suspense>
  );
}
