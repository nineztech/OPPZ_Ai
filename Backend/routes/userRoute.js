import express from 'express';
const router = express.Router();
import { register, login,sendOTP, 
  verifyOTP, 
  resendOTP ,
forgotPassword,
  resetPassword,
  validateResetToken} from '../controller/userController.js';

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', login);
// router.get('/basic-info/:email', getBasicUserInfo);

//OTP
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/validate-reset-token/:token', validateResetToken);

export default router;
