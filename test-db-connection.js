const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const MeetingRoom = require('./server/models/MeetingRoom');

async function testDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000
    });
    console.log('✅ Connected to MongoDB successfully!');

    // Test 1: Count all meeting rooms
    console.log('\n1️⃣ Counting all meeting rooms...');
    const totalCount = await MeetingRoom.countDocuments();
    console.log('Total meeting rooms in DB:', totalCount);

    // Test 2: Find all meeting rooms
    console.log('\n2️⃣ Finding all meeting rooms...');
    const allRooms = await MeetingRoom.find({});
    console.log('Found rooms:', allRooms.length);
    allRooms.forEach(room => {
      console.log(`- ${room.name} (${room.capacity} người) - ${room.isActive ? 'Active' : 'Inactive'}`);
    });

    // Test 3: Find only active rooms
    console.log('\n3️⃣ Finding active meeting rooms...');
    const activeRooms = await MeetingRoom.find({ isActive: true });
    console.log('Active rooms:', activeRooms.length);

    // Test 4: Create a test room
    console.log('\n4️⃣ Creating a test room...');
    const testRoom = new MeetingRoom({
      name: `Direct DB Test Room ${Date.now()}`,
      capacity: 15,
      location: {
        floor: 'Tầng 3',
        building: 'Tòa nhà test',
        address: 'Test address'
      },
      facilities: ['projector'],
      description: 'Created directly through MongoDB',
      createdBy: new mongoose.Types.ObjectId() // fake ObjectId
    });

    const savedRoom = await testRoom.save();
    console.log('✅ Room saved with ID:', savedRoom._id);

    // Test 5: Count again
    console.log('\n5️⃣ Counting again...');
    const newCount = await MeetingRoom.countDocuments();
    console.log('New total count:', newCount);

    // Test 6: Find the room we just created
    console.log('\n6️⃣ Finding our created room...');
    const foundRoom = await MeetingRoom.findById(savedRoom._id);
    console.log('Found room:', foundRoom ? foundRoom.name : 'NOT FOUND');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testDatabase(); 