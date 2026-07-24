const mongoose = require('mongoose');

const capaItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  task: { type: String, required: true },
  owner: { type: String, default: 'Unassigned' },
  deadline: { type: String, default: 'Immediate' },
  completed: { type: Boolean, default: false },
  verified_by: { type: String, default: '' }
});

const aiQualityRecordSchema = new mongoose.Schema(
  {
    inspection_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inspection',
      required: true,
      unique: true
    },
    summary: {
      type: String,
      required: true
    },
    detailed_explanation: {
      type: String,
      required: true
    },
    recurring_patterns: {
      type: String,
      default: 'No immediate cross-batch trend detected.'
    },
    evidence_gaps: {
      type: String,
      default: 'None specified.'
    },
    root_cause_questions: {
      type: [String],
      default: []
    },
    defect_examples: {
      type: [String],
      default: []
    },
    capa_checklist: [capaItemSchema],
    approval_status: {
      type: String,
      enum: ['Pending', 'Approved', 'Quarantined', 'Scrapped'],
      default: 'Pending'
    },
    engineer_comments: {
      type: String,
      default: ''
    },
    disposition_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    disposition_date: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AIQualityRecord', aiQualityRecordSchema);
