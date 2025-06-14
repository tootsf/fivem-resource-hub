const { Pool } = require('pg');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Parse the DATABASE_URL
    const dbUrl = new URL(process.env.DATABASE_URL);
    console.log(`📡 Connecting to: ${dbUrl.hostname}:${dbUrl.port}/${dbUrl.pathname.slice(1)}`);
    
    // Create connection pool
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });

    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    console.log(`⏰ Database time: ${result.rows[0].now}`);
    
    client.release();
    await pool.end();
    
    console.log('🎉 Database test complete!');
    return true;
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 This usually means PostgreSQL is not running or not installed');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 PostgreSQL is not running on the specified port');
    } else if (error.code === '3D000') {
      console.log('💡 Database does not exist - we can create it');
    } else if (error.code === '28P01') {
      console.log('💡 Authentication failed - check username/password in DATABASE_URL');
    }
    
    return false;
  }
}

async function createDatabaseIfNotExists() {
  console.log('🏗️ Attempting to create database...');
  
  try {
    // Connect to postgres database to create our database
    const dbUrl = new URL(process.env.DATABASE_URL);
    const adminConnectionString = `postgresql://${dbUrl.username}:${dbUrl.password}@${dbUrl.hostname}:${dbUrl.port}/postgres`;
    
    const adminPool = new Pool({
      connectionString: adminConnectionString,
      ssl: false
    });

    const client = await adminPool.connect();
    
    // Check if database exists
    const dbName = dbUrl.pathname.slice(1); // Remove leading slash
    const checkResult = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    
    if (checkResult.rows.length === 0) {
      // Database doesn't exist, create it
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully!`);
    } else {
      console.log(`📁 Database "${dbName}" already exists`);
    }
    
    client.release();
    await adminPool.end();
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to create database:');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function setupSchema() {
  console.log('📋 Setting up database schema...');
  
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });

    const client = await pool.connect();
    
    // Read and execute schema
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '..', 'database', '01_initial_schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      return false;
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schema);
    
    console.log('✅ Database schema created successfully!');
    
    client.release();
    await pool.end();
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to setup schema:');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function fullDatabaseSetup() {
  console.log('🚀 Starting full database setup...\n');
  
  // Step 1: Test basic connection (this might fail if DB doesn't exist)
  const connectionWorks = await testDatabaseConnection();
  
  if (!connectionWorks) {
    console.log('\n🔧 Connection failed, attempting to create database...');
    const created = await createDatabaseIfNotExists();
    
    if (created) {
      console.log('\n🔄 Retesting connection...');
      const retestWorks = await testDatabaseConnection();
      if (!retestWorks) {
        console.log('❌ Still cannot connect after creating database');
        return false;
      }
    } else {
      console.log('❌ Cannot proceed without database connection');
      return false;
    }
  }
  
  // Step 2: Setup schema
  console.log('\n📋 Setting up schema...');
  const schemaWorked = await setupSchema();
  
  if (schemaWorked) {
    console.log('\n🎉 Database setup completed successfully!');
    console.log('✅ You can now start the main server');
    return true;
  } else {
    console.log('\n❌ Database setup failed');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  fullDatabaseSetup()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { 
  testDatabaseConnection, 
  createDatabaseIfNotExists, 
  setupSchema, 
  fullDatabaseSetup 
};
