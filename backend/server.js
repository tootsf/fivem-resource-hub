const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import our database connection
const { pool } = require('./src/database');

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const resourceRoutes = require('./src/routes/resources');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

// CORS configuration - allow multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://fivem-resource-hub.vercel.app',
  'https://fivem-resource-hub-production.up.railway.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow all for now
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression and logging
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());

// Load data (keeping your existing JSON loading for now)
let data = [];
const dataPath = path.join(__dirname, '..', 'data', 'entries.json');

// Load JSON data on startup (for backwards compatibility)
function loadData() {
  try {
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      data = JSON.parse(rawData);
      console.log(`Loaded ${data.length} entries from JSON file`);
    } else {
      console.log('No JSON data file found.');
      data = [];
    }
  } catch (error) {
    console.error('Error loading JSON data:', error);
    data = [];
  }
}

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resources', resourceRoutes);

// Keep your existing search endpoint for backwards compatibility
app.get('/search', async (req, res) => {
  try {
    const { q = '', page = 1 } = req.query;
    const pageSize = 100;
    const pageNum = Math.max(1, parseInt(page));
    const offset = (pageNum - 1) * pageSize;

    let query = 'SELECT * FROM resources';
    let countQuery = 'SELECT COUNT(*) FROM resources';
    let params = [];

    if (q) {
      query += ` WHERE name ILIKE $1 OR description ILIKE $1 OR language ILIKE $1`;
      countQuery += ` WHERE name ILIKE $1 OR description ILIKE $1 OR language ILIKE $1`;
      params = [`%${q}%`];
    }

    query += ` ORDER BY rank ASC LIMIT ${pageSize} OFFSET ${offset}`;

    // Get total count for pagination
    const countResult = await pool.query(countQuery, params);
    const totalMatches = parseInt(countResult.rows[0].count);

    // Get results
    const result = await pool.query(query, params);
    const results = result.rows;

    const totalPages = Math.ceil(totalMatches / pageSize);

    res.json({
      results,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalMatches,
        pageSize,
        hasNext: pageNum < totalPages,
        hasPrevious: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check with optional database setup
app.get('/health', async (req, res) => {
  try {
    // Test basic database connection
    await pool.query('SELECT 1');

    let resourceCount = 0;
    let userCount = 0;
    let tablesExist = true;

    try {
      // Check if tables exist and count records
      const resourceResult = await pool.query('SELECT COUNT(*) FROM resources');
      const userResult = await pool.query('SELECT COUNT(*) FROM users');
      resourceCount = parseInt(resourceResult.rows[0].count);
      userCount = parseInt(userResult.rows[0].count);
    } catch (tableError) {
      // Tables don't exist yet
      tablesExist = false;
      console.log('Database tables not yet created:', tableError.message);
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'connected',
      tablesExist: tablesExist,
      resources: resourceCount,
      users: userCount,
      setupRequired: !tablesExist
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      database: 'disconnected'
    });
  }
});

// Database setup endpoint for production deployment
app.get('/setup-database', async (req, res) => {
  try {
    console.log('🚀 Starting database setup...');

    // Import the setup function
    const { setupProductionDatabase } = require('./scripts/setup-production-db');

    await setupProductionDatabase();

    // Check results
    const resourceCount = await pool.query('SELECT COUNT(*) FROM resources');
    const userCount = await pool.query('SELECT COUNT(*) FROM users');

    res.json({
      success: true,
      message: 'Database setup completed successfully!',
      timestamp: new Date().toISOString(),
      tables_created: ['resources', 'users', 'reviews'],
      resources_imported: parseInt(resourceCount.rows[0].count),
      users_created: parseInt(userCount.rows[0].count)
    });
  } catch (error) {
    console.error('Database setup failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Database setup failed. Check logs for details.'
    });
  }
});

// Convert and import pre-entries to database
app.get('/convert-import', async (req, res) => {
  try {
    console.log('🔄 Starting pre-entries conversion...');

    // Import the conversion function
    const { convertAndInsertResources } = require('./scripts/convert-and-import');

    await convertAndInsertResources();

    // Check results
    const resourceCount = await pool.query('SELECT COUNT(*) FROM resources');

    res.json({
      success: true,
      message: 'Pre-entries conversion completed successfully!',
      timestamp: new Date().toISOString(),
      resources_imported: parseInt(resourceCount.rows[0].count),
      data_source: 'pre-entries.json'
    });
  } catch (error) {
    console.error('Pre-entries conversion failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Pre-entries conversion failed. Check logs for details.'
    });
  }
});

// Upload pre-entries data endpoint (for large datasets)
app.post('/upload-data', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    console.log('📤 Receiving data upload...');

    const { data, type = 'pre-entries' } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format. Expected array of resources.'
      });
    }

    console.log(`📊 Processing ${data.length} resources from upload...`);

    // Clear existing resources
    await pool.query('DELETE FROM resources');

    // Convert and insert uploaded data
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.length; i++) {
      const entry = data[i];

      try {
        const resourceData = {
          name: entry.resource_name || `Resource ${i + 1}`,
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

        await pool.query(`
          INSERT INTO resources (
            name, description, github_url, language, stars, rank,
            players, servers, rank_change, category, framework, tags
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          resourceData.name, resourceData.description, resourceData.github_url,
          resourceData.language, resourceData.stars, resourceData.rank,
          resourceData.players, resourceData.servers, resourceData.rank_change,
          resourceData.category, resourceData.framework, resourceData.tags
        ]);

        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Error inserting resource ${entry.resource_name}:`, error.message);
      }
    }

    const resourceCount = await pool.query('SELECT COUNT(*) FROM resources');

    res.json({
      success: true,
      message: 'Data upload completed successfully!',
      timestamp: new Date().toISOString(),
      resources_uploaded: successCount,
      errors: errorCount,
      total_in_database: parseInt(resourceCount.rows[0].count)
    });

  } catch (error) {
    console.error('Data upload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Data upload failed. Check logs for details.'
    });
  }
});

// Database migration: Add claimed_by column
app.get('/migrate-claimed-by', async (req, res) => {
  try {
    console.log('🔧 Adding claimed_by column to resources table...');

    // Check if column already exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'resources' AND column_name = 'claimed_by'
    `);

    if (columnCheck.rows.length > 0) {
      return res.json({
        success: true,
        message: 'claimed_by column already exists',
        timestamp: new Date().toISOString()
      });
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

    res.json({
      success: true,
      message: 'claimed_by column added successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Load JSON data and start server
loadData();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Auth endpoints: http://localhost:${PORT}/auth/`);
});
