const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../Controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/create-order', protect, authorize('student'), createOrder);
router.post('/verify', protect, authorize('student'), verifyPayment);

module.exports = router;
