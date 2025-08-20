import userRoute from './userRoute.js';
import userProfileRoutes from "./UserProfileRoutes.js";
import dropdownRoutes from './dropdownRoutes.js';
import contactRoutes from './contactRoutes.js';
import inputRoutes from './inputRoutes.js';
import radiobuttonRoutes from './radiobuttonRoutes.js'; // Make sure this file exists
import appliedJobRoutes from './appliedJobRoutes.js';
import formConfigRoutes from './formConfigRoutes.js';
import express from 'express';
const router = express.Router();

router.use('/users', userRoute);
router.use('/api', userProfileRoutes);
router.use('/api/contact', contactRoutes);
router.use('/api/dropdowns', dropdownRoutes);
router.use('/api/inputs', inputRoutes);
router.use('/api/radiobuttons', radiobuttonRoutes);  
router.use('/api/applied-jobs', appliedJobRoutes);
router.use('/api/form-configs', formConfigRoutes);

export default router;
