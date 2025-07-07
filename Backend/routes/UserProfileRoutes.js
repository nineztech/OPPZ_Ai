// routes/UserProfileRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { 
  createProfile, 
  getAllProfiles, 
  getProfileById, 
  deleteProfile 
} from '../controller/UserProfileController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Routes
router.post('/profile', upload.single('resume'), createProfile);    // Create profile
router.get('/profiles', getAllProfiles);                           // Get all profiles
router.get('/profile/:id', getProfileById);                        // Get single profile
router.delete('/profile/:id', deleteProfile);                      // Delete profile

export default router;