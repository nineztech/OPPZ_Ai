// inputfieldsController.js
import InputConfig from '../model/InputConfig.js';

export const getInputFieldConfigs = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const configs = await InputConfig.findAll({
      where: { email },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ success: true, configs });
  } catch (error) {
    console.error('Error fetching input configs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const saveInputFieldConfigs = async (req, res) => {
  try {
    // Ensure table exists before operations
    await InputConfig.sync();
    
    const configs = req.body;

    // Validate that configs is an array
    if (!Array.isArray(configs)) {
      return res.status(400).json({ success: false, message: 'Expected an array of configurations' });
    }

    for (const config of configs) {
      const { email, placeholderIncludes, count, defaultValue, createdAt, updatedAt } = config;

      // Validate required fields
      if (!email || !placeholderIncludes) {
        console.warn('Skipping config due to missing required fields:', config);
        continue;
      }

      const [instance, created] = await InputConfig.findOrCreate({
        where: { placeholderIncludes, email }, // Use both email and placeholder for uniqueness
        defaults: {
          email,
          count,
          defaultValue,
          createdAt: createdAt || new Date(),
          updatedAt: updatedAt || new Date(),
        },
      });

      if (!created) {
        await instance.update({ 
          count, 
          defaultValue, 
          updatedAt: updatedAt || new Date() 
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving input configs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateInputFieldConfig = async (req, res) => {
  const { placeholderIncludes, selectedValue, email, updatedAt } = req.body;

  try {
    // Find config by both placeholder and email for better security
    const whereClause = { placeholderIncludes };
    if (email) {
      whereClause.email = email;
    }

    const config = await InputConfig.findOne({ where: whereClause });
    if (!config) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }

    // Handle different types of defaultValue updates
    let updatedDefaultValue = selectedValue;
    
    // If the current defaultValue is JSON and selectedValue should update a specific option
    if (config.defaultValue && typeof config.defaultValue === 'string') {
      try {
        const parsed = JSON.parse(config.defaultValue);
        if (Array.isArray(parsed)) {
          // Update the selected option in array
          updatedDefaultValue = JSON.stringify(
            parsed.map(opt => ({
              ...opt,
              selected: opt.value === selectedValue,
            }))
          );
        } else {
          updatedDefaultValue = selectedValue;
        }
      } catch (e) {
        // If it's not JSON, just use the selectedValue directly
        updatedDefaultValue = selectedValue;
      }
    }

    await config.update({ 
      defaultValue: updatedDefaultValue, 
      updatedAt: updatedAt || new Date() 
    });

    res.json({ success: true, config });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteInputFieldConfig = async (req, res) => {
  try {
    const placeholder = decodeURIComponent(req.params.placeholder);
    const { email } = req.query; // Get email from query params for better security

    const whereClause = { placeholderIncludes: placeholder };
    if (email) {
      whereClause.email = email;
    }

    const deleted = await InputConfig.destroy({ where: whereClause });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};