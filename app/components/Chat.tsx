import React, { useEffect, useRef, useState } from 'react';

const Chat = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        // Simulate receiving a new message after 2 seconds
        const handleNewMessage = () => {
            setMessages(prev => [...prev, `New message ${prev.length + 1}`]);
        };

        const interval = setInterval(handleNewMessage, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div>
            <div style={{ height: '400px', overflowY: 'scroll', border: '1px solid #ccc' }}>
                {messages.map((message, index) => (
                    <div key={index}>{message}</div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <input type="text" placeholder="Type a message..." />
        </div>
    );
};

export default Chat;