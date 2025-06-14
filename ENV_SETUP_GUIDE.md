# 🔧 Environment Setup Guide

## Step 1: Update Database URL

Replace the DATABASE_URL in your `.env` file:

```env
# Replace with your actual PostgreSQL credentials
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/fivem_resource_hub
```

**Where:**
- `postgres` = username (default PostgreSQL user)
- `yourpassword` = the password you set during PostgreSQL installation
- `localhost:5432` = host and port (default)
- `fivem_resource_hub` = database name

## Step 2: Generate JWT and Session Secrets

Here are some secure random strings you can use:

```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
SESSION_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef
```

## Step 3: Create GitHub OAuth App

1. **Go to GitHub Settings**:
   - Visit: https://github.com/settings/applications/new
   - Or: GitHub → Settings → Developer settings → OAuth Apps → New OAuth App

2. **Fill in the form**:
   ```
   Application name: FiveM Resource Hub
   Homepage URL: http://localhost:3000
   Authorization callback URL: http://localhost:3001/auth/github/callback
   Application description: Discover, review, and organize FiveM resources
   ```

3. **Get your credentials**:
   - After creating, you'll see:
     - Client ID (copy this)
     - Generate a new client secret (copy this)

4. **Update your .env file**:
   ```env
   GITHUB_CLIENT_ID=your_actual_client_id_here
   GITHUB_CLIENT_SECRET=your_actual_client_secret_here
   ```

## Final .env File Example

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/fivem_resource_hub

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=Ov23liABC123XYZ
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678

# JWT and Session Secrets
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
SESSION_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef
```

⚠️ **Important**: Never commit the actual .env file to git! The .env.example file is for reference only.
