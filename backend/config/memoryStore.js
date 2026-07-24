const bcrypt = require('bcryptjs');

// In-Memory Data Store when MongoDB is offline
const memoryStore = {
  users: [],
  products: [],
  inspections: [],
  aiRecords: []
};

// Seed initial memory data
const seedMemoryStore = async () => {
  if (memoryStore.users.length > 0) return;

  console.log('[MemoryStore] Initializing instant in-memory fallback data...');

  const passHashAdmin = await bcrypt.hash('admin123', 10);
  const passHashEng = await bcrypt.hash('engineer123', 10);
  const passHashInsp = await bcrypt.hash('inspector123', 10);

  const admin = {
    _id: 'usr_admin_01',
    name: 'Sarah Connor',
    email: 'admin@plant.com',
    password_hash: passHashAdmin,
    role: 'Admin',
    plant_location: 'Plant Alpha - Detroit',
    matchPassword: async function (p) { return await bcrypt.compare(p, this.password_hash); }
  };

  const engineer = {
    _id: 'usr_eng_02',
    name: 'Dr. Marcus Vance',
    email: 'engineer@plant.com',
    password_hash: passHashEng,
    role: 'Engineer',
    plant_location: 'Plant Alpha - Detroit',
    matchPassword: async function (p) { return await bcrypt.compare(p, this.password_hash); }
  };

  const inspector = {
    _id: 'usr_insp_03',
    name: 'Alex Rivera',
    email: 'inspector@plant.com',
    password_hash: passHashInsp,
    role: 'Inspector',
    plant_location: 'Plant Alpha - Detroit',
    matchPassword: async function (p) { return await bcrypt.compare(p, this.password_hash); }
  };

  memoryStore.users.push(admin, engineer, inspector);

  const prod1 = {
    _id: 'prod_tb900',
    product_code: 'TB-900',
    product_name: 'Titanium Turbine Blade Gen-9',
    process_stages: ['Investment Casting', '5-Axis CNC Machining', 'Thermal Barrier Coating', 'Coordinate Measurement (CMM)'],
    quality_specifications: [
      { parameter: 'Airfoil Thickness', min_limit: 12.40, max_limit: 12.60, unit: 'mm', target_value: 12.50 },
      { parameter: 'Root Width', min_limit: 44.80, max_limit: 45.20, unit: 'mm', target_value: 45.00 },
      { parameter: 'Surface Roughness (Ra)', min_limit: 0.1, max_limit: 0.8, unit: 'µm', target_value: 0.4 },
      { parameter: 'Coating Micro-Hardness', min_limit: 750, max_limit: 950, unit: 'HV', target_value: 850 }
    ],
    createdAt: new Date().toISOString()
  };

  const prod2 = {
    _id: 'prod_evbat400',
    product_code: 'EV-BAT-400',
    product_name: 'EV Battery Enclosure Assembly',
    process_stages: ['Aluminum Stamping', 'Laser Welding', 'Helium Leak Testing', 'Final Inspection'],
    quality_specifications: [
      { parameter: 'Weld Bead Depth', min_limit: 2.10, max_limit: 2.50, unit: 'mm', target_value: 2.30 },
      { parameter: 'Flange Flatness', min_limit: 0.0, max_limit: 0.15, unit: 'mm', target_value: 0.05 },
      { parameter: 'Helium Leak Rate', min_limit: 0.0, max_limit: 1.0, unit: 'mbar-L/s', target_value: 0.1 }
    ],
    createdAt: new Date().toISOString()
  };

  memoryStore.products.push(prod1, prod2);

  const sampleInspection = {
    _id: 'insp_sample_01',
    batch_number: 'B2026-0724-01',
    product_id: prod1,
    inspector_id: inspector,
    stage: 'Coordinate Measurement (CMM)',
    machine_settings: {
      spindle_rpm: 14500,
      feed_rate_mm_min: 1200,
      coolant_temp_c: 24.5,
      tool_wear_offset: 0.04
    },
    material_lots: ['LOT-TITANIUM-8849', 'COAT-HV-992'],
    operator_name: 'John Miller (Shift B)',
    measurements: [
      { parameter: 'Airfoil Thickness', value: 12.68, unit: 'mm', min_limit: 12.40, max_limit: 12.60, is_within_spec: false },
      { parameter: 'Root Width', value: 45.02, unit: 'mm', min_limit: 44.80, max_limit: 45.20, is_within_spec: true },
      { parameter: 'Surface Roughness (Ra)', value: 0.95, unit: 'µm', min_limit: 0.1, max_limit: 0.8, is_within_spec: false },
      { parameter: 'Coating Micro-Hardness', value: 840, unit: 'HV', min_limit: 750, max_limit: 950, is_within_spec: true }
    ],
    defect_logs: [
      { defect_type: 'Dimensional Deviation', count: 3, severity: 'Major', description: 'Airfoil thickness exceeds max tolerance threshold by +0.08mm' },
      { defect_type: 'Surface Micro-Roughness', count: 1, severity: 'Minor', description: 'Local micro-chatter marks near root trailing edge' }
    ],
    status: 'Under Review',
    notes: 'Sampled 10 blades from CNC machine #4. Coolant temperature was running elevated.',
    createdAt: new Date().toISOString()
  };

  memoryStore.inspections.push(sampleInspection);

  const sampleAI = {
    _id: 'ai_sample_01',
    inspection_id: sampleInspection._id,
    summary: `Quality anomaly flagged for Batch ${sampleInspection.batch_number}: Airfoil Thickness (+0.08mm) and Surface Roughness (0.95 µm) breached specification bounds.`,
    detailed_explanation: `Thermal expansion of CNC spindle housing likely occurred due to elevated coolant temperature (24.5°C vs 20.0°C nominal). Thermal drift resulted in +0.08mm offset on Z-axis tool paths, inducing micro-chatter marks on the airfoil trailing edge.`,
    recurring_patterns: 'Identical thermal chatter observed on CNC Machine #4 during late afternoon shifts when room ambient exceeds 28°C.',
    evidence_gaps: 'Missing continuous spindle thermal sensor telemetry and coolant pump pressure logs between 14:00 and 15:30.',
    defect_examples: ['Thermal drift dimensional expansion', 'High-frequency micro-chatter tool marks'],
    root_cause_questions: [
      'Why did coolant temperature reach 24.5°C without triggering a thermal alarm?',
      'Why did tool wear offset (+0.04mm) not compensate for thermal spindle expansion?',
      'Why was the auxiliary chiller unit offline during Shift B production?',
      'Why were chatter marks not detected during mid-shift optical scan?',
      'Why is CNC Machine #4 scheduled for chiller maintenance 2 weeks past due date?'
    ],
    capa_checklist: [
      { id: 'CAPA-1', task: 'Quarantine Batch B2026-0724-01 in Secure Cage B', owner: 'Alex Rivera', deadline: 'Immediate', completed: true, verified_by: 'Dr. Marcus Vance' },
      { id: 'CAPA-2', task: 'Inspect and flush heat-exchanger unit on CNC Machine #4 chiller', owner: 'Maintenance Lead', deadline: 'Within 6 Hours', completed: false },
      { id: 'CAPA-3', task: 'Recalibrate Z-axis tool offset compensation matrix', owner: 'Dr. Marcus Vance', deadline: 'Before Next Shift', completed: false }
    ],
    approval_status: 'Pending',
    createdAt: new Date().toISOString()
  };

  memoryStore.aiRecords.push(sampleAI);

  console.log('[MemoryStore] In-memory store ready with seed accounts (engineer@plant.com, inspector@plant.com, admin@plant.com).');
};

module.exports = { memoryStore, seedMemoryStore };
