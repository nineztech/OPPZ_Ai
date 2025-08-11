// formConfigRoutes.js
import express from 'express';
import  getAllConfigsByEmail  from '../controller/formConfigController.js';

const router = express.Router();

router.get('/all', getAllConfigsByEmail);

export default router;
