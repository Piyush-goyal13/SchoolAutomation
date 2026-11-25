const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Fee = require('../models/Fee');
const Exam = require('../models/Exam');
const Notice = require('../models/Notice');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ─── SYSTEM PROMPTS PER ROLE ───

const ADMIN_SYSTEM_PROMPT = `You are TechVeda AI Assistant for the School Admin. You have FULL access to all school data — students, teachers, fees, attendance, marks, exams, and notices.

Rules:
- Answer using the SCHOOL DATA provided below — always use real data over generic advice
- Keep responses concise (under 200 words unless a detailed breakdown is needed)
- Use tables, bullet points, and bold for readability
- If the data doesn't have what was asked, say so honestly
- You can also answer general school management and academic questions`;

const TEACHER_SYSTEM_PROMPT = `You are TechVeda AI Assistant for a Teacher. You can see:
- Your own profile and assigned section
- Names of students in YOUR assigned section only (no personal details like parent info, email, or admission numbers)
- Marks YOU have entered
- Exams YOU have created
- Attendance for YOUR section
- Notices visible to teachers

STRICT RULES:
- You CANNOT see or reveal other teachers' data, student personal details (parent info, contact, email, admission numbers), fee records, or data from other sections
- If asked about other teachers, student personal info, or fees, say "I don't have access to that information. Please contact the admin."
- Keep responses concise and helpful
- You can also answer general academic and teaching questions`;

const STUDENT_SYSTEM_PROMPT = `You are TechVeda AI Assistant for a Student. You can ONLY see:
- Your own profile information
- Your own attendance records and percentage
- Your own marks and performance
- Your own fee status
- Notices addressed to you

STRICT RULES:
- You CANNOT see or reveal ANY other student's data, teacher personal data, fee details of others, or admin information
- If asked about other students, teachers, or school-wide data, say "I can only help with your own academic information. Please contact the admin for school-wide queries."
- Keep responses concise, encouraging, and helpful
- You can also answer general academic questions, study tips, and exam preparation advice`;

// ─── DATA FETCHERS PER ROLE ───

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

    const lowAttendance = Object.entries(studentAttendance)
        .filter(([, s]) => s.total > 0 && (s.present / s.total) < 0.75)
        .map(([name, s]) => ({ name, class: s.class, section: s.section, percentage: Math.round((s.present / s.total) * 100) }));

    // Marks summary
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

    const teacherList = teachers.map(t => ({
        name: t.userId?.name || 'Unknown',
        email: t.userId?.email || '',
        subject: t.subject,
        assignedClass: t.assignedClass,
        assignedSection: t.assignedSection
    }));

    const studentList = students.map(s => ({
        name: s.userId?.name || 'Unknown',
        email: s.userId?.email || '',
        class: s.class,
        section: s.section,
        admissionNumber: s.admissionNumber,
        parentName: s.parentName,
        parentContact: s.parentContact
    }));

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

    const recentNotices = notices.map(n => ({
        title: n.title,
        content: n.content.slice(0, 100),
        postedBy: n.postedBy?.name || 'Unknown',
        audience: n.audience,
        priority: n.priority,
        date: n.createdAt
    }));

    return `
=== SCHOOL DATA (Admin — Full Access) ===

OVERVIEW:
- Total Students: ${students.length}
- Total Teachers: ${teachers.length}
- Classes: ${Object.keys(classSummary).join(', ')}

STUDENTS BY CLASS:
${Object.entries(classSummary).map(([key, names]) => `  ${key}: ${names.length} students (${names.join(', ')})`).join('\n')}

ALL STUDENTS (with personal details):
${studentList.map(s => `  - ${s.name} | ${s.email} | ${s.class}-${s.section} | Adm: ${s.admissionNumber} | Parent: ${s.parentName} (${s.parentContact})`).join('\n')}

ALL TEACHERS:
${teacherList.map(t => `  - ${t.name} | ${t.email} | Subject: ${t.subject} | Assigned: ${t.assignedClass || 'None'}-${t.assignedSection || 'None'}`).join('\n')}

FEE SUMMARY:
- Paid: ${feeStats.paid} | Unpaid: ${feeStats.unpaid} | Partial: ${feeStats.partial}
- Total Collected: ₹${feeStats.totalCollected} | Total Pending: ₹${feeStats.totalPending}
${unpaidStudents.length > 0 ? `- Unpaid:\n${unpaidStudents.map(u => `    ${u.name} (${u.class}-${u.section}) — Month ${u.month}/${u.year} — ₹${u.amount}`).join('\n')}` : '- No unpaid fees!'}

ATTENDANCE:
- Records: ${attendanceStats.total} | Present: ${attendanceStats.present} | Absent: ${attendanceStats.absent} | Late: ${attendanceStats.late}
- Rate: ${attendanceStats.total > 0 ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0}%
${lowAttendance.length > 0 ? `- Low attendance (<75%):\n${lowAttendance.map(s => `    ${s.name} (${s.class}-${s.section}) — ${s.percentage}%`).join('\n')}` : '- All above 75%'}

MARKS:
${Object.entries(marksSummary).map(([key, v]) => `  ${key}: Avg ${Math.round(v.total / v.count)} | Top: ${v.topStudent} (${v.topMarks})`).join('\n') || '  No marks yet'}

EXAMS:
${examSummary.length > 0 ? examSummary.map(e => `  - "${e.title}" (${e.subject}) | ${e.class}-${e.section} | By: ${e.teacher} | ${new Date(e.scheduledAt).toLocaleDateString()} | ${e.submissions} submissions`).join('\n') : '  None yet'}

RECENT NOTICES:
${recentNotices.length > 0 ? recentNotices.map(n => `  - [${n.priority.toUpperCase()}] "${n.title}" by ${n.postedBy} | ${n.audience} | ${new Date(n.date).toLocaleDateString()}`).join('\n') : '  None yet'}

=== END SCHOOL DATA ===`;
};

const fetchTeacherContext = async (userId) => {
    const teacher = await Teacher.findOne({ userId }).populate('userId', 'name');
    if (!teacher) return '\nNo teacher profile found.';

    const myClass = teacher.assignedClass;
    const mySection = teacher.assignedSection;

    const [sectionStudents, myMarks, myExams, sectionAttendance, notices] = await Promise.all([
        myClass ? Student.find({ class: myClass, section: mySection }).populate('userId', 'name') : Promise.resolve([]),
        Marks.find({ teacherId: userId }).populate('studentId', 'name'),
        Exam.find({ teacherId: userId }).select('-questions'),
        myClass ? Attendance.find({ class: myClass, section: mySection }).populate('studentId', 'name') : Promise.resolve([]),
        Notice.find({ $or: [{ audience: 'all' }, { audience: 'teachers' }] }).sort({ createdAt: -1 }).limit(5).populate('postedBy', 'name')
    ]);

    // Section attendance stats
    const attendanceStats = { total: sectionAttendance.length, present: 0, absent: 0, late: 0 };
    sectionAttendance.forEach(a => { attendanceStats[a.status]++; });

    // Marks summary (only marks entered by this teacher)
    const marksBreakdown = {};
    myMarks.forEach(m => {
        const key = `${m.subject}-${m.examType}`;
        if (!marksBreakdown[key]) marksBreakdown[key] = { total: 0, count: 0 };
        marksBreakdown[key].total += m.marksObtained;
        marksBreakdown[key].count++;
    });

    return `
=== YOUR TEACHING DATA (Teacher — Limited Access) ===
Name: ${teacher.userId?.name} | Subject: ${teacher.subject} | Assigned: ${myClass || 'None'}-${mySection || 'None'}

YOUR SECTION STUDENTS (names only — ${sectionStudents.length} students):
${sectionStudents.map(s => `  - ${s.userId?.name}`).join('\n') || '  No students assigned'}

YOUR SECTION ATTENDANCE:
- Records: ${attendanceStats.total} | Present: ${attendanceStats.present} | Absent: ${attendanceStats.absent} | Late: ${attendanceStats.late}

YOUR MARKS ENTERED (${myMarks.length} records):
${Object.entries(marksBreakdown).map(([key, v]) => `  ${key}: ${v.count} students, Avg: ${Math.round(v.total / v.count)}`).join('\n') || '  None yet'}

YOUR EXAMS CREATED: ${myExams.length}
${myExams.map(e => `  - "${e.title}" | ${e.class}-${e.section} | ${new Date(e.scheduledAt).toLocaleDateString()} | ${e.submissions?.length || 0} submissions`).join('\n') || ''}

RECENT NOTICES (for teachers):
${notices.map(n => `  - [${n.priority.toUpperCase()}] "${n.title}" by ${n.postedBy?.name} | ${new Date(n.createdAt).toLocaleDateString()}`).join('\n') || '  None'}

NOTE: You do NOT have access to other teachers' data, student personal details, fee records, or other sections' data.
=== END DATA ===`;
};

const fetchStudentContext = async (userId) => {
    const student = await Student.findOne({ userId }).populate('userId', 'name');
    if (!student) return '\nNo student profile found.';

    const [attendance, marks, fees, notices] = await Promise.all([
        Attendance.find({ studentId: userId }),
        Marks.find({ studentId: userId }),
        Fee.find({ studentId: userId }),
        Notice.find({ $or: [{ audience: 'all' }, { audience: 'students' }, { audience: 'section', targetClass: student.class, targetSection: student.section }] }).sort({ createdAt: -1 }).limit(5).populate('postedBy', 'name')
    ]);

    const attendanceStats = { total: attendance.length, present: 0, absent: 0, late: 0 };
    attendance.forEach(a => { attendanceStats[a.status]++; });
    const attendanceRate = attendanceStats.total > 0 ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0;

    const totalFee = fees.reduce((s, f) => s + f.totalAmount, 0);
    const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0);

    return `
=== YOUR DATA (Student — Personal Access Only) ===
Name: ${student.userId?.name} | Class: ${student.class}-${student.section} | Admission: ${student.admissionNumber}

YOUR ATTENDANCE:
- Days Tracked: ${attendanceStats.total} | Present: ${attendanceStats.present} | Absent: ${attendanceStats.absent} | Late: ${attendanceStats.late}
- Attendance Rate: ${attendanceRate}%

YOUR MARKS:
${marks.map(m => `  - ${m.subject} (${m.examType}): ${m.marksObtained}/${m.totalMarks} (${Math.round((m.marksObtained / m.totalMarks) * 100)}%)`).join('\n') || '  No marks yet'}

YOUR FEES:
- Total: ₹${totalFee} | Paid: ₹${totalPaid} | Pending: ₹${totalFee - totalPaid}
${fees.map(f => `  - Month ${f.month}/${f.year}: ₹${f.totalAmount} — ${f.status}`).join('\n') || '  No fee records'}

YOUR NOTICES:
${notices.map(n => `  - [${n.priority.toUpperCase()}] "${n.title}" by ${n.postedBy?.name} | ${new Date(n.createdAt).toLocaleDateString()}`).join('\n') || '  None'}

NOTE: You can ONLY see your own data. You do NOT have access to other students' records, teacher information, or school-wide reports.
=== END DATA ===`;
};

// ─── GROQ API CALL WITH RETRY ───

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
            console.log(`Rate limited, retrying in 5s... (attempt ${attempt + 1})`);
            await sleep(5000);
            continue;
        }

        if (!groqRes.ok) {
            throw new Error(groqData.error?.message || 'Groq API error');
        }

        return groqData;
    }
};

// ─── MAIN HANDLER ───

const sendMessage = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const role = req.user.role;
        let systemPrompt = '';
        let schoolData = '';

        if (role === 'admin') {
            systemPrompt = ADMIN_SYSTEM_PROMPT;
            schoolData = await fetchAdminContext();
        } else if (role === 'teacher') {
            systemPrompt = TEACHER_SYSTEM_PROMPT;
            schoolData = await fetchTeacherContext(req.user._id);
        } else if (role === 'student') {
            systemPrompt = STUDENT_SYSTEM_PROMPT;
            schoolData = await fetchStudentContext(req.user._id);
        }

        const messages = [
            { role: 'system', content: systemPrompt + '\n' + schoolData }
        ];

        if (history && Array.isArray(history)) {
            messages.push(...history.slice(-10));
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
