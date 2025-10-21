const mongoose = require('mongoose');

const jobReferralSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  candidateName: {
    type: String,
    required: true
  },
  candidateEmail: {
    type: String,
    required: true
  },
  candidatePhone: String,
  candidateResume: {
    type: String, // URL to the resume file
    required: true
  },
  candidateSkills: [String],
  candidateExperience: String,
  referralDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'rejected', 'hired'],
    default: 'pending'
  },
  notes: String
}, {
  timestamps: true
});

// Ensure one referral per employee per job
jobReferralSchema.index({ job: 1, referredBy: 1 }, { unique: true });

// TTL index to auto-delete referrals after job closure (90 days retention)
jobReferralSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('JobReferral', jobReferralSchema);