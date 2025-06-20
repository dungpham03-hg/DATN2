const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MeetingRoom = require('../models/MeetingRoom');

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

module.exports = router; 