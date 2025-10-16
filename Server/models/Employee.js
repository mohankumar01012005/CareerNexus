const mongoose = require("mongoose")

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  proficiency: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  category: {
    type: String,
    enum: ["Frontend", "Backend", "Leadership", "Business", "Design", "Data", "DevOps", "Soft Skills"],
    required: true,
  },
})

const careerGoalSchema = new mongoose.Schema({
  targetRole: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ["High", "Medium", "Low"],
    default: "Medium",
  },
  targetDate: Date,
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  skillsRequired: [String],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  reviewNotes: String
})

const completionProofSchema = new mongoose.Schema({
  file: { type: String }, // Supabase URL from frontend
  link: { type: String }, // Direct link from frontend
  submittedAt: { type: Date, default: Date.now }
})

const savedCourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  provider: { type: String, required: true },
  duration: { type: String, required: true },
  costType: { type: String, enum: ['Free', 'Paid'], required: true },
  skillsCovered: [{ type: String }],
  enrollLink: { type: String, required: true },
  savedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'pending_review'], 
    default: 'active' 
  },
  completionProof: completionProofSchema,
  // Additional course details from AI
  rating: { type: Number },
  level: { type: String },
  certificate: { type: Boolean },
  description: { type: String }
}, {
  timestamps: true
})

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      enum: ["Engineering", "Product", "Design", "Marketing", "Sales", "HR", "Finance", "Operations"],
    },
    role: {
      type: String,
      required: true,
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    avatar: String,
    skills: [skillSchema],
    careerGoals: [careerGoalSchema],
    careerReadinessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    tenure: {
      type: Number, // in months
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    achievements: [String],
    resume: String,
    resume_link: {
      type: String,
      trim: true,
    },
    resume_data: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    // New field for saved AI courses
    savedCourses: [savedCourseSchema]
  },
  {
    timestamps: true,
  },
)

// Calculate tenure before saving
employeeSchema.pre("save", function (next) {
  if (this.joiningDate) {
    const joinDate = new Date(this.joiningDate)
    const now = new Date()
    const months = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth())
    this.tenure = Math.max(0, months)
  }
  next()
})

// Ensure an employee can only save max 3 courses and prevent duplicates within savedCourses
savedCourseSchema.index({ employee: 1, title: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model("Employee", employeeSchema)