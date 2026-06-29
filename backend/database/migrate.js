// Database migration script
// Usage: node database/migrate.js
// Run from the backend directory with a valid DATABASE_URL in .env

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const migrate = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to database.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schema);
    console.log('Schema applied.');

    const seedPath = path.join(__dirname, 'seed.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');
    await client.query(seed);
    console.log('Seed data inserted (templates).');

    console.log('\nMigration complete. Database is ready.');
  } catch (err) {
    console.error('\nMigration failed:', err.message);
    console.error('Make sure DATABASE_URL in .env points to a running PostgreSQL instance.');
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
};

migrate();
