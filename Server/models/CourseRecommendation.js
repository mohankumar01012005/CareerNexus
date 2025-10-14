
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    default: null
  },
  cost: {
    type: String,
    enum: ['Free', 'Paid'],
    required: true
  },
  keySkillsCovered: [String],
  link: {
    type: String,
    required: true
  },
  expectedReadinessGain: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  relevanceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  platform: {
    type: String,
    enum: ['Coursera', 'Udemy', 'LinkedIn Learning', 'edX', 'Google Cloud Skills', 'Pluralsight', 'Other'],
    default: 'Other'
  },
  category: {
    type: String,
    enum: ['Technical', 'Soft Skills', 'Leadership', 'Business', 'Design', 'Data', 'DevOps'],
    default: 'Technical'
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const courseRecommendationSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  aspirationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee.careerGoals'
  },
  targetRole: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    required: true
  },
  courses: [courseSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from generation
    }
  },
  totalCourses: {
    type: Number,
    default: 0
  },
  freeCourses: {
    type: Number,
    default: 0
  },
  paidCourses: {
    type: Number,
    default: 0
  },
  averageRelevanceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
courseRecommendationSchema.index({ employee: 1, status: 1 });
courseRecommendationSchema.index({ employee: 1, aspirationId: 1 });
courseRecommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('CourseRecommendation', courseRecommendationSchema);
