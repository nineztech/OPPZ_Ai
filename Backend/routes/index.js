import userRoute from './userRoute.js';
import userProfileRoutes from "./UserProfileRoutes.js";

import express from 'express';
const router = express.Router();

router.use('/users', userRoute);
router.use('/api', userProfileRoutes); // Changed from '/' to '/api'

export default router;