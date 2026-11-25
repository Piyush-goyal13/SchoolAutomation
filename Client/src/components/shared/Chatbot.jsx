import React, { useState, useRef, useEffect } from 'react';
import API from '../../api/axious';
import './Chatbot.css';

const ROLE_GREETINGS = {
    admin: "Hi Admin! 👋 I'm TechVeda AI — your intelligent school management assistant.\n\n**What I can do:**\n- 📊 **Data Queries** — Ask about students, teachers, fees, attendance, marks\n- 🔮 **Predictive Insights** — At-risk students, performance trends, fee analytics\n- 📚 **Knowledge Base (RAG)** — School policies, rules, procedures, guidelines\n- 💬 **General Chat** — Academic questions, management advice\n\nTry: *\"Which students have attendance below 65%?\"* or *\"What is the fee policy?\"*",
    teacher: "Hi Teacher! 👋 I'm TechVeda AI — your teaching assistant.\n\n**What I can do:**\n- 📋 **Your Section** — View your students, attendance, marks\n- 🧠 **Exam Info** — Your created exams and results\n- 📚 **School Policies** — Rules, guidelines, procedures\n- 💬 **Academic Help** — Subject questions, teaching tips\n\nTry: *\"How is my section's attendance?\"* or *\"What is the exam grading system?\"*",
    student: "Hi! 👋 I'm TechVeda AI — your personal study assistant.\n\n**What I can do:**\n- 📊 **Your Performance** — Attendance, marks, fees status\n- 📚 **School Info** — Policies, rules, exam guidelines\n- 🎓 **Academic Help** — Explain concepts, study tips, exam prep\n- 💬 **General Questions** — Anything school-related\n\nTry: *\"What's my attendance percentage?\"* or *\"Give me tips for exam preparation\"*"
};

const Chatbot = () => {
    const role = localStorage.getItem('role') || 'student';
    const [messages, setMessages] = useState([
        { role: 'assistant', content: ROLE_GREETINGS[role] || ROLE_GREETINGS.student }
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
            const history = messages.filter((_, i) => i > 0).map(m => ({
                role: m.role,
                content: m.content
            }));

            const res = await API.post('/chatbot/message', {
                message: trimmed,
                history
            });

            const meta = res.data._meta;
            let reply = res.data.reply;

            // Add pipeline metadata as a subtle footer
            if (meta) {
                const badges = [];
                if (meta.intent) badges.push(`🧠 ${meta.intent}`);
                if (meta.toolsUsed?.length > 0) badges.push(`🔧 ${meta.toolsUsed.length} tool(s)`);
                if (meta.insightsGenerated > 0) badges.push(`📊 ${meta.insightsGenerated} insight(s)`);
                if (meta.ragUsed) badges.push('📚 RAG');
                if (badges.length > 0) {
                    reply += `\n\n---\n*${badges.join(' • ')}*`;
                }
            }

            setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
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
            { role: 'assistant', content: ROLE_GREETINGS[role] || ROLE_GREETINGS.student }
        ]);
    };

    const formatMessage = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/^---$/gm, '<hr/>')
            .replace(/\n/g, '<br/>');
    };

    return (
        <div className="cb-wrap">
            <div className="cb-header">
                <div className="cb-header-left">
                    <div className="cb-avatar">🤖</div>
                    <div>
                        <h2>TechVeda AI Assistant</h2>
                        <p>Powered by AI Agent • RAG • Predictive Analytics</p>
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
                    placeholder="Ask about data, policies, academics, or insights..."
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
