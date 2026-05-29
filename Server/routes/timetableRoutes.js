const express = require('express');
const router = express.Router();
const { getTimetable, saveTimetable, deleteTimetable, getSlots, getMyTimetable, generateTimetable } = require('../Controllers/timetableController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/slots', protect, getSlots);
router.get('/teacher/me', protect, authorize('teacher'), getMyTimetable);
router.get('/', protect, getTimetable);
router.post('/generate', protect, authorize('admin'), generateTimetable);
router.post('/', protect, authorize('admin'), saveTimetable);
router.delete('/', protect, authorize('admin'), deleteTimetable);

module.exports = router;
