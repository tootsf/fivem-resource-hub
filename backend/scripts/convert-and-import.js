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
    // Read the pre-entries.json file
    const dataPath = path.join(__dirname, '../data/pre-entries.json');
    console.log('📂 Reading pre-entries.json...');
    
    if (!fs.existsSync(dataPath)) {
      throw new Error('pre-entries.json not found in data directory');
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    const preEntries = JSON.parse(rawData);
    
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
