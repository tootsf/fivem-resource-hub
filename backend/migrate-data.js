const fs = require('fs');
const path = require('path');
const { pool } = require('./src/database');

async function migrateExistingData() {
  console.log('📦 Starting data migration from JSON to PostgreSQL...');

  try {
    // Read existing JSON data
    const dataPath = path.join(__dirname, '..', 'data', 'entries.json');

    if (!fs.existsSync(dataPath)) {
      console.log('⚠️ No entries.json file found. Skipping migration.');
      return;
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    const entries = JSON.parse(rawData);

    console.log(`📄 Found ${entries.length} entries to migrate`);

    // Clear existing resources (in case we're re-running)
    await pool.query('DELETE FROM resources');
    console.log('🧹 Cleared existing resources');

    let migratedCount = 0;
    let skippedCount = 0;

    for (const entry of entries) {
      try {
        // Extract GitHub URL from existing data or construct it
        let githubUrl = entry.github_url;
        if (!githubUrl && entry.name) {
          // Try to construct a GitHub URL - this might not always be accurate
          githubUrl = `https://github.com/unknown/${entry.name}`;
        }

        // Determine FiveM category based on name/description
        const fivemCategory = determineFiveMCategory(entry);

        // Extract framework compatibility
        const frameworkCompatibility = determineFrameworkCompatibility(entry);

        // Extract tags from name/description
        const tags = extractTags(entry);

        await pool.query(`
          INSERT INTO resources (
            github_repo_url, name, description, language, stars,
            fivem_category, framework_compatibility, tags, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (github_repo_url) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            language = EXCLUDED.language,
            stars = EXCLUDED.stars,
            fivem_category = EXCLUDED.fivem_category,
            framework_compatibility = EXCLUDED.framework_compatibility,
            tags = EXCLUDED.tags,
            updated_at = CURRENT_TIMESTAMP
        `, [
          githubUrl,
          entry.name,
          entry.description || null,
          entry.language || null,
          entry.stars || 0,
          fivemCategory,
          frameworkCompatibility,
          tags,
          new Date()
        ]);

        migratedCount++;
      } catch (error) {
        console.warn(`⚠️ Skipped entry "${entry.name}": ${error.message}`);
        skippedCount++;
      }
    }

    console.log(`✅ Migration completed!`);
    console.log(`   - Migrated: ${migratedCount} resources`);
    console.log(`   - Skipped: ${skippedCount} resources`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

function determineFiveMCategory(entry) {
  const name = (entry.name || '').toLowerCase();
  const description = (entry.description || '').toLowerCase();
  const combined = `${name} ${description}`;

  if (combined.includes('hud') || combined.includes('ui') || combined.includes('menu')) {
    return 'ui';
  } else if (combined.includes('job') || combined.includes('work')) {
    return 'jobs';
  } else if (combined.includes('vehicle') || combined.includes('car')) {
    return 'vehicles';
  } else if (combined.includes('weapon') || combined.includes('gun')) {
    return 'weapons';
  } else if (combined.includes('map') || combined.includes('mlo')) {
    return 'maps';
  } else if (combined.includes('police') || combined.includes('ems') || combined.includes('fire')) {
    return 'emergency';
  } else if (combined.includes('clothing') || combined.includes('clothes')) {
    return 'clothing';
  } else if (combined.includes('drug') || combined.includes('illegal')) {
    return 'illegal';
  } else {
    return 'scripts';
  }
}

function determineFrameworkCompatibility(entry) {
  const name = (entry.name || '').toLowerCase();
  const description = (entry.description || '').toLowerCase();
  const combined = `${name} ${description}`;

  const frameworks = [];

  if (combined.includes('esx') || combined.includes('es_extended')) {
    frameworks.push('esx');
  }
  if (combined.includes('qbcore') || combined.includes('qb-core')) {
    frameworks.push('qbcore');
  }
  if (combined.includes('vorp') || combined.includes('redm')) {
    frameworks.push('vorp');
  }

  // If no specific framework found, assume standalone
  if (frameworks.length === 0) {
    frameworks.push('standalone');
  }

  return frameworks;
}

function extractTags(entry) {
  const name = (entry.name || '').toLowerCase();
  const description = (entry.description || '').toLowerCase();
  const combined = `${name} ${description}`;

  const tags = [];

  // Common FiveM resource tags
  const tagKeywords = {
    'notification': ['notify', 'notification', 'alert'],
    'hud': ['hud', 'interface', 'ui'],
    'menu': ['menu', 'context', 'radial'],
    'phone': ['phone', 'smartphone', 'mobile'],
    'banking': ['bank', 'atm', 'money'],
    'inventory': ['inventory', 'items', 'storage'],
    'garage': ['garage', 'parking', 'vehicle'],
    'housing': ['house', 'apartment', 'property'],
    'admin': ['admin', 'moderation', 'staff'],
    'roleplay': ['rp', 'roleplay', 'immersion']
  };

  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(keyword => combined.includes(keyword))) {
      tags.push(tag);
    }
  }

  return tags.length > 0 ? tags : ['general'];
}

// Run migration if called directly
if (require.main === module) {
  migrateExistingData()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateExistingData };
