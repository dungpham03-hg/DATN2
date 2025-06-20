const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Meeting = require('../models/Meeting');
const Notification = require('../models/Notification');
const { 
  authenticateToken, 
  checkResourceOwnership,
  checkDepartmentAccess 
} = require('../middleware/auth');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/meetings');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Định dạng file không được hỗ trợ'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Validation rules
const meetingValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Tiêu đề cuộc họp phải từ 3-200 ký tự'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Mô tả không được vượt quá 1000 ký tự'),
  
  body('startTime')
    .isISO8601()
    .withMessage('Thời gian bắt đầu không hợp lệ')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Thời gian bắt đầu phải trong tương lai');
      }
      return true;
    }),
  
  body('endTime')
    .isISO8601()
    .withMessage('Thời gian kết thúc không hợp lệ')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
      }
      return true;
    }),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Địa điểm không được vượt quá 200 ký tự'),
  
  body('meetingLink')
    .optional()
    .isURL()
    .withMessage('Link cuộc họp phải là URL hợp lệ'),
  
  body('meetingType')
    .optional()
    .isIn(['offline', 'online', 'hybrid'])
    .withMessage('Loại cuộc họp không hợp lệ'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Mức độ ưu tiên không hợp lệ'),
  
  body('attendees')
    .optional()
    .isArray()
    .withMessage('Danh sách tham gia phải là mảng'),
  
  body('attendees.*')
    .optional()
    .isMongoId()
    .withMessage('ID người tham gia không hợp lệ')
];

// Helper function để xử lý validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }
  next();
};

// @route   GET /api/meetings
// @desc    Lấy danh sách cuộc họp
// @access  Private
router.get('/', authenticateToken, checkDepartmentAccess, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority,
      startDate,
      endDate,
      search,
      department 
    } = req.query;

    // Build query điều kiện AND (status, priority, time...) và OR (quyền truy cập)
    const andConditions = [];

    // Department được gửi từ query (có thể auto-insert bởi middleware)
    const requestedDept = department;

    if (status) andConditions.push({ status });
    if (priority) andConditions.push({ priority });

    if (startDate || endDate) {
      const timeCond = {};
      if (startDate) timeCond.$gte = new Date(startDate);
      if (endDate) timeCond.$lte = new Date(endDate);
      andConditions.push({ startTime: timeCond });
    }

    if (search) {
      andConditions.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Quyền truy cập
    let orConditions = [];

    if (req.user.role === 'admin') {
      orConditions = [{}]; // admin thấy tất cả
    } else if (req.user.role === 'manager' || req.user.role === 'secretary') {
      // Manager và Secretary thấy:
      // 1. Họp mình tổ chức
      orConditions.push({ organizer: req.user._id });
      // 2. Họp mình được mời
      orConditions.push({ 'attendees.user': req.user._id });
      // 3. Mọi cuộc họp công khai
      orConditions.push({ isPrivate: false });
      // 4. Cuộc họp riêng tư cùng phòng ban
      if (req.user.department) {
        orConditions.push({ 
          isPrivate: true, 
          department: req.user.department 
        });
      }
    } else {
      // Employee chỉ thấy:
      // 1. Họp mình tổ chức (nếu có)
      orConditions.push({ organizer: req.user._id });
      // 2. Họp mình được mời
      orConditions.push({ 'attendees.user': req.user._id });
      // 3. Cuộc họp công khai
      orConditions.push({ isPrivate: false });
      // Không thấy cuộc họp riêng tư cùng phòng ban nếu không được mời
    }

    const query = {
      $and: [ ...andConditions, { $or: orConditions } ]
    };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { startTime: 1 },
      populate: [
        { path: 'organizer', select: 'fullName email avatar' },
        { path: 'attendees.user', select: 'fullName email avatar' }
      ]
    };

    const result = await Meeting.paginate(query, options);

    res.json({
      message: 'Lấy danh sách cuộc họp thành công',
      meetings: result.docs,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.totalDocs,
        pages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      }
    });

  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách cuộc họp',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   GET /api/meetings/:id
// @desc    Lấy thông tin chi tiết cuộc họp
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizer', 'fullName email avatar department position')
      .populate('attendees.user', 'fullName email avatar department position')
      .populate('agenda')
      .populate('minutes')
      .populate('messages.sender', 'fullName email avatar')
      .populate('summaryMessages.author', 'fullName email avatar');

    if (!meeting) {
      return res.status(404).json({
        message: 'Cuộc họp không tồn tại'
      });
    }

    // Kiểm tra quyền truy cập chi tiết
    let canAccess = false;
    
    if (req.user.role === 'admin') {
      // Admin thấy tất cả
      canAccess = true;
    } else if (req.user.role === 'manager' || req.user.role === 'secretary') {
      // Manager và Secretary thấy:
      canAccess = 
        meeting.organizer._id.toString() === req.user._id.toString() || // Mình tổ chức
        meeting.attendees.some(att => att.user._id.toString() === req.user._id.toString()) || // Được mời
        !meeting.isPrivate || // Công khai
        (meeting.isPrivate && meeting.department === req.user.department); // Riêng tư cùng phòng ban
    } else {
      // Employee chỉ thấy:
      canAccess = 
        meeting.organizer._id.toString() === req.user._id.toString() || // Mình tổ chức
        meeting.attendees.some(att => att.user._id.toString() === req.user._id.toString()) || // Được mời
        !meeting.isPrivate; // Công khai
    }

    if (!canAccess) {
      return res.status(403).json({
        message: 'Bạn không có quyền truy cập cuộc họp này'
      });
    }

    res.json({
      message: 'Lấy thông tin cuộc họp thành công',
      meeting
    });

  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy thông tin cuộc họp',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   POST /api/meetings
// @desc    Tạo cuộc họp mới
// @access  Private
router.post('/', authenticateToken, meetingValidation, handleValidationErrors, async (req, res) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      meetingLink,
      meetingType,
      priority,
      attendees,
      tags,
      isPrivate
    } = req.body;

    // Tạo meeting data
    const meetingData = {
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location,
      meetingLink,
      meetingType: meetingType || 'offline',
      priority: priority || 'medium',
      organizer: req.user._id,
      department: req.user.department,
      tags: tags || [],
      isPrivate: isPrivate || false
    };

    // Thêm attendees nếu có
    if (attendees && attendees.length > 0) {
      meetingData.attendees = attendees.map(userId => ({
        user: userId,
        status: 'invited'
      }));
    }

    const meeting = new Meeting(meetingData);
    await meeting.save();

    // Populate thông tin organizer và attendees
    await meeting.populate([
      { path: 'organizer', select: 'fullName email avatar' },
      { path: 'attendees.user', select: 'fullName email avatar' }
    ]);

    // Gửi thông báo cho attendees
    if (attendees && attendees.length > 0) {
      const notifications = await Notification.createMeetingInvite(
        meeting._id,
        attendees,
        req.user._id
      );

      // Gửi real-time notification qua Socket.IO
      const io = req.app.get('io');
      if (io) {
        for (const attendeeId of attendees) {
          const notification = notifications.find(n => n.recipient.toString() === attendeeId.toString());
          if (notification) {
            await notification.populate([
              { path: 'sender', select: 'fullName email avatar' },
              { path: 'data.meetingId', select: 'title startTime' }
            ]);
            
            // Tạo custom message với thông tin meeting
            notification.message = `${req.user.fullName} đã mời bạn tham gia cuộc họp "${meeting.title}"`;
            
            io.to(`user_${attendeeId}`).emit('newNotification', notification);
          }
        }
      }
    }

    res.status(201).json({
      message: 'Tạo cuộc họp thành công',
      meeting
    });

  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({
      message: 'Lỗi server khi tạo cuộc họp',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   PUT /api/meetings/:id
// @desc    Cập nhật cuộc họp
// @access  Private
router.put('/:id', authenticateToken, checkResourceOwnership('organizer'), meetingValidation, handleValidationErrors, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({
        message: 'Cuộc họp không tồn tại'
      });
    }

    // Kiểm tra quyền chỉnh sửa
    if (req.user.role !== 'admin' && meeting.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Chỉ người tổ chức hoặc admin mới có thể chỉnh sửa cuộc họp'
      });
    }

    // Kiểm tra cuộc họp đã bắt đầu chưa
    if (meeting.status === 'ongoing' || meeting.status === 'completed') {
      return res.status(400).json({
        message: 'Không thể chỉnh sửa cuộc họp đã bắt đầu hoặc đã kết thúc'
      });
    }

    const {
      title,
      description,
      startTime,
      endTime,
      location,
      meetingLink,
      meetingType,
      priority,
      attendees,
      tags,
      isPrivate
    } = req.body;

    // Cập nhật dữ liệu
    const updateData = {
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location,
      meetingLink,
      meetingType,
      priority,
      tags,
      isPrivate
    };

    // Cập nhật attendees nếu có
    if (attendees) {
      updateData.attendees = attendees.map(userId => {
        // Giữ lại status cũ nếu user đã có trong danh sách
        const existingAttendee = meeting.attendees.find(
          att => att.user.toString() === userId.toString()
        );
        
        return {
          user: userId,
          status: existingAttendee ? existingAttendee.status : 'invited',
          responseDate: existingAttendee ? existingAttendee.responseDate : undefined
        };
      });
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'organizer', select: 'fullName email avatar' },
      { path: 'attendees.user', select: 'fullName email avatar' }
    ]);

    res.json({
      message: 'Cập nhật cuộc họp thành công',
      meeting: updatedMeeting
    });

  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({
      message: 'Lỗi server khi cập nhật cuộc họp',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   DELETE /api/meetings/:id
// @desc    Xóa cuộc họp
// @access  Private
router.delete('/:id', authenticateToken, checkResourceOwnership('organizer'), async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({
        message: 'Cuộc họp không tồn tại'
      });
    }

    // Kiểm tra quyền xóa
    if (req.user.role !== 'admin' && meeting.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Chỉ người tổ chức hoặc admin mới có thể xóa cuộc họp'
      });
    }

    // Không cho phép xóa cuộc họp đang diễn ra hoặc đã hoàn thành
    if (meeting.status === 'ongoing' || meeting.status === 'completed') {
      return res.status(400).json({
        message: 'Không thể xóa cuộc họp đang diễn ra hoặc đã hoàn thành'
      });
    }

    await Meeting.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Xóa cuộc họp thành công'
    });

  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({
      message: 'Lỗi server khi xóa cuộc họp',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   PUT /api/meetings/:id/respond
// @desc    Phản hồi lời mời tham gia cuộc họp
// @access  Private
router.put('/:id/respond', authenticateToken, [
  body('status')
    .isIn(['accepted', 'declined', 'tentative'])
    .withMessage('Trạng thái phản hồi không hợp lệ')
], handleValidationErrors, async (req, res) => {
  try {
    const { status } = req.body;
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({
        message: 'Cuộc họp không tồn tại'
      });
    }

    // Kiểm tra user có trong danh sách attendees không
    const attendeeIndex = meeting.attendees.findIndex(
      att => att.user.toString() === req.user._id.toString()
    );

    if (attendeeIndex === -1) {
      return res.status(400).json({
        message: 'Bạn không có trong danh sách tham gia cuộc họp này'
      });
    }

    // Cập nhật status
    meeting.attendees[attendeeIndex].status = status;
    meeting.attendees[attendeeIndex].responseDate = new Date();
    
    await meeting.save();

    res.json({
      message: `Phản hồi lời mời thành công: ${status}`,
      meeting
    });

  } catch (error) {
    console.error('Respond meeting error:', error);
    res.status(500).json({
      message: 'Lỗi server khi phản hồi lời mời',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   POST /api/meetings/:id/messages
// @desc    Gửi lời nhắn đến organizer/admin
// @access  Private
router.post('/:id/messages', authenticateToken, [
  body('text').trim().isLength({ min:1, max:1000 }).withMessage('Nội dung lời nhắn phải từ 1-1000 ký tự')
], handleValidationErrors, async (req, res)=>{
  try {
    const meeting = await Meeting.findById(req.params.id);
    if(!meeting) return res.status(404).json({ message:'Cuộc họp không tồn tại' });

    meeting.messages.push({ sender: req.user._id, text: req.body.text });
    await meeting.save();

    res.status(201).json({ message:'Gửi lời nhắn thành công' });
  } catch(err){
    console.error('Add message error:', err);
    res.status(500).json({ message:'Lỗi server khi gửi lời nhắn'});
  }
});

// @route GET /api/meetings/summary
router.get('/summary/stats', authenticateToken, async (req,res)=>{
  try{
    const userDept = req.user.department;
    const baseMatch = { department: userDept }; // chỉ lấy cùng phòng ban

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1);

    const [todayCount, upcomingCount, completedCount] = await Promise.all([
      Meeting.countDocuments({ ...baseMatch, startTime:{ $gte: startOfToday, $lt: endOfToday } }),
      Meeting.countDocuments({ ...baseMatch, startTime:{ $gt: now } }),
      Meeting.countDocuments({ ...baseMatch, status:'completed' })
    ]);

    res.json({ today: todayCount, upcoming: upcomingCount, completed: completedCount });
  }catch(err){
    res.status(500).json({ message:'Lỗi server khi lấy thống kê' });
  }
});

// @route   PUT /api/meetings/:id/close
// @desc    Đóng cuộc họp thủ công
// @access  Private (Admin, Manager, Secretary)
router.put('/:id/close', authenticateToken, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({
        message: 'Cuộc họp không tồn tại'
      });
    }

    // Kiểm tra quyền: Admin, Manager hoặc người tổ chức
    const canClose = 
      req.user.role === 'admin' ||
      req.user.role === 'manager' ||
      (req.user.role === 'secretary' && meeting.organizer.toString() === req.user._id.toString()) ||
      meeting.organizer.toString() === req.user._id.toString();

    if (!canClose) {
      return res.status(403).json({
        message: 'Bạn không có quyền đóng cuộc họp này'
      });
    }

    // Kiểm tra trạng thái cuộc họp
    if (meeting.status === 'completed') {
      return res.status(400).json({
        message: 'Cuộc họp đã được đóng'
      });
    }

    if (meeting.status === 'cancelled') {
      return res.status(400).json({
        message: 'Cuộc họp đã bị hủy'
      });
    }

    // Cập nhật trạng thái và thời gian kết thúc thực tế
    meeting.status = 'completed';
    meeting.actualEndTime = new Date();
    await meeting.save();

    // Populate để trả về thông tin đầy đủ
    await meeting.populate([
      { path: 'organizer', select: 'fullName email avatar' },
      { path: 'attendees.user', select: 'fullName email avatar' }
    ]);

    res.json({
      message: 'Đã đóng cuộc họp thành công',
      meeting
    });

  } catch (error) {
    console.error('Close meeting error:', error);
    res.status(500).json({
      message: 'Lỗi server khi đóng cuộc họp',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   POST /api/meetings/:id/files
// @desc    Upload file đính kèm cho cuộc họp
// @access  Private
router.post('/:id/files', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({
        message: 'Cuộc họp không tồn tại'
      });
    }

    // Kiểm tra quyền upload: attendees hoặc organizer
    const canUpload = 
      meeting.organizer.toString() === req.user._id.toString() ||
      meeting.attendees.some(att => att.user.toString() === req.user._id.toString()) ||
      req.user.role === 'admin';

    if (!canUpload) {
      return res.status(403).json({
        message: 'Bạn không có quyền upload file cho cuộc họp này'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Vui lòng chọn file để upload'
      });
    }

    // Thêm thông tin file vào meeting
    const attachment = {
      name: req.file.originalname,
      path: `/uploads/meetings/${req.file.filename}`,
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    meeting.attachments.push(attachment);
    await meeting.save();

    res.json({
      message: 'Upload file thành công',
      attachment: {
        ...attachment,
        uploadedBy: {
          _id: req.user._id,
          fullName: req.user.fullName
        }
      }
    });

  } catch (error) {
    console.error('Upload file error:', error);
    
    // Xóa file nếu có lỗi
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({
      message: 'Lỗi server khi upload file',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   POST /api/meetings/:id/summary-image
// @desc    Upload ảnh tóm tắt cuộc họp
// @access  Private (Secretary, Manager, Admin)
router.post('/:id/summary-image', authenticateToken, upload.single('summaryImage'), async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({
        message: 'Cuộc họp không tồn tại'
      });
    }

    // Kiểm tra quyền upload summary: secretary, manager, admin hoặc organizer
    const canUploadSummary = 
      req.user.role === 'admin' ||
      req.user.role === 'manager' ||
      req.user.role === 'secretary' ||
      meeting.organizer.toString() === req.user._id.toString();

    if (!canUploadSummary) {
      return res.status(403).json({
        message: 'Bạn không có quyền upload ảnh tóm tắt cuộc họp'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'Vui lòng chọn ảnh để upload'
      });
    }

    // Kiểm tra file phải là ảnh
    const imageTypes = /jpeg|jpg|png|gif/;
    const isImage = imageTypes.test(path.extname(req.file.originalname).toLowerCase());
    
    if (!isImage) {
      fs.unlinkSync(req.file.path); // Xóa file không hợp lệ
      return res.status(400).json({
        message: 'File phải là ảnh (JPEG, JPG, PNG, GIF)'
      });
    }

    // Xóa ảnh cũ nếu có
    if (meeting.summaryImage) {
      const oldImagePath = path.join(__dirname, '../', meeting.summaryImage);
      try {
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      } catch (error) {
        console.error('Error deleting old summary image:', error);
      }
    }

    // Cập nhật đường dẫn ảnh tóm tắt
    meeting.summaryImage = `/uploads/meetings/${req.file.filename}`;
    await meeting.save();

    res.json({
      message: 'Upload ảnh tóm tắt thành công',
      imageUrl: meeting.summaryImage
    });

  } catch (error) {
    console.error('Upload summary image error:', error);
    
    // Xóa file nếu có lỗi
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({
      message: 'Lỗi server khi upload ảnh tóm tắt',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   PUT /api/meetings/:id/summary
// @desc    Cập nhật tóm tắt cuộc họp
// @access  Private (Secretary, Manager, Admin)
router.put('/:id/summary', authenticateToken, [
  body('summary').optional().trim().isLength({ max: 5000 }).withMessage('Tóm tắt không được vượt quá 5000 ký tự')
], handleValidationErrors, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({
        message: 'Cuộc họp không tồn tại'
      });
    }

    // Kiểm tra quyền cập nhật summary
    const canUpdateSummary = 
      req.user.role === 'admin' ||
      req.user.role === 'manager' ||
      req.user.role === 'secretary' ||
      meeting.organizer.toString() === req.user._id.toString();

    if (!canUpdateSummary) {
      return res.status(403).json({
        message: 'Bạn không có quyền cập nhật tóm tắt cuộc họp'
      });
    }

    meeting.summary = req.body.summary;
    await meeting.save();

    res.json({
      message: 'Cập nhật tóm tắt cuộc họp thành công',
      summary: meeting.summary
    });

  } catch (error) {
    console.error('Update summary error:', error);
    res.status(500).json({
      message: 'Lỗi server khi cập nhật tóm tắt',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   POST /api/meetings/:id/notes
// @desc    Thêm ghi chú cho cuộc họp
// @access  Private
router.post('/:id/notes', authenticateToken, [
  body('text').trim().isLength({ min: 1, max: 1000 }).withMessage('Ghi chú phải từ 1-1000 ký tự')
], handleValidationErrors, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({
        message: 'Cuộc họp không tồn tại'
      });
    }

    // Kiểm tra quyền thêm ghi chú: attendees hoặc organizer
    const canAddNote = 
      meeting.organizer.toString() === req.user._id.toString() ||
      meeting.attendees.some(att => att.user.toString() === req.user._id.toString()) ||
      req.user.role === 'admin';

    if (!canAddNote) {
      return res.status(403).json({
        message: 'Bạn không có quyền thêm ghi chú cho cuộc họp này'
      });
    }

    // Thêm ghi chú vào meeting
    if (!meeting.notes) {
      meeting.notes = [];
    }

    const note = {
      text: req.body.text,
      author: req.user._id,
      createdAt: new Date()
    };

    meeting.notes.push(note);
    await meeting.save();

    // Populate author info
    await meeting.populate('notes.author', 'fullName email avatar');
    const addedNote = meeting.notes[meeting.notes.length - 1];

    res.json({
      message: 'Thêm ghi chú thành công',
      note: addedNote
    });

  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      message: 'Lỗi server khi thêm ghi chú',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   POST /api/meetings/:id/invite
// @desc    Mời thêm người tham gia cuộc họp
// @access  Private (Organizer, Admin, Manager)
router.post('/:id/invite', authenticateToken, [
  body('email').isEmail().withMessage('Email không hợp lệ')
], handleValidationErrors, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({
        message: 'Cuộc họp không tồn tại'
      });
    }

    // Kiểm tra quyền mời
    const canInvite = 
      meeting.organizer.toString() === req.user._id.toString() ||
      req.user.role === 'admin' ||
      req.user.role === 'manager';

    if (!canInvite) {
      return res.status(403).json({
        message: 'Bạn không có quyền mời người tham gia cuộc họp này'
      });
    }

    // Tìm user theo email
    const User = require('../models/User');
    const userToInvite = await User.findOne({ email: req.body.email });
    
    if (!userToInvite) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng với email này'
      });
    }

    // Kiểm tra user đã được mời chưa
    const alreadyInvited = meeting.attendees.some(
      att => att.user.toString() === userToInvite._id.toString()
    );

    if (alreadyInvited) {
      return res.status(400).json({
        message: 'Người dùng đã được mời tham gia cuộc họp này'
      });
    }

    // Thêm vào danh sách attendees
    meeting.attendees.push({
      user: userToInvite._id,
      status: 'invited'
    });

    await meeting.save();

    // Gửi thông báo
    try {
      const notification = await Notification.createMeetingInvite(
        meeting._id,
        [userToInvite._id],
        req.user._id
      );

      // Gửi real-time notification
      const io = req.app.get('io');
      if (io && notification.length > 0) {
        await notification[0].populate([
          { path: 'sender', select: 'fullName email avatar' },
          { path: 'data.meetingId', select: 'title startTime' }
        ]);
        
        notification[0].message = `${req.user.fullName} đã mời bạn tham gia cuộc họp "${meeting.title}"`;
        io.to(`user_${userToInvite._id}`).emit('newNotification', notification[0]);
      }
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }

    res.json({
      message: 'Mời người tham gia thành công',
      invitedUser: {
        _id: userToInvite._id,
        fullName: userToInvite.fullName,
        email: userToInvite.email
      }
    });

  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({
      message: 'Lỗi server khi mời người tham gia',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   GET /api/meetings/:id/files/:fileId/download
// @desc    Tải xuống file đính kèm
// @access  Private
router.get('/:id/files/:fileId/download', authenticateToken, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({
        message: 'Cuộc họp không tồn tại'
      });
    }

    // Kiểm tra quyền truy cập file
    const canAccess = 
      meeting.organizer.toString() === req.user._id.toString() ||
      meeting.attendees.some(att => att.user.toString() === req.user._id.toString()) ||
      req.user.role === 'admin';

    if (!canAccess) {
      return res.status(403).json({
        message: 'Bạn không có quyền truy cập file này'
      });
    }

    // Tìm file trong attachments
    const attachment = meeting.attachments.find(
      att => att._id.toString() === req.params.fileId
    );

    if (!attachment) {
      return res.status(404).json({
        message: 'File không tồn tại'
      });
    }

    // Đường dẫn file trên server
    const filePath = path.join(__dirname, '../', attachment.path);
    
    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: 'File không tìm thấy trên server'
      });
    }

    // Set headers để download
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream file về client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      message: 'Lỗi server khi tải file',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   GET /api/meetings/:id/files/:fileId/view
// @desc    Xem file đính kèm trong browser
// @access  Private
router.get('/:id/files/:fileId/view', authenticateToken, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({
        message: 'Cuộc họp không tồn tại'
      });
    }

    // Kiểm tra quyền truy cập file
    const canAccess = 
      meeting.organizer.toString() === req.user._id.toString() ||
      meeting.attendees.some(att => att.user.toString() === req.user._id.toString()) ||
      req.user.role === 'admin';

    if (!canAccess) {
      return res.status(403).json({
        message: 'Bạn không có quyền truy cập file này'
      });
    }

    // Tìm file trong attachments
    const attachment = meeting.attachments.find(
      att => att._id.toString() === req.params.fileId
    );

    if (!attachment) {
      return res.status(404).json({
        message: 'File không tồn tại'
      });
    }

    // Đường dẫn file trên server
    const filePath = path.join(__dirname, '../', attachment.path);
    
    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: 'File không tìm thấy trên server'
      });
    }

    // Xác định MIME type
    const ext = path.extname(attachment.name).toLowerCase();
    let mimeType = 'application/octet-stream';
    
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };

    if (mimeTypes[ext]) {
      mimeType = mimeTypes[ext];
    }

    // Set headers để xem inline
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.name}"`);
    
    // Stream file về client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('View file error:', error);
    res.status(500).json({
      message: 'Lỗi server khi xem file',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   POST /api/meetings/:id/summary-message
// @desc    Thêm summary message với attachments
// @access  Private (Secretary, Manager, Admin)
router.post('/:id/summary-message', authenticateToken, upload.array('attachments', 5), async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({
        message: 'Cuộc họp không tồn tại'
      });
    }

    // Kiểm tra quyền thêm summary message
    const canAddSummary = 
      req.user.role === 'admin' ||
      req.user.role === 'manager' ||
      req.user.role === 'secretary' ||
      meeting.organizer.toString() === req.user._id.toString();

    if (!canAddSummary) {
      return res.status(403).json({
        message: 'Bạn không có quyền thêm tóm tắt cuộc họp'
      });
    }

    const { text } = req.body;
    
    // Kiểm tra có ít nhất text hoặc files
    if (!text && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        message: 'Vui lòng nhập nội dung hoặc đính kèm file'
      });
    }

    // Xử lý attachments
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const extension = path.extname(file.originalname).toLowerCase();
        const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        
        attachments.push({
          name: file.originalname,
          path: `/uploads/meetings/${file.filename}`,
          size: file.size,
          type: imageTypes.includes(extension) ? 'image' : 'file'
        });
      }
    }

    // Tạo summary message
    const summaryMessage = {
      author: req.user._id,
      text: text || '',
      attachments: attachments,
      createdAt: new Date()
    };

    // Thêm vào array summaryMessages
    if (!meeting.summaryMessages) {
      meeting.summaryMessages = [];
    }
    
    meeting.summaryMessages.push(summaryMessage);
    await meeting.save();

    // Populate author info
    await meeting.populate('summaryMessages.author', 'fullName email avatar');
    const addedMessage = meeting.summaryMessages[meeting.summaryMessages.length - 1];

    res.json({
      message: 'Thêm tóm tắt cuộc họp thành công',
      summaryMessage: addedMessage
    });

  } catch (error) {
    console.error('Add summary message error:', error);
    
    // Xóa files nếu có lỗi
    if (req.files) {
      for (const file of req.files) {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
    }
    
    res.status(500).json({
      message: 'Lỗi server khi thêm tóm tắt cuộc họp',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

module.exports = router; 