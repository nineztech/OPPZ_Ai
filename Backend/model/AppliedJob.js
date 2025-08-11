// models/AppliedJob.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/dbConnection.js';

const AppliedJob = sequelize.define('AppliedJob', {
  jobId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  time: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  isAutoApplied: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false, // Reference to InputConfig email
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'applied_jobs',
  timestamps: false,
});

export default AppliedJob;
