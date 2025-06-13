const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/agendas
// @desc    Lấy danh sách agenda
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'API Agenda đang được phát triển',
      status: 'coming_soon'
    });
  } catch (error) {
    console.error('Get agendas error:', error);
    res.status(500).json({
      message: 'Lỗi server khi lấy danh sách agenda'
    });
  }
});

// @route   POST /api/agendas
// @desc    Tạo agenda mới
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'API Tạo agenda đang được phát triển',
      status: 'coming_soon'
    });
  } catch (error) {
    console.error('Create agenda error:', error);
    res.status(500).json({
      message: 'Lỗi server khi tạo agenda'
    });
  }
});

module.exports = router; 