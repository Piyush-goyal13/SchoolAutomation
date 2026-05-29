const Timetable = require('../models/Timetable');
const User = require('../models/User');
const Teacher = require('../models/Teacher');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SLOTS = [
    { slotNumber: 1, time: '8:00 - 8:45', type: 'class' },
    { slotNumber: 2, time: '8:45 - 9:30', type: 'class' },
    { slotNumber: 3, time: '9:30 - 10:15', type: 'class' },
    { slotNumber: 0, time: '10:15 - 10:30', type: 'break', label: 'Break' },
    { slotNumber: 4, time: '10:30 - 11:15', type: 'class' },
    { slotNumber: 5, time: '11:15 - 12:00', type: 'class' },
    { slotNumber: 0, time: '12:00 - 12:30', type: 'break', label: 'Lunch' },
    { slotNumber: 6, time: '12:30 - 1:15', type: 'class' }
];

const getSlots = (req, res) => {
    res.status(200).json(SLOTS);
};

const getTimetable = async (req, res) => {
    try {
        const { class: cls, section } = req.query;
        if (!cls || !section) {
            return res.status(400).json({ message: 'Class and section are required' });
        }

        const timetable = await Timetable.findOne({ class: cls, section })
            .populate('schedule.periods.teacherId', 'name');

        if (!timetable) {
            return res.status(200).json({ exists: false, class: cls, section, schedule: [] });
        }

        res.status(200).json({ exists: true, ...timetable.toObject() });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching timetable', error: error.message });
    }
};

const saveTimetable = async (req, res) => {
    try {
        const { class: cls, section, schedule } = req.body;

        if (!cls || !section || !schedule) {
            return res.status(400).json({ message: 'Class, section and schedule are required' });
        }

        let timetable = await Timetable.findOne({ class: cls, section });

        if (timetable) {
            timetable.schedule = schedule;
            await timetable.save();
        } else {
            timetable = await Timetable.create({ class: cls, section, schedule });
        }

        res.status(200).json({ message: 'Timetable saved successfully', timetable });
    } catch (error) {
        res.status(500).json({ message: 'Error saving timetable', error: error.message });
    }
};

const deleteTimetable = async (req, res) => {
    try {
        const { class: cls, section } = req.query;
        const result = await Timetable.findOneAndDelete({ class: cls, section });
        if (!result) {
            return res.status(404).json({ message: 'Timetable not found' });
        }
        res.status(200).json({ message: 'Timetable deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting timetable', error: error.message });
    }
};

const getMyTimetable = async (req, res) => {
    try {
        const teacherId = req.user._id;
        const allTimetables = await Timetable.find({
            'schedule.periods.teacherId': teacherId
        });

        const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const schedule = DAYS_ORDER.map(day => ({
            day,
            periods: SLOTS.filter(s => s.type === 'class').map(slot => {
                for (const tt of allTimetables) {
                    const dayData = tt.schedule.find(d => d.day === day);
                    if (!dayData) continue;
                    const period = dayData.periods.find(
                        p => p.slotNumber === slot.slotNumber && String(p.teacherId) === String(teacherId)
                    );
                    if (period) {
                        return {
                            slotNumber: slot.slotNumber,
                            subject: period.subject,
                            class: tt.class,
                            section: tt.section
                        };
                    }
                }
                return { slotNumber: slot.slotNumber, subject: '', class: '', section: '' };
            })
        }));

        res.status(200).json({ schedule });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching teacher timetable', error: error.message });
    }
};

// AI Timetable Generator
const generateTimetable = async (req, res) => {
    try {
        const { class: cls, section } = req.body;
        if (!cls || !section) return res.status(400).json({ message: 'Class and section are required' });

        // Fetch all teachers with their subjects
        const teachers = await Teacher.find().populate('userId', 'name');
        if (!teachers.length) return res.status(400).json({ message: 'No teachers found' });

        // Build a map: subject -> [teacherIds]
        const subjectTeacherMap = {};
        for (const t of teachers) {
            const sub = t.subject.toLowerCase();
            if (!subjectTeacherMap[sub]) subjectTeacherMap[sub] = [];
            subjectTeacherMap[sub].push(String(t.userId._id));
        }
        const subjects = Object.keys(subjectTeacherMap);

        // Load all existing timetables to detect teacher conflicts
        const allTimetables = await Timetable.find({ $nor: [{ class: cls, section }] });

        // Build busy map: teacherId -> Set of "day-slot" strings
        const busySlots = {};
        for (const tt of allTimetables) {
            for (const dayData of tt.schedule) {
                for (const period of dayData.periods) {
                    if (!period.teacherId) continue;
                    const key = String(period.teacherId);
                    if (!busySlots[key]) busySlots[key] = new Set();
                    busySlots[key].add(`${dayData.day}-${period.slotNumber}`);
                }
            }
        }

        const CLASS_SLOTS = SLOTS.filter(s => s.type === 'class');
        const totalSlots = DAYS.length * CLASS_SLOTS.length; // 36 slots

        // Track teacher load for this timetable: teacherId -> count
        const teacherLoad = {};

        // Pick available teacher for a slot, preferring least loaded
        const pickTeacher = (subject, day, slotNumber) => {
            const candidates = subjectTeacherMap[subject] || [];
            const slotKey = `${day}-${slotNumber}`;
            const available = candidates.filter(tid => !busySlots[tid]?.has(slotKey));
            if (!available.length) return null;
            available.sort((a, b) => (teacherLoad[a] || 0) - (teacherLoad[b] || 0));
            return available[0];
        };

        // Distribute subjects evenly across slots
        // Each subject gets floor(totalSlots / subjects.length) slots minimum
        const slotsPerSubject = Math.max(1, Math.floor(totalSlots / subjects.length));
        const subjectQueue = [];
        for (const sub of subjects) {
            for (let i = 0; i < slotsPerSubject; i++) subjectQueue.push(sub);
        }
        // Fill remaining slots by cycling through subjects
        let qi = 0;
        while (subjectQueue.length < totalSlots) {
            subjectQueue.push(subjects[qi % subjects.length]);
            qi++;
        }
        // Shuffle for variety
        for (let i = subjectQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [subjectQueue[i], subjectQueue[j]] = [subjectQueue[j], subjectQueue[i]];
        }

        const schedule = [];
        let queueIdx = 0;

        for (const day of DAYS) {
            const periods = [];
            for (const slot of CLASS_SLOTS) {
                // Try subjects from queue, skip if no teacher available
                let assigned = false;
                const tried = new Set();
                while (tried.size < subjects.length) {
                    const subject = subjectQueue[queueIdx % subjectQueue.length];
                    queueIdx++;
                    if (tried.has(subject)) continue;
                    tried.add(subject);
                    const teacherId = pickTeacher(subject, day, slot.slotNumber);
                    if (teacherId) {
                        // Mark teacher busy for this slot
                        if (!busySlots[teacherId]) busySlots[teacherId] = new Set();
                        busySlots[teacherId].add(`${day}-${slot.slotNumber}`);
                        teacherLoad[teacherId] = (teacherLoad[teacherId] || 0) + 1;
                        periods.push({ slotNumber: slot.slotNumber, subject, teacherId });
                        assigned = true;
                        break;
                    }
                }
                if (!assigned) {
                    periods.push({ slotNumber: slot.slotNumber, subject: '', teacherId: null });
                }
            }
            schedule.push({ day, periods });
        }

        res.status(200).json({ schedule });
    } catch (error) {
        res.status(500).json({ message: 'Error generating timetable', error: error.message });
    }
};

module.exports = { getTimetable, saveTimetable, deleteTimetable, getSlots, getMyTimetable, generateTimetable };
