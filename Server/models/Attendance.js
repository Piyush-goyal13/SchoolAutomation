const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    date: { type: String, required: true },
    day: { type: String, required: true },
    status: { type: String, enum: ['present', 'absent', 'late'], required: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ class: 1, section: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
