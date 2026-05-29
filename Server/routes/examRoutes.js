const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    generateExam, saveExam, getMyExams, deleteExam, getExamResults,
    getLiveExams, getUpcomingExams, getCompletedExams, submitExam
} = require('../Controllers/examController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Teacher routes
router.post('/generate', protect, authorize('teacher'), upload.single('pdf'), generateExam);
router.post('/', protect, authorize('teacher'), saveExam);
router.get('/my', protect, authorize('teacher'), getMyExams);

// Student routes (must be before /:id to avoid route conflicts)
router.get('/live', protect, authorize('student'), getLiveExams);
router.get('/upcoming', protect, authorize('student'), getUpcomingExams);
router.get('/completed', protect, authorize('student'), getCompletedExams);
router.post('/:id/submit', protect, authorize('student'), submitExam);

// Parameterized routes last
router.get('/:id/results', protect, authorize('teacher'), getExamResults);
router.delete('/:id', protect, authorize('teacher'), deleteExam);

module.exports = router;
