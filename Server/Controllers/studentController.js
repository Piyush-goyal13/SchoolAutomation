const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

const getStudents = async (req, res) => {
    try {
        const students = await Student.find().populate('userId', '-password');
        const formatted = students.map(s => ({
            _id: s.userId._id,
            studentProfileId: s._id,
            name: s.userId.name,
            email: s.userId.email,
            admissionNumber: s.admissionNumber,
            class: s.class,
            section: s.section,
            parentName: s.parentName,
            parentContact: s.parentContact
        }));
        res.status(200).json(formatted);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
};

const registerStudent = async (req, res) => {
    try {
        const { name, email, password, admissionNumber, class: studentClass, section, parentName, parentContact } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const existingAdmission = await Student.findOne({ admissionNumber });
        if (existingAdmission) {
            return res.status(400).json({ message: 'Admission number already exists' });
        }

        const user = await User.create({ name, email, password, role: 'student' });
        await Student.create({
            userId: user._id,
            admissionNumber,
            class: studentClass,
            section,
            parentName,
            parentContact
        });

        res.status(201).json({ message: 'Student registered successfully', userId: user._id });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateStudent = async (req, res) => {
    try {
        const { name, email, admissionNumber, class: studentClass, section, parentName, parentContact } = req.body;
        const user = await User.findById(req.params.id);

        if (!user || user.role !== 'student') {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (email && email !== user.email) {
            const existing = await User.findOne({ email });
            if (existing) return res.status(400).json({ message: 'Email already in use' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        await user.save();

        const studentProfile = await Student.findOne({ userId: user._id });
        if (admissionNumber) studentProfile.admissionNumber = admissionNumber;
        if (studentClass) studentProfile.class = studentClass;
        if (section) studentProfile.section = section;
        if (parentName) studentProfile.parentName = parentName;
        if (parentContact) studentProfile.parentContact = parentContact;
        await studentProfile.save();

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            admissionNumber: studentProfile.admissionNumber,
            class: studentProfile.class,
            section: studentProfile.section,
            parentName: studentProfile.parentName,
            parentContact: studentProfile.parentContact
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating student', error: error.message });
    }
};

const deleteStudent = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || user.role !== 'student') {
            return res.status(404).json({ message: 'Student not found' });
        }

        await Student.findOneAndDelete({ userId: user._id });
        await user.deleteOne();
        res.status(200).json({ message: 'Student removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting student', error: error.message });
    }
};

const getMyProfile = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        let sectionIncharge = null;
        const inchargeProfile = await Teacher.findOne({
            assignedClass: student.class,
            assignedSection: student.section
        });
        if (inchargeProfile) {
            const inchargeUser = await User.findById(inchargeProfile.userId).select('name email');
            if (inchargeUser) {
                sectionIncharge = { name: inchargeUser.name, email: inchargeUser.email, subject: inchargeProfile.subject };
            }
        }

        res.status(200).json({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            admissionNumber: student.admissionNumber,
            class: student.class,
            section: student.section,
            parentName: student.parentName,
            parentContact: student.parentContact,
            sectionIncharge
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};

module.exports = { getStudents, registerStudent, updateStudent, deleteStudent, getMyProfile };
