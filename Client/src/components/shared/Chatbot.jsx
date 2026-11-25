import React, { useState, useRef, useEffect } from 'react';
import API from '../../api/axious';
import './Chatbot.css';

const Chatbot = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! 👋 I\'m TechVeda AI Assistant. Ask me anything — academics, study tips, exam prep, or any school-related question. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        const userMessage = { role: 'user', content: trimmed };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Send conversation history (exclude the initial greeting)
            const history = messages.filter((_, i) => i > 0).map(m => ({
                role: m.role,
                content: m.content
            }));

            const res = await API.post('/chatbot/message', {
                message: trimmed,
                history
            });

            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I ran into an issue. Please try again in a moment.'
            }]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleClear = () => {
        setMessages([
            { role: 'assistant', content: 'Chat cleared! What would you like to talk about?' }
        ]);
    };

    const formatMessage = (text) => {
        // Basic markdown-like formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br/>');
    };

    return (
        <div className="cb-wrap">
            <div className="cb-header">
                <div className="cb-header-left">
                    <div className="cb-avatar">🤖</div>
                    <div>
                        <h2>TechVeda AI Assistant</h2>
                        <p>Ask anything about academics, study tips, or school</p>
                    </div>
                </div>
                <button className="cb-clear-btn" onClick={handleClear}>🗑️ Clear Chat</button>
            </div>

            <div className="cb-messages">
                {messages.map((msg, i) => (
                    <div key={i} className={`cb-msg ${msg.role}`}>
                        <div className="cb-msg-icon">
                            {msg.role === 'user' ? '👤' : '🤖'}
                        </div>
                        <div className="cb-msg-bubble">
                            <div
                                className="cb-msg-text"
                                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                            />
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="cb-msg assistant">
                        <div className="cb-msg-icon">🤖</div>
                        <div className="cb-msg-bubble">
                            <div className="cb-typing">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="cb-input-area" onSubmit={handleSend}>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={loading}
                    autoFocus
                />
                <button type="submit" disabled={loading || !input.trim()} className="cb-send-btn">
                    {loading ? '⏳' : '🚀'} Send
                </button>
            </form>
        </div>
    );
};

export default Chatbot;
