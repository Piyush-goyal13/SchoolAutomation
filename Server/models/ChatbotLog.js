const mongoose = require('mongoose');

const chatbotLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
    message: { type: String, required: true },
    intent: { type: String },
    toolsUsed: [{ type: String }],
    insightsGenerated: { type: Number, default: 0 },
    ragUsed: { type: Boolean, default: false },
    responseTimeMs: { type: Number },
    tokensUsed: { type: Number, default: 0 },
    success: { type: Boolean, default: true },
    error: { type: String, default: null }
}, { timestamps: true });

// Index for analytics queries
chatbotLogSchema.index({ role: 1, createdAt: -1 });
chatbotLogSchema.index({ intent: 1 });
chatbotLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatbotLog', chatbotLogSchema);
