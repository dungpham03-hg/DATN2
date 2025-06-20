const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Meeting = require('../models/Meeting');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      ssl: true,
      sslValidate: false,
      retryWrites: true,
      w: 'majority'
    });
    console.log('✅ Kết nối MongoDB thành công!');

    // Clear existing data
    await User.deleteMany({});
    await Meeting.deleteMany({});
    console.log('🧹 Đã xóa dữ liệu cũ');

    // Create sample users
    const sampleUsers = [
      {
        fullName: 'Quản trị viên',
        email: 'admin@example.com',
        password: 'Admin123',
        role: 'admin',
        department: 'IT',
        position: 'System Administrator',
        phone: '0901234567',
        isActive: true,
        emailVerified: true
      },
      {
        fullName: 'Nguyễn Văn Manager',
        email: 'manager@example.com',
        password: 'Manager123',
        role: 'manager',
        department: 'Sales',
        position: 'Sales Manager',
        phone: '0902345678',
        isActive: true,
        emailVerified: true
      },
      {
        fullName: 'Trần Thị User',
        email: 'user@example.com',
        password: 'User123',
        role: 'employee',
        department: 'Marketing',
        position: 'Marketing Specialist',
        phone: '0903456789',
        isActive: true,
        emailVerified: true
      },
      {
        fullName: 'Lê Văn Dev',
        email: 'dev@example.com',
        password: 'Dev123',
        role: 'employee',
        department: 'IT',
        position: 'Frontend Developer',
        phone: '0904567890',
        isActive: true,
        emailVerified: true
      },
      {
        fullName: 'Phạm Thị Designer',
        email: 'designer@example.com',
        password: 'Designer123',
        role: 'employee',
        department: 'Design',
        position: 'UI/UX Designer',
        phone: '0905678901',
        isActive: true,
        emailVerified: true
      }
    ];

    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`👤 Tạo user: ${user.email}`);
    }

    // Create sample meetings
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const sampleMeetings = [
      {
        title: 'Họp kick-off dự án mới',
        description: 'Thảo luận về yêu cầu và lên kế hoạch cho dự án ứng dụng quản lý cuộc họp',
        startTime: new Date(tomorrow.setHours(9, 0, 0, 0)),
        endTime: new Date(tomorrow.setHours(10, 30, 0, 0)),
        location: 'Phòng họp A',
        meetingType: 'offline',
        priority: 'high',
        organizer: createdUsers[0]._id, // Admin
        department: 'IT',
        attendees: [
          { user: createdUsers[1]._id, status: 'accepted' },
          { user: createdUsers[2]._id, status: 'invited' },
          { user: createdUsers[3]._id, status: 'accepted' }
        ],
        tags: ['dự án', 'kick-off', 'lập kế hoạch'],
        status: 'scheduled'
      },
      {
        title: 'Review tính năng UI/UX',
        description: 'Đánh giá thiết kế giao diện người dùng cho module quản lý cuộc họp',
        startTime: new Date(tomorrow.setHours(14, 0, 0, 0)),
        endTime: new Date(tomorrow.setHours(15, 0, 0, 0)),
        location: 'Phòng thiết kế',
        meetingType: 'hybrid',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        priority: 'medium',
        organizer: createdUsers[4]._id, // Designer
        department: 'Design',
        attendees: [
          { user: createdUsers[0]._id, status: 'tentative' },
          { user: createdUsers[3]._id, status: 'accepted' }
        ],
        tags: ['UI', 'UX', 'review', 'thiết kế'],
        status: 'scheduled'
      },
      {
        title: 'Sprint Planning - Tuần 2',
        description: 'Lập kế hoạch sprint cho tuần thứ 2 của dự án',
        startTime: new Date(nextWeek.setHours(10, 0, 0, 0)),
        endTime: new Date(nextWeek.setHours(12, 0, 0, 0)),
        meetingType: 'online',
        meetingLink: 'https://zoom.us/j/1234567890',
        priority: 'medium',
        organizer: createdUsers[1]._id, // Manager
        department: 'IT',
        attendees: [
          { user: createdUsers[0]._id, status: 'invited' },
          { user: createdUsers[3]._id, status: 'invited' },
          { user: createdUsers[4]._id, status: 'invited' }
        ],
        tags: ['sprint', 'planning', 'agile'],
        status: 'scheduled'
      },
      {
        title: 'Đào tạo sử dụng hệ thống',
        description: 'Hướng dẫn nhân viên sử dụng ứng dụng quản lý cuộc họp mới',
        startTime: new Date(nextWeek.setHours(9, 0, 0, 0)),
        endTime: new Date(nextWeek.setHours(11, 0, 0, 0)),
        location: 'Phòng đào tạo',
        meetingType: 'offline',
        priority: 'low',
        organizer: createdUsers[0]._id, // Admin
        department: 'All',
        attendees: [
          { user: createdUsers[1]._id, status: 'invited' },
          { user: createdUsers[2]._id, status: 'invited' },
          { user: createdUsers[3]._id, status: 'invited' },
          { user: createdUsers[4]._id, status: 'invited' }
        ],
        tags: ['đào tạo', 'hướng dẫn', 'onboarding'],
        status: 'scheduled'
      }
    ];

    for (const meetingData of sampleMeetings) {
      const meeting = new Meeting(meetingData);
      await meeting.save();
      console.log(`📅 Tạo cuộc họp: ${meeting.title}`);
    }

    console.log('\n🎉 Seed database thành công!');
    console.log('\n📋 Thông tin đăng nhập:');
    console.log('Admin: admin@example.com / Admin123');
    console.log('Manager: manager@example.com / Manager123');
    console.log('User: user@example.com / User123');
    console.log('Dev: dev@example.com / Dev123');
    console.log('Designer: designer@example.com / Designer123');
    
    console.log('\n📊 Thống kê:');
    console.log(`Users: ${createdUsers.length}`);
    console.log(`Meetings: ${sampleMeetings.length}`);

  } catch (error) {
    console.error('❌ Lỗi khi seed database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Đã đóng kết nối MongoDB');
    process.exit(0);
  }
};

// Chạy script
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase; 