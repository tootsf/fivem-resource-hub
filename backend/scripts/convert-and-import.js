const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Convert pre-entries.json to SQL database
async function convertAndInsertResources() {
  console.log('🔄 Converting pre-entries.json to SQL database...');

  // Use Railway's DATABASE_URL or local development URL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  try {
    // Try multiple possible paths for the pre-entries.json file
    const possiblePaths = [
      path.join(__dirname, '../data/pre-entries.json'),
      path.join(__dirname, '../../data/pre-entries.json'),
      path.join(process.cwd(), 'data/pre-entries.json'),
      path.join(process.cwd(), '../data/pre-entries.json')
    ];

    let dataPath = null;
    let preEntries = null;

    console.log('📂 Searching for pre-entries.json...');
    for (const testPath of possiblePaths) {
      console.log(`   Checking: ${testPath}`);
      if (fs.existsSync(testPath)) {
        dataPath = testPath;
        console.log(`   ✅ Found at: ${testPath}`);
        break;
      }
    }

    if (!dataPath) {
      console.log('📂 pre-entries.json not found, creating sample data instead...');
      preEntries = createSampleData();
    } else {
      console.log('📂 Reading pre-entries.json...');
      const rawData = fs.readFileSync(dataPath, 'utf8');
      preEntries = JSON.parse(rawData);
    }

    console.log(`📊 Found ${preEntries.length} resources to convert`);

    // Clear existing resources (optional - remove this if you want to keep existing data)
    console.log('🗑️ Clearing existing resources...');
    await pool.query('DELETE FROM resources');

    // Convert and insert each resource
    let successCount = 0;
    let errorCount = 0;

    console.log('🚀 Starting conversion and insertion...');

    for (let i = 0; i < preEntries.length; i++) {
      const entry = preEntries[i];

      try {
        // Extract data from pre-entry format
        const resourceData = {
          name: entry.resource_name || 'Unknown Resource',
          description: entry.github_repo?.description || '',
          github_url: entry.github_repo?.html_url || '',
          language: entry.github_repo?.language || 'Unknown',
          stars: entry.github_repo?.stars || 0,
          rank: entry.resource_data?.rank || i + 1,
          players: entry.resource_data?.players || 0,
          servers: entry.resource_data?.servers || 0,
          rank_change: entry.resource_data?.rankChange || 0,
          category: determineCategory(entry),
          framework: determineFramework(entry),
          tags: entry.github_repo?.tags || []
        };

        // Insert into database
        await pool.query(`
          INSERT INTO resources (
            name, description, github_url, language, stars, rank,
            players, servers, rank_change, category, framework, tags
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          resourceData.name,
          resourceData.description,
          resourceData.github_url,
          resourceData.language,
          resourceData.stars,
          resourceData.rank,
          resourceData.players,
          resourceData.servers,
          resourceData.rank_change,
          resourceData.category,
          resourceData.framework,
          resourceData.tags
        ]);

        successCount++;

        // Progress indicator
        if (i % 1000 === 0) {
          console.log(`📈 Progress: ${i}/${preEntries.length} (${Math.round((i/preEntries.length)*100)}%)`);
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ Error inserting resource ${entry.resource_name}:`, error.message);

        // Continue with next resource instead of stopping
        continue;
      }
    }

    console.log('\n🎉 Conversion Complete!');
    console.log(`✅ Successfully inserted: ${successCount} resources`);
    console.log(`❌ Failed to insert: ${errorCount} resources`);
    console.log(`📊 Total processed: ${preEntries.length} resources`);

    // Verify the insertion
    const countResult = await pool.query('SELECT COUNT(*) FROM resources');
    console.log(`🔍 Database now contains: ${countResult.rows[0].count} resources`);

  } catch (error) {
    console.error('💥 Conversion failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Create sample data when pre-entries.json is not available
function createSampleData() {
  console.log('🎲 Creating expanded sample FiveM resources...');

  const sampleResources = [
    {
      resource_name: "esx_policejob",
      resource_data: { name: "esx_policejob", rank: 1, players: 1500, servers: 200, rankChange: 0 },
      github_repo: {
        repo_name: "esx-framework/esx_policejob",
        author: "ESX Framework",
        html_url: "https://github.com/esx-framework/esx_policejob",
        description: "Police job for ESX framework with full functionality",
        stars: 150,
        language: "Lua",
        tags: ["fivem", "esx", "job", "police"]
      }
    },
    {
      resource_name: "qb-policejob",
      resource_data: { name: "qb-policejob", rank: 2, players: 1200, servers: 150, rankChange: 1 },
      github_repo: {
        repo_name: "qbcore-framework/qb-policejob",
        author: "QBCore Framework",
        html_url: "https://github.com/qbcore-framework/qb-policejob",
        description: "Advanced police job system for QBCore framework",
        stars: 120,
        language: "Lua",
        tags: ["fivem", "qbcore", "job", "police"]
      }
    },
    {
      resource_name: "esx_vehicleshop",
      resource_data: { name: "esx_vehicleshop", rank: 3, players: 1000, servers: 180, rankChange: -1 },
      github_repo: {
        repo_name: "esx-framework/esx_vehicleshop",
        author: "ESX Framework",
        html_url: "https://github.com/esx-framework/esx_vehicleshop",
        description: "Vehicle dealership system for ESX servers",
        stars: 95,
        language: "Lua",
        tags: ["fivem", "esx", "vehicles", "shop"]
      }
    },
    {
      resource_name: "qb-vehicleshop",
      resource_data: { name: "qb-vehicleshop", rank: 4, players: 800, servers: 120, rankChange: 2 },
      github_repo: {
        repo_name: "qbcore-framework/qb-vehicleshop",
        author: "QBCore Framework",
        html_url: "https://github.com/qbcore-framework/qb-vehicleshop",
        description: "Modern vehicle shop with financing options for QBCore",
        stars: 80,
        language: "Lua",
        tags: ["fivem", "qbcore", "vehicles", "shop"]
      }
    },
    {
      resource_name: "esx_banking",
      resource_data: { name: "esx_banking", rank: 5, players: 900, servers: 160, rankChange: 0 },
      github_repo: {
        repo_name: "esx-framework/esx_banking",
        author: "ESX Framework",
        html_url: "https://github.com/esx-framework/esx_banking",
        description: "Complete banking system with ATMs and transfers",
        stars: 110,
        language: "Lua",
        tags: ["fivem", "esx", "economy", "banking"]
      }
    },
    {
      resource_name: "standalone_hud",
      resource_data: { name: "standalone_hud", rank: 6, players: 700, servers: 90, rankChange: 3 },
      github_repo: {
        repo_name: "example/standalone-hud",
        author: "Community Developer",
        html_url: "https://github.com/example/standalone-hud",
        description: "Modern HUD system that works with any framework",
        stars: 65,
        language: "JavaScript",
        tags: ["fivem", "standalone", "ui", "hud"]
      }
    },
    {
      resource_name: "vorp_inventory",
      resource_data: { name: "vorp_inventory", rank: 7, players: 300, servers: 25, rankChange: 1 },
      github_repo: {
        repo_name: "VORPCORE/vorp_inventory",
        author: "VORP Core",
        html_url: "https://github.com/VORPCORE/vorp_inventory",
        description: "RedM inventory system for VORP framework",
        stars: 45,
        language: "Lua",
        tags: ["redm", "vorp", "inventory", "roleplay"]
      }
    },
    {
      resource_name: "custom_carpack",
      resource_data: { name: "custom_carpack", rank: 8, players: 600, servers: 80, rankChange: -2 },
      github_repo: {
        repo_name: "example/custom-vehicles",
        author: "Vehicle Developer",
        html_url: "https://github.com/example/custom-vehicles",
        description: "High quality vehicle pack with 50+ cars",
        stars: 30,
        language: "Meta",
        tags: ["fivem", "vehicles", "addon", "pack"]
      }
    },
    {
      resource_name: "advanced_garage",
      resource_data: { name: "advanced_garage", rank: 9, players: 500, servers: 70, rankChange: 4 },
      github_repo: {
        repo_name: "example/advanced-garage",
        author: "Garage Developer",
        html_url: "https://github.com/example/advanced-garage",
        description: "Multi-framework garage system with parking spots",
        stars: 55,
        language: "Lua",
        tags: ["fivem", "garage", "vehicles", "multiframework"]
      }
    },
    {
      resource_name: "hospital_system",
      resource_data: { name: "hospital_system", rank: 10, players: 400, servers: 60, rankChange: 0 },
      github_repo: {
        repo_name: "example/hospital-system",
        author: "Medical Developer",
        html_url: "https://github.com/example/hospital-system",
        description: "Complete medical system with injuries and treatments",
        stars: 40,
        language: "Lua",
        tags: ["fivem", "medical", "roleplay", "job"]
      }
    }
  ];

  console.log(`✅ Created ${sampleResources.length} sample resources`);
  return sampleResources;
}

// Determine category based on resource name and description
function determineCategory(entry) {
  const name = (entry.resource_name || '').toLowerCase();
  const description = (entry.github_repo?.description || '').toLowerCase();
  const combined = `${name} ${description}`;

  // Define category keywords
  const categories = {
    'Jobs': ['job', 'police', 'mechanic', 'taxi', 'trucker', 'delivery', 'work', 'employment'],
    'Vehicles': ['vehicle', 'car', 'bike', 'boat', 'plane', 'helicopter', 'motorcycle', 'truck'],
    'UI': ['ui', 'hud', 'interface', 'menu', 'notification', 'display', 'gui'],
    'Maps': ['map', 'mlo', 'interior', 'building', 'location', 'place'],
    'Scripts': ['script', 'system', 'tool', 'utility', 'addon'],
    'Economy': ['shop', 'store', 'economy', 'money', 'bank', 'atm', 'business'],
    'Roleplay': ['rp', 'roleplay', 'character', 'identity', 'social'],
    'Security': ['anticheat', 'admin', 'moderation', 'security', 'protection'],
    'Framework': ['framework', 'core', 'base', 'foundation']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => combined.includes(keyword))) {
      return category;
    }
  }

  return 'Other';
}

// Determine framework based on resource name and description
function determineFramework(entry) {
  const name = (entry.resource_name || '').toLowerCase();
  const description = (entry.github_repo?.description || '').toLowerCase();
  const combined = `${name} ${description}`;

  if (combined.includes('esx') || combined.includes('es_extended')) {
    return 'ESX';
  } else if (combined.includes('qb') || combined.includes('qbcore') || combined.includes('qb-core')) {
    return 'QB-Core';
  } else if (combined.includes('vorp') || combined.includes('redm')) {
    return 'VORP';
  } else if (combined.includes('standalone') || combined.includes('independent')) {
    return 'Standalone';
  }

  return 'Unknown';
}

// Run conversion if called directly
if (require.main === module) {
  convertAndInsertResources()
    .then(() => {
      console.log('🎯 All done! Your resources are now in the database.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Conversion failed:', error);
      process.exit(1);
    });
}

module.exports = { convertAndInsertResources };
