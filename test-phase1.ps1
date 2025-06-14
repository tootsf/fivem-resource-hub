# Test script for Phase 1 implementation
Write-Host "🧪 Testing Phase 1 Implementation" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Check if all required files exist
Write-Host "📁 Checking required files..." -ForegroundColor Yellow

$RequiredFiles = @(
    "backend\src\database.js",
    "backend\src\models\User.js",
    "backend\src\models\Session.js",
    "backend\src\middleware\auth.js",
    "backend\src\routes\auth.js",
    "backend\src\routes\users.js",
    "backend\.env",
    "frontend\src\contexts\AuthContext.jsx",
    "frontend\src\components\LoginButton.jsx",
    "frontend\src\components\Dashboard.jsx",
    "database\01_initial_schema.sql"
)

foreach ($file in $RequiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (missing)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔧 What you need to do next:" -ForegroundColor Cyan
Write-Host "1. Set up PostgreSQL database"
Write-Host "2. Update .env file with your database credentials"
Write-Host "3. Create a GitHub OAuth App and add credentials to .env"
Write-Host "4. Run database setup: node setup-database.js"
Write-Host "5. Migrate existing data: node migrate-data.js"
Write-Host "6. Start the backend: npm run dev"
Write-Host "7. Start the frontend: npm run dev"

Write-Host ""
Write-Host "📋 GitHub OAuth App Setup:" -ForegroundColor Cyan
Write-Host "- Go to: https://github.com/settings/applications/new"
Write-Host "- Application name: FiveM Resource Hub"
Write-Host "- Homepage URL: http://localhost:3000"
Write-Host "- Callback URL: http://localhost:3001/auth/github/callback"
Write-Host "- Copy Client ID and Client Secret to .env file"

Write-Host ""
Write-Host "📊 Current Status:" -ForegroundColor Yellow

# Check if backend dependencies are installed
if (Test-Path "backend\node_modules") {
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Backend dependencies not installed (run 'npm install' in backend folder)" -ForegroundColor Red
}

# Check if frontend dependencies are installed
if (Test-Path "frontend\node_modules") {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend dependencies not installed (run 'npm install' in frontend folder)" -ForegroundColor Red
}

# Check if .env exists and has required variables
if (Test-Path "backend\.env") {
    $envContent = Get-Content "backend\.env" -Raw
    $requiredEnvVars = @("DATABASE_URL", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "JWT_SECRET")

    Write-Host "📋 Environment Variables:" -ForegroundColor Yellow
    foreach ($var in $requiredEnvVars) {
        if ($envContent -match "$var=\w+") {
            Write-Host "✅ $var is set" -ForegroundColor Green
        } else {
            Write-Host "❌ $var needs to be configured" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ .env file not found in backend folder" -ForegroundColor Red
}
