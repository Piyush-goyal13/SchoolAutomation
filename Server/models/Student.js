const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    admissionNumber: { type: String, required: true, unique: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    parentName: { type: String, required: true },
    parentContact: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
