const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

router.get('/', authenticateToken, async (req,res)=>{
  try{
    const depts = await User.distinct('department', { department: { $ne: '' } });
    res.json(depts);
  }catch(err){res.status(500).json({message:'Server error'});} 
});

module.exports = router; 