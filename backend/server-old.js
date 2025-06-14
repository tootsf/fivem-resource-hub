const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Load data
let data = [];
const dataPath = path.join(__dirname, '..', 'data', 'entries.json');

// Load JSON data on startup
function loadData() {
  try {
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      data = JSON.parse(rawData);
      console.log(`Loaded ${data.length} entries`);
    } else {
      console.log('No data file found. Please add your entries.json file to the data folder.');
      // Create sample data for testing
      data = Array.from({ length: 100 }, (_, i) => ({
        name: `Sample Entry ${i + 1}`,
        id: i + 1
      }));
      console.log('Created sample data with 100 entries for testing');
    }
  } catch (error) {
    console.error('Error loading data:', error);
    data = [];
  }
}

// Search endpoint
app.get('/search', (req, res) => {
  try {
    const { q = '', page = 1 } = req.query;
    const pageSize = 100;
    const pageNum = Math.max(1, parseInt(page));    // Perform case-insensitive search across multiple fields
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
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    dataLoaded: data.length > 0,
    totalEntries: data.length 
  });
});

// Load data and start server
loadData();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Search endpoint: http://localhost:${PORT}/search?q=example&page=1`);
});
