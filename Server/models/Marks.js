const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    subject: { type: String, required: true },
    examType: { type: String, required: true, enum: ['Unit Test 1', 'Unit Test 2', 'Unit Test 3', 'Mid Term', 'Final'] },
    marksObtained: { type: Number, required: true },
    totalMarks: { type: Number, required: true }
}, { timestamps: true });

marksSchema.index({ studentId: 1, subject: 1, examType: 1, class: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Marks', marksSchema);
