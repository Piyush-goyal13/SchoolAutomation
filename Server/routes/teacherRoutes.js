const express = require('express');
const router = express.Router();
const { registerUser, getTeachers, updateTeacher, deleteTeacher, getMyProfile, assignSection, getMySection, getMyStudents } = require('../Controllers/teacherController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/me', protect, authorize('teacher'), getMyProfile);
router.get('/my-section', protect, authorize('teacher'), getMySection);
router.get('/my-students', protect, authorize('teacher'), getMyStudents);
router.post('/register', protect, authorize('admin'), registerUser);
router.get('/teachers', protect, authorize('admin'), getTeachers);
router.put('/teachers/:id', protect, authorize('admin'), updateTeacher);
router.put('/teachers/:id/assign', protect, authorize('admin'), assignSection);
router.delete('/teachers/:id', protect, authorize('admin'), deleteTeacher);

module.exports = router;
