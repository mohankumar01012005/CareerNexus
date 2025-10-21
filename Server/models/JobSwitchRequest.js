const mongoose = require('mongoose');

const jobSwitchRequestSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HR'
  },
  reviewedDate: Date,
  rejectionReason: String,
  rejectionDate: Date,
  canApplyAfter: Date // Date when employee can apply again after rejection
}, {
  timestamps: true
});

// Index for efficient queries
jobSwitchRequestSchema.index({ employee: 1, status: 1 });
jobSwitchRequestSchema.index({ canApplyAfter: 1 });

module.exports = mongoose.model('JobSwitchRequest', jobSwitchRequestSchema);