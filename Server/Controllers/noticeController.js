const Notice = require('../models/Notice');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const { sendBulkEmails, noticeEmailTemplate } = require('../utils/emailService');

const getRecipientEmails = async (audience, targetClass, targetSection) => {
    let recipients = [];

    if (audience === 'all') {
        const users = await User.find({ role: { $in: ['student', 'teacher'] } }).select('name email');
        recipients = users.map(u => ({ name: u.name, email: u.email }));
        console.log('Recipients found:', recipients.map(r => r.email));
    } else if (audience === 'students') {
        const students = await Student.find().populate('userId', 'name email');
        recipients = students.filter(s => s.userId).map(s => ({ name: s.userId.name, email: s.userId.email }));
    } else if (audience === 'teachers') {
        const teachers = await Teacher.find().populate('userId', 'name email');
        recipients = teachers.filter(t => t.userId).map(t => ({ name: t.userId.name, email: t.userId.email }));
    } else if (audience === 'section' && targetClass && targetSection) {
        const students = await Student.find({ class: targetClass, section: targetSection }).populate('userId', 'name email');
        recipients = students.filter(s => s.userId).map(s => ({ name: s.userId.name, email: s.userId.email }));
    }

    return recipients;
};

const createNotice = async (req, res) => {
    try {
        const { title, content, audience, targetClass, targetSection, priority } = req.body;

        if (!title || !content || !audience) {
            return res.status(400).json({ message: 'Title, content and audience are required' });
        }

        if (audience === 'section' && (!targetClass || !targetSection)) {
            return res.status(400).json({ message: 'Target class and section are required for section notices' });
        }

        const notice = await Notice.create({
            title,
            content,
            postedBy: req.user._id,
            postedByRole: req.user.role,
            audience,
            targetClass: audience === 'section' ? targetClass : null,
            targetSection: audience === 'section' ? targetSection : null,
            priority: priority || 'normal'
        });

        // Send emails in background
        const recipients = await getRecipientEmails(audience, targetClass, targetSection);
        console.log(`📧 Sending notice emails to ${recipients.length} recipients`);
        if (recipients.length > 0) {
            const noticeData = { title, content, priority: priority || 'normal', postedByName: req.user.name };
            sendBulkEmails(
                recipients,
                `📢 ${priority === 'urgent' ? '[URGENT] ' : ''}${title} — TechVeda School`,
                (r) => noticeEmailTemplate(noticeData, r.name)
            ).then(() => console.log('✅ All notice emails processed'));
        }

        res.status(201).json({ message: 'Notice posted successfully', notice });
    } catch (error) {
        res.status(500).json({ message: 'Error creating notice', error: error.message });
    }
};

const createTeacherNotice = async (req, res) => {
    try {
        const { title, content, priority } = req.body;
        const teacher = await Teacher.findOne({ userId: req.user._id });

        if (!teacher || !teacher.assignedClass || !teacher.assignedSection) {
            return res.status(403).json({ message: 'You must be a section incharge to post notices' });
        }

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const notice = await Notice.create({
            title,
            content,
            postedBy: req.user._id,
            postedByRole: 'teacher',
            audience: 'section',
            targetClass: teacher.assignedClass,
            targetSection: teacher.assignedSection,
            priority: priority || 'normal'
        });

        // Send emails to section students
        const recipients = await getRecipientEmails('section', teacher.assignedClass, teacher.assignedSection);
        if (recipients.length > 0) {
            const noticeData = { title, content, priority: priority || 'normal', postedByName: req.user.name };
            sendBulkEmails(
                recipients,
                `📢 ${title} — TechVeda School`,
                (r) => noticeEmailTemplate(noticeData, r.name)
            );
        }

        res.status(201).json({ message: 'Notice posted successfully', notice });
    } catch (error) {
        res.status(500).json({ message: 'Error creating notice', error: error.message });
    }
};

const getAllNotices = async (req, res) => {
    try {
        const notices = await Notice.find()
            .populate('postedBy', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(notices);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notices', error: error.message });
    }
};

const deleteNotice = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);
        if (!notice) return res.status(404).json({ message: 'Notice not found' });
        await notice.deleteOne();
        res.status(200).json({ message: 'Notice deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting notice', error: error.message });
    }
};

const getTeacherNotices = async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ userId: req.user._id });

        const query = {
            $or: [
                { audience: 'all' },
                { audience: 'teachers' }
            ]
        };

        if (teacher?.assignedClass && teacher?.assignedSection) {
            query.$or.push({
                audience: 'section',
                targetClass: teacher.assignedClass,
                targetSection: teacher.assignedSection
            });
        }

        const notices = await Notice.find(query)
            .populate('postedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(notices);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notices', error: error.message });
    }
};

const getStudentNotices = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });

        const query = {
            $or: [
                { audience: 'all' },
                { audience: 'students' }
            ]
        };

        if (student) {
            query.$or.push({
                audience: 'section',
                targetClass: student.class,
                targetSection: student.section
            });
        }

        const notices = await Notice.find(query)
            .populate('postedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(notices);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notices', error: error.message });
    }
};

module.exports = { createNotice, createTeacherNotice, getAllNotices, deleteNotice, getTeacherNotices, getStudentNotices };
