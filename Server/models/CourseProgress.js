
const mongoose = require('mongoose');

const courseProgressSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  courseRecommendation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseRecommendation',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  courseTitle: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'verified', 'rejected'],
    default: 'not_started'
  },
  proof: {
    type: String, // URL to certificate, screenshot, or badge
    default: null
  },
  proofType: {
    type: String,
    enum: ['certificate', 'screenshot', 'badge_link', 'completion_email', 'other'],
    default: null
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  aiVerification: {
    verified: {
      type: Boolean,
      default: false
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    verificationData: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    notes: {
      type: String,
      default: null
    }
  },
  hrVerification: {
    verified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HR',
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['approved', 'rejected', 'needs_demonstration'],
      default: null
    }
  },
  skillImprovements: [{
    skillName: String,
    previousProficiency: Number,
    newProficiency: Number,
    improvement: Number
  }],
  readinessImpact: {
    previousScore: Number,
    newScore: Number,
    improvement: Number
  },
  feedback: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
courseProgressSchema.index({ employee: 1, status: 1 });
courseProgressSchema.index({ employee: 1, courseRecommendation: 1 });
courseProgressSchema.index({ 'aiVerification.verified': 1 });
courseProgressSchema.index({ 'hrVerification.verified': 1 });

module.exports = mongoose.model('CourseProgress', courseProgressSchema);
