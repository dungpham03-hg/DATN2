const express = require('express');
const { body, validationResult } = require('express-validator');
const Meeting = require('../models/Meeting');
const { 
  authenticateToken, 
  checkResourceOwnership,
  checkDepartmentAccess 
} = require('../middleware/auth');

const router = express.Router();

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

    // Build query
    let query = {};

    // Filter theo department (đã được xử lý trong middleware)
    if (department) {
      query.department = department;
    }

    // Filter theo status
    if (status) {
      query.status = status;
    }

    // Filter theo priority
    if (priority) {
      query.priority = priority;
    }

    // Filter theo khoảng thời gian
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    // Tìm kiếm theo title hoặc description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Thêm filter cho user hiện tại (trừ admin)
    if (req.user.role !== 'admin') {
      query.$or = [
        { organizer: req.user._id },
        { 'attendees.user': req.user._id },
        { isPrivate: false }
      ];
    }

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
      .populate('minutes');

    if (!meeting) {
      return res.status(404).json({
        message: 'Cuộc họp không tồn tại'
      });
    }

    // Kiểm tra quyền truy cập
    const canAccess = 
      req.user.role === 'admin' ||
      meeting.organizer._id.toString() === req.user._id.toString() ||
      meeting.attendees.some(att => att.user._id.toString() === req.user._id.toString()) ||
      (!meeting.isPrivate && meeting.department === req.user.department);

    if (!canAccess) {
      return res.status(403).json({
        message: 'Không có quyền truy cập cuộc họp này'
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

module.exports = router; 