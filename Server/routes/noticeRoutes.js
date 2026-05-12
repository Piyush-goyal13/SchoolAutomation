const express = require('express');
const router = express.Router();
const { createNotice, createTeacherNotice, getAllNotices, deleteNotice, getTeacherNotices, getStudentNotices } = require('../Controllers/noticeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/admin', protect, authorize('admin'), createNotice);
router.post('/teacher', protect, authorize('teacher'), createTeacherNotice);
router.get('/admin', protect, authorize('admin'), getAllNotices);
router.delete('/:id', protect, authorize('admin'), deleteNotice);
router.get('/teacher', protect, authorize('teacher'), getTeacherNotices);
router.get('/student', protect, authorize('student'), getStudentNotices);

module.exports = router;
