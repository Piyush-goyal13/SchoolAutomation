const Exam = require('../models/Exam');
const Marks = require('../models/Marks');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const PDFParser = require('pdf2json');

// Teacher: upload PDF → extract text → generate MCQs → return preview (not saved yet)
const generateExam = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'PDF file is required' });

        const { title, class: cls, section, scheduledAt, durationMinutes, numQuestions } = req.body;
        if (!title || !cls || !section || !scheduledAt || !durationMinutes) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

        // Extract text from PDF buffer
        const text = await new Promise((resolve, reject) => {
            const parser = new PDFParser();
            parser.on('pdfParser_dataReady', (data) => {
                const text = data.Pages.map(page =>
                    page.Texts.map(t => decodeURIComponent(t.R.map(r => r.T).join(''))).join(' ')
                ).join('\n').slice(0, 8000);
                resolve(text);
            });
            parser.on('pdfParser_dataError', reject);
            parser.parseBuffer(req.file.buffer);
        });

        const count = Math.min(parseInt(numQuestions) || 10, 20);

        // Generate MCQs via Groq
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen/qwen3.8-27b',
                messages: [{ role: 'user', content: `You are a teacher creating a multiple choice quiz. Based on the following content, generate exactly ${count} MCQ questions.

Rules:
- Each question must have exactly 4 options (A, B, C, D)
- Only one option is correct
- Return ONLY a valid JSON array, no markdown, no explanation
- Format: [{"question":"...","options":["A","B","C","D"],"correctIndex":0}]
- correctIndex is 0-based (0=A, 1=B, 2=C, 3=D)

Content:
${text}` }],
                temperature: 0.7
            })
        });

        const groqData = await groqRes.json();
        if (!groqRes.ok) throw new Error(groqData.error?.message || 'Groq API error');

        const raw = groqData.choices[0].message.content.trim();
        const match = raw.match(/\[.*\]/s);
        if (!match) throw new Error('Groq did not return a valid JSON array');
        const questions = JSON.parse(match[0]);

        res.status(200).json({
            title,
            subject: teacher.subject,
            class: cls,
            section,
            scheduledAt,
            durationMinutes: Number(durationMinutes),
            totalMarks: questions.length,
            questions
        });
    } catch (error) {
        console.error('Generate exam error:', error);
        res.status(500).json({ message: 'Error generating exam', error: error.message });
    }
};

// Teacher: save the confirmed exam
const saveExam = async (req, res) => {
    try {
        const { title, subject, class: cls, section, scheduledAt, durationMinutes, questions } = req.body;
        if (!title || !cls || !section || !scheduledAt || !questions?.length) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const exam = await Exam.create({
            title,
            subject,
            teacherId: req.user._id,
            class: cls,
            section,
            questions,
            totalMarks: questions.length,
            durationMinutes: Number(durationMinutes) || 30,
            scheduledAt: new Date(scheduledAt),
            submissions: []
        });

        res.status(201).json({ message: 'Exam scheduled successfully', examId: exam._id });
    } catch (error) {
        res.status(500).json({ message: 'Error saving exam', error: error.message });
    }
};

// Teacher: get all exams they created
const getMyExams = async (req, res) => {
    try {
        const exams = await Exam.find({ teacherId: req.user._id })
            .select('-questions -submissions')
            .sort({ scheduledAt: -1 });
        res.status(200).json(exams);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exams', error: error.message });
    }
};

// Teacher: delete an exam
const deleteExam = async (req, res) => {
    try {
        const exam = await Exam.findOne({ _id: req.params.id, teacherId: req.user._id });
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        await exam.deleteOne();
        res.status(200).json({ message: 'Exam deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting exam', error: error.message });
    }
};

// Teacher: get exam results with student scores
const getExamResults = async (req, res) => {
    try {
        const exam = await Exam.findOne({ _id: req.params.id, teacherId: req.user._id })
            .populate('submissions.studentId', 'name');
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        const results = exam.submissions.map(s => ({
            studentId: s.studentId._id,
            name: s.studentId.name,
            score: s.score,
            totalMarks: exam.totalMarks,
            percentage: Math.round((s.score / exam.totalMarks) * 100),
            submittedAt: s.submittedAt
        }));

        res.status(200).json({ title: exam.title, subject: exam.subject, results });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching results', error: error.message });
    }
};

// Student: get live exams for their class/section (questions without correctIndex)
const getLiveExams = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const now = new Date();
        const exams = await Exam.find({
            class: student.class,
            section: student.section,
            scheduledAt: { $lte: now }
        }).select('-submissions');

        // Filter: within duration window + student hasn't submitted
        const allExams = await Exam.find({
            class: student.class,
            section: student.section,
            scheduledAt: { $lte: now }
        });

        const available = allExams.filter(exam => {
            const endTime = new Date(exam.scheduledAt.getTime() + exam.durationMinutes * 60000);
            const isLive = now <= endTime;
            const hasSubmitted = exam.submissions.some(s => String(s.studentId) === String(req.user._id));
            return isLive && !hasSubmitted;
        }).map(exam => ({
            _id: exam._id,
            title: exam.title,
            subject: exam.subject,
            totalMarks: exam.totalMarks,
            durationMinutes: exam.durationMinutes,
            scheduledAt: exam.scheduledAt,
            questions: exam.questions.map(q => ({
                question: q.question,
                options: q.options
                // correctIndex intentionally omitted
            }))
        }));

        res.status(200).json(available);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exams', error: error.message });
    }
};

// Student: get upcoming exams (not yet live)
const getUpcomingExams = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const now = new Date();
        const exams = await Exam.find({
            class: student.class,
            section: student.section,
            scheduledAt: { $gt: now }
        }).select('title subject totalMarks durationMinutes scheduledAt').sort({ scheduledAt: 1 });

        res.status(200).json(exams);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching upcoming exams', error: error.message });
    }
};

// Student: get completed exams with their score
const getCompletedExams = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const exams = await Exam.find({
            class: student.class,
            section: student.section,
            'submissions.studentId': req.user._id
        }).select('title subject totalMarks scheduledAt submissions');

        const result = exams.map(exam => {
            const sub = exam.submissions.find(s => String(s.studentId) === String(req.user._id));
            return {
                _id: exam._id,
                title: exam.title,
                subject: exam.subject,
                totalMarks: exam.totalMarks,
                score: sub.score,
                percentage: Math.round((sub.score / exam.totalMarks) * 100),
                submittedAt: sub.submittedAt
            };
        });

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching completed exams', error: error.message });
    }
};

// Student: submit exam answers
const submitExam = async (req, res) => {
    try {
        const { answers } = req.body; // array of chosen option indices
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        const now = new Date();
        const endTime = new Date(exam.scheduledAt.getTime() + exam.durationMinutes * 60000);
        if (now > endTime) return res.status(400).json({ message: 'Exam time has ended' });

        const alreadySubmitted = exam.submissions.some(s => String(s.studentId) === String(req.user._id));
        if (alreadySubmitted) return res.status(400).json({ message: 'Already submitted' });

        // Auto-grade
        let score = 0;
        exam.questions.forEach((q, i) => {
            if (answers[i] === q.correctIndex) score++;
        });

        exam.submissions.push({ studentId: req.user._id, answers, score });
        await exam.save();

        // Save to Marks collection so it appears in student results
        const student = await Student.findOne({ userId: req.user._id });
        await Marks.findOneAndUpdate(
            { studentId: req.user._id, subject: exam.subject, examType: 'Unit Test 1', class: student.class, section: student.section },
            { $set: { teacherId: exam.teacherId, marksObtained: score, totalMarks: exam.totalMarks } },
            { upsert: true }
        );

        res.status(200).json({ score, totalMarks: exam.totalMarks, percentage: Math.round((score / exam.totalMarks) * 100) });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting exam', error: error.message });
    }
};

module.exports = { generateExam, saveExam, getMyExams, deleteExam, getExamResults, getLiveExams, getUpcomingExams, getCompletedExams, submitExam };
