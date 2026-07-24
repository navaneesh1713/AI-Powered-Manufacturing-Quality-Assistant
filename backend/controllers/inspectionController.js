const Inspection = require('../models/Inspection');
const ProductPlan = require('../models/ProductPlan');
const AIQualityRecord = require('../models/AIQualityRecord');
const { getIsPgConnected, getIsMongoConnected, getPgClient } = require('../config/db');
const { memoryStore } = require('../config/memoryStore');

// @desc    Create a new quality inspection
// @route   POST /api/inspections
// @access  Private (Inspector, Engineer, Admin)
const createInspection = async (req, res) => {
  try {
    const {
      batch_number,
      product_id,
      stage,
      machine_settings,
      material_lots,
      operator_name,
      measurements,
      defect_logs,
      notes
    } = req.body;

    if (!batch_number || !product_id || !operator_name || !measurements || measurements.length === 0) {
      return res.status(400).json({ message: 'Missing required inspection fields (batch number, product ID, operator, measurements)' });
    }

    const inspId = `insp_${Date.now()}`;

    if (getIsPgConnected()) {
      const client = getPgClient();
      const prodRes = await client.query('SELECT * FROM product_plans WHERE id = $1', [product_id]);
      const product = prodRes.rows[0] || memoryStore.products.find(p => p._id === product_id);

      const quality_specifications = product?.quality_specifications || [];
      const processedMeasurements = measurements.map(m => {
        const spec = quality_specifications.find(s => s.parameter.toLowerCase() === m.parameter.toLowerCase());
        const min_limit = spec ? spec.min_limit : (m.min_limit ?? 0);
        const max_limit = spec ? spec.max_limit : (m.max_limit ?? 100);
        const is_within_spec = m.value >= min_limit && m.value <= max_limit;

        return {
          parameter: m.parameter,
          value: Number(m.value),
          unit: m.unit || (spec ? spec.unit : 'mm'),
          min_limit,
          max_limit,
          is_within_spec
        };
      });

      await client.query(
        `INSERT INTO inspections (id, batch_number, product_id, inspector_id, stage, machine_settings, material_lots, operator_name, measurements, defect_logs, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          inspId,
          batch_number,
          product_id,
          req.user._id,
          stage || 'Final Assembly',
          JSON.stringify(machine_settings || {}),
          JSON.stringify(Array.isArray(material_lots) ? material_lots : [material_lots].filter(Boolean)),
          operator_name,
          JSON.stringify(processedMeasurements),
          JSON.stringify(defect_logs || []),
          'Under Review',
          notes || ''
        ]
      );

      const newInsp = {
        _id: inspId,
        batch_number,
        product_id: product || product_id,
        inspector_id: req.user,
        stage: stage || 'Final Assembly',
        machine_settings: machine_settings || {},
        material_lots: Array.isArray(material_lots) ? material_lots : [material_lots].filter(Boolean),
        operator_name,
        measurements: processedMeasurements,
        defect_logs: defect_logs || [],
        notes: notes || '',
        status: 'Under Review',
        createdAt: new Date().toISOString()
      };

      memoryStore.inspections.push(newInsp);
      return res.status(201).json(newInsp);
    } else if (getIsMongoConnected()) {
      const product = await ProductPlan.findById(product_id);
      if (!product) return res.status(404).json({ message: 'Selected product plan not found' });

      const processedMeasurements = measurements.map(m => {
        const spec = product.quality_specifications.find(s => s.parameter.toLowerCase() === m.parameter.toLowerCase());
        const min_limit = spec ? spec.min_limit : (m.min_limit ?? 0);
        const max_limit = spec ? spec.max_limit : (m.max_limit ?? 100);
        const is_within_spec = m.value >= min_limit && m.value <= max_limit;

        return {
          parameter: m.parameter,
          value: Number(m.value),
          unit: m.unit || (spec ? spec.unit : 'mm'),
          min_limit,
          max_limit,
          is_within_spec
        };
      });

      const inspection = await Inspection.create({
        batch_number,
        product_id,
        inspector_id: req.user._id,
        stage: stage || 'Final Assembly',
        machine_settings: machine_settings || {},
        material_lots: Array.isArray(material_lots) ? material_lots : [material_lots].filter(Boolean),
        operator_name,
        measurements: processedMeasurements,
        defect_logs: defect_logs || [],
        notes: notes || '',
        status: 'Under Review'
      });

      const populatedInspection = await Inspection.findById(inspection._id)
        .populate('product_id', 'product_code product_name quality_specifications')
        .populate('inspector_id', 'name email role');

      return res.status(201).json(populatedInspection);
    } else {
      const product = memoryStore.products.find(p => p._id === product_id);

      const processedMeasurements = measurements.map(m => {
        const spec = product?.quality_specifications?.find(s => s.parameter.toLowerCase() === m.parameter.toLowerCase());
        const min_limit = spec ? spec.min_limit : (m.min_limit ?? 0);
        const max_limit = spec ? spec.max_limit : (m.max_limit ?? 100);
        const is_within_spec = m.value >= min_limit && m.value <= max_limit;

        return {
          parameter: m.parameter,
          value: Number(m.value),
          unit: m.unit || (spec ? spec.unit : 'mm'),
          min_limit,
          max_limit,
          is_within_spec
        };
      });

      const newInsp = {
        _id: inspId,
        batch_number,
        product_id: product || product_id,
        inspector_id: req.user,
        stage: stage || 'Final Assembly',
        machine_settings: machine_settings || {},
        material_lots: Array.isArray(material_lots) ? material_lots : [material_lots].filter(Boolean),
        operator_name,
        measurements: processedMeasurements,
        defect_logs: defect_logs || [],
        notes: notes || '',
        status: 'Under Review',
        createdAt: new Date().toISOString()
      };

      memoryStore.inspections.push(newInsp);
      return res.status(201).json(newInsp);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all inspections with filtering & search
// @route   GET /api/inspections
// @access  Private
const getInspections = async (req, res) => {
  try {
    const { batch, status, severity, product } = req.query;

    if (getIsPgConnected()) {
      const client = getPgClient();
      let query = 'SELECT id AS _id, batch_number, product_id, inspector_id, stage, machine_settings, material_lots, operator_name, measurements, defect_logs, status, notes, created_at FROM inspections';
      let params = [];
      let conditions = [];

      if (batch) {
        params.push(`%${batch}%`);
        conditions.push(`batch_number ILIKE $${params.length}`);
      }
      if (status && status !== 'All') {
        params.push(status);
        conditions.push(`status = $${params.length}`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      query += ' ORDER BY created_at DESC';

      const resPg = await client.query(query, params);
      let list = resPg.rows.map(row => {
        const prodObj = memoryStore.products.find(p => p._id === row.product_id) || { product_code: 'PROD-01', product_name: 'Manufacturing Component' };
        return { ...row, product_id: prodObj };
      });

      if (list.length === 0) list = [...memoryStore.inspections];
      return res.json(list);
    } else if (getIsMongoConnected()) {
      let filter = {};
      if (batch) filter.batch_number = { $regex: batch, $options: 'i' };
      if (status && status !== 'All') filter.status = status;
      if (severity && severity !== 'All') filter['defect_logs.severity'] = severity;
      if (product) filter.product_id = product;

      const inspections = await Inspection.find(filter)
        .populate('product_id', 'product_code product_name')
        .populate('inspector_id', 'name email role')
        .sort({ createdAt: -1 });

      return res.json(inspections);
    } else {
      let list = [...memoryStore.inspections];
      if (batch) list = list.filter(i => i.batch_number.toLowerCase().includes(batch.toLowerCase()));
      if (status && status !== 'All') list = list.filter(i => i.status === status);
      if (severity && severity !== 'All') list = list.filter(i => i.defect_logs.some(d => d.severity === severity));
      if (product) list = list.filter(i => (i.product_id?._id || i.product_id) === product);
      return res.json(list.reverse());
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single inspection by ID
// @route   GET /api/inspections/:id
// @access  Private
const getInspectionById = async (req, res) => {
  try {
    if (getIsPgConnected()) {
      const client = getPgClient();
      const resPg = await client.query('SELECT id AS _id, batch_number, product_id, inspector_id, stage, machine_settings, material_lots, operator_name, measurements, defect_logs, status, notes, created_at FROM inspections WHERE id = $1', [req.params.id]);

      let inspection = resPg.rows[0];
      if (!inspection) {
        inspection = memoryStore.inspections.find(i => i._id === req.params.id);
      } else {
        const prodObj = memoryStore.products.find(p => p._id === inspection.product_id) || { product_code: 'TB-900', product_name: 'Titanium Turbine Blade Gen-9', quality_specifications: [] };
        inspection.product_id = prodObj;
      }

      if (!inspection) return res.status(404).json({ message: 'Inspection record not found' });

      let aiRecord = memoryStore.aiRecords.find(a => a.inspection_id === inspection._id);
      return res.json({ inspection, aiRecord });
    } else if (getIsMongoConnected()) {
      const inspection = await Inspection.findById(req.params.id)
        .populate('product_id')
        .populate('inspector_id', 'name email role');

      if (!inspection) return res.status(404).json({ message: 'Inspection record not found' });

      const aiRecord = await AIQualityRecord.findOne({ inspection_id: inspection._id })
        .populate('disposition_by', 'name email role');

      return res.json({ inspection, aiRecord });
    } else {
      const inspection = memoryStore.inspections.find(i => i._id === req.params.id);
      if (!inspection) return res.status(404).json({ message: 'Inspection record not found' });

      const aiRecord = memoryStore.aiRecords.find(a => a.inspection_id === inspection._id);
      return res.json({ inspection, aiRecord });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update inspection disposition status
// @route   PATCH /api/inspections/:id/disposition
// @access  Private (Engineer, Approver, Admin)
const updateDisposition = async (req, res) => {
  try {
    const { status, engineer_comments } = req.body;

    if (getIsPgConnected()) {
      const client = getPgClient();
      await client.query('UPDATE inspections SET status = $1 WHERE id = $2', [status, req.params.id]);

      let inspection = memoryStore.inspections.find(i => i._id === req.params.id);
      if (inspection) inspection.status = status;

      let aiRecord = memoryStore.aiRecords.find(a => a.inspection_id === req.params.id);
      if (aiRecord) {
        aiRecord.approval_status = status;
        aiRecord.engineer_comments = engineer_comments || aiRecord.engineer_comments;
        aiRecord.disposition_by = req.user;
        aiRecord.disposition_date = new Date().toISOString();
      }

      return res.json({
        message: `Batch disposition updated to '${status}' successfully`,
        inspection,
        aiRecord
      });
    } else if (getIsMongoConnected()) {
      const inspection = await Inspection.findById(req.params.id);
      if (!inspection) return res.status(404).json({ message: 'Inspection not found' });

      inspection.status = status;
      await inspection.save();

      let aiRecord = await AIQualityRecord.findOne({ inspection_id: inspection._id });
      if (aiRecord) {
        aiRecord.approval_status = status;
        aiRecord.engineer_comments = engineer_comments || aiRecord.engineer_comments;
        aiRecord.disposition_by = req.user._id;
        aiRecord.disposition_date = new Date();
        await aiRecord.save();
      }

      const updatedInspection = await Inspection.findById(inspection._id)
        .populate('product_id')
        .populate('inspector_id', 'name email role');

      return res.json({
        message: `Batch disposition updated to '${status}' successfully`,
        inspection: updatedInspection,
        aiRecord
      });
    } else {
      const inspection = memoryStore.inspections.find(i => i._id === req.params.id);
      if (!inspection) return res.status(404).json({ message: 'Inspection not found' });

      inspection.status = status;

      let aiRecord = memoryStore.aiRecords.find(a => a.inspection_id === inspection._id);
      if (aiRecord) {
        aiRecord.approval_status = status;
        aiRecord.engineer_comments = engineer_comments || aiRecord.engineer_comments;
        aiRecord.disposition_by = req.user;
        aiRecord.disposition_date = new Date().toISOString();
      }

      return res.json({
        message: `Batch disposition updated to '${status}' successfully`,
        inspection,
        aiRecord
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createInspection,
  getInspections,
  getInspectionById,
  updateDisposition
};
