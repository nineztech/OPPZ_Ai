// controllers/appliedJobController.js
import AppliedJob from '../model/AppliedJob.js';

// Save a new applied job
export const saveAppliedJob = async (req, res) => {
  try {
    const {
      id,
      title,
      companyName,
      link,
      time,
      isAutoApplied,
      location,
      email,
    } = req.body;

    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const job = await AppliedJob.create({
      jobId: id,
      title,
      companyName,
      link,
      time,
      isAutoApplied,
      location,
      email,
    });

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    console.error('Error saving job:', error);
    res.status(500).json({ success: false, error: 'Failed to save job.' });
  }
};

// Fetch all jobs by email
export const getAppliedJobsByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const jobs = await AppliedJob.findAll({
      where: { email },
      order: [['time', 'DESC']], // optional: newest first
    });

    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch jobs.' });
  }
};
