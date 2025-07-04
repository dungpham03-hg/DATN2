const mongoose = require('mongoose');
const User = require('../models/User');

// Kết nối database
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/meeting_management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Cập nhật role của user
const updateUserRole = async () => {
  try {
    // Lấy user đầu tiên hoặc user theo email
    const email = process.argv[2] || null;
    
    let user;
    if (email) {
      user = await User.findByEmail(email);
      if (!user) {
        console.log(`Không tìm thấy user với email: ${email}`);
        return;
      }
    } else {
      user = await User.findOne({});
      if (!user) {
        console.log('Không tìm thấy user nào trong database');
        return;
      }
    }

    console.log(`User hiện tại: ${user.fullName} (${user.email})`);
    console.log(`Role hiện tại: ${user.role}`);

    // Cập nhật thành admin
    user.role = 'admin';
    await user.save();

    console.log(`✅ Đã cập nhật role thành: ${user.role}`);
    
  } catch (error) {
    console.error('Lỗi cập nhật role:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Chạy script
const run = async () => {
  await connectDB();
  await updateUserRole();
};

run(); 