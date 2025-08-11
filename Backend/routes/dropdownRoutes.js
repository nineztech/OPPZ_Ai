import express from 'express';
import { 
  saveDropdownConfigs, 
  getDropdownConfigs, 
  updateDropdownConfig, 
  deleteDropdownConfig 
} from '../controller/dropdownController.js';

const router = express.Router();

// Save multiple dropdown configurations
router.post('/save-configs', saveDropdownConfigs);

// Get dropdown configurations for a specific user
router.get('/configs/:email', getDropdownConfigs);

// Update a specific dropdown configuration
router.put('/update', updateDropdownConfig);

// Delete a specific dropdown configuration
router.delete('/delete/:placeholder', deleteDropdownConfig);

export default router;