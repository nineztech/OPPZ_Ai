import DropdownConfig from '../model/DropdownConfig.js';

export const saveDropdownConfigs = async (req, res) => {
  try {
    const { email, configs } = req.body;
    
    if (!email || !configs) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and configs are required' 
      });
    }

    for (const config of configs) {
      const { placeholderIncludes, count, options, createdAt, updatedAt } = config;

      const [instance, created] = await DropdownConfig.findOrCreate({
        where: { 
          email,
          placeholderIncludes 
        },
        defaults: {
          email,
          count,
          options: typeof options === 'string' ? options : JSON.stringify(options),
          createdAt,
          updatedAt,
        },
      });

      if (!created) {
        await instance.update({ 
          count, 
          options: typeof options === 'string' ? options : JSON.stringify(options), 
          updatedAt 
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving dropdown configs:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const getDropdownConfigs = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    const configs = await DropdownConfig.findAll({
      where: { email },
      order: [['createdAt', 'DESC']]
    });

    // Parse JSON options back to objects
    const formattedConfigs = configs.map(config => ({
      ...config.toJSON(),
      options: typeof config.options === 'string' ? JSON.parse(config.options) : config.options
    }));

    res.status(200).json({ 
      success: true, 
      data: formattedConfigs 
    });
  } catch (error) {
    console.error('Error fetching dropdown configs:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const updateDropdownConfig = async (req, res) => {
  try {
    const { email, placeholderIncludes, selectedValue, updatedAt } = req.body;

    if (!email || !placeholderIncludes) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and placeholderIncludes are required' 
      });
    }

    const config = await DropdownConfig.findOne({ 
      where: { 
        email,
        placeholderIncludes 
      } 
    });
    
    if (!config) {
      return res.status(404).json({ 
        success: false, 
        message: 'Dropdown config not found' 
      });
    }

    // Parse existing options
    const currentOptions = typeof config.options === 'string' ? 
      JSON.parse(config.options) : config.options;

    // Update the selected option
    const updatedOptions = currentOptions.map(opt => ({
      ...opt,
      selected: opt.value === selectedValue,
    }));

    await config.update({ 
      options: JSON.stringify(updatedOptions), 
      updatedAt: updatedAt || new Date().toISOString()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteDropdownConfig = async (req, res) => {
  try {
    const { email } = req.body;
    const placeholder = decodeURIComponent(req.params.placeholder);

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    const deleted = await DropdownConfig.destroy({ 
      where: { 
        email,
        placeholderIncludes: placeholder 
      } 
    });

    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        message: 'Dropdown config not found' 
      });
    }

    res.json({ success: true, message: 'Dropdown config deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};