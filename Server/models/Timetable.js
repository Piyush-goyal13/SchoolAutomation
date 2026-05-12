const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
    slotNumber: { type: Number, required: true },
    subject: { type: String, default: '' },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { _id: false });

const daySchema = new mongoose.Schema({
    day: { type: String, required: true, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
    periods: [periodSchema]
}, { _id: false });

const timetableSchema = new mongoose.Schema({
    class: { type: String, required: true },
    section: { type: String, required: true },
    schedule: [daySchema]
}, { timestamps: true });

timetableSchema.index({ class: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
