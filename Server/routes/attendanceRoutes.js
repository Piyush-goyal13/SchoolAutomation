const express = require('express');
const router = express.Router();
const { markAttendance, getAttendanceByDate, getStudentAttendance, getMyAttendance, getAdminStudentAttendance } = require('../Controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/me', protect, authorize('student'), getMyAttendance);
router.get('/admin/:studentId', protect, authorize('admin'), getAdminStudentAttendance);
router.post('/', protect, authorize('teacher'), markAttendance);
router.get('/', protect, authorize('teacher'), getAttendanceByDate);
router.get('/student/:studentId', protect, authorize('teacher'), getStudentAttendance);

module.exports = router;
