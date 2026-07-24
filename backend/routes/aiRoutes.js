const express = require('express');
const router = express.Router();
const { runAIAnalysis, updateCAPAChecklist } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/analyze-inspection', protect, runAIAnalysis);
router.patch('/capa/:inspectionId', protect, updateCAPAChecklist);

module.exports = router;
