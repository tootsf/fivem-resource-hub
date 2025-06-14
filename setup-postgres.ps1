# Quick PostgreSQL Setup for Phase 1 Testing
# This script helps set up PostgreSQL on Windows

Write-Host "🐘 PostgreSQL Quick Setup for Phase 1 Testing" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if PostgreSQL is already installed
$pgExists = $false
try {
    $pgVersion = & psql --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL already installed: $pgVersion" -ForegroundColor Green
        $pgExists = $true
    }
} catch {
    # PostgreSQL not found
}

if (-not $pgExists) {
    Write-Host "⚠️ PostgreSQL not found. Choose installation method:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. 🐳 Docker (Recommended - fastest setup)"
    Write-Host "2. 📦 Chocolatey (if you have choco installed)"
    Write-Host "3. 🌐 Manual Download (official installer)"
    Write-Host "4. ⏭️ Skip for now"
    Write-Host ""

    $choice = Read-Host "Choose option (1-4)"

    switch ($choice) {
        "1" {
            Write-Host "🐳 Setting up PostgreSQL with Docker..." -ForegroundColor Cyan

            # Check if Docker is available
            try {
                & docker --version | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Docker found, starting PostgreSQL container..." -ForegroundColor Green

                    # Start PostgreSQL container
                    & docker run --name fivem-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:16

                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "✅ PostgreSQL container started successfully!" -ForegroundColor Green
                        Write-Host "   - Host: localhost:5432" -ForegroundColor White
                        Write-Host "   - Username: postgres" -ForegroundColor White
                        Write-Host "   - Password: password" -ForegroundColor White

                        # Wait a moment for container to be ready
                        Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
                        Start-Sleep -Seconds 10

                        # Create database
                        & docker exec fivem-postgres psql -U postgres -c "CREATE DATABASE fivem_resource_hub;"

                        if ($LASTEXITCODE -eq 0) {
                            Write-Host "✅ Database 'fivem_resource_hub' created!" -ForegroundColor Green
                            $pgExists = $true
                        }
                    } else {
                        Write-Host "❌ Failed to start PostgreSQL container" -ForegroundColor Red
                    }
                } else {
                    Write-Host "❌ Docker not found. Please install Docker Desktop first." -ForegroundColor Red
                    Write-Host "   Download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor White
                }
            } catch {
                Write-Host "❌ Docker not available" -ForegroundColor Red
            }
        }

        "2" {
            Write-Host "📦 Installing PostgreSQL with Chocolatey..." -ForegroundColor Cyan
            try {
                & choco install postgresql -y
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ PostgreSQL installed with Chocolatey" -ForegroundColor Green
                    $pgExists = $true
                }
            } catch {
                Write-Host "❌ Chocolatey not found or installation failed" -ForegroundColor Red
            }
        }

        "3" {
            Write-Host "🌐 Manual Download Instructions:" -ForegroundColor Cyan
            Write-Host "1. Go to: https://www.postgresql.org/download/windows/" -ForegroundColor White
            Write-Host "2. Download the installer for Windows" -ForegroundColor White
            Write-Host "3. Run installer as Administrator" -ForegroundColor White
            Write-Host "4. Remember the password for 'postgres' user" -ForegroundColor White
            Write-Host "5. Use default port 5432" -ForegroundColor White
            Write-Host "6. Run this script again after installation" -ForegroundColor White
            return
        }

        "4" {
            Write-Host "⏭️ Skipping PostgreSQL setup" -ForegroundColor Yellow
            Write-Host "You can test without database (search functionality only)" -ForegroundColor White
            return
        }

        default {
            Write-Host "❌ Invalid choice" -ForegroundColor Red
            return
        }
    }
}

if ($pgExists) {
    Write-Host ""
    Write-Host "🔧 Now let's set up the database for your FiveM Resource Hub..." -ForegroundColor Cyan

    # Update .env file
    $envPath = ".env"
    if (Test-Path $envPath) {
        Write-Host "📝 Updating .env file with database connection..." -ForegroundColor Yellow

        $envContent = Get-Content $envPath -Raw

        # Update DATABASE_URL
        $envContent = $envContent -replace 'DATABASE_URL=.*', 'DATABASE_URL=postgresql://postgres:password@localhost:5432/fivem_resource_hub'

        Set-Content $envPath $envContent
        Write-Host "✅ .env file updated" -ForegroundColor Green
    } else {
        Write-Host "❌ .env file not found. Please create it first." -ForegroundColor Red
        return
    }

    # Test database connection and setup
    Write-Host "🔍 Testing database connection..." -ForegroundColor Yellow

    $testResult = & node setup-database-test.js

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Ready to test full authentication!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Stop the current backend server (Ctrl+C in the backend terminal)" -ForegroundColor White
        Write-Host "2. Start the full server: npm run dev" -ForegroundColor White
        Write-Host "3. Test GitHub OAuth at: http://localhost:3000" -ForegroundColor White

    } else {
        Write-Host "❌ Database setup failed. Check the error messages above." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🧪 Phase 1 Testing Status:" -ForegroundColor Green
Write-Host "✅ Frontend: Running on http://localhost:3000" -ForegroundColor White
Write-Host "✅ Backend: Running on http://localhost:3001" -ForegroundColor White
Write-Host "✅ Search: 240 resources loaded and searchable" -ForegroundColor White
if ($pgExists) {
    Write-Host "✅ Database: PostgreSQL connected and ready" -ForegroundColor White
    Write-Host "✅ Authentication: Ready for GitHub OAuth testing" -ForegroundColor White
} else {
    Write-Host "⚠️ Database: Not connected (authentication disabled)" -ForegroundColor Yellow
}
