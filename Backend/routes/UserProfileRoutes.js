// Enhanced routes/UserProfileRoutes.js with update endpoints
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { 
  createProfile,
  updateProfile,
  createOrUpdateProfile,
  getAllProfiles, 
  getProfileById,
  getProfileByEmail,
  deleteProfile,
  partialUpdateProfile
} from '../controller/UserProfileController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
console.log("📁 Uploads directory path:", uploadsDir);

if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("✅ Created uploads directory");
  } catch (error) {
    console.error("❌ Failed to create uploads directory:", error);
  }
} else {
  console.log("✅ Uploads directory already exists");
}

// Test directory permissions
try {
  const testFile = path.join(uploadsDir, 'test.txt');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log("✅ Directory is writable");
} catch (error) {
  console.error("❌ Directory is not writable:", error);
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("📁 Multer destination called");
    console.log("📁 Destination path:", uploadsDir);
    
    // Double-check directory exists
    if (!fs.existsSync(uploadsDir)) {
      try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log("✅ Created uploads directory in multer");
      } catch (error) {
        console.error("❌ Failed to create directory in multer:", error);
        return cb(error);
      }
    }
    
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    console.log("📎 Multer filename called");
    console.log("📎 Original filename:", file.originalname);
    
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `resume-${uniqueSuffix}${extension}`;
    
    console.log("📎 Generated filename:", filename);
    cb(null, filename);
  }
});

// File filter to accept only PDF and DOC files
const fileFilter = (req, file, cb) => {
  console.log("🔍 File filter called");
  console.log("🔍 File mimetype:", file.mimetype);
  console.log("🔍 File originalname:", file.originalname);
  
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    console.log("✅ File type accepted");
    cb(null, true);
  } else {
    console.log("❌ File type rejected");
    cb(new Error(`Only PDF, DOC, and DOCX files are allowed! Received: ${file.mimetype}`), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Add middleware to log all requests
router.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  console.log("📡 Content-Type:", req.get('Content-Type'));
  next();
});

// Add error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  console.error("❌ Multer error:", error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Expected "resume".'
      });
    }
  }
  
  if (error.message.includes('Only PDF, DOC, and DOCX files are allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'File upload error',
    error: error.message
  });
};

// Profile Routes

// Create new profile (POST)
router.post('/profile/create', (req, res, next) => {
  console.log("📥 POST /profile/create called");
  upload.single('resume')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, createProfile);

// Update existing profile by ID (PUT)
router.put('/profile/:id', (req, res, next) => {
  console.log("📥 PUT /profile/:id called");
  upload.single('resume')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, updateProfile);

// Partial update profile by ID (PATCH)
router.patch('/profile/:id', (req, res, next) => {
  console.log("📥 PATCH /profile/:id called");
  upload.single('resume')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, partialUpdateProfile);

// Create or update profile (existing functionality)
router.post('/profile', (req, res, next) => {
  console.log("📥 POST /profile called");
  upload.single('resume')(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, createOrUpdateProfile);

// Get all profiles (GET)
router.get('/profiles', getAllProfiles);

// Get single profile by ID (GET)
router.get('/profile/:id', getProfileById);

// Get profile by email (GET)
router.get('/profile/email/:email', getProfileByEmail);

// Delete profile by ID (DELETE)
router.delete('/profile/:id', deleteProfile);

// Serve uploaded files
router.use('/uploads', express.static(uploadsDir));

export default router;