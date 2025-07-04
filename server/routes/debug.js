const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MeetingRoom = require('../models/MeetingRoom');
const Meeting = require('../models/Meeting');
const Minutes = require('../models/Minutes');
const { authenticateToken } = require('../middleware/auth');
const Archive = require('../models/Archive');
const Notification = require('../models/Notification');

// @route   GET /api/debug/db-info
// @desc    Kiểm tra thông tin database connection
// @access  Public (để debug)
router.get('/db-info', async (req, res) => {
  try {
    const dbInfo = {
      connectionState: mongoose.connection.readyState,
      connectionName: mongoose.connection.name,
      connectionHost: mongoose.connection.host,
      mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not Set',
      collections: await mongoose.connection.db.listCollections().toArray()
    };

    res.json({
      message: 'Database info',
      info: dbInfo
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error getting DB info',
      error: error.message
    });
  }
});

// @route   GET /api/debug/rooms-raw
// @desc    Lấy rooms trực tiếp từ database
// @access  Public (để debug)  
router.get('/rooms-raw', async (req, res) => {
  try {
    const rooms = await MeetingRoom.find({}).lean();
    
    res.json({
      message: 'Raw rooms from database',
      count: rooms.length,
      rooms: rooms
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching rooms',
      error: error.message
    });
  }
});

// @route   POST /api/debug/create-test-summary/:meetingId
// @desc    Tạo test summary message cho cuộc họp
// @access  Public (để debug)
router.post('/create-test-summary/:meetingId', async (req, res) => {
  try {
    const Meeting = require('../models/Meeting');
    const User = require('../models/User');
    
    const meetingId = req.params.meetingId;
    const meeting = await Meeting.findById(meetingId);
    
    if (!meeting) {
      return res.status(404).json({
        message: 'Meeting not found'
      });
    }

    // Tìm user đầu tiên để làm author
    const user = await User.findOne();
    if (!user) {
      return res.status(404).json({
        message: 'No user found'
      });
    }

    // Tạo test summary message với nhiều loại attachment
    const testSummaryMessage = {
      author: user._id,
      text: `Test summary message được tạo lúc ${new Date().toLocaleString('vi-VN')}.\n\nBao gồm:\n- Ảnh test để kiểm tra hiển thị\n- File PDF test\n- Nội dung text dài để test UI`,
      attachments: [
        {
          name: 'Pink-and-Purple-Gradient-Tech-Abstract-Logo.png',
          path: '/uploads/meetings/summaryImage-1750307656081-651318682.jpg', // Sử dụng file thật có sẵn
          size: 156432,
          type: 'image'
        },
        {
          name: 'Biên bản họp test.pdf',
          path: '/uploads/meetings/file-1750306053948-846965760.pdf', // File PDF có sẵn
          size: 234567,
          type: 'file'
        },
        {
          name: 'Hình ảnh thứ hai.jpg',
          path: '/uploads/meetings/summaryImage-1750307640575-753037648.png', // Ảnh thứ 2
          size: 98765,
          type: 'image'
        }
      ],
      createdAt: new Date()
    };

    // Thêm vào meeting
    if (!meeting.summaryMessages) {
      meeting.summaryMessages = [];
    }
    
    meeting.summaryMessages.push(testSummaryMessage);
    await meeting.save();

    // Populate để trả về data đầy đủ
    await meeting.populate('summaryMessages.author', 'fullName email avatar');
    const addedMessage = meeting.summaryMessages[meeting.summaryMessages.length - 1];

    res.json({
      message: 'Test summary message created successfully',
      meetingId: meeting._id,
      meetingTitle: meeting.title,
      summaryMessage: addedMessage,
      testUrl: `http://localhost:3000/meetings/${meeting._id}`
    });

  } catch (error) {
    console.error('Create test summary error:', error);
    res.status(500).json({
      message: 'Error creating test summary',
      error: error.message
    });
  }
});

// @route   GET /api/debug/test-db
// @desc    Test database connection và count meetings
// @access  Public (để debug)
router.get('/test-db', async (req, res) => {
  try {
    const Meeting = require('../models/Meeting');
    
    const totalMeetings = await Meeting.countDocuments();
    const recentMeetings = await Meeting.find()
      .populate('organizer', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title startTime organizer createdAt');

    res.json({
      message: '✅ Database connection successful',
      stats: {
        totalMeetings,
        recentMeetingsCount: recentMeetings.length
      },
      recentMeetings: recentMeetings.map(m => ({
        id: m._id,
        title: m.title,
        startTime: m.startTime,
        organizer: m.organizer?.fullName,
        createdAt: m.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Database test error:', error);
    res.status(500).json({
      message: '❌ Database connection failed',
      error: error.message
    });
  }
});

// @route   GET /api/debug/meetings-with-summary
// @desc    Lấy danh sách meetings có summary messages
// @access  Public (để debug)
router.get('/meetings-with-summary', async (req, res) => {
  try {
    const Meeting = require('../models/Meeting');
    
    const meetings = await Meeting.find({
      'summaryMessages.0': { $exists: true }
    })
    .populate('organizer', 'fullName email')
    .populate('summaryMessages.author', 'fullName email')
    .select('title startTime location summaryMessages')
    .limit(10);

    const summary = meetings.map(meeting => ({
      id: meeting._id,
      title: meeting.title,
      startTime: meeting.startTime,
      location: meeting.location,
      organizer: meeting.organizer?.fullName,
      summaryMessagesCount: meeting.summaryMessages?.length || 0,
      testUrl: `http://localhost:3000/meetings/${meeting._id}`
    }));

    res.json({
      message: 'Meetings with summary messages',
      count: meetings.length,
      meetings: summary
    });

  } catch (error) {
    console.error('Get meetings with summary error:', error);
    res.status(500).json({
      message: 'Error getting meetings',
      error: error.message
    });
  }
});

// @route   GET /api/debug/meetings
// @desc    Debug meetings
// @access  Private
router.get('/meetings', authenticateToken, async (req, res) => {
  try {
    const meetings = await Meeting.find({}).limit(5).populate('attendees.user', 'fullName email');
    res.json({ meetings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/debug/minutes/:meetingId
// @desc    Debug minutes for a specific meeting
// @access  Private  
router.get('/minutes/:meetingId', authenticateToken, async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    // Check meeting exists
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Get all minutes for this meeting
    const allMinutes = await Minutes.find({ meeting: meetingId })
      .populate('secretary', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .sort({ createdAt: -1 });
    
    // Check validation logic
    const existingActiveMinutes = await Minutes.findOne({ 
      meeting: meetingId, 
      isVotingClosed: false,
      status: { $in: ['draft', 'pending_review', 'pending_approval'] }
    });
    
    // Schema check
    const meetingField = Minutes.schema.paths.meeting;
    
    res.json({
      meeting: {
        id: meeting._id,
        title: meeting.title,
        attendeeCount: meeting.attendees.length
      },
      minutesCount: allMinutes.length,
      allMinutes: allMinutes.map(m => ({
        id: m._id,
        title: m.title,
        status: m.status,
        isVotingClosed: m.isVotingClosed,
        createdAt: m.createdAt
      })),
      validation: {
        hasActiveMinutes: !!existingActiveMinutes,
        activeMinutesDetails: existingActiveMinutes ? {
          id: existingActiveMinutes._id,
          status: existingActiveMinutes.status,
          isVotingClosed: existingActiveMinutes.isVotingClosed
        } : null,
        canCreateNew: !existingActiveMinutes
      },
      schema: {
        meetingFieldHasUnique: meetingField.options.unique || false,
        meetingFieldRequired: meetingField.options.required || false
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/debug/test-create-minutes
// @desc    Test create minutes with detailed logging
// @access  Private
router.post('/test-create-minutes', authenticateToken, async (req, res) => {
  try {
    const { meetingId, title = 'Test Minutes', content = 'Test content' } = req.body;
    
    if (!meetingId) {
      return res.status(400).json({ error: 'meetingId is required' });
    }
    
    console.log('🧪 Testing minutes creation:', { meetingId, userId: req.user._id });
    
    // Step 1: Check meeting exists
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      console.log('❌ Meeting not found');
      return res.status(404).json({ error: 'Meeting not found' });
    }
    console.log('✅ Meeting found:', meeting.title);
    
    // Step 2: Check user role
    const userRole = req.user.role;
    const canCreate = ['admin', 'manager', 'secretary'].includes(userRole);
    console.log('👤 User role check:', { role: userRole, canCreate });
    
    if (!canCreate) {
      console.log('❌ Insufficient permissions');
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Step 3: Check existing active minutes
    const existingActiveMinutes = await Minutes.findOne({ 
      meeting: meetingId, 
      isVotingClosed: false,
      status: { $in: ['draft', 'pending_review', 'pending_approval'] }
    });
    
    console.log('🔍 Existing active minutes check:', !!existingActiveMinutes);
    if (existingActiveMinutes) {
      console.log('❌ Active minutes found:', {
        id: existingActiveMinutes._id,
        status: existingActiveMinutes.status,
        isVotingClosed: existingActiveMinutes.isVotingClosed
      });
      return res.status(400).json({ 
        error: 'Active minutes already exist',
        details: {
          id: existingActiveMinutes._id,
          status: existingActiveMinutes.status,
          isVotingClosed: existingActiveMinutes.isVotingClosed
        }
      });
    }
    
    // Step 4: Try to create minutes
    const voteDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    console.log('🏗️ Creating minutes...');
    const minutes = new Minutes({
      meeting: meetingId,
      title,
      content,
      voteDeadline,
      secretary: req.user._id,
      metadata: {
        attendeeCount: meeting.attendees.length,
        requiredVoteCount: meeting.attendees.length
      }
    });
    
    await minutes.save();
    console.log('✅ Minutes created successfully:', minutes._id);
    
    res.json({
      success: true,
      message: 'Test minutes creation successful',
      minutesId: minutes._id
    });
    
  } catch (error) {
    console.log('❌ Error creating minutes:', error.message);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test archive creation
router.get('/test-archive', authenticateToken, async (req, res) => {
  try {
    // Tìm cuộc họp completed
    const meetings = await Meeting.find({ status: 'completed' })
      .populate('organizer', 'fullName email department position')
      .populate('secretary', 'fullName email department position')
      .populate('attendees.user', 'fullName email department position')
      .populate('minutes')
      .limit(5);

    console.log(`Found ${meetings.length} completed meetings`);

    const results = [];
    for (const meeting of meetings) {
      const exists = await Archive.exists({ meeting: meeting._id });
      
      results.push({
        meetingId: meeting._id,
        title: meeting.title,
        status: meeting.status,
        endTime: meeting.endTime,
        hasArchive: !!exists,
        organizer: meeting.organizer?.fullName
      });

      if (!exists) {
        // Tạo archive thử
        try {
          const meetingSnapshot = {
            title: meeting.title,
            description: meeting.description,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            actualEndTime: meeting.actualEndTime,
            location: meeting.location,
            meetingType: meeting.meetingType,
            status: meeting.status,
            priority: meeting.priority,
            department: meeting.department,
            organizer: meeting.organizer,
            secretary: meeting.secretary,
            attendees: meeting.attendees,
            attendeeCount: meeting.attendees.length,
            duration: Math.round((meeting.endTime - meeting.startTime) / (1000 * 60))
          };

          const archiveData = {
            meeting: meeting._id,
            title: `Lưu trữ - ${meeting.title}`,
            archiveType: 'complete',
            meetingSnapshot,
            createdBy: meeting.organizer?._id || req.user._id,
            documents: [],
            tags: meeting.tags || [],
            access: {
              isPublic: true, // Tạm thời public để test
              allowedDepartments: [meeting.department]
            }
          };

          // Minutes snapshot nếu có
          if (meeting.minutes) {
            const minutes = await Minutes.findById(meeting.minutes)
              .populate('secretary', 'fullName email')
              .populate('approvedBy', 'fullName email');
            if (minutes) {
              archiveData.minutesSnapshot = {
                _id: minutes._id,
                title: minutes.title,
                content: minutes.content,
                status: minutes.status,
                voteDeadline: minutes.voteDeadline,
                isApproved: minutes.isApproved,
                secretary: minutes.secretary,
                approvedBy: minutes.approvedBy,
                approvedAt: minutes.approvedAt
              };
            }
          }

          // Notifications
          const notifications = await Notification.find({ 'data.meetingId': meeting._id }).limit(20);
          archiveData.notifications = notifications.map(n => ({
            _id: n._id,
            type: n.type,
            title: n.title,
            message: n.message,
            createdAt: n.createdAt,
            sender: n.sender
          }));

          const archive = await Archive.create(archiveData);
          console.log(`✅ Created archive for ${meeting._id}`);
          
          results[results.length - 1].archiveCreated = true;
          results[results.length - 1].archiveId = archive._id;
        } catch (archiveErr) {
          console.error('Error creating archive:', archiveErr);
          results[results.length - 1].archiveError = archiveErr.message;
        }
      }
    }

    res.json({
      message: 'Test archive completed',
      results,
      totalCompleted: meetings.length
    });

  } catch (error) {
    console.error('Test archive error:', error);
    res.status(500).json({
      message: 'Test failed',
      error: error.message
    });
  }
});

// Debug meeting data
router.get('/meeting-data/:id', authenticateToken, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizer', 'fullName email')
      .populate('secretary', 'fullName email')
      .populate('minutes')
      .populate('notes.author', 'fullName')
      .populate('summaryMessages.author', 'fullName');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const result = {
      meeting: {
        _id: meeting._id,
        title: meeting.title,
        status: meeting.status,
        hasMinutes: !!meeting.minutes,
        hasSummary: !!meeting.summary,
        hasNotes: meeting.notes && meeting.notes.length > 0,
        hasSummaryMessages: meeting.summaryMessages && meeting.summaryMessages.length > 0,
        hasAttachments: meeting.attachments && meeting.attachments.length > 0
      },
      minutes: meeting.minutes ? {
        _id: meeting.minutes._id,
        title: meeting.minutes.title,
        content: meeting.minutes.content ? meeting.minutes.content.substring(0, 200) + '...' : null,
        status: meeting.minutes.status,
        isApproved: meeting.minutes.isApproved,
        decisionsCount: meeting.minutes.decisions ? meeting.minutes.decisions.length : 0,
        votesCount: meeting.minutes.votes ? meeting.minutes.votes.length : 0
      } : null,
      summary: meeting.summary || null,
      notesCount: meeting.notes ? meeting.notes.length : 0,
      summaryMessagesCount: meeting.summaryMessages ? meeting.summaryMessages.length : 0
    };

    res.json({
      message: 'Meeting data retrieved',
      data: result
    });

  } catch (error) {
    console.error('Debug meeting data error:', error);
    res.status(500).json({
      message: 'Error retrieving meeting data',
      error: error.message
    });
  }
});

module.exports = router; 