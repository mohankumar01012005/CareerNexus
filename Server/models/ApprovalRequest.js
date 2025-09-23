const mongoose = require('mongoose');

const approvalRequestSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mentor', 'role_change', 'training'],
    required: true
  },
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
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  
  // Mentor Request Specific Fields
  mentorRequest: {
    desiredMentor: String,
    duration: String,
    justification: String,
    careerGoals: [String]
  },
  
  // Role Change Specific Fields
  roleChangeRequest: {
    currentRole: String,
    targetRole: String,
    readinessScore: Number,
    managerApproval: Boolean,
    skillGaps: [String],
    proposedDate: Date
  },
  
  // Training Request Specific Fields
  trainingRequest: {
    courseName: String,
    provider: String,
    duration: String,
    cost: Number,
    businessJustification: String,
    expectedOutcomes: [String],
    budgetAllocated: Boolean
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HR'
  },
  reviewedAt: Date,
  comments: String
}, {
  timestamps: true
});

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);