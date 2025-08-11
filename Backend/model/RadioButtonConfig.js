 
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/dbConnection.js'; // Adjust path as needed

const RadioButtonConfig = sequelize.define('RadioButtonConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  placeholderIncludes: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  options: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('options');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('options', JSON.stringify(value));
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'radio_button_configs',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['email', 'placeholderIncludes']
    }
  ]
});

export default RadioButtonConfig;