const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const catchAsync = require("../utils/catchAsync");
const { sign_and_send_token } = require('../middleware/jwt');



const register = catchAsync(async(req,res,next)=>{
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    return res.status(400).json({
      message: 'User with this email or username already exists'
    });
  }

  // Create user
  const user = new User({ username, email, password });
  await user.save();

  // Generate token
  return sign_and_send_token(user, res, 201, "Signup Successfully!");
})


const login = catchAsync(async(req,res,next)=>{
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Generate token
  return sign_and_send_token(user,res,200,"Login successful")
})
  
  const getMe = catchAsync(async(req,res,next)=>{
    res.json({ user: req.user });
  })
  
  module.exports = { register, login, getMe };