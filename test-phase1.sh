#!/bin/bash
# Test script for Phase 1 implementation

echo "🧪 Testing Phase 1 Implementation"
echo "=================================="

# Check if all required files exist
echo "📁 Checking required files..."

REQUIRED_FILES=(
    "backend/src/database.js"
    "backend/src/models/User.js"
    "backend/src/models/Session.js"
    "backend/src/middleware/auth.js"
    "backend/src/routes/auth.js"
    "backend/src/routes/users.js"
    "backend/.env"
    "frontend/src/contexts/AuthContext.jsx"
    "frontend/src/components/LoginButton.jsx"
    "frontend/src/components/Dashboard.jsx"
    "database/01_initial_schema.sql"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
    fi
done

echo ""
echo "🔧 What you need to do next:"
echo "1. Set up PostgreSQL database"
echo "2. Update .env file with your database credentials"
echo "3. Create a GitHub OAuth App and add credentials to .env"
echo "4. Run database setup: node setup-database.js"
echo "5. Migrate existing data: node migrate-data.js"
echo "6. Start the backend: npm run dev"
echo "7. Start the frontend: npm run dev"

echo ""
echo "📋 GitHub OAuth App Setup:"
echo "- Go to: https://github.com/settings/applications/new"
echo "- Application name: FiveM Resource Hub"
echo "- Homepage URL: http://localhost:3000"
echo "- Callback URL: http://localhost:3001/auth/github/callback"
echo "- Copy Client ID and Client Secret to .env file"
