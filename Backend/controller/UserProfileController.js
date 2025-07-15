// Enhanced UserProfileController.js with dedicated update function
import Profile from '../model/UserProfile.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { fn, col, where } from 'sequelize';// ✅ ensure you import these
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

// Helper function to ensure uploads directory exists
const ensureUploadsDirectory = () => {
  const uploadsPath = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log("✅ Created uploads directory");
  }
  return uploadsPath;
};

// Create new profile
export const createProfile = async (req, res) => {
  try {
    console.log("📥 === CREATE PROFILE ===");
    console.log("📥 Request body:", req.body);
    console.log("📎 Request file:", req.file);
    
    ensureUploadsDirectory();

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

    // Check if profile already exists
    const existingProfile = await Profile.findOne({ where: { email: data.email } });
    
    if (existingProfile) {
      console.log("❌ Profile already exists, use update endpoint instead");
      return res.status(409).json({ 
        success: false, 
        message: 'Profile already exists. Use update endpoint instead.',
        profileId: existingProfile.id
      });
    }

    const resumeFile = req.file ? req.file.filename : null;
    console.log("📎 Resume file name:", resumeFile);

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
    res.status(201).json({ 
      success: true, 
      profile: profileWithResumeUrl, 
      message: 'Profile created successfully' 
    });

  } catch (err) {
    console.error("❌ Error creating profile:", err);
    
    // Clean up uploaded file if profile creation failed
    if (req.file) {
      deleteFile(req.file.filename);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create profile', 
      error: err.message 
    });
  }
};

// Update existing profile
export const updateProfile = async (req, res) => {
  try {
    console.log("📥 === UPDATE PROFILE ===");
    console.log("📥 Request body:", req.body);
    console.log("📎 Request file:", req.file);
    
    const { id } = req.params;
    console.log("🔍 Updating profile with ID:", id);

    ensureUploadsDirectory();

    // Find existing profile
    const existingProfile = await Profile.findByPk(id);
    
    if (!existingProfile) {
      console.log("❌ Profile not found");
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
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

    const oldResumeFile = existingProfile.resume;
    const newResumeFile = req.file ? req.file.filename : null;
    
    console.log("📎 Old resume file:", oldResumeFile);
    console.log("📎 New resume file:", newResumeFile);

    // Update profile data
    const updatedProfile = await existingProfile.update({
      ...data,
      resume: newResumeFile || existingProfile.resume, // Keep old resume if no new one uploaded
    });

    // Delete old resume file if new one uploaded
    if (newResumeFile && oldResumeFile && oldResumeFile !== newResumeFile) {
      deleteFile(oldResumeFile);
    }

    const profileWithResumeUrl = {
      ...updatedProfile.toJSON(),
      resumeUrl: getResumeUrl(req, updatedProfile.resume),
    };

    console.log(`✅ Profile updated for: ${data.email}`);
    res.status(200).json({ 
      success: true, 
      profile: profileWithResumeUrl, 
      message: 'Profile updated successfully' 
    });

  } catch (err) {
    console.error("❌ Error updating profile:", err);
    
    // Clean up uploaded file if profile update failed
    if (req.file) {
      deleteFile(req.file.filename);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile', 
      error: err.message 
    });
  }
};

// Create or Update profile (existing functionality)
export const createOrUpdateProfile = async (req, res) => {
  try {
    console.log("📥 === CREATE OR UPDATE PROFILE ===");
    console.log("📥 Request body:", req.body);
    console.log("📎 Request file:", req.file);
    
    ensureUploadsDirectory();

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
      res.status(200).json({ 
        success: true, 
        profile: profileWithResumeUrl, 
        message: 'Profile updated successfully' 
      });
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
      res.status(201).json({ 
        success: true, 
        profile: profileWithResumeUrl, 
        message: 'Profile created successfully' 
      });
    }
  } catch (err) {
    console.error("❌ Error saving profile:", err);
    
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

export const getProfileByEmail = async (req, res) => {
  try {
    const rawEmail = req.params.email;
    const email = rawEmail.toLowerCase();

    console.log(`📋 Fetching profile with email (case-insensitive): ${email}`);

    const profile = await Profile.findOne({
      where: where(fn('LOWER', col('email')), email)
    });

    if (!profile) {
      console.log(`❌ No matching profile for: ${email}`);
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const profileWithResumeUrl = {
      ...profile.toJSON(),
      resumeUrl: getResumeUrl(req, profile.resume),
    };

    console.log(`✅ Found profile: ${profile.firstName} ${profile.lastName}`);
    res.status(200).json({ success: true, profile: profileWithResumeUrl });
  } catch (err) {
    console.error("❌ Error fetching profile by email:", err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: err.message,
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

// Partial update profile (PATCH)
export const partialUpdateProfile = async (req, res) => {
  try {
    console.log("📥 === PARTIAL UPDATE PROFILE ===");
    console.log("📥 Request body:", req.body);
    console.log("📎 Request file:", req.file);
    
    const { id } = req.params;
    console.log("🔍 Partially updating profile with ID:", id);

    ensureUploadsDirectory();

    // Find existing profile
    const existingProfile = await Profile.findByPk(id);
    
    if (!existingProfile) {
      console.log("❌ Profile not found");
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }

    let updateData = {};

    // Handle JSON data if provided
    if (req.body.data) {
      try {
        updateData = JSON.parse(req.body.data);
        console.log("✅ Parsed partial update data:", updateData);
      } catch (parseError) {
        console.error("❌ Error parsing JSON data:", parseError);
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid JSON data provided' 
        });
      }
    } else {
      // Use direct body data for partial updates
      updateData = req.body;
    }

    // Handle file upload
    if (req.file) {
      const oldResumeFile = existingProfile.resume;
      updateData.resume = req.file.filename;
      
      // Delete old resume file if new one uploaded
      if (oldResumeFile && oldResumeFile !== req.file.filename) {
        deleteFile(oldResumeFile);
      }
    }

    // Update only provided fields
    const updatedProfile = await existingProfile.update(updateData);

    const profileWithResumeUrl = {
      ...updatedProfile.toJSON(),
      resumeUrl: getResumeUrl(req, updatedProfile.resume),
    };

    console.log(`✅ Profile partially updated for: ${updatedProfile.email}`);
    res.status(200).json({ 
      success: true, 
      profile: profileWithResumeUrl, 
      message: 'Profile updated successfully' 
    });

  } catch (err) {
    console.error("❌ Error partially updating profile:", err);
    
    // Clean up uploaded file if profile update failed
    if (req.file) {
      deleteFile(req.file.filename);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile', 
      error: err.message 
    });
  }
};