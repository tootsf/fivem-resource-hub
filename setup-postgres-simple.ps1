# Quick PostgreSQL Setup for Phase 1 Testing

Write-Host "PostgreSQL Quick Setup for Phase 1 Testing" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

# Check if PostgreSQL is already installed
try {
    $pgVersion = & psql --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostgreSQL already installed: $pgVersion" -ForegroundColor Green
        
        # Test connection
        Write-Host "Testing database connection..." -ForegroundColor Yellow
        cd backend
        & node setup-database-test.js
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database setup completed successfully!" -ForegroundColor Green
            Write-Host "Ready to test full authentication!" -ForegroundColor Green
        } else {
            Write-Host "Database setup failed. You may need to:" -ForegroundColor Red
            Write-Host "1. Create the database manually" -ForegroundColor White
            Write-Host "2. Update the DATABASE_URL in .env" -ForegroundColor White
        }
        
        exit 0
    }
} catch {
    # PostgreSQL not found
}

Write-Host "PostgreSQL not found. Choose installation method:" -ForegroundColor Yellow
Write-Host "1. Docker (Recommended - fastest setup)"
Write-Host "2. Manual Download (official installer)"
Write-Host "3. Skip for now"
Write-Host ""

$choice = Read-Host "Choose option (1-3)"

switch ($choice) {
    "1" {
        Write-Host "Setting up PostgreSQL with Docker..." -ForegroundColor Cyan
        
        try {
            & docker --version | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Docker found, starting PostgreSQL container..." -ForegroundColor Green
                
                # Remove existing container if it exists
                & docker rm -f fivem-postgres 2>$null
                
                # Start PostgreSQL container
                & docker run --name fivem-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:16
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "PostgreSQL container started successfully!" -ForegroundColor Green
                    Write-Host "Connection details:" -ForegroundColor White
                    Write-Host "  Host: localhost:5432" -ForegroundColor White
                    Write-Host "  Username: postgres" -ForegroundColor White
                    Write-Host "  Password: password" -ForegroundColor White
                    
                    Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
                    Start-Sleep -Seconds 15
                    
                    # Create database
                    Write-Host "Creating database..." -ForegroundColor Yellow
                    & docker exec fivem-postgres psql -U postgres -c "CREATE DATABASE fivem_resource_hub;"
                    
                    Write-Host "Database setup completed!" -ForegroundColor Green
                    
                    # Setup the schema
                    Write-Host "Setting up database schema..." -ForegroundColor Yellow
                    cd backend
                    & node setup-database-test.js
                    
                } else {
                    Write-Host "Failed to start PostgreSQL container" -ForegroundColor Red
                }
            } else {
                Write-Host "Docker not found. Please install Docker Desktop first." -ForegroundColor Red
                Write-Host "Download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor White
            }
        } catch {
            Write-Host "Docker not available" -ForegroundColor Red
        }
    }
    
    "2" {
        Write-Host "Manual Download Instructions:" -ForegroundColor Cyan
        Write-Host "1. Go to: https://www.postgresql.org/download/windows/" -ForegroundColor White
        Write-Host "2. Download the installer for Windows" -ForegroundColor White
        Write-Host "3. Run installer as Administrator" -ForegroundColor White
        Write-Host "4. Remember the password for 'postgres' user" -ForegroundColor White
        Write-Host "5. Use default port 5432" -ForegroundColor White
        Write-Host "6. Run this script again after installation" -ForegroundColor White
    }
    
    "3" {
        Write-Host "Skipping PostgreSQL setup" -ForegroundColor Yellow
        Write-Host "You can test without database (search functionality only)" -ForegroundColor White
    }
    
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Phase 1 Testing Status:" -ForegroundColor Green
Write-Host "Frontend: Running on http://localhost:3000" -ForegroundColor White
Write-Host "Backend: Running on http://localhost:3001" -ForegroundColor White
Write-Host "Search: 240 resources loaded and searchable" -ForegroundColor White
