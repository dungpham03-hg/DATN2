const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Archive = require('../models/Archive');
const Meeting = require('../models/Meeting');
const Minutes = require('../models/Minutes');
const Notification = require('../models/Notification');
const { 
  authenticateToken, 
  checkResourceOwnership,
  checkDepartmentAccess 
} = require('../middleware/auth');

const router = express.Router();

// Multer configuration for archive file uploads
const archiveStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/archives');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'archive-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const archiveUpload = multer({
  storage: archiveStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit cho archive files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Định dạng file không được hỗ trợ trong lưu trữ'));
    }
  }
});

// Validation rules cho archive
const archiveValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 300 })
    .withMessage('Tiêu đề lưu trữ phải từ 3-300 ký tự'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Mô tả không được vượt quá 2000 ký tự'),
  
  body('archiveType')
    .optional()
    .isIn(['complete', 'documents_only', 'minutes_only', 'summary_only', 'custom'])
    .withMessage('Loại lưu trữ không hợp lệ'),
  
  body('meetingId')
    .isMongoId()
    .withMessage('ID cuộc họp không hợp lệ'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags phải là mảng'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Mỗi tag không được vượt quá 50 ký tự')
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

// @route   GET /api/archives
// @desc    Lấy danh sách lưu trữ
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      archiveType,
      status,
      search,
      department,
      tags,
      startDate,
      endDate,
      sortBy = 'archivedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query conditions
    const andConditions = [];

    if (archiveType) andConditions.push({ archiveType });
    if (status) andConditions.push({ status });
    if (department) andConditions.push({ 'meetingSnapshot.department': department });
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      andConditions.push({ tags: { $in: tagArray } });
    }

    if (startDate || endDate) {
      const timeCond = {};
      if (startDate) timeCond.$gte = new Date(startDate);
      if (endDate) timeCond.$lte = new Date(endDate);
      andConditions.push({ archivedAt: timeCond });
    }

    if (search) {
      andConditions.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'meetingSnapshot.title': { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Quyền truy cập theo role
    let accessConditions = [];

    if (req.user.role === 'admin') {
      // Admin thấy tất cả
      accessConditions = [{}];
    } else if (req.user.role === 'manager' || req.user.role === 'secretary') {
      accessConditions = [
        { createdBy: req.user._id },
        { 'access.isPublic': true },
        { 'access.allowedUsers': req.user._id },
        { 'access.allowedDepartments': req.user.department },
        { 'meetingSnapshot.organizer._id': req.user._id },
        { 'meetingSnapshot.secretary._id': req.user._id },
        { 'meetingSnapshot.attendees.user._id': req.user._id }
      ];
    } else {
      accessConditions = [
        { createdBy: req.user._id },
        { 'access.isPublic': true },
        { 'access.allowedUsers': req.user._id },
        { 'meetingSnapshot.organizer._id': req.user._id },
        { 'meetingSnapshot.attendees.user._id': req.user._id }
      ];
    }

    andConditions.push({ $or: accessConditions });
    
    // Loại bỏ restricted users
    andConditions.push({ 'access.restrictedUsers': { $ne: req.user._id } });

    const query = { $and: andConditions };

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOptions,
      populate: [
        { path: 'createdBy', select: 'fullName email avatar department' },
        { path: 'meeting', select: 'title startTime status' }
      ]
    };

    const result = await Archive.paginate(query, options);

    res.json({
      message: 'Lấy danh sách lưu trữ thành công',
      archives: result.docs,
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
    console.error('Get archives error:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách lưu trữ',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   GET /api/archives/:id
// @desc    Lấy chi tiết lưu trữ
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const archive = await Archive.findById(req.params.id)
      .populate('createdBy', 'fullName email avatar department position')
      .populate('meeting', 'title startTime endTime status location')
      .populate('notes.author', 'fullName email avatar');

    if (!archive) {
      return res.status(404).json({
        message: 'Lưu trữ không tồn tại'
      });
    }

    // Kiểm tra quyền truy cập
    const canAccess = archive.canAccess(req.user._id, req.user.role, req.user.department);
    
    if (!canAccess) {
      return res.status(403).json({
        message: 'Bạn không có quyền truy cập lưu trữ này'
      });
    }

    // Tăng view count
    await archive.incrementViewCount();

    res.json({
      message: 'Lấy thông tin lưu trữ thành công',
      archive
    });

  } catch (error) {
    console.error('Get archive error:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy thông tin lưu trữ',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   POST /api/archives
// @desc    Tạo lưu trữ mới từ cuộc họp
// @access  Private
router.post('/', authenticateToken, archiveValidation, handleValidationErrors, async (req, res) => {
  try {
    const {
      meetingId,
      title,
      description,
      archiveType,
      tags,
      summaryText,
      keyPoints,
      actionItems,
      nextSteps,
      isPublic,
      allowedDepartments,
      allowedUsers,
      deleteAfterYears
    } = req.body;

    // Lấy thông tin cuộc họp
    const meeting = await Meeting.findById(meetingId)
      .populate('organizer', 'fullName email department position')
      .populate('secretary', 'fullName email department position')
      .populate('attendees.user', 'fullName email department position')
      .populate('minutes');

    if (!meeting) {
      return res.status(404).json({
        message: 'Cuộc họp không tồn tại'
      });
    }

    // Kiểm tra quyền tạo lưu trữ
    const canCreateArchive = 
      req.user.role === 'admin' ||
      meeting.organizer._id.toString() === req.user._id.toString() ||
      (meeting.secretary && meeting.secretary._id.toString() === req.user._id.toString()) ||
      req.user.role === 'manager';

    if (!canCreateArchive) {
      return res.status(403).json({
        message: 'Bạn không có quyền tạo lưu trữ cho cuộc họp này'
      });
    }

    // Tạo meeting snapshot
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

    // Tạo archive data
    const archiveData = {
      meeting: meetingId,
      title: title || `Lưu trữ - ${meeting.title}`,
      description,
      archiveType: archiveType || 'complete',
      meetingSnapshot,
      createdBy: req.user._id,
      tags: tags || [],
      access: {
        isPublic: isPublic || false,
        allowedDepartments: allowedDepartments || [],
        allowedUsers: allowedUsers || []
      },
      retentionPolicy: {
        deleteAfterYears: deleteAfterYears || 7
      }
    };

    // Thêm tài liệu nếu là complete hoặc documents_only
    if (archiveType === 'complete' || archiveType === 'documents_only') {
      const documents = [];
      
      // Copy meeting attachments
      if (meeting.attachments && meeting.attachments.length > 0) {
        for (const attachment of meeting.attachments) {
          documents.push({
            name: attachment.name,
            originalPath: attachment.path,
            archivePath: attachment.path, // Có thể copy file đến thư mục archive riêng
            size: attachment.size,
            type: 'meeting_attachment',
            uploadedBy: attachment.uploadedBy,
            uploadedAt: attachment.uploadedAt
          });
        }
      }

      // Copy summary files
      if (meeting.summaryFiles && meeting.summaryFiles.length > 0) {
        for (const file of meeting.summaryFiles) {
          documents.push({
            name: file.name,
            originalPath: file.path,
            archivePath: file.path,
            size: file.size,
            type: 'summary_file',
            uploadedBy: file.uploadedBy,
            uploadedAt: file.uploadedAt
          });
        }
      }

      archiveData.documents = documents;
    }

    // Thêm minutes snapshots nếu có
    if ((archiveType === 'complete' || archiveType === 'minutes_only')) {
      // Lấy tất cả biên bản của cuộc họp
      const allMinutes = await Minutes.find({ meeting: meetingId })
        .populate('secretary', 'fullName email')
        .populate('approvedBy', 'fullName email')
        .populate('decisions.responsible', 'fullName email')
        .populate('votes.user', 'fullName email')
        .sort({ createdAt: 1 }); // Sắp xếp theo thời gian tạo

      archiveData.minutesSnapshots = allMinutes.map(minutes => ({
        _id: minutes._id,
        title: minutes.title,
        content: minutes.content,
        status: minutes.status,
        decisions: minutes.decisions || [],
        votes: minutes.votes || [],
        voteDeadline: minutes.voteDeadline,
        isVotingClosed: minutes.isVotingClosed || false,
        isApproved: Boolean(minutes.approvedBy && minutes.approvedAt), // Kiểm tra có người phê duyệt và thời gian phê duyệt
        approvedBy: minutes.approvedBy,
        approvedAt: minutes.approvedAt,
        secretary: minutes.secretary,
        createdAt: minutes.createdAt
      }));

      // Sắp xếp: biên bản đã phê duyệt lên trước, mới nhất lên đầu
      archiveData.minutesSnapshots.sort((a, b) => {
        if (a.isApproved !== b.isApproved) return b.isApproved - a.isApproved;
        return new Date(b.approvedAt || b.createdAt) - new Date(a.approvedAt || a.createdAt);
      });

      // Copy minutes attachments vào documents nếu có
      for (const minutes of allMinutes) {
        if (minutes.attachments && minutes.attachments.length > 0) {
          for (const attachment of minutes.attachments) {
            archiveData.documents.push({
              name: attachment.name,
              originalPath: attachment.path,
              archivePath: attachment.path,
              size: attachment.size,
              type: 'minutes_attachment',
              uploadedBy: attachment.uploadedBy,
              uploadedAt: attachment.uploadedAt
            });
          }
        }
      }
    }

    // Thêm summary nếu có
    if (archiveType === 'complete' || archiveType === 'summary_only') {
      archiveData.summary = {
        text: summaryText || meeting.summary,
        keyPoints: keyPoints || [],
        actionItems: actionItems || [],
        nextSteps: nextSteps || ''
      };
    }

    // Lấy notifications liên quan
    const notifications = await Notification.find({
      'data.meetingId': meetingId
    }).populate('sender', 'fullName email').limit(50);

    archiveData.notifications = notifications.map(notif => ({
      _id: notif._id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      createdAt: notif.createdAt,
      sender: notif.sender
    }));

    const archive = new Archive(archiveData);
    await archive.save();

    await archive.populate([
      { path: 'createdBy', select: 'fullName email avatar department' },
      { path: 'meeting', select: 'title startTime status' }
    ]);

    res.status(201).json({
      message: 'Tạo lưu trữ thành công',
      archive
    });

  } catch (error) {
    console.error('Create archive error:', error);
    res.status(500).json({
      message: 'Lỗi server khi tạo lưu trữ',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   PUT /api/archives/:id
// @desc    Cập nhật lưu trữ
// @access  Private
router.put('/:id', authenticateToken, archiveValidation, handleValidationErrors, async (req, res) => {
  try {
    const archive = await Archive.findById(req.params.id);
    
    if (!archive) {
      return res.status(404).json({
        message: 'Lưu trữ không tồn tại'
      });
    }

    // Kiểm tra quyền chỉnh sửa
    const canEdit = 
      req.user.role === 'admin' ||
      archive.createdBy.toString() === req.user._id.toString();

    if (!canEdit) {
      return res.status(403).json({
        message: 'Bạn không có quyền chỉnh sửa lưu trữ này'
      });
    }

    const {
      title,
      description,
      tags,
      summaryText,
      keyPoints,
      actionItems,
      nextSteps,
      isPublic,
      allowedDepartments,
      allowedUsers,
      restrictedUsers
    } = req.body;

    // Cập nhật dữ liệu
    const updateData = {
      title,
      description,
      tags,
      'access.isPublic': isPublic,
      'access.allowedDepartments': allowedDepartments,
      'access.allowedUsers': allowedUsers,
      'access.restrictedUsers': restrictedUsers
    };

    // Cập nhật summary nếu có
    if (summaryText || keyPoints || actionItems || nextSteps) {
      updateData.summary = {
        text: summaryText || archive.summary?.text,
        keyPoints: keyPoints || archive.summary?.keyPoints || [],
        actionItems: actionItems || archive.summary?.actionItems || [],
        nextSteps: nextSteps || archive.summary?.nextSteps
      };
    }

    const updatedArchive = await Archive.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'createdBy', select: 'fullName email avatar department' },
      { path: 'meeting', select: 'title startTime status' }
    ]);

    res.json({
      message: 'Cập nhật lưu trữ thành công',
      archive: updatedArchive
    });

  } catch (error) {
    console.error('Update archive error:', error);
    res.status(500).json({
      message: 'Lỗi server khi cập nhật lưu trữ',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   POST /api/archives/:id/notes
// @desc    Thêm ghi chú vào lưu trữ
// @access  Private
router.post('/:id/notes', authenticateToken, async (req, res) => {
  try {
    const { text, isImportant } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        message: 'Nội dung ghi chú không được để trống'
      });
    }

    const archive = await Archive.findById(req.params.id);
    
    if (!archive) {
      return res.status(404).json({
        message: 'Lưu trữ không tồn tại'
      });
    }

    // Kiểm tra quyền truy cập
    const canAccess = archive.canAccess(req.user._id, req.user.role, req.user.department);
    
    if (!canAccess) {
      return res.status(403).json({
        message: 'Bạn không có quyền thêm ghi chú vào lưu trữ này'
      });
    }

    const note = {
      text: text.trim(),
      author: req.user._id,
      isImportant: isImportant || false
    };

    archive.notes.push(note);
    await archive.save();

    await archive.populate('notes.author', 'fullName email avatar');

    res.status(201).json({
      message: 'Thêm ghi chú thành công',
      note: archive.notes[archive.notes.length - 1]
    });

  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      message: 'Lỗi server khi thêm ghi chú',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   POST /api/archives/:id/upload
// @desc    Upload thêm tài liệu vào lưu trữ
// @access  Private
router.post('/:id/upload', authenticateToken, archiveUpload.array('files', 10), async (req, res) => {
  try {
    const archive = await Archive.findById(req.params.id);
    
    if (!archive) {
      return res.status(404).json({
        message: 'Lưu trữ không tồn tại'
      });
    }

    // Kiểm tra quyền upload
    const canUpload = 
      req.user.role === 'admin' ||
      archive.createdBy.toString() === req.user._id.toString() ||
      archive.access.allowedUsers.includes(req.user._id);

    if (!canUpload) {
      return res.status(403).json({
        message: 'Bạn không có quyền upload tài liệu vào lưu trữ này'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'Không có file nào được upload'
      });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      const document = {
        name: file.originalname,
        originalPath: file.path,
        archivePath: file.path,
        size: file.size,
        type: 'additional',
        uploadedBy: req.user._id,
        uploadedAt: new Date()
      };

      archive.documents.push(document);
      uploadedFiles.push(document);
    }

    await archive.save();

    res.status(201).json({
      message: 'Upload tài liệu thành công',
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Upload archive files error:', error);
    res.status(500).json({
      message: 'Lỗi server khi upload tài liệu',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   DELETE /api/archives/:id
// @desc    Xóa lưu trữ (soft delete)
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const archive = await Archive.findById(req.params.id);
    
    if (!archive) {
      return res.status(404).json({
        message: 'Lưu trữ không tồn tại'
      });
    }

    // Kiểm tra quyền xóa
    const canDelete = 
      req.user.role === 'admin' ||
      archive.createdBy.toString() === req.user._id.toString();

    if (!canDelete) {
      return res.status(403).json({
        message: 'Bạn không có quyền xóa lưu trữ này'
      });
    }

    // Soft delete
    archive.status = 'deleted';
    await archive.save();

    res.json({
      message: 'Xóa lưu trữ thành công'
    });

  } catch (error) {
    console.error('Delete archive error:', error);
    res.status(500).json({
      message: 'Lỗi server khi xóa lưu trữ',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   GET /api/archives/statistics/overview
// @desc    Lấy thống kê tổng quan về lưu trữ
// @access  Private
router.get('/statistics/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    // Build access query based on role
    let accessQuery = { status: 'active' };
    
    if (userRole !== 'admin') {
      const accessConditions = [
        { createdBy: userId },
        { 'access.isPublic': true },
        { 'access.allowedUsers': userId },
        { 'meetingSnapshot.organizer._id': userId },
        { 'meetingSnapshot.attendees.user._id': userId }
      ];

      if (userRole === 'manager' || userRole === 'secretary') {
        accessConditions.push(
          { 'access.allowedDepartments': userDepartment },
          { 'meetingSnapshot.secretary._id': userId }
        );
      }

      accessQuery.$or = accessConditions;
      accessQuery['access.restrictedUsers'] = { $ne: userId };
    }

    const [
      totalArchives,
      archivesByType,
      archivesByDepartment,
      recentArchives,
      totalSize
    ] = await Promise.all([
      Archive.countDocuments(accessQuery),
      Archive.aggregate([
        { $match: accessQuery },
        { $group: { _id: '$archiveType', count: { $sum: 1 } } }
      ]),
      Archive.aggregate([
        { $match: accessQuery },
        { $group: { _id: '$meetingSnapshot.department', count: { $sum: 1 } } }
      ]),
      Archive.find(accessQuery)
        .sort({ archivedAt: -1 })
        .limit(5)
        .populate('createdBy', 'fullName')
        .select('title archivedAt createdBy meetingSnapshot.title'),
      Archive.aggregate([
        { $match: accessQuery },
        { $group: { _id: null, totalSize: { $sum: '$statistics.totalSize' } } }
      ])
    ]);

    res.json({
      message: 'Lấy thống kê thành công',
      statistics: {
        totalArchives,
        archivesByType,
        archivesByDepartment,
        recentArchives,
        totalSizeMB: totalSize[0] ? Math.round((totalSize[0].totalSize / (1024 * 1024)) * 100) / 100 : 0
      }
    });

  } catch (error) {
    console.error('Get archive statistics error:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy thống kê',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   PUT /api/archives/:id/update-minutes
// @desc    Cập nhật lại tất cả biên bản cho archive
// @access  Private
router.put('/:id/update-minutes', authenticateToken, async (req, res) => {
  try {
    const archive = await Archive.findById(req.params.id);
    
    if (!archive) {
      return res.status(404).json({
        message: 'Lưu trữ không tồn tại'
      });
    }

    // Kiểm tra quyền chỉnh sửa
    const canEdit = 
      req.user.role === 'admin' ||
      archive.createdBy.toString() === req.user._id.toString();

    if (!canEdit) {
      return res.status(403).json({
        message: 'Bạn không có quyền cập nhật lưu trữ này'
      });
    }

    // Lấy tất cả biên bản của cuộc họp
    const allMinutes = await Minutes.find({ meeting: archive.meeting })
      .populate('secretary', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .populate('decisions.responsible', 'fullName email')
      .populate('votes.user', 'fullName email')
      .sort({ createdAt: 1 }); // Sắp xếp theo thời gian tạo

    // Cập nhật minutesSnapshots
    archive.minutesSnapshots = allMinutes.map(minutes => ({
      _id: minutes._id,
      title: minutes.title,
      content: minutes.content,
      status: minutes.status,
      decisions: minutes.decisions || [],
      votes: minutes.votes || [],
      voteDeadline: minutes.voteDeadline,
      isVotingClosed: minutes.isVotingClosed || false,
      isApproved: Boolean(minutes.approvedBy && minutes.approvedAt), // Kiểm tra có người phê duyệt và thời gian phê duyệt
      approvedBy: minutes.approvedBy,
      approvedAt: minutes.approvedAt,
      secretary: minutes.secretary,
      createdAt: minutes.createdAt
    }));

    // Sắp xếp: biên bản đã phê duyệt lên trước, mới nhất lên đầu
    archive.minutesSnapshots.sort((a, b) => {
      if (a.isApproved !== b.isApproved) return b.isApproved - a.isApproved;
      return new Date(b.approvedAt || b.createdAt) - new Date(a.approvedAt || a.createdAt);
    });

    // Cập nhật documents nếu có attachments mới từ các biên bản
    const existingDocPaths = archive.documents.map(doc => doc.originalPath);
    
    for (const minutes of allMinutes) {
      if (minutes.attachments && minutes.attachments.length > 0) {
        for (const attachment of minutes.attachments) {
          // Chỉ thêm attachment chưa tồn tại
          if (!existingDocPaths.includes(attachment.path)) {
            archive.documents.push({
              name: attachment.name,
              originalPath: attachment.path,
              archivePath: attachment.path,
              size: attachment.size,
              type: 'minutes_attachment',
              uploadedBy: attachment.uploadedBy,
              uploadedAt: attachment.uploadedAt
            });
          }
        }
      }
    }

    await archive.save();

    res.json({
      message: 'Cập nhật biên bản thành công',
      archive
    });

  } catch (error) {
    console.error('Update minutes error:', error);
    res.status(500).json({
      message: 'Lỗi server khi cập nhật biên bản',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

module.exports = router;
