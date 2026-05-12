const express = require('express');
const router = express.Router();
const { getExamTypes, getMyTeachingSections, getMarksForSection, saveMarks, getMyMarks } = require('../Controllers/marksController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/exam-types', protect, getExamTypes);
router.get('/my-sections', protect, authorize('teacher'), getMyTeachingSections);
router.get('/section', protect, authorize('teacher'), getMarksForSection);
router.post('/', protect, authorize('teacher'), saveMarks);
router.get('/me', protect, authorize('student'), getMyMarks);

module.exports = router;
