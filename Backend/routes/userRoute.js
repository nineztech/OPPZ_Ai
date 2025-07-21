import express from 'express';
const router = express.Router();
import { register, login } from '../controller/userController.js';

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', login);
// router.get('/basic-info/:email', getBasicUserInfo);


export default router;