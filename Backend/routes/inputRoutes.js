// inputRoutes.js
import express from 'express';
import { 
  getInputFieldConfigs,
  saveInputFieldConfigs, 
  updateInputFieldConfig, 
  deleteInputFieldConfig 
} from '../controller/inputfiledsController.js';

const router = express.Router();

// GET route to fetch configs for a specific user
router.get('/get-inputconfigs', getInputFieldConfigs);

// POST route to save/sync multiple configs
router.post('/save-inputconfigs', saveInputFieldConfigs);

// PUT route to update a specific config
router.put('/update-inputconfig', updateInputFieldConfig);

// DELETE route to delete a specific config
router.delete('/delete-inputconfig/:placeholder', deleteInputFieldConfig);

export default router;