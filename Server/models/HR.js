const mongoose = require('mongoose');

const hrSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true,
    default: 'HR Manager'
  },
  department: {
    type: String,
    default: 'HR'
  },
  permissions: {
    canCreateEmployees: { type: Boolean, default: true },
    canManageJobs: { type: Boolean, default: true },
    canViewAnalytics: { type: Boolean, default: true },
    canProcessApprovals: { type: Boolean, default: true }
  },
  lastActivity: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('HR', hrSchema);