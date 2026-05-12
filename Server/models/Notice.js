const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    postedByRole: { type: String, enum: ['admin', 'teacher'], required: true },
    audience: { type: String, enum: ['all', 'students', 'teachers', 'section'], required: true },
    targetClass: { type: String, default: null },
    targetSection: { type: String, default: null },
    priority: { type: String, enum: ['normal', 'important', 'urgent'], default: 'normal' }
}, { timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);
