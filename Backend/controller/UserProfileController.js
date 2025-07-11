// Updated UserProfileController.js with enhanced debugging
import Profile from '../model/UserProfile.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to generate resume URL
const getResumeUrl = (req, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get('host')}/api/uploads/${filename}`;
};

// Helper function to delete file
const deleteFile = (filename) => {
  if (!filename) return;
  
  const filePath = path.join(__dirname, '../uploads', filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`🗑️ Deleted file: ${filename}`);
  }
};

export const createProfile = async (req, res) => {
  try {
    console.log("📥 === DEBUGGING FILE UPLOAD ===");
    console.log("📥 Request body:", req.body);
    console.log("📎 Request file:", req.file);
    console.log("📁 Request files:", req.files);
    console.log("📋 Content-Type:", req.get('Content-Type'));
    console.log("📋 Request headers:", req.headers);
    
    // Check if uploads directory exists
    const uploadsPath = path.join(__dirname, '../uploads');
    console.log("📁 Uploads directory path:", uploadsPath);
    console.log("📁 Uploads directory exists:", fs.existsSync(uploadsPath));
    
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
      console.log("✅ Created uploads directory");
    }

    // Check if we have the data
    if (!req.body.data) {
      console.error("❌ No data found in request body");
      return res.status(400).json({ 
        success: false, 
        message: 'No data provided in request body' 
      });
    }

    // Parse the JSON data
    let data;
    try {
      data = JSON.parse(req.body.data);
      console.log("✅ Parsed data successfully:", data);
    } catch (parseError) {
      console.error("❌ Error parsing JSON data:", parseError);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid JSON data provided' 
      });
    }

    const resumeFile = req.file ? req.file.filename : null;
    console.log("📎 Resume file name:", resumeFile);

    if (req.file) {
      console.log("📎 File details:", {
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });
      
      // Verify file was actually saved
      if (fs.existsSync(req.file.path)) {
        console.log("✅ File successfully saved to disk");
      } else {
        console.error("❌ File not found on disk after upload");
      }
    } else {
      console.log("⚠️ No file uploaded");
    }

    // Check if profile with this email already exists
    const existingProfile = await Profile.findOne({ where: { email: data.email } });
    
    if (existingProfile) {
      console.log("🔄 Updating existing profile");
      // Update existing profile
      const oldResumeFile = existingProfile.resume;
      
      // Update profile data
      await existingProfile.update({
        ...data,
        resume: resumeFile || existingProfile.resume, // Keep old resume if no new one uploaded
      });

      // Delete old resume file if new one uploaded
      if (resumeFile && oldResumeFile && oldResumeFile !== resumeFile) {
        deleteFile(oldResumeFile);
      }

      const profileWithResumeUrl = {
        ...existingProfile.toJSON(),
        resumeUrl: getResumeUrl(req, existingProfile.resume),
      };

      console.log(`✅ Profile updated for: ${data.email}`);
      res.status(200).json({ success: true, profile: profileWithResumeUrl, message: 'Profile updated successfully' });
    } else {
      console.log("🆕 Creating new profile");
      // Create new profile
      const newProfile = await Profile.create({
        ...data,
        resume: resumeFile,
      });

      const profileWithResumeUrl = {
        ...newProfile.toJSON(),
        resumeUrl: getResumeUrl(req, resumeFile),
      };

      console.log(`✅ Profile created for: ${data.email}`);
      res.status(201).json({ success: true, profile: profileWithResumeUrl, message: 'Profile created successfully' });
    }
  } catch (err) {
    console.error("❌ Error saving profile:", err);
    console.error("❌ Error stack:", err.stack);
    
    // Clean up uploaded file if profile creation failed
    if (req.file) {
      deleteFile(req.file.filename);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save profile', 
      error: err.message 
    });
  }
};

// Get all profiles
export const getAllProfiles = async (req, res) => {
  try {
    console.log("📋 Fetching all profiles...");
    
    const profiles = await Profile.findAll({
      order: [['createdAt', 'DESC']],
    });

    const profilesWithResumeUrls = profiles.map(p => ({
      ...p.toJSON(),
      resumeUrl: getResumeUrl(req, p.resume),
    }));

    console.log(`✅ Found ${profiles.length} profiles`);
    res.status(200).json({ success: true, profiles: profilesWithResumeUrls });
  } catch (err) {
    console.error("❌ Error fetching profiles:", err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profiles', 
      error: err.message 
    });
  }
};

// Get single profile by ID
export const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Fetching profile with ID: ${id}`);
    
    const profile = await Profile.findByPk(id);
    
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const profileWithResumeUrl = {
      ...profile.toJSON(),
      resumeUrl: getResumeUrl(req, profile.resume),
    };

    console.log(`✅ Found profile: ${profile.firstName} ${profile.lastName}`);
    res.status(200).json({ success: true, profile: profileWithResumeUrl });
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile', 
      error: err.message 
    });
  }
};

// Delete profile by ID
export const deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting profile with ID: ${id}`);
    
    const profile = await Profile.findByPk(id);
    
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Delete associated resume file
    if (profile.resume) {
      deleteFile(profile.resume);
    }

    await profile.destroy();
    console.log(`✅ Profile deleted: ${profile.firstName} ${profile.lastName}`);
    res.status(200).json({ success: true, message: 'Profile deleted successfully' });
  } catch (err) {
    console.error("❌ Error deleting profile:", err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete profile', 
      error: err.message 
    });
  }
};