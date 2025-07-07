// models/UserProfile.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/dbConnection.js';

const Profile = sequelize.define('Profile', {
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  experience: DataTypes.INTEGER,
  city: DataTypes.STRING,
  phone: DataTypes.STRING,
  currentSalary: DataTypes.STRING,
  expectedSalary: DataTypes.STRING,
  gender: DataTypes.STRING,
  citizenship: DataTypes.STRING,
  age: DataTypes.INTEGER,
  noticePeriod: DataTypes.INTEGER,
  additionalInfo: DataTypes.TEXT,
  resume: DataTypes.STRING, // File path or name
});

export default Profile;