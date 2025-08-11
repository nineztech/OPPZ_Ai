// radiobuttonRoutes.js
import express from 'express';
import { 
  getRadioButtonConfigs,
  saveRadioButtonConfigs, 
  updateRadioButtonConfig, 
  deleteRadioButtonConfig,
  addRadioButtonOption,
  removeRadioButtonOption
} from '../controller/radiobuttonController.js';

const router = express.Router();

// GET route to fetch radio button configs for a specific user
router.get('/get-radioconfigs', getRadioButtonConfigs);

// POST route to save/sync multiple radio button configs
router.post('/save-radioconfigs', saveRadioButtonConfigs);

// PUT route to update a specific radio button config (select option)
router.put('/update-radioconfig', updateRadioButtonConfig);

// DELETE route to delete a specific radio button config
router.delete('/delete-radioconfig/:placeholder', deleteRadioButtonConfig);

// POST route to add a new option to existing radio button config
router.post('/add-radio-option', addRadioButtonOption);

// POST route to remove an option from existing radio button config
router.post('/remove-radio-option', removeRadioButtonOption);

export default router;