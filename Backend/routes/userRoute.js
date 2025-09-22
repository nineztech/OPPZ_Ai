import express from 'express';
const router = express.Router();
import { 
  register, 
  login,
  sendOTP, 
  verifyOTP, 
  resendOTP,
  forgotPassword,
  resetPassword,
  validateResetToken,
  // Add the missing admin functions from your controller
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserStatus,
  getUserStats,
  searchUsers
} from '../controller/userController.js';

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// OTP Routes
// @route   POST /api/users/send-otp
// @desc    Send OTP for email verification
// @access  Public
router.post('/send-otp', sendOTP);

// @route   POST /api/users/verify-otp
// @desc    Verify OTP and create user
// @access  Public
router.post('/verify-otp', verifyOTP);

// @route   POST /api/users/resend-otp
// @desc    Resend OTP
// @access  Public
router.post('/resend-otp', resendOTP);

// Password Reset Routes
// @route   POST /api/users/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', forgotPassword);

// @route   POST /api/users/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', resetPassword);

// @route   GET /api/users/validate-reset-token/:token
// @desc    Validate password reset token
// @access  Public
router.get('/validate-reset-token/:token', validateResetToken);

// Admin Routes (add authentication middleware as needed)
// @route   GET /api/users/stats
// @desc    Get user statistics (Admin only)
// @access  Private/Admin
router.get('/stats', getUserStats);

// @route   GET /api/users/search
// @desc    Search users (Admin only)
// @access  Private/Admin
router.get('/search', searchUsers);

// @route   GET /api/users/all
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/all', getAllUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private/Admin
router.get('/:id', getUserById);

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', deleteUser);

// @route   PUT /api/users/:id/status
// @desc    Update user status (Admin only)
// @access  Private/Admin
router.put('/:id/status', updateUserStatus);

export default router;
