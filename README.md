# Resource Search Application

A simple web application for searching through large datasets (up to 300,000+ entries) with pagination.

## Project Structure

```
resource_search/
├── backend/          # Node.js + Express API server
├── frontend/         # React + Vite frontend
├── data/            # JSON data files
└── README.md
```

## Features

- **Enhanced Search**: Case-insensitive search across resource names, descriptions, and programming languages
- **Rich Data Display**: Shows rank, players, servers, stars, and rank changes
- **Pagination**: 100 results per page with navigation
- **Real-time**: Debounced search as you type
- **GitHub Integration**: Direct links to GitHub repositories
- **Responsive**: Mobile-friendly design
- **Simple Setup**: Minimal configuration required

## Quick Start

### 1. Install Dependencies

**Backend:**
```powershell
cd backend
npm install
```

**Frontend:**
```powershell
cd frontend
npm install
```

### 2. Add Your Data

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
