const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    subject: { type: String, required: true },
    assignedClass: { type: String, default: null },
    assignedSection: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
