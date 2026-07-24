const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getProducts);
router.get('/:id', protect, getProductById);
router.post('/', protect, authorize('Engineer', 'Admin', 'Approver'), createProduct);

module.exports = router;
