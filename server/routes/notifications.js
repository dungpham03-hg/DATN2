const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Lấy danh sách thông báo
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'API Thông báo đang được phát triển',
      status: 'coming_soon'
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách thông báo'
    });
  }
});

// @route   POST /api/notifications/send
// @desc    Gửi thông báo
// @access  Private
router.post('/send', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'API Gửi thông báo đang được phát triển',
      status: 'coming_soon'
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      message: 'Lỗi server khi gửi thông báo'
    });
  }
});

module.exports = router; 