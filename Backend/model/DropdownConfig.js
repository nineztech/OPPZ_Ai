import { DataTypes } from 'sequelize';
import { sequelize } from '../config/dbConnection.js';

const DropdownConfig = sequelize.define('DropdownConfig', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true,
    }
  },
  placeholderIncludes: {
    type: DataTypes.STRING,
    allowNull: false,
    // Remove unique constraint from here since we'll use composite unique
  },
  count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  options: {
    type: DataTypes.TEXT, // Changed to TEXT to allow longer JSON strings
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'dropdown_configs',
  timestamps: false, // disable default Sequelize timestamp handling
  indexes: [
    {
      unique: true,
      fields: ['email', 'placeholderIncludes'] // Composite unique constraint
    }
  ]
});

export default DropdownConfig;