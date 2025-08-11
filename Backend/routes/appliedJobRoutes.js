import express from 'express';
import {
  saveAppliedJob,
  getAppliedJobsByEmail,
} from '../controller/appliedJobController.js';

const router = express.Router();

router.post('/save', saveAppliedJob);
router.get('/:email', getAppliedJobsByEmail); // fetch jobs by email

export default router;
