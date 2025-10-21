const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  resumeType: {
    type: String,
    enum: ['current', 'updated'],
    required: true
  },
  updatedResume: String, // URL to updated resume if provided
  matchPercentage: Number,
  skills: [String],
  experience: String,
  applicationData: mongoose.Schema.Types.Mixed // Store complete employee data at time of application
});

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
  type: {
    type: String,
    required: true,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    default: 'Full-time'
  },
  salary: {
    type: String,
    required: true
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
  postedDate: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HR',
    required: true
  },
  applications: [jobApplicationSchema],
  referrals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobReferral'
  }]
}, {
  timestamps: true
});

// Virtual for total applications count
jobSchema.virtual('totalApplications').get(function() {
  return this.applications.length;
});

// Virtual for pending applications count
jobSchema.virtual('pendingApplications').get(function() {
  return this.applications.filter(app => app.status === 'pending').length;
});

// Index for active jobs query
jobSchema.index({ status: 1, deadline: 1 });

module.exports = mongoose.model('Job', jobSchema);