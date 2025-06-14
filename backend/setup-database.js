const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  console.log('🗄️ Setting up database...');

  // Create a connection without specifying a database first
  const adminPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  });

  try {
    // Create database if it doesn't exist
    const dbName = 'fivem_resource_hub';
    
    try {
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created successfully`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log(`📁 Database '${dbName}' already exists`);
      } else {
        throw error;
      }
    }

    await adminPool.end();

    // Now connect to the created database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${dbName}`,
      ssl: false
    });

    // Read and execute schema file
    const schemaPath = path.join(__dirname, '..', 'database', '01_initial_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Creating tables and indexes...');
    await pool.query(schema);
    console.log('✅ Database schema created successfully');

    // Test the connection
    const result = await pool.query('SELECT NOW()');
    console.log('🔗 Database connection test successful:', result.rows[0].now);

    await pool.end();
    console.log('🎉 Database setup completed!');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
