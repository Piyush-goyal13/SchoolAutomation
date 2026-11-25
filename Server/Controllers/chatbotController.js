const SYSTEM_PROMPT = `You are TechVeda AI Assistant, a helpful and friendly chatbot integrated into the TechVeda School Automation System. You assist students, teachers, and administrators with:

- Academic questions across all subjects (Math, Science, English, History, etc.)
- Study tips, exam preparation strategies, and learning techniques
- Explaining concepts in a clear, easy-to-understand way
- Helping with homework and assignments by guiding (not giving direct answers)
- General school-related queries

Rules:
- Keep responses concise and well-structured
- Use simple language appropriate for school students
- When explaining concepts, use examples where possible
- Be encouraging and supportive
- If asked something inappropriate or unrelated to education, politely redirect to academic topics
- Format responses with markdown when helpful (bullet points, bold, etc.)`;

const sendMessage = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Build messages array with system prompt + conversation history + new message
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT }
        ];

        // Add conversation history (limit to last 20 messages to stay within token limits)
        if (history && Array.isArray(history)) {
            const recentHistory = history.slice(-20);
            messages.push(...recentHistory);
        }

        messages.push({ role: 'user', content: message.trim() });

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen/qwen3.8-27b',
                messages,
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        const groqData = await groqRes.json();

        if (!groqRes.ok) {
            throw new Error(groqData.error?.message || 'Groq API error');
        }

        const reply = groqData.choices[0].message.content.trim();

        res.status(200).json({ reply });
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ message: 'Error getting response', error: error.message });
    }
};

module.exports = { sendMessage };
