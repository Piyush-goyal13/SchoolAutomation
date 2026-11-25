const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Fee = require('../models/Fee');
const Exam = require('../models/Exam');
const Notice = require('../models/Notice');

const SYSTEM_PROMPT = `You are TechVeda AI Assistant, an intelligent chatbot integrated into the TechVeda School Automation System. You have access to real school data provided below.

Rules:
- Answer questions using the SCHOOL DATA provided — always prefer real data over generic advice
- Keep responses concise (under 200 words unless a detailed breakdown is needed)
- Use tables, bullet points, and bold for readability
- If the data doesn't contain what the user asked, say so honestly
- Be helpful, supportive, and professional
- You can also answer general academic and school management questions`;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch all school data for admin context
const fetchAdminContext = async () => {
    const [students, teachers, fees, attendance, marks, exams, notices] = await Promise.all([
        Student.find().populate('userId', 'name email'),
        Teacher.find().populate('userId', 'name email'),
        Fee.find().populate('studentId', 'name'),
        Attendance.find().populate('studentId', 'name'),
        Marks.find().populate('studentId', 'name').populate('teacherId', 'name'),
        Exam.find().select('-questions').populate('teacherId', 'name'),
        Notice.find().sort({ createdAt: -1 }).limit(10).populate('postedBy', 'name')
    ]);

    // Student summary by class/section
    const classSummary = {};
    students.forEach(s => {
        const key = `${s.class}-${s.section}`;
        if (!classSummary[key]) classSummary[key] = [];
        classSummary[key].push(s.userId?.name || 'Unknown');
    });

    // Fee summary
    const feeStats = { paid: 0, unpaid: 0, partial: 0, totalCollected: 0, totalPending: 0 };
    const unpaidStudents = [];
    fees.forEach(f => {
        feeStats[f.status]++;
        if (f.status === 'paid') feeStats.totalCollected += f.paidAmount;
        if (f.status === 'unpaid') {
            feeStats.totalPending += f.totalAmount;
            unpaidStudents.push({ name: f.studentId?.name || 'Unknown', class: f.class, section: f.section, month: f.month, year: f.year, amount: f.totalAmount });
        }
        if (f.status === 'partial') {
            feeStats.totalCollected += f.paidAmount;
            feeStats.totalPending += (f.totalAmount - f.paidAmount);
        }
    });

    // Attendance summary
    const attendanceStats = { total: attendance.length, present: 0, absent: 0, late: 0 };
    const studentAttendance = {};
    attendance.forEach(a => {
        attendanceStats[a.status]++;
        const name = a.studentId?.name || 'Unknown';
        if (!studentAttendance[name]) studentAttendance[name] = { present: 0, absent: 0, late: 0, total: 0, class: a.class, section: a.section };
        studentAttendance[name][a.status]++;
        studentAttendance[name].total++;
    });

    // Find students with low attendance (below 75%)
    const lowAttendance = Object.entries(studentAttendance)
        .filter(([, s]) => s.total > 0 && (s.present / s.total) < 0.75)
        .map(([name, s]) => ({ name, class: s.class, section: s.section, percentage: Math.round((s.present / s.total) * 100) }));

    // Marks summary — average by class/subject
    const marksSummary = {};
    marks.forEach(m => {
        const key = `${m.class}-${m.section}-${m.subject}-${m.examType}`;
        if (!marksSummary[key]) marksSummary[key] = { total: 0, count: 0, topStudent: '', topMarks: 0 };
        marksSummary[key].total += m.marksObtained;
        marksSummary[key].count++;
        if (m.marksObtained > marksSummary[key].topMarks) {
            marksSummary[key].topMarks = m.marksObtained;
            marksSummary[key].topStudent = m.studentId?.name || 'Unknown';
        }
    });

    // Teacher list
    const teacherList = teachers.map(t => ({
        name: t.userId?.name || 'Unknown',
        email: t.userId?.email || '',
        subject: t.subject,
        assignedClass: t.assignedClass,
        assignedSection: t.assignedSection
    }));

    // Student list
    const studentList = students.map(s => ({
        name: s.userId?.name || 'Unknown',
        email: s.userId?.email || '',
        class: s.class,
        section: s.section,
        admissionNumber: s.admissionNumber,
        parentName: s.parentName,
        parentContact: s.parentContact
    }));

    // Exam summary
    const examSummary = exams.map(e => ({
        title: e.title,
        subject: e.subject,
        class: e.class,
        section: e.section,
        teacher: e.teacherId?.name || 'Unknown',
        scheduledAt: e.scheduledAt,
        totalMarks: e.totalMarks,
        submissions: e.submissions?.length || 0
    }));

    // Recent notices
    const recentNotices = notices.map(n => ({
        title: n.title,
        content: n.content.slice(0, 100),
        postedBy: n.postedBy?.name || 'Unknown',
        audience: n.audience,
        priority: n.priority,
        date: n.createdAt
    }));

    return `
=== SCHOOL DATA (Real-time from Database) ===

OVERVIEW:
- Total Students: ${students.length}
- Total Teachers: ${teachers.length}
- Classes with students: ${Object.keys(classSummary).join(', ')}

STUDENTS BY CLASS:
${Object.entries(classSummary).map(([key, names]) => `  ${key}: ${names.length} students (${names.join(', ')})`).join('\n')}

ALL STUDENTS:
${studentList.map(s => `  - ${s.name} | ${s.email} | ${s.class}-${s.section} | Adm: ${s.admissionNumber} | Parent: ${s.parentName} (${s.parentContact})`).join('\n')}

ALL TEACHERS:
${teacherList.map(t => `  - ${t.name} | ${t.email} | Subject: ${t.subject} | Assigned: ${t.assignedClass || 'None'}-${t.assignedSection || 'None'}`).join('\n')}

FEE SUMMARY:
- Paid: ${feeStats.paid} | Unpaid: ${feeStats.unpaid} | Partial: ${feeStats.partial}
- Total Collected: ₹${feeStats.totalCollected} | Total Pending: ₹${feeStats.totalPending}
${unpaidStudents.length > 0 ? `- Students with unpaid fees:\n${unpaidStudents.map(u => `    ${u.name} (${u.class}-${u.section}) — Month ${u.month}/${u.year} — ₹${u.amount}`).join('\n')}` : '- No unpaid fees!'}

ATTENDANCE SUMMARY:
- Total Records: ${attendanceStats.total} | Present: ${attendanceStats.present} | Absent: ${attendanceStats.absent} | Late: ${attendanceStats.late}
- Overall Attendance Rate: ${attendanceStats.total > 0 ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0}%
${lowAttendance.length > 0 ? `- Students with LOW attendance (<75%):\n${lowAttendance.map(s => `    ${s.name} (${s.class}-${s.section}) — ${s.percentage}%`).join('\n')}` : '- All students have good attendance (≥75%)'}

MARKS/PERFORMANCE:
${Object.entries(marksSummary).map(([key, v]) => `  ${key}: Avg ${Math.round(v.total / v.count)}/${marks[0]?.totalMarks || 'N/A'} | Top: ${v.topStudent} (${v.topMarks})`).join('\n') || '  No marks recorded yet'}

EXAMS:
${examSummary.length > 0 ? examSummary.map(e => `  - "${e.title}" (${e.subject}) | ${e.class}-${e.section} | By: ${e.teacher} | Scheduled: ${new Date(e.scheduledAt).toLocaleDateString()} | Submissions: ${e.submissions}`).join('\n') : '  No exams created yet'}

RECENT NOTICES:
${recentNotices.length > 0 ? recentNotices.map(n => `  - [${n.priority.toUpperCase()}] "${n.title}" by ${n.postedBy} | Audience: ${n.audience} | ${new Date(n.date).toLocaleDateString()}`).join('\n') : '  No notices posted yet'}

=== END SCHOOL DATA ===`;
};

// Fetch data for teacher context
const fetchTeacherContext = async (userId) => {
    const teacher = await Teacher.findOne({ userId }).populate('userId', 'name');
    if (!teacher) return '\nNo teacher profile found.';

    const [students, attendance, marks, exams] = await Promise.all([
        teacher.assignedClass ? Student.find({ class: teacher.assignedClass, section: teacher.assignedSection }).populate('userId', 'name email') : Promise.resolve([]),
        teacher.assignedClass ? Attendance.find({ class: teacher.assignedClass, section: teacher.assignedSection }).populate('studentId', 'name') : Promise.resolve([]),
        Marks.find({ teacherId: userId }).populate('studentId', 'name'),
        Exam.find({ teacherId: userId }).select('-questions')
    ]);

    const studentList = students.map(s => `  - ${s.userId?.name} | ${s.class}-${s.section}`).join('\n');

    return `
=== YOUR TEACHING DATA ===
Teacher: ${teacher.userId?.name} | Subject: ${teacher.subject} | Assigned: ${teacher.assignedClass || 'None'}-${teacher.assignedSection || 'None'}

YOUR STUDENTS (${students.length}):
${studentList || '  No students assigned'}

MARKS ENTERED BY YOU: ${marks.length} records
EXAMS CREATED: ${exams.length}
ATTENDANCE RECORDS: ${attendance.length}
=== END DATA ===`;
};

// Fetch data for student context
const fetchStudentContext = async (userId) => {
    const student = await Student.findOne({ userId }).populate('userId', 'name');
    if (!student) return '\nNo student profile found.';

    const [attendance, marks, fees] = await Promise.all([
        Attendance.find({ studentId: userId }),
        Marks.find({ studentId: userId }),
        Fee.find({ studentId: userId })
    ]);

    const attendanceRate = attendance.length > 0
        ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
        : 0;

    const marksStr = marks.map(m => `  - ${m.subject} (${m.examType}): ${m.marksObtained}/${m.totalMarks}`).join('\n');
    const feeStr = fees.map(f => `  - Month ${f.month}/${f.year}: ₹${f.totalAmount} — ${f.status}`).join('\n');

    return `
=== YOUR STUDENT DATA ===
Name: ${student.userId?.name} | Class: ${student.class}-${student.section} | Admission: ${student.admissionNumber}

ATTENDANCE: ${attendance.length} days tracked | Rate: ${attendanceRate}%
MARKS:
${marksStr || '  No marks yet'}
FEES:
${feeStr || '  No fee records'}
=== END DATA ===`;
};

const callGroq = async (messages, retries = 2) => {
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
            const waitTime = 5000;
            console.log(`Rate limited, retrying in ${waitTime / 1000}s... (attempt ${attempt + 1})`);
            await sleep(waitTime);
            continue;
        }

        if (!groqRes.ok) {
            throw new Error(groqData.error?.message || 'Groq API error');
        }

        return groqData;
    }
};

const sendMessage = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Fetch role-specific school data
        let schoolData = '';
        const role = req.user.role;

        if (role === 'admin') {
            schoolData = await fetchAdminContext();
        } else if (role === 'teacher') {
            schoolData = await fetchTeacherContext(req.user._id);
        } else if (role === 'student') {
            schoolData = await fetchStudentContext(req.user._id);
        }

        // Build messages with school data injected into system prompt
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT + '\n' + schoolData }
        ];

        if (history && Array.isArray(history)) {
            const recentHistory = history.slice(-10);
            messages.push(...recentHistory);
        }

        messages.push({ role: 'user', content: message.trim() });

        const groqData = await callGroq(messages);
        const reply = groqData.choices[0].message.content.trim();

        res.status(200).json({ reply });
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ message: 'Error getting response', error: error.message });
    }
};

module.exports = { sendMessage };
