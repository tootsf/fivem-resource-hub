const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Upload pre-entries.json to Railway database
async function uploadDataToRailway() {
  console.log('📤 Uploading pre-entries.json to Railway...');

  // Try multiple possible paths for the data file
  const possiblePaths = [
    path.join(__dirname, 'data/pre-entries.json'),
    path.join(__dirname, '../data/pre-entries.json'),
    path.join(process.cwd(), 'data/pre-entries.json'),
    'data/pre-entries.json'
  ];

  let dataPath = null;

  console.log('📂 Searching for pre-entries.json...');
  for (const testPath of possiblePaths) {
    console.log(`   Checking: ${testPath}`);
    if (fs.existsSync(testPath)) {
      dataPath = testPath;
      console.log(`   ✅ Found at: ${testPath}`);
      break;
    }
  }

  if (!dataPath) {
    console.error('❌ pre-entries.json not found in any expected location');
    console.log('Expected locations checked:');
    possiblePaths.forEach(p => console.log(`   - ${p}`));
    return;
  }

  const railwayUrl = 'https://fivem-resource-hub-production.up.railway.app/upload-data';

  try {
    // Read the local pre-entries.json file
    console.log('📂 Reading pre-entries.json...');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const preEntries = JSON.parse(rawData);

    console.log(`📊 Uploading ${preEntries.length} resources...`);
    console.log('⏳ This may take a few minutes for large datasets...');

    // Upload to Railway
    const response = await axios.post(railwayUrl, {
      data: preEntries,
      type: 'pre-entries'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 300000, // 5 minute timeout
      maxBodyLength: Infinity,
      maxContentLength: Infinity
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
  uploadDataToRailway();
}

module.exports = { uploadDataToRailway };
