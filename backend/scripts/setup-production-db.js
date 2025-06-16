const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database setup for Railway deployment
async function setupProductionDatabase() {
  console.log('🚀 Setting up FiveM Resource Hub Database...');

  // Use Railway's DATABASE_URL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Create all tables
    await createTables(pool);
    await seedResourceData(pool);
    console.log('✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function createTables(pool) {
  console.log('📊 Creating database tables...');

  // Resources table (for your 240 FiveM resources)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS resources (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      github_url VARCHAR(500) NOT NULL UNIQUE,
      language VARCHAR(100),
      stars INTEGER DEFAULT 0,
      rank INTEGER,
      players INTEGER DEFAULT 0,
      servers INTEGER DEFAULT 0,
      rank_change INTEGER DEFAULT 0,
      category VARCHAR(100),
      framework VARCHAR(100),
      tags TEXT[],
      claimed_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_resources_name ON resources(name);
    CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
    CREATE INDEX IF NOT EXISTS idx_resources_framework ON resources(framework);
    CREATE INDEX IF NOT EXISTS idx_resources_claimed_by ON resources(claimed_by);
  `);

  // Add claimed_by column if it doesn't exist (for existing databases)
  await pool.query(`
    ALTER TABLE resources 
    ADD COLUMN IF NOT EXISTS claimed_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  `);

  // Users table (for future GitHub OAuth)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      github_id VARCHAR(50) UNIQUE,
      username VARCHAR(255) NOT NULL,
      display_name VARCHAR(255),
      avatar_url TEXT,
      email VARCHAR(255),
      bio TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);

  // Reviews table (for Phase 3)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      title VARCHAR(255),
      content TEXT,
      pros TEXT[],
      cons TEXT[],
      compatibility JSONB,
      server_info JSONB,
      helpful_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(resource_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_reviews_resource_id ON reviews(resource_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
  `);

  console.log('✅ Database tables created successfully!');
}

async function seedResourceData(pool) {
  console.log('📦 Importing FiveM resource data...');

  // Check if resources already exist
  const existingCount = await pool.query('SELECT COUNT(*) FROM resources');
  if (parseInt(existingCount.rows[0].count) > 0) {
    console.log(`ℹ️ Found ${existingCount.rows[0].count} existing resources, skipping import`);
    return;
  }

  // Read the entries.json file
  const entriesPath = path.join(__dirname, '../data/entries.json');
  if (!fs.existsSync(entriesPath)) {
    console.log('⚠️ No entries.json found, creating sample data...');
    await createSampleData(pool);
    return;
  }

  const entries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
  console.log(`📁 Found ${entries.length} resources to import`);

  // Import each resource
  let imported = 0;
  for (const entry of entries) {
    try {
      await pool.query(`
        INSERT INTO resources (
          name, description, github_url, language, stars, rank,
          players, servers, rank_change, category, framework
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (github_url) DO NOTHING
      `, [
        entry.name || `Resource ${entry.id}`,
        entry.description || '',
        entry.github_url || `https://github.com/example/resource-${entry.id}`,
        entry.language || 'Lua',
        entry.stars || Math.floor(Math.random() * 1000),
        entry.rank || entry.id,
        entry.players || Math.floor(Math.random() * 500),
        entry.servers || Math.floor(Math.random() * 100),
        entry.rankChange || Math.floor(Math.random() * 21) - 10,
        entry.category || getRandomCategory(),
        entry.framework || getRandomFramework()
      ]);
      imported++;
    } catch (error) {
      console.error(`Error importing resource ${entry.id}:`, error.message);
    }
  }

  console.log(`✅ Imported ${imported} resources successfully!`);
}

async function createSampleData(pool) {
  console.log('🎲 Creating sample FiveM resources...');

  const sampleResources = [
    {
      name: 'ESX Core',
      description: 'Essential ESX framework for FiveM roleplay servers',
      github_url: 'https://github.com/esx-framework/esx-legacy',
      language: 'Lua',
      category: 'Framework',
      framework: 'ESX'
    },
    {
      name: 'QB-Core Framework',
      description: 'QBCore framework for advanced FiveM servers',
      github_url: 'https://github.com/qbcore-framework/qb-core',
      language: 'Lua',
      category: 'Framework',
      framework: 'QB-Core'
    },
    {
      name: 'Police MDT',
      description: 'Mobile Data Terminal for law enforcement',
      github_url: 'https://github.com/example/police-mdt',
      language: 'JavaScript',
      category: 'Job',
      framework: 'ESX'
    }
    // Add more sample data as needed
  ];

  for (const resource of sampleResources) {
    await pool.query(`
      INSERT INTO resources (name, description, github_url, language, category, framework, stars, players, servers)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (github_url) DO NOTHING
    `, [
      resource.name,
      resource.description,
      resource.github_url,
      resource.language,
      resource.category,
      resource.framework,
      Math.floor(Math.random() * 500),
      Math.floor(Math.random() * 200),
      Math.floor(Math.random() * 50)
    ]);
  }

  console.log('✅ Sample data created!');
}

function getRandomCategory() {
  const categories = ['Scripts', 'Maps', 'Vehicles', 'Jobs', 'UI', 'Framework', 'Tools'];
  return categories[Math.floor(Math.random() * categories.length)];
}

function getRandomFramework() {
  const frameworks = ['ESX', 'QB-Core', 'VORP', 'Standalone'];
  return frameworks[Math.floor(Math.random() * frameworks.length)];
}

// Run setup if called directly
if (require.main === module) {
  setupProductionDatabase()
    .then(() => {
      console.log('🎉 Database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupProductionDatabase };
