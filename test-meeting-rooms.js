const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testMeetingRooms() {
  console.log('🚀 Testing Meeting Rooms API...\n');

  try {
    // Test 1: Login để lấy token
    console.log('1️⃣ Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin123'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('✅ Login successful!');
    console.log('User role:', user.role);
    console.log('Token:', token.substring(0, 20) + '...\n');

    // Test 2: Lấy danh sách phòng họp
    console.log('2️⃣ Testing GET meeting rooms...');
    const getRoomsResponse = await axios.get(`${API_BASE}/meeting-rooms`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Get rooms successful!');
    console.log('Current rooms count:', getRoomsResponse.data.rooms.length);
    console.log('Rooms:', getRoomsResponse.data.rooms.map(r => r.name).join(', ') || 'None\n');

    // Test 3: Tạo phòng họp mới
    console.log('3️⃣ Testing CREATE meeting room...');
    const newRoomData = {
      name: `Test Room ${Date.now()}`,
      capacity: 10,
      location: {
        floor: 'Tầng 2',
        building: 'Tòa nhà chính',
        address: '123 Test Street'
      },
      facilities: ['projector', 'wifi'],
      description: 'Test room created by script'
    };

    console.log('Sending data:', JSON.stringify(newRoomData, null, 2));
    
    const createResponse = await axios.post(
      `${API_BASE}/meeting-rooms`,
      newRoomData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Create room successful!');
    console.log('Created room:', createResponse.data.room);

    // Test 4: Lấy lại danh sách để verify
    console.log('\n4️⃣ Verifying creation...');
    const verifyResponse = await axios.get(`${API_BASE}/meeting-rooms`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Verification successful!');
    console.log('Total rooms after creation:', verifyResponse.data.rooms.length);

  } catch (error) {
    console.error('❌ Test failed!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testMeetingRooms(); 