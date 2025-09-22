import User from '../model/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// In-memory OTP storage
const otpStorage = new Map();

// In-memory password reset token storage
const resetTokenStorage = new Map();

// Clean expired OTPs from memory
const cleanExpiredOTPs = () => {
  const now = new Date();
  for (const [email, data] of otpStorage.entries()) {
    if (now > data.expiresAt) {
      otpStorage.delete(email);
    }
  }
};

// Clean expired reset tokens from memory
const cleanExpiredResetTokens = () => {
  const now = new Date();
  for (const [token, data] of resetTokenStorage.entries()) {
    if (now > data.expiresAt) {
      resetTokenStorage.delete(token);
    }
  }
};

// Email transporter configuration with better error handling
const createTransporter = () => {
  try {
    console.log('Creating email transporter...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set (length: ' + process.env.EMAIL_PASS.length + ')' : 'Not set');
    console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'godaddy');
    
    // Check if environment variables are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('EMAIL_USER and EMAIL_PASS environment variables are required');
    }
    
    let transporterConfig;
    
    // Gmail configuration (recommended for production)
    if (process.env.EMAIL_SERVICE === 'gmail') {
      transporterConfig = {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS, // Use app-specific password
        },
        tls: {
          rejectUnauthorized: false
        }
      };
    }
    // SendGrid configuration
    else if (process.env.EMAIL_SERVICE === 'sendgrid') {
      transporterConfig = {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      };
    }
    // Outlook/Hotmail configuration
    else if (process.env.EMAIL_SERVICE === 'outlook') {
      transporterConfig = {
        service: 'hotmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      };
    }
    // Improved GoDaddy configuration
    else {
      transporterConfig = {
        host: 'smtpout.secureserver.net',
        port: 587, // Use 587 instead of 465 for better compatibility
        secure: false, // false for 587, true for 465
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000,   // 30 seconds  
        socketTimeout: 60000,     // 60 seconds
        logger: process.env.NODE_ENV === 'development',
        debug: process.env.NODE_ENV === 'development'
      };
    }
    
    const transporter = nodemailer.createTransporter(transporterConfig);
    
    console.log('Transporter created successfully with service:', process.env.EMAIL_SERVICE || 'godaddy');
    return transporter;
    
  } catch (error) {
    console.error('Error creating transporter:', error);
    throw error;
  }
};


// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  );
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate Reset Token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send OTP Email with better error handling
const sendOTPEmail = async (email, otp, firstname) => {
  try {
    console.log(`🚀 Attempting to send OTP email to: ${email}`);
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `OPPZ AI <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'OPPZ AI - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to OPPZ AI!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${firstname},</h2>

             
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
              Thank you for signing up! To complete your registration and verify your email address, please use the verification OTP below:
            </p>
            
            <div style="background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 25px 0; border-radius: 8px;">
              <h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px; font-weight: bold;">${otp}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
              This OTP will expire in <strong>60 Seconds</strong> for security reasons.
            </p>
            
            <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #1976d2; margin: 0; font-size: 14px;">
                <strong>Security Notice:</strong> If you didn't request this verification OTP, please ignore this email or contact our support team.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              <strong>The OPPZ AI Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© 2025 OPPZ AI. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully! Message ID:', result.messageId);
    return result;
    
  } catch (error) {
    console.error('❌ Detailed email sending error:', error);
    throw error;
  }
};

// Send Password Reset Email
const sendPasswordResetEmail = async (email, resetToken, firstname) => {
  try {
    console.log(`🔐 Attempting to send password reset email to: ${email}`);
    
    const transporter = createTransporter();
    
    // Create reset URL - adjust this based on your frontend URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `OPPZ AI <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'OPPZ AI - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">OPPZ AI - Password Reset</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${firstname || 'User'},</h2>

            <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
              We received a request to reset your password for your OPPZ AI account. If you made this request, please click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; text-decoration: none; padding: 15px 30px; 
                        border-radius: 8px; font-weight: bold; font-size: 16px;">
                Reset My Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
              This reset link will expire in <strong>1 hour</strong> for security reasons.
            </p>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
              </p>
            </div>
            
            <p style="color: #666; font-size: 12px; line-height: 1.4; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="word-break: break-all; color: #667eea;">${resetUrl}</span>
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              <strong>The OPPZ AI Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© 2025 OPPZ AI. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully! Message ID:', result.messageId);
    return result;
    
  } catch (error) {
    console.error('❌ Password reset email error:', error);
    throw error;
  }
};

// @desc    Request Password Reset
// @route   POST /api/users/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    console.log('📧 Forgot password endpoint called:', {
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    const { email } = req.body;

    // Validate email field
    if (!email) {
      console.log('❌ Validation failed: Email is required');
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log('👤 Looking up user with email:', email);

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    console.log('👤 User lookup result:', {
      userFound: !!user,
      userId: user?.id,
      userEmail: user?.email
    });

    if (!user) {
      console.log('❌ User not found with email:', email);
      // For security, don't reveal if email exists or not
      return res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Clean up expired reset tokens
    cleanExpiredResetTokens();
    console.log('🧹 Cleaned expired tokens. Current count:', resetTokenStorage.size);

    // Generate reset token
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    console.log('🔑 Generated reset token:', {
      tokenLength: resetToken.length,
      tokenPrefix: resetToken.substring(0, 10) + '...',
      expiresAt: expiresAt.toISOString(),
      userId: user.id
    });

    // Store reset token in memory
    resetTokenStorage.set(resetToken, {
      email: user.email,
      userId: user.id,
      expiresAt,
      attempts: 0
    });
    console.log('💾 Reset token stored in memory. Total tokens:', resetTokenStorage.size);

    // Send password reset email
    console.log('📧 Attempting to send password reset email...');
    await sendPasswordResetEmail(email, resetToken, user.firstname);
    console.log('✅ Password reset email sent successfully');

    res.status(200).json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      debug: process.env.NODE_ENV === 'development' ? {
        tokenGenerated: true,
        emailSent: true,
        tokenPrefix: resetToken.substring(0, 10) + '...',
        expiresAt: expiresAt.toISOString()
      } : undefined
    });

  } catch (error) {
    console.error('💥 Forgot password error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      message: 'Failed to process password reset request. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Reset Password
// @route   POST /api/users/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    console.log('🔄 Password reset request received:', {
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const { token, newPassword } = req.body;

    // Validation
    if (!token || !newPassword) {
      console.log('❌ Validation failed: Missing token or password');
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      console.log('❌ Password too short:', newPassword.length);
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Clean expired reset tokens
    cleanExpiredResetTokens();
    console.log('🧹 Cleaned expired tokens. Current token count:', resetTokenStorage.size);

    // Get reset token record from memory
    const tokenRecord = resetTokenStorage.get(token);
    console.log('🔍 Token lookup result:', {
      tokenExists: !!tokenRecord,
      tokenData: tokenRecord ? {
        email: tokenRecord.email,
        userId: tokenRecord.userId,
        expiresAt: tokenRecord.expiresAt,
        attempts: tokenRecord.attempts,
        isExpired: new Date() > tokenRecord.expiresAt
      } : null
    });
    
    if (!tokenRecord) {
      console.log('❌ Token not found in storage');
      return res.status(400).json({ 
        message: 'Invalid or expired reset token. Please request a new password reset.' 
      });
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      console.log('⏰ Token expired at:', tokenRecord.expiresAt);
      resetTokenStorage.delete(token);
      return res.status(400).json({ 
        message: 'Reset token has expired. Please request a new password reset.' 
      });
    }

    // Check attempt limits (prevent brute force)
    if (tokenRecord.attempts >= 5) {
      console.log('🚫 Too many attempts:', tokenRecord.attempts);
      resetTokenStorage.delete(token);
      return res.status(400).json({ 
        message: 'Too many failed attempts. Please request a new password reset.' 
      });
    }

    try {
      console.log('👤 Looking up user with ID:', tokenRecord.userId);
      
      // Find user
      const user = await User.findByPk(tokenRecord.userId);
      console.log('👤 User lookup result:', {
        userFound: !!user,
        userId: user?.id,
        userEmail: user?.email,
        currentPasswordHash: user?.password ? 'Present (length: ' + user.password.length + ')' : 'Missing'
      });

      if (!user) {
        console.log('❌ User not found in database');
        resetTokenStorage.delete(token);
        return res.status(400).json({ message: 'User not found' });
      }

      console.log('🔐 Starting password hashing...');
      
      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      console.log('🔐 Password hashed successfully:', {
        originalLength: newPassword.length,
        hashedLength: hashedPassword.length,
        hashPrefix: hashedPassword.substring(0, 10) + '...'
      });

      console.log('💾 Attempting to update user password in database...');
      
      // FIXED: Update password using raw SQL or bypassing hooks
      // Option 1: Using update with hooks disabled
      const [affectedRows] = await User.update(
        { 
          password: hashedPassword,
          updatedAt: new Date()
        },
        { 
          where: { id: tokenRecord.userId },
          hooks: false, // This prevents beforeUpdate hooks from running
          individualHooks: false
        }
      );

      console.log('💾 Database update result:', {
        affectedRows,
        success: affectedRows > 0
      });

      if (affectedRows === 0) {
        throw new Error('No rows were updated');
      }

      // Verify the update by fetching the user again
      const verifyUser = await User.findByPk(tokenRecord.userId);
      console.log('🔍 Verification check:', {
        passwordChanged: verifyUser.password !== user.password,
        newHashPrefix: verifyUser.password.substring(0, 10) + '...',
        updatedAt: verifyUser.updatedAt,
        passwordLength: verifyUser.password.length
      });

      // Test the new password immediately
      const passwordTest = await bcrypt.compare(newPassword, verifyUser.password);
      console.log('🧪 Password verification test:', passwordTest);

      if (!passwordTest) {
        throw new Error('Password verification failed after update');
      }

      // Clean up reset token from memory
      resetTokenStorage.delete(token);
      console.log('🧹 Reset token cleaned up from memory');

      console.log('✅ Password reset successful for user:', user.email);

      res.status(200).json({
        message: 'Password reset successful. You can now log in with your new password.',
        debug: process.env.NODE_ENV === 'development' ? {
          userId: user.id,
          email: user.email,
          passwordUpdated: true,
          passwordVerified: passwordTest,
          timestamp: new Date().toISOString()
        } : undefined
      });

    } catch (dbError) {
      // Increment attempts on database errors
      tokenRecord.attempts += 1;
      console.error('💥 Database error during password reset:', {
        error: dbError.message,
        stack: dbError.stack,
        name: dbError.name,
        code: dbError.code,
        attempts: tokenRecord.attempts
      });
      
      res.status(500).json({ 
        message: 'Failed to reset password. Please try again.',
        error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }

  } catch (error) {
    console.error('💥 Reset password error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Server error during password reset',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Validate Reset Token
// @route   GET /api/users/validate-reset-token/:token
// @access  Public
export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Clean expired reset tokens
    cleanExpiredResetTokens();

    // Get reset token record from memory
    const tokenRecord = resetTokenStorage.get(token);
    
    if (!tokenRecord) {
      return res.status(400).json({ 
        valid: false,
        message: 'Invalid or expired reset token' 
      });
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      resetTokenStorage.delete(token);
      return res.status(400).json({ 
        valid: false,
        message: 'Reset token has expired' 
      });
    }

    res.status(200).json({
      valid: true,
      message: 'Token is valid'
    });

  } catch (error) {
    console.error('Validate reset token error:', error);
    res.status(500).json({ 
      valid: false,
      message: 'Server error during token validation' 
    });
  }
};

// @desc    Send OTP for email verification
// @route   POST /api/users/send-otp
// @access  Public
export const sendOTP = async (req, res) => {
  try {
    console.log('SendOTP endpoint called with body:', req.body);
    
    const { firstname, lastname, email, Phone, password } = req.body;

    // Validate required fields
    if (!firstname || !lastname || !email || !Phone || !password) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Clean up expired OTPs
    cleanExpiredOTPs();

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute
    console.log('Generated OTP:', otp);

    // Store OTP and user data in memory
    otpStorage.set(email, {
      otp,
      expiresAt,
      userData: { firstname, lastname, email, Phone, password },
      attempts: 0
    });
    console.log('OTP stored in memory for email:', email);

    // Try to send OTP email
    try {
      console.log('Attempting to send OTP email...');
      await sendOTPEmail(email, otp, firstname);
      console.log('OTP email sent successfully');

      res.status(200).json({
        message: 'OTP sent successfully to your email',
        email: email
      });

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Clean up stored OTP if email fails
      otpStorage.delete(email);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to send OTP email. Please try again.';
      
      if (emailError.code === 'EAUTH') {
        errorMessage = 'Email authentication failed. Please contact support.';
      } else if (emailError.code === 'ECONNECTION' || emailError.code === 'ECONNREFUSED') {
        errorMessage = 'Could not connect to email server. Please try again later.';
      } else if (emailError.code === 'EMESSAGE') {
        errorMessage = 'Invalid email format. Please contact support.';
      } else if (emailError.message.includes('Invalid login')) {
        errorMessage = 'Email service configuration error. Please contact support.';
      }
      
      return res.status(500).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }

  } catch (error) {
    console.error('Send OTP error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    res.status(500).json({ 
      message: 'Server error during OTP generation. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify OTP and create user
// @route   POST /api/users/verify-otp
// @access  Public
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Clean expired OTPs
    cleanExpiredOTPs();

    // Get OTP record from memory
    const otpRecord = otpStorage.get(email);
    
    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP not found or expired. Please request a new one.' });
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      otpStorage.delete(email);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Check attempt limits
    if (otpRecord.attempts >= 3) {
      otpStorage.delete(email);
      return res.status(400).json({ message: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (otpRecord.otp !== otp.toString()) {
      otpRecord.attempts += 1;
      return res.status(400).json({ 
        message: `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.` 
      });
    }

    // OTP is valid, create user
    const { firstname, lastname, Phone, password } = otpRecord.userData;
    
    const user = await User.create({
      firstname,
      lastname,
      Phone,
      email,
      password,
    });

    if (user) {
      // Clean up OTP from memory
      otpStorage.delete(email);

      // Generate token
      const token = generateToken(user);

      // Send success response
      res.status(201).json({
        message: 'Email verified successfully! Account created.',
        user: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          Phone: user.Phone,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token
      });
    }

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

// @desc    Resend OTP
// @route   POST /api/users/resend-otp
// @access  Public
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Clean expired OTPs
    cleanExpiredOTPs();

    // Get OTP record from memory
    const otpRecord = otpStorage.get(email);
    
    if (!otpRecord) {
      return res.status(400).json({ message: 'No pending verification found. Please start the signup process again.' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Update OTP record in memory
    otpRecord.otp = otp;
    otpRecord.expiresAt = expiresAt;
    otpRecord.attempts = 0;

    // Send new OTP
    await sendOTPEmail(email, otp, otpRecord.userData.firstname);

    res.status(200).json({
      message: 'New OTP sent successfully to your email'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP. Please try again.' });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    // Check if user exists and password matches
    if (user && (await user.comparePassword(password))) {
      // Generate token
      const token = generateToken(user);

      // Send response
      res.status(200).json({
        user: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          Phone: user.Phone,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Keep the original register function for backward compatibility
export const register = async (req, res) => {
  try {
    const { firstname, lastname, email, Phone, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      firstname,
      lastname,
      Phone,
      email,
      password,
    });

    if (user) {
      // Generate token
      const token = generateToken(user);

      // Send response
      res.status(201).json({
        user: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          Phone: user.Phone,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};


// Add these functions to your userController.js file

// @desc    Get all users (Admin only)
// @route   GET /api/users/all
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    console.log('📋 Admin fetching all users...');

    // Get all users with basic information
    const users = await User.findAll({
      attributes: [
        'id', 
        'firstname', 
        'lastname', 
        'email', 
        'Phone', 
        'createdAt', 
        'updatedAt'
      ],
      order: [['createdAt', 'DESC']] // Most recent first
    });

    console.log(`✅ Found ${users.length} users`);

    // Calculate some basic stats
    const stats = {
      totalUsers: users.length,
      newThisWeek: users.filter(user => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(user.createdAt) > weekAgo;
      }).length,
      newToday: users.filter(user => {
        const today = new Date();
        return new Date(user.createdAt).toDateString() === today.toDateString();
      }).length
    };

    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      users,
      stats,
      count: users.length
    });

  } catch (error) {
    console.error('💥 Get all users error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔍 Admin fetching user by ID:', id);

    const user = await User.findByPk(id, {
      attributes: [
        'id', 
        'firstname', 
        'lastname', 
        'email', 
        'Phone', 
        'createdAt', 
        'updatedAt'
      ]
    });

    if (!user) {
      console.log('❌ User not found with ID:', id);
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    console.log('✅ User found:', user.email);

    res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      user
    });

  } catch (error) {
    console.error('💥 Get user by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Admin attempting to delete user with ID:', id);

    // Check if user exists
    const user = await User.findByPk(id);
    if (!user) {
      console.log('❌ User not found with ID:', id);
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    console.log('👤 User to delete:', {
      id: user.id,
      email: user.email,
      name: `${user.firstname} ${user.lastname}`
    });

    // Delete the user
    await user.destroy();

    console.log('✅ User deleted successfully');

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: {
        id: user.id,
        email: user.email,
        name: `${user.firstname} ${user.lastname}`
      }
    });

  } catch (error) {
    console.error('💥 Delete user error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user status (Admin only)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    console.log('🔄 Admin updating user status:', {
      userId: id,
      newStatus: status,
      reason
    });

    // Validate status
    const validStatuses = ['active', 'inactive', 'suspended', 'banned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      console.log('❌ User not found with ID:', id);
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Update user status (you may need to add a status field to your User model)
    await user.update({ 
      status,
      statusReason: reason,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: req.admin.id // Assuming you have admin info in req.admin
    });

    console.log('✅ User status updated successfully');

    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstname} ${user.lastname}`,
        status,
        statusReason: reason
      }
    });

  } catch (error) {
    console.error('💥 Update user status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update user status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
export const getUserStats = async (req, res) => {
  try {
    console.log('📊 Admin fetching user statistics...');

    // Get all users for stats calculation
    const users = await User.findAll({
      attributes: ['id', 'createdAt', 'updatedAt']
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    const stats = {
      totalUsers: users.length,
      newToday: users.filter(user => new Date(user.createdAt) >= today).length,
      newThisWeek: users.filter(user => new Date(user.createdAt) >= thisWeek).length,
      newThisMonth: users.filter(user => new Date(user.createdAt) >= thisMonth).length,
      newThisYear: users.filter(user => new Date(user.createdAt) >= thisYear).length,
      activeToday: users.filter(user => new Date(user.updatedAt) >= today).length,
      
      // Registration trends (last 7 days)
      registrationTrend: [],
      
      // Monthly breakdown
      monthlyStats: {}
    };

    // Calculate daily registration trend for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      const count = users.filter(user => {
        const createdAt = new Date(user.createdAt);
        return createdAt >= startOfDay && createdAt < endOfDay;
      }).length;

      stats.registrationTrend.push({
        date: startOfDay.toISOString().split('T')[0],
        count
      });
    }

    // Calculate monthly stats for the current year
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(now.getFullYear(), month, 1);
      const monthEnd = new Date(now.getFullYear(), month + 1, 1);
      
      const count = users.filter(user => {
        const createdAt = new Date(user.createdAt);
        return createdAt >= monthStart && createdAt < monthEnd;
      }).length;

      stats.monthlyStats[monthStart.toLocaleString('default', { month: 'long' })] = count;
    }

    console.log('✅ User statistics calculated successfully');

    res.status(200).json({
      success: true,
      message: 'User statistics fetched successfully',
      stats
    });

  } catch (error) {
    console.error('💥 Get user stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch user statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Search users (Admin only)
// @route   GET /api/users/search?q=searchterm
// @access  Private/Admin
export const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    console.log('🔍 Admin searching users with query:', q);

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const offset = (page - 1) * limit;

    // Search users by firstname, lastname, email, or phone
    const { rows: users, count } = await User.findAndCountAll({
      where: {
        [Op.or]: [
          { firstname: { [Op.iLike]: `%${q}%` } },
          { lastname: { [Op.iLike]: `%${q}%` } },
          { email: { [Op.iLike]: `%${q}%` } },
          { Phone: { [Op.iLike]: `%${q}%` } }
        ]
      },
      attributes: [
        'id', 
        'firstname', 
        'lastname', 
        'email', 
        'Phone', 
        'createdAt', 
        'updatedAt'
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    console.log(`✅ Found ${count} users matching search query`);

    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalUsers: count,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('💥 Search users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to search users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
