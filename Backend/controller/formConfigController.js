import InputConfig from '../model/InputConfig.js';
import RadioButtonConfig from '../model/RadioButtonConfig.js';
import DropdownConfig from '../model/DropdownConfig.js';

// formConfigController.js
const getAllConfigsByEmail = async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const [dropdownConfigs, radioButtonConfigs, inputConfigs] = await Promise.all([
      DropdownConfig.findAll({ where: { email } }),
      RadioButtonConfig.findAll({ where: { email } }),
      InputConfig.findAll({ where: { email } }),
    ]);

    return res.json({
      success: true,
      email,
      dropdownConfigs,
      radioButtonConfigs,
      inputConfigs,
    });
  } catch (error) {
    console.error('Error fetching form configs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
export default getAllConfigsByEmail;
