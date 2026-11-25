const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const chatbotGuard = require('../middleware/chatbotGuard');
const { sendMessage, getAnalytics } = require('../Controllers/chatbotController');

// Chatbot message — protected + role-validated + rate-limited + input-sanitized
router.post('/message', protect, authorize('admin', 'teacher', 'student'), chatbotGuard, sendMessage);

// Analytics — admin only
router.get('/analytics', protect, authorize('admin'), getAnalytics);

module.exports = router;
