const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const ProductPlan = require('../models/ProductPlan');
const Inspection = require('../models/Inspection');
const AIQualityRecord = require('../models/AIQualityRecord');

dotenv.config({ path: '../.env' });

const seedData = async () => {
  try {
    const connStr = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/ai_quality_assistant';
    await mongoose.connect(connStr);
    console.log('[Seed] Connected to database');

    // Clear existing data
    await User.deleteMany();
    await ProductPlan.deleteMany();
    await Inspection.deleteMany();
    await AIQualityRecord.deleteMany();

    // Create default users
    const admin = await User.create({
      name: 'Sarah Connor',
      email: 'admin@plant.com',
      password_hash: 'admin123',
      role: 'Admin',
      plant_location: 'Plant Alpha - Detroit'
    });

    const engineer = await User.create({
      name: 'Dr. Marcus Vance',
      email: 'engineer@plant.com',
      password_hash: 'engineer123',
      role: 'Engineer',
      plant_location: 'Plant Alpha - Detroit'
    });

    const inspector = await User.create({
      name: 'Alex Rivera',
      email: 'inspector@plant.com',
      password_hash: 'inspector123',
      role: 'Inspector',
      plant_location: 'Plant Alpha - Detroit'
    });

    console.log('[Seed] Users created:', [admin.email, engineer.email, inspector.email]);

    // Create sample product plans
    const product1 = await ProductPlan.create({
      product_code: 'TB-900',
      product_name: 'Titanium Turbine Blade Gen-9',
      process_stages: ['Investment Casting', '5-Axis CNC Machining', 'Thermal Barrier Coating', 'Coordinate Measurement (CMM)'],
      quality_specifications: [
        { parameter: 'Airfoil Thickness', min_limit: 12.40, max_limit: 12.60, unit: 'mm', target_value: 12.50 },
        { parameter: 'Root Width', min_limit: 44.80, max_limit: 45.20, unit: 'mm', target_value: 45.00 },
        { parameter: 'Surface Roughness (Ra)', min_limit: 0.1, max_limit: 0.8, unit: 'µm', target_value: 0.4 },
        { parameter: 'Coating Micro-Hardness', min_limit: 750, max_limit: 950, unit: 'HV', target_value: 850 }
      ]
    });

    const product2 = await ProductPlan.create({
      product_code: 'EV-BAT-400',
      product_name: 'EV Battery Enclosure Assembly',
      process_stages: ['Aluminum Stamping', 'Laser Welding', 'Helium Leak Testing', 'Final Inspection'],
      quality_specifications: [
        { parameter: 'Weld Bead Depth', min_limit: 2.10, max_limit: 2.50, unit: 'mm', target_value: 2.30 },
        { parameter: 'Flange Flatness', min_limit: 0.0, max_limit: 0.15, unit: 'mm', target_value: 0.05 },
        { parameter: 'Helium Leak Rate', min_limit: 0.0, max_limit: 1.0, unit: 'mbar-L/s', target_value: 0.1 }
      ]
    });

    console.log('[Seed] Products created:', [product1.product_code, product2.product_code]);

    // Create sample inspection
    const sampleInspection = await Inspection.create({
      batch_number: 'B2026-0724-01',
      product_id: product1._id,
      inspector_id: inspector._id,
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
      notes: 'Sampled 10 blades from CNC machine #4. Coolant temperature was running elevated.'
    });

    // Create sample AI Record
    await AIQualityRecord.create({
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
      approval_status: 'Pending'
    });

    console.log('[Seed] Sample inspection & AI record created!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedData();
