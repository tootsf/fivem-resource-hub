const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Test endpoints (no database required)
app.get('/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/test/env', (req, res) => {
  const envCheck = {
    port: process.env.PORT || 'not set',
    frontend_url: process.env.FRONTEND_URL || 'not set',
    github_client_id: process.env.GITHUB_CLIENT_ID ? 'set' : 'not set',
    github_client_secret: process.env.GITHUB_CLIENT_SECRET ? 'set' : 'not set',
    jwt_secret: process.env.JWT_SECRET ? 'set' : 'not set',
    database_url: process.env.DATABASE_URL ? 'set' : 'not set'
  };

  res.json({
    status: 'Environment Check',
    config: envCheck,
    ready_for_auth: envCheck.github_client_id === 'set' &&
                   envCheck.github_client_secret === 'set' &&
                   envCheck.jwt_secret === 'set'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📋 Test endpoints:`);
  console.log(`   - Basic: http://localhost:${PORT}/test`);
  console.log(`   - Env Check: http://localhost:${PORT}/test/env`);
  console.log(`🔧 Configure your .env file then run the main server`);
});

module.exports = app;
