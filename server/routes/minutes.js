const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/minutes
// @desc    Lấy danh sách biên bản
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'API Biên bản đang được phát triển',
      status: 'coming_soon'
    });
  } catch (error) {
    console.error('Get minutes error:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách biên bản'
    });
  }
});

// @route   POST /api/minutes
// @desc    Tạo biên bản mới
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'API Tạo biên bản đang được phát triển',
      status: 'coming_soon'
    });
  } catch (error) {
    console.error('Create minutes error:', error);
    res.status(500).json({
      message: 'Lỗi server khi tạo biên bản'
    });
  }
});

module.exports = router; 