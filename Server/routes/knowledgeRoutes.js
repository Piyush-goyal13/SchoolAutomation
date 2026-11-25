const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { addDocument, getDocuments, deleteDocument, seedKnowledgeBase } = require('../Controllers/knowledgeController');

router.post('/', protect, authorize('admin'), addDocument);
router.get('/', protect, getDocuments);
router.delete('/:id', protect, authorize('admin'), deleteDocument);
router.post('/seed', protect, authorize('admin'), seedKnowledgeBase);

module.exports = router;
