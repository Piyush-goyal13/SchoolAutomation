const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { sendMessage } = require('../Controllers/chatbotController');

router.post('/message', protect, authorize('admin', 'teacher', 'student'), sendMessage);

module.exports = router;
