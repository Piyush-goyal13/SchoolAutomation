const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctIndex: { type: Number, required: true }
}, { _id: false });

const submissionSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [{ type: Number }], // index of chosen option per question
    score: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now }
}, { _id: false });

const examSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    questions: [questionSchema],
    totalMarks: { type: Number, required: true },
    durationMinutes: { type: Number, required: true, default: 30 },
    scheduledAt: { type: Date, required: true },
    submissions: [submissionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
