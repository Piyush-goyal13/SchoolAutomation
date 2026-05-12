const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

const markAttendance = async (req, res) => {
    try {
        const { date, day, records } = req.body;
        const teacherId = req.user._id;

        const teacher = await Teacher.findOne({ userId: teacherId });
        if (!teacher || !teacher.assignedClass || !teacher.assignedSection) {
            return res.status(403).json({ message: 'You are not assigned as section incharge' });
        }

        if (!date || !day || !records || !records.length) {
            return res.status(400).json({ message: 'Date, day and records are required' });
        }

        const ops = records.map(r => ({
            updateOne: {
                filter: { studentId: r.studentId, date },
                update: {
                    $set: {
                        class: teacher.assignedClass,
                        section: teacher.assignedSection,
                        day,
                        status: r.status,
                        markedBy: teacherId
                    }
                },
                upsert: true
            }
        }));

        await Attendance.bulkWrite(ops);
        res.status(200).json({ message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking attendance', error: error.message });
    }
};

const getAttendanceByDate = async (req, res) => {
    try {
        const { date } = req.query;
        const teacherId = req.user._id;

        const teacher = await Teacher.findOne({ userId: teacherId });
        if (!teacher || !teacher.assignedClass || !teacher.assignedSection) {
            return res.status(200).json({ assigned: false, records: [] });
        }

        const students = await Student.find({
            class: teacher.assignedClass,
            section: teacher.assignedSection
        }).populate('userId', 'name email');

        let records = [];
        if (date) {
            records = await Attendance.find({
                class: teacher.assignedClass,
                section: teacher.assignedSection,
                date
            });
        }

        const studentList = students.map(s => {
            const record = records.find(r => String(r.studentId) === String(s.userId._id));
            return {
                studentId: s.userId._id,
                name: s.userId.name,
                admissionNumber: s.admissionNumber,
                status: record ? record.status : null
            };
        });

        res.status(200).json({
            assigned: true,
            assignedClass: teacher.assignedClass,
            assignedSection: teacher.assignedSection,
            students: studentList
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
};

const getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { month, year } = req.query;
        const teacherId = req.user._id;

        const teacher = await Teacher.findOne({ userId: teacherId });
        if (!teacher || !teacher.assignedClass || !teacher.assignedSection) {
            return res.status(403).json({ message: 'You are not assigned as section incharge' });
        }

        const student = await Student.findOne({ userId: studentId }).populate('userId', 'name');
        if (!student || student.class !== teacher.assignedClass || student.section !== teacher.assignedSection) {
            return res.status(404).json({ message: 'Student not found in your section' });
        }

        let query = { studentId };
        if (month && year) {
            const prefix = `${year}-${month.padStart(2, '0')}`;
            query.date = { $regex: `^${prefix}` };
        }

        const records = await Attendance.find(query).sort({ date: -1 });

        const totalDays = records.length;
        const presentDays = records.filter(r => r.status === 'present').length;
        const absentDays = records.filter(r => r.status === 'absent').length;
        const lateDays = records.filter(r => r.status === 'late').length;
        const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        res.status(200).json({
            student: { name: student.userId.name, admissionNumber: student.admissionNumber, class: student.class, section: student.section },
            summary: { totalDays, presentDays, absentDays, lateDays, percentage },
            records
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student attendance', error: error.message });
    }
};

const getMyAttendance = async (req, res) => {
    try {
        const { month, year } = req.query;
        const studentId = req.user._id;

        let query = { studentId };
        if (month && year) {
            const prefix = `${year}-${month.padStart(2, '0')}`;
            query.date = { $regex: `^${prefix}` };
        }

        const records = await Attendance.find(query).sort({ date: -1 });

        const totalDays = records.length;
        const presentDays = records.filter(r => r.status === 'present').length;
        const absentDays = records.filter(r => r.status === 'absent').length;
        const lateDays = records.filter(r => r.status === 'late').length;
        const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        res.status(200).json({
            summary: { totalDays, presentDays, absentDays, lateDays, percentage },
            records
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
};

const getAdminStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { month, year } = req.query;

        const student = await Student.findOne({ userId: studentId }).populate('userId', 'name');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        let query = { studentId };
        if (month && year) {
            const prefix = `${year}-${month.padStart(2, '0')}`;
            query.date = { $regex: `^${prefix}` };
        }

        const records = await Attendance.find(query).sort({ date: -1 });

        const totalDays = records.length;
        const presentDays = records.filter(r => r.status === 'present').length;
        const absentDays = records.filter(r => r.status === 'absent').length;
        const lateDays = records.filter(r => r.status === 'late').length;
        const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        res.status(200).json({
            student: { name: student.userId.name, admissionNumber: student.admissionNumber, class: student.class, section: student.section },
            summary: { totalDays, presentDays, absentDays, lateDays, percentage },
            records
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
};

module.exports = { markAttendance, getAttendanceByDate, getStudentAttendance, getMyAttendance, getAdminStudentAttendance };
