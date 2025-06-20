const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔍 Testing API...');
    
    // Test server health
    try {
      const healthResponse = await axios.get('http://localhost:5000/');
      console.log('✅ Server đang chạy:', healthResponse.status);
    } catch (err) {
      console.log('❌ Server không chạy trên port 5000');
      return;
    }
    
    // Test meeting rooms without token (should get 401)
    try {
      const roomsResponse = await axios.get('http://localhost:5000/api/meeting-rooms');
      console.log('❌ API không require auth (có vấn đề security)');
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('✅ API require authentication (đúng)');
      } else {
        console.log('❌ API error:', err.response?.status, err.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

testAPI(); 