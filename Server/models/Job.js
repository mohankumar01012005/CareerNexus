const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true,
    enum: ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations']
  },
  location: {
    type: String,
    required: true
  },
  salaryRange: {
    min: Number,
    max: Number
  },
  description: {
    type: String,
    required: true
  },
  requirements: [String],
  requiredSkills: [String],
  status: {
    type: String,
    enum: ['draft', 'active', 'closed'],
    default: 'draft'
  },
  applicationDeadline: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HR',
    required: true
  },
  applicants: [{
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'approved', 'rejected'],
      default: 'pending'
    },
    matchPercentage: Number,
    skillsAlignment: [{
      skill: String,
      match: Boolean
    }]
  }],
  totalApplications: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);