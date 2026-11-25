const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Fee = require('../models/Fee');
const Exam = require('../models/Exam');
const Notice = require('../models/Notice');
const KnowledgeBase = require('../models/KnowledgeBase');
const ChatbotLog = require('../models/ChatbotLog');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. TOOL DEFINITIONS — Agent's available capabilities
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TOOLS = {
    getStudentData: {
        description: 'Fetch student records with personal details',
        keywords: ['student', 'students', 'class', 'section', 'admission', 'parent', 'enroll'],
        allowedRoles: ['admin'],
        execute: async () => {
            const students = await Student.find().populate('userId', 'name email');
            return students.map(s => ({
                name: s.userId?.name, email: s.userId?.email,
                class: s.class, section: s.section,
                admissionNumber: s.admissionNumber,
                parentName: s.parentName, parentContact: s.parentContact
            }));
        }
    },

    getTeacherData: {
        description: 'Fetch teacher records with assignments',
        keywords: ['teacher', 'teachers', 'faculty', 'staff', 'subject'],
        allowedRoles: ['admin'],
        execute: async () => {
            const teachers = await Teacher.find().populate('userId', 'name email');
            return teachers.map(t => ({
                name: t.userId?.name, email: t.userId?.email,
                subject: t.subject,
                assignedClass: t.assignedClass, assignedSection: t.assignedSection
            }));
        }
    },

    getAttendanceData: {
        description: 'Fetch attendance records and statistics',
        keywords: ['attendance', 'absent', 'present', 'late', 'absent'],
        allowedRoles: ['admin', 'teacher', 'student'],
        execute: async (role, userId) => {
            let records;
            if (role === 'admin') {
                records = await Attendance.find().populate('studentId', 'name');
            } else if (role === 'teacher') {
                const teacher = await Teacher.findOne({ userId });
                if (!teacher?.assignedClass) return { records: [], message: 'No section assigned' };
                records = await Attendance.find({ class: teacher.assignedClass, section: teacher.assignedSection }).populate('studentId', 'name');
            } else {
                records = await Attendance.find({ studentId: userId }).populate('studentId', 'name');
            }

            const stats = { total: records.length, present: 0, absent: 0, late: 0 };
            const perStudent = {};
            records.forEach(r => {
                stats[r.status]++;
                const name = r.studentId?.name || 'Unknown';
                if (!perStudent[name]) perStudent[name] = { present: 0, absent: 0, late: 0, total: 0, class: r.class, section: r.section };
                perStudent[name][r.status]++;
                perStudent[name].total++;
            });

            return { stats, perStudent };
        }
    },

    getFeesData: {
        description: 'Fetch fee records and payment status',
        keywords: ['fee', 'fees', 'payment', 'paid', 'unpaid', 'dues', 'pending', 'collect'],
        allowedRoles: ['admin', 'student'],
        execute: async (role, userId) => {
            let fees;
            if (role === 'admin') {
                fees = await Fee.find().populate('studentId', 'name');
            } else {
                fees = await Fee.find({ studentId: userId });
            }

            const summary = { paid: 0, unpaid: 0, partial: 0, totalCollected: 0, totalPending: 0 };
            const unpaidList = [];
            fees.forEach(f => {
                summary[f.status]++;
                if (f.status === 'paid') summary.totalCollected += f.paidAmount;
                if (f.status === 'unpaid') {
                    summary.totalPending += f.totalAmount;
                    unpaidList.push({ name: f.studentId?.name || 'N/A', class: f.class, section: f.section, month: f.month, year: f.year, amount: f.totalAmount });
                }
                if (f.status === 'partial') {
                    summary.totalCollected += f.paidAmount;
                    summary.totalPending += (f.totalAmount - f.paidAmount);
                }
            });

            return { summary, unpaidList, records: fees.length };
        }
    },

    getMarksData: {
        description: 'Fetch marks and academic performance data',
        keywords: ['marks', 'score', 'performance', 'grade', 'topper', 'result', 'academic', 'rank'],
        allowedRoles: ['admin', 'teacher', 'student'],
        execute: async (role, userId) => {
            let marks;
            if (role === 'admin') {
                marks = await Marks.find().populate('studentId', 'name').populate('teacherId', 'name');
            } else if (role === 'teacher') {
                marks = await Marks.find({ teacherId: userId }).populate('studentId', 'name');
            } else {
                marks = await Marks.find({ studentId: userId });
            }

            // Aggregate by class-subject-examType
            const byExam = {};
            marks.forEach(m => {
                const key = `${m.class}-${m.section} ${m.subject} (${m.examType})`;
                if (!byExam[key]) byExam[key] = { scores: [], top: { name: '', marks: 0 } };
                byExam[key].scores.push(m.marksObtained);
                if (m.marksObtained > byExam[key].top.marks) {
                    byExam[key].top = { name: m.studentId?.name || 'Unknown', marks: m.marksObtained };
                }
            });

            const summary = Object.entries(byExam).map(([key, v]) => ({
                exam: key,
                average: Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length),
                highest: Math.max(...v.scores),
                lowest: Math.min(...v.scores),
                topper: v.top.name,
                count: v.scores.length
            }));

            return { summary, totalRecords: marks.length };
        }
    },

    getExamData: {
        description: 'Fetch exam schedules and results',
        keywords: ['exam', 'test', 'quiz', 'mcq', 'schedule', 'live'],
        allowedRoles: ['admin', 'teacher', 'student'],
        execute: async (role, userId) => {
            let exams;
            if (role === 'admin') {
                exams = await Exam.find().select('-questions').populate('teacherId', 'name');
            } else if (role === 'teacher') {
                exams = await Exam.find({ teacherId: userId }).select('-questions');
            } else {
                const student = await Student.findOne({ userId });
                if (!student) return [];
                exams = await Exam.find({ class: student.class, section: student.section }).select('-questions').populate('teacherId', 'name');
            }

            return exams.map(e => ({
                title: e.title, subject: e.subject,
                class: e.class, section: e.section,
                teacher: e.teacherId?.name, scheduledAt: e.scheduledAt,
                totalMarks: e.totalMarks, submissions: e.submissions?.length || 0
            }));
        }
    },

    getNoticeData: {
        description: 'Fetch notices and announcements',
        keywords: ['notice', 'announcement', 'circular', 'update'],
        allowedRoles: ['admin', 'teacher', 'student'],
        execute: async (role, userId) => {
            let query = {};
            if (role === 'teacher') {
                query = { $or: [{ audience: 'all' }, { audience: 'teachers' }] };
            } else if (role === 'student') {
                const student = await Student.findOne({ userId });
                query = {
                    $or: [
                        { audience: 'all' }, { audience: 'students' },
                        { audience: 'section', targetClass: student?.class, targetSection: student?.section }
                    ]
                };
            }

            const notices = await Notice.find(query).sort({ createdAt: -1 }).limit(10).populate('postedBy', 'name');
            return notices.map(n => ({
                title: n.title, content: n.content.slice(0, 150),
                postedBy: n.postedBy?.name, audience: n.audience,
                priority: n.priority, date: n.createdAt
            }));
        }
    },

    searchKnowledge: {
        description: 'Search school knowledge base (RAG)',
        keywords: ['policy', 'rule', 'guideline', 'procedure', 'syllabus', 'calendar', 'conduct', 'uniform', 'leave', 'admission', 'fee structure'],
        allowedRoles: ['admin', 'teacher', 'student'],
        execute: async (_role, _userId, query) => {
            // MongoDB full-text search (RAG retrieval)
            let docs = [];
            try {
                docs = await KnowledgeBase.find(
                    { $text: { $search: query } },
                    { score: { $meta: 'textScore' } }
                ).sort({ score: { $meta: 'textScore' } }).limit(3);
            } catch (e) {
                // Fallback: regex search if text index isn't ready
                const regex = new RegExp(query.split(' ').join('|'), 'i');
                docs = await KnowledgeBase.find({
                    $or: [{ title: regex }, { content: regex }, { tags: regex }]
                }).limit(3);
            }

            if (docs.length === 0) return { found: false, message: 'No matching documents in knowledge base' };

            return {
                found: true,
                documents: docs.map(d => ({
                    title: d.title,
                    category: d.category,
                    content: d.content
                }))
            };
        }
    }
};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. INTENT CLASSIFIER — Determines what the user wants
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOTE: Uses keyword-based classification for zero-latency routing.
// In production, swap with LLM-based classification for nuance:
//   const intent = await classifyWithLLM(message);

const INTENT_PATTERNS = {
    data_query: {
        keywords: ['how many', 'list', 'show', 'count', 'total', 'who', 'which', 'get', 'fetch', 'tell me about', 'details of'],
        subPatterns: ['student', 'teacher', 'fee', 'attendance', 'marks', 'exam', 'notice']
    },
    insights: {
        keywords: ['predict', 'risk', 'trend', 'analysis', 'insight', 'at risk', 'failing', 'improve', 'declining', 'compare', 'comparison', 'best', 'worst', 'top', 'bottom', 'summary', 'overview', 'report', 'analytics']
    },
    knowledge: {
        keywords: ['policy', 'rule', 'guideline', 'procedure', 'calendar', 'schedule', 'syllabus', 'conduct', 'uniform', 'leave', 'admission process', 'fee structure', 'grading system', 'exam rule', 'what is the rule', 'what is the policy', 'how to apply', 'when is']
    },
    academic: {
        keywords: ['explain', 'what is', 'how does', 'solve', 'define', 'calculate', 'formula', 'theorem', 'equation', 'concept', 'difference between', 'example of', 'study tip', 'prepare for']
    }
};

function classifyIntent(message) {
    const lower = message.toLowerCase();

    // Check insights first (more specific)
    if (INTENT_PATTERNS.insights.keywords.some(k => lower.includes(k))) {
        return 'insights';
    }

    // Check knowledge base queries
    if (INTENT_PATTERNS.knowledge.keywords.some(k => lower.includes(k))) {
        return 'knowledge';
    }

    // Check data queries
    const hasQueryWord = INTENT_PATTERNS.data_query.keywords.some(k => lower.includes(k));
    const hasDataSubject = INTENT_PATTERNS.data_query.subPatterns.some(k => lower.includes(k));
    if (hasQueryWord && hasDataSubject) {
        return 'data_query';
    }
    // Even without query words, if the message is clearly about data
    if (hasDataSubject && !INTENT_PATTERNS.academic.keywords.some(k => lower.includes(k))) {
        return 'data_query';
    }

    // Check academic questions
    if (INTENT_PATTERNS.academic.keywords.some(k => lower.includes(k))) {
        return 'academic';
    }

    return 'general';
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. TOOL SELECTOR — Picks which tools to execute based on intent
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function selectTools(intent, message, role) {
    const lower = message.toLowerCase();
    const selected = [];

    if (intent === 'knowledge') {
        selected.push('searchKnowledge');
        return selected;
    }

    if (intent === 'academic' || intent === 'general') {
        // No tools needed — direct LLM response
        return selected;
    }

    // For data_query and insights, select relevant tools
    for (const [toolName, tool] of Object.entries(TOOLS)) {
        if (toolName === 'searchKnowledge') continue; // handled above

        // Check role access
        if (!tool.allowedRoles.includes(role)) continue;

        // Check keyword match
        if (tool.keywords.some(k => lower.includes(k))) {
            selected.push(toolName);
        }
    }

    // For insights, also load attendance + marks + fees if not already selected
    if (intent === 'insights') {
        const insightTools = ['getAttendanceData', 'getMarksData'];
        if (role === 'admin') insightTools.push('getFeesData', 'getStudentData');
        insightTools.forEach(t => {
            if (!selected.includes(t) && TOOLS[t].allowedRoles.includes(role)) {
                selected.push(t);
            }
        });
    }

    // If no specific tools matched but it's a data query, load common ones
    if (selected.length === 0 && intent === 'data_query') {
        if (role === 'admin') selected.push('getStudentData', 'getTeacherData');
        else if (role === 'teacher') selected.push('getAttendanceData', 'getMarksData');
        else selected.push('getAttendanceData', 'getMarksData', 'getFeesData');
    }

    return selected;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. TOOL EXECUTOR — Runs selected tools in parallel
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function executeTools(selectedTools, role, userId, query) {
    const results = {};

    await Promise.all(selectedTools.map(async (toolName) => {
        try {
            const tool = TOOLS[toolName];

            // ── Defense-in-depth: Re-validate role at execution time ──
            // Even if tool selection passed, block execution if role doesn't match.
            // Prevents privilege escalation if selectTools logic has a bug.
            if (!tool.allowedRoles.includes(role)) {
                console.warn(`[TOOL GUARD] Blocked ${toolName} for role=${role}`);
                results[toolName] = { error: 'Access denied for your role' };
                return;
            }

            results[toolName] = await tool.execute(role, userId, query);
        } catch (error) {
            results[toolName] = { error: error.message };
        }
    }));

    return results;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. INSIGHTS ENGINE — Generates predictive analytics from data
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateInsights(toolResults) {
    const insights = [];

    // ── At-Risk Students (attendance < 65% OR if marks data shows low scores)
    const attendanceData = toolResults.getAttendanceData;
    if (attendanceData?.perStudent) {
        const atRisk = Object.entries(attendanceData.perStudent)
            .filter(([, s]) => s.total >= 5 && (s.present / s.total) < 0.65)
            .map(([name, s]) => ({ name, attendance: Math.round((s.present / s.total) * 100), class: s.class, section: s.section }));

        if (atRisk.length > 0) {
            insights.push({
                type: 'AT_RISK_ATTENDANCE',
                severity: 'high',
                title: 'Students at Risk — Low Attendance',
                description: `${atRisk.length} student(s) have attendance below 65%`,
                data: atRisk
            });
        }
    }

    // ── Academic Performance Insights
    const marksData = toolResults.getMarksData;
    if (marksData?.summary?.length > 0) {
        // Find subjects with low class average (below 50%)
        const weakSubjects = marksData.summary.filter(s => s.average < 50);
        if (weakSubjects.length > 0) {
            insights.push({
                type: 'WEAK_SUBJECTS',
                severity: 'medium',
                title: 'Subjects Needing Attention — Low Class Average',
                description: `${weakSubjects.length} exam(s) have class average below 50%`,
                data: weakSubjects.map(s => ({ exam: s.exam, average: s.average, lowest: s.lowest }))
            });
        }

        // Top performers
        const toppers = marksData.summary
            .filter(s => s.topper)
            .map(s => ({ exam: s.exam, topper: s.topper, highest: s.highest }));
        if (toppers.length > 0) {
            insights.push({
                type: 'TOP_PERFORMERS',
                severity: 'info',
                title: 'Top Performers',
                data: toppers
            });
        }
    }

    // ── Fee Collection Insights
    const feeData = toolResults.getFeesData;
    if (feeData?.summary) {
        const totalRecords = feeData.summary.paid + feeData.summary.unpaid + feeData.summary.partial;
        const collectionRate = totalRecords > 0 ? Math.round((feeData.summary.paid / totalRecords) * 100) : 0;

        insights.push({
            type: 'FEE_COLLECTION',
            severity: collectionRate < 50 ? 'high' : collectionRate < 75 ? 'medium' : 'info',
            title: 'Fee Collection Rate',
            description: `${collectionRate}% of fees collected (${feeData.summary.paid}/${totalRecords})`,
            data: {
                collected: `₹${feeData.summary.totalCollected}`,
                pending: `₹${feeData.summary.totalPending}`,
                defaulters: feeData.unpaidList?.length || 0
            }
        });
    }

    // ── Attendance Overview
    if (attendanceData?.stats?.total > 0) {
        const rate = Math.round((attendanceData.stats.present / attendanceData.stats.total) * 100);
        insights.push({
            type: 'ATTENDANCE_OVERVIEW',
            severity: rate < 70 ? 'high' : rate < 85 ? 'medium' : 'info',
            title: 'Overall Attendance Rate',
            description: `School-wide attendance is at ${rate}%`,
            data: attendanceData.stats
        });
    }

    return insights;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. CONVERSATION SUMMARIZER — Compresses history to save tokens
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOTE: Uses extractive summarization for zero-latency.
// In production, use LLM-based abstractive summarization:
//   const summary = await summarizeWithLLM(olderMessages);

function summarizeHistory(history) {
    if (!history || history.length <= 6) return { summary: null, recentMessages: history || [] };

    const olderMessages = history.slice(0, -4);
    const recentMessages = history.slice(-4);

    // Extract key topics from older messages
    const topics = new Set();
    const keyPoints = [];

    olderMessages.forEach(msg => {
        const content = msg.content.toLowerCase();
        // Extract mentioned entities
        const entities = ['student', 'teacher', 'fee', 'attendance', 'marks', 'exam', 'notice', 'timetable', 'policy'];
        entities.forEach(e => { if (content.includes(e)) topics.add(e); });

        // Keep user questions as key points (shortened)
        if (msg.role === 'user' && msg.content.length > 10) {
            keyPoints.push(msg.content.slice(0, 80));
        }
    });

    const summary = `[Previous discussion covered: ${[...topics].join(', ') || 'general topics'}. User asked about: ${keyPoints.slice(-3).join('; ') || 'various questions'}]`;

    return { summary, recentMessages };
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. CONTEXT BUILDER — Assembles the final prompt
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function buildSystemPrompt(role, intent, toolResults, insights, ragResults) {
    let prompt = `You are TechVeda AI Assistant — an intelligent, data-aware school management chatbot.\n`;
    prompt += `Current user role: ${role.toUpperCase()}\n`;
    prompt += `Detected intent: ${intent}\n\n`;

    // Role-specific instructions
    if (role === 'admin') {
        prompt += `You have FULL access to all school data. Answer with real data when available.\n`;
    } else if (role === 'teacher') {
        prompt += `You can see ONLY your section's student names, your marks, and your exams. You CANNOT access student personal details, fees, or other teachers' data. Decline such requests politely.\n`;
    } else {
        prompt += `You can see ONLY your own data (attendance, marks, fees). You CANNOT access other students' or teachers' data. Decline such requests politely.\n`;
    }

    prompt += `\nRules:\n- Use real data from TOOL RESULTS below when available\n- Keep responses concise (under 200 words unless detailed breakdown needed)\n- Use markdown formatting (bold, bullet points, tables) for readability\n- If data isn't available, say so honestly\n`;

    // Add tool results
    if (Object.keys(toolResults).length > 0) {
        prompt += `\n━━━ TOOL RESULTS (fetched from database) ━━━\n`;
        for (const [tool, data] of Object.entries(toolResults)) {
            prompt += `\n[${tool}]:\n${JSON.stringify(data, null, 1).slice(0, 2000)}\n`;
        }
    }

    // Add insights
    if (insights.length > 0) {
        prompt += `\n━━━ AI INSIGHTS (predictive analytics) ━━━\n`;
        insights.forEach(i => {
            prompt += `⚠️ [${i.severity.toUpperCase()}] ${i.title}: ${i.description || ''}\n`;
            prompt += `   Data: ${JSON.stringify(i.data).slice(0, 500)}\n`;
        });
    }

    // Add RAG results
    if (ragResults?.found) {
        prompt += `\n━━━ KNOWLEDGE BASE (RAG retrieval) ━━━\n`;
        ragResults.documents.forEach(doc => {
            prompt += `📄 ${doc.title} [${doc.category}]:\n${doc.content}\n\n`;
        });
    }

    return prompt;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. GROQ API CALLER — With retry logic for rate limits
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function callGroq(messages, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
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
                max_tokens: 512
            })
        });

        const groqData = await groqRes.json();

        if (groqRes.status === 429 && attempt < retries) {
            console.log(`Rate limited, retrying in 5s... (attempt ${attempt + 1})`);
            await sleep(5000);
            continue;
        }

        if (!groqRes.ok) throw new Error(groqData.error?.message || 'Groq API error');
        return groqData;
    }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 9. MAIN AGENT HANDLER — Orchestrates the full pipeline
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Pipeline:
//   User Message
//     → Intent Classification (keyword-based, zero latency)
//     → Tool Selection (picks DB queries based on intent + role)
//     → Tool Execution (parallel DB queries)
//     → Insights Engine (predictive analytics from data)
//     → RAG Retrieval (knowledge base search if needed)
//     → Conversation Summarization (compress old history)
//     → Context Assembly (build system prompt with all results)
//     → LLM Call (single Groq API call for final response)
//     → Response
//

const sendMessage = async (req, res) => {
    const startTime = req.chatbotMeta?.startTime || Date.now();

    try {
        const { message, history } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const role = req.user.role;
        const userId = req.user._id;
        const userMessage = message.trim();

        // ── Step 1: Classify intent
        const intent = classifyIntent(userMessage);

        // ── Step 2: Select tools
        const selectedTools = selectTools(intent, userMessage, role);

        // ── Step 3: Execute tools in parallel
        const toolResults = selectedTools.length > 0
            ? await executeTools(selectedTools, role, userId, userMessage)
            : {};

        // ── Step 4: Generate insights (only for data/insight queries)
        const insights = (intent === 'insights' || intent === 'data_query')
            ? generateInsights(toolResults)
            : [];

        // ── Step 5: RAG retrieval (for knowledge queries, or as supplementary)
        let ragResults = null;
        if (intent === 'knowledge' || selectedTools.includes('searchKnowledge')) {
            ragResults = toolResults.searchKnowledge || null;
        }

        // ── Step 6: Summarize conversation history
        const { summary, recentMessages } = summarizeHistory(history || []);

        // ── Step 7: Build the system prompt with all context
        const systemPrompt = buildSystemPrompt(role, intent, toolResults, insights, ragResults);

        // ── Step 8: Assemble messages for LLM
        const messages = [{ role: 'system', content: systemPrompt }];

        if (summary) {
            messages.push({ role: 'system', content: `Conversation summary: ${summary}` });
        }

        if (recentMessages.length > 0) {
            messages.push(...recentMessages);
        }

        messages.push({ role: 'user', content: userMessage });

        // ── Step 9: Call LLM
        const groqData = await callGroq(messages);
        const reply = groqData.choices[0].message.content.trim();
        const tokensUsed = groqData.usage?.total_tokens || 0;

        const responseTimeMs = Date.now() - startTime;

        // ── Step 10: Log to observability store (non-blocking) ──
        ChatbotLog.create({
            userId,
            userName: req.user.name,
            role,
            message: userMessage,
            intent,
            toolsUsed: selectedTools,
            insightsGenerated: insights.length,
            ragUsed: !!ragResults?.found,
            responseTimeMs,
            tokensUsed,
            success: true
        }).catch(err => console.error('[OBSERVABILITY] Log write failed:', err.message));

        console.log(`[CHATBOT] ${role}:${req.user.name} | intent=${intent} | tools=[${selectedTools}] | insights=${insights.length} | rag=${!!ragResults?.found} | ${responseTimeMs}ms | ${tokensUsed} tokens`);

        // ── Step 11: Return response with metadata
        res.status(200).json({
            reply,
            _meta: {
                intent,
                toolsUsed: selectedTools,
                insightsGenerated: insights.length,
                ragUsed: !!ragResults?.found,
                responseTimeMs,
                tokensUsed
            }
        });

    } catch (error) {
        const responseTimeMs = Date.now() - startTime;
        console.error(`[CHATBOT ERROR] ${req.user?.role}:${req.user?.name} | ${responseTimeMs}ms |`, error.message);

        // Log error to observability store (non-blocking)
        ChatbotLog.create({
            userId: req.user?._id,
            userName: req.user?.name || 'unknown',
            role: req.user?.role || 'unknown',
            message: req.body?.message || '',
            responseTimeMs,
            success: false,
            error: error.message
        }).catch(() => {});

        res.status(500).json({ message: 'Error getting response', error: error.message });
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 10. ANALYTICS ENDPOINT — Observability dashboard data
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const getAnalytics = async (req, res) => {
    try {
        const totalLogs = await ChatbotLog.countDocuments();
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [
            intentDistribution,
            roleDistribution,
            recentErrors,
            avgResponseTime,
            toolUsage,
            ragUsageCount,
            dailyCount
        ] = await Promise.all([
            // Intent distribution
            ChatbotLog.aggregate([
                { $group: { _id: '$intent', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            // Role distribution
            ChatbotLog.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } }
            ]),
            // Recent errors
            ChatbotLog.find({ success: false })
                .sort({ createdAt: -1 }).limit(5)
                .select('userName role message error createdAt'),
            // Average response time
            ChatbotLog.aggregate([
                { $group: { _id: null, avg: { $avg: '$responseTimeMs' }, max: { $max: '$responseTimeMs' } } }
            ]),
            // Tool usage frequency
            ChatbotLog.aggregate([
                { $unwind: '$toolsUsed' },
                { $group: { _id: '$toolsUsed', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            // RAG usage count
            ChatbotLog.countDocuments({ ragUsed: true }),
            // Messages in last 24h
            ChatbotLog.countDocuments({ createdAt: { $gte: last24h } })
        ]);

        res.status(200).json({
            overview: {
                totalMessages: totalLogs,
                messagesLast24h: dailyCount,
                ragQueries: ragUsageCount,
                avgResponseTimeMs: Math.round(avgResponseTime[0]?.avg || 0),
                maxResponseTimeMs: avgResponseTime[0]?.max || 0
            },
            intentDistribution,
            roleDistribution,
            toolUsage,
            recentErrors
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
};

module.exports = { sendMessage, getAnalytics };
