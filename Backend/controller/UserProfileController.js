// controller/UserProfileController.js
import Profile from '../model/UserProfile.js'; // Fixed: models (plural), added .js extension, default import

export const createProfile = async (req, res) => {
  try {
    console.log("📥 Received data:", req.body);
    console.log("📎 Uploaded file:", req.file);

    const data = JSON.parse(req.body.data);
    const resumeFile = req.file ? req.file.filename : null;

    const newProfile = await Profile.create({
      ...data,
      resume: resumeFile,
    });

    res.status(201).json({ success: true, profile: newProfile });
  } catch (err) {
    console.error("❌ Error saving profile:", err);
    res.status(500).json({ success: false, message: 'Failed to save profile', error: err.message });
  }
};

// Get all profiles
export const getAllProfiles = async (req, res) => {
  try {
    console.log("📋 Fetching all profiles...");
    
    const profiles = await Profile.findAll({
      order: [['createdAt', 'DESC']], // Most recent first
    });

    console.log(`✅ Found ${profiles.length} profiles`);
    res.status(200).json({ success: true, profiles });
  } catch (err) {
    console.error("❌ Error fetching profiles:", err);
    res.status(500).json({ success: false, message: 'Failed to fetch profiles', error: err.message });
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

    console.log(`✅ Found profile: ${profile.firstName} ${profile.lastName}`);
    res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res.status(500).json({ success: false, message: 'Failed to fetch profile', error: err.message });
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

    await profile.destroy();
    console.log(`✅ Profile deleted: ${profile.firstName} ${profile.lastName}`);
    res.status(200).json({ success: true, message: 'Profile deleted successfully' });
  } catch (err) {
    console.error("❌ Error deleting profile:", err);
    res.status(500).json({ success: false, message: 'Failed to delete profile', error: err.message });
  }
};