 import { DataTypes } from 'sequelize';
import { sequelize } from '../config/dbConnection.js';

const Contact = sequelize.define('Contact', {
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  }
},{
  timestamps: true // 👈 enables createdAt and updatedAt automatically
});

export default Contact;
