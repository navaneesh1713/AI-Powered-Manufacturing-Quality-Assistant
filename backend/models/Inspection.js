const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  parameter: { type: String, required: true },
  value: { type: Number, required: true },
  unit: { type: String, default: 'mm' },
  min_limit: { type: Number },
  max_limit: { type: Number },
  is_within_spec: { type: Boolean, required: true }
});

const defectLogSchema = new mongoose.Schema({
  defect_type: { type: String, required: true },
  count: { type: Number, default: 1 },
  severity: { type: String, enum: ['Minor', 'Major', 'Critical'], default: 'Minor' },
  description: { type: String, default: '' }
});

const inspectionSchema = new mongoose.Schema(
  {
    batch_number: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductPlan',
      required: true
    },
    inspector_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    stage: {
      type: String,
      default: 'Final Assembly'
    },
    machine_settings: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    material_lots: {
      type: [String],
      default: []
    },
    operator_name: {
      type: String,
      required: [true, 'Operator name is required'],
      trim: true
    },
    measurements: [measurementSchema],
    defect_logs: [defectLogSchema],
    status: {
      type: String,
      enum: ['Draft', 'Under Review', 'Approved', 'Quarantined', 'Scrapped'],
      default: 'Under Review'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Inspection', inspectionSchema);
