const ProductPlan = require('../models/ProductPlan');
const { getIsPgConnected, getIsMongoConnected, getPgClient } = require('../config/db');
const { memoryStore } = require('../config/memoryStore');

// @desc    Get all product plans
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    if (getIsPgConnected()) {
      const client = getPgClient();
      const resPg = await client.query('SELECT id AS _id, product_code, product_name, process_stages, quality_specifications, created_at FROM product_plans ORDER BY created_at DESC');
      if (resPg.rows.length > 0) return res.json(resPg.rows);
      return res.json(memoryStore.products);
    } else if (getIsMongoConnected()) {
      const products = await ProductPlan.find({}).sort({ createdAt: -1 });
      return res.json(products);
    } else {
      return res.json(memoryStore.products);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product plan by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
  try {
    if (getIsPgConnected()) {
      const client = getPgClient();
      const resPg = await client.query('SELECT id AS _id, product_code, product_name, process_stages, quality_specifications FROM product_plans WHERE id = $1', [req.params.id]);
      if (resPg.rows.length > 0) return res.json(resPg.rows[0]);
      const memProduct = memoryStore.products.find(p => p._id === req.params.id);
      if (memProduct) return res.json(memProduct);
      return res.status(404).json({ message: 'Product plan not found' });
    } else if (getIsMongoConnected()) {
      const product = await ProductPlan.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product plan not found' });
      return res.json(product);
    } else {
      const product = memoryStore.products.find(p => p._id === req.params.id);
      if (!product) return res.status(404).json({ message: 'Product plan not found' });
      return res.json(product);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product plan with specifications
// @route   POST /api/products
// @access  Private (Engineer, Admin)
const createProduct = async (req, res) => {
  try {
    const { product_code, product_name, process_stages, quality_specifications } = req.body;

    if (!product_code || !product_name) {
      return res.status(400).json({ message: 'Product code and product name are required' });
    }

    const codeUpper = product_code.toUpperCase();
    const prodId = `prod_${Date.now()}`;

    if (getIsPgConnected()) {
      const client = getPgClient();
      const existing = await client.query('SELECT id FROM product_plans WHERE product_code = $1', [codeUpper]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: `Product with code ${codeUpper} already exists` });
      }

      await client.query(
        'INSERT INTO product_plans (id, product_code, product_name, process_stages, quality_specifications) VALUES ($1, $2, $3, $4, $5)',
        [prodId, codeUpper, product_name, JSON.stringify(process_stages || []), JSON.stringify(quality_specifications || [])]
      );

      const newProd = {
        _id: prodId,
        product_code: codeUpper,
        product_name,
        process_stages: process_stages || [],
        quality_specifications: quality_specifications || []
      };

      return res.status(201).json(newProd);
    } else if (getIsMongoConnected()) {
      const existingProduct = await ProductPlan.findOne({ product_code: codeUpper });
      if (existingProduct) {
        return res.status(400).json({ message: `Product with code ${codeUpper} already exists` });
      }

      const product = await ProductPlan.create({
        product_code: codeUpper,
        product_name,
        process_stages: process_stages || ['Raw Material Receiving', 'Machining', 'Heat Treatment', 'Final Assembly'],
        quality_specifications: quality_specifications || []
      });

      return res.status(201).json(product);
    } else {
      const existing = memoryStore.products.find(p => p.product_code === codeUpper);
      if (existing) {
        return res.status(400).json({ message: `Product with code ${codeUpper} already exists` });
      }

      const newProd = {
        _id: prodId,
        product_code: codeUpper,
        product_name,
        process_stages: process_stages || [],
        quality_specifications: quality_specifications || [],
        createdAt: new Date().toISOString()
      };

      memoryStore.products.push(newProd);
      return res.status(201).json(newProd);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProducts, getProductById, createProduct };
