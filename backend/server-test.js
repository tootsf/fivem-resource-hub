const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());

// Database connection status
let databaseConnected = false;
let pool = null;

// Try to connect to database
async function initializeDatabase() {
  try {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
    
    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    databaseConnected = true;
    console.log('✅ Database connected successfully');
    
    // Load auth routes only if database is connected
    const authRoutes = require('./src/routes/auth');
    const userRoutes = require('./src/routes/users');
    app.use('/auth', authLimiter, authRoutes);
    app.use('/api/users', userRoutes);
    
  } catch (error) {
    console.log('⚠️ Database not available:', error.message);
    console.log('🔧 Running in limited mode (search only)');
    databaseConnected = false;
  }
}

// Load JSON data (for backwards compatibility)
let data = [];
const dataPath = path.join(__dirname, '..', 'data', 'entries.json');

function loadData() {
  try {
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      data = JSON.parse(rawData);
      console.log(`📄 Loaded ${data.length} entries from JSON file`);
    } else {
      console.log('⚠️ No JSON data file found.');
      data = [];
    }
  } catch (error) {
    console.error('❌ Error loading JSON data:', error);
    data = [];
  }
}

// Mock auth endpoints when database is not available
app.get('/auth/github', (req, res) => {
  if (!databaseConnected) {
    return res.status(503).json({
      success: false,
      error: 'Authentication requires database connection',
      code: 'DATABASE_UNAVAILABLE'
    });
  }
});

app.get('/auth/me', (req, res) => {
  if (!databaseConnected) {
    return res.status(503).json({
      success: false,
      error: 'Authentication requires database connection',
      code: 'DATABASE_UNAVAILABLE'
    });
  }
});

// Search endpoint (works without database)
app.get('/search', (req, res) => {
  try {
    const { q = '', page = 1 } = req.query;
    const pageSize = 100;
    const pageNum = Math.max(1, parseInt(page));

    // Perform case-insensitive search across multiple fields
    const filteredData = data.filter(entry => {
      const searchTerm = q.toLowerCase();
      return (
        (entry.name && entry.name.toLowerCase().includes(searchTerm)) ||
        (entry.description && entry.description.toLowerCase().includes(searchTerm)) ||
        (entry.language && entry.language.toLowerCase().includes(searchTerm))
      );
    });

    // Calculate pagination
    const totalMatches = filteredData.length;
    const totalPages = Math.ceil(totalMatches / pageSize);
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const results = filteredData.slice(startIndex, endIndex);

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

// Health check endpoint
app.get('/health', async (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: databaseConnected ? 'connected' : 'disconnected',
    dataLoaded: data.length > 0,
    totalEntries: data.length,
    environment: process.env.NODE_ENV || 'development',
    features: {
      search: true,
      authentication: databaseConnected,
      user_management: databaseConnected
    }
  };
  
  if (databaseConnected) {
    try {
      const result = await pool.query('SELECT NOW()');
      healthData.database_time = result.rows[0].now;
    } catch (error) {
      healthData.database = 'error';
      healthData.database_error = error.message;
    }
  }
  
  res.json(healthData);
});

// Auth health check
app.get('/auth/health', (req, res) => {
  res.json({
    success: true,
    data: {
      database_connected: databaseConnected,
      github_oauth_configured: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      jwt_configured: !!process.env.JWT_SECRET,
      encryption_configured: !!process.env.ENCRYPTION_KEY
    }
  });
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

// Initialize and start server
async function startServer() {
  await initializeDatabase();
  loadData();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🎯 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
    
    if (databaseConnected) {
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/auth/`);
      console.log(`✅ Full authentication available`);
    } else {
      console.log(`⚠️ Authentication disabled (database required)`);
      console.log(`📋 To enable auth: install PostgreSQL and run setup-database.js`);
    }
  });
}

startServer().catch(error => {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
});
