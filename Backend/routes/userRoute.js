// userRoute.js - Add development route
import express from 'express';
const router = express.Router();
import { register, login, sendOTP, sendOTPDev,
  verifyOTP, 
  resendOTP,
  forgotPassword,
  resetPassword,
  validateResetToken,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserStatus,
  getUserStats,
  searchUsers
} from '../controller/userController.js';
import { adminAuth, userAuth } from '../middleware/adminAuth.js';

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', login);

//OTP
router.post('/send-otp', sendOTP);

// Development route (remove in production)
if (process.env.NODE_ENV === 'development') {
  router.post('/send-otp-dev', sendOTPDev);
}

router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/validate-reset-token/:token', validateResetToken);

// Admin routes for user management
router.get('/all', adminAuth, getAllUsers);
router.get('/:id', adminAuth, getUserById);
router.delete('/:id', adminAuth, deleteUser);
router.put('/:id/status', adminAuth, updateUserStatus);
router.get('/stats', adminAuth, getUserStats);
router.get('/search', adminAuth, searchUsers);

export default router;
