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

// Keep your existing search endpoint for backwards compatibility
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
  try {
    // Test database connection
    const dbResult = await pool.query('SELECT NOW()');
    
    res.json({ 
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dataLoaded: data.length > 0,
      totalEntries: data.length,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      error: 'Database connection failed'
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
