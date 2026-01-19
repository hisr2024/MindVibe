'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { apiCall, getErrorMessage } from '@/lib/api-client';
import { useHapticFeedback, useStreamingText } from '@/hooks';
import { springConfigs } from '@/lib/animations/spring-configs';
import { useLanguage } from '@/hooks/useLanguage';
import { useChatTranslation } from '@/hooks/useChatTranslation';
import { ChatMessage, ChatAPIResponse } from '@/types/chat';
import { TranslationToggle } from '@/components/chat/TranslationToggle';

/**
 * KIAAN Footer with Expandable Chat Interface
 * Global footer component accessible from all pages
 * Full KIAAN chat functionality with expandable/collapsible interface
 */

export function KiaanFooter() {
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const { showOriginal, toggleOriginal, getDisplayText, shouldShowToggle } = useChatTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { triggerHaptic } = useHapticFeedback();

  // Animation timing constant
  const STREAMING_SPEED_MS_PER_CHAR = 20;

  // Don't show on the dedicated KIAAN chat page to avoid duplication
  const shouldHide = pathname === '/kiaan/chat';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isExpanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSendMessage = useCallback(async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    // Haptic feedback on send
    triggerHaptic('light');

    // Generate UUID with fallback for browser compatibility
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      // Fallback for older browsers
      return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await apiCall('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ 
          message: messageText,
          language: language || 'en' 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from KIAAN');
      }

      const data: ChatAPIResponse = await response.json();
      const assistantMessageId = generateId();
      
      // Add assistant message with streaming flag and translation info
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        sender: 'assistant',
        text: data.response || "I'm here for you. Let's try again. 💙",
        timestamp: new Date().toISOString(),
        isStreaming: true,
        translation: data.translation,
        language: data.language || language || 'en'
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingMessageId(assistantMessageId);

      // Complete streaming after a brief moment
      setTimeout(() => {
        setStreamingMessageId(null);
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
        triggerHaptic('success');
      }, data.response.length * STREAMING_SPEED_MS_PER_CHAR); // Simulate streaming based on text length

    } catch (error) {
      console.error('KIAAN chat error:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: generateId(),
        sender: 'assistant',
        text: getErrorMessage(error),
        timestamp: new Date().toISOString(),
        status: 'error',
      };

      setMessages(prev => [...prev, errorMessage]);
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, triggerHaptic, language]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    { id: 'anxiety', emoji: '😰', text: t('kiaan.quickPrompts.scenarios.anxiety.label', 'Calm anxiety'), prompt: t('kiaan.quickPrompts.scenarios.anxiety.prompt', "I'm feeling anxious and need help finding calm.") },
    { id: 'heavy', emoji: '💔', text: t('kiaan.quickPrompts.scenarios.heavy.label', 'Heavy heart'), prompt: t('kiaan.quickPrompts.scenarios.heavy.prompt', 'My heart feels heavy today. I need support.') },
    { id: 'clarity', emoji: '🧭', text: t('kiaan.quickPrompts.scenarios.clarity.label', 'Find clarity'), prompt: t('kiaan.quickPrompts.scenarios.clarity.prompt', 'I need clarity on a situation.') },
    { id: 'peace', emoji: '🕊️', text: t('kiaan.quickPrompts.scenarios.peace.label', 'Find peace'), prompt: t('kiaan.quickPrompts.scenarios.peace.prompt', 'I need to find quiet peace within myself.') },
  ];

  if (shouldHide) return null;

  // Enhanced footer animation variants
  const footerVariants = {
    collapsed: {
      height: 56,
      opacity: 0.95,
      y: 0,
      transition: springConfigs.smooth
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      y: 0,
      transition: springConfigs.smooth
    },
  };

  // Avatar animation states
  const avatarVariants = {
    idle: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
    thinking: {
      scale: [1, 1.1, 1],
      boxShadow: [
        '0 0 20px rgba(255, 115, 39, 0.4)',
        '0 0 40px rgba(255, 115, 39, 0.6)',
        '0 0 20px rgba(255, 115, 39, 0.4)',
      ],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
    celebrating: {
      rotate: [0, -10, 10, -10, 10, 0],
      scale: [1, 1.2, 1],
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <div className="fixed bottom-[76px] right-2 z-[60] p-2 md:bottom-8 md:right-8 md:p-0">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={footerVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="mb-4 w-[340px] max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-180px)] overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-br from-slate-900/98 via-slate-900/95 to-slate-900/98 shadow-2xl shadow-orange-500/30 backdrop-blur-xl md:w-[420px] md:max-h-[560px] md:rounded-[2rem]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-amber-500/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <motion.div 
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-300"
                  variants={avatarVariants}
                  animate={isLoading ? 'thinking' : 'idle'}
                >
                  <span className="text-sm font-bold text-slate-900">K</span>
                </motion.div>
                <div>
                  <h3 className="text-sm font-semibold text-orange-50">{t('kiaan.chat.title', 'KIAAN Chat')}</h3>
                  <p className="text-xs text-orange-100/60">{t('kiaan.welcome.subtitle', 'Your Guide to Inner Peace')}</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="rounded-lg p-1.5 text-orange-100/60 hover:bg-white/10 hover:text-orange-50 transition-colors"
                aria-label="Minimize chat"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="max-h-[calc(100vh-320px)] min-h-[200px] overflow-y-auto p-4 space-y-3 md:max-h-[420px] md:min-h-[320px] scrollbar-thin scrollbar-thumb-orange-500/20 scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-4xl">🕉️</div>
                  <div>
                    <p className="text-sm text-orange-100/80">{t('kiaan.welcome.title', 'Welcome to KIAAN Chat')}</p>
                    <p className="text-xs text-orange-100/60 mt-1">{t('kiaan.chat.emptyState.subtitle', 'How can I support you today?')}</p>
                  </div>
                  
                  {/* Quick prompts */}
                  <div className="grid grid-cols-2 gap-2 pt-4">
                    {quickPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt.prompt)}
                        className="rounded-xl border border-orange-500/20 bg-white/5 p-3 text-left transition-all hover:border-orange-400/40 hover:bg-white/10"
                      >
                        <div className="text-lg mb-1">{prompt.emoji}</div>
                        <div className="text-xs font-medium text-orange-50">{prompt.text}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      className="space-y-1"
                      initial={{ opacity: 0, x: message.sender === 'user' ? 20 : -20, y: 10 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      transition={springConfigs.smooth}
                    >
                      <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                            message.sender === 'user'
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                              : message.status === 'error'
                              ? 'bg-red-500/20 border border-red-500/30 text-red-100'
                              : 'bg-white/10 text-orange-50'
                          }`}
                        >
                          {message.isStreaming && message.sender === 'assistant' ? (
                            <StreamingText text={getDisplayText(message)} />
                          ) : (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{getDisplayText(message)}</p>
                          )}
                          <p className="text-[10px] mt-1 opacity-60">
                            {new Date(message.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                      {/* Show translation toggle for assistant messages with translations */}
                      {message.sender === 'assistant' && shouldShowToggle(message) && (
                        <div className="flex justify-start pl-2">
                          <TranslationToggle
                            showOriginal={showOriginal}
                            onToggle={toggleOriginal}
                            hasTranslation={true}
                            className="scale-90"
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </>
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-orange-400" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-orange-400" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-orange-400" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-orange-500/20 bg-white/5 p-3">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('kiaan.chat.placeholder', 'Type your message...')}
                  disabled={isLoading}
                  className="flex-1 rounded-xl border border-orange-500/30 bg-white/10 px-4 py-2 text-sm text-orange-50 placeholder:text-orange-100/40 focus:border-orange-400/50 focus:outline-none focus:ring-2 focus:ring-orange-400/30 disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {t('kiaan.chat.send', 'Send')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button - OM Icon */}
      <motion.button
        onClick={() => {
          setIsExpanded(!isExpanded);
          triggerHaptic('medium');
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={isExpanded ? {} : {
          boxShadow: [
            '0 20px 60px rgba(255, 115, 39, 0.4)',
            '0 20px 80px rgba(255, 115, 39, 0.6)',
            '0 20px 60px rgba(255, 115, 39, 0.4)',
          ],
        }}
        transition={{
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-2xl shadow-orange-500/50 transition-all hover:shadow-orange-500/70 md:h-16 md:w-16"
        aria-label={isExpanded ? 'Close KIAAN chat' : 'Open KIAAN chat'}
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="h-6 w-6 text-white md:h-7 md:w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="text-2xl md:text-3xl"
            >
              🕉️
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

// Streaming Text Component for typing effect
function StreamingText({ text }: { text: string }) {
  const { displayedText } = useStreamingText(text, { speed: 40 });
  
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">
      {displayedText}
      <span className="inline-block w-0.5 h-4 ml-1 bg-current animate-pulse" />
    </p>
  );
}

export default KiaanFooter;
