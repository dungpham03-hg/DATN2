const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testServerDebug() {
  console.log('🚀 Testing Server Debug API...\n');

  try {
    // Test debug endpoint để xem database state
    console.log('1️⃣ Testing debug endpoint...');
    const debugResponse = await axios.get(`${API_BASE}/debug`);
    console.log('✅ Debug endpoint response:');
    console.log(JSON.stringify(debugResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Debug test failed!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testServerDebug(); 