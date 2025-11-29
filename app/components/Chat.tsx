import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Send } from 'lucide-react';
import { apiFetch } from '@/lib/api';

type Role = 'user' | 'assistant';

type ChatMessage = {
    id: string;
    role: Role;
    content: string;
    status?: 'pending' | 'error';
};

const Chat = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isLoadingSession, setIsLoadingSession] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        startSession();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const startSession = async () => {
        setIsLoadingSession(true);
        setError(null);
        try {
            const response = await apiFetch('/api/chat/start', { method: 'POST' });
            if (!response.ok) {
                throw new Error('Failed to start session');
            }
            const data = await response.json();
            setSessionId(data.session_id);
            setMessages([
                {
                    id: data.session_id,
                    role: 'assistant',
                    content: data.message,
                },
            ]);
        } catch (err) {
            setError('Unable to connect to KIAAN. Please try again.');
        } finally {
            setIsLoadingSession(false);
        }
    };

    const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!input.trim()) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input.trim(),
        };

        const pendingAssistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: 'KIAAN is thinking... 💭',
            status: 'pending',
        };

        setMessages(prev => [...prev, userMessage, pendingAssistantMessage]);
        setInput('');
        setIsSending(true);
        setError(null);

        try {
            const response = await apiFetch(
                '/api/chat/message',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: userMessage.content }),
                },
                sessionId || undefined,
            );

            if (!response.ok) {
                throw new Error('KIAAN is taking a moment to respond.');
            }

            const data = await response.json();
            setMessages(prev =>
                prev.map(message =>
                    message.id === pendingAssistantMessage.id
                        ? { ...message, content: data.response, status: undefined }
                        : message,
                ),
            );
        } catch (err) {
            setError('KIAAN is taking a moment... please try again.');
            setMessages(prev =>
                prev.map(message =>
                    message.id === pendingAssistantMessage.id
                        ? { ...message, content: 'Something went wrong. 💙', status: 'error' }
                        : message,
                ),
            );
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                {isLoadingSession ? (
                    <div className="flex h-full items-center justify-center gap-2 text-slate-600">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Connecting to KIAAN...</span>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map(message => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className={`mb-3 flex ${
                                    message.role === 'assistant' ? 'justify-start' : 'justify-end'
                                }`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg px-4 py-2 text-sm shadow-sm ${
                                        message.role === 'assistant'
                                            ? 'bg-indigo-50 text-indigo-900'
                                            : 'bg-emerald-50 text-emerald-900'
                                    } ${message.status === 'error' ? 'border border-red-300' : ''}`}
                                >
                                    {message.content}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
            </div>

            {error && <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

            <form onSubmit={sendMessage} className="flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    disabled={isSending || isLoadingSession}
                />
                <button
                    type="submit"
                    disabled={isSending || isLoadingSession}
                    className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                    aria-label="Send message"
                >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span>{isSending ? 'Sending...' : 'Send'}</span>
                </button>
            </form>
        </div>
    );
};

export default Chat;