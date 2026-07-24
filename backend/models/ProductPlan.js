const mongoose = require('mongoose');

const qualitySpecificationSchema = new mongoose.Schema({
  parameter: { type: String, required: true, trim: true },
  min_limit: { type: Number, required: true },
  max_limit: { type: Number, required: true },
  unit: { type: String, default: 'mm' },
  target_value: { type: Number }
});

const productPlanSchema = new mongoose.Schema(
  {
    product_code: {
      type: String,
      required: [true, 'Product code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    product_name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    process_stages: {
      type: [String],
      default: ['Raw Material Receiving', 'Machining', 'Heat Treatment', 'Final Assembly', 'Packaging']
    },
    quality_specifications: [qualitySpecificationSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ProductPlan', productPlanSchema);
