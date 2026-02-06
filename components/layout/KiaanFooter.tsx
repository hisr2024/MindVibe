'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
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
 *
 * Mobile-optimized features:
 * - Smooth spring animations
 * - Haptic feedback
 * - Swipe to minimize
 * - Better touch targets
 * - Keyboard-aware positioning
 */

// Animation variants for the chat panel
const panelVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 35,
    }
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 28,
    }
  },
};

// Animation variants for messages
const messageVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 350,
      damping: 25,
    }
  },
};

// Avatar animation states
const avatarVariants = {
  idle: {
    scale: [1, 1.03, 1],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
  thinking: {
    scale: [1, 1.08, 1],
    boxShadow: [
      '0 0 20px rgba(255, 115, 39, 0.4)',
      '0 0 35px rgba(255, 115, 39, 0.6)',
      '0 0 20px rgba(255, 115, 39, 0.4)',
    ],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
};

// FAB animation variants
const fabVariants = {
  rest: {
    scale: 1,
    boxShadow: '0 8px 30px rgba(255, 115, 39, 0.35)',
  },
  hover: {
    scale: 1.08,
    boxShadow: '0 12px 40px rgba(255, 115, 39, 0.5)',
  },
  tap: {
    scale: 0.92,
    boxShadow: '0 4px 20px rgba(255, 115, 39, 0.25)',
  },
};

export function KiaanFooter() {
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const { showOriginal, toggleOriginal, getDisplayText, shouldShowToggle } = useChatTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
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
      // Small delay to ensure animation has started
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  // Handle drag to minimize
  const handleDragEnd = useCallback((
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false);
    // Minimize if dragged down more than 80px or with significant velocity
    if (info.offset.y > 80 || info.velocity.y > 400) {
      triggerHaptic('light');
      setIsExpanded(false);
    }
  }, [triggerHaptic]);

  const handleSendMessage = useCallback(async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    // Haptic feedback on send
    triggerHaptic('medium');

    // Generate UUID with fallback for browser compatibility
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
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
      }, (data.response?.length || 100) * STREAMING_SPEED_MS_PER_CHAR);

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

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
    triggerHaptic(isExpanded ? 'light' : 'medium');
  }, [isExpanded, triggerHaptic]);

  const quickPrompts = [
    { id: 'anxiety', emoji: '😰', text: t('kiaan.quickPrompts.scenarios.anxiety.label', 'Calm anxiety'), prompt: t('kiaan.quickPrompts.scenarios.anxiety.prompt', "I'm feeling anxious and need help finding calm.") },
    { id: 'heavy', emoji: '💔', text: t('kiaan.quickPrompts.scenarios.heavy.label', 'Heavy heart'), prompt: t('kiaan.quickPrompts.scenarios.heavy.prompt', 'My heart feels heavy today. I need support.') },
    { id: 'clarity', emoji: '🧭', text: t('kiaan.quickPrompts.scenarios.clarity.label', 'Find clarity'), prompt: t('kiaan.quickPrompts.scenarios.clarity.prompt', 'I need clarity on a situation.') },
    { id: 'peace', emoji: '🕊️', text: t('kiaan.quickPrompts.scenarios.peace.label', 'Find peace'), prompt: t('kiaan.quickPrompts.scenarios.peace.prompt', 'I need to find quiet peace within myself.') },
  ];

  if (shouldHide) return null;

  return (
    <div className="fixed bottom-[calc(88px+env(safe-area-inset-bottom,0px))] right-3 z-[60] p-2 md:bottom-8 md:right-8 md:p-0">
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            ref={panelRef}
            variants={panelVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="mb-3 w-[calc(100vw-24px)] max-w-[380px] overflow-hidden rounded-[24px] border border-orange-500/25 bg-gradient-to-b from-slate-900/[0.98] via-slate-900/95 to-slate-950/[0.98] shadow-2xl shadow-black/40 backdrop-blur-xl md:mb-4 md:w-[420px] md:max-w-none md:rounded-[28px]"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
          >
            {/* Top glow accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

            {/* Drag handle for swipe to minimize */}
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <motion.div
                className="h-1 w-10 rounded-full bg-white/25"
                animate={{
                  backgroundColor: isDragging ? 'rgba(255, 145, 89, 0.5)' : 'rgba(255, 255, 255, 0.25)',
                  scaleX: isDragging ? 1.15 : 1,
                }}
                transition={{ duration: 0.15 }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-orange-500/8 to-amber-500/8 px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <motion.div
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-400 shadow-lg shadow-orange-500/30"
                  variants={avatarVariants}
                  animate={isLoading ? 'thinking' : 'idle'}
                >
                  <span className="text-sm font-bold text-slate-900">K</span>
                </motion.div>
                <div>
                  <h3 className="text-sm font-semibold text-orange-50">{t('kiaan.chat.title', 'KIAAN Chat')}</h3>
                  <p className="text-[11px] text-orange-100/50">{t('kiaan.welcome.subtitle', 'Your mental wellness companion')}</p>
                </div>
              </div>
              <motion.button
                onClick={() => setIsExpanded(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-orange-100/60 hover:bg-white/10 hover:text-orange-50 transition-colors"
                aria-label="Minimize chat"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.button>
            </div>

            {/* Messages */}
            <div className="max-h-[50vh] min-h-[200px] overflow-y-auto p-4 space-y-3 md:max-h-[400px] md:min-h-[280px] smooth-touch-scroll">
              {messages.length === 0 ? (
                <motion.div
                  className="text-center py-6 space-y-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <motion.div
                    className="text-4xl"
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    🕉️
                  </motion.div>
                  <div>
                    <p className="text-sm text-orange-100/80 font-medium">{t('kiaan.welcome.title', 'Welcome to KIAAN')}</p>
                    <p className="text-xs text-orange-100/50 mt-1">{t('kiaan.chat.emptyState.subtitle', 'How can I support you today?')}</p>
                  </div>

                  {/* Quick prompts */}
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    {quickPrompts.map((prompt, idx) => (
                      <motion.button
                        key={prompt.id}
                        onClick={() => handleSendMessage(prompt.prompt)}
                        className="rounded-xl border border-orange-500/15 bg-white/[0.03] p-3 text-left transition-all hover:border-orange-400/30 hover:bg-white/[0.06] active:scale-[0.97]"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + idx * 0.05 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <div className="text-lg mb-1.5">{prompt.emoji}</div>
                        <div className="text-[11px] font-medium text-orange-50/90">{prompt.text}</div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      className="space-y-1"
                      variants={messageVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <motion.div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                            message.sender === 'user'
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                              : message.status === 'error'
                              ? 'bg-red-500/15 border border-red-500/25 text-red-100'
                              : 'bg-white/[0.06] text-orange-50 border border-white/5'
                          }`}
                          whileTap={{ scale: 0.99 }}
                        >
                          {message.isStreaming && message.sender === 'assistant' ? (
                            <StreamingText text={getDisplayText(message)} />
                          ) : (
                            <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{getDisplayText(message)}</p>
                          )}
                          <p className="text-[10px] mt-1.5 opacity-50">
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </motion.div>
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
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="rounded-2xl bg-white/[0.06] border border-white/5 px-4 py-3">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="h-2 w-2 rounded-full bg-orange-400"
                          animate={{
                            y: [0, -6, 0],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: 'easeInOut',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/5 bg-black/20 p-3">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('kiaan.chat.placeholder', 'Type your message...')}
                  disabled={isLoading}
                  className="flex-1 rounded-xl border border-orange-500/20 bg-white/[0.04] px-4 py-2.5 text-[14px] text-orange-50 placeholder:text-orange-100/35 focus:border-orange-400/40 focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:bg-white/[0.06] disabled:opacity-50 transition-all"
                />
                <motion.button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 transition-all disabled:opacity-40 disabled:shadow-none"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button - OM Icon */}
      <motion.button
        onClick={handleToggle}
        variants={fabVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        animate={isExpanded ? 'rest' : {
          boxShadow: [
            '0 8px 30px rgba(255, 115, 39, 0.35)',
            '0 12px 40px rgba(255, 115, 39, 0.5)',
            '0 8px 30px rgba(255, 115, 39, 0.35)',
          ],
          transition: {
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }
        }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-lg transition-all md:h-16 md:w-16"
        aria-label={isExpanded ? 'Close KIAAN chat' : 'Open KIAAN chat'}
      >
        {/* Inner glow ring */}
        <motion.span
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.2)',
          }}
        />

        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="h-6 w-6 text-white md:h-7 md:w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
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
  const { displayedText } = useStreamingText(text, { speed: 35 });

  return (
    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
      {displayedText}
      <motion.span
        className="inline-block w-0.5 h-4 ml-1 bg-orange-400 rounded-full"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
    </p>
  );
}

export default KiaanFooter;
