'use client';

import { useState, useCallback } from 'react';
import { KiaanChat, type Message } from '@/components/chat/KiaanChat';
import { apiCall, getErrorMessage } from '@/lib/api-client';
import Link from 'next/link';

/**
 * Dedicated KIAAN Chat Page
 * Full-featured chat interface moved from home page
 */
export default function KiaanChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

      {/* Chat Interface */}
      <div className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-4 shadow-[0_30px_120px_rgba(255,115,39,0.18)] backdrop-blur md:p-6">
        <KiaanChat
          messages={messages}
          onSendMessage={handleSendMessage}
          onSaveToJournal={handleSaveToJournal}
          isLoading={isLoading}
        />
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
