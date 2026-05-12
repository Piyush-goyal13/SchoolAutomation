const Marks = require('../models/Marks');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Timetable = require('../models/Timetable');
const User = require('../models/User');
const { sendEmail, marksEmailTemplate } = require('../utils/emailService');

const EXAM_TYPES = ['Unit Test 1', 'Unit Test 2', 'Unit Test 3', 'Mid Term', 'Final'];

const getExamTypes = (req, res) => {
    res.status(200).json(EXAM_TYPES);
};

// Get sections where this teacher teaches (from timetable)
const getMyTeachingSections = async (req, res) => {
    try {
        const teacherId = req.user._id;
        const teacher = await Teacher.findOne({ userId: teacherId });

        const timetables = await Timetable.find({ 'schedule.periods.teacherId': teacherId });
        const sectionsMap = new Map();

        for (const tt of timetables) {
            for (const day of tt.schedule) {
                for (const period of day.periods) {
                    if (String(period.teacherId) === String(teacherId) && period.subject) {
                        const key = `${tt.class}|${tt.section}`;
                        if (!sectionsMap.has(key)) {
                            sectionsMap.set(key, { class: tt.class, section: tt.section, subject: period.subject });
                        }
                    }
                }
            }
        }

        res.status(200).json({
            subject: teacher?.subject || '',
            sections: [...sectionsMap.values()]
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sections', error: error.message });
    }
};

// Get students + existing marks for a section/exam
const getMarksForSection = async (req, res) => {
    try {
        const { class: cls, section, examType } = req.query;
        const teacherId = req.user._id;
        const teacher = await Teacher.findOne({ userId: teacherId });

        if (!cls || !section || !examType) {
            return res.status(400).json({ message: 'Class, section and examType are required' });
        }

        const students = await Student.find({ class: cls, section }).populate('userId', 'name');

        const existingMarks = await Marks.find({
            class: cls,
            section,
            subject: teacher.subject,
            examType,
            teacherId
        });

        const studentList = students.map(s => {
            const mark = existingMarks.find(m => String(m.studentId) === String(s.userId._id));
            return {
                studentId: s.userId._id,
                name: s.userId.name,
                admissionNumber: s.admissionNumber,
                marksObtained: mark ? mark.marksObtained : '',
                totalMarks: mark ? mark.totalMarks : ''
            };
        });

        res.status(200).json({ students: studentList });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching marks', error: error.message });
    }
};

// Save/update marks
const saveMarks = async (req, res) => {
    try {
        const { class: cls, section, examType, totalMarks, records } = req.body;
        const teacherId = req.user._id;
        const teacher = await Teacher.findOne({ userId: teacherId });

        if (!cls || !section || !examType || !totalMarks || !records?.length) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const ops = records.map(r => ({
            updateOne: {
                filter: {
                    studentId: r.studentId,
                    subject: teacher.subject,
                    examType,
                    class: cls,
                    section
                },
                update: {
                    $set: {
                        teacherId,
                        marksObtained: r.marksObtained,
                        totalMarks
                    }
                },
                upsert: true
            }
        }));

        await Marks.bulkWrite(ops);

        // Send email notifications to students (only real emails)
        const students = await Student.find({ class: cls, section }).populate('userId', 'name email');
        for (const r of records) {
            const student = students.find(s => String(s.userId._id) === String(r.studentId));
            if (student && !student.userId.email.endsWith('@school.com')) {
                const html = marksEmailTemplate(student.userId.name, teacher.subject, examType, r.marksObtained, totalMarks);
                sendEmail(student.userId.email, `📊 ${examType} Results — ${teacher.subject} — TechVeda School`, html)
                    .catch(err => console.error(`❌ Marks email failed for ${student.userId.email}:`, err.message));
            }
        }

        res.status(200).json({ message: 'Marks saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving marks', error: error.message });
    }
};

// Student views their own marks
const getMyMarks = async (req, res) => {
    try {
        const studentId = req.user._id;
        const { examType } = req.query;

        let query = { studentId };
        if (examType) query.examType = examType;

        const marks = await Marks.find(query)
            .populate('teacherId', 'name')
            .sort({ subject: 1 });

        // Group by exam type
        const grouped = {};
        for (const m of marks) {
            if (!grouped[m.examType]) grouped[m.examType] = [];
            grouped[m.examType].push({
                subject: m.subject,
                marksObtained: m.marksObtained,
                totalMarks: m.totalMarks,
                teacher: m.teacherId?.name || '',
                percentage: Math.round((m.marksObtained / m.totalMarks) * 100)
            });
        }

        res.status(200).json({ marks: grouped });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching marks', error: error.message });
    }
};

module.exports = { getExamTypes, getMyTeachingSections, getMarksForSection, saveMarks, getMyMarks };
