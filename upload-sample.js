const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Upload a small sample of pre-entries.json to Railway for testing
async function uploadSampleData() {
  console.log('📤 Uploading sample data to Railway...');
  
  const dataPath = path.join(__dirname, 'data/pre-entries.json');
  const railwayUrl = 'https://fivem-resource-hub-production.up.railway.app/upload-data';
  
  try {
    // Read the local pre-entries.json file
    console.log('📂 Reading pre-entries.json...');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const allEntries = JSON.parse(rawData);
    
    // Take only first 50 entries for testing
    const sampleEntries = allEntries.slice(0, 50);
    
    console.log(`📊 Uploading ${sampleEntries.length} sample resources...`);
    
    // Upload to Railway
    const response = await axios.post(railwayUrl, {
      data: sampleEntries,
      type: 'pre-entries'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000, // 1 minute timeout for small dataset
    });
    
    console.log('🎉 Upload successful!');
    console.log('📊 Results:', response.data);
    
  } catch (error) {
    console.error('💥 Upload failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run upload if called directly
if (require.main === module) {
  uploadSampleData();
}

module.exports = { uploadSampleData };
