const Timetable = require('../models/Timetable');
const User = require('../models/User');

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

module.exports = { getTimetable, saveTimetable, deleteTimetable, getSlots, getMyTimetable };
