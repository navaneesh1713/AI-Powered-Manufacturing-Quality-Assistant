const Inspection = require('../models/Inspection');
const ProductPlan = require('../models/ProductPlan');
const AIQualityRecord = require('../models/AIQualityRecord');
const { analyzeQualityInspection } = require('../services/geminiService');
const { getIsPgConnected, getIsMongoConnected, getPgClient } = require('../config/db');
const { memoryStore } = require('../config/memoryStore');

// @desc    Trigger AI Quality Analysis for an inspection via Gemini
// @route   POST /api/ai/analyze-inspection
// @access  Private
const runAIAnalysis = async (req, res) => {
  try {
    const { inspection_id } = req.body;

    if (!inspection_id) {
      return res.status(400).json({ message: 'inspection_id is required' });
    }

    if (getIsPgConnected()) {
      let inspection = memoryStore.inspections.find(i => i._id === inspection_id);

      if (!inspection) {
        const client = getPgClient();
        const resPg = await client.query('SELECT * FROM inspections WHERE id = $1', [inspection_id]);
        inspection = resPg.rows[0];
      }

      if (!inspection) return res.status(404).json({ message: 'Inspection not found' });

      const product = typeof inspection.product_id === 'object' ? inspection.product_id : (memoryStore.products.find(p => p._id === inspection.product_id) || memoryStore.products[0]);
      const aiOutput = await analyzeQualityInspection(inspection, product);

      let record = memoryStore.aiRecords.find(a => a.inspection_id === inspection._id);

      if (record) {
        record.summary = aiOutput.summary;
        record.detailed_explanation = aiOutput.detailed_explanation;
        record.recurring_patterns = aiOutput.recurring_patterns || record.recurring_patterns;
        record.evidence_gaps = aiOutput.evidence_gaps || record.evidence_gaps;
        record.root_cause_questions = aiOutput.root_cause_questions || [];
        record.defect_examples = aiOutput.defect_examples || [];
        record.capa_checklist = aiOutput.capa_checklist || [];
      } else {
        record = {
          _id: `ai_${Date.now()}`,
          inspection_id: inspection._id,
          summary: aiOutput.summary,
          detailed_explanation: aiOutput.detailed_explanation,
          recurring_patterns: aiOutput.recurring_patterns || 'No cross-batch trend detected.',
          evidence_gaps: aiOutput.evidence_gaps || 'None.',
          root_cause_questions: aiOutput.root_cause_questions || [],
          defect_examples: aiOutput.defect_examples || [],
          capa_checklist: aiOutput.capa_checklist || [],
          approval_status: 'Pending',
          createdAt: new Date().toISOString()
        };
        memoryStore.aiRecords.push(record);
      }

      return res.status(200).json({
        message: 'AI Quality Analysis generated successfully via Gemini',
        aiRecord: record
      });
    } else if (getIsMongoConnected()) {
      const inspection = await Inspection.findById(inspection_id).populate('product_id');
      if (!inspection) return res.status(404).json({ message: 'Inspection not found' });

      const product = inspection.product_id;
      const aiOutput = await analyzeQualityInspection(inspection, product);

      let record = await AIQualityRecord.findOne({ inspection_id: inspection._id });

      if (record) {
        record.summary = aiOutput.summary;
        record.detailed_explanation = aiOutput.detailed_explanation;
        record.recurring_patterns = aiOutput.recurring_patterns || record.recurring_patterns;
        record.evidence_gaps = aiOutput.evidence_gaps || record.evidence_gaps;
        record.root_cause_questions = aiOutput.root_cause_questions || [];
        record.defect_examples = aiOutput.defect_examples || [];
        record.capa_checklist = aiOutput.capa_checklist || [];
        await record.save();
      } else {
        record = await AIQualityRecord.create({
          inspection_id: inspection._id,
          summary: aiOutput.summary,
          detailed_explanation: aiOutput.detailed_explanation,
          recurring_patterns: aiOutput.recurring_patterns || 'No cross-batch trend detected.',
          evidence_gaps: aiOutput.evidence_gaps || 'None.',
          root_cause_questions: aiOutput.root_cause_questions || [],
          defect_examples: aiOutput.defect_examples || [],
          capa_checklist: aiOutput.capa_checklist || [],
          approval_status: 'Pending'
        });
      }

      return res.status(200).json({
        message: 'AI Quality Analysis generated successfully via Gemini',
        aiRecord: record
      });
    } else {
      const inspection = memoryStore.inspections.find(i => i._id === inspection_id);
      if (!inspection) return res.status(404).json({ message: 'Inspection not found' });

      const product = typeof inspection.product_id === 'object' ? inspection.product_id : memoryStore.products.find(p => p._id === inspection.product_id);
      const aiOutput = await analyzeQualityInspection(inspection, product);

      let record = memoryStore.aiRecords.find(a => a.inspection_id === inspection._id);

      if (record) {
        record.summary = aiOutput.summary;
        record.detailed_explanation = aiOutput.detailed_explanation;
        record.recurring_patterns = aiOutput.recurring_patterns || record.recurring_patterns;
        record.evidence_gaps = aiOutput.evidence_gaps || record.evidence_gaps;
        record.root_cause_questions = aiOutput.root_cause_questions || [];
        record.defect_examples = aiOutput.defect_examples || [];
        record.capa_checklist = aiOutput.capa_checklist || [];
      } else {
        record = {
          _id: `ai_${Date.now()}`,
          inspection_id: inspection._id,
          summary: aiOutput.summary,
          detailed_explanation: aiOutput.detailed_explanation,
          recurring_patterns: aiOutput.recurring_patterns || 'No cross-batch trend detected.',
          evidence_gaps: aiOutput.evidence_gaps || 'None.',
          root_cause_questions: aiOutput.root_cause_questions || [],
          defect_examples: aiOutput.defect_examples || [],
          capa_checklist: aiOutput.capa_checklist || [],
          approval_status: 'Pending',
          createdAt: new Date().toISOString()
        };
        memoryStore.aiRecords.push(record);
      }

      return res.status(200).json({
        message: 'AI Quality Analysis generated successfully via Gemini',
        aiRecord: record
      });
    }
  } catch (error) {
    console.error('[AI Controller Error]', error.stack || error.message);
    res.status(500).json({ message: `AI Analysis failed: ${error.message}` });
  }
};

// @desc    Update CAPA checklist item status or assignment
// @route   PATCH /api/ai/capa/:inspectionId
// @access  Private
const updateCAPAChecklist = async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const { itemId, completed, owner, deadline, verified_by } = req.body;

    if (getIsMongoConnected()) {
      const record = await AIQualityRecord.findOne({ inspection_id: inspectionId });
      if (!record) return res.status(404).json({ message: 'AI Quality Record not found for this inspection' });

      const itemIndex = record.capa_checklist.findIndex(item => item.id === itemId || item._id?.toString() === itemId);
      if (itemIndex === -1) return res.status(404).json({ message: 'CAPA checklist item not found' });

      if (typeof completed === 'boolean') record.capa_checklist[itemIndex].completed = completed;
      if (owner) record.capa_checklist[itemIndex].owner = owner;
      if (deadline) record.capa_checklist[itemIndex].deadline = deadline;
      if (verified_by !== undefined) record.capa_checklist[itemIndex].verified_by = verified_by;

      await record.save();

      return res.json({
        message: 'CAPA item updated successfully',
        aiRecord: record
      });
    } else {
      const record = memoryStore.aiRecords.find(a => a.inspection_id === inspectionId);
      if (!record) return res.status(404).json({ message: 'AI Quality Record not found for this inspection' });

      const itemIndex = record.capa_checklist.findIndex(item => item.id === itemId || item._id?.toString() === itemId);
      if (itemIndex === -1) return res.status(404).json({ message: 'CAPA checklist item not found' });

      if (typeof completed === 'boolean') record.capa_checklist[itemIndex].completed = completed;
      if (owner) record.capa_checklist[itemIndex].owner = owner;
      if (deadline) record.capa_checklist[itemIndex].deadline = deadline;
      if (verified_by !== undefined) record.capa_checklist[itemIndex].verified_by = verified_by;

      return res.json({
        message: 'CAPA item updated successfully',
        aiRecord: record
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { runAIAnalysis, updateCAPAChecklist };
