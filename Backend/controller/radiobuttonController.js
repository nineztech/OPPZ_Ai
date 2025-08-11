// controller/radiobuttonController.js
import RadioButtonConfig from '../model/RadioButtonConfig.js';

export const getRadioButtonConfigs = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const configs = await RadioButtonConfig.findAll({
      where: { email },
      order: [['createdAt', 'DESC']]
    });

    // Transform the data to match frontend expectations
    const transformedConfigs = configs.map(config => ({
      placeholderIncludes: config.placeholderIncludes,
      count: config.count,
      options: config.options || [],
      email: config.email,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }));

    res.status(200).json({ success: true, configs: transformedConfigs });
  } catch (error) {
    console.error('Error fetching radio button configs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const saveRadioButtonConfigs = async (req, res) => {
  try {
    // Ensure table exists before operations
    await RadioButtonConfig.sync();
    
    const configs = req.body;

    // Validate that configs is an array
    if (!Array.isArray(configs)) {
      return res.status(400).json({ success: false, message: 'Expected an array of configurations' });
    }

    for (const config of configs) {
      const { email, placeholderIncludes, count, options, createdAt, updatedAt } = config;

      // Validate required fields
      if (!email || !placeholderIncludes) {
        console.warn('Skipping config due to missing required fields:', config);
        continue;
      }

      // Validate options structure
      const validOptions = Array.isArray(options) ? options.filter(option => 
        option && typeof option === 'object' && option.value !== undefined
      ) : [];

      const [instance, created] = await RadioButtonConfig.findOrCreate({
        where: { placeholderIncludes, email },
        defaults: {
          email,
          count: count || 0,
          options: validOptions,
          createdAt: createdAt || new Date(),
          updatedAt: updatedAt || new Date(),
        },
      });

      if (!created) {
        await instance.update({ 
          count: count || 0,
          options: validOptions,
          updatedAt: updatedAt || new Date() 
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving radio button configs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateRadioButtonConfig = async (req, res) => {
  try {
    const { placeholderIncludes, selectedValue, email, updatedAt } = req.body;

    if (!placeholderIncludes || selectedValue === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'placeholderIncludes and selectedValue are required' 
      });
    }

    // Find config by both placeholder and email for better security
    const whereClause = { placeholderIncludes };
    if (email) {
      whereClause.email = email;
    }

    const config = await RadioButtonConfig.findOne({ where: whereClause });
    if (!config) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }

    // Update the selected option in the options array
    const currentOptions = config.options || [];
    const updatedOptions = currentOptions.map(option => ({
      ...option,
      selected: option.value === selectedValue,
    }));

    await config.update({ 
      options: updatedOptions,
      updatedAt: updatedAt || new Date() 
    });

    res.json({ success: true, config });
  } catch (error) {
    console.error('Update radio button config error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteRadioButtonConfig = async (req, res) => {
  try {
    const placeholder = decodeURIComponent(req.params.placeholder);
    const { email } = req.query; // Get email from query params for better security

    if (!placeholder) {
      return res.status(400).json({ success: false, message: 'Placeholder is required' });
    }

    const whereClause = { placeholderIncludes: placeholder };
    if (email) {
      whereClause.email = email;
    }

    const deleted = await RadioButtonConfig.destroy({ where: whereClause });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete radio button config error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addRadioButtonOption = async (req, res) => {
  try {
    const { placeholderIncludes, newOption, email } = req.body;

    if (!placeholderIncludes || !newOption || !newOption.value) {
      return res.status(400).json({ 
        success: false, 
        message: 'placeholderIncludes and newOption with value are required' 
      });
    }

    const whereClause = { placeholderIncludes };
    if (email) {
      whereClause.email = email;
    }

    const config = await RadioButtonConfig.findOne({ where: whereClause });
    if (!config) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }

    const currentOptions = config.options || [];
    
    // Check if option with same value already exists
    const existingOption = currentOptions.find(opt => opt.value === newOption.value);
    if (existingOption) {
      return res.status(400).json({ 
        success: false, 
        message: 'Option with this value already exists' 
      });
    }

    const updatedOptions = [...currentOptions, {
      value: newOption.value,
      text: newOption.text || newOption.value,
      selected: newOption.selected || false,
    }];

    await config.update({ 
      options: updatedOptions,
      updatedAt: new Date() 
    });

    res.json({ success: true, config });
  } catch (error) {
    console.error('Add radio button option error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const removeRadioButtonOption = async (req, res) => {
  try {
    const { placeholderIncludes, optionValue, email } = req.body;

    if (!placeholderIncludes || !optionValue) {
      return res.status(400).json({ 
        success: false, 
        message: 'placeholderIncludes and optionValue are required' 
      });
    }

    const whereClause = { placeholderIncludes };
    if (email) {
      whereClause.email = email;
    }

    const config = await RadioButtonConfig.findOne({ where: whereClause });
    if (!config) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }

    const currentOptions = config.options || [];
    const updatedOptions = currentOptions.filter(opt => opt.value !== optionValue);

    await config.update({ 
      options: updatedOptions,
      updatedAt: new Date() 
    });

    res.json({ success: true, config });
  } catch (error) {
    console.error('Remove radio button option error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};