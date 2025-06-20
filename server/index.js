const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Meeting = require('./models/Meeting');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Nếu vẫn chưa có MONGODB_URI (chạy từ thư mục server), thử load file .env ở thư mục gốc dự án
if (!process.env.MONGODB_URI) {
  const rootEnvPath = path.resolve(__dirname, '../.env');
  dotenv.config({ path: rootEnvPath });
}

// Import passport config
require('./config/passport');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Connect to MongoDB với cấu hình SSL cải thiện
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority'
})
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    // Test connection bằng cách tạo một simple query
    return mongoose.connection.db.admin().ping();
  })
  .then(() => {
    console.log('✅ MongoDB ping successful');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    // Thử kết nối lại với cấu hình khác
    setTimeout(() => {
      console.log('🔄 Retrying MongoDB connection with alternative config...');
      mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 30000,
        retryWrites: true,
        w: 'majority'
      }).catch(retryErr => {
        console.error('❌ Retry connection also failed:', retryErr.message);
      });
    }, 5000);
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/meeting-rooms', require('./routes/meetingRooms'));
app.use('/api/debug', require('./routes/debug'));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Đã xảy ra lỗi!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Lưu io instance vào app để sử dụng trong routes
app.set('io', io);

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.split(' ')[1];
    if (!token) return next(new Error('Authentication error'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  // Join user's personal room để nhận notifications
  if (socket.userId) {
    socket.join(`user_${socket.userId}`);
  }

  socket.on('joinMeeting', (meetingId) => {
    if (meetingId) socket.join(meetingId);
  });

  socket.on('meetingMessage', async ({ meetingId, text }) => {
    try {
      if (!meetingId || !text?.trim()) return;
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) return;

      const newMsg = { sender: socket.userId, text: text.trim() };
      meeting.messages.push(newMsg);
      await meeting.save();

      const populated = await Meeting.findById(meetingId).select('messages').populate('messages.sender', 'fullName email avatar');
      const msgPop = populated.messages[populated.messages.length - 1];

      io.to(meetingId).emit('newMeetingMessage', msgPop);
    } catch (e) {
      console.error('socket meetingMessage error', e);
    }
  });
});

// Cron: mỗi phút kiểm tra cuộc họp kết thúc và cập nhật trạng thái
cron.schedule('*/1 * * * *', async () => {
  try {
    const now = new Date();
    const updated = await Meeting.updateMany(
      { endTime: { $lte: now }, status: { $in: ['scheduled', 'ongoing'] } },
      { status: 'completed' }
    );
    if (updated.modifiedCount) {
      console.log(`Cron: đã cập nhật ${updated.modifiedCount} cuộc họp thành completed`);
    }
  } catch (e) {
    console.error('Cron error', e);
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 