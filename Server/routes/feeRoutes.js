const express = require('express');
const router = express.Router();
const { generateFees, generateYearlyFees, updateFeePayment, getFeesBySection, getFeeSummary, getTeacherSectionFees, getMyFees, payMyFee } = require('../Controllers/feeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/generate', protect, authorize('admin'), generateFees);
router.post('/generate-yearly', protect, authorize('admin'), generateYearlyFees);
router.put('/payment', protect, authorize('admin'), updateFeePayment);
router.get('/section', protect, authorize('admin'), getFeesBySection);
router.get('/summary', protect, authorize('admin'), getFeeSummary);
router.get('/teacher', protect, authorize('teacher'), getTeacherSectionFees);
router.get('/me', protect, authorize('student'), getMyFees);
router.post('/pay', protect, authorize('student'), payMyFee);

module.exports = router;
