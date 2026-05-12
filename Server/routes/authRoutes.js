const express = require('express');
const router = express.Router();
const { loginUser, changePassword } = require('../Controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { sendEmail } = require('../utils/emailService');

router.post('/login', loginUser);
router.put('/change-password', protect, changePassword);

// Test email route - remove in production
router.get('/test-email', async (req, res) => {
    try {
        await sendEmail(
            req.query.to,
            'Test Email from TechVeda',
            '<h2>✅ Email is working!</h2><p>Your Gmail setup is configured correctly.</p>'
        );
        res.json({ message: 'Email sent! Check your inbox.' });
    } catch (error) {
        res.status(500).json({ message: 'Email failed', error: error.message });
    }
});

module.exports = router;
