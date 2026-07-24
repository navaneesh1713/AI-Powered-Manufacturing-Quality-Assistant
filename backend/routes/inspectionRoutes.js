const express = require('express');
const router = express.Router();
const {
  createInspection,
  getInspections,
  getInspectionById,
  updateDisposition
} = require('../controllers/inspectionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getInspections);
router.post('/', protect, createInspection);
router.get('/:id', protect, getInspectionById);
router.patch('/:id/disposition', protect, authorize('Engineer', 'Approver', 'Admin'), updateDisposition);

module.exports = router;
