# PostgreSQL Installation Guide for Windows

## Option 1: Official PostgreSQL Installer (Recommended)

1. **Download PostgreSQL**:
   - Go to: https://www.postgresql.org/download/windows/
   - Click "Download the installer" 
   - Download the latest version (16.x)

2. **Run the Installer**:
   - Run the downloaded .exe file as Administrator
   - Follow the installation wizard
   - **IMPORTANT**: Remember the password you set for the 'postgres' user
   - Default port: 5432 (keep this)
   - Install pgAdmin (recommended for database management)

3. **Verify Installation**:
   - Open Command Prompt and try: `psql --version`
   - Or check if PostgreSQL service is running in Services

## Option 2: Using Chocolatey (if you have it)

```powershell
choco install postgresql
```

## Option 3: Using Winget

```powershell
winget install PostgreSQL.PostgreSQL
```

## After Installation

1. **Add PostgreSQL to PATH** (if not automatic):
   - Add `C:\Program Files\PostgreSQL\16\bin` to your system PATH
   - Restart your terminal

2. **Test Connection**:
   ```bash
   psql -U postgres -h localhost
   # Enter the password you set during installation
   ```

3. **Create Database**:
   ```sql
   CREATE DATABASE fivem_resource_hub;
   \q
   ```

## Quick Alternative: Docker (If you prefer)

```bash
docker run --name postgres-fivem -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:16
docker exec -it postgres-fivem psql -U postgres -c "CREATE DATABASE fivem_resource_hub;"
```
