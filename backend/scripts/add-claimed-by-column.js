const { Pool } = require('pg');

async function addClaimedByColumn() {
  console.log('🔧 Adding claimed_by column to resources table...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Check if column already exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'resources' AND column_name = 'claimed_by'
    `);

    if (columnCheck.rows.length > 0) {
      console.log('✅ claimed_by column already exists');
      return;
    }

    // Add the column
    await pool.query(`
      ALTER TABLE resources 
      ADD COLUMN claimed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    `);

    // Add index for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_resources_claimed_by ON resources(claimed_by)
    `);

    console.log('✅ Successfully added claimed_by column and index');

    // Show column info
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'resources' 
      ORDER BY ordinal_position
    `);

    console.log('\n📊 Current resources table structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  addClaimedByColumn()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addClaimedByColumn;
