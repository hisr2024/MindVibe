'use client';

import { useState, useCallback, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { KiaanChat, type Message } from '@/components/chat/KiaanChat';
import ErrorBoundary from '@/components/ErrorBoundary';
import { apiCall, getErrorMessage, isQuotaExceeded, isFeatureLocked, getUpgradeUrl } from '@/lib/api-client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/hooks/useLanguage';
import { LanguageSelector } from '@/components/chat/LanguageSelector';
import { getNextStepSuggestion, extractThemes } from '@/lib/suggestions/nextStep';
import { useNextStepStore } from '@/lib/suggestions/store';
import { useKiaanQuota } from '@/hooks/useKiaanQuota';
import { useSubscription } from '@/hooks/useSubscription';

// Dynamic imports for secondary UI components
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
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'detailed' | 'summary'>('summary');

  // Session tracking for conversation continuity
  const [sessionId] = useState(() => crypto.randomUUID());

  // Get user's actual subscription tier for accurate quota tracking
  const { subscription } = useSubscription();

  // KIAAN quota tracking — shows remaining questions, warns before limit
  const quota = useKiaanQuota(subscription?.tierId ?? 'free');

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

      // Increment local quota counter to keep UI in sync
      quota.incrementUsage();
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
  }, [language, sessionId, messages, quota, t]);

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
  }, [searchParams, t]);

  const handleSaveToJournal = useCallback(async (text: string) => {
    if (typeof window === 'undefined') return;

    try {
      // Simple save to sacred reflections - redirect to journal page with prefilled content
      const params = new URLSearchParams({
        prefill: text,
        source: 'kiaan',
      });
      router.push(`/sacred-reflections?${params.toString()}`);
    } catch (error) {
      console.error('Failed to save to journal:', error);
    }
  }, [router]);

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

  // ─── Recent topics: derived from themeCounts store (no new fetches) ───
  const recentTopics = useMemo(() => {
    return Object.entries(themeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([theme]) => theme)
  }, [themeCounts])

  return (
    <div className="flex flex-col flex-1 min-h-0 p-3 sm:p-4 pb-28 sm:pb-24 md:p-6 lg:p-0 lg:pb-0">
      {/* ─── 3-panel layout: Sidebar (from layout) | Chat center | Right panel.
           Collapses to 1 column (flex-col) below 1024px. ─── */}
      <div className="flex flex-col flex-1 min-h-0 gap-5 lg:flex-row lg:gap-0 lg:overflow-hidden">
      <div className="flex-1 min-w-0 flex flex-col space-y-5 lg:space-y-0 lg:overflow-hidden">
      {/* Header — compact on desktop, card on mobile */}
      <div
        className="relative z-10 space-y-3 sm:space-y-4 p-5 shadow-[0_20px_80px_rgba(212,164,76,0.06)] md:p-6 lg:shrink-0 lg:space-y-0 lg:py-2.5 lg:px-5 lg:shadow-none lg:!rounded-none lg:!border-0 lg:!border-b lg:!border-b-[rgba(180,140,60,0.1)]"
        style={{
          background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
          border: '1px solid rgba(212,160,23,0.1)',
          borderTop: '2px solid rgba(212,160,23,0.45)',
          borderRadius: '18px',
          backdropFilter: 'blur(24px) saturate(120%)',
          WebkitBackdropFilter: 'blur(24px) saturate(120%)',
        }}
      >
        {/* Desktop: single compact row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 lg:flex-row lg:items-center lg:gap-3">
          <div className="flex-1 lg:flex lg:items-center lg:gap-3">
            <h1 className="kiaan-text-golden text-2xl sm:text-3xl font-bold md:text-4xl lg:text-xl">
              {t('kiaan.chat.title', 'Talk to KIAAN')}
            </h1>
            <p className="mt-1 sm:mt-2 text-sm text-[#d4a44c]/70 md:text-base lg:mt-0 lg:text-xs">
              {t('kiaan.chat.subtitle', 'Your calm, privacy-first spiritual companion')}
            </p>
            <p className="mt-1.5 text-[11px] tracking-wide text-[#d4a44c]/40 lg:hidden" data-testid="mode-label">
              {t('dashboard.mode_label.prefix', 'You are in:')} {t('dashboard.mode_label.kiaan', 'Companion Mode')}
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap lg:shrink-0">
            {/* Privacy — inline on desktop */}
            <span className="hidden lg:flex items-center gap-1.5 text-[11px] text-[#d4a44c]/50">
              <span>🔒</span> Private
            </span>
            {/* Quota — inline on desktop */}
            {!quota.loading && quota.limit !== -1 && (
              <span className={`hidden lg:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                quota.isExceeded
                  ? 'bg-red-500/15 text-red-300'
                  : quota.isWarning
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'bg-[#d4a44c]/10 text-[#d4a44c]/70'
              }`}>
                💬 {quota.remaining}/{quota.limit}
              </span>
            )}
            {/* KIAAN Companion - Conversation Mode */}
            <Link
              href="/companion"
              className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-[#d4a44c]/20 bg-[#d4a44c]/5 px-3 sm:px-4 py-2 text-sm font-semibold text-[#e8dcc8] transition-all hover:border-[#d4a44c]/40 hover:bg-[#d4a44c]/10 lg:px-2.5 lg:py-1.5 lg:text-xs lg:rounded-lg"
              title="KIAAN Companion - Talk with KIAAN"
            >
              <span className="text-lg lg:text-sm">🗣️</span>
              <span className="hidden sm:inline lg:hidden">{t('kiaan.voice.companion', 'KIAAN Companion')}</span>
            </Link>
            {/* Language Selector */}
            <LanguageSelector compact />
            <Link
              href="/"
              className="rounded-xl border border-[#d4a44c]/20 bg-white/5 px-3 sm:px-4 py-2 text-sm font-semibold text-[#e8dcc8] transition-all hover:border-[#d4a44c]/35 hover:bg-white/10 lg:px-2.5 lg:py-1.5 lg:text-xs lg:rounded-lg"
            >
              ← <span className="hidden sm:inline">{t('navigation.mainNav.home', 'Home')}</span><span className="sm:hidden">{t('navigation.mainNav.home', 'Home')}</span>
            </Link>
          </div>
        </div>

        {/* Privacy notice — mobile only (shown inline on desktop above) */}
        <div className="flex items-center gap-2 rounded-2xl border border-[#d4a44c]/15 bg-[#d4a44c]/[0.04] px-4 py-3 text-sm text-[#d4a44c]/70 lg:hidden">
          <span className="text-lg">🔒</span>
          <span>{t('home.hero.privacy', 'Conversations remain private • a warm, confidential refuge')}</span>
        </div>

        {/* KIAAN Quota Indicator — mobile only (shown inline on desktop above) */}
        <div className="lg:hidden">
        {!quota.loading && quota.limit !== -1 && (
          <div className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
            quota.isExceeded
              ? 'border-red-500/30 bg-red-500/10 text-red-200'
              : quota.isWarning
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                : 'border-[#d4a44c]/15 bg-[#d4a44c]/[0.04] text-[#d4a44c]/70'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-base">{quota.isExceeded ? '⚠️' : '💬'}</span>
              <span>
                {quota.isExceeded
                  ? t('kiaan.quota.exceeded', 'Monthly quota reached')
                  : `${quota.remaining} ${t('kiaan.quota.remaining', 'questions remaining this month')}`
                }
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Compact progress bar */}
              <div className="hidden sm:block w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    quota.isExceeded ? 'bg-red-400' : quota.isWarning ? 'bg-amber-400' : 'bg-[#d4a44c]'
                  }`}
                  style={{ width: `${Math.min(100, quota.percentage)}%` }}
                />
              </div>
              <span className="text-xs opacity-70">{quota.used}/{quota.limit}</span>
              {quota.isExceeded && (
                <Link
                  href="/pricing"
                  className="kiaan-btn-golden rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:scale-105"
                >
                  {t('kiaan.quota.upgrade', 'Upgrade')}
                </Link>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Message Actions — desktop: compact inline bar. Mobile: card. */}
      {messages.length > 0 && messages[messages.length - 1]?.sender === 'assistant' && (
        <div
          className="flex flex-wrap items-center justify-between gap-2 p-4 shadow-[0_20px_80px_rgba(212,164,76,0.06)] md:p-5 lg:shrink-0 lg:p-2 lg:px-4 lg:rounded-none lg:shadow-none lg:border-0"
          style={{
            background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
            border: '1px solid rgba(212,160,23,0.1)',
            borderTop: '2px solid rgba(212,160,23,0.45)',
            borderRadius: '18px',
            backdropFilter: 'blur(24px) saturate(120%)',
            WebkitBackdropFilter: 'blur(24px) saturate(120%)',
          }}
        >
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-[#d4a44c]/15 bg-black/30 p-1">
            <button
              onClick={() => setViewMode('summary')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'summary'
                  ? 'kiaan-btn-golden shadow-lg'
                  : 'text-[#d4a44c]/60 hover:text-[#d4a44c]'
              }`}
              title="Quick summary"
            >
              {t('kiaan.chat.summary', 'Summary')}
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'detailed'
                  ? 'kiaan-btn-golden shadow-lg'
                  : 'text-[#d4a44c]/60 hover:text-[#d4a44c]'
              }`}
              title={t('kiaan.chat.fullViewTitle', 'Full detailed response')}
            >
              {t('kiaan.chat.fullView', 'Full View')}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyResponse(messages[messages.length - 1]?.text ?? '')}
              className="rounded-lg border border-[#d4a44c]/20 bg-white/5 px-3 py-2 text-sm font-semibold text-[#e8dcc8]/80 transition-all hover:border-[#d4a44c]/40 hover:bg-[#d4a44c]/10 hover:text-[#e8dcc8]"
              title="Copy last response"
            >
              📋 {t('kiaan.chat.copy', 'Copy')}
            </button>
            <button
              onClick={() => handleShareResponse(messages[messages.length - 1]?.text ?? '')}
              className="rounded-lg border border-[#d4a44c]/20 bg-white/5 px-3 py-2 text-sm font-semibold text-[#e8dcc8]/80 transition-all hover:border-[#d4a44c]/40 hover:bg-[#d4a44c]/10 hover:text-[#e8dcc8]"
              title={t('kiaan.chat.shareTitle', 'Share response')}
            >
              📤 {t('kiaan.chat.share', 'Share')}
            </button>
            <button
              onClick={() => handleSaveToJournal(messages[messages.length - 1]?.text ?? '')}
              className="kiaan-btn-golden rounded-lg px-3 py-2 text-sm font-semibold transition-all hover:scale-105"
              title={t('kiaan.chat.saveToJournalTitle', 'Save to Journal')}
            >
              ✨ {t('kiaan.chat.saveToJournal', 'Save to Journal')}
            </button>
          </div>
        </div>
      )}

      {/* Next Step Suggestion — mobile only, hidden on desktop to save vertical space */}
      <div className="lg:hidden">
        {messages.length > 0 && messages[messages.length - 1]?.sender === 'assistant' && (
          <NextStepLink suggestion={nextStepSuggestion} />
        )}
      </div>

      {/* Chat Interface — fills remaining height on desktop */}
      <div
        className="p-4 shadow-[0_20px_80px_rgba(212,164,76,0.06)] md:p-6 lg:flex-1 lg:min-h-0 lg:flex lg:flex-col lg:p-0 lg:shadow-none lg:!rounded-none lg:!border-0"
        style={{
          background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
          border: '1px solid rgba(212,160,23,0.1)',
          borderTop: '2px solid rgba(212,160,23,0.45)',
          borderRadius: '18px',
          backdropFilter: 'blur(24px) saturate(120%)',
          WebkitBackdropFilter: 'blur(24px) saturate(120%)',
        }}
      >
        <KiaanChat
          messages={messages}
          onSendMessage={handleSendMessage}
          onSaveToJournal={handleSaveToJournal}
          isLoading={isLoading}
          viewMode={viewMode}
          className="lg:!h-full lg:!max-h-full lg:!min-h-0"
        />
      </div>

      {/* Quick Responses — mobile only (moves to right panel on desktop) */}
      <div className="lg:hidden">
        {messages.length === 0 && (
          <div
            className="space-y-4 p-5 shadow-[0_20px_80px_rgba(212,164,76,0.06)] md:p-6"
            style={{
              background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
              border: '1px solid rgba(212,160,23,0.1)',
              borderTop: '2px solid rgba(212,160,23,0.45)',
              borderRadius: '18px',
              backdropFilter: 'blur(24px) saturate(120%)',
              WebkitBackdropFilter: 'blur(24px) saturate(120%)',
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="kiaan-text-golden text-lg font-semibold">{t('kiaan.quickPrompts.title', 'Quick Responses')}</h2>
              <button
                onClick={handleClarityPause}
                className="rounded-xl border border-[#d4a44c]/30 bg-[#d4a44c]/10 px-4 py-2 text-sm font-semibold text-[#d4a44c] shadow-lg shadow-[#d4a44c]/10 transition-all hover:bg-[#d4a44c]/20 hover:scale-105"
              >
                🧘 {t('kiaan.clarityPause.title', 'Clarity Pause')}
              </button>
            </div>
            <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {quickResponses.map((response) => (
                <button
                  key={response.id}
                  onClick={() => handleQuickResponse(response.prompt)}
                  className="group relative overflow-hidden rounded-2xl border border-[#d4a44c]/12 bg-[#d4a44c]/[0.03] p-4 text-left transition-all hover:border-[#d4a44c]/30 hover:bg-[#d4a44c]/[0.08] hover:shadow-lg hover:shadow-[#d4a44c]/10"
                >
                  <div className="flex flex-col gap-2">
                    <span className="text-2xl">{response.emoji}</span>
                    <span className="text-sm font-semibold text-[#e8dcc8]">{t(`kiaan.quickPrompts.scenarios.${response.id}.label`, response.text)}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#d4a44c]/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* A Sacred Note from KIAAN — mobile only */}
      <div className="lg:hidden">
        <div
          className="p-5 md:p-6"
          style={{
            background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
            border: '1px solid rgba(212,160,23,0.1)',
            borderTop: '2px solid rgba(212,160,23,0.45)',
            borderRadius: '18px',
            backdropFilter: 'blur(24px) saturate(120%)',
            WebkitBackdropFilter: 'blur(24px) saturate(120%)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="divine-companion-avatar h-10 w-10 rounded-full bg-gradient-to-br from-[#c8943a] via-[#e8b54a] to-[#f0c96d] flex items-center justify-center">
              <span className="text-sm font-bold text-[#0a0a12]">K</span>
            </div>
            <div>
              <h2 className="kiaan-text-golden text-lg font-semibold">{t('kiaan.chat.divineFriend', 'Your Divine Friend')}</h2>
              <p className="text-[10px] text-[#d4a44c]/45 tracking-[0.1em] uppercase">Always by your side</p>
            </div>
          </div>
          <div className="divine-sacred-thread w-full mb-3" />
          <p className="mt-1 text-sm leading-relaxed text-[#e8dcc8]/55 font-sacred">
            {t('kiaan.chat.disclaimer', 'KIAAN is your spiritual companion, sharing reflections drawn from the Bhagavad Gita and ancient wisdom. This is a sacred space for inner peace and self-discovery. For matters beyond the spiritual path, always seek guidance from qualified professionals.')}
          </p>
        </div>
      </div>
      </div>
      {/* ─── Mobile context cards: Verse + Topics (hidden on desktop) ─── */}
      <div className="space-y-4 lg:hidden">
        {/* Verse of the Day — BG 2.47 */}
        <div
          className="p-5"
          style={{
            background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
            border: '1px solid rgba(212,160,23,0.1)',
            borderTop: '2px solid rgba(212,160,23,0.45)',
            borderRadius: '18px',
            backdropFilter: 'blur(24px) saturate(120%)',
            WebkitBackdropFilter: 'blur(24px) saturate(120%)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🕉️</span>
            <span className="font-ui uppercase" style={{ fontSize: '10px', color: '#D4A017', letterSpacing: '0.14em', fontWeight: 600 }}>
              {t('kiaan.chat.sidebar.verseOfDay', 'Verse of the Day')}
            </span>
          </div>
          <p className="font-sacred text-sm leading-relaxed text-[#e8dcc8]/85 mb-2" lang="sa">
            कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।
            मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्तु अकर्मणि ॥
          </p>
          <p className="text-xs leading-relaxed text-[#e8dcc8]/65 italic font-sacred">
            {t('kiaan.chat.sidebar.verseTranslation', 'You have the right to perform your prescribed duty, but not to the fruits of action. Never consider yourself the cause of the results, nor be attached to inaction.')}
          </p>
          <p className="mt-3 text-[11px] text-[#d4a44c]/55 font-mono tracking-widest uppercase">
            {t('kiaan.chat.sidebar.verseRef', 'Bhagavad Gita 2.47')}
          </p>
        </div>

        {/* Recent Topics */}
        <div
          className="p-5"
          style={{
            background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
            border: '1px solid rgba(212,160,23,0.1)',
            borderTop: '2px solid rgba(212,160,23,0.45)',
            borderRadius: '18px',
            backdropFilter: 'blur(24px) saturate(120%)',
            WebkitBackdropFilter: 'blur(24px) saturate(120%)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">💭</span>
            <span className="font-ui uppercase" style={{ fontSize: '10px', color: '#D4A017', letterSpacing: '0.14em', fontWeight: 600 }}>
              {t('kiaan.chat.sidebar.recentTopics', 'Recent Topics')}
            </span>
          </div>
          {recentTopics.length > 0 ? (
            <ul className="space-y-2">
              {recentTopics.map((topic) => (
                <li
                  key={topic}
                  className="flex items-center gap-2 text-xs text-[#e8dcc8]/75"
                >
                  <span className="text-[#d4a44c]/50">·</span>
                  <span className="capitalize">{topic}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#e8dcc8]/45 italic font-sacred">
              {t('kiaan.chat.sidebar.noTopics', 'Start chatting to see topics here.')}
            </p>
          )}
        </div>
      </div>

      {/* ─── Desktop right panel: Verse + Topics + Quick Responses + Disclaimer ─── */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-[320px] lg:shrink-0 overflow-y-auto"
        style={{
          borderLeft: '1px solid rgba(180, 140, 60, 0.1)',
          background: 'rgba(13, 13, 31, 0.8)',
        }}
      >
        <div className="flex flex-col p-5 gap-5">
          {/* Verse of the Day */}
          <div className="pb-5" style={{ borderBottom: '1px solid rgba(180, 140, 60, 0.1)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🕉️</span>
              <span className="font-ui uppercase" style={{ fontSize: '9px', color: 'rgba(212, 160, 23, 0.6)', letterSpacing: '0.18em', fontWeight: 600 }}>
                {t('kiaan.chat.sidebar.verseOfDay', 'Verse of the Day')}
              </span>
            </div>
            <p className="font-devanagari text-[15px] leading-[1.8] text-[#e8dcc8]/85 mb-2" lang="sa">
              कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।{'\n'}
              मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्तु अकर्मणि ॥
            </p>
            <p className="text-[13px] leading-relaxed italic font-sacred" style={{ color: 'rgba(232, 220, 200, 0.6)' }}>
              {t('kiaan.chat.sidebar.verseTranslation', 'You have the right to perform your prescribed duty, but not to the fruits of action. Never consider yourself the cause of the results, nor be attached to inaction.')}
            </p>
            <p className="mt-3 font-ui uppercase" style={{ fontSize: '9px', color: 'rgba(212, 160, 23, 0.5)', letterSpacing: '0.2em', fontWeight: 600 }}>
              {t('kiaan.chat.sidebar.verseRef', 'Bhagavad Gita 2.47')}
            </p>
          </div>

          {/* Recent Topics */}
          <div className="pb-5" style={{ borderBottom: '1px solid rgba(180, 140, 60, 0.1)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">💭</span>
              <span className="font-ui uppercase" style={{ fontSize: '9px', color: 'rgba(212, 160, 23, 0.6)', letterSpacing: '0.18em', fontWeight: 600 }}>
                {t('kiaan.chat.sidebar.recentTopics', 'Recent Topics')}
              </span>
            </div>
            {recentTopics.length > 0 ? (
              <ul className="space-y-2">
                {recentTopics.map((topic) => (
                  <li
                    key={topic}
                    className="flex items-center gap-2 text-xs text-[#e8dcc8]/75"
                  >
                    <span className="text-[#d4a44c]/50">·</span>
                    <span className="capitalize">{topic}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#e8dcc8]/45 italic font-sacred">
                {t('kiaan.chat.sidebar.noTopics', 'Start chatting to see topics here.')}
              </p>
            )}
          </div>

          {/* Quick Responses — desktop version */}
          <div className="pb-5" style={{ borderBottom: '1px solid rgba(180, 140, 60, 0.1)' }}>
            <span className="font-ui uppercase" style={{ fontSize: '9px', color: 'rgba(212, 160, 23, 0.6)', letterSpacing: '0.18em', fontWeight: 600 }}>
              {t('kiaan.quickPrompts.title', 'Quick Responses')}
            </span>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {quickResponses.map((response) => (
                <button
                  key={response.id}
                  onClick={() => handleQuickResponse(response.prompt)}
                  className="group relative overflow-hidden rounded-xl border border-[#d4a44c]/10 bg-[#d4a44c]/[0.03] p-3 text-left transition-all hover:border-[#d4a44c]/25 hover:bg-[#d4a44c]/[0.08]"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-lg">{response.emoji}</span>
                    <span className="text-[11px] font-semibold text-[#e8dcc8]/85 leading-tight">
                      {t(`kiaan.quickPrompts.scenarios.${response.id}.label`, response.text)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Divine Friend disclaimer */}
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#c8943a] via-[#e8b54a] to-[#f0c96d] flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-[#0a0a12]">K</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#e8dcc8]/90">{t('kiaan.chat.divineFriend', 'Your Divine Friend')}</p>
                <p className="text-[9px] text-[#d4a44c]/40 tracking-[0.1em] uppercase">Always by your side</p>
              </div>
            </div>
            <div className="divine-sacred-thread w-full mb-2.5" />
            <p className="text-[11px] leading-relaxed text-[#e8dcc8]/45 font-sacred">
              {t('kiaan.chat.disclaimer', 'KIAAN is your spiritual companion, sharing reflections drawn from the Bhagavad Gita and ancient wisdom. This is a sacred space for inner peace and self-discovery. For matters beyond the spiritual path, always seek guidance from qualified professionals.')}
            </p>
          </div>
        </div>
      </aside>
      </div>
    </div>
  );
}

/**
 * KIAAN Chat Page with Suspense boundary
 * Wraps the main component to handle useSearchParams properly
 */
export default function KiaanChatPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d4a44c] border-t-transparent mx-auto" />
            <p className="text-[#d4a44c]/70">Loading...</p>
          </div>
        </div>
      }>
        <KiaanChatPageInner />
      </Suspense>
    </ErrorBoundary>
  );
}
