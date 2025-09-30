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

module.exports = mongoose.model("Employee", employeeSchema)
