# 🎮 FiveM Resource Hub

**A comprehensive platform for discovering, reviewing, and managing FiveM server resources with an innovative recipe builder for server configurations.**

🌐 **Live Demo**: [fivem-resource-hub.vercel.app](https://fivem-resource-hub.vercel.app)
🔗 **API**: [fivem-resource-hub-production.up.railway.app](https://fivem-resource-hub-production.up.railway.app)

## ✨ Features

### 🔍 **Resource Discovery**
- Search through 240+ curated FiveM resources
- Advanced filtering by framework (ESX, QB-Core, VORP)
- Real-time search with pagination
- GitHub integration for direct repository access

### 👤 **User Management**
- GitHub OAuth authentication
- User profiles and dashboards
- Resource claiming and ownership
- Session management with JWT

### ⭐ **Review & Rating System**
- 5-star rating system
- Detailed reviews with pros/cons
- Community-driven feedback
- Review verification system

### 🔧 **Recipe Builder**
- Visual server configuration generator
- Framework-specific templates
- YAML export functionality
- Server.cfg file generation
- Dependency management

## 🚀 **Tech Stack**

**Frontend**: React + Vite + Axios
**Backend**: Node.js + Express + PostgreSQL
**Authentication**: GitHub OAuth + JWT
**Deployment**: Vercel + Railway
**Database**: PostgreSQL with full relational schema
**Security**: Helmet, Rate Limiting, CORS, Input Validation

## 📊 **Project Status**

✅ **Phase 1**: Resource Discovery & Authentication - **COMPLETE**
✅ **Phase 2**: Resource Claiming & Ownership - **COMPLETE**
✅ **Phase 3**: Review & Rating System - **COMPLETE**
✅ **Phase 4**: Recipe Builder & Configuration - **COMPLETE**
🎯 **Phase 5**: Advanced Features - **PLANNING**

## 🛠️ **Local Development**

### Prerequisites
- Node.js 18+
- PostgreSQL 16+
- GitHub OAuth App

### Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/gononono64/fivem-resource-hub.git
   cd fivem-resource-hub
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your credentials
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb fivem_resource_hub

   # Run migrations
   cd backend
   npm run setup-production
   ```

### Environment Variables

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for complete environment setup guide.

## 📚 **Documentation**

- [`ROADMAP.md`](ROADMAP.md) - Project roadmap and next steps
- [`DEPLOYMENT.md`](DEPLOYMENT.md) - Production deployment guide
- **API Documentation** - Available at `/health` endpoint

## 🤝 **Contributing**

This project is actively developed and welcomes contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 **License**

MIT License - see LICENSE file for details

## 🎯 **What Makes This Special**

- **Production Ready**: Deployed and operational
- **Comprehensive**: Covers entire FiveM resource lifecycle
- **Scalable**: Built with modern, maintainable architecture
- **Community Focused**: Designed for FiveM developer community
- **Innovative**: Unique recipe builder for server configurations

---

**Built with ❤️ for the FiveM community**

Replace the sample `data/entries.json` with your actual data. The format should be:

```json
[
  { "name": "Entry Name 1", "id": 1 },
  { "name": "Entry Name 2", "id": 2 },
  ...
]
```

### 3. Start the Servers

**Backend (in one terminal):**
```powershell
cd backend
npm run dev
```
Server will run on http://localhost:3001

**Frontend (in another terminal):**
```powershell
cd frontend
npm run dev
```
Frontend will run on http://localhost:3000

## API Endpoints

### GET /search
Search through entries with pagination.

**Parameters:**
- `q` (string): Search query (searches name, description, and language fields)
- `page` (number): Page number (default: 1)

**Response:**
```json
{
  "results": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalMatches": 1000,
    "pageSize": 100,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### GET /health
Check server status and data loading.

## Configuration

- **Page Size**: Currently set to 100 results per page (configurable in `backend/server.js`)
- **Search Field**: Searches the `name` field (configurable in the search logic)
- **Ports**: Backend on 3001, Frontend on 3000

## Data Format

Your JSON file should contain an array of objects with the following structure:

```json
[
  {
    "name": "resource-name",
    "id": 1,
    "rank": 12345,
    "players": 100,
    "servers": 5,
    "rankChange": 1000,
    "description": "Resource description",
    "stars": 10,
    "language": "Lua",
    "github_url": "https://github.com/user/repo"
  }
]
```

**Required fields:**
- `name`: Resource name (used for search)
- `id`: Unique identifier

**Optional fields:**
- `rank`, `players`, `servers`, `rankChange`: Numeric statistics
- `description`, `language`: Additional searchable text fields
- `stars`: GitHub stars count
- `github_url`: Link to GitHub repository

## Performance Notes

- The application loads all data into memory on startup for fast searching
- For datasets larger than 1M entries, consider implementing database-backed search
- Search is performed on the server to handle large datasets efficiently

## Production Deployment

For production:

1. Set environment variables:
   - `PORT` for backend
   - `NODE_ENV=production`

2. Build frontend:
   ```powershell
   cd frontend
   npm run build
   ```

3. Serve static files from backend or use a web server like nginx

## Troubleshooting

- **CORS errors**: Make sure both servers are running on the specified ports
- **Data not loading**: Check that `data/entries.json` exists and is valid JSON
- **Search not working**: Verify the backend is running on port 3001
