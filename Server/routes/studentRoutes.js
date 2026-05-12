const express = require('express');
const router = express.Router();
const { getStudents, registerStudent, updateStudent, deleteStudent, getMyProfile } = require('../Controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/me', protect, authorize('student'), getMyProfile);
router.get('/', protect, authorize('admin', 'teacher'), getStudents);
router.post('/', protect, authorize('admin'), registerStudent);
router.put('/:id', protect, authorize('admin'), updateStudent);
router.delete('/:id', protect, authorize('admin'), deleteStudent);

module.exports = router;
