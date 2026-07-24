const { Client } = require('pg');
const mongoose = require('mongoose');
const { seedMemoryStore } = require('./memoryStore');

let isPgConnected = false;
let isMongoConnected = false;
let pgClient = null;

const initPostgresTables = async (client) => {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'Inspector',
        plant_location VARCHAR(255) DEFAULT 'Plant Alpha - Detroit',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS product_plans (
        id VARCHAR(255) PRIMARY KEY,
        product_code VARCHAR(100) UNIQUE NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        process_stages JSONB DEFAULT '[]',
        quality_specifications JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS inspections (
        id VARCHAR(255) PRIMARY KEY,
        batch_number VARCHAR(100) NOT NULL,
        product_id VARCHAR(255),
        inspector_id VARCHAR(255),
        stage VARCHAR(255),
        machine_settings JSONB DEFAULT '{}',
        material_lots JSONB DEFAULT '[]',
        operator_name VARCHAR(255),
        measurements JSONB DEFAULT '[]',
        defect_logs JSONB DEFAULT '[]',
        status VARCHAR(50) DEFAULT 'Under Review',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_quality_records (
        id VARCHAR(255) PRIMARY KEY,
        inspection_id VARCHAR(255) UNIQUE NOT NULL,
        summary TEXT,
        detailed_explanation TEXT,
        recurring_patterns TEXT,
        evidence_gaps TEXT,
        root_cause_questions JSONB DEFAULT '[]',
        defect_examples JSONB DEFAULT '[]',
        capa_checklist JSONB DEFAULT '[]',
        approval_status VARCHAR(50) DEFAULT 'Pending',
        engineer_comments TEXT,
        disposition_by VARCHAR(255),
        disposition_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[Database] Supabase PostgreSQL tables verified/created successfully!');
  } catch (err) {
    console.error('[Database PG Init Warning]', err.message);
  }
};

const connectDB = async () => {
  const dbUrl = process.env.DATABASE_URL || '';

  // Always disable Mongoose query buffering to prevent timeouts if Mongo is not in use
  mongoose.set('bufferCommands', false);

  if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
    try {
      console.log('[Database] Connecting to Supabase PostgreSQL...');
      pgClient = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
      });
      await pgClient.connect();
      isPgConnected = true;
      console.log('[Database] Supabase PostgreSQL Connected Successfully!');
      await initPostgresTables(pgClient);
      await seedMemoryStore(); // Ensure seed accounts (engineer@plant.com, inspector@plant.com, admin@plant.com)
      return;
    } catch (pgErr) {
      console.warn(`[Database Warning] Supabase PostgreSQL connection error: ${pgErr.message}`);
      isPgConnected = false;
    }
  }

  // If not Postgres or Postgres failed, check MongoDB
  if (dbUrl.startsWith('mongodb')) {
    try {
      const conn = await mongoose.connect(dbUrl, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000
      });
      isMongoConnected = true;
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      isMongoConnected = false;
      console.warn(`[Database Notice] MongoDB not connected: ${error.message}`);
    }
  }

  console.log(`[Database Notice] Operating in-memory mode.`);
  await seedMemoryStore();
};

const getIsPgConnected = () => isPgConnected && pgClient !== null;
const getIsMongoConnected = () => isMongoConnected && mongoose.connection.readyState === 1;
const getPgClient = () => pgClient;

module.exports = connectDB;
module.exports.getIsPgConnected = getIsPgConnected;
module.exports.getIsMongoConnected = getIsMongoConnected;
module.exports.getPgClient = getPgClient;
