const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Timetable = require('../models/Timetable');

const registerUser = async (req, res) => {
    try {
        const { name, email, password, subject } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name, email, password, role: 'teacher' });
        await Teacher.create({ userId: user._id, subject });

        res.status(201).json({ message: 'Teacher registered successfully', userId: user._id });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find().populate('userId', '-password');
        const formatted = teachers.map(t => ({
            _id: t.userId._id,
            teacherProfileId: t._id,
            name: t.userId.name,
            email: t.userId.email,
            subject: t.subject,
            assignedClass: t.assignedClass,
            assignedSection: t.assignedSection
        }));
        res.status(200).json(formatted);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching teachers', error: error.message });
    }
};

const updateTeacher = async (req, res) => {
    try {
        const { name, email, subject } = req.body;
        const user = await User.findById(req.params.id);

        if (!user || user.role !== 'teacher') {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        if (email && email !== user.email) {
            const existing = await User.findOne({ email });
            if (existing) return res.status(400).json({ message: 'Email already in use' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        await user.save();

        if (subject) {
            await Teacher.findOneAndUpdate({ userId: user._id }, { subject });
        }

        const teacher = await Teacher.findOne({ userId: user._id });
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            subject: teacher.subject,
            assignedClass: teacher.assignedClass,
            assignedSection: teacher.assignedSection
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating teacher', error: error.message });
    }
};

const assignSection = async (req, res) => {
    try {
        const { assignedClass, assignedSection } = req.body;
        const user = await User.findById(req.params.id);

        if (!user || user.role !== 'teacher') {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        // Check if another teacher is already assigned to this section
        if (assignedClass && assignedSection) {
            const existing = await Teacher.findOne({
                assignedClass,
                assignedSection,
                userId: { $ne: user._id }
            });
            if (existing) {
                const existingUser = await User.findById(existing.userId);
                return res.status(400).json({
                    message: `${existingUser.name} is already incharge of ${assignedClass} - ${assignedSection}`
                });
            }
        }

        await Teacher.findOneAndUpdate(
            { userId: user._id },
            { assignedClass: assignedClass || null, assignedSection: assignedSection || null }
        );

        res.status(200).json({ message: 'Section assigned successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error assigning section', error: error.message });
    }
};

const deleteTeacher = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || user.role !== 'teacher') {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        await Teacher.findOneAndDelete({ userId: user._id });
        await user.deleteOne();
        res.status(200).json({ message: 'Teacher removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting teacher', error: error.message });
    }
};

const getMyProfile = async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher profile not found' });
        }
        res.status(200).json({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            subject: teacher.subject,
            assignedClass: teacher.assignedClass,
            assignedSection: teacher.assignedSection
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};

const getMySection = async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (!teacher || !teacher.assignedClass || !teacher.assignedSection) {
            return res.status(200).json({ assigned: false, students: [] });
        }

        const students = await Student.find({
            class: teacher.assignedClass,
            section: teacher.assignedSection
        }).populate('userId', '-password');

        const formatted = students.map(s => ({
            _id: s.userId._id,
            name: s.userId.name,
            email: s.userId.email,
            admissionNumber: s.admissionNumber,
            class: s.class,
            section: s.section,
            parentName: s.parentName,
            parentContact: s.parentContact
        }));

        res.status(200).json({
            assigned: true,
            assignedClass: teacher.assignedClass,
            assignedSection: teacher.assignedSection,
            students: formatted
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching section', error: error.message });
    }
};

const getMyStudents = async (req, res) => {
    try {
        const teacherId = req.user._id;
        const teacher = await Teacher.findOne({ userId: teacherId });

        // Collect all sections from timetables where this teacher is assigned
        const timetables = await Timetable.find({ 'schedule.periods.teacherId': teacherId });
        const sectionsSet = new Set();

        for (const tt of timetables) {
            for (const day of tt.schedule) {
                for (const period of day.periods) {
                    if (String(period.teacherId) === String(teacherId)) {
                        sectionsSet.add(`${tt.class}|${tt.section}`);
                    }
                }
            }
        }

        // Also add incharge section
        if (teacher?.assignedClass && teacher?.assignedSection) {
            sectionsSet.add(`${teacher.assignedClass}|${teacher.assignedSection}`);
        }

        if (sectionsSet.size === 0) {
            return res.status(200).json({ sections: [], students: [] });
        }

        // Build query for all matching sections
        const sectionFilters = [...sectionsSet].map(s => {
            const [cls, sec] = s.split('|');
            return { class: cls, section: sec };
        });

        const students = await Student.find({ $or: sectionFilters }).populate('userId', '-password');

        const formatted = students.map(s => ({
            _id: s.userId._id,
            name: s.userId.name,
            email: s.userId.email,
            admissionNumber: s.admissionNumber,
            class: s.class,
            section: s.section,
            parentName: s.parentName,
            parentContact: s.parentContact,
            isIncharge: teacher?.assignedClass === s.class && teacher?.assignedSection === s.section
        }));

        const sections = [...sectionsSet].map(s => {
            const [cls, sec] = s.split('|');
            return {
                class: cls,
                section: sec,
                isIncharge: teacher?.assignedClass === cls && teacher?.assignedSection === sec
            };
        });

        res.status(200).json({ sections, students: formatted });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
};

module.exports = { registerUser, getTeachers, updateTeacher, deleteTeacher, getMyProfile, assignSection, getMySection, getMyStudents };
