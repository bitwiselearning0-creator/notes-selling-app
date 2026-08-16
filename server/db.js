const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'bitwise_admin',
  password: process.env.DB_PASSWORD || 'BitwisePass2026!',
  database: process.env.DB_NAME || 'bitwise_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

// Auto-run Database Schema Migrations on Startup
const initDbSchema = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(255),
        role VARCHAR(50) DEFAULT 'student',
        password_hash VARCHAR(255),
        auth_provider VARCHAR(50) DEFAULT 'email',
        provider_user_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS provider_user_id VARCHAR(255);
      CREATE INDEX IF NOT EXISTS idx_profiles_provider ON profiles(auth_provider, provider_user_id);
    `);
    console.log('✅ PostgreSQL Schema & Migrations checked successfully!');
  } catch (err) {
    console.error('⚠️ DB Auto Migration Note:', err.message);
  }
};

initDbSchema();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
